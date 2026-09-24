
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.MAPLE_PLAYWRIGHT_MODULE);
const base='http://127.0.0.1:8099', mail='http://127.0.0.1:55324';
const pass=s=>console.log('PASS '+s);
async function otp(email){for(let n=0;n<40;n++){const j=await(await fetch(mail+'/api/v1/messages')).json();const m=j.messages.find(m=>m.To.some(t=>t.Address===email));if(m){const c=await(await fetch(mail+'/api/v1/message/'+m.ID)).json();return c.HTML.match(/<strong>(\d{6})<\/strong>/)[1]}await new Promise(r=>setTimeout(r,300))}throw Error('OTP timeout')}
async function matrix(p,stage){for(const [width,height]of[[1440,900],[390,844]])for(const colorScheme of['light','dark']){await p.setViewportSize({width,height});await p.emulateMedia({colorScheme});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:process.env.MAPLE_ORG_QA_OUTPUT+'/'+stage+'-'+width+'-'+colorScheme+'.png',fullPage:true})}pass(stage+' four viewport/theme overflow checks')}
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});try{let firstSlug;
for(const role of['organizer','sponsor']){const c=await b.newContext();const p=await c.newPage();p.setDefaultTimeout(25000);const stamp=Date.now(),slug='org-'+role+'-'+stamp,email=slug+'@example.test';
await p.goto(base+'/org/new');await p.getByRole('button',{name:'Continue',exact:true}).waitFor();pass(role+' logged-out org guard');
await p.getByRole('textbox',{name:'Email address',exact:true}).fill(email);await p.getByRole('button',{name:'Continue',exact:true}).click();await p.getByRole('textbox',{name:'Verification code',exact:true}).fill(await otp(email));await p.getByRole('button',{name:'Verify',exact:true}).click();
await p.getByRole('radio',{name:role==='organizer'?'I organize events':'I sponsor events',exact:true}).click();await p.getByRole('button',{name:'Next',exact:true}).click();
await p.getByRole('textbox',{name:/^Name/}).fill('Test '+role);await p.getByRole('textbox',{name:/^Handle/}).fill(slug);await p.getByRole('textbox',{name:/^Headline/}).fill('Fictional local test');await p.getByRole('button',{name:'Next',exact:true}).click();await p.getByRole('button',{name:'Next',exact:true}).click();await p.getByRole('button',{name:'Create profile',exact:true}).click();
await p.getByRole('link',{name:'Create organization',exact:true}).click();await p.getByRole('textbox',{name:/^Name/}).fill('김민수');assert.equal(await p.getByRole('textbox',{name:/^Slug/}).inputValue(),'');pass(role+' non-Latin slug empty');
await p.getByRole('textbox',{name:/^Name/}).fill('Test '+role);await p.getByRole('textbox',{name:/^Slug/}).fill(slug);await p.getByRole('radio',{name:role==='organizer'?'Event company':'Brand',exact:true}).click();
await p.getByRole('textbox',{name:/^Domain/}).fill('https://www.example.com/path?q=1');await p.getByRole('textbox',{name:/^Website/}).fill('javascript:alert(1)');await p.getByRole('button',{name:'Create organization',exact:true}).click();await p.getByRole('alert').first().waitFor();pass(role+' unsafe website blocked');
await p.getByRole('textbox',{name:/^Website/}).fill('https://example.com');await matrix(p,role+'-create');let inserts=0;await p.route('**/rest/v1/organizations*',async r=>{if(r.request().method()==='POST'){inserts++;await new Promise(t=>setTimeout(t,350))}await r.continue()});
await p.getByRole('button',{name:'Create organization',exact:true}).evaluate(e=>{e.click();e.click()});await p.getByRole('link',{name:'Edit organization',exact:true}).waitFor();assert.equal(inserts,1);assert.equal(new URL(p.url()).pathname,'/org/'+slug);pass(role+' single insert → dynamic page → creator admin');
await p.getByText('Domain: example.com',{exact:true}).waitFor();await matrix(p,role+'-view');await p.reload();await p.getByRole('link',{name:'Edit organization',exact:true}).click();await p.getByRole('button',{name:'Save organization',exact:true}).waitFor();assert.equal(await p.getByRole('textbox',{name:/^Slug/}).count(),0);
await p.getByRole('textbox',{name:/^Name/}).fill('Edited '+role);await matrix(p,role+'-edit');await p.getByRole('button',{name:'Save organization',exact:true}).click();await p.getByText('Edited '+role,{exact:true}).first().waitFor();pass(role+' refresh/edit/shared state; immutable slug UI');
if(role==='organizer')firstSlug=slug;else{await p.goto(base+'/org/'+firstSlug+'/edit');await p.getByText('Editing unavailable',{exact:true}).waitFor();pass('nonadmin edit denied')}
await c.close()}
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
