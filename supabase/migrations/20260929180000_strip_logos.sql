-- The home page's "Organizations on Maple" logo strip, curated by staff in /admin → Logos. Member organizations
-- with a logo appear on their own (after the listed ones) until staff list, move, or hide them; staff can also add
-- partners that aren't on Maple. Only the functions below read or change the table.
create table public.strip_logos (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid unique references public.organizations (id) on delete cascade, -- a member; null for an added partner
  name       text check (char_length(btrim(name)) between 1 and 120),
  logo_url   text check (public.org_media_urls(array[logo_url])),
  link       text check (link ~ '^(https?://|/)' and char_length(link) <= 300),
  position   int not null default 0,
  hidden     boolean not null default false,
  created_at timestamptz not null default now(),
  check (org_id is not null or (name is not null and logo_url is not null))
);
alter table public.strip_logos enable row level security;
revoke all on public.strip_logos from anon, authenticated;

alter table public.admin_actions drop constraint admin_actions_action_check;
alter table public.admin_actions add constraint admin_actions_action_check
  check (action in ('suspend', 'unsuspend', 'delete_org', 'remove_post', 'restore_post', 'delete_post',
                    'remove_review', 'dismiss_report', 'broadcast', 'set_pilot', 'unset_pilot',
                    'add_logo', 'hide_logo', 'show_logo', 'delete_logo'));

-- For everyone: the visible logos in staff order, then members not listed yet (oldest first). Suspended members
-- and members without a logo are left out.
create function public.strip_logos()
returns table (key text, name text, logo_url text, href text, org_id uuid)
language sql stable security definer set search_path = '' as $$
  select key, name, logo_url, href, org_id from (
    select coalesce(o.handle, s.id::text) as key, coalesce(o.name, s.name) as name,
           coalesce(o.logo_url, s.logo_url) as logo_url,
           coalesce(s.link, '/org/' || o.handle) as href, s.org_id, 0 as grp, s.position as pos, s.created_at
      from public.strip_logos s
      left join public.organizations o on o.id = s.org_id
     where not s.hidden and coalesce(o.logo_url, s.logo_url) is not null
       and (s.org_id is null or not public.is_suspended(s.org_id))
    union all
    select o.handle, o.name, o.logo_url, '/org/' || o.handle, o.id, 1, 0, o.created_at
      from public.organizations o
     where o.logo_url is not null and not public.is_suspended(o.id)
       and not exists (select 1 from public.strip_logos s where s.org_id = o.id)
  ) l
  order by grp, pos, created_at
$$;

-- Staff list, hidden logos included. Members with a logo that aren't listed yet are listed at the end first, so
-- staff can move or hide them.
create function public.admin_strip_logos()
returns table (id uuid, org_handle text, name text, logo_url text, link text, hidden boolean, member boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not public.is_staff() then return; end if;
  insert into public.strip_logos (org_id, position)
  select o.id, coalesce((select max(s.position) from public.strip_logos s), 0) + row_number() over (order by o.created_at)
    from public.organizations o
   where o.logo_url is not null and not exists (select 1 from public.strip_logos s where s.org_id = o.id);
  return query
  select s.id, o.handle, coalesce(o.name, s.name), coalesce(o.logo_url, s.logo_url), s.link, s.hidden, s.org_id is not null
    from public.strip_logos s
    left join public.organizations o on o.id = s.org_id
   order by s.position, s.created_at;
end $$;

create function public.admin_add_logo(name text, logo_url text, link text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  n text := nullif(btrim(coalesce(admin_add_logo.name, '')), '');
  l text := nullif(btrim(coalesce(admin_add_logo.link, '')), '');
  new_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  if n is null then raise exception 'Enter the organization''s name' using errcode = '22004'; end if;
  if admin_add_logo.logo_url is null then raise exception 'Upload a logo' using errcode = '22004'; end if;
  if l is not null and l !~ '^(https?://|/)' then l := 'https://' || l; end if;
  insert into public.strip_logos (name, logo_url, link, position)
  values (n, admin_add_logo.logo_url, l, coalesce((select max(s.position) from public.strip_logos s), 0) + 1)
  returning id into new_id;
  insert into public.admin_actions (staff_id, action, target_id, target_label) values (auth.uid(), 'add_logo', new_id, n);
  return new_id;
end $$;

create function public.admin_set_logo_hidden(logo uuid, hide boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  label text;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  update public.strip_logos s set hidden = hide where s.id = logo;
  select coalesce(o.name, s.name) into label
    from public.strip_logos s left join public.organizations o on o.id = s.org_id where s.id = logo;
  insert into public.admin_actions (staff_id, action, target_id, target_label)
  values (auth.uid(), case when hide then 'hide_logo' else 'show_logo' end, logo, label);
end $$;

-- step -1 moves a logo one place earlier in the strip, 1 one place later.
create function public.admin_move_logo(logo uuid, step int) returns void
language plpgsql security definer set search_path = '' as $$
declare
  cur public.strip_logos;
  nb  public.strip_logos;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  select * into cur from public.strip_logos s where s.id = logo;
  if step < 0 then
    select * into nb from public.strip_logos s where (s.position, s.created_at) < (cur.position, cur.created_at)
     order by s.position desc, s.created_at desc limit 1;
  else
    select * into nb from public.strip_logos s where (s.position, s.created_at) > (cur.position, cur.created_at)
     order by s.position, s.created_at limit 1;
  end if;
  if nb.id is null then return; end if;
  update public.strip_logos s set position = nb.position where s.id = cur.id;
  update public.strip_logos s set position = cur.position where s.id = nb.id;
end $$;

-- Only added partners can be deleted; a member would come back on its own, so members are hidden instead.
create function public.admin_delete_logo(logo uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  label text;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  delete from public.strip_logos s where s.id = logo and s.org_id is null returning s.name into label;
  if label is null then raise exception 'Only added partners can be deleted; hide a member instead' using errcode = '22023'; end if;
  insert into public.admin_actions (staff_id, action, target_id, target_label) values (auth.uid(), 'delete_logo', logo, label);
end $$;
