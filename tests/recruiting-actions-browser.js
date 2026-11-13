const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const path=require('path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
const goRecruiting=page=>page.evaluate(()=>{const g=document.querySelector('.tab-groups button[data-group="recruiting"]');if(g&&!g.classList.contains('active'))g.click();document.querySelector('.tabs button[data-tab="recruiting"]')?.click()});
// Workspace mode hides the summary strip and shows the same numbers in the sidebar block.
const hoursLeft=async page=>{await page.waitForFunction(()=>/^\d+\s*\/\s*\d+/.test(window.__hoursText()),null,{timeout:10000});return page.evaluate(()=>{const m=window.__hoursText().match(/^(\d+)\s*\/\s*(\d+)/);return m?{left:+m[1],budget:+m[2]}:null})};
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 let pass=0,fail=0;const out=[];const check=(name,ok,detail='')=>{ok?pass++:fail++;out.push(`  ${ok?'PASS':'FAIL'}  ${name}${detail?' — '+detail:''}`)};
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  page.on('dialog',d=>d.accept());
  // Whichever hours readout is on screen: the sidebar block in Workspace mode, the strip in Table mode.
  await page.addInitScript(()=>{window.__hoursText=()=>[...document.querySelectorAll('.ra-nav strong, .recruiting-hours-strip > span, .recruiting-desk .ra-head strong')].find(e=>e.offsetParent)?.textContent||''});
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);await goRecruiting(page);
  await page.waitForSelector('#recruitWorkspace');await page.click('[data-rwf="all"]');await page.waitForSelector('.recruit-workspace-card');
  const first=page.locator('.recruit-workspace-card').first(),id=await first.getAttribute('data-rwid');await first.click();
  await page.waitForSelector('.recruit-workspace-dossier .recruiting-desk');
  const strip=await hoursLeft(page);
  check(`[${label}] the board shows a weekly recruiting-hours budget`,!!strip&&strip.budget>=30&&strip.budget<=60&&strip.left===strip.budget,JSON.stringify(strip));
  const desk=page.locator('.recruit-workspace-dossier .recruiting-desk');
  const deskText=await desk.innerText();
  check(`[${label}] the dossier has a Recruiting Desk with every action and its cost`,/Call · 2h/.test(deskText)&&/Pitch · 3h/.test(deskText)&&/Offer · 2h/.test(deskText)&&/Visit · 5h/.test(deskText)&&/In-Home · 8h/.test(deskText),deskText.slice(0,200));
  check(`[${label}] in-home is locked until there is an offer`,await desk.locator('[data-ra-action="inhome"]').isDisabled());
  check(`[${label}] the scouting actions still sit beside the desk`,await page.locator('.recruit-workspace-dossier [data-rwa="quick"]').count()===1);

  const motives=()=>page.locator('.recruit-workspace-dossier .ra-motives').innerText();
  const m0=await motives();
  check(`[${label}] the desk shows what he cares about, with the rest still hidden`,/Cares most about/i.test(m0)&&/Second priority\s*not yet — 2 more contacts/i.test(m0)&&/Dealbreaker\s*not yet — 4 more contacts/i.test(m0),m0.replace(/\s+/g,' '));
  await desk.locator('[data-ra-action="call"]').click();
  await page.waitForFunction(b=>{const m=window.__hoursText().match(/^(\d+)/);return m&&+m[1]===b-2},strip.left);
  check(`[${label}] a call spends two hours and keeps the same prospect selected`,(await hoursLeft(page)).left===strip.left-2&&await page.locator('.recruit-workspace-card.active').getAttribute('data-rwid')===id);
  check(`[${label}] the desk now says he was worked this week`,/Worked this week/.test(await page.locator('.recruit-workspace-dossier .recruiting-desk').innerText()));

  // An ordinary phone/desktop quit after one call must preserve both the hours and the contact.
  await page.waitForFunction(()=>window.DynastySessionStatus.read().state==='saved',null,{timeout:60000});
  await page.reload();await page.click('#titleContinue:enabled');
  await page.waitForFunction(()=>!document.querySelector('#app').hidden,null,{timeout:60000});
  await goRecruiting(page);
  const prospect=page.locator('.recruit-workspace-card[data-rwid="'+id+'"]');
  if(await prospect.isVisible())await prospect.click();
  await page.waitForSelector('.recruit-workspace-dossier .recruiting-desk');
  check(`[${label}] a call survives quitting before the next week`,(await hoursLeft(page)).left===strip.left-2&&/Worked this week/.test(await desk.innerText()));

  const select=page.locator('.recruit-workspace-dossier .ra-pitch select');
  const options=await select.locator('option').allInnerTexts();
  check(`[${label}] the pitch menu lists every topic with an honest read`,options.length===10&&options.every(o=>/Strong|Good|Modest|Flat|Risky/.test(o))&&options.some(o=>/his priority/.test(o)),options.slice(0,3).join(' | '));
  // Pitching a topic that is his hidden dealbreaker reveals it at once (the desk's `learn` rule), which would make
  // this step depend on a random recruit. Pitch a topic that cannot reveal it, so exactly two contacts have been made.
  const safeTopic=await page.evaluate(i=>{const r=window.DynastyRecruitingDesk.recruit(i),deal=window.DynastyRecruitingActions.motivesFor(r).dealbreaker;return [...document.querySelectorAll('.recruit-workspace-dossier .ra-pitch select option')].map(o=>o.value).find(v=>v!==deal)},id);
  await select.selectOption(safeTopic);
  await page.locator('.recruit-workspace-dossier [data-ra-action="pitch"]').click();
  await page.waitForFunction(b=>{const m=window.__hoursText().match(/^(\d+)/);return m&&+m[1]===b-5},strip.left);
  check(`[${label}] a pitch spends three more hours`,(await hoursLeft(page)).left===strip.left-5);
  const m2=await motives();
  check(`[${label}] two contacts uncover his second priority and say what is left`,!/Second priority\s*not yet/i.test(m2)&&/Dealbreaker\s*not yet — 2 more contacts/i.test(m2),m2.replace(/\s+/g,' '));
  const fn=await page.locator('.recruit-workspace-dossier .ra-funnel').innerText();
  check(`[${label}] the desk keeps unannounced dates private`,/Recruitment/i.test(fn)&&/No public decision date/i.test(fn)&&!/Next cut|Decides\s*week|weeks? left/i.test(fn),fn.replace(/\s+/g,' '));
  check(`[${label}] the card carries a decision badge and the desk says an offer is needed`,await page.locator('.recruit-workspace-card.active .ra-decision-badge').count()===1&&/cannot choose you without a scholarship offer/.test(await page.locator('.recruit-workspace-dossier').innerText()));
  const status2=await page.evaluate(()=>document.body.innerText);
  check(`[${label}] the status line announces what was learned`,/Learned: His second priority is/.test(status2));

  await page.locator('.recruit-workspace-dossier [data-ra-action="offer"]').click();
  await page.waitForFunction(()=>/Offer out/.test(document.querySelector('.recruit-workspace-dossier')?.innerText||''));
  check(`[${label}] an offer is shown as out and can be withdrawn`,await page.locator('.recruit-workspace-dossier [data-ra-action="withdraw"]').count()===1&&(await hoursLeft(page)).left===strip.left-7);
  check(`[${label}] in-home stays shut before week 5 even with an offer`,await page.locator('.recruit-workspace-dossier [data-ra-action="inhome"]').isDisabled());
  await page.locator('.recruit-workspace-dossier [data-ra-action="withdraw"]').click();
  await page.waitForFunction(()=>!/Offer out/.test(document.querySelector('.recruit-workspace-dossier')?.innerText||''));
  check(`[${label}] withdrawing the offer puts the gate back`,await page.locator('.recruit-workspace-dossier [data-ra-action="offer"]').isEnabled());

  // Rival reactions: a move on this prospect shows up everywhere, and your own offer answers it.
  await page.evaluate(i=>{const D=window.DynastyRecruitingDesk,A=window.DynastyRecruitingActions;A.addRivalEvent(D.recruit(i),D.team(),'Rival Test University','offer')},id);
  await desk.locator('[data-ra-action="call"]').click();// any action repaints the board
  await page.waitForSelector('.recruit-workspace-dossier .ra-rivals');
  const rival=await page.locator('.recruit-workspace-dossier .ra-rivals').innerText();
  check(`[${label}] the desk names the rival move, says it is unanswered and how to answer`,/Rival Test University/.test(rival)&&/offered/.test(rival)&&/Unanswered/.test(rival)&&/Offer \(2h\)/.test(rival),rival.replace(/\s+/g,' '));
  check(`[${label}] the card, the sidebar list and the answering button all flag it`,await page.locator('.recruit-workspace-card.active .ra-rival-badge').count()===1&&await page.locator('.ra-nav .ra-rival-row').count()===1&&await page.locator('.recruit-workspace-dossier [data-ra-action="offer"].ra-answer').count()===1);
  await page.locator('.recruit-workspace-dossier [data-ra-action="offer"]').click();
  await page.waitForFunction(()=>/Answered\./.test(document.querySelector('.recruit-workspace-dossier .ra-rivals')?.innerText||''));
  check(`[${label}] making your own offer answers it and clears every flag`,await page.locator('.recruit-workspace-card.active .ra-rival-badge').count()===0&&await page.locator('.ra-nav .ra-rival-row').count()===0&&await page.locator('.recruit-workspace-dossier [data-ra-action="offer"].ra-answer').count()===0);

  // The staff controls are in the sidebar on desktop and inside the desk on a phone; use whichever is on screen.
  const staffButton=page.locator('[data-ra-staff]:visible').first(),autoSwitch=page.locator('[data-ra-auto]:visible').first();
  // Staff have nothing to add to a board that is already worked, so give it some targets first.
  await page.evaluate(()=>{[...document.querySelectorAll('#recruitBody [data-target]')].filter(b=>b.textContent.trim()==='Target').slice(0,6).forEach(b=>b.click())});
  await page.waitForFunction(()=>/([6-9]|\d{2,}) on the board/.test(document.querySelector('.ra-nav')?.textContent||''));
  const beforeStaff=(await hoursLeft(page)).left;
  await staffButton.click();
  await page.waitForFunction(b=>{const m=window.__hoursText().match(/^(\d+)/);return m&&+m[1]<b},beforeStaff);
  const status=await page.locator('#status, .status, [data-status]').first().innerText().catch(()=>'');
  check(`[${label}] letting the staff work the board spends the remaining hours`,(await hoursLeft(page)).left<beforeStaff,status.slice(0,120));

  // Automation: a standing hand-over that survives re-rendering and can be turned back off.
  check(`[${label}] staff recruiting starts off`,!await autoSwitch.isChecked());
  await autoSwitch.check();
  await page.waitForFunction(()=>/staff cover the rest/.test(document.querySelector('.ra-nav')?.textContent||'')&&[...document.querySelectorAll('[data-ra-auto]')].every(b=>b.checked));
  check(`[${label}] switching on staff recruiting is saved and explained`,/never book visits/.test(await page.evaluate(()=>document.querySelector('.ra-nav')?.textContent||''))&&await page.evaluate(()=>!!document.querySelector('#raStrip')));
  await page.locator('[data-ra-auto]:visible').first().uncheck();
  await page.waitForFunction(()=>!/staff cover the rest/.test(document.querySelector('.ra-nav')?.textContent||''));
  check(`[${label}] and it can be taken back`,!await page.locator('[data-ra-auto]:visible').first().isChecked());

  await page.locator('.recruit-workspace-dossier [data-rwa="open"]').click();
  await page.waitForSelector('#recruitDialog[open] .recruiting-desk');
  check(`[${label}] the full profile carries the same desk`,await page.locator('#recruitDialog .recruiting-desk [data-ra-action="call"]').count()===1);
  await page.locator('#recruitDialog [data-ra-action="withdraw"], #recruitDialog [data-ra-action="offer"]').first().click().catch(()=>{});
  await page.waitForSelector('#recruitDialog[open] .recruiting-desk');
  check(`[${label}] acting from the profile reopens it with fresh numbers`,await page.locator('#recruitDialog[open]').count()===1);
  await page.evaluate(()=>document.querySelector('#recruitDialog')?.close());

  await page.click('#rwSwitch [data-rwm="table"]');
  await page.waitForFunction(()=>!document.querySelector('#recruiting > .table-wrap')?.classList.contains('recruit-table-hidden'));
  check(`[${label}] table mode shows the hours strip with the staff controls`,await page.locator('#raStrip .recruiting-hours-strip').isVisible()&&await page.locator('#raStrip [data-ra-auto]').isVisible());
  const visitHours=(await hoursLeft(page)).left;
  const visit=page.locator('[data-visit]').first();
  if(await visit.count()){
   await visit.click();await page.waitForFunction(b=>{const m=window.__hoursText().match(/^(\d+)/);return m&&+m[1]===b-5},visitHours);
   check(`[${label}] the table's Visit button now costs five hours`,(await hoursLeft(page)).left===visitHours-5);
  }
  await page.click('#rwSwitch [data-rwm="workspace"]');
  if(label==='iphone'){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check(`[${label}] the desk adds no horizontal overflow`,overflow<=1,`${overflow}px`)}
  // The desk sits in a narrow column; it must wrap instead of widening the page, whatever font the browser
  // falls back to (CI's Chrome has wider text than a dev machine). Stress it with the longest content.
  await page.evaluate(i=>{const D=window.DynastyRecruitingDesk,A=window.DynastyRecruitingActions,r=D.recruit(i),t=D.team();
   for(const [team,kind] of [['Southwestern Metropolitan State Commonwealth','visit'],['Northeastern Metropolitan Technical University','inhome']])A.addRivalEvent(r,t,team,kind)},id);
  await page.addStyleTag({content:'body,button,select,input{letter-spacing:.12em!important}'});
  // Back in Workspace mode the phone shows the list; open the prospect to see his desk again.
  await page.waitForSelector('.recruit-workspace-card.active');
  if(label==='iphone')await page.locator('.recruit-workspace-card.active').click();
  await page.waitForSelector('.recruit-workspace-dossier [data-ra-action="call"]',{state:'visible'});
  await page.locator('.recruit-workspace-dossier [data-ra-action="call"]').click();
  await page.waitForSelector('.recruit-workspace-dossier .ra-rivals');
  const stress=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));
  check(`[${label}] wide text and long rival names do not push the page sideways`,stress.sw<=stress.iw+1,`${stress.sw}px of ${stress.iw}px`);
  // A recruit who has committed to you gets a commitment panel instead of the board actions.
  await page.evaluate(i=>{const D=window.DynastyRecruitingDesk;D.recruit(i).committed=D.team().name},id);
  await page.locator('[data-ra-auto]:visible').first().click();// any repaint will do; the desk is replaced, so do not wait on the box
  await page.waitForSelector('.recruit-workspace-dossier .ra-care');
  const care=await page.locator('.recruit-workspace-dossier .ra-care').innerText();
  check(`[${label}] a commitment to you shows the check-in panel, closed until flip season`,/Committed to you/.test(care)&&/Check in/.test(care)&&await page.locator('.recruit-workspace-dossier .ra-care [data-ra-action="keep"]').isDisabled()&&await page.locator('.recruit-workspace-dossier [data-ra-action="call"]').count()===0,care.replace(/\s+/g,' ').slice(0,200));
  check(`[${label}] no console errors`,errors.length===0,errors.slice(0,2).join(' | '));await page.close();
 }
 await browser.close();console.log(out.join('\n'));console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
