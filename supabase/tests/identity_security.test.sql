-- Run with supabase test db. Everything, including fixtures, rolls back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- Privileged fixture setup ONLY. Authorization assertions below change SQL role + JWT.
insert into auth.users (id, email) values
 ('11111111-1111-4111-8111-111111111111', 'organizer-a@example.test'),
 ('22222222-2222-4222-8222-222222222222', 'sponsor-b@example.test'),
 ('33333333-3333-4333-8333-333333333333', 'no-profile@example.test');
insert into public.profiles (id, role, handle, name) values
 ('22222222-2222-4222-8222-222222222222', 'sponsor', 'sponsor-b', 'Fixture B');
insert into public.user_roles (user_id, role) values
 ('22222222-2222-4222-8222-222222222222', 'admin');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select is(current_user::text, 'authenticated', 'application assertions use authenticated SQL role');
select is(auth.uid(), '11111111-1111-4111-8111-111111111111'::uuid, 'JWT resolves to User A');
select lives_ok($$insert into public.profiles (id,role,handle,name) values
 ('11111111-1111-4111-8111-111111111111','organizer','organizer-a','Fixture A')$$,
 'own profile insert with chosen role succeeds');
select throws_ok($$insert into public.profiles (id,role,handle,name) values
 ('22222222-2222-4222-8222-222222222222','organizer','stolen-profile','Stolen')$$,
 '42501', null, 'other profile insert rejected by RLS');
select throws_ok($$insert into public.profiles (id,role,handle,name) values
 ('11111111-1111-4111-8111-111111111111','sponsor','duplicate-profile','Duplicate')$$,
 '23505', null, 'one profile per Auth user');
select lives_ok($$update public.profiles set name='Updated A', headline='Organizer'
 where id='11111111-1111-4111-8111-111111111111'$$, 'own normal update succeeds');
select is((select name from public.profiles where id=auth.uid()), 'Updated A', 'own update persists');
with changed as (update public.profiles set name='Stolen'
 where id='22222222-2222-4222-8222-222222222222' returning id) select is((select count(*) from changed),
 0::bigint, 'other profile update affects zero rows under RLS');
select is((select name from public.profiles where id='22222222-2222-4222-8222-222222222222'),
 'Fixture B', 'other profile remains unchanged');
select throws_ok($$update public.profiles set role='sponsor' where id=auth.uid()$$,
 '42501', null, 'role change rejected');
select throws_ok($$update public.profiles set completeness=100 where id=auth.uid()$$,
 '42501', null, 'completeness update rejected');
select throws_ok($$insert into public.profiles (id,role,handle,name,completeness)
 values ('11111111-1111-4111-8111-111111111111','organizer','bad-insert','Bad',100)$$,
 '42501', null, 'completeness insert rejected');
select throws_ok($$update public.profiles set created_at='2000-01-01' where id=auth.uid()$$,
 '42501', null, 'profile timestamps cannot be forged');
select is((select completeness::integer from public.profiles where id=auth.uid()), 55,
 'protected completeness retains its computed score after rejected tampering');
select is((select role::text from public.profiles where id=auth.uid()), 'organizer',
 'protected role remains unchanged');
select throws_ok($$update public.profiles set handle='UpperCase' where id=auth.uid()$$,
 '23514', null, 'handle must be lowercase');
select throws_ok($$update public.profiles set handle='bad/handle' where id=auth.uid()$$,
 '23514', null, 'handle rejects URL-unsafe characters');
select throws_ok($$update public.profiles set handle='ab' where id=auth.uid()$$,
 '23514', null, 'handle minimum length enforced');
select throws_ok($$update public.profiles set handle=repeat('a',31) where id=auth.uid()$$,
 '23514', null, 'handle maximum length enforced');
select throws_ok($$update public.profiles set handle='sponsor-b' where id=auth.uid()$$,
 '23505', null, 'handle uniqueness enforced');
select throws_ok($$delete from public.profiles where id=auth.uid()$$,
 '42501', null, 'direct profile deletion denied');

select lives_ok($$insert into public.organizations (id,slug,name,type,domain,created_by) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','fixture-org','Fixture Organization','event_company','smallco.test',
 '11111111-1111-4111-8111-111111111111')$$, 'org creation with profile succeeds');
