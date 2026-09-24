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
insert into public.pitches(opportunity_id,note) values(md5('package1')::uuid,'Pitch note is not a message'),(md5('package5')::uuid,'Reverse order');
select lives_ok($$select public.get_or_create_thread((select id from public.pitches where opportunity_id=md5('package1')::uuid))$$,'valid pitch creates thread');
select set_config('test.thread',(select id::text from public.threads where opportunity_id=md5('package1')::uuid),true);
select is(public.get_or_create_thread((select id from public.pitches where opportunity_id=md5('package1')::uuid)),current_setting('test.thread')::uuid,'get or create returns same thread');
select throws_ok($$insert into public.threads(pitch_id) select id from public.pitches where opportunity_id=md5('package1')::uuid$$,'23505',null,'duplicate conversation UNIQUE');
select throws_ok($$insert into public.threads(pitch_id,opportunity_id) select id,md5('package5')::uuid from public.pitches where opportunity_id=md5('package1')::uuid$$,'42501',null,'cannot supply mismatched opportunity');
select is((select opportunity_id from public.threads where id=current_setting('test.thread')::uuid),md5('package1')::uuid,'opportunity derives from pitch');
select is((select count(*) from public.thread_participants where thread_id=current_setting('test.thread')::uuid),2::bigint,'exactly two derived participants');
select ok((select owner_id='11111111-1111-4111-8111-111111111111'::uuid and from_id='22222222-2222-4222-8222-222222222222'::uuid from public.threads where id=current_setting('test.thread')::uuid),'opposite role identities derived');
select throws_ok($$insert into public.thread_participants(thread_id,profile_id,side) values(current_setting('test.thread')::uuid,'33333333-3333-4333-8333-333333333333','owner')$$,'42501',null,'arbitrary participant denied');
select is((select count(*) from public.messages),0::bigint,'pitch note never copied to messages');
select ok((select matched_at is null from public.threads where id=current_setting('test.thread')::uuid),'zero messages and pitch note unmatched');
update public.threads set matched_at=now() where id=current_setting('test.thread')::uuid;
select ok((select matched_at is null from public.threads where id=current_setting('test.thread')::uuid),'direct matched_at spoof cannot force match');
select lives_ok($$insert into public.messages(thread_id,body) values(current_setting('test.thread')::uuid,'  Hello owner  ')$$,'sender inserts real message');
select is((select body from public.messages where thread_id=current_setting('test.thread')::uuid),'Hello owner','message trimmed');
select ok((select matched_at is null from public.threads where id=current_setting('test.thread')::uuid),'one side remains unmatched');
select throws_ok($$insert into public.messages(thread_id,sender_id,body) values(current_setting('test.thread')::uuid,'11111111-1111-4111-8111-111111111111','Spoof')$$,'42501',null,'sender spoof denied');
select throws_ok($$insert into public.messages(thread_id,body) values(current_setting('test.thread')::uuid,E' \n\t ')$$,'23514',null,'blank body rejected');
select throws_ok($$insert into public.messages(thread_id,body) values(current_setting('test.thread')::uuid,repeat('x',2001))$$,'23514',null,'2001 body rejected');
select lives_ok($$insert into public.messages(thread_id,body) values(current_setting('test.thread')::uuid,repeat('x',2000))$$,'2000 body accepted');
select throws_ok($$update public.messages set body='Edited'$$,'42501',null,'message UPDATE denied');
select throws_ok($$delete from public.messages$$,'42501',null,'message DELETE denied');
select set_config('test.reverse',public.get_or_create_thread((select id from public.pitches where opportunity_id=md5('package5')::uuid))::text,true);
set local request.jwt.claims='{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select is((select count(*) from public.threads),2::bigint,'owner reads conversations');
select is((select count(*) from public.messages where thread_id=current_setting('test.thread')::uuid),2::bigint,'owner reads messages');
select lives_ok($$insert into public.messages(thread_id,body) values(current_setting('test.thread')::uuid,'Hello sender')$$,'owner inserts real reply');
select ok((select matched_at is not null from public.threads where id=current_setting('test.thread')::uuid),'both sides match');
select set_config('test.match',(select matched_at::text from public.threads where id=current_setting('test.thread')::uuid),true);
insert into public.messages(thread_id,body) values(current_setting('test.thread')::uuid,'Another reply');
select is((select matched_at::text from public.threads where id=current_setting('test.thread')::uuid),current_setting('test.match'),'extra message preserves matched_at');
update public.threads set matched_at=null where id=current_setting('test.thread')::uuid;
select is((select matched_at::text from public.threads where id=current_setting('test.thread')::uuid),current_setting('test.match'),'cannot clear matched_at');
update public.threads set matched_at=now()+interval '1 day' where id=current_setting('test.thread')::uuid;
select is((select matched_at::text from public.threads where id=current_setting('test.thread')::uuid),current_setting('test.match'),'cannot overwrite matched_at');
insert into public.messages(thread_id,body) values(current_setting('test.reverse')::uuid,'Owner goes first');
select ok((select matched_at is null from public.threads where id=current_setting('test.reverse')::uuid),'owner alone unmatched');
insert into public.pitches(opportunity_id,note) values(md5('call2')::uuid,'Call pitch note');
select lives_ok($$select public.get_or_create_thread((select id from public.pitches where opportunity_id=md5('call2')::uuid))$$,'Call pitch creates opposite-role conversation');
select is((select count(*) from public.opportunity_call_budgets),0::bigint,'conversation grants no private budget access');
set local request.jwt.claims='{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
insert into public.messages(thread_id,body) values(current_setting('test.reverse')::uuid,'Sender replies');
select ok((select matched_at is not null from public.threads where id=current_setting('test.reverse')::uuid),'reverse order matches');
select is((select count(*) from public.messages where thread_id=current_setting('test.thread')::uuid),4::bigint,'sender reads persisted messages');
set local request.jwt.claims='{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is((select count(*) from public.threads),0::bigint,'unrelated conversation SELECT denied');
select is((select count(*) from public.thread_participants),0::bigint,'unrelated participant SELECT denied');
select is((select count(*) from public.messages),0::bigint,'unrelated messages SELECT denied');
select throws_ok($$insert into public.messages(thread_id,body) values(current_setting('test.thread')::uuid,'Intruder')$$,'42501',null,'unrelated INSERT denied');
select throws_ok($$select public.get_or_create_thread(gen_random_uuid())$$,'42501',null,'unrelated creation denied');
set local role anon;
select throws_ok($$select * from public.threads$$,'42501',null,'anonymous conversation SELECT denied');
select throws_ok($$select * from public.thread_participants$$,'42501',null,'anonymous participants SELECT denied');
select throws_ok($$select * from public.messages$$,'42501',null,'anonymous messages SELECT denied');
select throws_ok($$insert into public.messages(thread_id,body) values(current_setting('test.thread')::uuid,'Anon')$$,'42501',null,'anonymous INSERT denied');
select throws_ok($$select public.get_or_create_thread(gen_random_uuid())$$,'42501',null,'anonymous RPC denied');
reset role;
select ok((select not prosecdef from pg_proc where oid='public.get_or_create_thread(uuid)'::regprocedure),'creation SECURITY INVOKER');
select ok((select bool_and(not prosecdef) from pg_proc where proname in('guard_thread_match','prepare_message','match_after_message','initialize_thread','initialize_thread_participants')),'all messaging triggers invoker');
select is((select count(*) from information_schema.columns where table_schema='public' and table_name in('threads','thread_participants','messages') and column_name like '%budget%'),0::bigint,'no budget in messaging schema');
-- Removing the creator admin membership revokes owner-side access immediately.
delete from public.organization_members where org_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and profile_id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
set local request.jwt.claims='{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select is((select count(*) from public.threads where id=current_setting('test.thread')::uuid),0::bigint,'removed owner admin loses conversation access');
select throws_ok($$insert into public.messages(thread_id,body) values(current_setting('test.thread')::uuid,'Removed admin')$$,'42501',null,'removed owner admin cannot send');
reset role;
select * from finish();
rollback;
