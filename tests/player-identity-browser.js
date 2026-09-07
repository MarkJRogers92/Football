const {chromium}=require('playwright-core');
const path=require('path');
const goTab=(page,id,group='team')=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group});
const start=async page=>{await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});let pass=0,fail=0;
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));const check=(name,ok,detail='')=>{ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'} [${label}] ${name}${detail?` — ${detail}`:''}`)};
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await start(page);await goTab(page,'depth');await page.waitForSelector('#depthGrid select[data-role="QB1"]',{timeout:10000});const qb=await page.locator('#depthGrid select[data-role="QB1"]').inputValue();await goTab(page,'roster');await page.waitForSelector(`#rosterBody [data-player="${qb}"]`,{timeout:10000});await page.click(`#rosterBody [data-player="${qb}"]`);await page.waitForSelector('#playerDialog[open] #playerIdentityHero',{timeout:10000});
  check('premium player dossier is visible',await page.locator('#playerIdentityHero').isVisible());
  check('Portrait V1 remains the canonical visual',await page.locator('#playerDialogPortrait canvas, #playerDialogPortrait img').count()>=1);
  const portrait=await page.locator('#playerDialogPortrait').boundingBox();check('player portrait has hero-scale treatment',!!portrait&&portrait.width>=(label==='desktop'?120:80),portrait?`${Math.round(portrait.width)}px`:'missing');
  const brand=await page.locator('#playerDialog').evaluate(el=>({primary:el.style.getPropertyValue('--program-primary'),secondary:el.style.getPropertyValue('--program-secondary'),team:el.dataset.brandTeamId}));check('player school branding is applied to dossier',!!brand.primary&&!!brand.secondary&&!!brand.team,JSON.stringify(brand));
  const hero=await page.locator('#playerIdentityHero').innerText(),heroLower=hero.toLowerCase();check('football role is promoted ahead of dense profile detail',heroLower.includes('football role')&&heroLower.includes('starting qb'));
  check('staff evaluation keeps current/upside/confidence visible',heroLower.includes('staff evaluation')&&heroLower.includes('current')&&heroLower.includes('upside')&&heroLower.includes('confidence'));
  check('dossier explicitly preserves uncertainty',heroLower.includes('hidden true talent and growth remain private'));
  check('current production is surfaced in hero',heroLower.includes('current production'));
  check('development read is surfaced in hero',heroLower.includes('development read'));
  const body=(await page.locator('#playerDialogBody').innerText()).toLowerCase();check('canonical detailed profile sections remain below',body.includes('season')&&body.includes('development')&&body.includes('health')&&body.includes('career'));
  const meta=await page.locator('#playerDialogMeta').innerText();check('canonical player metadata remains intact',meta.includes('QB'));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check('no page-level horizontal overflow',overflow<=1,`${overflow}px`);
  check('no console errors',errors.length===0,errors.slice(0,4).join(' | '));await page.close();
 }
 await browser.close();console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
