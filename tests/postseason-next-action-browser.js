const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const {startNewDynasty:sharedStartNewDynasty}=require('./helpers/start-new-dynasty');
const startNewDynasty=page=>sharedStartNewDynasty(page);
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));
    await startNewDynasty(page);
    await page.click('#simSeason');
    await page.waitForFunction(()=>!document.querySelector('#simConf').disabled,{timeout:60000});
    assert.match(await page.locator('#hubAdvance').innerText(),/conference championships/i);
    await page.click('#hubAdvance');
    await page.waitForFunction(()=>!document.querySelector('#simBowls').disabled,{timeout:30000});
    assert.match(await page.locator('#hubAdvance').innerText(),/bowl games/i);
    await page.click('#hubAdvance');
    await page.waitForFunction(()=>!document.querySelector('#simPlayoff').disabled,{timeout:30000});
    assert.match(await page.locator('#hubAdvance').innerText(),/playoff/i);
    await page.click('#hubAdvance');
    await page.waitForFunction(()=>document.querySelector('#simPlayoff').disabled,{timeout:30000});
    const text=await page.locator('#weeklyPlan').innerText();
    assert.match(text,/Scholarship limit warning|Run season review|Process departures|Enroll the signing class|Nothing pending/i);
    assert.doesNotMatch(text,/Get under the scholarship limit/i);
    assert.deepEqual(errors,[],`browser emitted errors: ${errors.join('\n')}`);
    console.log('PASS postseason Next advances conf -> bowls -> playoff and warnings stay non-blocking');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
