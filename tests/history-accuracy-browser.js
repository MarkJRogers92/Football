const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright-core');const {chromiumPath}=require('./helpers/chromium-path');const {loadEngine}=require('../tools/harness');
(async()=>{
 const e=loadEngine({seed:9511});await e.loadSchools();e.initUniverse();const u=e.universe,me=u.teams[0],champ=u.teams[1];e.setUserTeam(me.name);
 const oldName=champ.name,oldConf=champ.conference;champ.name='Renamed Champion';champ.conference='New Conference';
 u.history=[{type:'season',year:2030,top10:[],awards:[],champion:oldName,championId:champ.id,championRecord:'14-2',runnerUp:'Actual Finalist',records:[{name:oldName,schoolId:champ.id,conference:oldConf,w:14,l:2,cw:7,cl:1,pf:400,pa:200,prestige:90}]}];
 const save=JSON.parse(JSON.stringify({userTeam:me.name,universe:e.packUniverse(u)}));
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),at=html.lastIndexOf('loadSchools().then(');
 const patched=html.slice(0,at)+'window.__HISTORY_QA__={installSave};'+html.slice(at);
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{for(const[label,viewport]of [['desktop',{width:1280,height:900}],['mobile',{width:390,height:844}]]){
 const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.route('**/index.html',r=>r.fulfill({contentType:'text/html',body:patched}));await page.goto('file://'+path.join(__dirname,'..','index.html'));
 await page.waitForFunction(()=>window.__HISTORY_QA__&&document.querySelector('#titleTeam')?.options.length>0);
 await page.evaluate(save=>{window.__HISTORY_QA__.installSave(save);document.querySelector('#titleScreen').hidden=true;document.querySelector('#app').hidden=false;document.querySelector('.tabs button[data-tab="history"]').click()},save);
 await page.locator('#championTimeline [data-champ]').waitFor({state:'visible'});
 assert.match(await page.locator('#championTimeline').innerText(),/Actual Finalist/);assert.match(await page.locator('#championTimeline').innerText(),/14-2/);
 await page.locator('#championTimeline [data-champ]').click();await page.locator('#programPeek').waitFor({state:'visible',timeout:3000});assert.match(await page.locator('#programPeek').innerText(),/Renamed Champion/);await page.keyboard.press('Escape');
 assert.equal(await page.locator('#userTeam').inputValue(),me.name);
 await page.selectOption('#conferencePick',oldConf);assert.match(await page.locator('#conferenceTable').innerText(),new RegExp(oldName));
 const legacy=JSON.parse(JSON.stringify(save));legacy.universe.history.push({type:'season',year:2029,top10:[],awards:[],champion:null,records:[{name:me.name,w:8,l:4,cw:5,cl:3}]});
 await page.evaluate(save=>{window.__HISTORY_QA__.installSave(save);document.querySelector('.tabs button[data-tab="history"]').click()},legacy);
 await page.waitForFunction(()=>Array.from(document.querySelector('#conferenceSeason').options).some(x=>x.value==='2029'));
 await page.selectOption('#conferenceSeason','2029');await page.selectOption('#conferencePick',me.conference);
 assert.match(await page.locator('#conferenceTable').innerText(),/current membership|estimated/i);
 // v0.12.19: 30 inductees exceed the first screen; every one must be reachable.
 const hofSave=JSON.parse(JSON.stringify(save));
 hofSave.universe.playerArchive=Array.from({length:30},(_,i)=>({id:'hof-'+i,name:'Hall Inductee '+i,pos:'WR',lastTeam:me.name,retiredYear:2031,perceived:80,
  draftResult:{year:2031,round:1,pick:i+1,label:'Round 1'},
  awards:[{year:2030,name:'Receiver of the Year'},{year:2029,name:'Offensive Player of the Year'}],career:{recYds:4200},seasonHistory:[]}));
 await page.evaluate(s=>{window.__HISTORY_QA__.installSave(s);document.querySelector('.tabs button[data-tab="history"]').click()},hofSave);
 await page.waitForSelector('#hallOfFameList [data-hof]',{timeout:5000});
 assert.equal(await page.locator('#hallOfFameList [data-hof]').count(),24,'the first screen is capped');
 assert.match(await page.locator('#hofCount').innerText(),/Showing 24 of 30/i);
 await page.locator('[data-hof-more]').click();
 assert.equal(await page.locator('#hallOfFameList [data-hof]').count(),30,'show all reveals every inductee');
 assert.match(await page.locator('#hofCount').innerText(),/All 30 inductees/i);
 await page.selectOption('#hofKind','coach');
 assert.equal(await page.locator('#hallOfFameList [data-hof]').count(),0,'the category filter empties a category');
 assert.match(await page.locator('#hallOfFameList').innerText(),/No coaches are inducted yet/);
 assert.deepEqual(errors,[]);await page.close();console.log(label+' history accuracy PASS');
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
