const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeNflPipeline}=require('../nfl-pipeline.js');
const {makeProAlumniCoaches}=require('../pro-alumni-coaches.js');
const {loadEngine}=require('../tools/harness.js');

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// A drafted player whose derived career is a finished pro career of `min` seasons or more by `year`.
function retiredPro(N,{pos='QB',school='Home',schoolId=1,year=2027,by=2045,min=5,prefix='alum'}={}){
 for(let i=0;i<2000;i++){const r={year,school,schoolId,playerId:`${prefix}${i}`,playerName:`Alum ${i}`,pos,round:1,pick:5,pg:95,pc:101};const c=N.careerAt(r,by,true);if(c?.retired&&c.length>=min&&by-c.retiredYear>=1)return r}
 throw new Error('no retired pro found');
}
function world(year=2045){
 const t={id:1,name:'Home',prestige:70,resources:70},o={id:2,name:'Other',prestige:70,resources:70};
 const u={year,phase:'complete',teams:[t,o],draftHistory:{},coachArchive:[],history:[]};
 const N=makeNflPipeline({getUniverse:()=>u,clamp,production:()=>60});
 const A=makeProAlumniCoaches({getUniverse:()=>u,clamp,nfl:()=>N,specialties:()=>['Recruiting specialist'],askSalary:(b,a)=>Math.round(b*(0.85+a/500)*10)/10,fitScore:(t,s,c)=>Math.round(c.recruiting*.22+c.development*.22+c.evaluation*.18+c.playCall*.2+c.adaptability*.18)});
 return{t,o,u,N,A};
}

test('a retired pro from the program applies for the side of the ball he played, never for head coach',()=>{
 const {t,u,N,A}=world(),qb=retiredPro(N),lb=retiredPro(N,{pos:'LB',prefix:'lb'});
 u.draftHistory={2027:[qb,lb]};
 assert.equal(A.forOpening(t,'OC').formerPlayer.id,qb.playerId);
 assert.equal(A.forOpening(t,'DC').formerPlayer.id,lb.playerId);
 assert.ok(['RC','SC'].every(s=>A.forOpening(t,s)),'anyone can run strength or recruiting');
 assert.equal(A.forOpening(t,'HC'),null);
 const c=A.forOpening(t,'OC');
 assert.equal(c.source,'alumni');assert.equal(c.name,qb.playerName);assert.equal(c.age,22+(u.year-2027));
 assert.ok(c.loyalty>=84);assert.ok(c.formerPlayer.proSeasons>=3);
 assert.match(A.careerText(c.formerPlayer),/QB at Home · 2027 draft, round 1, pick 5 · \d+ pro seasons/);
 assert.deepEqual(A.forOpening(t,'OC'),c,'the same alum, the same ratings: nothing random');
});

test('only finished careers of three seasons, from this program, not already on a staff',()=>{
 const {t,u,N,A}=world(),qb=retiredPro(N);
 u.draftHistory={2027:[{...qb,schoolId:2,school:'Other'}]};
 assert.equal(A.forOpening(t,'OC'),null,'another program\'s alum');
 u.draftHistory={2027:[qb]};
 const c=N.careerAt(qb,u.year,true);
 u.year=c.retiredYear;N.clearCache();assert.equal(A.forOpening(t,'OC'),null,'not in the year he retires');
 u.year=2045;N.clearCache();
 u.coachArchive=[{id:'C9',formerPlayer:{id:qb.playerId}}];
 assert.equal(A.forOpening(t,'OC'),null,'an alum already coaching is not offered twice');
});

test('in the game, the coach\'s opening lists the alum, hiring him keeps his playing record, and AI openings are unchanged',async()=>{
 const e=loadEngine({seed:6262,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan'),other=u.teams.find(x=>x!==t);
 const N=globalThis.DynastyNfl||e.DynastyNfl;
 const qb=retiredPro(N,{school:t.name,schoolId:t.id,year:u.year-14,by:u.year});
 u.draftHistory[qb.year]=[qb];N.clearCache();
 const rng=JSON.stringify(u.rng||null);
 const o=e.createOpening(t,'OC','Test vacancy');
 const pool=u.candidateMarket[o.id],alum=pool.find(c=>c.source==='alumni');
 assert.ok(alum,'the alum is in the pool');assert.equal(alum.formerPlayer.id,qb.playerId);
 const html=e.candidateCardHTML(o,alum);
 assert.match(html,/Former player/);assert.match(html,/data-alumni-coach/);
 const coach=e.hireCandidate(o,alum,{salary:alum.askSalary,years:3,authority:'shared'});
 assert.equal(coach.formerPlayer.id,qb.playerId);assert.equal(t.staff.OC,coach);
 const o2=e.createOpening(other,'OC','Test vacancy');
 assert.ok(u.candidateMarket[o2.id].every(c=>c.source!=='alumni'),'AI programs get no alumni candidates');
 assert.ok(rng,'gameplay stream exists');
});
