-- D-024: canonical threads; fixed sender and Opportunity-creator participants.
create table public.threads(
 id uuid primary key default gen_random_uuid(),
 pitch_id uuid not null unique references public.pitches(id) on delete restrict,
 opportunity_id uuid not null references public.opportunities(id) on delete restrict,
 from_id uuid not null references public.profiles(id) on delete restrict,
 owner_id uuid not null references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),
 matched_at timestamptz,
 check(from_id<>owner_id)
);
create index threads_sender on public.threads(from_id,created_at desc);
create index threads_owner on public.threads(owner_id,created_at desc);
create table public.thread_participants(
 thread_id uuid not null references public.threads(id) on delete restrict,
 profile_id uuid not null references public.profiles(id) on delete restrict,
 side text not null check(side in('sender','owner')),
 created_at timestamptz not null default now(),
 primary key(thread_id,profile_id),unique(thread_id,side)
);
create table public.messages(
 id uuid primary key default gen_random_uuid(),
 thread_id uuid not null references public.threads(id) on delete restrict,
 sender_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
 body text not null check(char_length(body) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index messages_thread_order on public.messages(thread_id,created_at desc,id desc);
alter table public.threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;
revoke all on public.threads,public.thread_participants,public.messages from public,anon,authenticated,service_role;
grant select on public.threads,public.thread_participants,public.messages to authenticated;
grant insert(pitch_id) on public.threads to authenticated;
grant insert(thread_id,profile_id,side) on public.thread_participants to authenticated;
grant insert(thread_id,sender_id,body) on public.messages to authenticated;
-- Invoker message triggers need UPDATE and row locking; the guard below computes
-- matched_at from persisted messages and ignores all client-supplied timestamps.
grant update(matched_at) on public.threads to authenticated;
create policy threads_read on public.threads for select to authenticated using(
 from_id=(select auth.uid()) or (owner_id=(select auth.uid()) and exists(
 select 1 from public.opportunities o where o.id=opportunity_id and private.is_org_admin(o.owner_org_id)))
);
create policy threads_insert on public.threads for insert to authenticated with check(from_id=(select auth.uid()));
create policy threads_update on public.threads for update to authenticated using(
 from_id=(select auth.uid()) or (owner_id=(select auth.uid()) and exists(
 select 1 from public.opportunities o where o.id=opportunity_id and private.is_org_admin(o.owner_org_id)))
) with check(from_id=(select auth.uid()) or owner_id=(select auth.uid()));
create policy participants_read on public.thread_participants for select to authenticated using(exists(select 1 from public.threads t where t.id=thread_id));
create policy participants_insert on public.thread_participants for insert to authenticated with check(exists(
 select 1 from public.threads t where t.id=thread_id and t.from_id=(select auth.uid())
 and ((side='sender' and profile_id=t.from_id) or (side='owner' and profile_id=t.owner_id))
));
create policy messages_read on public.messages for select to authenticated using(exists(
 select 1 from public.thread_participants p where p.thread_id=messages.thread_id and p.profile_id=(select auth.uid())
));
create policy messages_insert on public.messages for insert to authenticated with check(
 sender_id=(select auth.uid()) and exists(select 1 from public.thread_participants p where p.thread_id=messages.thread_id and p.profile_id=(select auth.uid()))
);
create function private.initialize_thread() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 select p.opportunity_id,p.from_id,o.created_by into new.opportunity_id,new.from_id,new.owner_id
 from public.pitches p join public.opportunities o on o.id=p.opportunity_id
 join public.profiles a on a.id=p.from_id join public.profiles b on b.id=o.created_by
 where p.id=new.pitch_id and p.from_id=auth.uid()
 and ((o.type='package' and a.role='sponsor' and b.role='organizer') or (o.type='call' and a.role='organizer' and b.role='sponsor'));
 if not found then raise exception 'Conversation unavailable' using errcode='42501'; end if;
 new.matched_at:=null;
 return new;
end $$;
create trigger initialize_thread before insert on public.threads for each row execute function private.initialize_thread();
create function private.initialize_thread_participants() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.thread_participants(thread_id,profile_id,side) values(new.id,new.from_id,'sender'),(new.id,new.owner_id,'owner');
 return new;
end $$;
create trigger initialize_thread_participants after insert on public.threads for each row execute function private.initialize_thread_participants();
create function private.guard_thread_match() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if row(new.id,new.pitch_id,new.opportunity_id,new.from_id,new.owner_id,new.created_at) is distinct from row(old.id,old.pitch_id,old.opportunity_id,old.from_id,old.owner_id,old.created_at) then
 raise exception 'Conversation identity is immutable' using errcode='23514'; end if;
 new.matched_at:=old.matched_at;
 if old.matched_at is null
 and exists(select 1 from public.messages m where m.thread_id=old.id and m.sender_id=old.from_id)
 and exists(select 1 from public.messages m where m.thread_id=old.id and m.sender_id=old.owner_id)
 then new.matched_at:=clock_timestamp(); end if;
 return new;
end $$;
create trigger guard_thread_match before update on public.threads for each row execute function private.guard_thread_match();
create function private.prepare_message() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 -- Serialize both sides before insertion, including concurrent first replies.
 perform 1 from public.threads t where t.id=new.thread_id for update;
 if not found then raise exception 'Conversation unavailable' using errcode='42501'; end if;
 new.body:=regexp_replace(new.body,'^[[:space:]]+|[[:space:]]+$','','g');
 return new;
end $$;
create trigger prepare_message before insert on public.messages for each row execute function private.prepare_message();
create function private.match_after_message() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 update public.threads set matched_at=matched_at where id=new.thread_id and matched_at is null;
 return new;
end $$;
create trigger match_after_message after insert on public.messages for each row execute function private.match_after_message();
create function public.get_or_create_thread(p_pitch_id uuid) returns uuid
language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
 select id into result from public.threads where pitch_id=p_pitch_id;
 if result is not null then return result; end if;
 insert into public.threads(pitch_id) values(p_pitch_id) on conflict(pitch_id) do nothing returning id into result;
 if result is null then select id into result from public.threads where pitch_id=p_pitch_id; end if;
 if result is null then raise exception 'Conversation unavailable' using errcode='42501'; end if;
 return result;
end $$;
revoke all on function private.initialize_thread(),private.initialize_thread_participants(),private.guard_thread_match(),private.prepare_message(),private.match_after_message() from public,anon,authenticated,service_role;
revoke all on function public.get_or_create_thread(uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_or_create_thread(uuid) to authenticated;
