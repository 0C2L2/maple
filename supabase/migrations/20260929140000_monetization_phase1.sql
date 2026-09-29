-- Monetization Phase 1 (D-029, docs/business/MONETIZATION.md §6): record pitches and deals, results reports, and
-- pilot events. Nothing is charged yet.

-- A proposal to a sponsor post pitches one of the sender's event posts (3 free per event); a Won deal records
-- its cash amount (smallest currency unit, like the other *_cents columns) and in-kind items.
alter table public.proposals
  add column event_post_id   uuid references public.posts (id) on delete set null,
  add column deal_cash_cents bigint check (deal_cash_cents >= 0),
  add column deal_in_kind    text check (char_length(deal_in_kind) <= 500);
create index proposals_event_post_idx on public.proposals (event_post_id) where event_post_id is not null;
-- The post owner records the deal, under the same row rule as moving the status.
grant update (deal_cash_cents, deal_in_kind) on public.proposals to authenticated;

-- Pilot events pay a 0% fee. Only staff set it (admin_set_pilot); owners can't insert or update it.
alter table public.posts add column pilot boolean not null default false;
create policy "only staff mark pilots" on public.posts as restrictive for insert to authenticated with check (not pilot);

alter table public.admin_actions drop constraint admin_actions_action_check;
alter table public.admin_actions add constraint admin_actions_action_check
  check (action in ('suspend', 'unsuspend', 'delete_org', 'remove_post', 'restore_post', 'delete_post',
                    'remove_review', 'dismiss_report', 'broadcast', 'set_pilot', 'unset_pilot'));

