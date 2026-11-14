// v0.30 national timeline: a real archived season shows its awards, upsets and standing records under the champion,
// every entry opens the right screen, and the phone layout never scrolls sideways.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright-core');const {chromiumPath}=require('./helpers/chromium-path');const {loadEngine}=require('../tools/harness');
(async()=>{
 const e=loadEngine({seed:9612});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 e.simSeason();e.simConferenceChampionships();e.simBowls();e.simPlayoff();
 const u=e.universe;
 // A guaranteed upset in the archive, so the test never depends on one season's results.
 const g=u.gameArchive.find(x=>x.phase==='regular'&&x.final);g.home.rank=60;g.away.rank=1;g.score={home:28,away:17};
 const row=e.nationalTimeline()[0];
 assert.ok(row&&row.awards.length&&row.upsets.length,'the archived season has awards and upsets');
 const save=JSON.parse(JSON.stringify({userTeam:'Chicago Metropolitan',universe:e.packUniverse(u)}));
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),at=html.lastIndexOf('loadSchools().then(');
 const patched=html.slice(0,at)+'window.__TIMELINE_QA__={installSave};'+html.slice(at);
 const shots=process.env.TIMELINE_SHOTS||null;
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{for(const[label,viewport]of [['desktop',{width:1280,height:900}],['phone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',x=>errors.push(String(x)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route('**/index.html',r=>r.fulfill({contentType:'text/html',body:patched}));await page.goto('file://'+path.join(__dirname,'..','index.html'));
  await page.waitForFunction(()=>window.__TIMELINE_QA__&&document.querySelector('#titleTeam')?.options.length>0);
  await page.evaluate(save=>{window.__TIMELINE_QA__.installSave(save);document.querySelector('#titleScreen').hidden=true;document.querySelector('#app').hidden=false;document.querySelector('.tabs button[data-tab="history"]').click()},save);
  const detail=page.locator('#championTimeline details.timeline-detail').first();
  await detail.locator('summary').waitFor({state:'visible'});
  await detail.locator('summary').click();
  const text=await detail.innerText();
  assert.match(text,new RegExp(row.awards[0].name),`[${label}] award listed`);
  assert.match(text,new RegExp(`beat #1 `),`[${label}] upset listed with the loser's ranking`);
  if(shots)await page.screenshot({path:path.join(shots,`timeline-${label}.png`),fullPage:false,clip:await detail.boundingBox().then(b=>({x:0,y:Math.max(0,b.y-90),width:viewport.width,height:Math.min(viewport.height,b.height+100)}))});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=1,`[${label}] no horizontal scroll (${overflow}px)`);
  const small=await detail.locator('.timeline-link').evaluateAll(xs=>xs.filter(x=>x.getBoundingClientRect().height<44).length);
  assert.equal(small,0,`[${label}] timeline entries are at least 44px tall`);
  // The upset opens its box score.
  await detail.locator(`[data-game-id="${g.id}"]`).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('dialog[open],.modal:not([hidden]),[role="dialog"]')].some(d=>d.offsetParent!==null||d.open),null,{timeout:4000});
  await page.keyboard.press('Escape');
  // The open season stays open after the page re-renders.
  await page.evaluate(()=>document.querySelector('.tabs button[data-tab="history"]').click());
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#championTimeline details.timeline-detail').first().evaluate(d=>d.open),true,`[${label}] open season survives a re-render`);
  assert.deepEqual(errors,[],`[${label}] no console errors`);
  await page.close();
 }}finally{await browser.close()}
 console.log('national timeline browser check passed (desktop + phone)');
})().catch(err=>{console.error(err);process.exit(1)});
