-- Maple v1 core schema (D-024, D-025, D-026). Enum values: docs/engineering/SHARED_CONTRACTS.md §1.
-- Accounts are organizations, not people: one login per organization (D-025).
-- Freelance-marketplace model (D-026): one post type (event | sponsor), proposals, post-event reviews.
-- One post = one event (event posts carry the dates/place inside them). Follow stays; likes/comments are gone.
-- NOTE: this migration was never committed or deployed, so it is rewritten in place for D-026
-- instead of adding a follow-up migration.
-- RLS decides which rows each user may touch; column grants decide which columns may change.

create type public.org_role as enum ('organizer', 'sponsor');
create type public.org_kind as enum ('event_company', 'community', 'university_club', 'nonprofit', 'company', 'agency');
create type public.post_kind as enum ('event', 'sponsor');
create type public.post_status as enum ('draft', 'open', 'closed');
create type public.proposal_status as enum ('new', 'shortlisted', 'in_talks', 'won', 'declined', 'completed');
create type public.category as enum ('hackathon', 'conference', 'meetup', 'workshop', 'festival', 'other');
create type public.audience_type as enum ('developers', 'students', 'founders', 'designers', 'product', 'data', 'marketers', 'executives', 'general');
create type public.attendance_band as enum ('under_100', '100_500', '500_2000', '2000_plus');
create type public.budget_band as enum ('under_1k', '1k_5k', '5k_25k', '25k_100k', '100k_plus');
create type public.give as enum ('cash', 'in_kind', 'credits', 'swag', 'venue', 'food', 'speakers', 'mentors', 'prizes');

-- What an event gives its sponsors (posts and tiers). Labels live in client/src/constants/taxonomy.ts.
create function public.valid_deliverables(items text[]) returns boolean
language sql immutable set search_path = '' as $$
  select items <@ array['logo_site', 'logo_merch', 'logo_stage', 'booth', 'talk', 'workshop', 'judging', 'track_prize',
                        'recruiting', 'social_posts', 'newsletter', 'swag', 'demo', 'naming']
$$;

-- ---------------------------------------------------------------- tables

-- The organization page. Its id is the id of the login that manages it; that person is never shown.
create table public.organizations (
  id              uuid primary key references auth.users (id) on delete cascade,
  role            public.org_role not null,
  kind            public.org_kind not null,
  handle          text not null unique check (handle ~ '^[a-z0-9-]{3,40}$'),
  name            text not null check (char_length(btrim(name)) between 1 and 120),
  tagline         text check (char_length(tagline) <= 120),
  about           text check (char_length(about) <= 2000),
  location        text check (char_length(location) <= 80),
  website         text check (char_length(website) <= 200),
  -- Images must live in Maple's own storage bucket (supabase/migrations/*_org_media.sql).
  logo_url        text check (logo_url ~ '/storage/v1/object/public/org-media/' and char_length(logo_url) <= 500),
  banner_url      text check (banner_url ~ '/storage/v1/object/public/org-media/' and char_length(banner_url) <= 500),
  categories      public.category[] not null default '{}',
  regions         text[] not null default '{}',
  audience_types  public.audience_type[] not null default '{}',
  attendance_band public.attendance_band,
  budget_band     public.budget_band,
  gives           public.give[] not null default '{}',
  -- The page is created only after ticking "I agree to the Terms and Community guidelines" (onboarding).
  terms_accepted_at timestamptz not null default now(),
  -- Set by Maple staff (admin_set_suspended): the page and its posts disappear and the login is banned.
  suspended_at      timestamptz,
  suspended_reason  text check (char_length(suspended_reason) <= 300),
  created_at      timestamptz not null default now()
);

-- The one listing type (D-026). Event posts carry the event plan + dates + place inside them;
-- sponsor posts carry the wanted events + budget + what they give. No separate events table.
create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  kind            public.post_kind not null,
  owner_id        uuid not null default auth.uid() references public.organizations (id) on delete cascade,
  title           text not null check (char_length(btrim(title)) between 1 and 120),
  body            text not null default '' check (char_length(body) <= 5000),
  categories      public.category[] not null default '{}',
  regions         text[] not null default '{}',
  budget_band     public.budget_band, -- sponsorship goal (event) / budget per event (sponsor)
  attendance_band public.attendance_band, -- expected attendance (event) / wanted size (sponsor)
  audience_types  public.audience_type[] not null default '{}',
  supports        public.give[] not null default '{}', -- support needed (event) / support offered (sponsor)
  benefits        text not null default '' check (char_length(benefits) <= 2000), -- what sponsors get / what sponsor wants
  starts_on       date,
  ends_on         date,
  city            text check (char_length(city) <= 80),
  venue           text check (char_length(venue) <= 200), -- venue name and address; the post page maps it
  cover_url       text check (cover_url ~ '/storage/v1/object/public/org-media/' and char_length(cover_url) <= 500),
  online          boolean not null default false,
  deadline        date,
  -- The pitch to sponsors. Money is in the smallest unit of `currency` (cents for USD, won for KRW).
  currency        text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  goal_cents      bigint check (goal_cents >= 0), -- total sponsorship goal
  needs           text[] not null default '{}', -- what the event needs, one line each
  deliverables    text[] not null default '{}' check (public.valid_deliverables(deliverables)),
  exclusivity     text check (char_length(exclusivity) <= 200),
  custom_packages boolean not null default true,
  -- Label/value lists, e.g. [{"label": "Developers", "value": "60%"}]
  audience        jsonb not null default '[]' check (jsonb_typeof(audience) = 'array'),
  reach           jsonb not null default '[]' check (jsonb_typeof(reach) = 'array'),
  past_stats      jsonb not null default '[]' check (jsonb_typeof(past_stats) = 'array'),
  agenda          jsonb not null default '[]' check (jsonb_typeof(agenda) = 'array'), -- label = when, value = what
  people          jsonb not null default '[]' check (jsonb_typeof(people) = 'array'), -- label = name, value = role
  use_of_funds    jsonb not null default '[]' check (jsonb_typeof(use_of_funds) = 'array'),
  past_sponsors   text[] not null default '{}',
  languages       text[] not null default '{}',
  registrations   int check (registrations >= 0), -- people signed up so far
  decision_by     date, -- when sponsors hear back
  report_by       date, -- when sponsors get the after-event report
  payment_terms   text check (char_length(payment_terms) <= 300),
  -- Taken down by Maple staff (admin_set_post_removed): hidden from everyone but the owner and staff.
  removed_at      timestamptz,
  removed_reason  text check (char_length(removed_reason) <= 300),
  status          public.post_status not null default 'open',
  created_at      timestamptz not null default now(),
  search          tsvector generated always as (to_tsvector('english', title || ' ' || body || ' ' || benefits)) stored,
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index posts_search_idx on public.posts using gin (search);
create index posts_owner_idx on public.posts (owner_id);
create index posts_kind_status_idx on public.posts (kind, status, created_at desc);

