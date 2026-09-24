-- Checkpoint 6: organizations own events; creator is immutable provenance.
create type public.event_status as enum ('draft', 'published');
create type public.event_format as enum ('in_person', 'online', 'hybrid');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 160),
  slug text not null unique check (char_length(slug) between 3 and 64 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 10000),
  status public.event_status not null default 'draft',
  format public.event_format not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  venue_name text check (char_length(venue_name) <= 200),
  city text check (char_length(city) <= 120),
  country text check (char_length(country) <= 120),
  website text,
  -- Same vocabulary as client/src/constants/taxonomy.ts (Checkpoint 4).
  categories text[] not null check (
    cardinality(categories) between 1 and 5 and array_ndims(categories) = 1
    and array_position(categories,null) is null
    and categories <@ array['hackathon','conference','meetup','workshop','festival']::text[]),
  audience_types text[] not null check (
    cardinality(audience_types) between 1 and 5 and array_ndims(audience_types) = 1
    and array_position(audience_types,null) is null
    and audience_types <@ array['developers','students','founders','designers','marketers']::text[]),
  attendance_band text not null check (attendance_band in ('under-50','50-199','200-999','1000-plus')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_date_order check (isfinite(starts_at) and isfinite(ends_at) and ends_at > starts_at),
  constraint events_location check (format = 'online' or (
    nullif(btrim(city),'') is not null and nullif(btrim(country),'') is not null)),
  constraint events_website_safe check (website is null or (
    website ~ '^https?://([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
    and website !~ '[[:cntrl:]\\]'))
);
create index events_org_starts_idx on public.events(org_id, starts_at);
create index events_created_by_idx on public.events(created_by);
alter table public.events enable row level security;
revoke all on public.events from public, anon, authenticated, service_role;
grant usage on type public.event_status, public.event_format to anon, authenticated, service_role;
grant select on public.events to anon, authenticated;
grant insert (org_id,title,slug,description,format,starts_at,ends_at,timezone,venue_name,city,country,website,categories,audience_types,attendance_band)
  on public.events to authenticated;
grant update (title,description,status,format,starts_at,ends_at,timezone,venue_name,city,country,website,categories,audience_types,attendance_band)
  on public.events to authenticated;
grant select, insert, update, delete on public.events to service_role;

-- Invoker suffices: profiles are readable and is_org_admin reads own membership.
create function private.can_manage_events(target_org uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_org_admin(target_org) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer'
  );
$$;
revoke all on function private.can_manage_events(uuid) from public, anon, authenticated, service_role;
grant execute on function private.can_manage_events(uuid) to authenticated;

create policy events_published_read on public.events for select to anon, authenticated using (status = 'published');
create policy events_admin_read on public.events for select to authenticated using (private.can_manage_events(org_id));
create policy events_insert_admin on public.events for insert to authenticated
  with check (private.can_manage_events(org_id) and created_by = (select auth.uid()) and status = 'draft');
create policy events_update_admin on public.events for update to authenticated
  using (private.can_manage_events(org_id)) with check (private.can_manage_events(org_id));

-- No elevation needed: the timezone catalog is readable by ordinary roles.
create function private.validate_event_timezone()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Choose a recognized event timezone.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_event_timezone() from public, anon, authenticated, service_role;
create trigger events_timezone before insert or update of timezone on public.events
  for each row execute function private.validate_event_timezone();
create trigger events_updated_at before update on public.events
  for each row execute function private.touch_updated_at();

create function private.prevent_event_identity_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.org_id is distinct from old.org_id
    or new.created_by is distinct from old.created_by or new.slug is distinct from old.slug
    or new.created_at is distinct from old.created_at then
    raise exception 'Event identity cannot be changed after creation.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.prevent_event_identity_change() from public, anon, authenticated, service_role;
create trigger events_identity before update on public.events
  for each row execute function private.prevent_event_identity_change();
