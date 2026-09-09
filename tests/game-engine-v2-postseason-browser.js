const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const {startNewDynasty:sharedStartNewDynasty}=require('./helpers/start-new-dynasty');
const startNewDynasty=async page=>{await page.goto('file://'+path.join(__dirname,'..','index.html'));return sharedStartNewDynasty(page)};
async function reachPostseason(page){
  await page.click('#simSeason');await page.waitForFunction(()=>window.DynastyGameEngineV2LabBridge.cutoverDebug().phase==='confReady',{timeout:60000});
}
function checkDurable(row,label){
  assert.equal(row.engine,'v2',`${label} should retain v2 identity`);assert.ok(row.drives>0,`${label} should retain drives`);assert.ok(row.playLines>10,`${label} should retain archived play-by-play`);assert.ok(row.playerLines>0,`${label} should retain real-player stat lines`);
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const browserErrors=[];
  try{
    // Conference championship: prove whole-stage rollback, then prove the real UI action records only the user's game with v2.
    const conf=await browser.newPage({viewport:{width:1280,height:900}});conf.on('pageerror',e=>browserErrors.push(String(e)));
    conf.on('console',m=>{if(m.type()==='error'&&!/Injected postseason v2 rollback fault/.test(m.text()))browserErrors.push(m.text())});
    await startNewDynasty(conf);await reachPostseason(conf);await conf.evaluate(()=>window.__DL_TEST__.v2PostseasonPrepare('conference'));
    const beforeDigest=await conf.evaluate(()=>window.__DL_TEST__.v2PostseasonStateDigest());await conf.evaluate(()=>window.__DL_TEST__.v2PostseasonInjectFault('afterArchive'));
    await conf.evaluate(()=>document.querySelector('#simConf').click());const afterDigest=await conf.evaluate(()=>window.__DL_TEST__.v2PostseasonStateDigest());
    assert.equal(afterDigest,beforeDigest,'conference stage rollback must restore the complete dynasty after a post-archive v2 fault');
    let audit=await conf.evaluate(()=>window.__DL_TEST__.v2PostseasonAudit());assert.equal(audit.phase,'confReady');assert.equal(audit.totalPostseason,0,'failed conference stage must leave no partial AI or v2 archives');
    await conf.evaluate(()=>document.querySelector('#simConf').click());audit=await conf.evaluate(()=>window.__DL_TEST__.v2PostseasonAudit());
    assert.equal(audit.phase,'bowlReady');assert.equal(audit.userV2,1,'controlled conference championship should use v2 exactly once');assert.equal(audit.v2Postseason,1,'AI conference championships must remain on the legacy engine');assert.ok(audit.legacyPostseason>0,'other conference championships should still be legacy games');
    assert.match(audit.user[0].label,/Championship$/);checkDurable(audit.user[0],'conference championship');await conf.close();

    // Bowl: force the user outside the playoff field, then use the normal postseason button. Bowls run first and playoffs remain legacy.
    const bowl=await browser.newPage({viewport:{width:1280,height:900}});bowl.on('pageerror',e=>browserErrors.push(String(e)));bowl.on('console',m=>{if(m.type()==='error')browserErrors.push(m.text())});
    await startNewDynasty(bowl);await reachPostseason(bowl);const bowlPrep=await bowl.evaluate(()=>window.__DL_TEST__.v2PostseasonPrepare('bowl'));assert.ok(bowlPrep.field.includes(bowlPrep.userId));
    await bowl.evaluate(()=>document.querySelector('#simBowls').click());
    await bowl.evaluate(()=>document.querySelector('#simPlayoff').click());audit=await bowl.evaluate(()=>window.__DL_TEST__.v2PostseasonAudit());
    assert.equal(audit.phase,'complete',`bowl path should complete; captured errors: ${browserErrors.join(' | ')}`);assert.equal(audit.userV2,1,'bowl-only controlled program should record exactly one postseason v2 game');assert.equal(audit.v2Postseason,1,'AI bowls and AI playoff games must remain legacy');assert.ok(audit.legacyPostseason>10,'bowl/playoff stage should still contain many legacy AI games');assert.match(audit.user[0].label,/ Bowl$/);checkDurable(audit.user[0],'bowl');await bowl.close();

    // Playoff: guarantee a user berth. Every round the user survives should use v2; all other bracket games stay legacy.
    const playoff=await browser.newPage({viewport:{width:1280,height:900}});playoff.on('pageerror',e=>browserErrors.push(String(e)));playoff.on('console',m=>{if(m.type()==='error')browserErrors.push(m.text())});
    await startNewDynasty(playoff);await reachPostseason(playoff);const playoffPrep=await playoff.evaluate(()=>window.__DL_TEST__.v2PostseasonPrepare('playoff'));assert.ok(playoffPrep.field.includes(playoffPrep.userId));
    await playoff.evaluate(()=>document.querySelector('#simPlayoff').click());audit=await playoff.evaluate(()=>window.__DL_TEST__.v2PostseasonAudit());
    assert.equal(audit.phase,'complete',`playoff path should complete; captured errors: ${browserErrors.join(' | ')}`);assert.ok(audit.userV2>=1&&audit.userV2<=4,'controlled playoff run should produce one to four v2 games depending on advancement');assert.equal(audit.v2Postseason,audit.userV2,'only controlled-program playoff games should use v2');assert.ok(audit.legacyPostseason>=11,'the rest of the playoff bracket must remain legacy');
    for(const row of audit.user){assert.ok(['Round of 16','Quarterfinal','Semifinal','National Championship'].includes(row.label),`unexpected playoff label ${row.label}`);checkDurable(row,row.label)}
    await playoff.close();
    assert.deepEqual(browserErrors,[],`postseason browser regression emitted errors: ${browserErrors.join('\n')}`);
    console.log('PASS v0.10.2 transactional Game Engine 2 conference championship, bowl and playoff routing');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
