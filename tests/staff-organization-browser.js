const {chromium}=require('playwright-core');
const path=require('path');
const goTab=(page,id,group='staff')=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group});
const start=async page=>{await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});let pass=0,fail=0;
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));const check=(name,ok,detail='')=>{ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'} [${label}] ${name}${detail?` — ${detail}`:''}`)};
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await start(page);await goTab(page,'staff');await page.waitForSelector('#staffOrganizationBoard',{timeout:10000});
  check('football operations hierarchy is visible',await page.locator('#staffOrganizationBoard').isVisible());
  check('head coach is visually separated as program leadership',await page.locator('.staff-org-hc[data-staff-slot="HC"]').count()===1);
  check('four real functional departments sit below the head coach',await page.locator('.staff-org-department').count()===4);
  const slots=await page.locator('[data-staff-slot]').evaluateAll(xs=>xs.map(x=>x.dataset.staffSlot));check('organization uses exactly the five canonical staff slots',JSON.stringify(slots)===JSON.stringify(['HC','OC','DC','RC','SC']),slots.join(','));
  check('coach ratings are visible in department cards',await page.locator('.so-metric').count()===25);
  check('canonical staff cards remain available',await page.locator('#staffList .coach-card').count()===5);
  check('canonical scheme identity remains available',(await page.locator('#schemeCard').innerText()).length>20);
  check('coaching market remains available',await page.locator('#coachMarket').count()===1);
  check('coaching tree remains available',await page.locator('#coachingTree').count()===1);
  const note=(await page.locator('.so-note').innerText()).toLowerCase();check('presentation explicitly avoids invented position coaches and mechanics',note.includes('does not invent position coaches')&&note.includes('separate staff mechanics'));
  const first=page.locator('[data-so-coach]').first();await first.click();await page.waitForSelector('#coachDialog[open]',{timeout:10000});check('visual coach name delegates to canonical coach profile',await page.locator('#coachDialog[open]').isVisible());await page.evaluate(()=>document.querySelector('#coachDialog')?.close?.());
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check('no page-level horizontal overflow',overflow<=1,`${overflow}px`);
  check('no console errors',errors.length===0,errors.slice(0,4).join(' | '));await page.close();
 }
 await browser.close();console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
