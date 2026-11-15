const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeNflPipeline}=require('../nfl-pipeline.js');
const {loadEngine}=require('../tools/harness.js');

function pipeline(u={year:2027,phase:'regular',draftHistory:{},teams:[]}){
 return{u,N:makeNflPipeline({getUniverse:()=>u,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),production:p=>p.prod??55})};
}
const player=(o={})=>({id:'p1',pos:'QB',style:'Field Architect',trueNow:85,upside:92,speed:75,power:72,technique:86,iq:88,composure:84,durability:80,versatility:70,injuryHistory:[],prod:70,...o});

test('a rookie view cannot reveal his eventual failure, career length or future honors',()=>{
 const {N}=pipeline();
 const r={year:2027,playerId:'camp-cut',playerName:'Rookie',pos:'LB',school:'Test U',status:'UDFA',pg:50,pc:55};
 const rookie=N.careerAt(r,2028,false);
 assert.equal(rookie.label,'Awaiting pro debut');
 assert.equal(rookie.length,null);
 assert.deepEqual(rookie.seasons,[]);
 assert.equal(rookie.peak,undefined);
 assert.equal(rookie.bust,undefined);
 assert.equal(rookie.hof,false);
 assert.equal(N.careerAt(r,2028,true).label,'Never made a roster');
 const pick=draftClass()[0],view=N.careerAt(pick,2029,true);
 assert.ok(view.seasons.every(s=>s.year<=2029));
 assert.equal(view.length,null,'an active player has no announced final career length');
});

test('a rename preserves legacy and new alumni, gifts and recruiting under the stable school ID',()=>{
 const team={id:7,name:'Test U'},cls=draftClass(2027);
 const u={year:2033,phase:'complete',teams:[team,{id:8,name:'Other U'}],draftHistory:{2027:cls}};
 const {N}=pipeline(u),before=N.school(team.name),gift=N.alumniGift(team);
 N.rememberSchool(team,team.name);
 team.name='Renamed U';
 const after=N.school(team.name);
 assert.equal(after.pros,before.pros);assert.equal(after.proBowls,before.proBowls);
 assert.equal(after.pitch,before.pitch);assert.equal(N.alumniGift(team),gift);
 assert.ok(cls.filter(r=>r.school==='Test U').every(r=>r.schoolId===7));
 assert.equal(cls[0].school,'Test U','the historical name stays recorded');
 assert.equal(N.school('Test U').pros,0,'old names do not create a second pipeline');
 assert.ok(N.milestones(['Renamed U'],2030).every(m=>m.c.schoolId===7));
});

