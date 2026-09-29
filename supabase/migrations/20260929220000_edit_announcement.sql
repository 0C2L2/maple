-- Staff can edit an announcement in place (/admin → Banner → Edit), with the same rules as adding one.
alter table public.admin_actions drop constraint admin_actions_action_check;
alter table public.admin_actions add constraint admin_actions_action_check
  check (action in ('suspend', 'unsuspend', 'delete_org', 'remove_post', 'restore_post', 'delete_post',
                    'remove_review', 'dismiss_report', 'broadcast', 'set_pilot', 'unset_pilot',
                    'add_logo', 'hide_logo', 'show_logo', 'delete_logo',
                    'add_announcement', 'hide_announcement', 'show_announcement', 'delete_announcement',
                    'edit_announcement'));

create function public.admin_update_announcement(item uuid, badge text, message text, link_label text default null,
                                                 link_url text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  b text := nullif(btrim(coalesce(admin_update_announcement.badge, '')), '');
  m text := nullif(btrim(coalesce(admin_update_announcement.message, '')), '');
  ll text := nullif(btrim(coalesce(admin_update_announcement.link_label, '')), '');
  lu text := nullif(btrim(coalesce(admin_update_announcement.link_url, '')), '');
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  if m is null then raise exception 'Write the message' using errcode = '22004'; end if;
  if char_length(m) > 90 then raise exception 'Keep the message to 90 characters so it fits on one line' using errcode = '22001'; end if;
  if (ll is null) <> (lu is null) then raise exception 'Give the link both a text and an address, or neither' using errcode = '22023'; end if;
  if lu is not null and lu !~ '^(https?://|/)' then lu := 'https://' || lu; end if;
  update public.announcements a set badge = upper(b), message = m, link_label = ll, link_url = lu where a.id = item;
  if not found then raise exception 'That announcement is gone' using errcode = 'P0002'; end if;
  insert into public.admin_actions (staff_id, action, target_id, target_label) values (auth.uid(), 'edit_announcement', item, m);
end $$;
