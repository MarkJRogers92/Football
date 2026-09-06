const {chromium}=require('playwright-core');
const path=require('path');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});let failures=0;
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport});await page.goto('file://'+path.join(__dirname,'..','index.html'));await page.click('#titleNew');await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
  await page.evaluate(()=>window.__DL_TEST__.prepareDevelopmentResults());await page.click('.tab-groups button[data-group="team"]');await page.click('.tabs button[data-tab="development"]');await page.waitForSelector('.development-results-hero');
  const checks=[['summary hero',await page.locator('.development-results-hero').count()===1],['player rows',await page.locator('[data-development-result]').count()>20],['detail panel',await page.locator('#developmentResultDetail .development-attribute').count()===7],['position filters',await page.locator('.development-groups [data-development-filter]').count()>8],['no page overflow',await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=1]];
  for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} [${label}] ${name}`);if(!ok)failures++}await page.close();
 }
 await browser.close();process.exit(failures?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
