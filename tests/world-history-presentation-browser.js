const {chromium}=require('playwright-core');
const path=require('path');
const goTab=(page,id,group='program')=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group});
const {startNewDynasty:sharedStartNewDynasty}=require('./helpers/start-new-dynasty');
const start=page=>sharedStartNewDynasty(page);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});let pass=0,fail=0;
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));const check=(name,ok,detail='')=>{ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'} [${label}] ${name}${detail?` — ${detail}`:''}`)};
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await start(page);await goTab(page,'history');await page.waitForSelector('#dynastyMuseum',{state:'visible',timeout:10000});
  const museum=(await page.locator('#dynastyMuseum').innerText()).toLowerCase(),team=(await page.locator('#teamName').innerText()).trim(),snapshot=await page.evaluate(()=>globalThis.DynastyLabWorldHistoryPresentation?.snapshot?.());
  check('Dynasty Museum is visible',await page.locator('#dynastyMuseum').isVisible());
  check('program identity is tied to the controlled school',museum.includes(team.toLowerCase())&&snapshot?.teamName===team,team);
  check('tracked record is clearly labeled rather than pretending to know pre-tracking history',museum.includes('tracked win rate')&&museum.includes('tracked dynasty history'));
  check('conference and national title totals are visible',museum.includes('conference titles')&&museum.includes('national titles'));
  check('Trophy Room is present without inventing a championship',museum.includes('trophy room')&&museum.includes('no archived national title yet'));
  check('Program Honors is present without inventing an award',museum.includes('program honors')&&museum.includes('major award history will collect here'));
  check('Dynasty Timeline is present with a factual empty state',museum.includes('dynasty timeline')&&museum.includes('complete a season to begin the program timeline'));
  const brand=await page.locator('.legacy-hero').evaluate(el=>({primary:el.style.getPropertyValue('--legacy-primary-rgb'),secondary:el.style.getPropertyValue('--legacy-secondary-rgb')}));check('existing program palette brands the legacy hero',!!brand.primary&&!!brand.secondary,JSON.stringify(brand));
  check('canonical game archive remains available',await page.locator('#gameHistoryYear').count()===1&&await page.locator('#gameHistoryList').count()===1);
  check('canonical history log remains available',await page.locator('#historyLog').count()===1);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check('no page-level horizontal overflow',overflow<=1,`${overflow}px`);
  check('no console errors',errors.length===0,errors.slice(0,5).join(' | '));await page.close();
 }
 await browser.close();console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
