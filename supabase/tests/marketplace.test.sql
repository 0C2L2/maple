-- Maple marketplace (D-026) pgTAP tests: posts, proposals, reviews, RLS, and the core loop.
-- Run: supabase test db --local
begin;
select plan(60);

-- ---------------------------------------------------------------- schema: new tables exist
select has_table('public', 'organizations', 'organizations exists');
select has_table('public', 'posts', 'posts exists');
select has_table('public', 'post_tiers', 'post_tiers exists');
select has_table('public', 'proposals', 'proposals exists');
select has_table('public', 'reviews', 'reviews exists');
select has_table('public', 'saved_posts', 'saved_posts exists');
select has_table('public', 'follows', 'follows exists');
select has_table('public', 'threads', 'threads exists');
select has_table('public', 'thread_participants', 'thread_participants exists');
select has_table('public', 'messages', 'messages exists');
select has_table('public', 'notifications', 'notifications exists');
select has_table('public', 'post_views', 'post_views exists');
select has_table('public', 'org_views', 'org_views exists');

-- Old LinkedIn-era tables are gone
select hasnt_table('public', 'opportunities', 'opportunities dropped');
select hasnt_table('public', 'pitches', 'pitches dropped');
select hasnt_table('public', 'events', 'separate events dropped');
select hasnt_table('public', 'comments', 'comments dropped');
select hasnt_table('public', 'reactions', 'reactions dropped');

-- RLS is on everywhere (users write only their own rows)
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and rowsecurity),
  20,
  'RLS enabled on all 20 tables'
);

-- Enum values match SHARED_CONTRACTS §1
select set_eq(
  $$ select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'post_kind' $$,
  array['event', 'sponsor'],
  'post_kind values'
);
select set_eq(
  $$ select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'proposal_status' $$,
  array['new', 'shortlisted', 'in_talks', 'won', 'declined', 'completed'],
  'proposal_status values incl. completed'
);

-- ---------------------------------------------------------------- fixtures: two organizations
insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');
insert into public.organizations (id, role, kind, handle, name, categories) values
  ('11111111-1111-1111-1111-111111111111', 'organizer', 'event_company', 'hackcity', 'HackCity', '{hackathon}'),
  ('22222222-2222-2222-2222-222222222222', 'sponsor', 'company', 'acme-cloud', 'Acme Cloud', '{hackathon}'),
  ('33333333-3333-3333-3333-333333333333', 'organizer', 'community', 'meetupco', 'MeetupCo', '{meetup}');

-- ---------------------------------------------------------------- organizer posts an event (RLS: own row)
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
insert into public.posts (kind, title, body, categories, regions, budget_band, supports, benefits, starts_on, city)
  values ('event', 'Sponsor HackCity 2026', 'A 500-dev hackathon.', '{hackathon}', '{boston}', '1k_5k', '{cash,venue}', 'Logo + booth', '2026-11-14', 'Boston');
