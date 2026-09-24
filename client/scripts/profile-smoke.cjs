/* global __dirname */
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require(process.env.MAPLE_PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../dist');
const mail = process.env.MAPLE_LOCAL_MAIL_URL;
assert(mail && ['127.0.0.1','localhost'].includes(new URL(mail).hostname), 'Local Mailpit required');
const out = process.env.MAPLE_PROFILE_QA_OUTPUT;
const results = [];
const pass = test => { results.push({test,result:'PASS'}); console.log('PASS '+test); };
const server = http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file))file+='.html';
  if(!fs.existsSync(file))file=path.join(root,'index.html');
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
async function otp(email){
  for(let n=0;n<30;n++){
    const inbox=await(await fetch(mail+'/api/v1/messages')).json();
    const message=inbox.messages.find(m=>m.To.some(t=>t.Address===email));
    if(message){const content=await(await fetch(mail+'/api/v1/message/'+message.ID)).json();return content.HTML.match(/<strong>(\d{6})<\/strong>/)[1];}
    await new Promise(r=>setTimeout(r,300));
  }
  throw new Error('No captured OTP');
}
async function matrix(page,stage){
  for(const [width,height] of [[1440,900],[390,844]])for(const colorScheme of ['light','dark']){
    await page.setViewportSize({width,height});await page.emulateMedia({colorScheme});
    await page.waitForTimeout(80);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow at '+stage);
    if(out)await page.screenshot({path:path.join(out,'profile-'+stage+'-'+width+'-'+colorScheme+'.png'),fullPage:true});
  }
  pass(stage+' all four viewport/theme combinations');
}
async function signIn(page,email){
  await page.goto('http://127.0.0.1:8768/login');
  await page.getByRole('textbox',{name:'Email address',exact:true}).fill(email);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('textbox',{name:'Verification code',exact:true}).fill(await otp(email));
  await page.getByRole('button',{name:'Verify',exact:true}).click();
  await page.getByRole('radio',{name:'I organize events',exact:true}).waitFor();
  assert.equal(new URL(page.url()).pathname,'/onboarding');
}
async function identity(page,name,handle){
  await page.getByRole('textbox',{name:/^Name/}).fill(name);
  await page.getByRole('textbox',{name:/^Handle/}).fill(handle);
  await page.getByRole('textbox',{name:/^Headline/}).fill('Building thoughtful events');
  await page.getByRole('textbox',{name:/^Location/}).fill('Seoul');
  await page.getByRole('textbox',{name:/^Bio/}).fill('A fictional local test profile.');
}
(async()=>{
  if(out)fs.mkdirSync(out,{recursive:true});
  await new Promise(r=>server.listen(8768,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,channel:process.env.MAPLE_BROWSER_CHANNEL||'msedge'});
  try{
    for(const role of ['organizer','sponsor']){
      const context=await browser.newContext();const page=await context.newPage();const errors=[];
      page.on('pageerror',()=>errors.push('runtime error'));
      for(const target of ['/onboarding','/me','/me/edit']){
        await page.goto('http://127.0.0.1:8768'+target);await page.getByRole('button',{name:'Continue',exact:true}).waitFor();assert.equal(new URL(page.url()).pathname,'/login');
      }
      pass(role+' logged-out route guards');
      const suffix=Date.now();const email='cp4-'+role+'-'+suffix+'@example.test';const handle='cp4-'+role+'-'+suffix;
      await signIn(page,email);pass(role+' real OTP login → missing profile → onboarding');
      for(const target of ['/login','/me','/me/edit']){
        await page.goto('http://127.0.0.1:8768'+target);await page.getByRole('radio',{name:'I organize events',exact:true}).waitFor();assert.equal(new URL(page.url()).pathname,'/onboarding');
      }
      pass(role+' missing-profile route guards');
      await page.getByRole('radio',{name:role==='organizer'?'I organize events':'I sponsor events',exact:true}).click();
      await matrix(page,role+'-role');
      await page.getByRole('button',{name:'Next',exact:true}).click();
      await page.getByRole('textbox',{name:/^Name/}).fill('김민수');
      assert.equal(await page.getByRole('textbox',{name:/^Handle/}).inputValue(),'');
      pass(role+' non-Latin name leaves handle empty');
      await page.getByRole('button',{name:'Next',exact:true}).click();
      await page.getByRole('alert').first().waitFor();pass(role+' invalid required fields blocked');
      await identity(page,'Maple '+role,handle);
      await page.getByRole('button',{name:'Check handle availability',exact:true}).click();
      await page.getByText('Available',{exact:true}).waitFor();
      await matrix(page,role+'-identity');
      await page.getByRole('button',{name:'Next',exact:true}).click();
      await page.getByRole('checkbox',{name:'Hackathon',exact:true}).click();
      await page.getByRole('checkbox',{name:'Asia',exact:true}).click();
      await page.getByRole('checkbox',{name:'Developers',exact:true}).click();
      await page.getByRole('checkbox',{name:role==='organizer'?'50–199':'Credits',exact:true}).click();
      if(role==='sponsor'){
        assert.equal(await page.getByText('Typical attendance',{exact:true}).count(),0);
        assert.equal(await page.getByText(/budget/i).count(),0);
      }
      await matrix(page,role+'-preferences');
      await page.getByRole('button',{name:'Back',exact:true}).click();
      assert.equal(await page.getByRole('textbox',{name:/^Handle/}).inputValue(),handle);
      await page.getByRole('button',{name:'Next',exact:true}).click();
      assert.equal(await page.getByRole('checkbox',{name:'Hackathon',exact:true}).getAttribute('aria-checked'),'true');
      pass(role+' Back/Next retains values without partial insert');
      await page.getByRole('button',{name:'Next',exact:true}).click();
      await matrix(page,role+'-review');
      let inserts=0;
      await page.route('**/rest/v1/profiles*',async route=>{
        if(route.request().method()==='POST'){inserts++;await new Promise(r=>setTimeout(r,700));}
        await route.continue();
      });
      await page.getByRole('button',{name:'Create profile',exact:true}).evaluate(el=>{el.click();el.click();});
      assert(await page.getByRole('button',{name:'Creating profile…',exact:true}).isDisabled());
      await page.getByRole('link',{name:'Edit profile',exact:true}).waitFor();
      assert.equal(inserts,1);assert.equal(new URL(page.url()).pathname,'/me');
      await page.getByText('Profile completeness: 100%',{exact:true}).waitFor();
      pass(role+' one INSERT; in-flight disabled; immediate shared state → /me; DB score 100');
      await page.unroute('**/rest/v1/profiles*');
      await matrix(page,role+'-me');
      for(const target of ['/login','/onboarding']){
        await page.goto('http://127.0.0.1:8768'+target);await page.getByRole('link',{name:'Edit profile',exact:true}).waitFor();assert.equal(new URL(page.url()).pathname,'/me');
      }
      await page.reload();await page.getByRole('link',{name:'Edit profile',exact:true}).waitFor();
      pass(role+' existing-profile guards and refresh persistence');
      await page.getByRole('link',{name:'Edit profile',exact:true}).click();
      await page.getByRole('button',{name:'Save changes',exact:true}).waitFor();
      assert.equal(await page.getByRole('radio').count(),0);
      await matrix(page,role+'-edit');
      await page.getByRole('textbox',{name:/^Headline/}).fill('Updated '+role+' headline');
      await page.getByRole('button',{name:'Save changes',exact:true}).click();
      await page.getByRole('link',{name:'Edit profile',exact:true}).waitFor();
      await page.getByText('Updated '+role+' headline',{exact:true}).last().waitFor();
      await page.getByText(role==='organizer'?'Organizer':'Sponsor',{exact:true}).last().waitFor();
      pass(role+' normal edit updates shared state immediately; role unchanged');

      await page.route('**/rest/v1/profiles*',route=>route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:'test_failure',message:'controlled lookup failure'})}));
      await page.goto('http://127.0.0.1:8768/me');
      await page.getByRole('button',{name:'Retry profile',exact:true}).waitFor();
      await page.unroute('**/rest/v1/profiles*');
      await page.getByRole('button',{name:'Retry profile',exact:true}).click();
      await page.getByRole('link',{name:'Edit profile',exact:true}).waitFor();
      pass(role+' profile query failure and shared-state retry recover');

      // Simulate one stale missing-profile read. The subsequent INSERT is real and
      // collides with the existing PK; recovery reads the real row without overwriting it.
      let hideOnce=true;
      await page.route('**/rest/v1/profiles*',async route=>{
        if(hideOnce&&route.request().method()==='GET'){hideOnce=false;return route.fulfill({status:200,contentType:'application/json',body:'null'});}
        return route.continue();
      });
      await page.goto('http://127.0.0.1:8768/onboarding');
      await page.getByRole('radio',{name:role==='organizer'?'I organize events':'I sponsor events',exact:true}).click();
      await page.getByRole('button',{name:'Next',exact:true}).click();
      await identity(page,'Do not overwrite',handle+'x');
      await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Next',exact:true}).click();
      await page.getByRole('button',{name:'Create profile',exact:true}).click();
      await page.getByRole('link',{name:'Edit profile',exact:true}).waitFor();
      await page.getByText('Updated '+role+' headline',{exact:true}).last().waitFor();
      pass(role+' actual duplicate-PK recovery preserves existing own profile');
      await page.unroute('**/rest/v1/profiles*');
      await page.getByRole('button',{name:'Sign out',exact:true}).click();
      await page.getByRole('button',{name:'Continue',exact:true}).waitFor();
      pass(role+' sign out');
      assert.deepEqual(errors,[]);await context.close();
    }
    console.log('Profile smoke complete: '+results.length+' checks');
    if(out)fs.writeFileSync(path.join(out,'profile-results.json'),JSON.stringify(results,null,2));
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error('FAIL '+error.message.replace(/\b\d{6}\b/g,'[redacted]'));server.close();process.exitCode=1;});
