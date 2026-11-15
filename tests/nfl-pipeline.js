const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeNflPipeline}=require('../nfl-pipeline.js');
const {loadEngine}=require('../tools/harness.js');

function pipeline(u={year:2027,phase:'regular',draftHistory:{},teams:[]}){
 return{u,N:makeNflPipeline({getUniverse:()=>u,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),production:p=>p.prod??55})};
}
const player=(o={})=>({id:'p1',pos:'QB',style:'Field Architect',trueNow:85,upside:92,speed:75,power:72,technique:86,iq:88,composure:84,durability:80,versatility:70,injuryHistory:[],prod:70,...o});
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
 assert.ok(hof<=8,`Hall of Famers per class ${hof}`);
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
 assert.ok(draft.filter(r=>!r.round&&r.status!=='UDFA').every(r=>r.pg===undefined),'nothing is added for players with no pro deal');
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
