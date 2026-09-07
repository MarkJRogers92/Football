const {chromium}=require('playwright-core');
const path=require('path');

const startNewDynasty=async page=>{
  await page.waitForSelector('#titleNew',{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
  await page.click('#titleNew');
  await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});
  await page.click('#titleStart');
  await page.waitForFunction(()=>!document.querySelector('#app')?.hidden,{timeout:60000});
};

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  let fail=0,pass=0;const lines=[];
  const check=(name,ok,detail='')=>{ok?pass++:fail++;lines.push(`${ok?'PASS':'FAIL'} ${name}${detail?' — '+detail:''}`)};

  for(const [label,viewport] of [['desktop',{width:1280,height:900}],['mobile',{width:390,height:844}]]){
    const page=await browser.newPage({viewport});const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
    await page.waitForSelector('#clientRail');await page.waitForSelector('#clientStatus');
    check(`[${label}] premium shell mounts`,await page.locator('#clientRail').count()===1&&await page.locator('#clientStatus').count()===1);
    check(`[${label}] legacy group nav is visually retired`,await page.$eval('.tab-groups',el=>getComputedStyle(el).display)==='none');

    if(label==='desktop'){
      await page.click('#clientRail [data-client-tab="recruiting"]');
      await page.waitForFunction(()=>document.querySelector('#recruiting')?.classList.contains('active'));
      check('[desktop] rail routes to Recruiting',await page.locator('#recruiting.active').count()===1);
      check('[desktop] rail active state follows route',await page.locator('#clientRail [data-client-tab="recruiting"].active').count()===1);
      await page.click('#clientRail [data-client-tab="development"]');
      await page.waitForFunction(()=>document.querySelector('#development')?.classList.contains('active'));
      check('[desktop] cross-group route reaches Development',await page.locator('#development.active').count()===1);
      check('[desktop] rail is persistent',await page.$eval('#clientRail',el=>getComputedStyle(el).position)==='fixed');
      check('[desktop] mobile quick nav is hidden',await page.$eval('.client-mobile-nav',el=>getComputedStyle(el).display)==='none');
    }else{
      check('[mobile] quick nav is visible',await page.$eval('.client-mobile-nav',el=>getComputedStyle(el).display)!=='none');
      await page.click('.client-mobile-nav [data-client-tab="recruiting"]');
      await page.waitForFunction(()=>document.querySelector('#recruiting')?.classList.contains('active'));
      check('[mobile] quick nav routes to Recruiting',await page.locator('#recruiting.active').count()===1);
      check('[mobile] active state follows quick route',await page.locator('.client-mobile-nav [data-client-tab="recruiting"].active').count()===1);
      await page.click('[data-client-more]');
      check('[mobile] More opens navigation drawer',await page.$eval('#app',el=>el.classList.contains('client-rail-open')));
      await page.click('#clientRail [data-client-tab="development"]');
      await page.waitForFunction(()=>document.querySelector('#development')?.classList.contains('active'));
      check('[mobile] drawer reaches deeper Program route',await page.locator('#development.active').count()===1);
      check('[mobile] drawer closes after route',!(await page.$eval('#app',el=>el.classList.contains('client-rail-open'))));
      await page.click('[data-client-more]');
      await page.click('#clientRail [data-client-tab="dashboard"]');
      await page.waitForFunction(()=>document.querySelector('#dashboard')?.classList.contains('active'));
      check('[mobile] drawer can return to Command Center',await page.locator('#dashboard.active').count()===1);
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    check(`[${label}] shell has no page-level horizontal overflow`,overflow<=1,`${overflow}px`);
    check(`[${label}] shell throws no console errors`,errors.length===0,errors.slice(0,2).join(' | '));
    await page.close();
  }
  await browser.close();console.log(lines.join('\n'));console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
