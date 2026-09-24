-- Checkpoint 5 security patch: preserve organization URLs after creation.
-- Existing UPDATE privileges are column-scoped; keep all other edits intact.
revoke update (slug) on public.organizations from authenticated;

create function private.prevent_organization_slug_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'Organization slug cannot be changed after creation.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.prevent_organization_slug_change()
  from public, anon, authenticated, service_role;

-- Also enforces immutability if a privileged writer or future grant permits UPDATE.
create trigger organizations_slug_immutable before update of slug on public.organizations
  for each row execute function private.prevent_organization_slug_change();
