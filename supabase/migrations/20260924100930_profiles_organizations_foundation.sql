-- Checkpoint 2: base identity and organizations only.
-- Explicit grants apply even on Supabase installations with permissive defaults.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.profile_role as enum ('organizer', 'sponsor');
create type public.organization_member_role as enum ('admin', 'member');
create type public.organization_type as enum ('event_company', 'brand', 'agency', 'university_club');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.profile_role not null,
  handle text not null unique check (handle ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  headline text check (char_length(headline) <= 200),
  bio text check (char_length(bio) <= 5000),
  photo_url text,
  location text,
  categories text[] not null default '{}',
  regions text[] not null default '{}',
  audience_types text[] not null default '{}',
  audience_band text,
  gives text[] not null default '{}',
  completeness smallint not null default 0 check (completeness between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,63}$'),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  type public.organization_type not null,
  domain text check (domain = lower(domain) and domain = btrim(domain) and char_length(domain) between 1 and 253),
  logo_url text,
  cover_url text,
  about text check (char_length(about) <= 5000),
  website text,
  verified boolean not null default false,
  -- Creator deletion needs a future ownership/account-deletion contract.
  -- RESTRICT preserves the required creator/admin relationship for now.
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index organizations_created_by_idx on public.organizations(created_by);

create table public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_member_role not null,
  verified_email boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (org_id, profile_id)
);
-- The composite PK already indexes org_id; this supports reverse membership lookup/FK deletion.
create index organization_members_profile_id_idx on public.organization_members(profile_id);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role = 'admin'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.user_roles enable row level security;

revoke all on public.profiles, public.organizations, public.organization_members, public.user_roles
  from public, anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant usage on type public.profile_role, public.organization_type, public.organization_member_role
  to anon, authenticated, service_role;

grant select on public.profiles, public.organizations to anon, authenticated;
-- No table-level INSERT/UPDATE grant: protected columns are deliberately omitted.
grant insert (id, role, handle, name, headline, bio, photo_url, location, categories, regions, audience_types, audience_band, gives)
  on public.profiles to authenticated;
grant update (handle, name, headline, bio, photo_url, location, categories, regions, audience_types, audience_band, gives)
  on public.profiles to authenticated;
grant insert (id, slug, name, type, domain, logo_url, cover_url, about, website, created_by)
  on public.organizations to authenticated;
grant update (slug, name, type, domain, logo_url, cover_url, about, website)
  on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
-- Operational roles and all membership mutations remain inaccessible to clients.
-- Preserve legitimate backend operations explicitly; service_role bypasses RLS, not grants.
grant select, insert, update, delete on public.profiles, public.organizations, public.organization_members, public.user_roles
  to service_role;

create function private.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public, anon, authenticated, service_role;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger organizations_updated_at before update on public.organizations
  for each row execute function private.touch_updated_at();

create function private.clear_domain_verification()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.domain is distinct from old.domain then
    new.verified := false;
  end if;
  return new;
end;
$$;
revoke all on function private.clear_domain_verification() from public, anon, authenticated, service_role;
create trigger organizations_domain_verification before update on public.organizations
  for each row execute function private.clear_domain_verification();

create function private.add_organization_creator()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.organization_members (org_id, profile_id, role)
    values (new.id, new.created_by, 'admin'::public.organization_member_role);
  return new;
end;
$$;
revoke all on function private.add_organization_creator() from public, anon, authenticated, service_role;
create trigger organizations_creator_admin after insert on public.organizations
  for each row execute function private.add_organization_creator();

-- This lookup needs no privilege elevation: members can read their own membership.
-- Its membership policy checks auth.uid() directly and never queries organizations.
create function private.is_org_admin(target_org uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from public.organization_members as membership
    where membership.org_id = target_org
      and membership.profile_id = (select auth.uid())
      and membership.role = 'admin'::public.organization_member_role
  );
$$;
revoke all on function private.is_org_admin(uuid) from public, anon, authenticated, service_role;
grant execute on function private.is_org_admin(uuid) to authenticated;

create policy profiles_public_read on public.profiles for select to anon, authenticated using (true);
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy organizations_public_read on public.organizations for select to anon, authenticated using (true);
create policy organizations_insert_own on public.organizations for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy organizations_update_admin on public.organizations for update to authenticated
  using (private.is_org_admin(id)) with check (private.is_org_admin(id));
create policy organization_members_read_own on public.organization_members for select to authenticated
  using (profile_id = (select auth.uid()));
-- No DELETE policies. No membership write policies. No policies on user_roles.
