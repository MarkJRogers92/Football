const {chromium}=require('playwright-core');
const path=require('path');
const goDevelopment=page=>page.evaluate(()=>{const g=document.querySelector('.tab-groups button[data-group="team"]');if(g&&!g.classList.contains('active'))g.click();document.querySelector('.tabs button[data-tab="development"]')?.click()});

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});let failures=0;
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await page.click('#titleNew');await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
  await page.evaluate(()=>window.__DL_TEST__.prepareDevelopmentResults());await goDevelopment(page);await page.waitForSelector('.development-results-hero');await page.waitForSelector('#developmentVisualLab');
  const lab=page.locator('#developmentVisualLab'),guardrail=(await lab.locator('.dev-viz-guardrail').innerText()).toLowerCase(),picker=lab.locator('.dev-player-picker [data-dev-player]');
  if(await picker.count()){await picker.first().click();await page.waitForTimeout(30)}
  const checks=[
   ['results summary hero',await page.locator('.development-results-hero').count()===1],
   ['results player rows',await page.locator('[data-development-result]').count()>20],
   ['results detail panel',await page.locator('#developmentResultDetail .development-attribute').count()===7],
   ['results position filters',await page.locator('.development-groups [data-development-filter]').count()>8],
   ['development lab visible',await lab.isVisible()],
   ['team dashboard has three analysis surfaces',await lab.locator('.dev-team-grid > section').count()===3],
   ['player files available',await picker.count()>0],
   ['individual observed progression is rendered',await lab.locator('.dev-player-detail').innerText().then(t=>/observed progression/i.test(t))&&await lab.locator('.dev-chart svg').count()===1],
   ['position-group movement is visualized',await lab.locator('.dev-group-row').count()>5],
   ['hidden-growth guardrail is explicit',guardrail.includes('hidden growth curves')&&guardrail.includes('true talent')],
   ['no page overflow',await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=1],
   ['no console errors',errors.length===0]
  ];
  for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} [${label}] ${name}`);if(!ok)failures++}await page.close();
 }
 await browser.close();process.exit(failures?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
