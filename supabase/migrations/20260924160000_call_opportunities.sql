-- Checkpoint 7B: optional private budget bands, aligned with D-012 and D-022.
alter table public.opportunities add column owner_org_id uuid references public.organizations(id) on delete restrict;
update public.opportunities o set owner_org_id=e.org_id from public.events e where o.event_id=e.id and o.type='package';
alter table public.opportunities alter column owner_org_id set not null;
alter table public.opportunities add constraint call_without_event check(type<>'call' or event_id is null);
create unique index opportunities_call_slug on public.opportunities(owner_org_id,slug) where type='call';
create index opportunities_owner on public.opportunities(owner_org_id);
create function private.opportunity_owner() returns trigger language plpgsql security invoker set search_path='' as $$
declare expected uuid;
begin
 if TG_OP='UPDATE' and new.owner_org_id is distinct from old.owner_org_id then raise exception 'Owner organization is immutable' using errcode='23514'; end if;
 if new.type='package' then
 select org_id into expected from public.events where id=new.event_id;
 if expected is not null then
 if new.owner_org_id is not null and new.owner_org_id<>expected then raise exception 'Package owner must match Event' using errcode='23514'; end if;
 new.owner_org_id:=expected;
 end if;
 end if;
 return new;
end $$;
create trigger opportunity_owner before insert or update on public.opportunities for each row execute function private.opportunity_owner();
create function private.can_manage_calls(target_org uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select private.is_org_admin(target_org) and exists(select 1 from public.profiles where id=(select auth.uid()) and role='sponsor');
$$;
revoke all on function private.opportunity_owner(),private.can_manage_calls(uuid) from public,anon,authenticated,service_role;
grant execute on function private.can_manage_calls(uuid) to authenticated;
grant insert(owner_org_id) on public.opportunities to authenticated;
create policy call_public on public.opportunities for select to anon,authenticated using(type='call' and status='published');
create policy call_admin on public.opportunities for select to authenticated using(type='call' and private.can_manage_calls(owner_org_id));
create policy call_insert on public.opportunities for insert to authenticated with check(type='call' and event_id is null and status='draft' and created_by=(select auth.uid()) and private.can_manage_calls(owner_org_id));
create policy call_update on public.opportunities for update to authenticated using(type='call' and private.can_manage_calls(owner_org_id)) with check(type='call' and private.can_manage_calls(owner_org_id));
create function private.valid_call_choices(items text[],allowed text[]) returns boolean language sql immutable security invoker set search_path='' as $$
 select cardinality(items) between 1 and cardinality(allowed) and array_ndims(items)=1 and array_position(items,null) is null and items<@allowed;
$$;
create table public.opportunity_call_details(
 opportunity_id uuid primary key references public.opportunities(id) on delete cascade,
 target_categories text[] not null check(private.valid_call_choices(target_categories,array['hackathon','conference','meetup','workshop','festival'])),
 target_regions text[] not null check(private.valid_call_choices(target_regions,array['africa','asia','europe','north-america','south-america','oceania','online'])),
 target_audience_types text[] not null check(private.valid_call_choices(target_audience_types,array['developers','students','founders','designers','marketers'])),
 target_attendance_bands text[] not null check(private.valid_call_choices(target_attendance_bands,array['under-50','50-199','200-999','1000-plus'])),
 gives text[] not null default '{}' check(array_ndims(gives) is null or (array_ndims(gives)=1 and cardinality(gives)<=8 and array_position(gives,null) is null and gives<@array['cash','product','credits','swag','venue','speakers','mentors','prizes']::text[])),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.opportunity_call_budgets(
 opportunity_id uuid primary key references public.opportunities(id) on delete cascade,
 budget_band text not null check(budget_band in ('under_1k','1k_5k','5k_25k','25k_plus')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
revoke all on function private.valid_call_choices(text[],text[]) from public,anon,authenticated,service_role;
grant execute on function private.valid_call_choices(text[],text[]) to authenticated,service_role;

alter table public.opportunity_call_details enable row level security;
revoke all on public.opportunity_call_details from public,anon,authenticated,service_role;
grant select on public.opportunity_call_details to authenticated;
grant insert(opportunity_id,target_categories,target_regions,target_audience_types,target_attendance_bands,gives) on public.opportunity_call_details to authenticated;
grant update(target_categories,target_regions,target_audience_types,target_attendance_bands,gives) on public.opportunity_call_details to authenticated;
grant all on public.opportunity_call_details to service_role;
create policy opportunity_call_details_insert on public.opportunity_call_details for insert to authenticated with check(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='call' and private.can_manage_calls(o.owner_org_id)));
create policy opportunity_call_details_update on public.opportunity_call_details for update to authenticated using(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='call' and private.can_manage_calls(o.owner_org_id))) with check(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='call' and private.can_manage_calls(o.owner_org_id)));
create trigger opportunity_call_details_touch before update on public.opportunity_call_details for each row execute function private.touch_updated_at();

alter table public.opportunity_call_budgets enable row level security;
revoke all on public.opportunity_call_budgets from public,anon,authenticated,service_role;
grant select on public.opportunity_call_budgets to authenticated;
grant insert(opportunity_id,budget_band) on public.opportunity_call_budgets to authenticated;
grant update(budget_band) on public.opportunity_call_budgets to authenticated;
grant all on public.opportunity_call_budgets to service_role;
create policy opportunity_call_budgets_insert on public.opportunity_call_budgets for insert to authenticated with check(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='call' and private.can_manage_calls(o.owner_org_id)));
create policy opportunity_call_budgets_update on public.opportunity_call_budgets for update to authenticated using(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='call' and private.can_manage_calls(o.owner_org_id))) with check(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='call' and private.can_manage_calls(o.owner_org_id)));
create trigger opportunity_call_budgets_touch before update on public.opportunity_call_budgets for each row execute function private.touch_updated_at();

