/* global __dirname */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {createClient}=require('@supabase/supabase-js');
const {chromium}=require(process.env.MAPLE_PLAYWRIGHT_MODULE);
const env=fs.readFileSync('.env.local','utf8');
const key=env.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const url=env.match(/^EXPO_PUBLIC_SUPABASE_URL=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const base='http://127.0.0.1:8098',out=process.env.MAPLE_CALL_QA_OUTPUT;
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
 if(stage==='create'||stage==='edit')await p.getByRole('button',{name:'Clear private budget',exact:true}).scrollIntoViewIfNeeded();
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.screenshot({path:path.join(out,stage+'-'+width+'-'+colorScheme+'.png'),fullPage:true});}
 console.log('PASS '+stage+' responsive/theme matrix');
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const owner=await account('sponsor');
 const org=check(await owner.client.from('organizations').insert({name:'Sponsor QA Organization',slug:owner.handle,type:'brand',created_by:owner.session.user.id}).select().single());
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
 const c=await context(browser,owner.session),p=await c.newPage();p.setDefaultTimeout(30000); const errors=[]; p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base+'/org/'+org.slug,{waitUntil:'domcontentloaded',timeout:90000});
 await p.getByText('Create Call for Events',{exact:true}).click();
 await p.getByRole('textbox',{name:'Title',exact:true}).fill('서울');
 assert.equal(await p.getByRole('textbox',{name:'Call URL',exact:true}).inputValue(),'');
 const title='Looking for developer events '+ 'Long title '.repeat(6);
 await p.getByRole('textbox',{name:'Title',exact:true}).fill(title);
 await p.getByRole('textbox',{name:'Call URL',exact:true}).fill('developers');
 await p.getByRole('textbox',{name:'Description',exact:true}).fill('We support developer communities with cloud credits.');
 for(const name of ['target_categories: Hackathon','target_regions: Asia','target_audience_types: Developers','target_attendance_bands: 200–999','gives: Credits']){
 await p.getByRole('checkbox',{name,exact:true}).focus();await p.keyboard.press('Space');}
 await p.getByRole('radio',{name:'Budget band: $5–25K',exact:true}).focus();await p.keyboard.press('Space');
 assert.equal(await p.getByRole('textbox',{name:/minimum|maximum|currency/i}).count(),0);
 await p.getByText('Private - only Sponsor admins of your organization can see this for now.',{exact:true}).waitFor();
 await matrix(p,'create');
 await p.getByRole('button',{name:'Create Call',exact:true}).click();
 await p.getByText('Draft - visible only to Sponsor admins of this organization.',{exact:true}).waitFor();
 assert(!/5k_25k|\$5–25K|budget/i.test(await p.locator('body').textContent()));
 await matrix(p,'view');
 const call=check(await owner.client.from('opportunities').select('id').eq('owner_org_id',org.id).eq('slug','developers').single());
 await p.getByText('Edit Call',{exact:true}).click();
 await p.waitForFunction(()=>Array.from(document.querySelectorAll('[aria-label="Budget band: $5–25K"]')).find(el=>el.getClientRects().length)?.getAttribute('aria-checked')==='true');
 assert.equal(await p.getByRole('textbox',{name:'Call URL',exact:true}).count(),0);
 assert.equal(await p.getByRole('textbox',{name:/minimum|maximum|currency/i}).count(),0);
 await matrix(p,'edit');
 await p.getByRole('radio',{name:'Budget band: $25K+',exact:true}).click();
 await p.getByRole('button',{name:'Save Call',exact:true}).click();
 await p.waitForURL('**/calls/developers');
 await p.getByText('Edit Call',{exact:true}).click();
 await p.waitForFunction(()=>Array.from(document.querySelectorAll('[aria-label="Budget band: $25K+"]')).find(el=>el.getClientRects().length)?.getAttribute('aria-checked')==='true');
 await p.getByRole('button',{name:'Clear private budget',exact:true}).click();
 await p.getByRole('button',{name:'Save Call',exact:true}).click();
 await p.waitForURL('**/calls/developers');
 await p.getByText('Edit Call',{exact:true}).waitFor();
 assert.equal(check(await owner.client.from('opportunity_call_budgets').select('*').eq('opportunity_id',call.id)).length,0);
 await p.getByRole('button',{name:'Publish Call',exact:true}).click();
 await p.getByText('Published',{exact:true}).waitFor();
 await p.getByText('Edit Call',{exact:true}).click();
 await p.getByRole('button',{name:'Save Call',exact:true}).waitFor({state:'visible'});
 await p.waitForFunction(()=>Array.from(document.querySelectorAll('[aria-label="Budget band: $25K+"]')).find(el=>el.getClientRects().length)?.disabled===false);
 assert.equal(await p.getByRole('radio',{checked:true}).count(),0);
 await p.getByRole('radio',{name:'Budget band: $25K+',exact:true}).click();
 await p.getByRole('button',{name:'Save Call',exact:true}).click();
 await p.waitForURL('**/calls/developers');
 await p.getByText('Published',{exact:true}).waitFor();
 console.log('PASS create, band reload/change/clear, no-budget publication, restore private band');
 const anon=createClient(url,key,{auth:{persistSession:false}});
 const select=fs.readFileSync('src/features/calls/data.ts','utf8').match(/publicCallSelect='([^']+)'/)[1];
 const payload=check(await anon.from('opportunities').select(select).eq('owner_org_id',org.id).eq('type','call'));
 assert(!/budget|25k_plus/.test(JSON.stringify(payload)));
 assert((await anon.from('opportunity_call_budgets').select('*')).error);
 const ac=await context(browser),pub=await ac.newPage();pub.setDefaultTimeout(30000);const budgetRequests=[];
 pub.on('request',r=>{if(r.url().includes('opportunity_call_budgets'))budgetRequests.push(r.url());});
 await pub.goto(base+'/org/'+org.slug+'/calls/developers',{waitUntil:'domcontentloaded',timeout:90000});
 await pub.getByText(title,{exact:true}).waitFor();
 assert(!/25k_plus|\$25K\+|budget/i.test(await pub.locator('body').textContent()));
 assert.equal(budgetRequests.length,0);
 assert(!(await pub.content()).includes('25k_plus'));
 assert.equal(await pub.getByText('Edit Call',{exact:true}).count(),0);
 await p.goto(base+'/org/'+org.slug,{waitUntil:'domcontentloaded',timeout:90000});
 await p.getByText(title,{exact:true}).waitFor();await matrix(p,'organization-list');
 console.log('PASS public query and page leak checks; no budget request; organization integration');
 const organizer=await account('organizer'),oc=await context(browser,organizer.session),op=await oc.newPage();op.setDefaultTimeout(30000);
 await op.goto(base+'/org/'+org.slug+'/calls/new',{waitUntil:'domcontentloaded',timeout:90000});
 await op.getByText('Sponsor admin required',{exact:true}).waitFor();
 assert.equal(check(await organizer.client.from('opportunity_call_budgets').select('*').eq('opportunity_id',call.id)).length,0);
 assert((await organizer.client.rpc('update_call_opportunity',{p_id:call.id,p_title:'Denied',p_description:'',p_details:{},p_budget_band:null})).error);
 console.log('PASS Organizer UI, edit RPC and budget denial');
 await pub.goto(base+'/org/'+org.slug+'/calls/developers/edit',{waitUntil:'domcontentloaded',timeout:90000});
 await pub.getByRole('textbox',{name:'Email address',exact:true}).waitFor();
 console.log('PASS anonymous edit redirects to login');
 assert.equal(errors.filter(e=>e.includes('same key')).length,0); fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({result:'PASS',org:org.slug,call:'developers'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
