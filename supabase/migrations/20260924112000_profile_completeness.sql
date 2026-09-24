-- Checkpoint 4: column grants already protect role and completeness.
-- No previous completeness trigger exists. The timestamp trigger stays independent.
-- Score: role 10, name 15, handle 15, headline 15, bio 10, location 10,
-- at least one nonblank category 10, region 10, role-specific preferences 5.
-- Preferences require audience types AND (organizer audience band OR sponsor gives).
create function private.calculate_profile_completeness()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.completeness :=
    case when new.role is not null then 10 else 0 end
    + case when nullif(btrim(new.name), '') is not null then 15 else 0 end
    + case when nullif(btrim(new.handle), '') is not null then 15 else 0 end
    + case when nullif(btrim(new.headline), '') is not null then 15 else 0 end
    + case when nullif(btrim(new.bio), '') is not null then 10 else 0 end
    + case when nullif(btrim(new.location), '') is not null then 10 else 0 end
    + case when exists (select 1 from unnest(new.categories) as x(value) where nullif(btrim(x.value), '') is not null) then 10 else 0 end
    + case when exists (select 1 from unnest(new.regions) as x(value) where nullif(btrim(x.value), '') is not null) then 10 else 0 end
    + case when exists (select 1 from unnest(new.audience_types) as x(value) where nullif(btrim(x.value), '') is not null)
      and ((new.role = 'organizer'::public.profile_role and nullif(btrim(new.audience_band), '') is not null)
        or (new.role = 'sponsor'::public.profile_role and exists (select 1 from unnest(new.gives) as x(value) where nullif(btrim(x.value), '') is not null)))
      then 5 else 0 end;
  return new;
end;
$$;
revoke all on function private.calculate_profile_completeness() from public, anon, authenticated, service_role;
create trigger profiles_completeness before insert or update on public.profiles
  for each row execute function private.calculate_profile_completeness();
-- Recalculate existing rows without changing their other data or timestamps.
alter table public.profiles disable trigger profiles_updated_at;
update public.profiles set completeness = completeness;
alter table public.profiles enable trigger profiles_updated_at;