reset role;
-- (insert above ran as the organizer through RLS: owner_id defaulted to auth.uid())
select is(
  (select count(*)::int from public.posts where owner_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'organizer created one post through RLS'
);

-- An organization may post both kinds (D-028), and a post's kind is permanent
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select lives_ok(
  $$ insert into public.posts (kind, title, body, status) values ('sponsor', 'We also sponsor', 'x', 'draft') $$,
  'an organizer can also publish a sponsor post'
);
select throws_ok(
  $$ update public.posts set kind = 'sponsor' where owner_id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  'permission denied for table posts',
  'a post''s kind cannot be changed'
);
reset role;

-- Non-owner cannot edit it (RLS: zero rows touched)
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select lives_ok(
  $$ update public.posts set title = 'Hijacked' where owner_id = '11111111-1111-1111-1111-111111111111' $$,
  'non-owner update runs without error'
);
select is(
  (select title from public.posts where owner_id = '11111111-1111-1111-1111-111111111111'),
  'Sponsor HackCity 2026',
  'non-owner update touched nothing'
);
reset role;

-- ---------------------------------------------------------------- search finds open posts, hides drafts
select is(
  (select count(*)::int from public.search_posts('', '{}', 0)),
  1,
  'search_posts finds the open post'
);
insert into public.posts (kind, title, body, status, owner_id)
  values ('sponsor', 'Quiet draft', 'Nobody sees this yet.', 'draft', '22222222-2222-2222-2222-222222222222');
select is(
  (select count(*)::int from public.search_posts('', '{}', 0)),
  1,
  'search_posts hides drafts'
);
select is(
  (select count(*)::int from public.search_organizations('hack', '{}', 0)),
  1,
  'search_organizations finds HackCity'
);

-- ---------------------------------------------------------------- sponsor proposes (one per post)
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select lives_ok(
  $$ select public.send_proposal(
    (select id from public.posts where title = 'Sponsor HackCity 2026'),
    'We want the Gold tier.', null, 500000) $$,
  'send_proposal creates a proposal + thread'
);
select is(
  (select count(*)::int from public.proposals),
  1,
  'exactly one proposal row'
);
select throws_ok(
  $$ select public.send_proposal(
    (select id from public.posts where title = 'Sponsor HackCity 2026'),
    'Trying twice.', null, null) $$,
  '23505',
  'duplicate key value violates unique constraint "proposals_post_id_from_id_key"',
  'second proposal on the same post is rejected'
);
select throws_ok(
  $$ select public.send_proposal(
    (select id from public.posts where title = 'Quiet draft'),
    'Proposing to a draft.', null, null) $$,
  'P0002',
  'This post is closed',
  'proposing to a draft is rejected'
);
-- Nobody proposes to their own post
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select throws_ok(
  $$ select public.send_proposal(
    (select id from public.posts where title = 'Sponsor HackCity 2026'), 'To myself.', null, null) $$,
  '42501',
  'You can''t propose to your own post',
  'the owner cannot propose to its own post'
);
reset role;

-- Proposal counts on cards are public totals, not just the viewer's own rows
set role anon;
select is(
  (select proposal_count from public.search_posts('', '{}', 0) where title = 'Sponsor HackCity 2026'),
  1,
  'signed-out visitors see the real proposal count'
);
reset role;

-- The owner moves it to won through RLS, but can't complete it directly
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select throws_ok(
  $$ update public.proposals set status = 'completed' $$,
  '42501',
  'new row violates row-level security policy for table "proposals"',
  'the owner cannot mark a deal completed directly'
);
select lives_ok($$ update public.proposals set status = 'won' $$, 'the owner marks the proposal won');

-- Either side completes it, but only after the event
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
reset role;
update public.posts set starts_on = current_date + 30 where title = 'Sponsor HackCity 2026';
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select throws_ok(
  $$ select public.complete_proposal((select id from public.proposals limit 1)) $$,
  '22023',
  null,
  'a deal cannot be completed before the event'
);
reset role;
update public.posts set starts_on = current_date - 1 where title = 'Sponsor HackCity 2026';
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select lives_ok(
  $$ select public.complete_proposal((select id from public.proposals limit 1)) $$,
  'sponsor side can complete a won deal after the event'
);
reset role;
select is(
  (select count(*)::int from public.notifications
    where recipient_id = '11111111-1111-1111-1111-111111111111' and body like '%is complete%'),
  1,
  'completing notifies the other side (the post owner)'
);
select is(
  (select status::text from public.proposals limit 1),
  'completed',
  'proposal is completed'
);

-- ---------------------------------------------------------------- reviews open only after completion, one per side
select throws_ok(
  $$ insert into public.reviews (post_id, proposal_id, reviewer_id, reviewee_id, rating)
     values ((select id from public.posts where title = 'Quiet draft'),
             (select id from public.proposals limit 1),
             '22222222-2222-2222-2222-222222222222',
             '11111111-1111-1111-1111-111111111111', 9) $$,
  '23514',
  'new row for relation "reviews" violates check constraint "reviews_rating_check"',
  'rating outside 1-5 is rejected'
);
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select lives_ok(
  $$ select public.leave_review((select id from public.proposals limit 1), 5, 'Great crowd.') $$,
  'sponsor leaves a review'
);
select throws_ok(
  $$ select public.leave_review((select id from public.proposals limit 1), 4, 'Again.') $$,
  '23505',
  'duplicate key value violates unique constraint "reviews_proposal_id_reviewer_id_key"',
  'same side cannot review twice'
);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select lives_ok(
  $$ select public.leave_review((select id from public.proposals limit 1), 4, '') $$,
  'organizer leaves a star-only review (the written part is optional)'
);
reset role;
select is(
  (select count(*)::int from public.reviews),
  2,
  'one review per side'
);
select is(
  (select completed_deals from public.org_stats('11111111-1111-1111-1111-111111111111')),
  1,
  'org_stats counts the completed deal for anyone'
);
select is(
  (select rating from public.org_stats('11111111-1111-1111-1111-111111111111')),
  5.0,
  'org_stats averages every review'
);

-- ---------------------------------------------------------------- Find: best matches and filters
-- Find only lists events that haven't ended, so move this one back into the future.
update public.posts set starts_on = current_date + 30 where title = 'Sponsor HackCity 2026';
select cmp_ok(
  (select score from public.search_posts('', '{"match": "22222222-2222-2222-2222-222222222222"}', 0) limit 1),
  '>',
  0::real,
  'best matches rank a post that shares an event type'
);
select is(
  (select count(*)::int from public.search_posts('', '{"match": "11111111-1111-1111-1111-111111111111"}', 0)),
  0,
  'best matches hide your own posts'
);
select is(
  (select count(*)::int from public.search_posts('', '{"categories": ["conference", "hackathon"]}', 0)),
  1,
  'several event types match any of them'
);
select is(
  (select count(*)::int from public.search_posts('', '{"categories": ["conference"]}', 0)),
  0,
  'an unmatched event type filters the post out'
);

-- ---------------------------------------------------------------- views, saves, notifications
-- Really signed out: clear the user left over from the steps above (the claim lasts for the transaction).
select set_config('request.jwt.claim.sub', '', true);
select lives_ok(
  $$ select public.record_post_view((select id from public.posts where title = 'Sponsor HackCity 2026')) $$,
  'record_post_view is a no-op for anonymous visitors'
);
select is((select count(*)::int from public.post_views), 0, 'no anonymous view rows');
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select lives_ok(
  $$ select public.record_post_view((select id from public.posts where title = 'Sponsor HackCity 2026')) $$,
  'viewer records a post view'
);
select lives_ok(
  $$ select public.record_post_view((select id from public.posts where title = 'Sponsor HackCity 2026')) $$,
  'repeat view same day is a no-op'
);
select is((select count(*)::int from public.post_views), 1, 'one view row per viewer per day');
select lives_ok(
  $$ insert into public.saved_posts (post_id) values ((select id from public.posts where title = 'Sponsor HackCity 2026')) $$,
  'viewer saves the post'
);
select throws_ok(
  $$ insert into public.saved_posts (post_id) values ((select id from public.posts where title = 'Sponsor HackCity 2026')) $$,
  '23505',
  'duplicate key value violates unique constraint "saved_posts_pkey"',
  'duplicate save is rejected'
);
reset role;
select cmp_ok(
  (select count(*)::int from public.notifications),
  '>=',
  3,
  'proposal + message + review notifications exist'
);

select * from finish();
rollback;