select results_eq($$select profile_id,role::text,verified_email from public.organization_members
 where org_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
 $$values ('11111111-1111-4111-8111-111111111111'::uuid,'admin'::text,false)$$,
 'creator becomes admin in same organization insert');
select ok(private.is_org_admin('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 'invoker helper recognizes creator under authenticated RLS');
select throws_ok($$insert into public.organizations (slug,name,type,created_by) values
 ('wrong-owner','Wrong Owner','brand','22222222-2222-4222-8222-222222222222')$$,
 '42501', null, 'wrong created_by rejected by RLS');
select throws_ok($$insert into public.organizations (slug,name,type,created_by,verified) values
 ('self-verified','Self Verified','brand','11111111-1111-4111-8111-111111111111',true)$$,
 '42501', null, 'verification cannot be set on organization insert');
select lives_ok($$update public.organizations set name='Updated Organization'
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$, 'org admin normal update succeeds');
select is((select name from public.organizations where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 'Updated Organization', 'organization update persists');
select throws_ok($$update public.organizations set verified=true
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
 '42501', null, 'org admin self-verification rejected');
select throws_ok($$update public.organizations set created_by='22222222-2222-4222-8222-222222222222'
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
 '42501', null, 'org admin cannot transfer creator identity');
select throws_ok($$delete from public.organizations where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
 '42501', null, 'direct organization deletion denied');

-- User B is not yet an organization member; operational admin is not org ownership.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select ok(not private.is_org_admin('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 'random user helper returns false without RLS recursion');
with changed as (update public.organizations set name='Taken Over'
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning id) select is((select count(*) from changed),
 0::bigint, 'random org update affects zero rows');
select is((select count(*) from public.organization_members), 0::bigint,
 'other users cannot enumerate memberships');
select throws_ok($$insert into public.organization_members (org_id,profile_id,role) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','admin')$$,
 '42501', null, 'privileged membership creation rejected');

set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select throws_ok($$insert into public.organizations (slug,name,type,created_by) values
 ('no-profile','No Profile','brand','33333333-3333-4333-8333-333333333333')$$,
 '23503', null, 'org creation without profile rejected by FK');
select is((select count(*) from public.organizations where slug='no-profile'), 0::bigint,
 'failed creation leaves no organization');

-- Privileged fixtures for member protection and reusable timestamp trigger checks.
reset role;
insert into public.organization_members (org_id,profile_id,role) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','member');
insert into public.organizations (id,slug,name,type,created_by,created_at,updated_at) values
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','timestamp-fixture','Timestamp Fixture','brand',
 '11111111-1111-4111-8111-111111111111','2000-01-01 00:00:00+00','2000-01-01 00:00:00+00');
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is((select role::text from public.organization_members where profile_id=auth.uid()), 'member',
 'member fixture is a real normal member');
select throws_ok($$update public.organization_members set role='admin' where profile_id=auth.uid()$$,
 '42501', null, 'member self-promotion rejected');
select throws_ok($$update public.organization_members set verified_email=true where profile_id=auth.uid()$$,
 '42501', null, 'verified_email self-assertion rejected');
select throws_ok($$delete from public.organization_members where profile_id=auth.uid()$$,
 '42501', null, 'membership deletion denied');
with changed as (update public.organizations set name='Member Takeover'
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning id) select is((select count(*) from changed),
 0::bigint, 'normal member cannot edit organization');

select throws_ok($$select * from public.user_roles$$, '42501', null, 'user_roles SELECT rejected');
select throws_ok($$insert into public.user_roles (user_id,role) values
 ('22222222-2222-4222-8222-222222222222','admin')$$, '42501', null, 'user_roles INSERT rejected');
select throws_ok($$update public.user_roles set role='admin' where user_id=auth.uid()$$,
 '42501', null, 'user_roles UPDATE rejected');
select throws_ok($$delete from public.user_roles where user_id=auth.uid()$$,
 '42501', null, 'user_roles DELETE rejected');
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select throws_ok($$insert into public.user_roles (user_id,role) values
 ('11111111-1111-4111-8111-111111111111','admin')$$, '42501', null, 'user cannot grant self Maple admin');
select lives_ok($$update public.organizations set about='Timestamp test'
 where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$, 'updated_at trigger permits normal write');
select ok((select updated_at > '2000-01-01 00:00:00+00'::timestamptz
 and created_at = '2000-01-01 00:00:00+00'::timestamptz
 from public.organizations where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
 'updated_at refreshed while created_at preserved');

-- Positive privileged backend operation: real service_role SQL context.
reset role;
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select is(current_user::text, 'service_role', 'privileged assertion uses service_role');
select lives_ok($$update public.organizations set verified=true
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$, 'service_role verification succeeds');
select ok((select verified from public.organizations where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 'service_role verification persisted');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok($$update public.organizations set about='Still verified'
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$, 'normal update of verified organization succeeds');
select ok((select verified from public.organizations where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 'unchanged domain preserves verification');
select lives_ok($$update public.organizations set domain='different.test'
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$, 'admin can change domain');
select ok(not (select verified from public.organizations where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 'domain change clears verified');

-- Force a membership failure inside this rolled-back test only: organization INSERT must roll back.
reset role;
create function pg_temp.reject_fixture_membership() returns trigger language plpgsql as $$
begin
  raise exception 'simulated membership failure' using errcode='23514';
end;
$$;
create trigger reject_fixture_membership before insert on public.organization_members
 for each row when (new.org_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid)
 execute function pg_temp.reject_fixture_membership();
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select throws_ok($$insert into public.organizations (id,slug,name,type,created_by) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','atomic-failure','Atomic Failure','brand',
 '11111111-1111-4111-8111-111111111111')$$, '23514', 'simulated membership failure',
 'membership failure aborts organization creation');
select is((select count(*) from public.organizations where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
 0::bigint, 'failed membership leaves no orphan organization');

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is(current_user::text, 'anon', 'anonymous assertions use anon SQL role');
select throws_ok($$insert into public.profiles (id,role,handle,name) values
 ('33333333-3333-4333-8333-333333333333','sponsor','anonymous-user','Anonymous')$$,
 '42501', null, 'anonymous profile insert rejected');
select lives_ok($$select * from public.profiles$$, 'anonymous base profile read allowed');
select lives_ok($$select * from public.organizations$$, 'anonymous organization read allowed');
select throws_ok($$select * from public.organization_members$$, '42501', null, 'anonymous membership read rejected');
select throws_ok($$select * from public.user_roles$$, '42501', null, 'anonymous app-role read rejected');
select throws_ok($$select private.is_org_admin('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,
 '42501', null, 'anonymous private helper access rejected');

-- Catalog checks supplement (do not replace) the real user operations above.
reset role;
select is((select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname in ('profiles','organizations','organization_members','user_roles') and c.relrowsecurity),
 4::bigint, 'RLS enabled on all four tables');
select ok(not has_table_privilege('authenticated','public.profiles','UPDATE')
 and has_column_privilege('authenticated','public.profiles','name','UPDATE')
 and not has_column_privilege('authenticated','public.profiles','role','UPDATE')
 and not has_column_privilege('authenticated','public.profiles','completeness','UPDATE'),
 'profile UPDATE uses safe column grants without broad table grant');
select ok(not has_table_privilege('authenticated','public.organizations','UPDATE')
 and has_column_privilege('authenticated','public.organizations','domain','UPDATE')
 and not has_column_privilege('authenticated','public.organizations','verified','UPDATE'),
 'organization UPDATE uses safe column grants');
select ok(not has_table_privilege('authenticated','public.user_roles','SELECT,INSERT,UPDATE,DELETE')
 and not has_table_privilege('anon','public.user_roles','SELECT,INSERT,UPDATE,DELETE'),
 'ordinary roles have no app-role table grants');
select ok(not has_function_privilege('authenticated','private.add_organization_creator()','EXECUTE')
 and not has_function_privilege('anon','private.add_organization_creator()','EXECUTE'),
 'creator trigger is not a callable client API');
select ok(has_table_privilege('service_role','public.organizations','UPDATE'), 'service_role retains explicit table UPDATE grant');
select is((select count(*) from information_schema.columns where table_schema='public'
 and table_name='profiles' and column_name in ('budget_band','is_premium')), 0::bigint,
 'no public budget or premium entitlement fields');
select ok(not has_table_privilege('service_role','public.organizations','TRUNCATE,TRIGGER,REFERENCES'), 'service_role has only the explicitly required CRUD privileges');
select is(current_setting('TimeZone'), 'UTC', 'local database timezone is UTC');
select * from finish();
rollback;
