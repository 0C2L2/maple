-- Checkpoint 8A: immutable Quick Pitches, not messages.
create table public.pitches (
 id uuid primary key default gen_random_uuid(),
 opportunity_id uuid not null references public.opportunities(id) on delete restrict,
 from_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
 note text check(note is null or char_length(note)<=300),
 created_at timestamptz not null default now(),
 unique(opportunity_id,from_id)
);
create index pitches_sender on public.pitches(from_id,created_at desc);
create function private.normalize_pitch_note() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 new.note:=nullif(regexp_replace(new.note,'^[[:space:]]+|[[:space:]]+$','','g'),'');
 return new;
end $$;
revoke all on function private.normalize_pitch_note() from public,anon,authenticated,service_role;
create trigger normalize_pitch_note before insert on public.pitches for each row execute function private.normalize_pitch_note();
alter table public.pitches enable row level security;
revoke all on public.pitches from public,anon,authenticated,service_role;
grant select on public.pitches to authenticated;
grant insert(opportunity_id,from_id,note) on public.pitches to authenticated;
create policy pitches_insert on public.pitches for insert to authenticated with check(
 from_id=(select auth.uid())
 and exists(
 select 1 from public.opportunities o join public.profiles p on p.id=(select auth.uid())
 where o.id=opportunity_id and o.status='published'
 and ((p.role='sponsor' and o.type='package' and exists(
   select 1 from public.events e where e.id=o.event_id and e.status='published'))
   or (p.role='organizer' and o.type='call'))
 and not exists(select 1 from public.organization_members m
   where m.org_id=o.owner_org_id and m.profile_id=(select auth.uid()))
 )
);
create policy pitches_read on public.pitches for select to authenticated using(
 from_id=(select auth.uid()) or exists(
 select 1 from public.opportunities o where o.id=opportunity_id and private.is_org_admin(o.owner_org_id)
 )
);
-- No UPDATE/DELETE grants or policies. No duplicate lookup: UNIQUE is authoritative.
