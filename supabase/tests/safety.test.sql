-- Maple safety pgTAP tests: blocks, reports, staff moderation, account deletion, Terms acceptance.
-- Run: supabase test db --local
begin;
select plan(42);

select has_table('public', 'staff', 'staff exists');
select has_table('public', 'reports', 'reports exists');
select has_table('public', 'blocks', 'blocks exists');

-- ---------------------------------------------------------------- fixtures: organizer, sponsor, staff
insert into auth.users (id) values ('aaaaaaaa-0000-0000-0000-000000000001'), ('aaaaaaaa-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000003'), ('aaaaaaaa-0000-0000-0000-000000000004');
insert into public.organizations (id, role, kind, handle, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'organizer', 'community', 'org-a', 'Org A'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'sponsor', 'company', 'sponsor-b', 'Sponsor B'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'organizer', 'community', 'maple-staff', 'Maple'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'organizer', 'community', 'bad-co', 'Bad Co');
insert into public.staff values ('aaaaaaaa-0000-0000-0000-000000000003');
insert into public.posts (kind, title, owner_id) values ('event', 'Org A hackathon', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('event', 'Bad post', 'aaaaaaaa-0000-0000-0000-000000000004');

select isnt(
  (select terms_accepted_at from public.organizations where handle = 'sponsor-b'),
  null,
  'creating a page records when the Terms were accepted'
);

-- ---------------------------------------------------------------- blocks work both ways
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
select lives_ok(
  $$ select public.start_conversation('aaaaaaaa-0000-0000-0000-000000000002') $$,
  'A starts a conversation with B'
);
select lives_ok(
  $$ insert into public.messages (thread_id, body) values ((select thread_id from public.thread_participants
       where org_id = 'aaaaaaaa-0000-0000-0000-000000000001' limit 1), 'Hello') $$,
  'A can message B before any block'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', true);
select lives_ok(
  $$ insert into public.blocks (blocked_id) values ('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'B blocks A'
);
select throws_ok(
  $$ select public.send_proposal((select id from public.posts where title = 'Org A hackathon'), 'Hi', null, null) $$,
  '42501',
  'You can''t send proposals to this organization',
  'the blocker cannot propose to the blocked organization'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
select throws_ok(
  $$ insert into public.messages (thread_id, body) values ((select thread_id from public.thread_participants
       where org_id = 'aaaaaaaa-0000-0000-0000-000000000001' limit 1), 'Still there?') $$,
  '42501',
  'new row violates row-level security policy for table "messages"',
  'the blocked side cannot message in an existing conversation'
);
select throws_ok(
  $$ select public.start_conversation('aaaaaaaa-0000-0000-0000-000000000002') $$,
  '42501',
  'You can''t message this organization',
  'the blocked side cannot start a conversation'
);
select is((select count(*)::int from public.blocks), 0, 'the blocked side cannot read the block row');
select ok(public.blocked_with('aaaaaaaa-0000-0000-0000-000000000002'), 'but the app can tell messaging is off');

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', true);
select lives_ok($$ delete from public.blocks $$, 'B unblocks A');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
select lives_ok(
  $$ insert into public.messages (thread_id, body) values ((select thread_id from public.thread_participants
       where org_id = 'aaaaaaaa-0000-0000-0000-000000000001' limit 1), 'Welcome back') $$,
  'messaging works again after unblocking'
);

-- ---------------------------------------------------------------- reports
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', true);
select lives_ok(
  $$ insert into public.reports (target_type, target_id, reason, details)
     values ('post', (select id from public.posts where title = 'Org A hackathon'), 'spam', 'Same post 10 times') $$,
  'B reports the post'
);
select throws_ok(
  $$ insert into public.reports (target_type, target_id, reason)
     values ('post', (select id from public.posts where title = 'Org A hackathon'), 'spam') $$,
  '23505',
  'duplicate key value violates unique constraint "reports_reporter_id_target_type_target_id_key"',
  'the same organization reports the same thing once'
);
select throws_ok(
  $$ update public.reports set status = 'dismissed' $$,
  '42501',
  'permission denied for table reports',
  'reporters cannot change a report''s status'
);
select is((select count(*)::int from public.open_reports()), 0, 'non-staff see no report queue');
select throws_ok(
  $$ select public.resolve_report((select id from public.reports limit 1), true) $$,
  '42501',
  'Staff only',
  'non-staff cannot resolve reports'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000003', true);
select is(
  (select target_text from public.open_reports() limit 1),
  'Org A hackathon',
  'staff see the report with what was reported'
);
select lives_ok(
  $$ select public.resolve_report((select id from public.open_reports() limit 1), true) $$,
  'staff remove the reported post'
);
reset role;
select isnt((select removed_at from public.posts where title = 'Org A hackathon'), null, 'the post is taken down, not deleted');
select is((select status from public.reports limit 1), 'removed', 'the report is closed as removed');

-- ---------------------------------------------------------------- admin: suspend, take down, log
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', true);
select throws_ok(
  $$ select public.admin_set_suspended('aaaaaaaa-0000-0000-0000-000000000004', true, 'Spam') $$,
  '42501', 'Staff only', 'only staff can suspend'
);
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000003', true);
select throws_ok(
  $$ select public.admin_set_suspended('aaaaaaaa-0000-0000-0000-000000000004', true, '') $$,
  '22023', 'Give a reason', 'suspending needs a reason'
);
select lives_ok(
  $$ select public.admin_set_suspended('aaaaaaaa-0000-0000-0000-000000000004', true, 'Scam posts') $$,
  'staff suspend an organization'
);
select throws_ok(
  $$ select public.admin_set_suspended('aaaaaaaa-0000-0000-0000-000000000003', true, 'x') $$,
  '22023', 'Staff accounts can''t be suspended', 'staff cannot be suspended'
);
reset role;
select isnt(
  (select banned_until from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000004'),
  null,
  'the suspended login is banned'
);
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', true);
select is((select count(*)::int from public.posts where title = 'Bad post'), 0, 'a suspended organization''s posts are hidden');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000004', true);
select throws_ok(
  $$ insert into public.posts (kind, title) values ('event', 'Sneaky') $$,
  '42501', null, 'a suspended organization cannot post'
);
select is((select count(*)::int from public.posts where title = 'Bad post'), 1, 'the suspended owner still sees its own post');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000003', true);
select lives_ok(
  $$ select public.admin_set_suspended('aaaaaaaa-0000-0000-0000-000000000004', false) $$,
  'staff restore the organization'
);
select lives_ok(
  $$ select public.admin_set_post_removed((select id from public.posts where title = 'Bad post'), true, 'Misleading') $$,
  'staff take a post down'
);
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', true);
select is((select count(*)::int from public.posts where title = 'Bad post'), 0, 'a taken-down post is hidden from others');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000003', true);
select cmp_ok((select count(*)::int from public.admin_log()), '>=', 4, 'the admin log records each action');
select is(public.admin_broadcast('sponsors', null, 'Welcome to Maple!'), 1, 'staff message every sponsor');
select is(
  public.admin_broadcast('selected', array['aaaaaaaa-0000-0000-0000-000000000001']::uuid[], 'Hello Org A'),
  1,
  'staff message the organizations they choose'
);
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', true);
select is(
  (select count(*)::int from public.messages where author_id = 'aaaaaaaa-0000-0000-0000-000000000003'),
  1,
  'the sponsor finds the message in its conversations'
);
select throws_ok($$ select public.admin_broadcast('all', null, 'Hi') $$, '42501', 'Staff only', 'only staff can broadcast');
reset role;

-- ---------------------------------------------------------------- account deletion
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
select lives_ok($$ select public.delete_account() $$, 'A deletes its account');
reset role;
select is(
  (select count(*)::int from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0,
  'the login is deleted'
);
select is(
  (select count(*)::int from public.messages where author_id = 'aaaaaaaa-0000-0000-0000-000000000001')
    + (select count(*)::int from public.organizations where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0,
  'the organization page and its messages go with it'
);

select * from finish();
rollback;
