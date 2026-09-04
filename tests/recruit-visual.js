// Focused recruiting presentation checks. Mechanics remain covered by the existing suite.
const { chromium } = require('playwright-core');
const path = require('path');
// Tabs live inside groups since v0.9.26; selecting the group is part of navigating to a tab.
const TAB_GROUP={"dashboard": "program", "program": "program", "history": "program", "roster": "team", "depth": "team", "development": "team", "recruiting": "recruiting", "gamelab": "games", "season": "games", "stats": "games", "newsletter": "games", "staff": "staff", "offseason": "staff", "records": "staff"};
const goTab=async(page,id)=>{await page.click(`.tab-groups button[data-group="${TAB_GROUP[id]}"]`);await page.click(`.tabs button[data-tab="${id}"]`)};


const startNewDynasty=async page=>{await page.waitForSelector('#titleNew',{timeout:30000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 let fail=0,pass=0;const out=[];const check=(name,ok,detail='')=>{ok?pass++:fail++;out.push(`  ${ok?'PASS':'FAIL'}  ${name}${detail?' — '+detail:''}`)};
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
  await goTab(page, 'recruiting');await page.waitForSelector('#recruitBody tr');await page.waitForSelector('#signingClassFeature .signing-class-board');
  check(`[${label}] signing-class board renders`,/SIGNING CLASS/.test(await page.locator('#signingClassFeature').innerText()));
  check(`[${label}] signing-class meter renders`,await page.locator('#signingClassFeature .signing-meter').count()===1);
  check(`[${label}] recruiting list has portrait canvases`,await page.locator('#recruitBody canvas[data-portrait-kind="recruit"]').count()>0);
  const firstPortrait=page.locator('#recruitBody canvas[data-portrait-kind="recruit"]').first();await firstPortrait.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('#recruitBody canvas[data-portrait-kind="recruit"]')?.dataset.portraitPainted==='1',{timeout:10000});
  check(`[${label}] visible recruit portrait paints`,await firstPortrait.getAttribute('data-portrait-painted')==='1');
  // Presentation is DOM-driven. Mark one rendered row committed to verify the card path without altering game state.
  await page.evaluate(()=>{const row=document.querySelector('#recruitBody tr');const interest=row?.querySelector('[data-label="Interest"]');if(interest)interest.textContent='COMMITTED'});
  await page.waitForSelector('#signingClassFeature .signing-card');
  check(`[${label}] committed recruit becomes signing card`,await page.locator('#signingClassFeature .signing-card').count()>=1);
  await page.waitForFunction(()=>document.querySelector('#signingClassFeature .signing-card canvas[data-portrait-kind="recruit"]')?.dataset.portraitPainted==='1',{timeout:10000});
  check(`[${label}] signing card uses painted recruit portrait`,await page.locator('#signingClassFeature .signing-card canvas[data-portrait-kind="recruit"][data-portrait-painted="1"]').count()>=1);
  await page.click('#signingClassFeature .signing-card');await page.waitForSelector('#recruitDialog[open] .recruit-hero-rail');
  check(`[${label}] recruit profile gets hero rail`,await page.locator('#recruitDialog .recruit-hero-rail > *').count()===4);
  check(`[${label}] recruit hero has identity graphic`,await page.locator('#recruitDialog .recruit-hero-avatar').count()===1);
  await page.waitForFunction(()=>document.querySelector('#recruitDialog .recruit-hero-avatar canvas[data-portrait-kind="recruit"]')?.dataset.portraitPainted==='1',{timeout:10000});
  check(`[${label}] recruit profile portrait paints`,await page.locator('#recruitDialog .recruit-hero-avatar canvas[data-portrait-painted="1"]').count()===1);
  if(label==='iphone'){
   const info=await page.evaluate(()=>{const root=document.documentElement,overflow=root.scrollWidth-root.clientWidth,vw=root.clientWidth,dlg=document.querySelector('#recruitDialog'),dr=dlg?.getBoundingClientRect();const offenders=[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect(),p=el.parentElement;return {tag:el.tagName.toLowerCase(),id:el.id||'',cls:String(el.className||'').slice(0,70),text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,45),parent:p?`${p.tagName.toLowerCase()}#${p.id||''}.${String(p.className||'').slice(0,45)}`:'',left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),sw:el.scrollWidth,cw:el.clientWidth}}).filter(x=>x.right>vw+1||x.left<-1||x.sw>x.cw+1).sort((a,b)=>Math.max(b.right-vw,b.sw-b.cw)-Math.max(a.right-vw,a.sw-a.cw)).slice(0,14);return {overflow,dialog:dr&&{left:Math.round(dr.left),right:Math.round(dr.right),width:Math.round(dr.width),sw:dlg.scrollWidth,cw:dlg.clientWidth},offenders}});
   check(`[${label}] recruiting visuals have no horizontal overflow`,info.overflow<=1,`${info.overflow}px ${JSON.stringify(info)}`)
  }
  check(`[${label}] recruiting visuals throw no console errors`,errors.length===0,errors.slice(0,2).join(' | '));await page.close();
 }
 await browser.close();console.log(out.join('\n'));console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
