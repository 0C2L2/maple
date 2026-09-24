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
  online          boolean not null default false,
  deadline        date,
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
  slots      int check (slots > 0)
);
create index post_tiers_post_idx on public.post_tiers (post_id, position);

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

-- ---------------------------------------------------------------- row level security

alter table public.organizations enable row level security;
alter table public.posts enable row level security;
alter table public.post_tiers enable row level security;
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

-- Public content: anyone can read.
create policy "organizations are public" on public.organizations for select using (true);
create policy "open posts are public" on public.posts for select
  using (status <> 'draft' or owner_id = auth.uid());
create policy "tiers are public" on public.post_tiers for select using (true);
create policy "reviews are public" on public.reviews for select using (true);
create policy "follows are public" on public.follows for select using (true);

-- Own rows: each organization writes only its own.
create policy "create own organization" on public.organizations for insert to authenticated with check (id = auth.uid());
create policy "edit own organization" on public.organizations for update to authenticated using (id = auth.uid());
create policy "create own post" on public.posts for insert to authenticated with check (owner_id = auth.uid());
create policy "edit own post" on public.posts for update to authenticated using (owner_id = auth.uid());
create policy "delete own post" on public.posts for delete to authenticated using (owner_id = auth.uid());
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

-- Private: proposals, conversations, notifications, view rollups.
create policy "see own and received proposals" on public.proposals for select to authenticated
  using (from_id = auth.uid() or public.owns_post(post_id));
create policy "owner moves proposal status" on public.proposals for update to authenticated
  using (public.owns_post(post_id));
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
  with check (author_id = auth.uid() and public.is_thread_participant(thread_id));
create policy "see own notifications" on public.notifications for select to authenticated
  using (recipient_id = auth.uid());
create policy "mark own notifications read" on public.notifications for update to authenticated
  using (recipient_id = auth.uid());

-- Column rules. Handles and roles are permanent (WEBSITE_PLAN §2); threads, participants, proposals,
-- reviews, and notifications are only created by the functions and triggers below.
revoke insert, update, delete on public.threads, public.thread_participants, public.proposals, public.reviews, public.notifications
  from anon, authenticated;
revoke update on public.organizations from anon, authenticated;
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
  if msg is null then raise exception 'Write a message with your proposal' using errcode = '22004'; end if;
  if char_length(msg) > 2000 then raise exception 'Proposal message is too long' using errcode = '22001'; end if;
  if amount_cents is not null and amount_cents < 0 then raise exception 'Amount is invalid' using errcode = '22003'; end if;
  select * into p from public.posts where id = post and status = 'open';
  if not found then raise exception 'This post is closed' using errcode = 'P0002'; end if;
  if p.owner_id = me then raise exception 'You can''t propose to your own post' using errcode = '42501'; end if;
  if tier_id is not null and not exists (select 1 from public.post_tiers where id = tier_id and post_id = p.id) then
    raise exception 'That tier does not belong to this post' using errcode = 'P0002';
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
  values (po.id, pr.id, me, other, rating, nullif(btrim(coalesce(body, '')), ''))
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

create function public.search_posts(q text default '', filters jsonb default '{}', page int default 0)
returns table (id uuid, kind public.post_kind, title text, owner_id uuid, owner_name text,
               owner_handle text, owner_logo_url text, categories public.category[],
               regions text[], budget_band public.budget_band, attendance_band public.attendance_band,
               deadline date, proposal_count int, score real, boosted boolean)
language sql stable set search_path = '' as $$
  select p.id, p.kind, p.title, p.owner_id, org.name, org.handle, org.logo_url,
         p.categories, p.regions, p.budget_band, p.attendance_band, p.deadline,
         (select count(*)::int from public.proposals pr where pr.post_id = p.id),
         (case when btrim(q) = '' then 0 else ts_rank(p.search, websearch_to_tsquery('english', q)) end)::real,
         false -- ponytail: Boost slots (MVP §7.2) arrive with Boost in v1.1
    from public.posts p
    join public.organizations org on org.id = p.owner_id
   where p.status = 'open'
     and (btrim(q) = '' or p.search @@ websearch_to_tsquery('english', q))
     and (filters->>'kind' is null or p.kind = (filters->>'kind')::public.post_kind)
     and (filters->>'category' is null or (filters->>'category')::public.category = any (p.categories))
     and (filters->>'region' is null or filters->>'region' = any (p.regions))
     and (filters->>'budget_band' is null or p.budget_band = (filters->>'budget_band')::public.budget_band)
     and (filters->>'attendance_band' is null or p.attendance_band = (filters->>'attendance_band')::public.attendance_band)
   order by 14 desc, p.created_at desc
   limit 20 offset greatest(page, 0) * 20
$$;

create function public.search_organizations(q text default '', filters jsonb default '{}', page int default 0)
returns table (id uuid, handle text, name text, tagline text, role public.org_role, kind public.org_kind,
               location text, logo_url text)
language sql stable set search_path = '' as $$
  select o.id, o.handle, o.name, o.tagline, o.role, o.kind, o.location, o.logo_url
    from public.organizations o
   where (btrim(q) = '' or o.name ilike '%' || q || '%' or o.tagline ilike '%' || q || '%' or o.handle ilike '%' || q || '%')
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
    insert into public.notifications (recipient_id, actor_id, type, link, body)
    values (new.from_id, p.owner_id, 'proposal_status', '/proposals',
            'Your proposal for "' || p.title || '" is now ' || replace(new.status::text, '_', ' '));
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
