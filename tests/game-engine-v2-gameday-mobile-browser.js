const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const TAB_GROUP={dashboard:'program',program:'program',history:'program',roster:'team',depth:'team',development:'team',recruiting:'recruiting',gamelab:'games',season:'games',stats:'games',newsletter:'games',staff:'staff',offseason:'staff',records:'staff'};
const goTab=async(page,id)=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains("active"))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group:TAB_GROUP[id]});
const {startNewDynasty:sharedStartNewDynasty}=require('./helpers/start-new-dynasty');
const startNewDynasty=page=>sharedStartNewDynasty(page);
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);await goTab(page,'gamelab');
    await page.waitForSelector('#v2MatchupIntelligence',{state:'visible',timeout:15000});
    const matchup=await page.evaluate(()=>{const e=document.querySelector('#v2MatchupIntelligence'),r=e.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,scroll:e.scrollWidth,client:e.clientWidth,viewport:innerWidth}});
    assert.ok(matchup.left>=-1&&matchup.right<=matchup.viewport+1,`matchup card must fit phone viewport: ${JSON.stringify(matchup)}`);
    assert.ok(matchup.scroll<=matchup.client+2,`matchup content must not horizontally overflow: ${JSON.stringify(matchup)}`);
    await page.click('[data-v2-gameday-start]');await page.waitForSelector('.v2-gameday-scoreboard',{timeout:10000});
    if(await page.locator('[data-v2-gameday-decision]').count())await page.click('[data-v2-gameday-decision]');
    await page.waitForSelector('.v2-gameday-decision',{timeout:15000});
    const layout=await page.evaluate(()=>{
      const host=document.querySelector('#v2InteractiveGameDay'),score=document.querySelector('.v2-gameday-scoreboard'),decision=document.querySelector('.v2-gameday-decision');
      const hr=host.getBoundingClientRect(),sr=score.getBoundingClientRect(),dr=decision.getBoundingClientRect();
      const buttons=[...decision.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,height:r.height}});
      return{viewport:innerWidth,host:{left:hr.left,right:hr.right,scroll:host.scrollWidth,client:host.clientWidth},score:{left:sr.left,right:sr.right,columns:getComputedStyle(score).gridTemplateColumns},decision:{left:dr.left,right:dr.right,scroll:decision.scrollWidth,client:decision.clientWidth},buttons};
    });
    for(const box of [layout.host,layout.score,layout.decision])assert.ok(box.left>=-1&&box.right<=layout.viewport+1,`Game Day surface must fit phone viewport: ${JSON.stringify(layout)}`);
    assert.ok(layout.host.scroll<=layout.host.client+2,'Game Day host must not horizontally overflow');assert.ok(layout.decision.scroll<=layout.decision.client+2,'decision window must not horizontally overflow');
    assert.ok(!layout.score.columns.includes(' '),`mobile scoreboard should collapse to one column; got ${layout.score.columns}`);
    assert.ok(layout.buttons.length>=3,'mobile decision window should expose coaching choices');for(const b of layout.buttons){assert.ok(b.left>=-1&&b.right<=layout.viewport+1,`decision button outside phone viewport: ${JSON.stringify(b)}`);assert.ok(b.height>=30,'decision buttons must remain tappable')}
    assert.deepEqual(errors,[],`mobile Game Day emitted browser errors: ${errors.join('\n')}`);
    console.log('PASS v0.10.1 mobile Game Day: matchup, scoreboard, decision controls and feed remain usable at 390px');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
