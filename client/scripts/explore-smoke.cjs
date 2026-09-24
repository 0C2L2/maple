/* global __dirname */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {createClient}=require('@supabase/supabase-js');
const {chromium}=require(process.env.MAPLE_PLAYWRIGHT_MODULE);
const env=fs.readFileSync('.env.local','utf8');
const key=env.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const url=env.match(/^EXPO_PUBLIC_SUPABASE_URL=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const base='http://127.0.0.1:8098',out=process.env.MAPLE_EXPLORE_QA_OUTPUT;
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
 check(await client.from('profiles').insert({id:auth.user.id,role,name:'Opportunity QA',handle,headline:'Local QA'}));
 return {client,session:auth.session,handle};
}
async function context(browser,session){
 const c=await browser.newContext();
 if(session)await c.addInitScript(({session,key})=>localStorage.setItem(key,JSON.stringify(session)),{session,key:'sb-'+new URL(url).hostname.split('.')[0]+'-auth-token'});
 return c;
}

(async()=>{
 fs.mkdirSync(out,{recursive:true});const organizer=await account('organizer'),sponsor=await account('sponsor');
 const org=check(await organizer.client.from('organizations').insert({name:'Explore Organizer',slug:organizer.handle,type:'event_company',created_by:organizer.session.user.id}).select().single());
 const brand=check(await sponsor.client.from('organizations').insert({name:'Explore Sponsor',slug:sponsor.handle,type:'brand',created_by:sponsor.session.user.id}).select().single());
 const event=check(await organizer.client.from('events').insert({org_id:org.id,title:'Future developer event',slug:organizer.handle,format:'online',starts_at:'2035-10-10T06:00:00Z',ends_at:'2035-10-10T08:00:00Z',timezone:'Asia/Seoul',categories:['hackathon'],audience_types:['developers'],attendance_band:'200-999'}).select().single());
 check(await organizer.client.from('events').update({status:'published'}).eq('id',event.id));
 for(let n=0;n<23;n++){
 const pkg=check(await organizer.client.rpc('create_package_opportunity',{p_event_id:event.id,p_title:'Explore package '+n,p_slug:'package-'+n,p_description:'Community sponsorship',p_tiers:[{name:'Gold',price_minor:25000,currency:'USD',in_kind:false,benefits:['Logo']},{name:'Credits',in_kind:true,benefits:['Cloud']}] }));
 check(await organizer.client.from('opportunities').update({status:'published'}).eq('id',pkg.id));
 const call=check(await sponsor.client.rpc('create_call_opportunity',{p_org_id:brand.id,p_title:'Explore call '+n,p_slug:'call-'+n,p_description:'Supporting developer events',p_details:{target_categories:['hackathon'],target_regions:['asia'],target_audience_types:['developers'],target_attendance_bands:['200-999'],gives:['credits']},p_budget_band:'25k_plus'}));
 check(await sponsor.client.from('opportunities').update({status:'published'}).eq('id',call.id));
 }
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
 for(const [role,user] of [['sponsor',sponsor],['organizer',organizer]]){
 const c=await context(browser,user.session),p=await c.newPage();p.setDefaultTimeout(15000);
 const privateRequests=[];p.on('request',r=>{if(r.url().includes('opportunity_call_budgets'))privateRequests.push(r.url());});
 await p.goto(base+'/explore?role=other',{waitUntil:'domcontentloaded',timeout:60000});
 await p.getByText(role==='sponsor'?'Explore Sponsorship Opportunities':'Explore Sponsor Calls',{exact:true}).waitFor();
 const linkPattern=/^View /;
 await p.getByRole('link',{name:linkPattern}).first().waitFor();
 assert.equal(await p.getByRole('link',{name:linkPattern}).count(),20);
 await p.getByRole('button',{name:'Load more',exact:true}).click();
 await p.waitForFunction(()=>!document.body.textContent.includes('Loading more...'));
 assert((await p.getByRole('link',{name:linkPattern}).count())>=23);
 await p.getByRole('button',{name:'Show filters',exact:true}).click();
 for(const name of ['Categories: Hackathon','Audience: Developers','Attendance: 200–999',role==='sponsor'?'Format: Online':'Regions: Asia']){
 await p.getByRole('checkbox',{name,exact:true}).focus();await p.keyboard.press('Space');
 await p.getByRole('link',{name:linkPattern}).first().waitFor();
 }
 for(const [width,height] of [[1440,900],[390,844]])for(const colorScheme of ['light','dark']){
 await p.setViewportSize({width,height});await p.emulateMedia({colorScheme});
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.screenshot({path:path.join(out,role+'-'+width+'-'+colorScheme+'.png'),fullPage:true});
 }
 if(await p.getByRole('checkbox',{name:'Audience: Developers',exact:true}).getAttribute('aria-checked')==='true')await p.getByRole('checkbox',{name:'Audience: Developers',exact:true}).click();
 await p.getByRole('checkbox',{name:'Audience: Students',exact:true}).click();
 console.log('filter states',await p.getByRole('checkbox',{name:'Audience: Developers',exact:true}).getAttribute('aria-checked'),await p.getByRole('checkbox',{name:'Audience: Students',exact:true}).getAttribute('aria-checked'));
 await p.getByText(role==='sponsor'?'No sponsorship opportunities match these filters.':'No sponsor calls match these filters.',{exact:true}).waitFor();
 await p.getByRole('button',{name:'Clear filters',exact:true}).click();
 await p.getByRole('link',{name:linkPattern}).first().waitFor();
 assert(!/budget|25k_plus/i.test(await p.locator('body').textContent()));assert.equal(privateRequests.length,0);
 await p.route('**/rest/v1/rpc/list_public_opportunities',r=>r.abort());
 await p.getByRole('button',{name:'Refresh',exact:true}).click();
 await p.getByRole('button',{name:'Retry',exact:true}).waitFor();
 await p.unroute('**/rest/v1/rpc/list_public_opportunities');
 await p.getByRole('button',{name:'Retry',exact:true}).click();
 await p.getByRole('link',{name:linkPattern}).first().click();
 await p.waitForURL(role==='sponsor'?'**/events/*/opportunities/*':'**/org/*/calls/*');
 await p.getByText('Published',{exact:true}).waitFor();
 console.log('PASS '+role+' role, filters, pagination, empty/error/retry, themes, detail route, privacy');
 await c.close();
 }
 const ac=await context(browser),ap=await ac.newPage();await ap.goto(base+'/explore');await ap.getByRole('textbox',{name:'Email address',exact:true}).waitFor();console.log('PASS anonymous Explore redirects to login');
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({result:'PASS'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
