const {chromium}=require('playwright-core');
const path=require('path');
const goRecruiting=page=>page.evaluate(()=>{const g=document.querySelector('.tab-groups button[data-group="recruiting"]');if(g&&!g.classList.contains('active'))g.click();document.querySelector('.tabs button[data-tab="recruiting"]')?.click()});
const useTableView=async page=>{await page.waitForSelector('#rwSwitch');await page.click('#rwSwitch [data-rwm="table"]');await page.waitForFunction(()=>!document.querySelector('#recruiting > .table-wrap')?.classList.contains('recruit-table-hidden'))};

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('file://'+path.join(__dirname,'..','index.html'));
 await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
 await goRecruiting(page);await useTableView(page);await page.waitForSelector('#recruitBody tr [data-recruit]');
 await page.locator('#recruitBody tr [data-recruit]').first().click();await page.waitForSelector('#recruitDialog[open] .scouting-trail-card');
 let text=await page.locator('#recruitDialog .scouting-trail-card').innerText();
 if(!/EVALUATION TRAIL/.test(text)||!/No manual evaluation yet/.test(text))throw new Error('fresh recruit evaluation trail did not render empty state');
 const quick=page.locator('#recruitDialog [data-scout-action="quick"]');if(await quick.isDisabled())throw new Error('Quick Film unexpectedly disabled for fresh recruit');
 await quick.click();await page.waitForSelector('#recruitDialog[open] .scouting-trail-card');await page.waitForFunction(()=>/Quick Film/.test(document.querySelector('#recruitDialog .scouting-trail-card')?.innerText||''),{timeout:10000});
 text=await page.locator('#recruitDialog .scouting-trail-card').innerText();
 if(!/Quick Film/.test(text)||!/1 hour spent/.test(text)||!/Confidence/.test(text))throw new Error(`Quick Film receipt not reflected in trail: ${text}`);
 if(errors.length)throw new Error(`console errors: ${errors.join(' | ')}`);
 console.log('PASS evaluation trail renders empty state and updates after Quick Film');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});