-- Priced tiers on event posts (e.g. Gold $5K / Silver $2K).
create table public.post_tiers (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  position   int not null default 0,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  price_cents int check (price_cents >= 0),
  benefits   text not null default '' check (char_length(benefits) <= 1000),
  slots      int check (slots > 0),
  deliverables text[] not null default '{}' check (public.valid_deliverables(deliverables))
);
create index post_tiers_post_idx on public.post_tiers (post_id, position);

-- Documents on a post (sponsorship deck, event plan, media kit). The PDFs live in the private post-files bucket
-- (*_org_media.sql): anyone sees that they exist; only signed-in organizations can download them.
create table public.post_files (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  kind       text not null check (kind in ('deck', 'plan', 'media_kit', 'other')),
  name       text not null check (char_length(btrim(name)) between 1 and 120),
  path       text not null check (char_length(path) <= 300), -- <organization id>/<file> inside post-files
  size       int not null check (size between 1 and 10485760),
  created_at timestamptz not null default now()
);
create index post_files_post_idx on public.post_files (post_id);

-- Conversations come before proposals: each proposal gets its own thread.
create table public.threads (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid references public.posts (id) on delete set null,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  matched_at      timestamptz -- set once both sides have replied (north-star metric, D-004)
);
create index threads_post_idx on public.threads (post_id);

