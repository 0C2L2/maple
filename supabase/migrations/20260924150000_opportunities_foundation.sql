-- Checkpoint 7A: shared identity, package behavior only.
create type public.opportunity_type as enum ('package','call');
create type public.opportunity_status as enum ('draft','published');
create table public.opportunities (
 id uuid primary key default gen_random_uuid(),
 type public.opportunity_type not null default 'package',
 event_id uuid references public.events(id) on delete restrict,
 created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
 title text not null check(title=btrim(title) and char_length(title) between 1 and 160),
 slug text not null check(char_length(slug) between 3 and 64 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 description text check(char_length(description)<=10000),
 status public.opportunity_status not null default 'draft',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(type<>'package' or event_id is not null)
);
create unique index opportunities_event_slug on public.opportunities(event_id,slug) where type='package';
create index opportunities_creator on public.opportunities(created_by);
create function private.valid_tier_benefits(items text[]) returns boolean language sql immutable security invoker set search_path='' as $$
 select cardinality(items) between 1 and 30 and array_ndims(items)=1 and not exists(select 1 from unnest(items) x where x is null or char_length(btrim(x)) not between 1 and 500);
$$;
create table public.opportunity_tiers (
 id uuid primary key default gen_random_uuid(),
 opportunity_id uuid not null references public.opportunities(id) on delete cascade,
 name text not null check(name=btrim(name) and char_length(name) between 1 and 120),
 price_minor bigint,
 currency text check(currency ~ '^[A-Z]{3}$'),
 in_kind boolean not null default false,
 benefits text[] not null check(private.valid_tier_benefits(benefits)),
 slots integer check(slots>0),
 sort_order integer not null default 0 check(sort_order>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check((in_kind and price_minor is null and currency is null) or
 (not in_kind and price_minor is not null and price_minor>0 and price_minor<=9007199254740991 and currency is not null))
);
create index opportunity_tiers_parent on public.opportunity_tiers(opportunity_id,sort_order,id);
create function private.can_manage_package(target_event uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.events e where e.id=target_event and private.can_manage_events(e.org_id));
$$;
alter table public.opportunities enable row level security;
alter table public.opportunity_tiers enable row level security;
revoke all on public.opportunities,public.opportunity_tiers from public,anon,authenticated,service_role;
grant select on public.opportunities,public.opportunity_tiers to anon,authenticated;
grant insert(type,event_id,title,slug,description) on public.opportunities to authenticated;
grant update(title,description,status) on public.opportunities to authenticated;
grant insert(opportunity_id,name,price_minor,currency,in_kind,benefits,slots,sort_order) on public.opportunity_tiers to authenticated;
grant update(name,price_minor,currency,in_kind,benefits,slots,sort_order) on public.opportunity_tiers to authenticated;
grant delete on public.opportunity_tiers to authenticated;
grant all on public.opportunities,public.opportunity_tiers to service_role;
grant usage on type public.opportunity_type,public.opportunity_status to anon,authenticated,service_role;
revoke all on function private.can_manage_package(uuid),private.valid_tier_benefits(text[]) from public,anon,authenticated,service_role;
grant execute on function private.can_manage_package(uuid),private.valid_tier_benefits(text[]) to authenticated;
grant execute on function private.valid_tier_benefits(text[]) to service_role;
create policy opportunity_public on public.opportunities for select to anon,authenticated using(type='package' and status='published' and exists(select 1 from public.events e where e.id=event_id and e.status='published'));
create policy opportunity_admin on public.opportunities for select to authenticated using(type='package' and private.can_manage_package(event_id));
create policy opportunity_insert on public.opportunities for insert to authenticated with check(type='package' and status='draft' and created_by=(select auth.uid()) and private.can_manage_package(event_id));
create policy opportunity_update on public.opportunities for update to authenticated using(type='package' and private.can_manage_package(event_id)) with check(type='package' and private.can_manage_package(event_id));
create policy tier_read on public.opportunity_tiers for select to anon,authenticated using(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='package'));
create policy tier_insert on public.opportunity_tiers for insert to authenticated with check(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='package' and private.can_manage_package(o.event_id)));
create policy tier_update on public.opportunity_tiers for update to authenticated using(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='package' and private.can_manage_package(o.event_id))) with check(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='package' and private.can_manage_package(o.event_id)));
create policy tier_delete on public.opportunity_tiers for delete to authenticated using(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='package' and private.can_manage_package(o.event_id)));
create function private.opportunity_identity() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if row(new.id,new.type,new.event_id,new.created_by,new.slug,new.created_at) is distinct from row(old.id,old.type,old.event_id,old.created_by,old.slug,old.created_at) then
 raise exception 'Opportunity identity is immutable' using errcode='23514'; end if;
 return new;
end $$;
create trigger opportunity_identity before update on public.opportunities for each row execute function private.opportunity_identity();
create trigger opportunity_touch before update on public.opportunities for each row execute function private.touch_updated_at();
create function private.tier_integrity() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' and row(new.id,new.opportunity_id,new.created_at) is distinct from row(old.id,old.opportunity_id,old.created_at) then
 raise exception 'Tier identity is immutable' using errcode='23514'; end if;
 -- Serialize tier writes with publication and other edits.
 perform 1 from public.opportunities where id=new.opportunity_id and type='package' for update;
 if not found then raise exception 'Tiers require a package opportunity' using errcode='23514'; end if;
 return new;
