const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {loadEngine}=require('../tools/harness');
(async()=>{
 const e=loadEngine({seed:9510});await e.loadSchools();e.initUniverse();const u=e.universe,t=u.teams[0];e.setUserTeam(t.name);
 for(const team of u.teams){team.w=10;team.l=2;team.adminConfidence=95;}
 u.phase='complete';u.offseason=e.makeOffseasonState(u.year,'review');e.offseasonReview();e.offseasonDepartures();e.offseasonEnrollment();e.offseasonPortal();e.runSpringCamp();e.runFallCamp();
 const save=JSON.parse(JSON.stringify({userTeam:t.name,universe:e.packUniverse(u)}));
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const anchor=html.lastIndexOf('loadSchools().then(');
 const patched=html.slice(0,anchor)+'window.__RECAP_QA__={installSave,render,offseasonPreseason};'+html.slice(anchor);
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
 for(const [label,viewport]of [['desktop',{width:1280,height:1000}],['mobile',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route('**/index.html',route=>route.fulfill({contentType:'text/html',body:patched}));
  await page.goto('file://'+path.join(__dirname,'..','index.html'));
  await page.waitForFunction(()=>window.__RECAP_QA__&&document.querySelector('#titleTeam')?.options.length>0);
  await page.evaluate(save=>{window.__RECAP_QA__.installSave(save);document.querySelector('#titleScreen').hidden=true;document.querySelector('#app').hidden=false;document.querySelector('.tabs button[data-tab="dashboard"]').click()},save);
  await page.locator('#offseasonRecap').waitFor({state:'visible',timeout:10000});
  const text=await page.locator('#offseasonRecap').innerText();
  assert.match(text,/Roster accounting/);assert.match(text,/eligibility/i);assert.match(text,/walk-ons/i);assert.match(text,/Staff-estimated/i);
  assert.equal(await page.locator('#offseasonRecap [data-recap-next]').count(),1);
  await page.locator('#offseasonRecap').screenshot({path:'/tmp/dynasty-recap-'+label+'.png'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  await page.evaluate(()=>{window.__RECAP_QA__.offseasonPreseason();window.__RECAP_QA__.render()});
  assert.match(await page.locator('#offseasonRecap').innerText(),/Opening-day roster/);
  const unsafe=JSON.parse(JSON.stringify(save));unsafe.universe.offseason.reports.roster[t.id].losses[0].rating='<b data-injected>bad</b>';
  await page.evaluate(save=>window.__RECAP_QA__.installSave(save),unsafe);
  assert.equal(await page.locator('#offseasonRecap [data-injected]').count(),0,'imported recap fields must be escaped');
  assert.deepEqual(errors,[],label+' console');await page.close();console.log(label+' offseason recap PASS');
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
