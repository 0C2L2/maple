begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,email) values('11111111-1111-4111-8111-111111111111','explore-o@test.local'),('22222222-2222-4222-8222-222222222222','explore-s@test.local');
insert into public.profiles(id,role,name,handle) values('11111111-1111-4111-8111-111111111111','organizer','Organizer','explore-o'),('22222222-2222-4222-8222-222222222222','sponsor','Sponsor','explore-s');
insert into public.organizations(id,name,slug,type,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Organizer','explore-org','event_company','11111111-1111-4111-8111-111111111111'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Sponsor','explore-sponsor','brand','22222222-2222-4222-8222-222222222222');
insert into public.events(id,org_id,created_by,title,slug,format,status,starts_at,ends_at,timezone,categories,audience_types,attendance_band)
select md5('event'||n)::uuid,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Event '||n,'explore-event-'||n,'online',case when n=2 then 'draft'::event_status else 'published'::event_status end,now()+case when n=3 then interval '-2 days' else interval '2 days' end,now()+case when n=3 then interval '-1 day' else interval '3 days' end,'Asia/Seoul',array['hackathon'],array['developers'],'200-999' from generate_series(1,3)n;
insert into public.opportunities(id,type,event_id,owner_org_id,created_by,title,slug,status)
select md5('package'||n)::uuid,'package',md5('event'||case when n<=3 then n else 1 end)::uuid,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Package '||n,'package-'||n,case when n=4 then 'draft'::opportunity_status else 'published'::opportunity_status end from generate_series(1,64)n;
insert into public.opportunity_tiers(opportunity_id,name,price_minor,currency,in_kind,benefits,sort_order)
select id,'Primary',1000,'USD',false,array['Logo'],0 from public.opportunities;
insert into public.opportunity_tiers(opportunity_id,name,in_kind,benefits,sort_order)
select id,'Secondary',true,array['Credits'],1 from public.opportunities;
insert into public.opportunities(id,type,owner_org_id,created_by,title,slug,status,created_at)
select md5('call'||n)::uuid,'call','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','Call '||n,'call-'||n,case when n=1 then 'draft'::opportunity_status else 'published'::opportunity_status end,now()+n*interval '1 second' from generate_series(1,62)n;
insert into public.opportunity_call_details(opportunity_id,target_categories,target_regions,target_audience_types,target_attendance_bands)
select id,array['hackathon'],array['asia'],array['developers'],array['200-999'] from public.opportunities where type='call';
insert into public.opportunity_call_budgets(opportunity_id,budget_band) select id,'25k_plus' from public.opportunities where type='call';
set constraints all immediate;

