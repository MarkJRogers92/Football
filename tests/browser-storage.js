// Real IndexedDB and real UI, in a fresh disposable browser context.
const {chromium}=require('playwright-core');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('file://'+path.join(__dirname,'..','index.html'));
  await page.waitForFunction(()=>document.querySelector('#userTeam').options.length===120);
  const tab=id=>page.click(`.tabs button[data-tab="${id}"]`);
  const status=pattern=>page.waitForFunction(source=>new RegExp(source).test(document.querySelector('#saveStatus').textContent),pattern,{timeout:30000});
  await page.click('#simSeason');await tab('season');await page.click('#simConf');await page.click('#simPlayoff');
  await tab('development');await page.click('#runSpringCamp');await page.click('#runFallCamp');
  await tab('offseason');await page.click('#runOffseason');
  await page.waitForFunction(()=>document.querySelector('#weekLine').textContent.includes('2028'));
  await page.click('#saveBrowser');await status('^Saved');
  const record=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const r=indexedDB.open('DynastyLabDB',2);r.onerror=()=>reject(r.error);r.onsuccess=()=>{
    const db=r.result,tx=db.transaction(['saves','archives'],'readonly');let main,first;
    const a=tx.objectStore('saves').get('main');a.onsuccess=()=>{main=a.result};
    const b=tx.objectStore('archives').get(0);b.onsuccess=()=>{first=b.result[0]};
    tx.oncomplete=()=>{db.close();resolve({coreHasArchive:'playerArchive' in main.universe,ref:main.archiveRef,first})};tx.onabort=()=>{db.close();reject(tx.error)};
   };
  }));
  assert.equal(record.coreHasArchive,false);assert.ok(record.ref.count>128);
  console.log('PASS real browser save stores archived careers separately');
  // Loading and saving before any archive access must preserve stored careers.
  await page.click('#loadBrowser');await status('^Loaded');await page.click('#saveBrowser');await status('^Saved');
  await tab('history');await page.fill('#archiveSearch',record.first.name);
  await page.click(`#archiveResults [data-player="${record.first.id}"]`);
  assert.equal(await page.textContent('#playerDialogName'),record.first.name);
  assert.equal(await page.textContent('#playerDialogKicker'),'PLAYER ARCHIVE');
  await page.locator('#playerDialog button').filter({hasText:'Close'}).click();
  console.log('PASS deferred archive search and historical player profile');
  // Force a fresh load before export so export must load the archive itself.
  await tab('dashboard');await page.click('#loadBrowser');await status('^Loaded');
  const downloadEvent=page.waitForEvent('download');await page.click('#exportSave');const download=await downloadEvent;
  await status('^Save exported');
  const exported=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(exported.universe.playerArchive.length,record.ref.count);
  assert.deepEqual(exported.universe.playerArchive[0],record.first);
  assert.equal(exported.universe.year,2028);assert.equal(exported.storageVersion,undefined);
  console.log('PASS complete portable JSON export hydrates deferred history');
  // Import the actual downloaded JSON through the app's file input.
  await page.locator('#importFile').setInputFiles(await download.path());await status('^Imported');
  await page.click('#saveBrowser');await status('^Saved');await page.click('#loadBrowser');await status('^Loaded');
  await tab('history');await page.fill('#archiveSearch',record.first.name);
  await page.click(`#archiveResults [data-player="${record.first.id}"]`);
  assert.equal(await page.textContent('#playerDialogName'),record.first.name);
  assert.deepEqual(errors,[]);
  console.log('PASS exported save imports and re-saves with historical identity intact');
  // Imported historical promises must survive the archive store and render safely.
  const promise={id:'PR_browser',type:'EARLY_ROLE',status:'BROKEN',expectedGames:8,firstSeason:2027,resolvedSeason:2027,result:'0 appearances; 8 required.',coachName:'Coach <Test>'};
  exported.universe.playerArchive[0].promises=[promise];
  exported.universe.playerArchive[0].transferHistory=[{season:2027,fromSchool:'Chicago Metropolitan',toSchool:'Wisconsin Commonwealth',reason:'BROKEN_PROMISE'}];
  await page.locator('#playerDialog button').filter({hasText:'Close'}).click();
  await tab('dashboard');
  await page.locator('#importFile').setInputFiles({name:'promise-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await status('^Imported');
  await page.click('#saveBrowser');await status('^Saved');await page.click('#loadBrowser');await status('^Loaded');
  await tab('history');await page.fill('#archiveSearch',record.first.name);await page.click(`#archiveResults [data-player="${record.first.id}"]`);
  assert.match(await page.textContent('#playerDialogBody'),/Early Role · BROKEN/);
  assert.match(await page.textContent('#playerDialogBody'),/Coach <Test>/);
  assert.match(await page.textContent('#playerDialogBody'),/0 appearances; 8 required/);
  assert.match(await page.textContent('#playerDialogBody'),/Chicago Metropolitan → Wisconsin Commonwealth/);
  assert.match(await page.textContent('#playerDialogBody'),/Broken promise/);
  assert.deepEqual(errors,[]);
  console.log('PASS historical promise and transfer survive browser Save/Load and render in profile');
  console.log('5 browser persistence scenarios passed; no console errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
