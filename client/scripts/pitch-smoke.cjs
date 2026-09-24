/* global __dirname */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {createClient}=require('@supabase/supabase-js');
const {chromium}=require(process.env.MAPLE_PLAYWRIGHT_MODULE);
const env=fs.readFileSync('.env.local','utf8');
const key=env.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const url=env.match(/^EXPO_PUBLIC_SUPABASE_URL=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const base='http://127.0.0.1:8098',out=process.env.MAPLE_PITCH_QA_OUTPUT;
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
async function matrix(p,stage){
 for(const [width,height] of [[1440,900],[390,844]])for(const colorScheme of ['light','dark']){
 await p.setViewportSize({width,height});await p.emulateMedia({colorScheme});
 await p.getByRole('button',{name:'Cancel',exact:true}).scrollIntoViewIfNeeded();
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.screenshot({path:path.join(out,stage+'-'+width+'-'+colorScheme+'.png'),fullPage:true});}
 console.log('PASS '+stage+' responsive/theme matrix');
}

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const organizer=await account('organizer'),sponsor=await account('sponsor');
 const org=check(await organizer.client.from('organizations').insert({name:'Pitch Organizer',slug:organizer.handle,type:'event_company',created_by:organizer.session.user.id}).select().single());
 const brand=check(await sponsor.client.from('organizations').insert({name:'Pitch Sponsor',slug:sponsor.handle,type:'brand',created_by:sponsor.session.user.id}).select().single());
 const event=check(await organizer.client.from('events').insert({org_id:org.id,title:'Pitch developer event',slug:organizer.handle,format:'online',starts_at:'2035-10-10T06:00:00Z',ends_at:'2035-10-10T08:00:00Z',timezone:'Asia/Seoul',categories:['hackathon'],audience_types:['developers'],attendance_band:'200-999'}).select().single());
 check(await organizer.client.from('events').update({status:'published'}).eq('id',event.id));
 const pkg=check(await organizer.client.rpc('create_package_opportunity',{p_event_id:event.id,p_title:'Pitch package '+Date.now(),p_slug:'pitch-package',p_description:'Community sponsorship',p_tiers:[{name:'Gold',price_minor:25000,currency:'USD',in_kind:false,benefits:['Logo']},{name:'Credits',in_kind:true,benefits:['Cloud']}]}));
 check(await organizer.client.from('opportunities').update({status:'published'}).eq('id',pkg.id));
 const call=check(await sponsor.client.rpc('create_call_opportunity',{p_org_id:brand.id,p_title:'Pitch call '+Date.now(),p_slug:'pitch-call',p_description:'Supporting developer events',p_details:{target_categories:['hackathon'],target_regions:['asia'],target_audience_types:['developers'],target_attendance_bands:['200-999'],gives:['credits']},p_budget_band:'25k_plus'}));
 check(await sponsor.client.from('opportunities').update({status:'published'}).eq('id',call.id));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
 for(const [role,user,target,owner] of [['sponsor',sponsor,pkg,organizer],['organizer',organizer,call,sponsor]]){
 const c=await context(browser,user.session),p=await c.newPage();p.setDefaultTimeout(20000);
 const privateRequests=[];p.on('request',r=>{if(r.url().includes('opportunity_call_budgets'))privateRequests.push(r.url());});
 await p.goto(base+'/explore',{waitUntil:'domcontentloaded',timeout:60000});
 await p.getByRole('link',{name:'View '+target.title,exact:true}).click();
 await p.getByRole('button',{name:'Quick Pitch',exact:true}).click();
 await p.getByRole('textbox',{name:'Optional note',exact:true}).fill('Cancel this');
 await p.getByRole('button',{name:'Cancel',exact:true}).click();
 await p.getByRole('button',{name:'Quick Pitch',exact:true}).click();
 assert.equal(await p.getByRole('textbox',{name:'Optional note',exact:true}).inputValue(),'');
 await p.getByRole('textbox',{name:'Optional note',exact:true}).fill('a'.repeat(301));
 assert(await p.getByRole('button',{name:'Send pitch',exact:true}).isDisabled());
 await p.getByRole('textbox',{name:'Optional note',exact:true}).fill(role==='sponsor'?'':'a'.repeat(300));
 await matrix(p,role+'-form');
 await p.route('**/rest/v1/pitches*',r=>r.request().method()==='POST'?r.abort():r.continue());
 await p.getByRole('button',{name:'Send pitch',exact:true}).click();
 await p.getByText('Unable to send your pitch. Check your connection and sign-in, or refresh this opportunity.',{exact:true}).waitFor();
 await p.screenshot({path:path.join(out,role+'-error.png'),fullPage:true});
 await p.unroute('**/rest/v1/pitches*');
 await p.getByRole('button',{name:'Send pitch',exact:true}).click();
 await p.getByText('Pitch sent',{exact:true}).waitFor();
 assert.equal(await p.getByRole('button',{name:'Quick Pitch',exact:true}).count(),0);
 await p.reload();await p.getByText('Pitch sent',{exact:true}).waitFor();
 const pitches=check(await user.client.from('pitches').select('*').eq('opportunity_id',target.id));
 assert.equal(pitches.length,1);assert.equal(pitches[0].from_id,user.session.user.id);
 assert.equal(pitches[0].note,role==='sponsor'?null:'a'.repeat(300));
 assert(!JSON.stringify(pitches).includes('budget'));
 const received=check(await owner.client.from('pitches').select('id').eq('opportunity_id',target.id));assert.equal(received.length,1);
 assert(!/budget|25k_plus/i.test(await p.locator('body').textContent()));assert.equal(privateRequests.length,0);
 const duplicate=await user.client.from('pitches').insert({opportunity_id:target.id});assert.equal(duplicate.error.code,'23505');
 console.log('PASS '+role+' Explore to detail, cancel, note limits, retry, send, persistence, owner SELECT, duplicate and privacy');
 await c.close();
 }
 // Simulate another tab submitting while this form is already open.
 const race=check(await organizer.client.rpc('create_package_opportunity',{p_event_id:event.id,p_title:'Race pitch',p_slug:'race-pitch',p_description:'Race',p_tiers:[{name:'Gold',price_minor:100,currency:'USD',in_kind:false,benefits:['Logo']}]}));
 check(await organizer.client.from('opportunities').update({status:'published'}).eq('id',race.id));
 const rc=await context(browser,sponsor.session),rp=await rc.newPage();
 await rp.goto(base+'/events/'+event.slug+'/opportunities/race-pitch');await rp.getByRole('button',{name:'Quick Pitch',exact:true}).click();
 check(await sponsor.client.from('pitches').insert({opportunity_id:race.id}));
 await rp.getByRole('button',{name:'Send pitch',exact:true}).click();
 await rp.getByText('You already sent a pitch for this opportunity.',{exact:true}).waitFor();
 console.log('PASS duplicate race maps to already-sent feedback');
 const ac=await context(browser),ap=await ac.newPage();
 await ap.goto(base+'/org/'+brand.slug+'/calls/pitch-call');await ap.getByText(call.title,{exact:true}).waitFor();
 assert.equal(await ap.getByRole('button',{name:'Quick Pitch',exact:true}).count(),0);
 assert(!/budget|25k_plus/i.test(await ap.locator('body').textContent()));
 const oc=await context(browser,sponsor.session),op=await oc.newPage();
 await op.goto(base+'/org/'+brand.slug+'/calls/pitch-call');await op.getByText(call.title,{exact:true}).waitFor();
 assert.equal(await op.getByRole('button',{name:'Quick Pitch',exact:true}).count(),0);
 assert.equal(check(await organizer.client.from('opportunity_call_budgets').select('*').eq('opportunity_id',call.id)).length,0);
 assert.equal(check(await sponsor.client.from('opportunity_call_budgets').select('budget_band').eq('opportunity_id',call.id).single()).budget_band,'25k_plus');
 console.log('PASS anonymous/wrong-role button absence and unchanged private budget access');
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({result:'PASS'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