test('old records can resolve a renamed program through archived season IDs without changing saves',()=>{
 const u={year:2033,phase:'complete',teams:[{id:7,name:'New U'}],draftHistory:{2027:draftClass(2027)},history:[{type:'season',year:2027,records:[{schoolId:7,name:'Test U'}]}]};
 const {N}=pipeline(u),before=JSON.stringify(u);
 assert.ok(N.school('New U').pros>0);
 assert.equal(JSON.stringify(u),before);
});
test('the actual program editor pins legacy alumni before changing the name',async()=>{
 const e=loadEngine({seed:9331,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan'),nfl=globalThis.DynastyNfl;
 u.year=2033;u.phase='complete';u.draftHistory={2027:draftClass(2027,t.name)};
 const before=nfl.school(t.name);assert.ok(before.pros>0);
 document.querySelector('#editName').value='Chicago Renamed';e.applyProgramEdit();
 assert.equal(nfl.school('Chicago Renamed').pros,before.pros);
 assert.ok(u.draftHistory[2027].filter(r=>r.school==='Chicago Metropolitan').every(r=>r.schoolId===t.id));
});

// A synthetic draft class: 224 picks graded from 95 down, plus undrafted players.
function draftClass(year=2027,school='Test U'){
 const out=[];for(let i=0;i<224;i++){const pg=Math.round(90-i*.05);out.push({year,playerId:`d${year}_${i}`,playerName:`Pick ${i}`,pos:['QB','EDGE','OT','CB','WR','DT','S','LB','TE','OG','C','RB'][i%12],school:i%10===0?school:'Other U',round:Math.floor(i/32)+1,pick:i%32+1,status:'Drafted',label:'x',score:pg,pg,pc:pg+5})}
 for(let i=0;i<400;i++)out.push({year,playerId:`u${year}_${i}`,playerName:`UDFA ${i}`,pos:'LB',school:'Other U',round:null,pick:null,status:'UDFA',label:'Undrafted Free Agent',score:70,pg:72,pc:78});
 return out;
}

test('the draft grade rewards ability, the traits the position needs, production and room to grow',()=>{
 const {N}=pipeline(),t={prestige:70};
 const base=N.grade(player(),t).grade;
 assert.ok(N.grade(player({trueNow:90}),t).grade>base,'ability');
 assert.ok(N.grade(player({iq:98,technique:96}),t).grade>base,'a quarterback\'s processing and accuracy');
 assert.ok(N.grade(player({speed:99}),t).grade-base<1,'speed barely moves a pocket quarterback');
 assert.ok(N.grade(player({prod:90}),t).grade>base,'production');
 assert.ok(N.grade(player({upside:99}),t).ceiling>N.grade(player(),t).ceiling,'upside raises the ceiling');
 assert.ok(N.grade(player({injuryHistory:[{},{},{},{}]}),t).grade<base,'injuries count against him');
 assert.equal(N.grade(player(),t).grade,N.grade(player(),t).grade,'the scouts\' read is fixed per player');
});

test('style translates: a traits project grades lower now with a higher ceiling',()=>{
 const {N}=pipeline(),t={prestige:70};
 const pro=N.grade(player({pos:'OT',style:'Island Protector'}),t),project=N.grade(player({pos:'OT',style:'Long-Frame Project'}),t);
 assert.ok(pro.grade>project.grade);
 assert.ok(project.ceiling-project.grade>pro.ceiling-pro.grade);
});

test('the board values positions: a quarterback goes before an equally graded guard, and specialists last',()=>{
 const {N}=pipeline(),t={prestige:70};
 const qb=N.projection(player({pos:'QB'}),t),og=N.projection(player({pos:'OG',id:'p1'}),t),k=N.projection(player({pos:'K',id:'p1'}),t);
 assert.ok(qb.score>og.score);
 assert.ok(og.score>k.score);
 assert.ok(N.POS_VALUE.K<0&&N.POS_VALUE.QB>N.POS_VALUE.RB);
});

test('a career is the same every time it is worked out and never longer than it can be',()=>{
 const {N}=pipeline(),r=draftClass()[3];
 assert.deepEqual(N.career(r),N.career(r));
 const c=N.career(r);
 assert.ok(c.length>=2&&c.length<=18,'a first-rounder gets at least two seasons');
 assert.equal(c.seasons.length,c.length);
 assert.ok(c.seasons.every(s=>!s.allPro||s.proBowl),'All-Pro implies a Pro Bowl');
});

test('careers unfold one season a year: the rookie season counts once the college season is over',()=>{
 const {N}=pipeline(),r=draftClass(2027)[0];
 assert.equal(N.seasonsDone(r,2027,true),0,'drafted this offseason');
 assert.equal(N.seasonsDone(r,2028,false),0,'rookie season in progress');
 assert.equal(N.seasonsDone(r,2028,true),1);
 assert.equal(N.seasonsDone(r,2033,true),6);
 const early=N.careerAt(r,2029,true),late=N.careerAt(r,2045,true);
 assert.ok(early.done<=2&&late.done===late.length);
 assert.ok(late.proBowls>=early.proBowls);
 assert.equal(late.retired,late.length>0);
});

test('the shape of a draft class looks like the real league',()=>{
 const {N}=pipeline(),cls=[...draftClass(2027),...draftClass(2028),...draftClass(2029)];
 const by=k=>cls.filter(r=>(r.round||'U')===k).map(r=>N.careerAt(r,r.year+30,true));
 const share=(list,f)=>list.filter(f).length/list.length;
 const r1=by(1),r7=by(7),u=by('U');
 assert.ok(share(r1,c=>c.proBowls>0)>.15&&share(r1,c=>c.proBowls>0)<.6,`first-round Pro Bowl rate ${share(r1,c=>c.proBowls>0)}`);
 assert.ok(share(r7,c=>c.proBowls>0)<.12,'late picks rarely make one');
 assert.ok(share(r1,c=>c.length)>share(r7,c=>c.length),'early picks last longer');
 assert.ok(r1.reduce((n,c)=>n+c.length,0)/r1.length>r7.reduce((n,c)=>n+c.length,0)/r7.length+2);
 assert.ok(share(u,c=>c.length===0)>.7,'most undrafted players never make a roster');
 const hof=cls.map(r=>N.careerAt(r,r.year+30,true)).filter(c=>c?.hof).length/3;
 assert.ok(hof<=4,`Hall of Famers per class ${hof} (the synthetic class is denser than a real one; real classes measure about two)`);
});

test('programs are ranked by their alumni, which feeds the recruiting pitch and alumni gifts',()=>{
 const u={year:2040,phase:'complete',draftHistory:{2030:draftClass(2030),2032:draftClass(2032),2034:draftClass(2034)},teams:[{name:'Test U'},{name:'Other U'},{name:'Nobody U'}]};
 const {N}=pipeline(u);
 const mine=N.school('Test U'),other=N.school('Other U'),none=N.school('Nobody U');
 assert.ok(mine.pros>0&&other.pros>mine.pros,'more picks, more pros');
 assert.equal(none.pros,0);assert.equal(none.pitch,0);
 assert.ok(other.rank<mine.rank);
 assert.ok(N.pitchFor({name:'Other U'},'QB')>=N.pitchFor({name:'Test U'},'QB'));
 assert.ok(N.pitchFor({name:'Other U'},'LB')<=N.PITCH_MAX+1.5);
 assert.ok(N.alumniGift({name:'Other U'})<=N.GIFT_MAX);
 assert.equal(N.alumniGift({name:'Nobody U'}),0);
 u.draftHistory[2036]=draftClass(2036);N.clearCache();
 assert.ok(N.school('Other U').firstRounders>other.firstRounders,'a new draft is counted once the cache is cleared');
});

test('milestones name the coach\'s alumni once, in the season they happen',()=>{
 const u={year:2027,phase:'complete',draftHistory:{2027:draftClass(2027)},teams:[]};
 const {N}=pipeline(u);
 let seen=0;
 for(let y=2028;y<=2045;y++){const ms=N.milestones(['Test U'],y);for(const m of ms){assert.equal(m.c.school,'Test U');seen++}}
 assert.ok(seen>0,'a pick from the program reaches a milestone over two decades');
 assert.deepEqual(N.milestones(['Nobody U'],2030),[]);
});

test('in the real game the draft records a grade and ceiling, the board drafts by them, and a career shows in the chronology',async()=>{
 const e=loadEngine({seed:9601,fullRuntime:true});
 await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const N=globalThis.DynastyNfl,u=e.universe;
 e.simSeason();e.simConferenceChampionships();e.simBowls();e.simPlayoff();
 let guard=0;while(u.phase==='complete'&&u.offseason?.phase!=='spring'&&guard++<10){if((u.jobOffers||[]).length){e.acceptPost(u.jobOffers[0].schoolId);continue}assert.ok(e.advanceOffseasonPhase())}
 const draft=u.draftHistory[u.year];
 const picks=draft.filter(r=>r.round);
 assert.equal(picks.length,224);
 assert.ok(picks.every(r=>Number.isFinite(r.pg)&&Number.isFinite(r.pc)&&r.pc>=r.pg),'every pick carries a grade and a ceiling');
 const udfa=draft.filter(r=>r.status==='UDFA');
 assert.ok(udfa.some(r=>Number.isFinite(r.pg))&&udfa.some(r=>r.pg===undefined),'only undrafted players with a real chance keep a grade');
 const rest=udfa.filter(r=>r.pg===undefined).map(r=>N.careerAt(r,r.year+20,true));
 assert.ok(rest.every(Boolean),'a career is still worked out from the draft score');
 assert.ok(rest.filter(c=>c.length===0).length/rest.length>.7,'and most of them never make a roster');
 assert.ok(draft.every(r=>r.round||r.status==='UDFA'),'players with no pro deal get no draftHistory row (v0.35)');
 assert.ok(u.playerArchive.some(p=>p.draftResult?.label==='No professional deal'),'they keep their draft result on the player record');
 assert.ok(picks.filter(r=>r.round===1).filter(r=>r.pos==='K'||r.pos==='P').length<=1,'specialists do not fill the first round');
 for(let i=1;i<picks.length;i++)assert.ok(picks[i-1].score>=picks[i].score,'the board is in order');
 const pick=picks[0],p=u.playerArchive.find(x=>x.id===pick.playerId);
 assert.ok(p,'the first pick is archived');
 assert.equal(p.draftResult.pg,pick.pg);
 assert.match(e.careerChronologyHTML(p),/PRO CAREER/);
 const before=JSON.stringify(u.draftHistory).length;
 N.allSchools();
 assert.equal(JSON.stringify(u.draftHistory).length,before,'working out careers writes nothing');
 const r=u.recruits.find(x=>x.pos===pick.pos)||u.recruits[0];
 const row=e.recruitPitchBreakdown(e.T(pick.school),r).find(x=>x[0]==='Pro pipeline');
 assert.ok(!row||row[1]<1,'before any pro has played a season, first-rounders alone are worth less than a point');
});

test('departures consider juniors and redshirt sophomores, never ordinary sophomores',async()=>{
 const e=loadEngine({seed:9332,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,groups={soph:[],junior:[],redshirt:[]};u.phase='complete';
 // Many identical first-round talents make the fixed-seed eligibility check decisive.
 const t=e.T('Chicago Metropolitan');
 for(let i=0;i<60;i++){
  const p=t.roster[i],kind=i<20?'soph':i<40?'junior':'redshirt';groups[kind].push(p.id);
  Object.assign(p,{eligibilityUsed:kind==='junior'?2:1,year:kind==='junior'?'JR':'SO',redshirtUsed:kind==='redshirt',redshirtActive:false,trueNow:99,upside:99,speed:99,power:99,technique:99,iq:99,composure:99,durability:99});
 }
 e.offseasonDepartures();
 const early=new Set(u.offseason.reports.departures.draftPool.filter(r=>r.reason==='Declared early for draft').map(r=>r.p.id));
 assert.equal(groups.soph.filter(id=>early.has(id)).length,0,'two ordinary college seasons cannot qualify');
 assert.ok(groups.junior.some(id=>early.has(id)),'third-season juniors are considered');
 assert.ok(groups.redshirt.some(id=>early.has(id)),'a redshirt year counts toward the three-year clock');
});

test('the NFL outlook reads only the staff\'s scouting ranges, never true ratings or the hidden scouts\' read',()=>{
 const {N}=pipeline(),t={prestige:70},cur=[80,86],up=[86,92];
 const base=player(),view=N.outlook(base,t,cur,up);
 // The same scouted ranges give the same outlook however good he really is: shift his true overall and every
 // trait together, or change his true upside.
 const shift=d=>player({trueNow:base.trueNow+d,upside:base.upside+d,speed:base.speed+d,power:base.power+d,technique:base.technique+d,iq:base.iq+d,composure:base.composure+d});
 assert.deepEqual(N.outlook(shift(-25),t,cur,up),view,'a much worse true player reads the same');
 assert.deepEqual(N.outlook(shift(10),t,cur,up),view,'a much better true player reads the same');
 assert.deepEqual(N.outlook(player({upside:99}),t,cur,up),view,'true upside is not read');
 assert.deepEqual(N.outlook(player({id:'someone-else'}),t,cur,up),view,'the hashed scouts\' read is not part of it');
 assert.deepEqual(view.parts.ability,cur);assert.deepEqual(view.parts.upside,up);
 assert.ok(view.grade[0]<=view.grade[1]&&view.ceiling[0]<=view.ceiling[1]);
 // Better scouting narrows the range; a better estimate raises it.
 const narrow=N.outlook(base,t,[82,84],[88,90]);
 assert.ok(narrow.grade[1]-narrow.grade[0]<view.grade[1]-view.grade[0]);
 assert.ok(N.outlook(base,t,[88,94],[92,97]).grade[0]>view.grade[1]);
 assert.ok(!('traits' in view.parts)&&!('room' in view.parts)&&!('read' in view.parts));
});

test('the outlook in a player\'s chronology does not change with his true rating',async()=>{
 const e=loadEngine({seed:7101,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const t=e.T('Chicago Metropolitan'),p=t.roster.find(x=>e.eligibilityBase(x)>=2&&!x.draftResult);
 assert.ok(p,'an upperclassman is on the roster');
 const html=()=>{const s=e.careerChronologyHTML(p);return s.slice(s.indexOf('data-nfl-outlook'))};
 const before=html();
 assert.match(before,/NFL OUTLOOK/);assert.match(before,/staff's evaluation/);
 const keys=['trueNow','upside','speed','power','technique','iq','composure'],saved=Object.fromEntries(keys.map(k=>[k,p[k]]));
 for(const k of keys)p[k]=saved[k]+9;
 assert.equal(html(),before,'raising every true rating leaves the visible outlook unchanged');
 Object.assign(p,saved);
});

test('the Pro Hall of Fame takes sustained greatness, not a pile of Pro Bowls, and the five-year wait',()=>{
 const {N}=pipeline();
 assert.equal(N.HOF_WAIT,5);
 assert.equal(N.hallWorthy(8,0,0),false,'eight Pro Bowls without All-Pro seasons is not enough');
 assert.equal(N.hallWorthy(6,1,2),false,'rings do not carry a good career');
 assert.equal(N.hallWorthy(4,4,0),false,'four All-Pro seasons alone fall short');
 assert.ok(N.hallWorthy(9,2,0)&&N.hallWorthy(5,5,0)&&N.hallWorthy(7,3,1));
});

test('the draft board says when a class of early entrants is unusually thin or deep',()=>{
 const early=(y,n)=>Array.from({length:n},(_,i)=>({year:y,playerId:`e${y}_${i}`,reason:'Declared early for draft',round:1}));
 const {u,N}=pipeline({year:2035,phase:'complete',teams:[],draftHistory:{2030:early(2030,12),2031:early(2031,10),2032:early(2032,14)}});
 assert.equal(N.classNote(2029),null,'no class, no note');
 assert.deepEqual(N.classNote(2031),{year:2031,count:10,average:null,kind:'normal'},'too little history to compare');
 u.draftHistory[2033]=early(2033,3);assert.equal(N.classNote(2033).kind,'thin');assert.equal(N.classNote(2033).average,12);
 u.draftHistory[2033]=early(2033,20);assert.equal(N.classNote(2033).kind,'deep');
 u.draftHistory[2033]=[...early(2033,11),{year:2033,playerId:'s',reason:'Eligibility exhausted',round:1}];
 assert.equal(N.classNote(2033).kind,'normal');assert.equal(N.classNote(2033).count,11,'seniors are not early entrants');
});

test('loading an older save drops draftHistory rows for players with no pro deal',async()=>{
 const e=loadEngine({seed:1212});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe;u.draftHistory={2027:[{playerId:'a',status:'Drafted',round:1},{playerId:'b',status:'UDFA'},{playerId:'c',status:'College Career Complete'}]};
 e.normalizeUniverse();
 assert.deepEqual(u.draftHistory[2027].map(r=>r.playerId),['a','b']);
});
