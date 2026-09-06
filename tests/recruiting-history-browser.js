const {chromium}=require('playwright-core');
const path=require('path');

const startNewDynasty=async page=>{
 await page.waitForSelector('#titleNew',{timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
 await page.click('#titleNew');
 await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});
 await page.click('#titleStart');
 await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
};

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('file://'+path.join(__dirname,'..','index.html'));
 await startNewDynasty(page);

 const setup=await page.evaluate(()=>{
  const t=selected();
  const r=universe.recruits.find(x=>!x.committed&&canTakeCommit(t.name));
  if(!r)throw new Error('no signable recruit found');
  r.targeted=true;
  firstRecruitEvaluation(r,t);
  if(!commitRecruit(r,t.name))throw new Error('controlled-team commitment failed');
  const receipt=r.recruitingMemory?.scoutingReceipt;
  if(!receipt)throw new Error('commit did not freeze scouting receipt');

  universe.phase='complete';
  universe.offseason=null;
  universe.developmentState={year:universe.year,springRun:false,fallRun:false,springReport:[],fallReport:[],battles:[]};
  offseasonReview();
  offseasonDepartures();
  offseasonEnrollment();
  offseasonPortal();

  const p=t.roster.find(x=>x.recruitingMemory?.scoutingReceipt?.recruitId===r.id);
  if(!p)throw new Error('signed recruit did not enroll');
  const os=normalizeOffseasonState();
  os.completed.push('spring','fall');
  os.phase='preseason';
  ensureDevelopmentState().springRun=true;
  ensureDevelopmentState().fallRun=true;
  if(!offseasonPreseason())throw new Error('first season rollover failed');

  p.stats.games=13;
  p.stats.starts=9;
  p.scoutConfidence=82;
  p.perceived=Math.max(76,receipt.currentRead+6);
  archivePlayerSeason(p,t,universe.year);

  universe.phase='complete';
  universe.offseason=makeOffseasonState(universe.year,'preseason',['review','departures','signing','portal','spring','fall'],{});
  universe.developmentState={year:universe.year,springRun:true,fallRun:true,springReport:[],fallReport:[],battles:[]};
  if(!offseasonPreseason())throw new Error('second season rollover failed');

  return{recruitId:r.id,name:p.name,season:receipt.season,year:universe.year};
 });

 if(setup.year<setup.season+2)throw new Error(`expected two seasons of receipt age, got ${setup.season} -> ${setup.year}`);
 await page.click('.tab-groups button[data-group="recruiting"]');
 await page.click('.tabs button[data-tab="recruiting"]');
 await page.waitForSelector('.recruiting-history');
 const historyText=await page.locator('.recruiting-history').innerText();
 if(!historyText.includes(`Class of ${setup.season}`))throw new Error(`historical class missing: ${historyText}`);
 if(!historyText.includes(setup.name))throw new Error(`signed player missing from historical class: ${historyText}`);
 if(!/(Diamond|Hit|Bust|Miss|As Scouted)/.test(historyText))throw new Error(`historical result did not mature: ${historyText}`);
 if(errors.length)throw new Error(`console errors: ${errors.slice(0,3).join(' | ')}`);
 console.log('PASS multi-season recruiting history lifecycle');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
