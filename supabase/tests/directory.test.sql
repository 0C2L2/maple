-- Maple directory pgTAP tests: Find sponsors, showcases, category counts, deadline sort.
-- Run: supabase test db --local
begin;
select plan(19);

insert into auth.users (id) values ('bbbbbbbb-0000-0000-0000-000000000001'), ('bbbbbbbb-0000-0000-0000-000000000002'),
  ('bbbbbbbb-0000-0000-0000-000000000003');
insert into public.organizations (id, role, kind, handle, name, categories) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'organizer', 'company', 'dual-co', 'Dual Co', '{hackathon}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'organizer', 'community', 'plain-co', 'Plain Co', '{meetup}'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'sponsor', 'company', 'third-co', 'Third Co', '{hackathon}');
-- Pitch fixtures: a passed deadline, a finished event, and an event with a one-slot tier
insert into public.posts (id, kind, title, owner_id, deadline, starts_on) values
  ('cccccccc-0000-0000-0000-000000000001', 'event', 'Expired call', 'bbbbbbbb-0000-0000-0000-000000000001', current_date - 1, null),
  ('cccccccc-0000-0000-0000-000000000002', 'event', 'Finished event', 'bbbbbbbb-0000-0000-0000-000000000001', null, current_date - 3),
  ('cccccccc-0000-0000-0000-000000000003', 'event', 'Tiered event', 'bbbbbbbb-0000-0000-0000-000000000001', null, current_date + 10);
insert into public.post_tiers (id, post_id, name, slots, deliverables) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', 'Gold', 1, '{booth,talk}');
insert into public.posts (kind, title, owner_id, categories, deadline) values
  ('event', 'Dual event', 'bbbbbbbb-0000-0000-0000-000000000001', '{hackathon}', current_date + 20),
  ('sponsor', 'Dual sponsors', 'bbbbbbbb-0000-0000-0000-000000000001', '{hackathon}', current_date + 5),
  ('event', 'Plain event', 'bbbbbbbb-0000-0000-0000-000000000002', '{meetup}', null);

-- Find sponsors lists an organizer that also has an open sponsor post (D-028), not a plain organizer
select is(
  (select array_agg(handle order by handle) from public.search_sponsors('', '{}', 0) where handle in ('dual-co', 'plain-co')),
  array['dual-co'],
  'search_sponsors lists organizations with an open sponsor post'
);
select is(
  (select open_sponsor_posts from public.search_sponsors('dual', '{}', 0)),
  1,
  'search_sponsors counts open sponsor posts'
);

select cmp_ok(
  (select posts from public.category_counts() where category = 'hackathon'),
  '>=',
  2,
  'category_counts counts open posts per event type'
);
select is(
  (select title from public.search_posts('', '{"sort": "deadline"}', 0) where title like 'Dual%' or title = 'Plain event' limit 1),
  'Dual sponsors',
  'sort=deadline puts the soonest deadline first'
);

-- Showcases: public, and only the owner writes them
set role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000001', true);
select lives_ok(
  $$ insert into public.showcases (title, summary, facts) values ('Dual Hack 2026', 'It happened.', '[{"label":"Teams","value":"12"}]') $$,
  'an organization adds its own showcase'
);
select throws_ok(
  $$ insert into public.showcases (org_id, title) values ('bbbbbbbb-0000-0000-0000-000000000002', 'Not mine') $$,
  '42501',
  'new row violates row-level security policy for table "showcases"',
  'nobody adds a showcase for another organization'
);
select throws_ok(
  $$ insert into public.showcases (title, cover_url) values ('Bad image', 'https://example.com/x.png') $$,
  '23514',
  null,
  'showcase images must live in Maple storage'
);
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', true);
select lives_ok(
  $$ update public.showcases set title = 'Hijacked' $$,
  'another organization''s update runs'
);
reset role;
set role anon;
select is(
  (select title from public.showcases where title like 'Dual%'),
  'Dual Hack 2026',
  'showcases are public, and the other organization changed nothing'
);
reset role;

-- ---------------------------------------------------------------- the pitch: deadlines, finished events, slots, files
set role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', true);
select throws_ok(
  $$ select public.send_proposal('cccccccc-0000-0000-0000-000000000001', 'Late', null, null) $$,
  '22023', null, 'proposals after the deadline are refused'
);
select throws_ok(
  $$ select public.send_proposal('cccccccc-0000-0000-0000-000000000002', 'Too late', null, null) $$,
  '22023', 'This event is over', 'proposals to a finished event are refused'
);
select is(
  (select count(*)::int from public.search_posts('', '{}', 0) where title in ('Expired call', 'Finished event')),
  0,
  'Find hides posts past their deadline or event'
);
select lives_ok(
  $$ select public.send_proposal('cccccccc-0000-0000-0000-000000000003', 'Gold please', 'dddddddd-0000-0000-0000-000000000001', null) $$,
  'a proposal can pick a tier with a free slot'
);
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000001', true);
select lives_ok($$ update public.proposals set status = 'won' $$, 'the owner marks it won');
select is((select taken from public.tier_slots('cccccccc-0000-0000-0000-000000000003')), 1, 'tier_slots counts the won slot');
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000003', true);
select throws_ok(
  $$ select public.send_proposal('cccccccc-0000-0000-0000-000000000003', 'Gold too', 'dddddddd-0000-0000-0000-000000000001', null) $$,
  '22023', 'That tier is sold out', 'a sold-out tier refuses new proposals'
);
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000001', true);
select throws_ok(
  $$ insert into public.post_tiers (post_id, name, deliverables) values ('cccccccc-0000-0000-0000-000000000003', 'Odd', '{free_beer}') $$,
  '23514', null, 'deliverables must come from the list'
);
select lives_ok(
  $$ insert into public.post_files (post_id, kind, name, path, size)
     values ('cccccccc-0000-0000-0000-000000000003', 'deck', 'Deck.pdf', 'bbbbbbbb-0000-0000-0000-000000000001/deck.pdf', 1000) $$,
  'the owner attaches a document'
);
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', true);
select throws_ok(
  $$ insert into public.post_files (post_id, kind, name, path, size)
     values ('cccccccc-0000-0000-0000-000000000003', 'deck', 'Fake.pdf', 'bbbbbbbb-0000-0000-0000-000000000002/x.pdf', 1000) $$,
  '42501', null, 'nobody attaches documents to another organization''s post'
);
reset role;

select * from finish();
rollback;
