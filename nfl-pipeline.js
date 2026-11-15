// v0.33 — the pro pipeline. A drafted player's story used to stop on draft night. Now every draft prospect has an
// NFL grade built from how his game translates, the draft board orders players by that grade and the value of their
// position, and every pro career is followed season by season after he leaves.
//
//   Pro grade    true ability, the traits the NFL pays for at his position, college production, room still to grow,
//                durability and injuries, how his style translates, exposure from his program, and a scouts' read
//                that is fixed for each player (a hash of his id, never the gameplay random stream).
//   Ceiling      the grade plus his remaining upside and how projectable his style is.
//   Draft board  grade plus positional value: a quarterback, edge rusher or tackle goes before an equally good guard,
//                back or specialist. Two numbers (pg, pc) are added to each drafted or undrafted record.
//   Pro career   never stored. It is worked out from the draft record and a hash of the player's id: how far he
//                develops toward his ceiling, boom or bust, the chances his draft slot buys him, how long he lasts at
//                his position, the seasons he starts, Pro Bowls, All-Pro teams, rings and the Pro Hall of Fame. The
//                same record always gives the same career, so loading a save never changes it. Career timelines add no
//                saved season records; the draft keeps grades and stable school identity.
//   What it feeds  a recruiting pitch for programs that produce pros (more for a recruit's own position), booster
//                gifts from successful alumni, milestones in the news for the coach's alumni, a Pro Pipeline card on
//                the Program page and a pro career section in every player's career chronology.
function makeNflPipeline(env){
 'use strict';
 const universe=()=>env.getUniverse(),clamp=env.clamp;
 const POS_VALUE={QB:4,EDGE:3,OT:2,CB:2,WR:1,DT:1,S:0,LB:-1,TE:-1,OG:-1,C:-2,RB:-2,K:-8,P:-9};
 const NFL_TRAITS={QB:{technique:.35,iq:.35,composure:.3},RB:{speed:.5,power:.3,durability:.2},WR:{speed:.5,technique:.35,composure:.15},TE:{power:.35,technique:.35,speed:.3},
  OT:{power:.4,technique:.4,speed:.2},OG:{power:.55,technique:.45},C:{technique:.45,iq:.3,power:.25},EDGE:{speed:.5,power:.35,technique:.15},DT:{power:.55,technique:.3,speed:.15},
  LB:{speed:.4,iq:.35,power:.25},CB:{speed:.5,technique:.35,composure:.15},S:{speed:.4,iq:.35,versatility:.25},K:{technique:.5,power:.3,composure:.2},P:{power:.5,technique:.5}};
 // How a college style tends to translate: grade now, and how much higher he could go.
 const STYLE_NFL={'Toolsy Project':[-2,6],'Long-Frame Project':[-2,6],'Run-First Weapon':[-3,2],'Backyard Magician':[-2,3],'Off-Script Creator':[0,2],'Field Architect':[2,0],'Rhythm Distributor':[1,0],'Vertical Hunter':[1,2],
  'Island Protector':[2,1],'Movement Tackle':[1,1],'Speed Bender':[2,2],'Pocket Wrecker':[2,1],'Chaos Rusher':[0,2],'Mirror Corner':[2,1],'Press Eraser':[1,1],'Vertical Glider':[1,2],'Route Sculptor':[1,0],
  'Penetrator':[1,1],'Range Hunter':[1,1],'Coverage Eraser':[1,1],'One-Cut Burner':[1,1],'Seam Hunter':[1,1],'Range Kicker':[1,0],
  'Gap Eater':[-1,-1],'Two-Gap Anchor':[-1,0],'Gap Hammer':[-1,-1],'Box Enforcer':[-1,-1],'Box Hammer':[-1,-1],'Inline Mauler':[-1,0],'Phone-Booth Anchor':[-1,0],'Power Pivot':[-1,0]};
 const LENGTH_ADJ={RB:-2,QB:2,K:4,P:4,OT:1,OG:1,C:1,LB:-1};
 const HOF_WAIT=5,PITCH_MAX=4,POS_PITCH=[0,.7,1.5],RECENT_DRAFTS=12,GIFT_MAX=2,MILESTONES_PER_YEAR=6,GRADE_OFFSET=1,FULL_INDEX=8,UDFA_KEEP=74;
 const num=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
 function hash(...parts){let h=2166136261;for(const ch of parts.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>13;h=Math.imul(h,1274126177);return(h^(h>>>16))>>>0}
 const unit=(...parts)=>hash(...parts)/4294967296;
 // A fixed, bell-shaped scouts' read in about -1.5..+1.5.
 const bell=(...parts)=>unit(...parts,'a')+unit(...parts,'b')+unit(...parts,'c')-1.5;

 // ---- The draft grade ----
 function traitScore(p){const w=NFL_TRAITS[p?.pos]||{technique:.5,power:.25,speed:.25};let s=0,n=0;for(const [k,v] of Object.entries(w)){s+=num(p[k],num(p.trueNow,60))*v;n+=v}return n?s/n:num(p?.trueNow,60)}
 // The real grade reads true ratings and two hidden hashes (the pro scouts' read and the ceiling jitter). A scouted
 // view passes `seen`: the coach's staff estimates of current ability and upside, with the hidden parts at their mean.
 function grade(p,t,seen){
  if(!p)return null;
  const ability=seen?seen.ability:num(p.trueNow,60),traits=seen?scoutedTraits(p,seen.ability):traitScore(p),prod=num(env.production(p),50);
  const room=clamp((seen?seen.upside:num(p.upside,ability))-ability,0,20);
  const dur=(num(p.durability,72)-72)*.06-Math.min(3,(p.injuryHistory?.length||0)*.5),exposure=(num(t?.prestige,60)-60)*.04;
  const style=STYLE_NFL[p.style]||[0,0],read=seen?0:bell(p.id,'scouts')*2.5;
  const g=ability*.66+traits*.16+prod*.12+room*.2+dur+exposure+style[0]+read+GRADE_OFFSET;
  const ceiling=g+room*.45+style[1]+(seen?2:unit(p.id,'ceiling')*4);
  return{grade:Math.round(g*10)/10,ceiling:Math.round(Math.max(g,ceiling)*10)/10,positionValue:POS_VALUE[p.pos]??0,
   parts:{ability,traits:Math.round(traits),production:Math.round(prod),room:Math.round(room),durability:Math.round(dur*10)/10,exposure:Math.round(exposure*10)/10,style:style[0],read:Math.round(read*10)/10}};
 }
 // What the staff can see of his traits: the same shrunken offsets from his overall that the scouting domains use
 // (estimate = perceived + (truth - trueNow) * .45), centred on the scouted ability instead of the true one.
 function scoutedTraits(p,ability){return ability+(traitScore(p)-num(p.trueNow,60))*.45}
 // The outlook a coach can see: a grade range from the low and high ends of his staff's ranges for current ability and
 // upside. Nothing in it reads a true rating directly, and the hidden scouts' read is left out.
 function outlook(p,t,current,upside){
  if(!p||!current||!upside)return null;
  const lo=grade(p,t,{ability:current[0],upside:upside[0]}),hi=grade(p,t,{ability:current[1],upside:upside[1]});
  const value=POS_VALUE[p.pos]??0,best=roundFor(boardScore(hi)),worst=roundFor(boardScore(lo));
  return{grade:[Math.round(lo.grade),Math.round(hi.grade)],ceiling:[Math.round(lo.ceiling),Math.round(hi.ceiling)],rounds:[best,worst],positionValue:value,
   parts:{ability:[current[0],current[1]],upside:[upside[0],upside[1]],production:hi.parts.production,style:hi.parts.style,durability:hi.parts.durability,exposure:hi.parts.exposure}};
 }
 // Where the board puts him: his grade and what his position is worth.
 function boardScore(g){return g.grade+g.positionValue*.8}
 function roundFor(score){return score>=92?1:score>=88?2:score>=85?3:score>=82?4:score>=79?5:score>=76?6:score>=72?7:null}
 function projection(p,t){
  const g=grade(p,t),score=boardScore(g),round=roundFor(score);
  return{score:Math.round(score),round,pick:round?1+hash(p.id,'pick')%32:null,label:round?`Projected round ${round}`:'Undrafted Free Agent',grade:g.grade,ceiling:g.ceiling,parts:g.parts,positionValue:g.positionValue};
 }

 // ---- A pro career, worked out from the draft record ----
 const gradeOf=r=>num(r.pg,num(r.score,70)-(POS_VALUE[r.pos]??0)*.8);
 const ceilingOf=r=>num(r.pc,gradeOf(r)+4);
 const pro=r=>r&&(r.round||r.status==='UDFA');
 // Completed pro seasons by a given year: the rookie season is the fall after the draft, and it counts as played once
 // the college season of that year is over.
 function seasonsDone(r,year=universe().year,over=universe().phase==='complete'){return Math.max(0,year-r.year-1+(over?1:0))}
 // Career shape, tuned against the real league: about a third of first-rounders make a Pro Bowl, a seventh-rounder
 // lasts two or three seasons if he sticks, most undrafted players never make a roster, and a small share earn
 // the career honors required for the Hall of Fame. Measured class rates live in docs/DYNASTY_WORLD_MEASUREMENTS.md.
 const CAREER=Object.assign({boom:12,bustRate:.18,bustHit:7,bloomRate:.05,bloomHit:9,chance:.35,camp:80,campSpread:6,lenBase:75,lenDiv:2.3,lenMax:14,starterAt:89,starterEarly:92,pbFloor:96,pbCenter:97,pbScale:1.5,pbMax:.75,apAt:96,apRate:.35,ring:.034},env.career||{});
 function career(r){
  if(!pro(r))return null;
  const K=CAREER,id=r.playerId,pg=gradeOf(r),pc=ceilingOf(r);
  const bust=unit(id,'bust')<K.bustRate?K.bustHit:0,bloom=!bust&&unit(id,'bloom')<K.bloomRate?K.bloomHit:0;
  const peak=pg+(pc-pg)*unit(id,'develop')+(unit(id,'boom')-.5)*K.boom-bust+bloom;
  const chances=r.round?(8-r.round)*K.chance:-1.5,eff=peak+chances;
  const madeIt=eff>=K.camp+unit(id,'camp')*K.campSpread-(r.round?(8-r.round)*1.2:0);
  let length=0;
  if(madeIt){length=Math.round(clamp((eff-K.lenBase)/K.lenDiv,0,K.lenMax)*(.6+.8*unit(id,'length'))+(LENGTH_ADJ[r.pos]||0));length=clamp(length,r.round&&r.round<=2?2:madeIt?1:0,18)}
  const starter=eff>=K.starterAt,startFrom=1+(eff<K.starterEarly?1:0)+(r.round>=4||!r.round?1:0),startTo=Math.max(startFrom,length-1);
  const seasons=[];
  for(let s=1;s<=length;s++){
   const starting=starter&&s>=startFrom&&s<=startTo;
   const pb=starting&&eff>=K.pbFloor&&unit(id,'probowl',s)<K.pbMax/(1+Math.exp(-(eff-K.pbCenter)/K.pbScale));
   const ap=pb&&eff>=K.apAt&&unit(id,'allpro',s)<K.apRate;
   const ring=unit(id,'ring',s)<K.ring;
   seasons.push({season:s,year:r.year+s,starter:starting,proBowl:pb,allPro:ap,ring});
  }
  return{id,name:r.playerName,pos:r.pos,school:r.school,draftYear:r.year,round:r.round||null,pick:r.pick||null,label:r.label,grade:Math.round(pg),ceiling:Math.round(pc),peak:Math.round(eff),length,seasons,bust:!!bust,bloom:!!bloom};
 }
 const hallWorthy=(proBowls,allPros,rings)=>allPros>=5||(proBowls>=9&&allPros>=2)||(proBowls>=7&&allPros>=3&&rings>=1);
 // The career as it stands in a given year.
 function careerAt(r,year,over){
  const c=career(r);if(!c)return null;
  const done=Math.min(c.length,seasonsDone(r,year,over)),played=c.seasons.slice(0,done);
  const proBowls=played.filter(s=>s.proBowl).length,allPros=played.filter(s=>s.allPro).length,rings=played.filter(s=>s.ring).length,starts=played.filter(s=>s.starter).length;
  const retired=done>=c.length&&seasonsDone(r,year,over)>c.length-1,retiredYear=retired?c.draftYear+c.length:null;
  // Canton takes sustained greatness: Pro Bowls alone are not enough without All-Pro seasons, and the real five-year
  // wait applies. Measured at about two inductees per class (0-4) in docs/DYNASTY_WORLD_MEASUREMENTS.md.
  const hof=retired&&c.length>0&&(year-retiredYear)>=HOF_WAIT&&hallWorthy(proBowls,allPros,rings);
  const label=c.length===0?'Never made a roster':proBowls>=5?'Franchise star':proBowls>=1?'Pro Bowler':starts>=5?'Long-time starter':starts>=1?'Starter':(c.round&&c.round<=2&&done>=3)?'Bust':'Reserve';
  const steal=(!c.round||c.round>=4)&&proBowls>=1;
  // A derived lifetime is private simulation data, not something a rookie can know.
  const elapsed=seasonsDone(r,year,over),pending=elapsed===0;
  const {peak,bust,bloom,...known}=c;
  return{...known,length:pending||!retired?null:c.length,seasons:played,done,played,proBowls,allPros,rings,starts,pending,active:!pending&&!retired&&c.length>0&&done<c.length,retired:retired&&c.length>0,retiredYear:pending?null:retiredYear,hof:!pending&&hof,label:pending?'Awaiting pro debut':label,steal,
   legacy:proBowls*4+allPros*4+rings*3+starts+(hof?20:0)};
 }

 // ---- Programs: what their alumni have done ----
 let cache=null;
 // Draft-time names remain historical labels; IDs connect those records to today's program.
 function schoolIdentity(r){
  const u=universe();
  let id=r.schoolId;
  if(id==null){
   id=(u.history||[]).filter(h=>h.type==='season'&&h.year===r.year).flatMap(h=>h.records||[]).find(x=>x.name===r.school)?.schoolId;
   id??=(u.teams||[]).find(t=>t.name===r.school)?.id??env.schoolIdFor?.(r.school);
  }
  const t=id==null?null:(u.teams||[]).find(t=>String(t.id)===String(id));
  return{id:id??null,name:t?.name||r.school};
 }
 function rememberSchool(t,oldName){
  for(const list of Object.values(universe().draftHistory||{}))for(const r of list||[]){
   if(r.schoolId==null&&r.school===oldName)r.schoolId=t.id;
  }
  cache=null;
 }
 // The recruiting pass asks for this tens of thousands of times a week, so the check is constant time: the same
 // season, the same side of the season's end and the same draft history object. A new draft clears it.
 function fresh(){const u=universe();return cache&&cache.dh===u.draftHistory&&cache.year===u.year&&cache.over===(u.phase==='complete')}
 function allSchools(){
  if(fresh())return cache.schools;
  const u=universe(),year=u.year,over=u.phase==='complete',schools=new Map();
  const row=name=>{let s=schools.get(name);if(!s){s={school:name,pros:0,active:0,proBowlers:0,activeProBowlers:0,proBowls:0,allPros:0,rings:0,hof:0,firstRounders:0,activeByPos:{},recentActiveByPos:{},top:[]};schools.set(name,s)}return s};
  for(const [y,list] of Object.entries(u.draftHistory||{}))for(const r of list||[]){
   if(!pro(r)||r.year>year)continue;const c=careerAt(r,year,over);if(!c)continue;const identity=schoolIdentity(r);c.schoolId=identity.id;const s=row(identity.name);
   if(r.round===1)s.firstRounders++;
   if(c.done>0)s.pros++;
   if(c.proBowls)s.proBowlers++;
   s.proBowls+=c.proBowls;s.allPros+=c.allPros;s.rings+=c.rings;if(c.hof)s.hof++;
   if(c.active&&c.done>0){s.active++;s.activeByPos[r.pos]=(s.activeByPos[r.pos]||0)+1;if(year-Number(y)<=RECENT_DRAFTS)s.recentActiveByPos[r.pos]=(s.recentActiveByPos[r.pos]||0)+1;if(c.proBowls)s.activeProBowlers++}
   if(c.legacy>0||c.active||r.round===1){s.top.push({legacy:c.legacy,c});if(s.top.length>24){s.top.sort((a,b)=>b.legacy-a.legacy);s.top.length=16}}
  }
  // A pipeline index ranks programs: active pros and Pro Bowlers count most, then the honour roll.
  const list=[...schools.values()];
  for(const s of list){s.index=s.active*.5+s.activeProBowlers*1.5+s.proBowlers*.3+s.hof+s.firstRounders*.2;s.top.sort((a,b)=>b.legacy-a.legacy)}
  list.sort((a,b)=>b.index-a.index||a.school.localeCompare(b.school));
  const teams=(u.teams||[]).length||list.length;
  // The pitch is the program's national standing, scaled by how much of a pipeline it really is: it takes a few seasons
  // of active pros before anyone can sell the full amount.
  list.forEach((s,i)=>{s.rank=i+1;s.pitch=s.index>0?Math.round(PITCH_MAX*(1-i/Math.max(1,teams))*Math.min(1,s.index/FULL_INDEX)*10)/10:0});
  cache={dh:u.draftHistory,year,over,schools};
  return schools;
 }
 const empty=name=>({school:name,pros:0,active:0,proBowlers:0,activeProBowlers:0,proBowls:0,allPros:0,rings:0,hof:0,firstRounders:0,activeByPos:{},recentActiveByPos:{},top:[],index:0,rank:null,pitch:0});
 function school(name){return allSchools().get(name)||empty(name)}
 // The pitch a program gets with a recruit: its national standing, plus more if it has pros at his position.
 function pitchFor(t,pos){
  const s=allSchools().get(t?.name);if(!s)return 0;
  const n=s.recentActiveByPos[pos]||0;
  return Math.round((s.pitch+POS_PITCH[Math.min(2,n)])*10)/10;
 }
 // Alumni give back: one unit with an active Pro Bowler, two with four or more.
 function alumniGift(t){const s=allSchools().get(t?.name);if(!s)return 0;return Math.min(GIFT_MAX,(s.activeProBowlers>=1?1:0)+(s.activeProBowlers>=4?1:0))}

 // Milestones reached in the pro season that just ended, for the given programs' alumni.
 function milestones(names,year=universe().year){
  const want=new Set(names.filter(Boolean)),out=[];
  for(const list of Object.values(universe().draftHistory||{}))for(const r of list||[]){
   if(!pro(r)||!want.has(schoolIdentity(r).name))continue;
   const now=careerAt(r,year,true),before=careerAt(r,year-1,true);if(!now||!before)continue;
   now.schoolId=schoolIdentity(r).id;
   if(now.done>before.done){
    const s=now.played.at(-1);
    if(s?.proBowl&&before.proBowls===0)out.push({kind:'first-pro-bowl',c:now,importance:60,text:`${now.pos} ${now.name} (${now.school}) made his first Pro Bowl.`});
    else if(s?.allPro)out.push({kind:'all-pro',c:now,importance:62,text:`${now.pos} ${now.name} (${now.school}) was named All-Pro.`});
    if(s?.ring)out.push({kind:'ring',c:now,importance:64,text:`${now.pos} ${now.name} (${now.school}) won a pro championship.`});
   }
   if(now.retired&&!before.retired&&now.length>=4)out.push({kind:'retired',c:now,importance:50,text:`${now.pos} ${now.name} (${now.school}) retired after ${now.length} pro seasons${now.proBowls?`, ${now.proBowls} Pro Bowl${now.proBowls===1?'':'s'}`:''}${now.rings?` and ${now.rings} ring${now.rings===1?'':'s'}`:''}.`});
   if(now.hof&&!before.hof)out.push({kind:'hall-of-fame',c:now,importance:78,text:`${now.pos} ${now.name} (${now.school}) was elected to the Pro Football Hall of Fame.`});
  }
  return out.sort((a,b)=>b.importance-a.importance).slice(0,MILESTONES_PER_YEAR);
 }
 function recordFor(playerId){for(const list of Object.values(universe().draftHistory||{}))for(const r of list||[])if(String(r.playerId)===String(playerId))return r;return null}

 return{POS_VALUE,NFL_TRAITS,STYLE_NFL,CAREER,UDFA_KEEP,HOF_WAIT,PITCH_MAX,GIFT_MAX,hallWorthy,hash,unit,traitScore,scoutedTraits,grade,outlook,boardScore,roundFor,projection,gradeOf,ceilingOf,seasonsDone,career,careerAt,schoolIdentity,rememberSchool,allSchools,school,pitchFor,alumniGift,milestones,recordFor,clearCache:()=>{cache=null}};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeNflPipeline};
}else{
 const nfl=makeNflPipeline({getUniverse:()=>universe,clamp,production:p=>productionRating(p),schoolIdFor:name=>schools.find(t=>t.name===name)?.id});
 globalThis.DynastyNfl=nfl;
 const nfEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 // The draft board: every projection (early declarations included) reads the pro grade. The scouts' read is fixed per
 // player, so a prospect's projection no longer jumps between two looks in the same week.
 draftProjection=function draftProjectionFromProGrade(p,t){return nfl.projection(p,t)};
 // The draft itself: each drafted record keeps its grade and ceiling, the two numbers a career needs. An undrafted
 // player keeps them only if he has a real chance to make a roster; the rest are read from the draft score.
 const runDraftBeforeNfl=runDraft;
 runDraft=function runDraftWithProGrades(pool){
  const grades=new Map();for(const x of pool||[]){const t=x.t||universe.teams.find(y=>y.id===x.teamId);const g=nfl.grade(x.p,t);if(g)grades.set(x.p.id,g)}
  const out=runDraftBeforeNfl.apply(this,arguments);
  const graded=new Map();
  for(const r of out||[]){const g=grades.get(r.playerId);if(g&&(r.round||(r.status==='UDFA'&&g.grade>=nfl.UDFA_KEEP))){r.pg=Math.round(g.grade);r.pc=Math.round(g.ceiling);graded.set(r.playerId,r)}}
  // The archive keeps its own copy of each draft result, written as the player left; those are the newest entries.
  const arch=universe.playerArchive||[];
  for(let i=arch.length-1,seen=0;i>=0&&seen<graded.size&&i>=arch.length-(pool||[]).length-50;i--){const r=graded.get(arch[i]?.id);if(r&&arch[i].draftResult){arch[i].draftResult.pg=r.pg;arch[i].draftResult.pc=r.pc;seen++}}
  nfl.clearCache();
  return out;
 };
 // Programs that produce pros recruit better, and better still at the positions they produce.
 const breakdownBeforeNfl=recruitPitchBreakdown;
 recruitPitchBreakdown=function recruitPitchBreakdownWithPros(t,r){
  const out=breakdownBeforeNfl.apply(this,arguments),v=nfl.pitchFor(t,r?.pos);
  if(v)out.push(['Pro pipeline',v]);
  return out;
 };
 // Alumni gifts arrive with the booster gifts, for every program.
 const resetNilSeasonBeforeNfl=resetNilSeason;
 resetNilSeason=function resetNilSeasonWithAlumni(){
  const out=resetNilSeasonBeforeNfl.apply(this,arguments),F=globalThis.DynastyFacilities;
  if(F)try{for(const t of universe.teams||[]){const n=nfl.alumniGift(t);if(!n)continue;const p=F.state(t);p.fund=Math.min(F.FUND_CAP,p.fund+n);if(t===selected())universe.nflPipeline={...(universe.nflPipeline||{}),lastGift:{year:universe.year,units:n}}}}catch(err){console.error(err)}
  return out;
 };
 // The pro season ends with the college season: the coach's alumni milestones go in the news once a year.
 const offseasonReviewBeforeNfl=offseasonReview;
 offseasonReview=function offseasonReviewWithPros(){
  const ok=offseasonReviewBeforeNfl.apply(this,arguments);
  try{
   const state=universe.nflPipeline??={};
   if(ok&&state.reviewed!==universe.year){
    state.reviewed=universe.year;
    const me=selected(),names=[me?.name,universe.tenure?.school,...(universe.careerHistory||[]).map(x=>x.school)];
    for(const m of nfl.milestones(names)){universe.events??=[];universe.events.push({id:`EVT_PRO_${m.kind}_${universe.year}_${m.c.id}`,type:'PRO_MILESTONE',season:universe.year,week:universe.week,schoolIds:[m.c.schoolId].filter(x=>x!=null),playerIds:[m.c.id],coachIds:[],gameIds:[],importance:m.importance,summary:m.text,metadata:{kind:m.kind}})}
   }
  }catch(err){console.error(err)}
  return ok;
 };

 const tagC=t=>`<span class="lr-tag">${nfEsc(t)}</span>`;
 function seasonsText(c){return c.pending?`Rookie season ${c.draftYear+1}`:c.length===0?'Never made a roster':c.active?`${c.done} completed pro season${c.done===1?'':'s'}`:c.retired?`Retired ${c.retiredYear} after ${c.length} season${c.length===1?'':'s'}`:`Rookie season ${c.draftYear+1}`}
 function honours(c){return[c.proBowls?`${c.proBowls} Pro Bowl${c.proBowls===1?'':'s'}`:'',c.allPros?`${c.allPros}× All-Pro`:'',c.rings?`${c.rings} ring${c.rings===1?'':'s'}`:'',c.starts?`${c.starts} season${c.starts===1?'':'s'} starting`:'',c.hof?'Pro Hall of Fame':''].filter(Boolean).join(' · ')}
 function cardHTML(t){
  const s=nfl.school(t.name),all=nfl.allSchools(),gift=nfl.alumniGift(t);
  const top=s.top.slice(0,8).map(x=>x.c);
  const row=c=>`<li><span class="stop-who">${nfEsc(c.pos)} ${nfEsc(c.name)} ${tagC(c.label)}${c.steal?tagC('Steal'):''}${c.hof?tagC('Hall of Fame'):''}<small>${c.draftYear} · ${nfEsc(c.round?`Round ${c.round}, pick ${c.pick}`:'Undrafted')} · ${nfEsc(seasonsText(c))}${honours(c)?` · ${nfEsc(honours(c))}`:''}</small></span></li>`;
  const pos=Object.entries(s.activeByPos).sort((a,b)=>b[1]-a[1]).map(([p,n])=>`${nfEsc(p)} ${n}`).join(' · ');
  return`<div class="section-head has-art">${globalThis.DynastyArt?.img('helmet-plain','dl-art dl-art-head')||''}<div><div class="eyebrow">PRO PIPELINE</div><h3>${s.pros?`${s.pros} pro${s.pros===1?'':'s'} produced`:'No pros yet'}</h3><div class="muted">Every draft pick's career, followed after he leaves. Producing pros helps recruiting and brings alumni money.</div></div></div>
  <div class="fb-summary"><div><span class="small muted">Active pros</span><strong>${s.active}</strong></div><div><span class="small muted">Pro Bowlers</span><strong>${s.proBowlers}<small> ${s.activeProBowlers} active</small></strong></div><div><span class="small muted">Rings · Hall of Fame</span><strong>${s.rings}<small> · ${s.hof}</small></strong></div><div><span class="small muted">National rank</span><strong>${s.rank?`#${s.rank}`:'—'}<small> of ${Math.max(all.size,universe.teams.length)}</small></strong></div></div>
  <div class="lr-status ${s.pitch>=2?'lr-good':''}"><span>Recruiting pitch: +${s.pitch} with every recruit, up to +${(s.pitch+1.5).toFixed(1)} at positions where your recent alumni are active pros.${gift?` Alumni gifts: ${gift} unit${gift===1?'':'s'} a season to the booster fund.`:''}</span></div>
  ${pos?`<div class="small"><strong>Active pros by position:</strong> ${pos}</div>`:''}
  ${top.length?`<h4>Notable alumni</h4><ul class="stop-rows">${top.map(row).join('')}</ul>`:'<p class="small muted">Your first draft picks appear here after the first draft.</p>'}`;
 }
 function renderProCard(){
  if(!universe?.teams)return;const t=selected();if(!t)return;
  let host=$('#proPipeline');
  if((!host||!host.isConnected)&&typeof document!=='undefined'&&document.getElementById){
   const anchor=document.getElementById('conferenceOutlook')||document.getElementById('facilitiesBoosters');
   if(anchor?.insertAdjacentElement){host=document.createElement('div');host.id='proPipeline';host.className='card pro-pipeline-card';anchor.insertAdjacentElement('afterend',host)}
  }
  if(!host)return;host.innerHTML=cardHTML(t);
 }
 const renderProgramBeforeNfl=TAB_RENDERERS.program;
 TAB_RENDERERS.program=()=>{renderProgramBeforeNfl();renderProCard()};

 // A player's chronology: his pro career once drafted, or his draft outlook while he is still in college.
 const chronologyBeforeNfl=careerChronologyHTML;
 careerChronologyHTML=function careerChronologyWithPros(p){
  const base=chronologyBeforeNfl.apply(this,arguments);
  try{
   const r=p?.draftResult?nfl.recordFor(p.id)||p.draftResult:null;
   if(r&&(r.round||r.status==='UDFA')){
    const c=nfl.careerAt(r,universe.year,universe.phase==='complete');
    const seasons=c.played.map(s=>`<li><span class="muted">${s.year}</span> ${s.starter?'Starter':'Reserve'}${s.proBowl?' · Pro Bowl':''}${s.allPro?' · All-Pro':''}${s.ring?' · Champion':''}</li>`).join('');
    return base+`<div class="pro-career"><div class="eyebrow">PRO CAREER</div><p><strong>${nfEsc(c.label)}</strong> · ${nfEsc(seasonsText(c))}${honours(c)?` · ${nfEsc(honours(c))}`:''}</p><p class="small muted">Draft grade ${c.grade}, ceiling ${c.ceiling}.</p>${seasons?`<ul class="ra-history">${seasons}</ul>`:''}</div>`;
   }
   const team=p&&!p.draftResult?universe.teams.find(t=>t.roster?.includes(p)):null;
   if(team&&eligibilityBase(p)>=2){
    // Built only from the staff's scouting ranges, the same ones the profile shows, never the true ratings.
    const d=nfl.outlook(p,team,scoutRange(p,team,false),scoutRange(p,team,true)),pr=d.parts;
    const span=([a,b])=>a===b?`${a}`:`${a}–${b}`,[best,worst]=d.rounds;
    const rounds=!best?'Undrafted projection':!worst?`Round ${best} to undrafted projection`:best===worst?`Round ${best} projection`:`Round ${best}–${worst} projection`;
    return base+`<div class="pro-career" data-nfl-outlook><div class="eyebrow">NFL OUTLOOK</div><p><strong>${nfEsc(rounds)}</strong> · grade ${span(d.grade)}, ceiling ${span(d.ceiling)}</p><p class="small muted">From your staff's evaluation: current ${span(pr.ability)} · upside ${span(pr.upside)} · production ${pr.production} · style ${pr.style>0?'+':''}${pr.style} · position value ${d.positionValue>0?'+':''}${d.positionValue}. Better scouting narrows the range; pro scouts' own read is not shown.</p></div>`;
   }
  }catch(err){console.error(err)}
  return base;
 };
 if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.proPipeline=()=>{const t=selected();const s=nfl.school(t.name);return{pros:s.pros,active:s.active,rank:s.rank,pitch:s.pitch}};
}