create function public.admin_set_pilot(post uuid, pilot boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  t text;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  update public.posts p set pilot = admin_set_pilot.pilot
   where p.id = admin_set_pilot.post and p.kind = 'event'
  returning p.title into t;
  if t is null then raise exception 'Event post not found' using errcode = 'P0002'; end if;
  insert into public.admin_actions (staff_id, action, target_id, target_label)
  values (auth.uid(), case when admin_set_pilot.pilot then 'set_pilot' else 'unset_pilot' end, admin_set_pilot.post, t);
end $$;

-- Free proposals the signed-in organization has used for one of its events: proposals to sponsor posts on the
-- event's behalf, except ones the sponsor left unanswered for 14 days (their credit comes back). A reply is a
-- status change or a message from the sponsor. Phase 1 shows the count; nothing is blocked or charged.
create function public.event_proposals_used(event_post uuid) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int
    from public.proposals pr
    join public.posts target on target.id = pr.post_id
   where pr.event_post_id = event_post
     and pr.from_id = auth.uid()
     and (pr.status <> 'new'
          or pr.created_at > now() - interval '14 days'
          or exists (select 1 from public.messages m where m.thread_id = pr.thread_id and m.author_id = target.owner_id))
$$;

-- send_proposal gains `event_post`: required when proposing to a sponsor post, and it must be the sender's own
-- event post. Otherwise unchanged from the core migration.
drop function public.send_proposal(uuid, text, uuid, int);
create function public.send_proposal(post uuid, message text, tier_id uuid default null, amount_cents int default null,
                                     event_post uuid default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me  uuid := auth.uid();
  p   public.posts;
  t   uuid;
  msg text := nullif(btrim(coalesce(message, '')), '');
begin
  if me is null then raise exception 'Sign in to send a proposal' using errcode = '42501'; end if;
  if public.is_suspended(me) then raise exception 'Your organization is suspended' using errcode = '42501'; end if;
  if msg is null then raise exception 'Write a message with your proposal' using errcode = '22004'; end if;
  if char_length(msg) > 2000 then raise exception 'Proposal message is too long' using errcode = '22001'; end if;
  if amount_cents is not null and amount_cents < 0 then raise exception 'Amount is invalid' using errcode = '22003'; end if;
  select * into p from public.posts
   where id = post and status = 'open' and removed_at is null and not public.is_suspended(owner_id);
  if not found then raise exception 'This post is closed' using errcode = 'P0002'; end if;
  if p.deadline < current_date then
    raise exception 'Proposals for this post closed on %', p.deadline using errcode = '22023';
  end if;
  if p.kind = 'event' and coalesce(p.ends_on, p.starts_on) < current_date then
    raise exception 'This event is over' using errcode = '22023';
  end if;
  if p.owner_id = me then raise exception 'You can''t propose to your own post' using errcode = '42501'; end if;
  if public.blocked_with(p.owner_id) then
    raise exception 'You can''t send proposals to this organization' using errcode = '42501';
  end if;
  if p.kind = 'sponsor' then
    if event_post is null then raise exception 'Pick the event this proposal is for' using errcode = '22004'; end if;
    if not exists (select 1 from public.posts e
                    where e.id = event_post and e.owner_id = me and e.kind = 'event' and e.removed_at is null) then
      raise exception 'Pick one of your own event posts' using errcode = '42501';
    end if;
  end if;
  if tier_id is not null and not exists (select 1 from public.post_tiers where id = tier_id and post_id = p.id) then
    raise exception 'That tier does not belong to this post' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.post_tiers t where t.id = tier_id and t.slots <= (
      select count(*) from public.proposals pr where pr.tier_id = t.id and pr.status in ('won', 'completed'))) then
    raise exception 'That tier is sold out' using errcode = '22023';
  end if;

  insert into public.threads (post_id) values (p.id) returning id into t;
  insert into public.thread_participants (thread_id, org_id) values (t, me), (t, p.owner_id);
  insert into public.proposals (post_id, from_id, message, tier_id, amount_cents, thread_id, event_post_id)
  values (p.id, me, msg, tier_id, amount_cents, t, case when p.kind = 'sponsor' then event_post end);
  insert into public.messages (thread_id, author_id, body) values (t, me, msg);
  return t;
end $$;

-- After an event, its organizer reports results to the sponsors (in Phase 2 it releases payouts).
create table public.results_reports (
  post_id      uuid primary key references public.posts (id) on delete cascade,
  attendance   int check (attendance >= 0),
  summary      text not null check (char_length(btrim(summary)) between 1 and 4000),
  delivered    text not null default '' check (char_length(delivered) <= 4000), -- what each sponsor got
  photos       text[] not null default '{}' check (cardinality(photos) <= 6 and public.org_media_urls(photos)),
  submitted_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.results_reports enable row level security;
revoke all on public.results_reports from anon;
revoke delete on public.results_reports from authenticated;
-- The organizer, and every sponsor with a Won or Completed deal for the event: sponsors who proposed to it, and
-- sponsors whose sponsor post it pitched.
create policy "organizer and deal sponsors see the report" on public.results_reports for select to authenticated
  using (
    public.owns_post(post_id)
    or exists (select 1 from public.proposals pr
                where pr.post_id = results_reports.post_id and pr.from_id = auth.uid() and pr.status in ('won', 'completed'))
    or exists (select 1 from public.proposals pr join public.posts sp on sp.id = pr.post_id
                where pr.event_post_id = results_reports.post_id and sp.owner_id = auth.uid()
                  and pr.status in ('won', 'completed'))
  );
create policy "organizer reports once the event has started" on public.results_reports for insert to authenticated
  with check (public.owns_post(post_id) and exists (
    select 1 from public.posts p where p.id = post_id and p.kind = 'event' and coalesce(p.starts_on, current_date) <= current_date));
create policy "organizer edits the report" on public.results_reports for update to authenticated
  using (public.owns_post(post_id)) with check (public.owns_post(post_id));

-- Staff finance view: Won and Completed deals by currency, what they would pay at the launch (5%) and full (8%)
-- rates (pilot events 0%, ₩10,000 minimum capped at the deal), and whether organizers' pitches get answers.
create function public.admin_finance() returns jsonb
language sql stable security definer set search_path = '' as $$
  with deals as (
    select pr.deal_cash_cents as cash, pr.deal_in_kind, target.currency, coalesce(ev.pilot, false) as pilot
      from public.proposals pr
      join public.posts target on target.id = pr.post_id
      left join public.posts ev on ev.id = case when target.kind = 'event' then target.id else pr.event_post_id end
     where pr.status in ('won', 'completed')
  ), fees as (
    select currency, cash, pilot,
           case when pilot or coalesce(cash, 0) = 0 then 0
                when currency = 'KRW' then least(cash, greatest(round(cash * 0.05), 10000)) else round(cash * 0.05) end as at_launch,
           case when pilot or coalesce(cash, 0) = 0 then 0
                when currency = 'KRW' then least(cash, greatest(round(cash * 0.08), 10000)) else round(cash * 0.08) end as at_full
      from deals
  ), pitches as (
    select pr.status <> 'new' or exists (
             select 1 from public.messages m
              where m.thread_id = pr.thread_id and m.author_id = target.owner_id
                and m.created_at <= pr.created_at + interval '14 days') as answered
      from public.proposals pr
      join public.posts target on target.id = pr.post_id
     where target.kind = 'sponsor'
  )
  select case when public.is_staff() then jsonb_build_object(
    'by_currency', coalesce((
      select jsonb_agg(c order by c.gmv desc) from (
        select currency,
               count(*) filter (where cash > 0) as cash_deals,
               coalesce(sum(cash), 0) as gmv,
               coalesce(sum(cash) filter (where pilot), 0) as pilot_gmv,
               sum(at_launch) as fees_at_launch,
               sum(at_full) as fees_at_full
          from fees group by currency) c), '[]'::jsonb),
    'deals', (select count(*) from deals),
    'in_kind_only', (select count(*) from deals where coalesce(cash, 0) = 0 and deal_in_kind is not null),
    'no_value', (select count(*) from deals where cash is null and deal_in_kind is null),
    'pitches', (select count(*) from pitches),
    'pitches_answered', (select count(*) from pitches where answered)
  ) end
$$;

-- The admin Posts list shows each event's pilot flag.
drop function public.admin_posts(text);
create function public.admin_posts(q text default '')
returns table (id uuid, title text, kind public.post_kind, status public.post_status, owner_name text,
               owner_handle text, created_at timestamptz, removed_at timestamptz, removed_reason text, pilot boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.title, p.kind, p.status, o.name, o.handle, p.created_at, p.removed_at, p.removed_reason, p.pilot
    from public.posts p
    join public.organizations o on o.id = p.owner_id
   where public.is_staff() and (btrim(q) = '' or p.title ilike '%' || q || '%' or o.name ilike '%' || q || '%')
   order by p.removed_at desc nulls last, p.created_at desc
   limit 50
$$;
