/* global __dirname */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {createClient}=require('@supabase/supabase-js');
const {chromium}=require(process.env.MAPLE_PLAYWRIGHT_MODULE);
const env=fs.readFileSync('.env.local','utf8');
const key=env.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const url=env.match(/^EXPO_PUBLIC_SUPABASE_URL=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const base='http://127.0.0.1:8098',out=process.env.MAPLE_MARKETPLACE_QA_OUTPUT;
if(!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Local demo seed only');
function check(result){if(result.error)throw Error(result.error.message);return result.data;}
async function account(role){
 const client=createClient(url,key,{auth:{persistSession:false}});
 const handle='opp-'+role+'-'+Date.now(),email=handle+'@example.test';
 check(await client.auth.signInWithOtp({email}));
 let token;
 for(let n=0;n<30;n++){
 const inbox=await(await fetch('http://127.0.0.1:55324/api/v1/messages')).json();
 const m=inbox.messages.find(m=>m.To.some(t=>t.Address===email));
 if(m){const body=await(await fetch('http://127.0.0.1:55324/api/v1/message/'+m.ID)).json();token=body.HTML.match(/<strong>(\d{6})<\/strong>/)[1];break;}
 await new Promise(r=>setTimeout(r,200));}
 const auth=check(await client.auth.verifyOtp({email,token,type:'email'}));
 check(await client.from('profiles').insert({id:auth.user.id,role,name:role==='sponsor'?'Alex Morgan':'Jamie Park',handle,headline:'Local QA'}));
 return {client,session:auth.session,handle};
}
async function context(browser,session){
 const c=await browser.newContext();
 if(session)await c.addInitScript(({session,key})=>localStorage.setItem(key,JSON.stringify(session)),{session,key:'sb-'+new URL(url).hostname.split('.')[0]+'-auth-token'});
 return c;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const organizer=await account('organizer'),sponsor=await account('sponsor');
 const org=check(await organizer.client.from('organizations').insert({name:'Seoul Developer Collective',slug:organizer.handle,type:'event_company',created_by:organizer.session.user.id}).select().single());
 const brand=check(await sponsor.client.from('organizations').insert({name:'Northstar Cloud',slug:sponsor.handle,type:'brand',created_by:sponsor.session.user.id}).select().single());
 const event=check(await organizer.client.from('events').insert({org_id:org.id,title:'Seoul Developer Summit',slug:organizer.handle,format:'online',starts_at:'2026-10-20T06:00:00Z',ends_at:'2026-10-20T10:00:00Z',timezone:'Asia/Seoul',categories:['hackathon'],audience_types:['developers'],attendance_band:'200-999'}).select().single());
 check(await organizer.client.from('events').update({status:'published'}).eq('id',event.id));
 const pkg=check(await organizer.client.rpc('create_package_opportunity',{p_event_id:event.id,p_title:'Seoul Developer Summit Sponsorship',p_slug:'pitch-package',p_description:'Connect with developers building practical AI tools. Support hands-on workshops and share your technology with teams in Seoul.',p_tiers:[{name:'Gold',price_minor:25000,currency:'USD',in_kind:false,benefits:['Logo']},{name:'Credits',in_kind:true,benefits:['Cloud']}]}));
 check(await organizer.client.from('opportunities').update({status:'published'}).eq('id',pkg.id));
 const call=check(await sponsor.client.rpc('create_call_opportunity',{p_org_id:brand.id,p_title:'Looking for AI and Developer Events in Korea',p_slug:'pitch-call',p_description:'We support developer communities across Asia with cloud credits and hands-on technical expertise.',p_details:{target_categories:['hackathon'],target_regions:['asia'],target_audience_types:['developers'],target_attendance_bands:['200-999'],gives:['credits']},p_budget_band:'25k_plus'}));
 check(await sponsor.client.from('opportunities').update({status:'published'}).eq('id',call.id));

 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
 const sc=await context(browser,sponsor.session),sp=await sc.newPage();sp.setDefaultTimeout(20000);
 const oc=await context(browser,organizer.session),op=await oc.newPage();op.setDefaultTimeout(20000);
 const privateRequests=[];for(const p of [sp,op])p.on('request',r=>{if(r.url().includes('opportunity_call_budgets'))privateRequests.push(r.url());});
 
 async function marketplaceShots(page,label){
 for(const [width,height] of [[1440,900],[390,844]])for(const colorScheme of ['light','dark']){
 await page.setViewportSize({width,height});await page.emulateMedia({colorScheme});await page.waitForTimeout(250);if(label.endsWith('-pitch'))await page.getByRole('button',{name:'Send pitch',exact:true}).scrollIntoViewIfNeeded();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,label+' overflow');
 await page.screenshot({path:path.join(out,label+'-'+width+'-'+colorScheme+'.png'),fullPage:false});
 if(label.startsWith('explore')&&width===1440){const bottoms=await page.locator('[data-testid="marketplace-listing"]:visible').evaluateAll(es=>es.slice(0,2).map(e=>e.getBoundingClientRect().bottom));assert(bottoms.length===2&&bottoms.every(y=>y<=900),label+' two cards '+bottoms);}
 }await page.setViewportSize({width:1440,height:900});await page.emulateMedia({colorScheme:'light'});
 }
 for(const [page,role] of [[sp,'sponsor'],[op,'organizer']]){
 await page.goto(base+'/explore',{waitUntil:'domcontentloaded',timeout:120000});await page.locator('[data-testid="marketplace-listing"]:visible').first().waitFor();await marketplaceShots(page,'explore-'+role);
 await page.getByRole('button',{name:'All filters',exact:true}).click();
 await page.getByRole('checkbox',{name:'Categories: Hackathon',exact:true}).focus();await page.keyboard.press('Space');
 await page.locator('[data-testid="marketplace-listing"]:visible').first().waitFor();
 assert.equal(await page.getByRole('checkbox',{name:'Categories: Hackathon',exact:true}).getAttribute('aria-checked'),'true');
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();await page.getByRole('button',{name:'Close filters',exact:true}).click();
 await page.getByRole('link',{name:'Profile',exact:true}).click();await page.waitForURL('**/me');
 await page.getByRole('link',{name:'Explore',exact:true}).click();await page.waitForURL('**/explore');await page.locator('[data-testid="marketplace-listing"]:visible').first().waitFor();
 }
 await op.locator('a[href="/org/'+sponsor.handle+'/calls/pitch-call"]:visible').first().click();await op.getByRole('button',{name:'Quick Pitch',exact:true}).waitFor();await marketplaceShots(op,'call-detail');
 await op.getByRole('button',{name:'Quick Pitch',exact:true}).click();await marketplaceShots(op,'call-pitch');await op.getByRole('button',{name:'Cancel',exact:true}).click();

 await sp.goto(base+'/explore',{waitUntil:'domcontentloaded',timeout:90000});await sp.locator('a[href="/events/'+organizer.handle+'/opportunities/pitch-package"]:visible').first().click();
 await sp.getByRole('button',{name:'Quick Pitch',exact:true}).waitFor();await marketplaceShots(sp,'package-detail');await sp.getByRole('button',{name:'Quick Pitch',exact:true}).click();await marketplaceShots(sp,'package-pitch');
 await sp.getByRole('textbox',{name:'Optional note',exact:true}).fill('DISTINCT PITCH NOTE NOT A MESSAGE');
 await sp.getByRole('button',{name:'Send pitch',exact:true}).click();
 await sp.getByRole('button',{name:'Open conversation',exact:true}).click();
 await sp.waitForURL('**/messages/*');await sp.getByText('Start the conversation.',{exact:true}).waitFor();
 assert(!(await sp.locator('body').textContent()).includes('DISTINCT PITCH NOTE'));
 const threadId=new URL(sp.url()).pathname.split('/').pop();
 const state=async(client,id=threadId)=>check(await client.from('threads').select('id,matched_at').eq('id',id).single());
 assert.equal((await state(sponsor.client)).matched_at,null);
 assert.equal(check(await sponsor.client.from('messages').select('id').eq('thread_id',threadId)).length,0);
 await op.goto(base+'/messages',{waitUntil:'domcontentloaded',timeout:90000});await op.getByRole('link',{name:pkg.title,exact:true}).waitFor();
 async function shots(page,label,form=false){
 for(const [width,height] of [[1440,900],[390,844]])for(const colorScheme of ['light','dark']){
 await page.setViewportSize({width,height});await page.emulateMedia({colorScheme});
 if(form)await page.getByRole('button',{name:'Send message',exact:true}).scrollIntoViewIfNeeded();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:path.join(out,label+'-'+width+'-'+colorScheme+'.png'),fullPage:true});
 }}
 await shots(op,'inbox');await op.getByRole('link',{name:pkg.title,exact:true}).click();
 await op.getByText('Start the conversation.',{exact:true}).waitFor();
 await sp.getByRole('textbox',{name:'Message',exact:true}).fill('x'.repeat(2001));assert(await sp.getByRole('button',{name:'Send message',exact:true}).isDisabled());
 await sp.getByRole('textbox',{name:'Message',exact:true}).fill('Hello from Sponsor');
 await sp.route('**/rest/v1/messages*',r=>r.request().method()==='POST'?r.abort():r.continue());
 await sp.getByRole('button',{name:'Send message',exact:true}).click();
 await sp.getByText('Unable to send. Check your connection and conversation access, then retry.',{exact:true}).waitFor();
 await sp.unroute('**/rest/v1/messages*');
 await sp.getByRole('button',{name:'Send message',exact:true}).click();
 await sp.waitForFunction(()=>document.querySelector('[aria-label="Message"]')?.value==='');await sp.getByText('Hello from Sponsor',{exact:true}).waitFor();
 assert.equal((await state(sponsor.client)).matched_at,null);
 await op.getByRole('button',{name:'Refresh messages',exact:true}).click();await op.getByText('Hello from Sponsor',{exact:true}).waitFor();
 const longBody='Hello Sponsor. '+ 'A'.repeat(500);
 await op.getByRole('textbox',{name:'Message',exact:true}).fill(longBody);
 await op.getByRole('button',{name:'Send message',exact:true}).click();await op.waitForFunction(()=>document.querySelector('[aria-label="Message"]')?.value==='');await op.getByText(longBody,{exact:true}).waitFor();
 const matched=(await state(organizer.client)).matched_at;assert(matched);
 await shots(op,'conversation',true);
 await sp.getByRole('button',{name:'Refresh messages',exact:true}).click();await sp.getByText(longBody,{exact:true}).waitFor();
 await sp.getByRole('textbox',{name:'Message',exact:true}).fill('Thanks');
 await sp.getByRole('button',{name:'Send message',exact:true}).click();await sp.waitForFunction(()=>document.querySelector('[aria-label="Message"]')?.value==='');await sp.getByText('Thanks',{exact:true}).waitFor();
 assert.equal((await state(sponsor.client)).matched_at,matched);
 await sp.reload({waitUntil:'domcontentloaded',timeout:120000});await sp.waitForFunction(()=>document.querySelector('[aria-label="Message"]')?.value==='');await sp.getByText('Thanks',{exact:true}).waitFor();
 assert(!/budget|25k_plus|DISTINCT PITCH NOTE/.test(await sp.locator('body').textContent()));
 console.log('PASS Quick Pitch -> empty conversation, note separation, both-side messages, retry, persistence, match once, responsive themes');
 // Concurrent get-or-create and concurrent first messages on the opposite marketplace direction.
 const pitch=check(await organizer.client.from('pitches').insert({opportunity_id:call.id,note:'Call note'}).select('id').single());
 const threads=await Promise.all([organizer.client.rpc('get_or_create_thread',{p_pitch_id:pitch.id}),organizer.client.rpc('get_or_create_thread',{p_pitch_id:pitch.id})]);
 const first=check(threads[0]);assert.equal(first,check(threads[1]));
 assert.equal((await state(organizer.client,first)).matched_at,null);
 const replies=await Promise.all([organizer.client.from('messages').insert({thread_id:first,body:'Organizer concurrently'}),sponsor.client.from('messages').insert({thread_id:first,body:'Sponsor concurrently'})]);replies.forEach(check);
 assert((await state(organizer.client,first)).matched_at);
 assert.equal(check(await organizer.client.from('messages').select('id').eq('thread_id',first)).length,2);
 assert.equal(check(await organizer.client.from('opportunity_call_budgets').select('*').eq('opportunity_id',call.id)).length,0);
 assert.equal(privateRequests.length,0);
 console.log('PASS concurrent get-or-create, concurrent first replies, Call direction, budget isolation');
 const stranger=await account('sponsor');
 assert.equal(check(await stranger.client.from('threads').select('id').eq('id',threadId)).length,0);
 assert.equal(check(await stranger.client.from('messages').select('id').eq('thread_id',threadId)).length,0);
 const uc=await context(browser,stranger.session),up=await uc.newPage();await up.goto(base+'/messages/'+threadId,{waitUntil:'domcontentloaded',timeout:90000});await up.getByText('Conversation unavailable.',{exact:true}).waitFor();
 const ac=await context(browser),ap=await ac.newPage();await ap.goto(base+'/messages',{waitUntil:'domcontentloaded',timeout:90000});await ap.getByRole('textbox',{name:'Email address',exact:true}).waitFor();
 console.log('PASS unrelated and anonymous privacy/routes');
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({result:'PASS',threadId}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
