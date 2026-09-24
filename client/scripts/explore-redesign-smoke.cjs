// Explore-only browser QA. Uses existing local accounts; creates or changes no application records.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const {chromium}=require(process.env.MAPLE_PLAYWRIGHT_MODULE);
const env=fs.readFileSync('.env.local','utf8');
const value=name=>env.match(new RegExp('^'+name+'=(.*)$','m'))[1].trim().replace(/^['"]|['"]$/g,'');
const url=value('EXPO_PUBLIC_SUPABASE_URL'),key=value('EXPO_PUBLIC_SUPABASE_ANON_KEY');
if(!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Local QA only');
const base=process.env.MAPLE_WEB_BASE||'http://127.0.0.1:8098',out=process.env.MAPLE_EXPLORE_QA_OUTPUT;
function check(result){if(result.error)throw Error(result.error.message);return result.data;}
const inbox=async()=>await(await fetch('http://127.0.0.1:55324/api/v1/messages')).json();
async function existingSession(role){
 const before=await inbox(),seen=new Set(before.messages.map(m=>m.ID));
 const email=before.messages.flatMap(m=>m.To.map(t=>t.Address)).find(email=>email.startsWith('opp-'+role+'-'));
 assert(email,'Existing local '+role+' account required');
 const client=createClient(url,key,{auth:{persistSession:false}});
 check(await client.auth.signInWithOtp({email,options:{shouldCreateUser:false}}));
 let token;
 for(let i=0;i<40;i++){const messages=await inbox();const message=messages.messages.find(m=>!seen.has(m.ID)&&m.To.some(t=>t.Address===email));
 if(message){const body=await(await fetch('http://127.0.0.1:55324/api/v1/message/'+message.ID)).json();token=body.HTML.match(/<strong>(\d{6})<\/strong>/)[1];break;}await new Promise(resolve=>setTimeout(resolve,200));}
 const {session}=check(await client.auth.verifyOtp({email,token,type:'email'}));
 const profile=check(await client.from('profiles').select('role').eq('id',session.user.id).single());assert.equal(profile.role,role);return session;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 for(const role of (process.env.MAPLE_QA_ROLE?[process.env.MAPLE_QA_ROLE]:['sponsor','organizer'])){
 const session=await existingSession(role),context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.addInitScript(({session,key})=>localStorage.setItem(key,JSON.stringify(session)),{session,key:'sb-'+new URL(url).hostname.split('.')[0]+'-auth-token'});
 const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(120000);
 const privateRequests=[];let realRows=[];
 page.on('request',request=>{if(request.url().includes('opportunity_call_budgets'))privateRequests.push(request.url());});
 page.on('response',async response=>{if(response.url().includes('/rpc/list_public_opportunities')&&response.ok()){try{const data=await response.json();if(data.length)realRows=data;}catch{}}});
 const cards=()=>page.locator('[data-testid="marketplace-listing"]:visible');
 await page.goto(base+'/explore',{waitUntil:'domcontentloaded'});await cards().first().waitFor();
 for(const colorScheme of ['light','dark'])for(const [width,height] of [[1440,900],[390,844]]){
 await page.setViewportSize({width,height});await page.emulateMedia({colorScheme});await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,role+' overflow');
 await page.screenshot({path:path.join(out,role+'-'+width+'-'+colorScheme+'.png'),fullPage:false});
 if(width===1440){const sidebar=await page.getByTestId('explore-filters').boundingBox();assert(sidebar.width>=240&&sidebar.width<=260);}
 else{assert(!(await page.getByTestId('explore-filters').isVisible()));await page.getByRole('button',{name:'Filters',exact:true}).click();await page.getByRole('checkbox',{name:'Categories: Hackathon',exact:true}).waitFor();await page.getByRole('button',{name:'Close filters',exact:true}).click();}
 }
 console.log('PASS '+role+' responsive light/dark, category strip, sidebar/mobile panel');
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({colorScheme:'light'});
 await page.getByRole('button',{name:'Browse Hackathon',exact:true}).click();await cards().first().waitFor();
 assert.equal(await page.getByRole('checkbox',{name:'Categories: Hackathon',exact:true}).getAttribute('aria-checked'),'true');
 await page.getByRole('checkbox',{name:'Audience: Developers',exact:true}).focus();await page.keyboard.press('Space');await cards().first().waitFor();
 assert.equal(await page.getByRole('checkbox',{name:'Audience: Developers',exact:true}).getAttribute('aria-checked'),'true');
 await page.getByRole('button',{name:'Clear all',exact:true}).click();await cards().first().waitFor();
 const link=cards().first().getByRole('link').first(),href=await link.getAttribute('href');await link.click();await page.waitForURL('**'+href);
 assert(!/25k_plus|private budget/i.test(await page.locator('body').textContent()));assert.equal(privateRequests.length,0);
 await page.getByRole('link',{name:'Explore',exact:true}).click();await page.waitForURL('**/explore');await cards().first().waitFor();
 console.log('PASS '+role+' category/filter keyboard interaction, clear, real detail navigation, budget privacy');
 // Isolated response fixture exercises pagination without seeding or mutating Supabase.
 assert(realRows.length>0);const fixture=realRows[0],offsets=[];
 await page.route('**/rest/v1/rpc/list_public_opportunities',async route=>{
 const args=route.request().postDataJSON();offsets.push(args.p_offset);
 const count=args.p_offset===0?20:2;
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(Array.from({length:count},(_,i)=>({...fixture,opportunity_id:'qa-page-'+(args.p_offset+i)})))});
 });
 await page.getByRole('button',{name:'Browse Hackathon',exact:true}).click();await page.getByRole('button',{name:'Load more',exact:true}).waitFor();
 assert.equal(await cards().count(),20);await page.getByRole('button',{name:'Load more',exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll('[data-testid="marketplace-listing"]').length>=22);
 assert.equal(await cards().count(),22);assert(offsets.includes(0)&&offsets.includes(20));assert(!(await page.getByRole('button',{name:'Load more',exact:true}).count()));
 console.log('PASS '+role+' pagination offsets, append and end state (browser fixture only)');
 await context.close();
 }
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({result:'PASS',applicationDataWrites:0,viewports:['1440x900','390x844'],themes:['light','dark'],pagination:'isolated browser response fixture'}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
