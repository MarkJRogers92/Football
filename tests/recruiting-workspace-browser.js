const {chromium}=require('playwright-core');
const path=require('path');
const goRecruiting=page=>page.evaluate(()=>{const g=document.querySelector('.tab-groups button[data-group="recruiting"]');if(g&&!g.classList.contains('active'))g.click();document.querySelector('.tabs button[data-tab="recruiting"]')?.click()});
const startNewDynasty=async page=>{await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 let pass=0,fail=0;const out=[];const check=(name,ok,detail='')=>{ok?pass++:fail++;out.push(`  ${ok?'PASS':'FAIL'}  ${name}${detail?' — '+detail:''}`)};
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);await goRecruiting(page);await page.waitForSelector('#rwSwitch');await page.waitForSelector('#recruitWorkspace');
  check(`[${label}] workspace is the default recruiting surface`,await page.locator('#recruitWorkspace').isVisible()&&await page.locator('#rwSwitch [data-rwm="workspace"]').evaluate(el=>el.classList.contains('active')));
  check(`[${label}] legacy table is hidden in workspace mode`,await page.locator('#recruiting > .table-wrap').evaluate(el=>el.classList.contains('recruit-table-hidden')));
  check(`[${label}] workspace has board, list and dossier panes`,await page.locator('#recruitWorkspace > *').count()===3);
  await page.click('[data-rwf="all"]');await page.waitForSelector('.recruit-workspace-card');
  const first=page.locator('.recruit-workspace-card').first(),name=(await first.locator('.rw-main strong').innerText()).trim();await first.click();await page.waitForFunction(n=>document.querySelector('.recruit-workspace-dossier')?.innerText.includes(n),name);
  const dossier=await page.locator('.recruit-workspace-dossier').innerText();
  check(`[${label}] dossier follows selected prospect`,dossier.includes(name),name);
  check(`[${label}] dossier shows uncertainty-aware staff read`,/staff read/i.test(dossier)&&/confidence/i.test(dossier)&&await page.locator('.rw-confidence').count()===1,dossier.slice(0,220));
  check(`[${label}] dossier shows recruiting battle context`,/recruiting battle/i.test(dossier)&&/your position/i.test(dossier)&&/gap to leader/i.test(dossier)&&/momentum/i.test(dossier),dossier.slice(0,260));
  check(`[${label}] dossier labels evaluation stage`,/evaluation stage/i.test(dossier));
  check(`[${label}] dossier states hidden ratings remain hidden`,/never exposes hidden true ratings/i.test(dossier));
  const target=page.locator('.recruit-workspace-dossier [data-rwa="target"]');if(await target.count()&&!(await target.isDisabled())){const before=Number((await page.locator('[data-rwf="board"] b').innerText()).trim());await target.click();await page.waitForFunction(n=>Number(document.querySelector('[data-rwf="board"] b')?.textContent||0)>n,before);check(`[${label}] dossier target action delegates to canonical board control`,true)}else check(`[${label}] dossier target action delegates to canonical board control`,false,'target action unavailable');
  const quick=page.locator('.recruit-workspace-dossier [data-rwa="quick"]');if(await quick.count()&&!(await quick.isDisabled())){await quick.click();await page.waitForFunction(()=>/Film reviewed/i.test(document.querySelector('.recruit-workspace-dossier')?.innerText||''),{timeout:10000});check(`[${label}] dossier scouting action updates evaluation stage`,true)}else check(`[${label}] dossier scouting action updates evaluation stage`,false,'Quick Film unavailable');
  await page.fill('#rwSearch',name.split(/\s+/)[0]);await page.waitForFunction(()=>document.querySelectorAll('.recruit-workspace-card').length>0);check(`[${label}] workspace search keeps matching prospects visible`,await page.locator('.recruit-workspace-card').count()>0);await page.fill('#rwSearch','');
  await page.click('[data-rwf="board"]');await page.waitForSelector('.recruit-workspace-card');check(`[${label}] targeted prospect appears on My Board`,await page.locator('.recruit-workspace-card').count()>0);
  await page.click('#rwSwitch [data-rwm="table"]');await page.waitForFunction(()=>!document.querySelector('#recruiting > .table-wrap')?.classList.contains('recruit-table-hidden'));check(`[${label}] Table mode restores dense legacy board`,await page.locator('#recruitBody tr').first().isVisible()&&!(await page.locator('#recruitWorkspace').isVisible()));
  await page.click('#rwSwitch [data-rwm="workspace"]');await page.waitForSelector('#recruitWorkspace');
  if(label==='iphone'){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check(`[${label}] workspace has no page-level horizontal overflow`,overflow<=1,`${overflow}px`)}
  check(`[${label}] workspace throws no console errors`,errors.length===0,errors.slice(0,2).join(' | '));await page.close();
 }
 await browser.close();console.log(out.join('\n'));console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});