insert into auth.users(id,email) values('33333333-3333-4333-8333-333333333333','pitch-stranger@test.local');
insert into public.profiles(id,role,name,handle) values('33333333-3333-4333-8333-333333333333','sponsor','Stranger','pitch-stranger');
set local role authenticated;
set local request.jwt.claims='{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select lives_ok($$insert into public.pitches(opportunity_id) values(md5('package1')::uuid)$$,'Sponsor to published package, NULL note');
select is((select from_id from public.pitches where opportunity_id=md5('package1')::uuid),'22222222-2222-4222-8222-222222222222'::uuid,'from_id defaults to authenticated sender');
select ok((select note is null from public.pitches where opportunity_id=md5('package1')::uuid),'NULL note retained');
select throws_ok($$insert into public.pitches(opportunity_id) values(md5('package1')::uuid)$$,'23505',null,'duplicate rejected by UNIQUE');
select throws_ok($$insert into public.pitches(opportunity_id,from_id) values(md5('package5')::uuid,'11111111-1111-4111-8111-111111111111')$$,'42501',null,'spoofed from_id denied');
select throws_ok($$insert into public.pitches(opportunity_id) values(md5('call2')::uuid)$$,'42501',null,'Sponsor to Call denied');
select throws_ok($$insert into public.pitches(opportunity_id) values(md5('package4')::uuid)$$,'42501',null,'draft package denied');
select throws_ok($$insert into public.pitches(opportunity_id) values(md5('package2')::uuid)$$,'42501',null,'draft parent Event denied');
select lives_ok($$insert into public.pitches(opportunity_id,note) values(md5('package5')::uuid,E' \t\n ')$$,'blank note accepted');
select ok((select note is null from public.pitches where opportunity_id=md5('package5')::uuid),'blank normalized NULL');
select lives_ok($$insert into public.pitches(opportunity_id,note) values(md5('package6')::uuid,repeat('a',300))$$,'300 characters accepted');
select throws_ok($$insert into public.pitches(opportunity_id,note) values(md5('package7')::uuid,repeat('a',301))$$,'23514',null,'301 characters rejected');
select lives_ok($$insert into public.pitches(opportunity_id,note) values(md5('package8')::uuid,repeat('🌱',300))$$,'300 Unicode characters accepted');
select lives_ok($$insert into public.pitches(opportunity_id,note) values(md5('package9')::uuid,'  Hello  ')$$,'trimmed note accepted');
select is((select note from public.pitches where opportunity_id=md5('package9')::uuid),'Hello','note trimmed');
select is((select count(*) from public.pitches),5::bigint,'sender reads own pitches');
select throws_ok($$update public.pitches set note='Edited'$$,'42501',null,'UPDATE denied');
select throws_ok($$update public.pitches set from_id='11111111-1111-4111-8111-111111111111'$$,'42501',null,'sender immutable');
select throws_ok($$delete from public.pitches$$,'42501',null,'DELETE denied');
set local request.jwt.claims='{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select is((select count(*) from public.pitches),5::bigint,'package owner admin reads received pitches');
select lives_ok($$insert into public.pitches(opportunity_id,note) values(md5('call2')::uuid,'Interested')$$,'Organizer to published Call');
select throws_ok($$insert into public.pitches(opportunity_id) values(md5('package10')::uuid)$$,'42501',null,'Organizer to package and own package denied');
select throws_ok($$insert into public.pitches(opportunity_id) values(md5('call1')::uuid)$$,'42501',null,'draft Call denied');
select is((select count(*) from public.opportunity_call_budgets),0::bigint,'sending pitch grants no budget access');
select ok((select not (to_jsonb(p) ? 'budget_band') from public.pitches p where opportunity_id=md5('call2')::uuid),'pitch SELECT has no budget field');
set local request.jwt.claims='{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is((select note from public.pitches where opportunity_id=md5('call2')::uuid),'Interested','Call owner admin reads received pitch');
select throws_ok($$insert into public.pitches(opportunity_id) values(md5('call3')::uuid)$$,'42501',null,'own Call denied');
reset role;
insert into public.organization_members(org_id,profile_id,role) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','admin'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','member');
set local role authenticated;
set local request.jwt.claims='{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select throws_ok($$insert into public.pitches(opportunity_id) values(md5('package10')::uuid)$$,'42501',null,'otherwise eligible Sponsor admin cannot pitch own organization package');
set local request.jwt.claims='{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select throws_ok($$insert into public.pitches(opportunity_id) values(md5('call3')::uuid)$$,'42501',null,'otherwise eligible Organizer member cannot pitch own organization Call');
set local request.jwt.claims='{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is((select count(*) from public.pitches),0::bigint,'unrelated authenticated SELECT zero rows');
set local role anon;
select throws_ok($$select * from public.pitches$$,'42501',null,'anonymous SELECT denied');
select throws_ok($$insert into public.pitches(opportunity_id) values(md5('package10')::uuid)$$,'42501',null,'anonymous INSERT denied');
reset role;
select is((select array_agg(column_name::text order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='pitches'),array['id','opportunity_id','from_id','note','created_at'],'minimal pitch schema');
select ok((select not prosecdef from pg_proc where proname='normalize_pitch_note'),'normalization SECURITY INVOKER');
select ok((select coalesce(with_check,'') !~* '(from|join)[[:space:]]+(public[.])?pitches' from pg_policies where tablename='pitches' and cmd='INSERT'),'no duplicate-existence policy');
select is((select count(*) from pg_policies where tablename='pitches' and cmd in ('UPDATE','DELETE')),0::bigint,'no update/delete policies');
select ok((select bool_and(position('opportunity_call_budgets' in coalesce(qual,'')||coalesce(with_check,''))=0) from pg_policies where tablename='pitches'),'pitch policies never read budgets');
select * from finish();
rollback;
