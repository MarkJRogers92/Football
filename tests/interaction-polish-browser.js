const {chromium}=require('playwright-core');
const path=require('path');
const goTab=(page,id,group='program')=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group});
const start=async page=>{await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});let pass=0,fail=0;
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport,reducedMotion:'no-preference'}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));const check=(name,ok,detail='')=>{ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'} [${label}] ${name}${detail?` — ${detail}`:''}`)};
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await start(page);
  check('motion system identifies full-motion preference',await page.evaluate(()=>document.documentElement.dataset.dlMotion==='full'));
  const animation=await page.evaluate(()=>{const p=document.createElement('div');p.className='dl-motion-surface';document.body.append(p);const v=getComputedStyle(p).animationName;p.remove();return v});check('surface motion CSS is active when motion is allowed',animation.includes('dl-surface-in'),animation);

  await goTab(page,'recruiting','recruiting');await page.waitForSelector('#recruitWorkspace',{state:'visible',timeout:10000});
  const allButton=page.locator('#recruitWorkspace [data-rwf="all"]');if(await allButton.count())await allButton.click();await page.waitForFunction(()=>document.querySelectorAll('.recruit-workspace-card').length>1,{timeout:10000});
  const cards=page.locator('.recruit-workspace-card');const before=(await page.locator('.recruit-workspace-dossier').innerText()).trim();await cards.nth(1).click();await page.waitForFunction(()=>document.querySelector('.recruit-workspace-dossier')?.classList.contains('dl-motion-detail'),{timeout:3000});const after=(await page.locator('.recruit-workspace-dossier').innerText()).trim();check('recruit dossier change receives restrained detail reveal',before!==after&&await page.locator('.recruit-workspace-dossier').evaluate(el=>el.classList.contains('dl-motion-detail')));

  await goTab(page,'development','team');await page.waitForSelector('#developmentVisualLab',{state:'visible',timeout:10000});
  const devPlayers=page.locator('#developmentVisualLab [data-dev-player]');if(await devPlayers.count()>1){await devPlayers.nth(1).click();await page.waitForFunction(()=>document.querySelector('#developmentVisualLab .dev-player-detail')?.classList.contains('dl-motion-detail'),{timeout:3000});check('development player file receives state-change reveal',await page.locator('#developmentVisualLab .dev-player-detail').evaluate(el=>el.classList.contains('dl-motion-detail')))}else check('development player file remains available with sparse roster data',await page.locator('#developmentVisualLab .dev-player-detail').count()===1);

  await goTab(page,'history','program');await page.waitForSelector('#dynastyMuseum',{state:'visible',timeout:10000});check('history presentation remains reachable after motion layer',await page.locator('#dynastyMuseum').isVisible());

  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.documentElement.dataset.dlMotion==='reduced',{timeout:3000});const reduced=await page.evaluate(()=>{const p=document.createElement('div');p.className='dl-motion-surface';document.body.append(p);const s=getComputedStyle(p),out={name:s.animationName,transform:s.transform};p.remove();return out});check('reduced-motion preference disables animation',reduced.name==='none',JSON.stringify(reduced));
  check('reduced-motion preference avoids transforms',reduced.transform==='none',reduced.transform);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check('no page-level horizontal overflow',overflow<=1,`${overflow}px`);check('no console errors',errors.length===0,errors.slice(0,5).join(' | '));await page.close();
 }
 await browser.close();console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
