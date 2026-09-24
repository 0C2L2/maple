begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users(id,email) values
  ('77777777-7777-4777-8777-777777777777','slug-admin@example.test'),
  ('88888888-8888-4888-8888-888888888888','slug-unrelated@example.test');
set local role authenticated;
set local request.jwt.claims = '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}';
insert into public.profiles(id,role,name,handle)
  values(auth.uid(),'organizer','Slug Admin','slug-admin');
select lives_ok($$insert into public.organizations(slug,name,type,created_by)
  values('immutable-org','Original name','event_company',auth.uid())$$,
  'authenticated creation with initial slug succeeds');
select is((select role::text from public.organization_members
  where org_id=(select id from public.organizations where slug='immutable-org')),
  'admin','test actor is organization admin');
select lives_ok($$update public.organizations set name='Updated name' where slug='immutable-org'$$,
  'admin can update name');
select is((select name from public.organizations where slug='immutable-org'),'Updated name','name update persists');
select lives_ok($$update public.organizations set about='Updated about' where slug='immutable-org'$$,
  'admin can update about');
select is((select about from public.organizations where slug='immutable-org'),'Updated about','about update persists');
select throws_ok($$update public.organizations set slug='changed-org' where slug='immutable-org'$$,
  '42501',null,'authenticated admin slug update denied by column grants');
select is((select count(*) from public.organizations where slug='immutable-org'),1::bigint,'original slug preserved');
select throws_ok($$insert into public.organizations(slug,name,type,created_by)
  values('immutable-org','Duplicate','brand',auth.uid())$$,
  '23505',null,'slug uniqueness unchanged');
select lives_ok($$update public.organizations set type='agency' where slug='immutable-org'$$,
  'admin can update type');
select ok(not has_table_privilege('authenticated','public.organizations','UPDATE'),'no broad table UPDATE grant');
select ok(not has_column_privilege('authenticated','public.organizations','slug','UPDATE'),'no slug UPDATE grant');
select ok(not has_function_privilege('authenticated','private.prevent_organization_slug_change()','EXECUTE'),
  'trigger function is not directly executable by clients');

set local request.jwt.claims = '{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated"}';
insert into public.profiles(id,role,name,handle)
  values(auth.uid(),'organizer','Unrelated','slug-unrelated');
with changed as (update public.organizations set name='Unauthorized' where slug='immutable-org' returning id)
select is((select count(*) from changed),0::bigint,'unrelated authenticated update affects zero rows');
select is((select name from public.organizations where slug='immutable-org'),'Updated name','unrelated user cannot alter organization');

-- Exercise the trigger independently of the revoked column grant, with the same
-- real authenticated admin/JWT. The temporary grant rolls back with this test.
reset role;
grant update (slug) on public.organizations to authenticated;
set local role authenticated;
set local request.jwt.claims = '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}';
select throws_ok($$update public.organizations set slug='changed-org' where slug='immutable-org'$$,
  '23514','Organization slug cannot be changed after creation.','trigger rejects admin mutation even with slug privilege');
select lives_ok($$update public.organizations set slug=slug where slug='immutable-org'$$,
  'trigger permits unchanged slug');
select is((select count(*) from public.organizations where slug='immutable-org'),1::bigint,'trigger preserves original URL');
select * from finish();
rollback;
