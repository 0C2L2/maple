const fs = require('node:fs'), assert = require('node:assert/strict');
const { chromium } = require(process.env.MAPLE_PLAYWRIGHT_MODULE);
const base = 'http://127.0.0.1:8099', mail = 'http://127.0.0.1:55324';
const out = process.env.MAPLE_EVENT_QA_OUTPUT;
const anonKey = fs.readFileSync('.env.local','utf8').match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m)[1].trim().replace(/^['"]|['"]$/g,'');
const pass = message => console.log('PASS ' + message);
async function otp(email) {
  for(let n=0;n<50;n++) {
    const inbox = await (await fetch(mail+'/api/v1/messages')).json();
    const message = inbox.messages.find(m=>m.To.some(t=>t.Address===email));
    if(message) { const body = await(await fetch(mail+'/api/v1/message/'+message.ID)).json(); return body.HTML.match(/<strong>(\d{6})<\/strong>/)[1]; }
    await new Promise(r=>setTimeout(r,300));
  }
  throw Error('OTP timeout');
}
async function navigate(page,url) { return page.goto(url,{waitUntil:'domcontentloaded',timeout:120000}); }
async function signup(browser, role) {
  const context = await browser.newContext(), page = await context.newPage();
  page.setDefaultTimeout(45000); page.setDefaultNavigationTimeout(120000);
  const handle = 'evt-'+role+'-'+Date.now(), email=handle+'@example.test';
  await navigate(page,base+'/events/new');
  await page.getByRole('textbox',{name:'Email address',exact:true}).fill(email);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('textbox',{name:'Verification code',exact:true}).fill(await otp(email));
  await page.getByRole('button',{name:'Verify',exact:true}).click();
  await page.getByRole('radio',{name:role==='organizer'?'I organize events':'I sponsor events',exact:true}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByRole('textbox',{name:/^Name/}).fill('Event '+role);
  await page.getByRole('textbox',{name:/^Handle/}).fill(handle);
  await page.getByRole('textbox',{name:/^Headline/}).fill('Fictional local event QA');
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByRole('button',{name:'Create profile',exact:true}).click();
  await page.getByRole('link',{name:'Edit profile',exact:true}).waitFor();
  pass(role+' login, onboarding and /me');
  return {context,page,handle};
}
async function matrix(page,stage) {
  for(const [width,height] of [[1440,900],[390,844]]) for(const colorScheme of ['light','dark']) {
    await page.setViewportSize({width,height}); await page.emulateMedia({colorScheme});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,stage+' overflow');
    await page.screenshot({path:out+'/'+stage+'-'+width+'-'+colorScheme+'.png',fullPage:true});
  }
  pass(stage+' desktop/mobile light/dark overflow checks');
}
async function rest(page, method, query, body) {
  return page.evaluate(async ({method,query,body,anonKey})=>{
    const key=Object.keys(localStorage).find(k=>k.startsWith('sb-')&&k.endsWith('-auth-token'));
    const session=JSON.parse(localStorage.getItem(key));
    const envResponse = await fetch('http://127.0.0.1:55321/rest/v1/'+query,{method,
      headers:{apikey:anonKey,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json',Prefer:'return=representation'},
      ...(body?{body:JSON.stringify(body)}:{})});
    return {status:envResponse.status,body:await envResponse.json()};
  },{method,query,body,anonKey});
}
(async()=>{
  assert(out); fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {
    const owner=await signup(browser,'organizer'), p=owner.page;
    await navigate(p,base+'/events/new');
    await p.getByText('You need an organization before creating an event.',{exact:true}).waitFor();
    pass('Organizer without organization denied with create organization link');
    await p.getByRole('link',{name:'Create organization',exact:true}).click();
    await p.getByRole('textbox',{name:/^Name/}).fill('Event QA Organization');
    const orgSlug=owner.handle;
    await p.getByRole('textbox',{name:/^Slug/}).fill(orgSlug);
    await p.getByRole('radio',{name:'Event company',exact:true}).click();
    await p.getByRole('button',{name:'Create organization',exact:true}).click();
    await p.getByRole('link',{name:'Create event',exact:true}).click();
    await p.getByRole('textbox',{name:'Title *',exact:true}).fill('서울 행사');
    assert.equal(await p.getByRole('textbox',{name:'Event URL *',exact:true}).inputValue(),'');
    const title='Seoul AI Builders Summit 2026 '+ 'Long title '.repeat(8);
    await p.getByRole('textbox',{name:'Title *',exact:true}).fill(title);
    const slug='event-'+Date.now();
    await p.getByRole('textbox',{name:'Event URL *',exact:true}).fill(slug);
    await p.getByRole('textbox',{name:'Description (optional)',exact:true}).fill('A real local test event. '+ 'Long description text '.repeat(60));
    await p.getByRole('textbox',{name:'Find timezone',exact:true}).fill('Asia/Seoul');
    await p.getByRole('radio',{name:'Asia/Seoul',exact:true}).click();
    await p.locator('input[type="datetime-local"]').nth(0).fill('2026-10-10T15:00');
    await p.locator('input[type="datetime-local"]').nth(1).fill('2026-10-10T17:00');
    await p.getByRole('textbox',{name:'Find timezone',exact:true}).fill('America/New_York');
    await p.getByRole('radio',{name:'America/New_York',exact:true}).click();
    assert.equal(await p.locator('#event-start').inputValue(),'2026-10-10T02:00');
    await p.getByRole('textbox',{name:'Find timezone',exact:true}).fill('Asia/Seoul');
    await p.getByRole('radio',{name:'Asia/Seoul',exact:true}).click();
    assert.equal(await p.locator('#event-start').inputValue(),'2026-10-10T15:00');
    pass('timezone changes preserve instants');
    await p.getByRole('textbox',{name:'City *',exact:true}).fill('Seoul');
    await p.getByRole('textbox',{name:'Country *',exact:true}).fill('South Korea');
    await p.getByRole('checkbox',{name:'Hackathon',exact:true}).click();
    await p.getByRole('checkbox',{name:'Developers',exact:true}).click();
    await p.getByRole('radio',{name:'200–999',exact:true}).click();
    await p.getByRole('textbox',{name:'Website (optional)',exact:true}).fill('javascript:alert(1)');
    await p.getByRole('button',{name:'Create draft',exact:true}).click();
    await p.getByText('Use a valid HTTP or HTTPS website.',{exact:true}).waitFor();
    assert.equal(await p.locator('#event-start').inputValue(),'2026-10-10T15:00');
    await p.locator('#event-end').fill('2026-10-10T14:00');
    await p.getByRole('button',{name:'Create draft',exact:true}).click();
    await p.getByText('End must be after start.',{exact:true}).waitFor();
    await p.locator('#event-end').fill('2026-10-10T17:00');
    await p.getByRole('textbox',{name:'Website (optional)',exact:true}).fill('https://example.com/'+ 'long-path-'.repeat(15));
    await matrix(p,'create');
    let inserts=0;
    await p.route('**/rest/v1/events*',async route=>{if(route.request().method()==='POST'){inserts++;await new Promise(r=>setTimeout(r,200));}await route.continue();});
    await p.getByRole('button',{name:'Create draft',exact:true}).evaluate(el=>{el.click();el.click();});
    await p.getByRole('link',{name:'Edit event',exact:true}).waitFor();
    assert.equal(inserts,1);
    assert.equal(new URL(p.url()).pathname,'/events/'+slug);
    const eventResponse=await rest(p,'GET','events?slug=eq.'+slug);
    assert.equal(eventResponse.status,200); const event=eventResponse.body[0];
    assert.equal(event.status,'draft');assert.equal(Date.parse(event.starts_at),Date.parse('2026-10-10T06:00:00Z'));
    pass('draft creation, duplicate-submit prevention, Seoul stored instant');
    await matrix(p,'view');
    const anonContext=await browser.newContext(), anon=await anonContext.newPage();anon.setDefaultTimeout(30000);
    await navigate(anon,base+'/events/'+slug); await anon.getByText('Event unavailable',{exact:true}).waitFor();
    pass('anonymous draft unavailable');
    await p.getByRole('link',{name:'Edit event',exact:true}).click();
    await p.getByRole('button',{name:'Save event',exact:true}).waitFor();
    assert.equal(await p.getByRole('textbox',{name:'Event URL *',exact:true}).count(),0);
    await p.getByRole('textbox',{name:'Title *',exact:true}).fill('Edited '+title);
    await matrix(p,'edit');
    await p.getByRole('button',{name:'Save event',exact:true}).click();
    await p.getByRole('button',{name:'Publish event',exact:true}).click();
    await p.getByText('Published',{exact:true}).waitFor();
    pass('edit and publish');
    await anon.reload({waitUntil:'domcontentloaded',timeout:120000});await anon.getByText('Published',{exact:true}).waitFor();
    assert.equal(await anon.getByRole('link',{name:'Edit event',exact:true}).count(),0);
    assert.ok((await anon.title()).includes('Maple'));
    await anon.getByRole('link',{name:'Event QA Organization',exact:true}).click();
    await anon.getByRole('link',{name:'Edited '+title,exact:true}).waitFor();
    assert.equal(await anon.getByRole('link',{name:'Create event',exact:true}).count(),0);
    pass('anonymous published visibility and public organization event list');
    await navigate(p,base+'/org/'+orgSlug);
    await p.getByRole('link',{name:'Edited '+title,exact:true}).waitFor();await matrix(p,'organization-list');
    const sponsor=await signup(browser,'sponsor');await navigate(sponsor.page,base+'/events/new');
    await sponsor.page.getByText('Only Organizer profiles can create events.',{exact:true}).waitFor();
    const body={org_id:event.org_id,title:'Forbidden',slug:'forbidden-'+Date.now(),format:'online',starts_at:event.starts_at,ends_at:event.ends_at,timezone:event.timezone,categories:event.categories,audience_types:event.audience_types,attendance_band:event.attendance_band};
    assert.equal((await rest(sponsor.page,'POST','events',body)).status,403);
    const sponsorUpdate=await rest(sponsor.page,'PATCH','events?id=eq.'+event.id,{title:'Forbidden'});assert.deepEqual(sponsorUpdate.body,[]);
    pass('Sponsor UI and direct REST INSERT/UPDATE denied');
    const unrelated=await signup(browser,'organizer');
    assert.equal((await rest(unrelated.page,'POST','events',body)).status,403);
    assert.deepEqual((await rest(unrelated.page,'PATCH','events?id=eq.'+event.id,{title:'Forbidden'})).body,[]);
    await navigate(unrelated.page,base+'/events/'+slug+'/edit');await unrelated.page.getByText('Editing unavailable',{exact:true}).waitFor();
    pass('unrelated Organizer REST INSERT/UPDATE and edit UI denied');
    await navigate(p,base+'/events/'+slug);await p.getByRole('button',{name:'Unpublish event',exact:true}).click();
    await p.getByRole('button',{name:'Publish event',exact:true}).waitFor();
    for(const page of [anon,sponsor.page,unrelated.page]){await navigate(page,base+'/events/'+slug);await page.getByText('Event unavailable',{exact:true}).waitFor();}
    pass('unpublish restores anonymous, Sponsor and unrelated draft privacy');
    for(const key of ['slug','org_id','created_by']){
      const denied=await rest(p,'PATCH','events?id=eq.'+event.id,{[key]:key==='slug'?'changed-slug':event.created_by});
      assert.equal(denied.status,403);
    }
    pass('admin direct REST protected-column mutations denied');
    await p.getByRole('button',{name:'Publish event',exact:true}).click();await p.getByText('Published',{exact:true}).waitFor();
    fs.writeFileSync(out+'/result.json',JSON.stringify({result:'PASS',slug,orgSlug},null,2));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