create table public.thread_participants (
  thread_id    uuid not null references public.threads (id) on delete cascade,
  org_id       uuid not null references public.organizations (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, org_id)
);
create index thread_participants_org_idx on public.thread_participants (org_id);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.threads (id) on delete cascade,
  author_id  uuid not null default auth.uid() references public.organizations (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_thread_idx on public.messages (thread_id, created_at);

-- An application to a post (replaces Quick Pitch). One per organization per post.
create table public.proposals (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts (id) on delete cascade,
  from_id      uuid not null references public.organizations (id) on delete cascade,
  message      text not null check (char_length(btrim(message)) between 1 and 2000),
  tier_id      uuid references public.post_tiers (id) on delete set null,
  amount_cents int check (amount_cents >= 0),
  status       public.proposal_status not null default 'new',
  thread_id    uuid references public.threads (id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (post_id, from_id)
);
create index proposals_post_idx on public.proposals (post_id, status);
create index proposals_from_idx on public.proposals (from_id);

-- Post-event ratings (replace likes/comments). Only deal participants, only after completed.
-- Reviews are public on organization pages.
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  reviewer_id uuid not null default auth.uid() references public.organizations (id) on delete cascade,
  reviewee_id uuid not null references public.organizations (id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  body        text not null default '' check (char_length(body) <= 2000),
  created_at  timestamptz not null default now(),
  unique (proposal_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);
create index reviews_post_idx on public.reviews (post_id, created_at desc);
create index reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);

-- Organizations follow each other (stays, D-026). The Find page has a Following tab.
create table public.follows (
  follower_id uuid not null default auth.uid() references public.organizations (id) on delete cascade,
  org_id      uuid not null references public.organizations (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, org_id),
  check (follower_id <> org_id)
);
create index follows_org_idx on public.follows (org_id);

-- Bookmarked posts.
create table public.saved_posts (
  owner_id   uuid not null default auth.uid() references public.organizations (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, post_id)
);

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.organizations (id) on delete cascade,
  actor_id     uuid references public.organizations (id) on delete cascade,
  type         text not null check (type in ('proposal', 'proposal_status', 'message', 'follow', 'review')),
  link         text not null, -- app path to open, e.g. /messages/<thread id>
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

-- View counters (one row per viewer per day). Never public; owners see views of their own content.
create table public.post_views (
  viewer_id  uuid not null default auth.uid() references public.organizations (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  viewed_on  date not null default current_date,
  unique (viewer_id, post_id, viewed_on)
);
create table public.org_views (
  viewer_id  uuid not null default auth.uid() references public.organizations (id) on delete cascade,
  org_id     uuid not null references public.organizations (id) on delete cascade,
  viewed_on  date not null default current_date,
  unique (viewer_id, org_id, viewed_on)
);

-- Search ranking weights (CLAUDE.md: never hard-code them). Tune these rows with SQL; no app writes.
create table public.ranking_weights (
  key    text primary key,
  weight real not null check (weight >= 0)
);
insert into public.ranking_weights (key, weight) values
  ('text', 1.0),     -- keyword relevance
  ('category', 0.6), -- shares an event type with the viewer
  ('region', 0.4),   -- shares a region with the viewer
  ('audience', 0.2); -- shares an audience with the viewer

-- Safety (app-store rules, BUILD_PLAN 8.2): organizations report content and block each other; Maple staff
-- review reports on /admin. Staff rows are added by hand in SQL: insert into public.staff values ('<user id>').
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.organizations (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'organization', 'review')),
  target_id   uuid not null, -- no foreign key: the report outlives the content it points at
  reason      text not null check (reason in ('spam', 'scam', 'fake', 'offensive', 'other')),
  details     text not null default '' check (char_length(details) <= 1000),
  status      text not null default 'open' check (status in ('open', 'removed', 'dismissed')),
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index reports_open_idx on public.reports (created_at) where status = 'open';

-- Every admin action, for accountability. Only staff can read it; only the admin functions write it.
create table public.admin_actions (
  id           bigint generated always as identity primary key,
  staff_id     uuid references auth.users (id) on delete set null,
  action       text not null check (action in ('suspend', 'unsuspend', 'delete_org', 'remove_post', 'restore_post',
                                               'delete_post', 'remove_review', 'dismiss_report', 'broadcast')),
  target_id    uuid not null,
  target_label text,
  reason       text,
  created_at   timestamptz not null default now()
);

-- A block works both ways: neither organization can message or send proposals to the other.
create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.organizations (id) on delete cascade,
  blocked_id uuid not null references public.organizations (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- Showcases: past events, like Wishket's portfolio. What happened, with photos, key numbers, and sponsors.
create function public.org_media_urls(urls text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(bool_and(u ~ '/storage/v1/object/public/org-media/' and char_length(u) <= 500), true)
    from unnest(urls) u
$$;

create table public.showcases (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default auth.uid() references public.organizations (id) on delete cascade,
  post_id    uuid references public.posts (id) on delete set null, -- the event post it grew from
  title      text not null check (char_length(btrim(title)) between 1 and 120),
  summary    text not null default '' check (char_length(summary) <= 300),
  body       text not null default '' check (char_length(body) <= 5000),
  categories public.category[] not null default '{}',
  starts_on  date,
  ends_on    date,
  city       text check (char_length(city) <= 80),
  venue      text check (char_length(venue) <= 160),
  facts      jsonb not null default '[]' check (jsonb_typeof(facts) = 'array'), -- [{"label", "value"}]
  highlights text[] not null default '{}',
  sponsors   text[] not null default '{}', -- sponsor names, as the organizer lists them
  cover_url  text check (public.org_media_urls(array[cover_url])),
  gallery    text[] not null default '{}' check (public.org_media_urls(gallery)),
  link       text check (char_length(link) <= 300), -- the original event page
  created_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index showcases_org_idx on public.showcases (org_id, starts_on desc);

-- ---------------------------------------------------------------- row level security

alter table public.showcases enable row level security;
alter table public.staff enable row level security;
alter table public.admin_actions enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.ranking_weights enable row level security;
alter table public.organizations enable row level security;
alter table public.posts enable row level security;
alter table public.post_tiers enable row level security;
alter table public.post_files enable row level security;
alter table public.proposals enable row level security;
alter table public.reviews enable row level security;
alter table public.follows enable row level security;
alter table public.saved_posts enable row level security;
alter table public.threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.post_views enable row level security;
alter table public.org_views enable row level security;

create function public.is_thread_participant(t uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.thread_participants where thread_id = t and org_id = auth.uid())
$$;

create function public.owns_post(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.posts where id = p and owner_id = auth.uid())
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = auth.uid())
$$;

create function public.is_suspended(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.organizations where id = org and suspended_at is not null)
$$;

-- True when the signed-in organization and `other` blocked each other (either way). Reveals nothing about
-- blocks between other organizations.
create function public.blocked_with(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.blocks
                  where (blocker_id = auth.uid() and blocked_id = other)
                     or (blocker_id = other and blocked_id = auth.uid()))
$$;

-- True when the signed-in organization and anyone else in the conversation blocked each other.
create function public.thread_blocked(t uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.thread_participants tp
                  where tp.thread_id = t and tp.org_id <> auth.uid() and public.blocked_with(tp.org_id))
$$;

-- Public content: anyone can read.
create policy "ranking weights are public" on public.ranking_weights for select using (true);
create policy "organizations are public" on public.organizations for select using (true);
create policy "open posts are public" on public.posts for select
  using ((status <> 'draft' or owner_id = auth.uid())
         and ((removed_at is null and not public.is_suspended(owner_id)) or owner_id = auth.uid() or public.is_staff()));
create policy "tiers are public" on public.post_tiers for select using (true);
create policy "post files are listed publicly" on public.post_files for select using (true);
create policy "reviews are public" on public.reviews for select using (true);
create policy "follows are public" on public.follows for select using (true);

-- Own rows: each organization writes only its own.
create policy "create own organization" on public.organizations for insert to authenticated with check (id = auth.uid());
create policy "edit own organization" on public.organizations for update to authenticated using (id = auth.uid());
-- Any organization may post both kinds (D-028): an organizer can also sponsor other events.
create policy "create own post" on public.posts for insert to authenticated
  with check (owner_id = auth.uid() and not public.is_suspended(auth.uid()));
create policy "edit own post" on public.posts for update to authenticated
  using (owner_id = auth.uid() and not public.is_suspended(auth.uid()));
create policy "delete own post" on public.posts for delete to authenticated using (owner_id = auth.uid());
create policy "manage own post files" on public.post_files for all to authenticated
  using (public.owns_post(post_id))
  with check (public.owns_post(post_id) and split_part(path, '/', 1) = auth.uid()::text);
create policy "manage own tiers" on public.post_tiers for all to authenticated
  using (public.owns_post(post_id)) with check (public.owns_post(post_id));
create policy "edit own review" on public.reviews for update to authenticated using (reviewer_id = auth.uid());
create policy "delete own review" on public.reviews for delete to authenticated using (reviewer_id = auth.uid());
create policy "follow" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "unfollow" on public.follows for delete to authenticated using (follower_id = auth.uid());
create policy "manage own saved posts" on public.saved_posts for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "record post view" on public.post_views for insert to authenticated with check (viewer_id = auth.uid());
create policy "record org view" on public.org_views for insert to authenticated with check (viewer_id = auth.uid());
create policy "report content" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "see own reports" on public.reports for select to authenticated using (reporter_id = auth.uid());
create policy "manage own blocks" on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "staff see own row" on public.staff for select to authenticated using (user_id = auth.uid());
create policy "staff read the admin log" on public.admin_actions for select to authenticated using (public.is_staff());
create policy "showcases are public" on public.showcases for select using (true);
create policy "manage own showcases" on public.showcases for all to authenticated
  using (org_id = auth.uid()) with check (org_id = auth.uid());

-- Private: proposals, conversations, notifications, view rollups.
create policy "see own and received proposals" on public.proposals for select to authenticated
  using (from_id = auth.uid() or public.owns_post(post_id));
-- The owner moves new → shortlisted → in talks → won / declined. Completing goes only through
-- complete_proposal() (after the event), and a completed deal is final.
create policy "owner moves proposal status" on public.proposals for update to authenticated
  using (public.owns_post(post_id) and status <> 'completed')
  with check (status <> 'completed');
create policy "see own and received views on posts" on public.post_views for select to authenticated
  using (viewer_id = auth.uid() or public.owns_post(post_id));
create policy "see own and received views on orgs" on public.org_views for select to authenticated
  using (viewer_id = auth.uid() or org_id = auth.uid());
create policy "participants see thread" on public.threads for select to authenticated
  using (public.is_thread_participant(id));
create policy "participants see members" on public.thread_participants for select to authenticated
  using (public.is_thread_participant(thread_id));
create policy "mark own thread read" on public.thread_participants for update to authenticated
  using (org_id = auth.uid());
create policy "participants read messages" on public.messages for select to authenticated
  using (public.is_thread_participant(thread_id));
create policy "participants send messages" on public.messages for insert to authenticated
  with check (author_id = auth.uid() and public.is_thread_participant(thread_id) and not public.thread_blocked(thread_id)
              and not public.is_suspended(auth.uid()));
create policy "see own notifications" on public.notifications for select to authenticated
  using (recipient_id = auth.uid());
create policy "mark own notifications read" on public.notifications for update to authenticated
  using (recipient_id = auth.uid());

-- Column rules. Handles and roles are permanent (WEBSITE_PLAN §2); threads, participants, proposals,
-- reviews, and notifications are only created by the functions and triggers below.
revoke insert, update, delete on public.threads, public.thread_participants, public.proposals, public.reviews, public.notifications
  from anon, authenticated;
revoke insert, update, delete on public.ranking_weights, public.staff, public.admin_actions from anon, authenticated;
-- Reports change status only through resolve_report() (staff).
revoke update, delete on public.reports from anon, authenticated;
revoke update on public.organizations from anon, authenticated;
-- A post's kind and owner are permanent.
revoke update on public.posts from anon, authenticated;
grant update (title, body, categories, regions, budget_band, attendance_band, audience_types, supports, benefits,
              starts_on, ends_on, city, venue, cover_url, online, deadline, status, currency, goal_cents, needs,
              deliverables, exclusivity, custom_packages, audience, reach, past_stats, agenda, people, use_of_funds,
              past_sponsors, languages, registrations, decision_by, report_by, payment_terms) on public.posts to authenticated;
grant update (kind, name, tagline, about, location, website, logo_url, banner_url, categories, regions,
              audience_types, attendance_band, budget_band, gives) on public.organizations to authenticated;
grant update (status) on public.proposals to authenticated;
grant update (rating, body) on public.reviews to authenticated;
grant update (last_read_at) on public.thread_participants to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ---------------------------------------------------------------- actions

-- Send a proposal: one per organization per post, with its own conversation.
create function public.send_proposal(post uuid, message text, tier_id uuid default null, amount_cents int default null)
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
  -- Any other organization can propose (D-028): proposing to an event post means offering to sponsor it.
  if tier_id is not null and not exists (select 1 from public.post_tiers where id = tier_id and post_id = p.id) then
    raise exception 'That tier does not belong to this post' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.post_tiers t where t.id = tier_id and t.slots <= (
      select count(*) from public.proposals pr where pr.tier_id = t.id and pr.status in ('won', 'completed'))) then
    raise exception 'That tier is sold out' using errcode = '22023';
  end if;

  insert into public.threads (post_id) values (p.id) returning id into t;
  insert into public.thread_participants (thread_id, org_id) values (t, me), (t, p.owner_id);
  insert into public.proposals (post_id, from_id, message, tier_id, amount_cents, thread_id)
  values (p.id, me, msg, tier_id, amount_cents, t);
  insert into public.messages (thread_id, author_id, body) values (t, me, msg);
  return t;
end $$;

-- Mark a won proposal completed (either side of the deal, after the event).
create function public.complete_proposal(proposal uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me  uuid := auth.uid();
  pr  public.proposals;
  po  public.posts;
begin
  if me is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into pr from public.proposals where id = proposal;
  if not found then raise exception 'Proposal not found' using errcode = 'P0002'; end if;
  select * into po from public.posts where id = pr.post_id;
  if pr.status <> 'won' then raise exception 'Only a won proposal can be completed' using errcode = '22023'; end if;
  if me <> pr.from_id and me <> po.owner_id then
    raise exception 'Only the two sides of this deal can complete it' using errcode = '42501';
  end if;
  -- Reviews are for after the event. Sponsor posts have no single event date, so only event posts wait.
  if po.kind = 'event' and coalesce(po.ends_on, po.starts_on) > current_date then
    raise exception 'You can mark this deal completed after the event ends (%).', coalesce(po.ends_on, po.starts_on)
      using errcode = '22023';
  end if;
  update public.proposals set status = 'completed' where id = pr.id;
end $$;

-- Leave a review after completion (one per side per deal).
create function public.leave_review(proposal uuid, rating int, body text default '') returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me  uuid := auth.uid();
  pr  public.proposals;
  po  public.posts;
  other uuid;
  r   uuid;
begin
  if me is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if rating is null or rating < 1 or rating > 5 then raise exception 'Rating must be 1–5' using errcode = '22003'; end if;
  select * into pr from public.proposals where id = proposal;
  if not found then raise exception 'Proposal not found' using errcode = 'P0002'; end if;
  if pr.status <> 'completed' then raise exception 'Reviews open after the deal is completed' using errcode = '22023'; end if;
  select * into po from public.posts where id = pr.post_id;
  if me = pr.from_id then other := po.owner_id;
  elsif me = po.owner_id then other := pr.from_id;
  else raise exception 'Only the two sides of this deal can review' using errcode = '42501'; end if;
  insert into public.reviews (post_id, proposal_id, reviewer_id, reviewee_id, rating, body)
  values (po.id, pr.id, me, other, rating, btrim(coalesce(body, ''))) -- the written part is optional
  returning id into r;
  return r;
end $$;

-- ponytail: any organization can message any other in v1; paid limits (MVP §4.8) arrive with Premium.
create function public.start_conversation(other uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  t  uuid;
begin
  if me is null then raise exception 'Sign in to send messages' using errcode = '42501'; end if;
  if other = me then raise exception 'You can''t message yourself' using errcode = '22023'; end if;
  if public.blocked_with(other) or public.is_suspended(me) or public.is_suspended(other) then
    raise exception 'You can''t message this organization' using errcode = '42501';
  end if;
  select mine.thread_id into t
    from public.thread_participants mine
    join public.threads th on th.id = mine.thread_id and th.post_id is null
    join public.thread_participants theirs on theirs.thread_id = mine.thread_id and theirs.org_id = other
   where mine.org_id = me
   limit 1;
  if t is null then
    insert into public.threads default values returning id into t;
    insert into public.thread_participants (thread_id, org_id) values (t, me), (t, other);
  end if;
  return t;
end $$;

-- ---------------------------------------------------------------- search (D-008)

-- Filters (all optional): kind, categories (array: any of), category, region, budget_band, attendance_band,
-- match (an organization id: rank by fit with it and hide its own posts),
-- sort ('recent' = newest first, 'deadline' = closing soonest, 'fewest' = fewest proposals).
-- security definer so proposal_count counts every proposal, not only the caller's (RLS); it returns only
-- open posts and public organization fields.
create function public.search_posts(q text default '', filters jsonb default '{}', page int default 0)
returns table (id uuid, kind public.post_kind, title text, owner_id uuid, owner_name text,
               owner_handle text, owner_logo_url text, categories public.category[],
               regions text[], budget_band public.budget_band, attendance_band public.attendance_band,
               starts_on date, city text, online boolean, deadline date, created_at timestamptz,
               proposal_count int, score real, boosted boolean, currency text, goal_cents bigint)
language sql stable security definer set search_path = '' as $$
  with w as (
    select coalesce(max(weight) filter (where key = 'text'), 0)     as text_w,
           coalesce(max(weight) filter (where key = 'category'), 0) as category_w,
           coalesce(max(weight) filter (where key = 'region'), 0)   as region_w,
           coalesce(max(weight) filter (where key = 'audience'), 0) as audience_w
      from public.ranking_weights
  ),
  viewer as (select * from public.organizations where id = (filters->>'match')::uuid),
  ranked as (
    select p.id, p.kind, p.title, p.owner_id, org.name as owner_name, org.handle as owner_handle,
           org.logo_url as owner_logo_url, p.categories, p.regions, p.budget_band, p.attendance_band,
           p.starts_on, p.city, p.online, p.deadline, p.created_at, p.currency, p.goal_cents,
           (select count(*)::int from public.proposals pr where pr.post_id = p.id) as proposal_count,
           ((case when btrim(q) = '' then 0 else ts_rank(p.search, websearch_to_tsquery('english', q)) end) * w.text_w
            + coalesce((select (p.categories && v.categories)::int * w.category_w
                             + (p.regions && v.regions)::int * w.region_w
                             + (p.audience_types && v.audience_types)::int * w.audience_w
                          from viewer v), 0))::real as score,
           false as boosted -- ponytail: Boost slots (MVP §7.2) arrive with Boost in v1.1
      from public.posts p
      join public.organizations org on org.id = p.owner_id
      cross join w
     where p.status = 'open' and p.removed_at is null and org.suspended_at is null
       -- Still taking proposals: before the deadline and, for events, before the event ends.
       and (p.deadline is null or p.deadline >= current_date)
       and (p.kind <> 'event' or coalesce(p.ends_on, p.starts_on) is null or coalesce(p.ends_on, p.starts_on) >= current_date)
       and (btrim(q) = '' or p.search @@ websearch_to_tsquery('english', q))
       and (filters->>'kind' is null or p.kind = (filters->>'kind')::public.post_kind)
       and (filters->'categories' is null
            or p.categories && array(select jsonb_array_elements_text(filters->'categories'))::public.category[])
       and (filters->>'category' is null or (filters->>'category')::public.category = any (p.categories))
       and (filters->>'region' is null or filters->>'region' = any (p.regions))
       and (filters->>'budget_band' is null or p.budget_band = (filters->>'budget_band')::public.budget_band)
       and (filters->>'attendance_band' is null or p.attendance_band = (filters->>'attendance_band')::public.attendance_band)
       and (filters->>'match' is null or p.owner_id <> (filters->>'match')::uuid)
  )
  select r.id, r.kind, r.title, r.owner_id, r.owner_name, r.owner_handle, r.owner_logo_url, r.categories,
         r.regions, r.budget_band, r.attendance_band, r.starts_on, r.city, r.online, r.deadline, r.created_at,
         r.proposal_count, r.score, r.boosted, r.currency, r.goal_cents
    from ranked r
   order by case when filters->>'sort' = 'deadline' then r.deadline end asc nulls last,
            case when filters->>'sort' = 'fewest' then r.proposal_count end asc,
            (case when filters->>'sort' in ('recent', 'deadline', 'fewest') then 0 else r.score end) desc,
            r.created_at desc
   limit 20 offset greatest(page, 0) * 20
$$;

-- Slots taken per tier (won and completed proposals). Proposals are private, so only the counts come back.
create function public.tier_slots(post uuid) returns table (tier_id uuid, taken int)
language sql stable security definer set search_path = '' as $$
  select t.id, (select count(*)::int from public.proposals pr where pr.tier_id = t.id and pr.status in ('won', 'completed'))
    from public.post_tiers t where t.post_id = post
$$;

-- Open posts per event type, for the home page.
create function public.category_counts() returns table (category public.category, posts int)
language sql stable set search_path = '' as $$
  select c, count(*)::int from public.posts p, unnest(p.categories) c
   where p.status = 'open' and p.removed_at is null and not public.is_suspended(p.owner_id) group by c
$$;

-- Public numbers for an organization page, like "jobs completed" and the rating on a freelancer profile.
-- security definer: completed deals are counted from private proposals, but only the totals are returned.
create function public.org_stats(org uuid)
returns table (open_posts int, completed_deals int, rating numeric, reviews int)
language sql stable security definer set search_path = '' as $$
  select (select count(*)::int from public.posts where owner_id = org and status = 'open'),
         (select count(*)::int from public.proposals pr join public.posts po on po.id = pr.post_id
           where pr.status = 'completed' and (pr.from_id = org or po.owner_id = org)),
         (select round(avg(r.rating)::numeric, 1) from public.reviews r where r.reviewee_id = org),
         (select count(*)::int from public.reviews r where r.reviewee_id = org)
$$;

-- Find sponsors (like Wishket's "Find partners"): organizations that sponsor, i.e. sponsor role or an open
-- sponsor post (D-028), with public totals.
create function public.search_sponsors(q text default '', filters jsonb default '{}', page int default 0)
returns table (id uuid, handle text, name text, tagline text, location text, logo_url text,
               categories public.category[], regions text[], gives public.give[], budget_band public.budget_band,
               open_sponsor_posts int, completed_deals int, rating numeric, reviews int)
language sql stable security definer set search_path = '' as $$
  select o.id, o.handle, o.name, o.tagline, o.location, o.logo_url, o.categories, o.regions, o.gives, o.budget_band,
         sp.n, s.completed_deals, s.rating, s.reviews
    from public.organizations o
    cross join lateral (select count(*)::int as n from public.posts p
                         where p.owner_id = o.id and p.kind = 'sponsor' and p.status = 'open' and p.removed_at is null) sp
    cross join lateral public.org_stats(o.id) s
   where (o.role = 'sponsor' or sp.n > 0) and o.suspended_at is null
     and (btrim(q) = '' or o.name ilike '%' || q || '%' or o.tagline ilike '%' || q || '%')
     and (filters->>'category' is null or (filters->>'category')::public.category = any (o.categories))
     and (filters->>'region' is null or filters->>'region' = any (o.regions))
   order by sp.n desc, s.completed_deals desc, o.created_at desc
   limit 20 offset greatest(page, 0) * 20
$$;

create function public.search_organizations(q text default '', filters jsonb default '{}', page int default 0)
returns table (id uuid, handle text, name text, tagline text, role public.org_role, kind public.org_kind,
               location text, logo_url text)
language sql stable set search_path = '' as $$
  select o.id, o.handle, o.name, o.tagline, o.role, o.kind, o.location, o.logo_url
    from public.organizations o
   where o.suspended_at is null
     and (btrim(q) = '' or o.name ilike '%' || q || '%' or o.tagline ilike '%' || q || '%' or o.handle ilike '%' || q || '%')
     and (filters->>'role' is null or o.role = (filters->>'role')::public.org_role)
     and (filters->>'kind' is null or o.kind = (filters->>'kind')::public.org_kind)
     and (filters->>'category' is null or (filters->>'category')::public.category = any (o.categories))
     and (filters->>'region' is null or filters->>'region' = any (o.regions))
   order by o.created_at desc
   limit 20 offset greatest(page, 0) * 20
$$;

-- One row per viewer per day; no-op for anonymous visitors or self-views.
create function public.record_post_view(post uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.post_views (viewer_id, post_id)
  select auth.uid(), post where auth.uid() is not null
    and exists (select 1 from public.posts p where p.id = post and p.owner_id <> auth.uid())
  on conflict do nothing
$$;
create function public.record_org_view(org uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.org_views (viewer_id, org_id)
  select auth.uid(), org where auth.uid() is not null and org <> auth.uid()
  on conflict do nothing
$$;

-- ---------------------------------------------------------------- safety: moderation + account deletion

-- Staff queue for /admin: open reports with a readable summary of what was reported (empty for non-staff).
create function public.open_reports()
returns table (id uuid, target_type text, target_id uuid, reason text, details text, created_at timestamptz,
               reporter_name text, target_text text, target_link text)
language sql stable security definer set search_path = '' as $$
  select r.id, r.target_type, r.target_id, r.reason, r.details, r.created_at, rep.name,
         case r.target_type
           when 'post' then (select p.title from public.posts p where p.id = r.target_id)
           when 'organization' then (select o.name from public.organizations o where o.id = r.target_id)
           when 'review' then (select rv.rating || '★ ' || rv.body from public.reviews rv where rv.id = r.target_id)
         end,
         case r.target_type
           when 'post' then '/posts/' || r.target_id
           when 'organization' then (select '/org/' || o.handle from public.organizations o where o.id = r.target_id)
           when 'review' then (select '/org/' || o.handle from public.reviews rv
                                 join public.organizations o on o.id = rv.reviewee_id where rv.id = r.target_id)
         end
    from public.reports r
    join public.organizations rep on rep.id = r.reporter_id
   where r.status = 'open' and public.is_staff()
   order by r.created_at
$$;

-- Staff: act on a report. Remove = take the post down, delete the review, or suspend the organization (all but the
-- review can be undone from /admin). Closes every open report on the same target.
create function public.resolve_report(report uuid, remove boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  r public.reports;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  select * into r from public.reports where id = report;
  if not found then raise exception 'Report not found' using errcode = 'P0002'; end if;
  if remove then
    if r.target_type = 'post' then perform public.admin_set_post_removed(r.target_id, true, 'Reported: ' || r.reason);
    elsif r.target_type = 'organization' then perform public.admin_set_suspended(r.target_id, true, 'Reported: ' || r.reason);
    elsif r.target_type = 'review' then
      delete from public.reviews where id = r.target_id;
      insert into public.admin_actions (staff_id, action, target_id, reason) values (auth.uid(), 'remove_review', r.target_id, r.reason);
    end if;
  else
    insert into public.admin_actions (staff_id, action, target_id, reason) values (auth.uid(), 'dismiss_report', r.target_id, r.reason);
  end if;
  update public.reports set status = case when remove then 'removed' else 'dismissed' end
   where target_type = r.target_type and target_id = r.target_id and status = 'open';
end $$;

-- Staff: suspend (with a reason) or restore an organization. Suspending hides its page's posts, blocks its
-- writes, bans the login, and signs it out everywhere.
-- ponytail: an access token issued before the ban works until it expires (up to an hour); the RLS checks above
-- already refuse that organization's writes.
create function public.admin_set_suspended(org uuid, suspend boolean, reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  label text;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  if suspend and exists (select 1 from public.staff where user_id = org) then
    raise exception 'Staff accounts can''t be suspended' using errcode = '22023';
  end if;
  if suspend and nullif(btrim(reason), '') is null then raise exception 'Give a reason' using errcode = '22023'; end if;
  update public.organizations
     set suspended_at = case when suspend then now() end,
         suspended_reason = case when suspend then btrim(reason) end
   where id = org
  returning name into label;
  if not found then raise exception 'Organization not found' using errcode = 'P0002'; end if;
  update auth.users set banned_until = case when suspend then 'infinity'::timestamptz end where id = org;
  if suspend then delete from auth.sessions where user_id = org; end if;
  insert into public.admin_actions (staff_id, action, target_id, target_label, reason)
  values (auth.uid(), case when suspend then 'suspend' else 'unsuspend' end, org, label, nullif(btrim(reason), ''));
end $$;

-- Staff: take a post down (with a reason) or put it back.
create function public.admin_set_post_removed(post uuid, remove boolean, reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  label text;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  if remove and nullif(btrim(reason), '') is null then raise exception 'Give a reason' using errcode = '22023'; end if;
  update public.posts
     set removed_at = case when remove then now() end,
         removed_reason = case when remove then btrim(reason) end
   where id = post
  returning title into label;
  if not found then raise exception 'Post not found' using errcode = 'P0002'; end if;
  insert into public.admin_actions (staff_id, action, target_id, target_label, reason)
  values (auth.uid(), case when remove then 'remove_post' else 'restore_post' end, post, label, nullif(btrim(reason), ''));
end $$;

-- Staff: delete for good. An organization goes with its login and everything it created.
create function public.admin_delete(target_type text, target uuid, reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  label text;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  if target_type = 'organization' then
    if exists (select 1 from public.staff where user_id = target) then
      raise exception 'Staff accounts can''t be deleted here' using errcode = '22023';
    end if;
    select name into label from public.organizations where id = target;
    delete from auth.users where id = target;
  elsif target_type = 'post' then
    delete from public.posts where id = target returning title into label;
  else
    raise exception 'Unknown target' using errcode = '22023';
  end if;
  if label is null then raise exception 'Not found' using errcode = 'P0002'; end if;
  insert into public.admin_actions (staff_id, action, target_id, target_label, reason)
  values (auth.uid(), case target_type when 'organization' then 'delete_org' else 'delete_post' end, target, label,
          nullif(btrim(reason), ''));
end $$;

-- Staff: send a direct message from the staff member's organization (for example "Maple") to every organization,
-- every organizer, every sponsor, or the chosen ones. Each lands in the recipient's existing conversation with
-- that organization (or a new one), with the usual notification. Suspended organizations are skipped.
-- Returns how many organizations got it.
-- ponytail: one insert per recipient in a single call; move to a queue (pg_cron / Edge Function) past a few
-- thousand organizations.
create function public.admin_broadcast(audience text, orgs uuid[], body text) returns int
language plpgsql security definer set search_path = '' as $$
declare
  me     uuid := auth.uid();
  msg    text := nullif(btrim(coalesce(body, '')), '');
  target uuid;
  t      uuid;
  sent   int := 0;
begin
  if not public.is_staff() then raise exception 'Staff only' using errcode = '42501'; end if;
  if not exists (select 1 from public.organizations where id = me) then
    raise exception 'Create an organization page for this staff login first' using errcode = '22023';
  end if;
  if msg is null then raise exception 'Write a message' using errcode = '22004'; end if;
  if char_length(msg) > 4000 then raise exception 'The message is too long' using errcode = '22001'; end if;
  if audience not in ('all', 'organizers', 'sponsors', 'selected') then
    raise exception 'Unknown audience' using errcode = '22023';
  end if;

  for target in
    select o.id from public.organizations o
     where o.id <> me and o.suspended_at is null
       and (audience = 'all'
            or (audience = 'organizers' and o.role = 'organizer')
            or (audience = 'sponsors' and o.role = 'sponsor')
            or (audience = 'selected' and o.id = any (coalesce(orgs, '{}'))))
  loop
    select mine.thread_id into t
      from public.thread_participants mine
      join public.threads th on th.id = mine.thread_id and th.post_id is null
      join public.thread_participants theirs on theirs.thread_id = mine.thread_id and theirs.org_id = target
     where mine.org_id = me
     limit 1;
    if t is null then
      insert into public.threads default values returning id into t;
      insert into public.thread_participants (thread_id, org_id) values (t, me), (t, target);
    end if;
    insert into public.messages (thread_id, author_id, body) values (t, me, msg);
    sent := sent + 1;
  end loop;

  insert into public.admin_actions (staff_id, action, target_id, target_label, reason)
  values (me, 'broadcast', me, sent || ' ' || case audience when 'all' then 'organizations' when 'selected' then 'chosen organizations'
                                                            else audience end, left(msg, 200));
  return sent;
end $$;

-- Staff lists for /admin (empty for everyone else). The login email helps staff contact an organization.
create function public.admin_organizations(q text default '')
returns table (id uuid, handle text, name text, role public.org_role, email text, created_at timestamptz,
               suspended_at timestamptz, suspended_reason text, posts int, is_staff boolean)
language sql stable security definer set search_path = '' as $$
  select o.id, o.handle, o.name, o.role, u.email::text, o.created_at, o.suspended_at, o.suspended_reason,
         (select count(*)::int from public.posts p where p.owner_id = o.id),
         exists (select 1 from public.staff s where s.user_id = o.id)
    from public.organizations o
    left join auth.users u on u.id = o.id
   where public.is_staff()
     and (btrim(q) = '' or o.name ilike '%' || q || '%' or o.handle ilike '%' || q || '%' or u.email ilike '%' || q || '%')
   order by o.suspended_at desc nulls last, o.created_at desc
   limit 50
$$;

create function public.admin_posts(q text default '')
returns table (id uuid, title text, kind public.post_kind, status public.post_status, owner_name text,
               owner_handle text, created_at timestamptz, removed_at timestamptz, removed_reason text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.title, p.kind, p.status, o.name, o.handle, p.created_at, p.removed_at, p.removed_reason
    from public.posts p
    join public.organizations o on o.id = p.owner_id
   where public.is_staff() and (btrim(q) = '' or p.title ilike '%' || q || '%' or o.name ilike '%' || q || '%')
   order by p.removed_at desc nulls last, p.created_at desc
   limit 50
$$;

create function public.admin_log()
returns table (id bigint, staff_name text, action text, target_id uuid, target_label text, reason text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select a.id, coalesce(o.name, 'Deleted staff'), a.action, a.target_id, a.target_label, a.reason, a.created_at
    from public.admin_actions a
    left join public.organizations o on o.id = a.staff_id
   where public.is_staff()
   order by a.created_at desc
   limit 100
$$;

-- In-app account deletion (App Store and Google Play rule). Deleting the login deletes the organization page
-- and everything it created (on delete cascade). The app removes its uploaded images first.
create function public.delete_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ---------------------------------------------------------------- triggers: activity + notifications

create function public.on_message() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.threads
     set last_message_at = new.created_at,
         matched_at = coalesce(matched_at, case
           when (select count(distinct author_id) from public.messages where thread_id = new.thread_id) >= 2
           then new.created_at end)
   where id = new.thread_id;
  insert into public.notifications (recipient_id, actor_id, type, link, body)
  select tp.org_id, new.author_id, 'message', '/messages/' || new.thread_id,
         (select name from public.organizations where id = new.author_id) || ': ' || left(new.body, 80)
    from public.thread_participants tp
   where tp.thread_id = new.thread_id and tp.org_id <> new.author_id;
  return new;
end $$;
create trigger on_message after insert on public.messages for each row execute function public.on_message();

create function public.on_proposal() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  p public.posts;
begin
  select * into p from public.posts where id = new.post_id;
  if tg_op = 'INSERT' then
    insert into public.notifications (recipient_id, actor_id, type, link, body)
    values (p.owner_id, new.from_id, 'proposal', '/proposals',
            (select name from public.organizations where id = new.from_id) || ' proposed on "' || p.title || '"');
  elsif new.status is distinct from old.status then
    -- Tell the other side. Completion can come from either side of the deal.
    insert into public.notifications (recipient_id, actor_id, type, link, body)
    values (case when auth.uid() = new.from_id then p.owner_id else new.from_id end,
            case when auth.uid() = new.from_id then new.from_id else p.owner_id end,
            'proposal_status', '/proposals',
            case when new.status = 'completed'
                 then 'The deal for "' || p.title || '" is complete. Leave a review.'
                 else 'Your proposal for "' || p.title || '" is now ' || replace(new.status::text, '_', ' ') end);
  end if;
  return new;
end $$;
create trigger on_proposal after insert or update of status on public.proposals
  for each row execute function public.on_proposal();

create function public.on_follow() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, link, body)
  select new.org_id, new.follower_id, 'follow', '/org/' || o.handle, o.name || ' followed you'
    from public.organizations o where o.id = new.follower_id;
  return new;
end $$;
create trigger on_follow after insert on public.follows for each row execute function public.on_follow();

create function public.on_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, link, body)
  select new.reviewee_id, new.reviewer_id, 'review', '/org/' || o.handle,
         o.name || ' left you a ' || new.rating || '-star review'
    from public.organizations o where o.id = new.reviewer_id;
  return new;
end $$;
create trigger on_review after insert on public.reviews for each row execute function public.on_review();

-- Live messages, proposals, reviews, and notifications in the app.
alter publication supabase_realtime add table public.messages, public.notifications, public.proposals, public.reviews;