end $$;
create trigger tier_integrity before insert or update on public.opportunity_tiers for each row execute function private.tier_integrity();
create trigger tier_touch before update on public.opportunity_tiers for each row execute function private.touch_updated_at();
create function private.lock_tier_parent() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.opportunities where id=old.opportunity_id for update;
 return old;
end $$;
create trigger tier_delete_lock before delete on public.opportunity_tiers for each row execute function private.lock_tier_parent();
-- Deferred invariant permits an atomic replacement while rejecting the last-tier deletion.
create function private.package_requires_tier() returns trigger language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
 if TG_TABLE_NAME='opportunities' then target:=new.id; else target:=old.opportunity_id; end if;
 if exists(select 1 from public.opportunities where id=target and type='package' and status='published')
 and not exists(select 1 from public.opportunity_tiers where opportunity_id=target) then
 raise exception 'Published opportunities require a tier' using errcode='23514'; end if;
 return null;
end $$;
create constraint trigger opportunity_requires_tier after insert or update on public.opportunities deferrable initially deferred for each row execute function private.package_requires_tier();
create constraint trigger tier_removal_requires_tier after delete on public.opportunity_tiers deferrable initially deferred for each row execute function private.package_requires_tier();
create function public.create_package_opportunity(p_event_id uuid,p_title text,p_slug text,p_description text,p_tiers jsonb)
returns public.opportunities language plpgsql security invoker set search_path='' as $$
declare result public.opportunities; item jsonb; position integer:=0;
begin
 if not private.can_manage_package(p_event_id) then raise exception 'Not authorized' using errcode='42501'; end if;
 if jsonb_typeof(p_tiers) is distinct from 'array' or jsonb_array_length(p_tiers) not between 1 and 20 then raise exception 'Provide 1 to 20 tiers' using errcode='23514'; end if;
 insert into public.opportunities(event_id,title,slug,description) values(p_event_id,btrim(p_title),p_slug,p_description) returning * into result;
 for item in select value from jsonb_array_elements(p_tiers) loop
 insert into public.opportunity_tiers(opportunity_id,name,price_minor,currency,in_kind,benefits,slots,sort_order)
 values(result.id,btrim(item->>'name'),(item->>'price_minor')::bigint,item->>'currency',(item->>'in_kind')::boolean,array(select jsonb_array_elements_text(item->'benefits')),(item->>'slots')::integer,position);
 position:=position+1;
 end loop;
 return result;
end $$;
create function public.update_package_opportunity(p_id uuid,p_title text,p_description text,p_tiers jsonb)
returns public.opportunities language plpgsql security invoker set search_path='' as $$
declare result public.opportunities; item jsonb; tier_id uuid; kept uuid[]:=array[]::uuid[]; position integer:=0;
begin
 select * into result from public.opportunities where id=p_id and type='package' for update;
 if not found or not private.can_manage_package(result.event_id) then raise exception 'Not authorized' using errcode='42501'; end if;
 if jsonb_typeof(p_tiers) is distinct from 'array' or jsonb_array_length(p_tiers) not between 1 and 20 then raise exception 'Provide 1 to 20 tiers' using errcode='23514'; end if;
 update public.opportunities set title=btrim(p_title),description=p_description where id=p_id returning * into result;
 for item in select value from jsonb_array_elements(p_tiers) loop
 tier_id:=(item->>'id')::uuid;
 if tier_id is null then
 insert into public.opportunity_tiers(opportunity_id,name,price_minor,currency,in_kind,benefits,slots,sort_order)
 values(p_id,btrim(item->>'name'),(item->>'price_minor')::bigint,item->>'currency',(item->>'in_kind')::boolean,array(select jsonb_array_elements_text(item->'benefits')),(item->>'slots')::integer,position) returning id into tier_id;
 else
 if tier_id=any(kept) then raise exception 'Duplicate tier' using errcode='23514'; end if;
 update public.opportunity_tiers set name=btrim(item->>'name'),price_minor=(item->>'price_minor')::bigint,currency=item->>'currency',in_kind=(item->>'in_kind')::boolean,benefits=array(select jsonb_array_elements_text(item->'benefits')),slots=(item->>'slots')::integer,sort_order=position where id=tier_id and opportunity_id=p_id;
 if not found then raise exception 'Invalid tier identity' using errcode='42501'; end if;
 end if;
 kept:=array_append(kept,tier_id); position:=position+1;
 end loop;
 delete from public.opportunity_tiers where opportunity_id=p_id and not(id=any(kept));
 return result;
end $$;
revoke all on function private.opportunity_identity(),private.tier_integrity(),private.lock_tier_parent(),private.package_requires_tier() from public,anon,authenticated,service_role;
revoke all on function public.create_package_opportunity(uuid,text,text,text,jsonb),public.update_package_opportunity(uuid,text,text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.create_package_opportunity(uuid,text,text,text,jsonb),public.update_package_opportunity(uuid,text,text,jsonb) to authenticated;
