-- The announcement bar above the home page hero, edited by staff in /admin → Banner. The visible announcements
-- rotate in staff order. Only the functions below read or change the table.
create table public.announcements (
  id         uuid primary key default gen_random_uuid(),
  badge      text check (char_length(btrim(badge)) between 1 and 12),        -- e.g. NEW; optional
  message    text not null check (char_length(btrim(message)) between 1 and 90),
  link_label text check (char_length(btrim(link_label)) between 1 and 40),
  link_url   text check (link_url ~ '^(https?://|/)' and char_length(link_url) <= 300),
  position   int not null default 0,
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;

insert into public.announcements (badge, message, link_label, link_url, position)
values ('NEW', 'Meet the founder: connect with Rashid on LinkedIn', 'Connect on LinkedIn',
        'https://www.linkedin.com/in/rashid-tagaev', 1);

alter table public.admin_actions drop constraint admin_actions_action_check;
alter table public.admin_actions add constraint admin_actions_action_check
  check (action in ('suspend', 'unsuspend', 'delete_org', 'remove_post', 'restore_post', 'delete_post',
                    'remove_review', 'dismiss_report', 'broadcast', 'set_pilot', 'unset_pilot',
                    'add_logo', 'hide_logo', 'show_logo', 'delete_logo',
                    'add_announcement', 'hide_announcement', 'show_announcement', 'delete_announcement'));

-- For everyone: the visible announcements in staff order.
create function public.announcements()
returns table (id uuid, badge text, message text, link_label text, link_url text)
language sql stable security definer set search_path = '' as $$
  select a.id, a.badge, a.message, a.link_label, a.link_url
    from public.announcements a where not a.hidden order by a.position, a.created_at
$$;

-- Staff: every announcement, hidden ones too (empty for non-staff).
create function public.admin_announcements()
returns table (id uuid, badge text, message text, link_label text, link_url text, hidden boolean)
language sql stable security definer set search_path = '' as $$
  select a.id, a.badge, a.message, a.link_label, a.link_url, a.hidden
    from public.announcements a where public.is_staff() order by a.position, a.created_at
$$;

create function public.admin_add_announcement(badge text, message text, link_label text default null,
                                              link_url text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  b text := nullif(btrim(coalesce(admin_add_announcement.badge, '')), '');
  m text := nullif(btrim(coalesce(admin_add_announcement.message, '')), '');
  ll text := nullif(btrim(coalesce(admin_add_announcement.link_label, '')), '');
  lu text := nullif(btrim(coalesce(admin_add_announcement.link_url, '')), '');
  new_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  if m is null then raise exception 'Write the message' using errcode = '22004'; end if;
  if char_length(m) > 90 then raise exception 'Keep the message to 90 characters so it fits on one line' using errcode = '22001'; end if;
  if (ll is null) <> (lu is null) then raise exception 'Give the link both a text and an address, or neither' using errcode = '22023'; end if;
  if lu is not null and lu !~ '^(https?://|/)' then lu := 'https://' || lu; end if;
  insert into public.announcements (badge, message, link_label, link_url, position)
  values (upper(b), m, ll, lu, coalesce((select max(a.position) from public.announcements a), 0) + 1)
  returning id into new_id;
  insert into public.admin_actions (staff_id, action, target_id, target_label) values (auth.uid(), 'add_announcement', new_id, m);
  return new_id;
end $$;

create function public.admin_set_announcement_hidden(item uuid, hide boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m text;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  update public.announcements a set hidden = hide where a.id = item returning a.message into m;
  insert into public.admin_actions (staff_id, action, target_id, target_label)
  values (auth.uid(), case when hide then 'hide_announcement' else 'show_announcement' end, item, m);
end $$;

-- step -1 moves an announcement one place earlier, 1 one place later.
create function public.admin_move_announcement(item uuid, step int) returns void
language plpgsql security definer set search_path = '' as $$
declare
  cur public.announcements;
  nb  public.announcements;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  select * into cur from public.announcements a where a.id = item;
  if step < 0 then
    select * into nb from public.announcements a where (a.position, a.created_at) < (cur.position, cur.created_at)
     order by a.position desc, a.created_at desc limit 1;
  else
    select * into nb from public.announcements a where (a.position, a.created_at) > (cur.position, cur.created_at)
     order by a.position, a.created_at limit 1;
  end if;
  if nb.id is null then return; end if;
  update public.announcements a set position = nb.position where a.id = cur.id;
  update public.announcements a set position = cur.position where a.id = nb.id;
end $$;

create function public.admin_delete_announcement(item uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m text;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  delete from public.announcements a where a.id = item returning a.message into m;
  insert into public.admin_actions (staff_id, action, target_id, target_label) values (auth.uid(), 'delete_announcement', item, m);
end $$;
