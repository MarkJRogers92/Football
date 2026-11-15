// v0.34 — pro alumni come home to coach. When the coach's program opens a coordinator, strength or recruiting job,
// a former player of the program who has finished a pro career of three seasons or more may apply. He is listed as a
// former player with his draft and pro career on his card, he knows the program (higher loyalty, a small discount on
// his asking salary and a homecoming bump to fit), and his name helps on the recruiting trail in proportion to what he
// did as a pro. An offensive player applies for offensive jobs, a defensive player for defensive ones; anyone can run
// strength or recruiting.
//
// Only the coach's program gets these candidates, so AI hiring is unchanged. His ratings come from a hash of his id,
// never the gameplay random stream, so opening a job draws nothing new. A hired alum keeps formerPlayer on his coach
// record; the candidate entry carries the same few fields.
function makeProAlumniCoaches(env){
 'use strict';
 const universe=()=>env.getUniverse(),clamp=env.clamp,nfl=()=>env.nfl();
 const MIN_SEASONS=3,MIN_WAIT=1,MAX_AGE=62,DRAFT_AGE=22,OFF=new Set(['QB','RB','WR','TE','OT','OG','C']),DEF=new Set(['EDGE','DT','LB','CB','S']);
 const SLOT_FITS={OC:p=>OFF.has(p),DC:p=>DEF.has(p),RC:()=>true,SC:p=>!['K','P'].includes(p)};
 function hired(){const ids=new Set();const add=c=>{if(c?.formerPlayer?.id!=null)ids.add(String(c.formerPlayer.id))};for(const t of universe().teams||[])for(const c of Object.values(t.staff||{}))add(c);for(const c of universe().coachArchive||[])add(c);return ids}
 // Former players of this program who could apply for this job now.
 function eligible(t,slot){
  const fits=SLOT_FITS[slot];if(!t||!fits)return[];
  const u=universe(),N=nfl(),taken=hired(),out=[];
  for(const list of Object.values(u.draftHistory||{}))for(const r of list||[]){
   if(!(r.round||r.status==='UDFA')||!fits(r.pos)||taken.has(String(r.playerId)))continue;
   if(String(N.schoolIdentity(r).id)!==String(t.id))continue;
   const c=N.careerAt(r,u.year,true);if(!c?.retired||c.length<MIN_SEASONS||u.year-c.retiredYear<MIN_WAIT)continue;
   const age=DRAFT_AGE+(u.year-r.year);if(age>MAX_AGE)continue;
   out.push({r,c,age});
  }
  return out.sort((a,b)=>b.c.legacy-a.c.legacy||a.age-b.age||String(a.r.playerId).localeCompare(String(b.r.playerId)));
 }
 // A candidate entry in the hiring market's own shape.
 function candidate(t,slot,pick){
  const N=nfl(),{r,c,age}=pick,id=r.playerId,u=(...k)=>N.unit(id,'coach',...k);
  const base=56+num(t.prestige,60)*.16+num(t.resources,60)*.08,rate=(k,bonus=0)=>clamp(Math.round(base+(u(k)-.5)*22+bonus),35,95);
  const fame=Math.min(8,c.proBowls*1.5+c.allPros+(c.hof?3:0)+c.starts*.3);
  const side=slot==='OC'||slot==='DC';
  const out={recruiting:rate('recruiting',3+fame),development:rate('development',side?3:0),evaluation:rate('evaluation',side?2:0),playCall:rate('playCall',side?2:-4),adaptability:rate('adaptability'),
   loyalty:clamp(Math.round(84+u('loyalty')*12),60,99),ambition:clamp(Math.round(52+u('ambition')*30),25,95)};
  const salaryBase=.35+num(t.resources,60)/35+num(t.prestige,60)/45+(slot==='OC'||slot==='DC'?.9:0);
  const formerPlayer={id,name:r.playerName,pos:r.pos,school:r.school,draftYear:r.year,round:r.round||null,pick:r.pick||null,proSeasons:c.length,proBowls:c.proBowls,allPros:c.allPros,rings:c.rings,hof:!!c.hof,retiredYear:c.retiredYear};
  return{candidateId:`CAND_ALUM_${id}_${universe().year}`,source:'alumni',coachId:null,name:r.playerName,age,...out,
   specialties:env.specialties({...out}),askSalary:Math.round(env.askSalary(salaryBase,out.ambition)*.9*10)/10,askYears:3,wantsAuthority:out.ambition>=70?'full':'shared',
   fitScore:env.fitScore(t,slot,out)+3,formerPlayer};
 }
 const num=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
 // The best eligible alum for this job, if any.
 function forOpening(t,slot){const list=eligible(t,slot);return list.length?candidate(t,slot,list[0]):null}
 function careerText(fp){
  const draft=fp.round?`${fp.draftYear} draft, round ${fp.round}${fp.pick?`, pick ${fp.pick}`:''}`:`undrafted in ${fp.draftYear}`;
  const honours=[fp.proBowls?`${fp.proBowls} Pro Bowl${fp.proBowls===1?'':'s'}`:'',fp.allPros?`${fp.allPros}× All-Pro`:'',fp.rings?`${fp.rings} ring${fp.rings===1?'':'s'}`:'',fp.hof?'Pro Hall of Fame':''].filter(Boolean).join(', ');
  return`${fp.pos} at ${fp.school} · ${draft} · ${fp.proSeasons} pro seasons${honours?` · ${honours}`:''}`;
 }
 return{MIN_SEASONS,SLOT_FITS,eligible,candidate,forOpening,careerText};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeProAlumniCoaches};
}else{
 const alumniCoaches=makeProAlumniCoaches({getUniverse:()=>universe,clamp,nfl:()=>globalThis.DynastyNfl,specialties:c=>coachSpecialties(c),askSalary:(b,a)=>candidateAskSalary(b,a),fitScore:(t,slot,c)=>candidateFitScore(t,slot,c)});
 globalThis.DynastyProAlumniCoaches=alumniCoaches;
 const paEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // The coach's own openings may draw one former player.
 const poolBeforeAlumni=generateCandidatePool;
 generateCandidatePool=function generateCandidatePoolWithAlumni(t,slot){
  const out=poolBeforeAlumni.apply(this,arguments);
  try{if(t&&t===selected()&&globalThis.DynastyNfl){const c=alumniCoaches.forOpening(t,slot);if(c)out.push({...c,interviewed:false,status:'AVAILABLE'})}}catch(err){console.error(err)}
  return out;
 };
 // A hired alum keeps who he was.
 const materializeBeforeAlumni=materializeCandidateCoach;
 materializeCandidateCoach=function materializeCandidateCoachWithAlumni(t,slot,cand){
  const c=materializeBeforeAlumni.apply(this,arguments);
  if(cand?.formerPlayer)c.formerPlayer={...cand.formerPlayer};
  return c;
 };
 const sourceBeforeAlumni=candidateSourceLabel;
 candidateSourceLabel=function candidateSourceLabelWithAlumni(c){return c?.formerPlayer?'Former player':sourceBeforeAlumni.apply(this,arguments)};
 const cardBeforeAlumni=candidateCardHTML;
 candidateCardHTML=function candidateCardHTMLWithAlumni(o,c){
  const html=cardBeforeAlumni.apply(this,arguments);if(!c?.formerPlayer)return html;
  const at=html.indexOf('</div>');if(at<0)return html;
  return html.slice(0,at+6)+`<div class="compact alumni-coach" data-alumni-coach>${paEsc(alumniCoaches.careerText(c.formerPlayer))}. He knows the program: loyal, a small salary discount, and his name helps on the recruiting trail.</div>`+html.slice(at+6);
 };
 // Test pages only: a retired pro from this program and an open coordinator job.
 if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.alumniCoachFixture=()=>{
  const t=selected(),N=globalThis.DynastyNfl,year=universe.year-14;
  for(let i=0;i<2000;i++){const r={year,school:t.name,schoolId:t.id,playerId:`ALUMFIX${i}`,playerName:`Alum Fixture ${i}`,pos:'QB',round:1,pick:5,pg:95,pc:101};const c=N.careerAt(r,universe.year,true);
   if(c?.retired&&c.length>=3&&universe.year-c.retiredYear>=1){universe.draftHistory[year]=[...(universe.draftHistory[year]||[]),r];N.clearCache();break}}
  const o=createOpening(t,'OC','Test vacancy');return(universe.candidateMarket[o.id]||[]).find(c=>c.source==='alumni')?.name||null;
 };
}
