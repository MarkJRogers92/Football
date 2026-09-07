const {chromium}=require('playwright-core');
const path=require('path');
const goTab=(page,id,group='team')=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group});
const start=async page=>{await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})};

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});let pass=0,fail=0;
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));const check=(name,ok,detail='')=>{ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'} [${label}] ${name}${detail?` — ${detail}`:''}`)};
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await start(page);
  await goTab(page,'roster');await page.waitForSelector('#rosterPositionBoard');
  check('position-group roster board is visible',await page.locator('#rosterPositionBoard').isVisible());
  check('position groups cover football roster',await page.locator('.rd-position-group').count()>=10);
  check('position groups show staff-visible player hierarchy',await page.locator('.rd-position-group .rd-player').count()>25);
  check('dense canonical roster table remains available',await page.locator('#rosterBody tr').count()>40);
  await goTab(page,'depth');await page.waitForSelector('#depthFormationBoard',{timeout:10000});
  check('football formation view is visible',await page.locator('#depthFormationBoard').isVisible());
  check('offense maps canonical base roles onto field',await page.locator('.rd-offense [data-rd-formation-role]').count()>=10);
  check('defense maps canonical base roles onto field',await page.locator('.rd-defense [data-rd-formation-role]').count()>=9);
  check('dense canonical role cards remain available',await page.locator('#depthGrid select[data-role]').count()>15);
  const assignment=await page.evaluate(()=>{for(const visual of document.querySelectorAll('#depthFormationBoard [data-rd-assign]')){if(visual.options.length<2)continue;const canonical=document.querySelector(`#depthGrid select[data-role="${CSS.escape(visual.dataset.rdAssign)}"]`);if(!canonical)continue;const next=[...visual.options].find(o=>o.value&&o.value!==canonical.value);if(next)return{role:visual.dataset.rdAssign,before:canonical.value,next:next.value}}return null});
  if(assignment){await page.selectOption(`#depthFormationBoard [data-rd-assign="${assignment.role}"]`,assignment.next);await page.waitForFunction(x=>document.querySelector(`#depthGrid select[data-role="${CSS.escape(x.role)}"]`)?.value===x.next,assignment,{timeout:10000});check('formation assignment delegates to canonical role control',true,assignment.role)}else check('formation assignment delegates to canonical role control',false,'no role with alternate candidate');
  const note=(await page.locator('.rd-depth-note').innerText()).toLowerCase();check('presentation states there is no duplicate depth state',note.includes('no separate depth-chart state'));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check('no page-level horizontal overflow',overflow<=1,`${overflow}px`);
  check('no console errors',errors.length===0,errors.slice(0,4).join(' | '));await page.close();
 }
 await browser.close();console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
