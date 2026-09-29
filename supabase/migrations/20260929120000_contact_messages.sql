-- /contact form. Anyone (signed in or not) sends through send_contact_message(); only staff read, on /admin.
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  topic      text not null check (topic in ('support', 'intro', 'partnership', 'press', 'report', 'privacy', 'other')),
  name       text not null check (char_length(btrim(name)) between 1 and 120),
  email      text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message    text not null check (char_length(btrim(message)) between 1 and 4000),
  org_id     uuid references public.organizations (id) on delete set null, -- the sender's page, when signed in
  done_at    timestamptz,
  created_at timestamptz not null default now()
);
create index contact_messages_email_idx on public.contact_messages (email, created_at);
create index contact_messages_open_idx on public.contact_messages (created_at) where done_at is null;

-- No policies: nobody touches the table directly.
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('proposal', 'proposal_status', 'message', 'follow', 'review', 'contact'));

-- `website` is a honeypot the form hides from people; bots that fill it get a silent success.
-- ponytail: rate limits per email and site-wide; add a captcha check (edge function) if spam gets past them.
create function public.send_contact_message(topic text, name text, email text, message text, website text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  t text := topic;
  n text := btrim(coalesce(name, ''));
  e text := lower(btrim(coalesce(email, '')));
  m text := btrim(coalesce(message, ''));
begin
  if coalesce(website, '') <> '' then return; end if;
  if t is null or t not in ('support', 'intro', 'partnership', 'press', 'report', 'privacy', 'other') then
    raise exception 'Pick a topic' using errcode = '22023';
  end if;
  if n = '' then raise exception 'Enter your name' using errcode = '22004'; end if;
  if char_length(n) > 120 then raise exception 'Your name is too long' using errcode = '22001'; end if;
  if char_length(e) > 254 or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;
  if m = '' then raise exception 'Write a message' using errcode = '22004'; end if;
  if char_length(m) > 4000 then raise exception 'Your message is too long (4,000 characters at most)' using errcode = '22001'; end if;
  if (select count(*) from public.contact_messages c
       where c.email = e and c.created_at > now() - interval '1 hour') >= 3 then
    raise exception 'You''ve sent a few messages already. Please wait an hour and try again.' using errcode = 'PT429';
  end if;
  if (select count(*) from public.contact_messages c where c.created_at > now() - interval '1 hour') >= 30 then
    raise exception 'We''re getting a lot of messages right now. Please try again in an hour.' using errcode = 'PT429';
  end if;

  insert into public.contact_messages (topic, name, email, message, org_id)
  values (t, n, e, m, (select o.id from public.organizations o where o.id = auth.uid()));

  insert into public.notifications (recipient_id, type, link, body)
  select s.user_id, 'contact', '/admin?tab=inbox', 'New contact message from ' || n
    from public.staff s
    join public.organizations o on o.id = s.user_id;
end $$;

-- Staff inbox: open messages, oldest first (empty for non-staff).
create function public.admin_contact_messages()
returns table (id uuid, topic text, name text, email text, message text, org_handle text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.topic, c.name, c.email, c.message, o.handle, c.created_at
    from public.contact_messages c
    left join public.organizations o on o.id = c.org_id
   where public.is_staff() and c.done_at is null
   order by c.created_at
$$;

create function public.admin_close_contact_message(msg uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  update public.contact_messages set done_at = now() where id = msg;
end $$;