grant select on public.opportunity_call_details to anon;
create policy call_details_read on public.opportunity_call_details for select to anon,authenticated using(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='call' and o.status='published'));
create policy call_details_admin on public.opportunity_call_details for select to authenticated using(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='call' and private.can_manage_calls(o.owner_org_id)));
create policy call_budget_read on public.opportunity_call_budgets for select to authenticated using(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='call' and private.can_manage_calls(o.owner_org_id)));
grant delete on public.opportunity_call_budgets to authenticated;
create policy call_budget_delete on public.opportunity_call_budgets for delete to authenticated using(exists(select 1 from public.opportunities o where o.id=opportunity_id and o.type='call' and private.can_manage_calls(o.owner_org_id)));
create function private.call_child_integrity() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' and row(new.opportunity_id,new.created_at) is distinct from row(old.opportunity_id,old.created_at) then raise exception 'Call child identity is immutable' using errcode='23514'; end if;
 perform 1 from public.opportunities where id=new.opportunity_id and type='call' for update;
 if not found then raise exception 'Call data requires a Call' using errcode='23514'; end if;
 return new;
end $$;
create trigger call_details_integrity before insert or update on public.opportunity_call_details for each row execute function private.call_child_integrity();
create trigger call_budget_integrity before insert or update on public.opportunity_call_budgets for each row execute function private.call_child_integrity();
create function private.call_requires_details() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.type='call' and exists(select 1 from public.opportunities where id=new.id)
 and not exists(select 1 from public.opportunity_call_details where opportunity_id=new.id) then raise exception 'Call details are required' using errcode='23514'; end if;
 return null;
end $$;
create constraint trigger call_requires_details after insert or update on public.opportunities deferrable initially deferred for each row execute function private.call_requires_details();
create function public.create_call_opportunity(p_org_id uuid,p_title text,p_slug text,p_description text,p_details jsonb,p_budget_band text default null)
returns public.opportunities language plpgsql security invoker set search_path='' as $$
declare result public.opportunities;
begin
 if not private.can_manage_calls(p_org_id) then raise exception 'Not authorized' using errcode='42501'; end if;
 insert into public.opportunities(type,owner_org_id,title,slug,description) values('call',p_org_id,btrim(p_title),p_slug,p_description) returning * into result;
 insert into public.opportunity_call_details(opportunity_id,target_categories,target_regions,target_audience_types,target_attendance_bands,gives)
 values(result.id,array(select jsonb_array_elements_text(p_details->'target_categories')),array(select jsonb_array_elements_text(p_details->'target_regions')),array(select jsonb_array_elements_text(p_details->'target_audience_types')),array(select jsonb_array_elements_text(p_details->'target_attendance_bands')),array(select jsonb_array_elements_text(p_details->'gives')));
 if p_budget_band is not null then
 insert into public.opportunity_call_budgets(opportunity_id,budget_band)
 values(result.id,p_budget_band);
 end if;
 return result;
end $$;
create function public.update_call_opportunity(p_id uuid,p_title text,p_description text,p_details jsonb,p_budget_band text default null)
returns public.opportunities language plpgsql security invoker set search_path='' as $$
declare result public.opportunities;
begin
 select * into result from public.opportunities where id=p_id and type='call' for update;
 if not found or not private.can_manage_calls(result.owner_org_id) then raise exception 'Not authorized' using errcode='42501'; end if;
 update public.opportunities set title=btrim(p_title),description=p_description where id=p_id returning * into result;
 update public.opportunity_call_details set target_categories=array(select jsonb_array_elements_text(p_details->'target_categories')),target_regions=array(select jsonb_array_elements_text(p_details->'target_regions')),target_audience_types=array(select jsonb_array_elements_text(p_details->'target_audience_types')),target_attendance_bands=array(select jsonb_array_elements_text(p_details->'target_attendance_bands')),gives=array(select jsonb_array_elements_text(p_details->'gives')) where opportunity_id=p_id;
 if not found then raise exception 'Call details missing' using errcode='23514'; end if;
 -- Delete/insert the optional private row inside the same transaction; identity is the opportunity ID.
 delete from public.opportunity_call_budgets where opportunity_id=p_id;
 if p_budget_band is not null then
 insert into public.opportunity_call_budgets(opportunity_id,budget_band)
 values(p_id,p_budget_band);
 end if;
 return result;
end $$;
revoke all on function private.call_child_integrity(),private.call_requires_details() from public,anon,authenticated,service_role;
revoke all on function public.create_call_opportunity(uuid,text,text,text,jsonb,text),public.update_call_opportunity(uuid,text,text,jsonb,text) from public,anon,authenticated,service_role;
grant execute on function public.create_call_opportunity(uuid,text,text,text,jsonb,text),public.update_call_opportunity(uuid,text,text,jsonb,text) to authenticated;
