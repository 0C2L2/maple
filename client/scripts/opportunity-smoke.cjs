/* global __dirname */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {createClient}=require('@supabase/supabase-js');
const {chromium}=require(process.env.MAPLE_PLAYWRIGHT_MODULE);
const env=fs.readFileSync('.env.local','utf8');
const key=env.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const url=env.match(/^EXPO_PUBLIC_SUPABASE_URL=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const base='http://127.0.0.1:8098',out=process.env.MAPLE_OPPORTUNITY_QA_OUTPUT;
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
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.screenshot({path:path.join(out,stage+'-'+width+'-'+colorScheme+'.png'),fullPage:true});}
 console.log('PASS '+stage+' responsive/theme matrix');
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const owner=await account('organizer');
 const org=check(await owner.client.from('organizations').insert({name:'Opportunity QA',slug:owner.handle,type:'event_company',created_by:owner.session.user.id}).select().single());
 const event=check(await owner.client.from('events').insert({org_id:org.id,title:'QA Summit',slug:owner.handle,format:'online',starts_at:'2026-10-10T06:00:00Z',ends_at:'2026-10-10T08:00:00Z',timezone:'Asia/Seoul',categories:['hackathon'],audience_types:['developers'],attendance_band:'200-999'}).select().single());
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
 const c=await context(browser,owner.session),p=await c.newPage();p.setDefaultTimeout(30000);
 p.on('pageerror',e=>console.log('PAGE ERROR '+e.message));
 await p.goto(base+'/events/'+event.slug,{waitUntil:'domcontentloaded',timeout:90000});
 await p.getByText('Create sponsorship opportunity',{exact:true}).click();
 await p.getByRole('textbox',{name:'Title',exact:true}).fill('서울');
 assert.equal(await p.getByRole('textbox',{name:'Opportunity URL',exact:true}).inputValue(),'');
 await p.getByRole('textbox',{name:'Title',exact:true}).fill('Partner with QA Summit '+ 'Long title '.repeat(6));
 await p.getByRole('textbox',{name:'Opportunity URL',exact:true}).fill('sponsorship');
 await p.getByRole('textbox',{name:'Description',exact:true}).fill('Plain text sponsorship benefits for the community.');
 await p.getByRole('textbox',{name:'Tier 1 name',exact:true}).fill('Gold Sponsor');
 await p.getByRole('textbox',{name:'Tier 1 amount',exact:true}).fill('5000');
 await p.getByRole('textbox',{name:'Tier 1 benefit 1',exact:true}).fill('Logo on stage');
 await p.getByRole('textbox',{name:'Tier 1 slots (optional)',exact:true}).fill('2');
 await p.getByRole('button',{name:'Add tier',exact:true}).click();
 await p.getByRole('textbox',{name:'Tier 2 name',exact:true}).fill('Silver Sponsor');
 await p.getByRole('radio',{name:'Tier 2 KRW',exact:true}).click();
 await p.getByRole('textbox',{name:'Tier 2 amount',exact:true}).fill('500000');
 await p.getByRole('textbox',{name:'Tier 2 benefit 1',exact:true}).fill('Website logo');
 await p.getByRole('button',{name:'Add tier',exact:true}).click();
 await p.getByRole('textbox',{name:'Tier 3 name',exact:true}).fill('Cloud Partner');
 await p.getByRole('radio',{name:'Tier 3 In-kind',exact:true}).focus(); await p.keyboard.press('Space');
 await p.getByRole('textbox',{name:'Tier 3 benefit 1',exact:true}).fill('Cloud credits');
 await matrix(p,'create');
 await p.getByRole('button',{name:'Create opportunity',exact:true}).click();
 await p.getByText('Gold Sponsor',{exact:true}).waitFor();
 await p.getByText('$5,000.00',{exact:true}).waitFor();
 await p.getByText('₩500,000',{exact:true}).waitFor();
 await p.getByText('In-kind',{exact:true}).waitFor();
 console.log('PASS create draft, cash USD/KRW and in-kind display');
 const opp=check(await owner.client.from('opportunities').select('*,opportunity_tiers(*)').eq('event_id',event.id).single());
 const goldId=opp.opportunity_tiers.find(t=>t.name==='Gold Sponsor').id;
 await matrix(p,'view');
 await p.getByText('Edit opportunity',{exact:true}).click();
 assert.equal(await p.getByRole('textbox',{name:'Opportunity URL',exact:true}).count(),0);
 await p.getByRole('textbox',{name:'Tier 1 name',exact:true}).fill('Gold Partner');
 await p.getByRole('button',{name:'Remove tier 2',exact:true}).click();
 await p.getByRole('button',{name:'Add tier',exact:true}).click();
 await p.getByRole('textbox',{name:'Tier 3 name',exact:true}).fill('Community Partner');
 await p.getByRole('radio',{name:'Tier 3 In-kind',exact:true}).focus(); await p.keyboard.press('Space');
 await p.getByRole('textbox',{name:'Tier 3 benefit 1',exact:true}).fill('Community space');
 await matrix(p,'edit');
 await p.getByRole('button',{name:'Save opportunity',exact:true}).click();
 await p.getByText('Gold Partner',{exact:true}).waitFor();
 assert.equal(check(await owner.client.from('opportunity_tiers').select('name').eq('id',goldId).single()).name,'Gold Partner');
 await p.getByRole('button',{name:'Publish opportunity',exact:true}).click();
 await p.getByText('Published opportunity - private until the Event is published.',{exact:true}).waitFor();
 const anon=createClient(url,key,{auth:{persistSession:false}});
 assert.equal(check(await anon.from('opportunities').select('id').eq('id',opp.id)).length,0);
 check(await owner.client.from('events').update({status:'published'}).eq('id',event.id));
 const publicContext=await context(browser),pub=await publicContext.newPage();pub.setDefaultTimeout(30000);
 await pub.goto(base+'/events/'+event.slug+'/opportunities/sponsorship',{waitUntil:'domcontentloaded',timeout:90000});
 await pub.getByText('Gold Partner',{exact:true}).waitFor();
 assert.equal(await pub.getByRole('button',{name:'Edit opportunity',exact:true}).count(),0);
 assert.equal(check(await anon.from('opportunity_tiers').select('price_minor,currency').eq('id',goldId))[0].price_minor,500000);
 await p.goto(base+'/events/'+event.slug,{waitUntil:'domcontentloaded'});
 await p.getByRole('link',{name:opp.title,exact:true}).waitFor();await matrix(p,'event-list');
 console.log('PASS edit/add/remove stable IDs, publish, parent visibility, public cash and event integration');
 const sponsor=await account('sponsor'),sc=await context(browser,sponsor.session),sp=await sc.newPage();
 await sp.goto(base+'/events/'+event.slug+'/opportunities/new',{waitUntil:'domcontentloaded',timeout:90000});
 await sp.getByText('Organizer admin required',{exact:true}).waitFor();
 const denied=await sponsor.client.rpc('create_package_opportunity',{p_event_id:event.id,p_title:'Denied',p_slug:'denied',p_description:'',p_tiers:[]});assert(denied.error);
 console.log('PASS Sponsor UI and RPC denied');
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({result:'PASS',event:event.slug,opportunity:'sponsorship'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
