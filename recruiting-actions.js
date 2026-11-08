// Recruiting Desk (v0.15.0). Scouting hours tell you how good a prospect is; recruiting hours are how
// you win him. Each week the staff has a budget of hours, spent per recruit on calls, pitches,
// scholarship offers and visits. Targets nobody works start to cool, so the board is an allocation
// problem instead of a free list.
//
// The rules live in a pure factory (testable in Node). The browser branch below wires them into the
// engine through three small hooks app.js already exposes (recruitEffort, userMayCommit and the
// existing recruitPitch / advanceRecruiting / scheduleVisit functions) and adds the desk UI.
function makeRecruitingActionSystem(env){
 'use strict';
 const COSTS={call:2,pitch:3,offer:2,visit:5,inhome:8,keep:2};
 const LABELS={call:'Call',pitch:'Pitch',offer:'Offer',visit:'Campus Visit',inhome:'In-Home Visit',keep:'Check-in'};
 // Calibrated against full seasons: a board that is only called and offered when ripe lands about what
 // passive targeting used to, an idle board lands a little less, and a board worked with pitches and
 // in-homes on the winnable targets lands clearly more. Calls and pitches shrink inside a single week
 // so one recruit cannot soak up the whole budget.
 const CALL_INTEREST=[1,1,0,0],CALL_RELATIONSHIP=[2,1,1,0];
 const PITCH_BASE=4,PITCH_REPEAT_TOPIC=.35,PITCH_NEXT=.7,PITCH_OFF_PRIORITY=.4;
 const OFFER={interest:2,relationship:2,boost:3},INHOME={interest:5,relationship:4,boost:4,minInterest:45,minWeek:5};
 const WITHDRAW={interest:-6,relationship:-5};
 const GRACE_WEEKS=1,WARM_WEEKS=1;
 // Motivations. His stated priority is on the card. Beyond it he has a second priority worth 70% as
 // much when you pitch it, and about three in ten have a dealbreaker: an area where, if your program
 // is below the floor, he will not commit and your whole pitch drags. Both stay hidden until contact
 // uncovers them. They are derived from a hash of the recruit, so they draw no gameplay randomness.
 const SECOND_AT=2,DEALBREAKER_AT=4,DEALBREAKER_RATE=30,DEALBREAKER_FLOOR=50,SECOND_FIT=.7,DEALBREAKER_PITCH=-6;
 function hash(v){let h=2166136261>>>0;for(const ch of String(v??'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 // Decision funnel. Every recruit on your board has a decision week, fixed by a hash of the recruit: weeks
 // 5 to 10, one later for blue chips. He cuts his list to a Top 5 three weeks before, a Top 3 one week
 // before, and decides among those at the decision week. A program that is not in the list at a cut is
 // out for the season. Between cuts he does not commit on the weekly roll.
 const FUNNEL_FROM=5,FUNNEL_SPREAD=6,FUNNEL_STAR_DELAY=1,FUNNEL_MAX=11,TOP_WIDE=5,TOP_NARROW=3,CUT_WIDE_BEFORE=3,CUT_NARROW_BEFORE=1,DECIDE_NOISE=4;
 // Flip defense: a check-in on a recruit who has committed to you answers the moves aimed at him and holds him for two weeks.
 const KEEP={relationship:2,boost:8,boostFade:4,fromWeek:5};
 // Rival programs stand with him on the strength of their pitch. You also stand on the work you have put
 // in, which is what his interest measures: well above 40% it counts for you, well below it against you.
 const INTEREST_PIVOT=55,INTEREST_WEIGHT=.45;
 // A recruit keeps a program that has offered and that he truly likes on his list, whatever its rank.
 const SAFETY_INTEREST=65;
 // Staff send an offer once a target is this warm, so a target they are working still has a place on his list.
 const STAFF_OFFER_AT=55;
 function universe(){return env.getUniverse()}
 const clamp=(v,a,b)=>env.clamp(v,a,b);

 // ---------- hours ----------
 function hoursBudgetFor(t){
  const rc=t?.staff?.RC||{},hc=t?.staff?.HC||{};
  return clamp(Math.round(12+(rc.recruiting||60)*.38+(hc.recruiting||60)*.10+(t?.resources??60)*.06),30,60);
 }
 // Pure read: a stale or missing week reads as unspent without writing anything.
 function weekInfo(t){
  const u=universe(),budget=hoursBudgetFor(t),old=t?.recruitingWeek;
  const spent=old&&old.year===u.year&&old.week===u.week?clamp(Math.round(old.spent||0),0,budget):0;
  return{year:u.year,week:u.week,budget,spent};
 }
 function ensureWeek(t){
  const cur=weekInfo(t),old=t.recruitingWeek;
  if(!old||old.year!==cur.year||old.week!==cur.week)t.recruitingWeek=cur;else Object.assign(old,cur);
  return t.recruitingWeek;
 }
 function hoursLeft(t){const w=weekInfo(t);return Math.max(0,w.budget-w.spent)}
 function isActive(){const u=universe();return u.phase==='regular'||(u.phase==='preseason'&&u.week===0)}

 // ---------- per-recruit records ----------
 function blank(){return{season:universe().year,offered:false,offerWeek:null,inHome:false,lastWorkedWeek:null,graceWeek:null,week:null,history:[],contacts:0,known:{secondary:false,dealbreaker:false}}}
 function record(r,t,create=true){
  const u=universe(),key=String(t.id),old=r?.recruitingActions?.[key];
  if(old&&old.season===u.year){old.history=Array.isArray(old.history)?old.history:[];old.contacts??=0;old.known??={secondary:false,dealbreaker:false};return old}
  if(!create)return blank();
  r.recruitingActions??={};return(r.recruitingActions[key]=blank());
 }
 // Counters that only mean something inside one week.
 function weekState(rec){
  const wk=universe().week;
  if(!rec.week||rec.week.week!==wk)rec.week={week:wk,calls:0,pitches:{},pitchCount:0,hours:0};
  return rec.week;
 }
 function workedThisWeek(r,t){const rec=record(r,t,false);return rec.lastWorkedWeek===universe().week}

 // ---------- offers ----------
 function offerLimit(t){return Math.max(10,Math.round(env.scholarshipCapacity(t)*1.6))}
 function offersOut(recruits,t){
  const u=universe(),key=String(t.id);let n=0;
  for(const r of recruits||[]){const x=r?.recruitingActions?.[key];if(x&&x.season===u.year&&x.offered&&!r.committed&&!(r.funnel&&r.funnel.season===u.year&&r.funnel.cut))n++}
  return n;
 }
 function hasOffer(r,t){return!!record(r,t,false).offered}

 // ---------- pitching ----------
 function topicStrength(t,r,topic){
  switch(topic){
   case'Prestige':return t.prestige;
   case'NIL':return t.nil;
   case'Development':return t.development;
   case'Early Role':return clamp(Math.round((90-env.unitStrength(t,r.pos))*2.2),0,100);
   case'Coaching':return Math.round(((t.staff?.HC?.loyalty??60)+(t.staff?.RC?.recruiting??60))/2);
   case'Academics':return t.academics;
   case'Scheme Fit':return clamp(Math.round(env.schemeFit(t,r)),0,100);
   case'Winning':{const g=(t.w||0)+(t.l||0);return g?Math.round(t.w/g*100):Math.round((t.prestige||50)*.8)}
   case'Stay Close':return clamp(Math.round(100-env.distance(t,r)/12),0,100);
   case'Campus Life':return Math.round(((t.fan_support??60)+(t.facilities??60))/2);
  }
  return 50;
 }
 // Universes that predate the desk keep their in-flight targets exactly as they were, so they have
 // no hidden motivations either.
 function motivesOn(){return!universe().recruitingActions?.migrated}
 function motivesFor(r){
  const others=env.priorities.filter(p=>p!==r.priority),second=others[hash(`${r.id}|second`)%others.length];
  const rest=others.filter(p=>p!==second),deal=hash(`${r.id}|deal`)%100<DEALBREAKER_RATE?rest[hash(`${r.id}|dealtopic`)%rest.length]:null;
  return{primary:r.priority,secondary:second,dealbreaker:deal};
 }
 // The dealbreaker bites whether or not he has told you about it.
 function dealbreakerUnmet(r,t){
  if(!motivesOn())return null;
  const topic=motivesFor(r).dealbreaker;if(!topic)return null;
  const strength=topicStrength(t,r,topic);
  return strength<DEALBREAKER_FLOOR?{topic,strength,floor:DEALBREAKER_FLOOR}:null;
 }
 // `actual` is what a pitch really does; the menu only knows what he has told you.
 function fitFor(r,t,topic,{actual=false}={}){
  if(topic===r.priority)return 1;
  if(motivesOn()&&topic===motivesFor(r).secondary&&(actual||record(r,t,false).known.secondary))return SECOND_FIT;
  return PITCH_OFF_PRIORITY;
 }
 const pitchFactor=strength=>clamp((strength-40)/35,-.6,1.4);
 function pitchLabel(delta){return delta>=6?'Strong':delta>=3?'Good':delta>=1?'Modest':delta===0?'Flat':'Risky'}
 function pitchProjection(r,t,topic,opts={}){
  const rec=record(r,t,false),strength=topicStrength(t,r,topic),fit=fitFor(r,t,topic,opts);
  const wk=rec.week&&rec.week.week===universe().week?rec.week:{pitchCount:0,pitches:{}};
  let m=Math.pow(PITCH_NEXT,wk.pitchCount);if(wk.pitches[topic])m*=PITCH_REPEAT_TOPIC;
  const delta=Math.round(PITCH_BASE*fit*pitchFactor(strength)*m);
  const m2=motivesOn()?motivesFor(r):{},k=rec.known;
  return{topic,strength,fit,delta,label:pitchLabel(delta),priority:topic===r.priority,
   secondary:!!k.secondary&&topic===m2.secondary,dealbreaker:!!k.dealbreaker&&!!m2.dealbreaker&&topic===m2.dealbreaker};
 }
 function pitchOptions(r,t){
  return env.priorities.map(topic=>pitchProjection(r,t,topic)).sort((a,b)=>b.delta-a.delta||b.strength-a.strength);
 }
 // What contact has taught you. Two contacts open his second priority, four settle whether he has a
 // dealbreaker, and a campus or in-home visit shows you both at once.
 function learn(rec,r,kind,topic){
  const out=[];if(!motivesOn())return out;
  const m=motivesFor(r),k=rec.known,visit=kind==='visit'||kind==='inhome';
  rec.contacts++;
  if(!k.secondary&&(rec.contacts>=SECOND_AT||visit||(kind==='pitch'&&topic===m.secondary))){k.secondary=true;out.push(`His second priority is ${m.secondary}.`)}
  if(!k.dealbreaker&&(rec.contacts>=DEALBREAKER_AT||visit||(kind==='pitch'&&m.dealbreaker&&topic===m.dealbreaker))){
   k.dealbreaker=true;out.push(m.dealbreaker?`${m.dealbreaker} is a dealbreaker for him.`:'He has no dealbreakers.');
  }
  return out;
 }
 // For the desk: only ever what he has actually told you.
 function intel(r,t){
  if(!motivesOn())return{on:false,primary:r.priority};
  const m=motivesFor(r),rec=record(r,t,false),k=rec.known,unmet=dealbreakerUnmet(r,t);
  return{on:true,primary:m.primary,
   secondary:k.secondary?m.secondary:null,secondaryIn:k.secondary?0:Math.max(1,SECOND_AT-rec.contacts),
   dealbreaker:k.dealbreaker?(m.dealbreaker?{topic:m.dealbreaker,strength:topicStrength(t,r,m.dealbreaker),floor:DEALBREAKER_FLOOR,met:!unmet}:{none:true}):null,
   dealbreakerIn:k.dealbreaker?0:Math.max(1,DEALBREAKER_AT-rec.contacts)};
 }
 // A dealbreaker he has told you about that your program does not clear.
 function knownBlock(r,t){
  const i=intel(r,t);return i.dealbreaker&&i.dealbreaker.topic&&!i.dealbreaker.met?i.dealbreaker:null;
 }

 // ---------- availability / perform ----------
 function availability(r,t,kind,opts={}){
  if(!COSTS[kind])return{ok:false,reason:'Unknown recruiting action.'};
  if(!r||!t)return{ok:false,reason:'No recruit selected.'};
  const u=universe();
  if(!isActive())return{ok:false,reason:'Recruiting hours are available during the season and the preseason.'};
  if(kind==='keep'){
   if(r.committed!==t.name)return{ok:false,reason:'Check-ins are for recruits who have committed to you.'};
   if(u.week<KEEP.fromWeek)return{ok:false,reason:`Flip season opens in week ${KEEP.fromWeek}; there is nothing to defend yet.`};
  }else if(r.committed)return{ok:false,reason:`${r.name} has already committed${r.committed===t.name?' to you':' elsewhere'}.`};
  const f=funnelState(r);
  if(kind!=='keep'&&f&&f.cut)return{ok:false,reason:`${r.name} cut ${t.name} from his Top ${f.cut.at==='top5'?TOP_WIDE:TOP_NARROW} in week ${f.cut.week}.`};
  if(env.recruitBlocked&&env.recruitBlocked(t,r))return{ok:false,reason:`${r.name} will not consider ${t.name} again.`};
  const rec=record(r,t,false),cost=COSTS[kind],left=hoursLeft(t);
  if(kind==='offer'){
   if(rec.offered)return{ok:false,reason:'A scholarship offer is already out.'};
   const limit=offerLimit(t),out=offersOut(u.recruits,t);
   if(out>=limit)return{ok:false,reason:`You have ${out} of ${limit} offers out. Withdraw one first.`};
  }
  if(kind==='inhome'){
   if(!rec.offered)return{ok:false,reason:'Offer a scholarship before an in-home visit.'};
   if(rec.inHome)return{ok:false,reason:'The in-home visit is already done.'};
   if(u.week<INHOME.minWeek)return{ok:false,reason:`In-home visits open in week ${INHOME.minWeek}.`};
   if((r.interest||0)<INHOME.minInterest)return{ok:false,reason:`He has to be at ${INHOME.minInterest}% interest before the family opens the door.`};
  }
  if(kind==='visit'&&r.visitWeek)return{ok:false,reason:'A campus visit is already scheduled.'};
  if(kind==='pitch'&&opts.topic&&!env.priorities.includes(opts.topic))return{ok:false,reason:'Unknown pitch topic.'};
  if(cost>left)return{ok:false,reason:`Only ${left} recruiting hour${left===1?'':'s'} left this week; this costs ${cost}.`};
  return{ok:true,cost,left};
 }
 function pushHistory(rec,row){rec.history.push(row);if(rec.history.length>10)rec.history.splice(0,rec.history.length-10)}
 function perform(r,t,kind,opts={}){
  const check=availability(r,t,kind,opts);if(!check.ok)return check;
  const u=universe();
  if(kind!=='keep')env.ensureTargeted(r,t);
  const rec=record(r,t,true),wk=weekState(rec);
  let dI=0,dR=0,topic=null,note='';
  if(kind==='call'){
   const i=Math.min(wk.calls,CALL_INTEREST.length-1);dI=CALL_INTEREST[i];dR=CALL_RELATIONSHIP[i];wk.calls++;
   note=wk.calls>1?'Another call this week means less each time.':'';
  }else if(kind==='pitch'){
   topic=opts.topic&&env.priorities.includes(opts.topic)?opts.topic:pitchOptions(r,t)[0].topic;
   const proj=pitchProjection(r,t,topic,{actual:true});dI=proj.delta;dR=dI>0?Math.max(1,Math.round(2*proj.fit)):0;
   wk.pitchCount++;wk.pitches[topic]=(wk.pitches[topic]||0)+1;
   const hidden=proj.fit===SECOND_FIT&&topic!==r.priority&&!rec.known.secondary;
   note=`${proj.label} pitch on ${topic}${proj.priority?' — it is what he cares about':hidden?' — it landed better than expected':''}.`;
  }else if(kind==='offer'){
   rec.offered=true;rec.offerWeek=u.week;dI=OFFER.interest;dR=OFFER.relationship;note='Scholarship offer is out.';
  }else if(kind==='inhome'){
   rec.inHome=true;dI=INHOME.interest;dR=INHOME.relationship;note='The family hosted your staff.';
  }else if(kind==='visit'){
   env.scheduleVisit(r);dR=2;note=`Visit set for week ${r.visitWeek}.`;
  }else if(kind==='keep'){
   rec.keptWeek=u.week;dR=KEEP.relationship;note='He knows you are still in his corner.';
  }
  // Staff assignments: a contact that gains interest gains more in the territory of a strong recruiter.
  const territory=dI>0&&env.territoryBonus?env.territoryBonus(r,t)||0:0;
  if(territory){dI+=territory;note=`${note?note+' ':''}Territory bonus from your ${r.homeRegion} recruiter.`}
  if(dI)r.interest=clamp(Math.round((r.interest||0)+dI),1,100);
  if(dR){r.relationship=clamp((r.relationship||0)+dR,0,100);if(dR>0&&env.growRecruiterRelationship)env.growRecruiterRelationship(r,t,dR)}
  const week=ensureWeek(t);week.spent+=check.cost;
  rec.lastWorkedWeek=u.week;wk.hours+=check.cost;rec.hours=(rec.hours||0)+check.cost;
  const reveals=learn(rec,r,kind,topic);
  const answered=answerRivals(r,kind);
  noteSpend(t,kind,check.cost,answered);
  pushHistory(rec,{week:u.week,kind,cost:check.cost,topic,dI,dR});
  return{ok:true,kind,label:LABELS[kind],cost:check.cost,remaining:hoursLeft(t),dI,dR,topic,note,reveals,answered};
 }
 function withdrawOffer(r,t){
  if(!r||!t)return{ok:false,reason:'No recruit selected.'};
  if(r.committed)return{ok:false,reason:`${r.name} has already committed.`};
  const rec=record(r,t,false);if(!rec.offered)return{ok:false,reason:'There is no offer to withdraw.'};
  rec.offered=false;rec.offerWeek=null;rec.withdrawn=true;
  r.interest=clamp(Math.round((r.interest||0)+WITHDRAW.interest),1,100);r.relationship=clamp((r.relationship||0)+WITHDRAW.relationship,0,100);
  pushHistory(rec,{week:universe().week,kind:'withdraw',cost:0,topic:null,dI:WITHDRAW.interest,dR:WITHDRAW.relationship});
  return{ok:true,dI:WITHDRAW.interest,dR:WITHDRAW.relationship};
 }

 // ---------- what the engine asks ----------
 // How many weeks it has been since this recruit was last worked, as of `playedWeek`.
 function weeksSinceWorked(r,t,playedWeek,{stamp=false}={}){
  const rec=record(r,t,stamp);
  let last=rec.lastWorkedWeek;
  if(last==null){
   if(rec.graceWeek==null){if(!stamp)return 0;rec.graceWeek=playedWeek}
   last=rec.graceWeek;
  }
  return Math.max(0,playedWeek-last);
 }
 function effortFromSince(since){
  if(since<=GRACE_WEEKS-1)return{state:'worked',relScale:.75,bumpScale:.75,noiseScale:1,freeze:false,cool:0,relDecay:0};
  if(since<=GRACE_WEEKS-1+WARM_WEEKS)return{state:'warm',relScale:.4,bumpScale:.4,noiseScale:1,freeze:false,cool:0,relDecay:0};
  return{state:'cooling',relScale:0,bumpScale:0,noiseScale:.5,freeze:true,cool:1+Math.min(2,Math.floor((since-2)/2)),relDecay:1};
 }
 // Called inside the weekly pass, after the week counter has moved on, so the week just played is week-1.
 function effort(r,t){return effortFromSince(weeksSinceWorked(r,t,universe().week-1,{stamp:true}))}
 // The same question asked now: what happens to him if the week were played as it stands?
 function previewEffort(r,t){return effortFromSince(weeksSinceWorked(r,t,universe().week))}
 // An offer is necessary, and so is clearing his dealbreaker if he has one, told or not.
 function mayCommit(r,t){return!!t&&hasOffer(r,t)&&!dealbreakerUnmet(r,t)&&!funnelState(r)?.cut}
 // How hard a recent check-in holds a commitment against a flip: full the weeks right after, half after that.
 function keepBoost(r,t){
  const k=record(r,t,false).keptWeek;if(k==null)return 0;
  const age=universe().week-k;return age<=1?KEEP.boost:age===2?KEEP.boostFade:0;
 }
 // Standing bonus to the pitch the program makes, so offers and visits compete against rival programs.
 // An unmet dealbreaker drags it down for as long as it stands.
 function pitchBoost(r,t){
  const x=r?.recruitingActions?.[String(t?.id)];if(!x||x.season!==universe().year)return 0;
  return(x.offered?OFFER.boost:0)+(x.inHome?INHOME.boost:0)+(dealbreakerUnmet(r,t)?DEALBREAKER_PITCH:0);
 }

 // ---------- rival reactions ----------
 // Programs that are close to winning a recruit you are working react to what you do: they offer,
 // then host him, then visit the family. A move you have not answered adds to that program's pitch
 // for him, fading over a few weeks, which feeds the same race the weekly pass already runs. Only
 // recruits you have worked get rival activity, so the rest of the class is untouched. Everything is
 // decided from a hash of (recruit, week, program), so no gameplay randomness is drawn.
 const RIVAL_KINDS=['offer','visit','inhome'];
 const RIVAL_HEAT={offer:3,visit:5,inhome:7};
 const RIVAL_BASE={offer:3,visit:4,inhome:4},RIVAL_MIN_WEEK={offer:1,visit:3,inhome:6},RIVAL_LOOKS=3,RIVAL_MATCH_BONUS=5,RIVAL_STAR_BONUS=4;
 const RIVAL_FULL_AGE=1,RIVAL_FADE_AGE=3,RIVAL_KEEP=12;
 // What answers what: your offer answers theirs, a visit (or in-home) answers a visit, only an in-home answers an in-home.
 const ANSWERS={offer:['offer','keep'],visit:['visit','inhome','keep'],inhome:['inhome','keep']};
 const RIVAL_VERB={offer:'offered',visit:'is hosting him',inhome:'is visiting the family'};
 function rivalState(r){const w=r?.rivalWatch;return w&&w.season===universe().year?w:null}
 function rivalEnsure(r){const u=universe();if(!r.rivalWatch||r.rivalWatch.season!==u.year)r.rivalWatch={season:u.year,stages:{},events:[]};return r.rivalWatch}
 // `answered` holds the week it was answered, which can be 0 in the opening preseason, so never test it for truthiness.
 const isAnswered=ev=>ev.answered!==false&&ev.answered!=null;
 const eventAge=ev=>universe().week-ev.week;
 const eventWeight=ev=>{const a=eventAge(ev);return a<=RIVAL_FULL_AGE?1:a<=RIVAL_FADE_AGE?.5:0};
 // Pitch points a program has added against you for this recruit right now.
 function rivalHeat(r,teamName){
  const w=rivalState(r);if(!w)return 0;
  let h=0;for(const ev of w.events)if(ev.team===teamName&&!isAnswered(ev))h+=ev.heat*eventWeight(ev);
  return h;
 }
 // Interest he loses to the weekly pass for every live move you have not answered: a rival offer or
 // visit makes him wonder about you. Heat alone moved the race by under a point a week, which is too
 // quiet to be a decision; this is the part you can feel on the board.
 function rivalPressure(r){
  const w=rivalState(r);if(!w)return 0;
  let n=0;for(const ev of w.events)if(!isAnswered(ev))n+=Math.round(ev.heat*eventWeight(ev)*.5);
  return n;
 }
 function answeredAlready(r,t,kind){
  const rec=record(r,t,false);
  return kind==='offer'?!!rec.offered:kind==='visit'?(!!rec.offered&&(!!r.visitWeek||!!rec.inHome)):!!rec.inHome;
 }
 function addRivalEvent(r,t,team,kind){
  const u=universe(),w=rivalEnsure(r),idx=RIVAL_KINDS.indexOf(kind);if(idx<0)return null;
  w.stages[team]=Math.max(w.stages[team]||0,idx+1);
  const ev={id:`${r.id}|${team}|${kind}`,team,kind,week:u.week,heat:RIVAL_HEAT[kind],answered:!r.committed&&answeredAlready(r,t,kind)?u.week:false};
  w.events.push(ev);
  while(w.events.length>RIVAL_KEEP){
   const i=w.events.findIndex(e=>isAnswered(e)||eventAge(e)>RIVAL_FADE_AGE);w.events.splice(i>=0?i:0,1);
  }
  return ev;
 }
 // One roll per worked recruit per week, for one of his closest rivals, on that rival's next step.
 function generateRivals(recruits,t){
  const u=universe(),made=[];
  for(const r of recruits||[]){
   // Your own commitments draw interest from rivals once flip season opens.
   if(r.committed){if(r.committed!==t.name||u.week<KEEP.fromWeek)continue}else if(!r.targeted)continue;
   const rec=record(r,t,false);if(rec.lastWorkedWeek==null)continue;
   const top=env.topRivals(r,t,RIVAL_LOOKS);if(!top.length)continue;
   const w=rivalEnsure(r);
   // Each close rival rolls on its own next step; a recruit gets at most one new move a week.
   for(const pick of top){
    const stage=w.stages[pick]||0;if(stage>=RIVAL_KINDS.length)continue;
    const kind=RIVAL_KINDS[stage];if(u.week<RIVAL_MIN_WEEK[kind])continue;
    const p=RIVAL_BASE[kind]+(answeredAlready(r,t,kind)?RIVAL_MATCH_BONUS:0)+((r.stars||3)>=4?RIVAL_STAR_BONUS:0);
    if(hash(`${r.id}|${u.year}|${u.week}|${pick}|roll`)%100>=p)continue;
    made.push(addRivalEvent(r,t,pick,kind));break;
   }
  }
  return made;
 }
 function answerRivals(r,kind){
  const w=rivalState(r);if(!w)return 0;let n=0;
  for(const ev of w.events)if(!isAnswered(ev)&&ANSWERS[ev.kind].includes(kind)){ev.answered=universe().week;n++}
  return n;
 }
 // Newest first, with where each one stands.
 function rivalMoves(r){
  const w=rivalState(r);if(!w)return[];
  return w.events.map(ev=>({team:ev.team,kind:ev.kind,week:ev.week,heat:ev.heat,verb:RIVAL_VERB[ev.kind],answerWith:r.committed?['keep']:ANSWERS[ev.kind].filter(k=>k!=='keep'),
   state:isAnswered(ev)?'answered':eventAge(ev)>RIVAL_FADE_AGE?'lapsed':'live',cost:Math.round(ev.heat*eventWeight(ev)*10)/10})).reverse();
 }
 function liveMoves(r){return rivalMoves(r).filter(m=>m.state==='live')}
 function unansweredMoves(recruits,t){
  const out=[];
  for(const r of recruits||[]){if(r.committed?r.committed!==t.name:!r.targeted)continue;const m=liveMoves(r);if(m.length)out.push({recruit:r,moves:m})}
  return out;
 }

 // ---------- decision funnel ----------
 function funnelOn(){return!universe().recruitingActions?.migrated}
 function decisionWeekFor(r){return Math.min(FUNNEL_MAX,FUNNEL_FROM+hash(`${r.id}|decide`)%FUNNEL_SPREAD+((r.stars||3)>=4?FUNNEL_STAR_DELAY:0))}
 function funnelState(r){const f=r?.funnel;return f&&f.season===universe().year?f:null}
 function ensureFunnel(r){
  const u=universe();
  if(!r.funnel||r.funnel.season!==u.year)r.funnel={season:u.year,decisionWeek:decisionWeekFor(r),top5:null,top3:null,cut:null,decided:null};
  return r.funnel;
 }
 function standings(r,t){
  const bonus=((r.interest||0)-INTEREST_PIVOT)*INTEREST_WEIGHT;
  return env.rankTeams(r,t).map(x=>x.name===t.name?{...x,score:x.score+bonus}:x).sort((a,b)=>b.score-a.score);
 }
 const cutWeek=(f,kind)=>f.decisionWeek-(kind==='top5'?CUT_WIDE_BEFORE:CUT_NARROW_BEFORE);
 // He cuts his list when the week arrives, on how every program stands with him that week.
 function applyCuts(r,t){
  const f=ensureFunnel(r),w=universe().week;let ranked=null;
  const rank=()=>ranked??=standings(r,t);
  const note=(kind)=>{if(!f.cut&&!f[kind].includes(t.name))f.cut={week:w,at:kind}};
  // The last slot goes to you if you offered and he likes you, even when your pitch ranks lower.
  const keepsYou=()=>hasOffer(r,t)&&(r.interest||0)>=SAFETY_INTEREST&&!dealbreakerUnmet(r,t);
  const pick=(names,size)=>{const list=names.slice(0,size);if(!list.includes(t.name)&&names.includes(t.name)&&keepsYou())list[size-1]=t.name;return list};
  if(!f.top5&&w>=cutWeek(f,'top5')){const all=rank().map(x=>x.name),list=all.slice(0,TOP_WIDE);if(!list.includes(t.name)&&keepsYou())list[TOP_WIDE-1]=t.name;f.top5=list;note('top5')}
  if(!f.top3&&f.top5&&w>=cutWeek(f,'top3')){f.top3=pick(rank().map(x=>x.name).filter(n=>f.top5.includes(n)),TOP_NARROW);note('top3')}
  return f;
 }
 // Among his finalists, the best-standing program that can take him wins; you only count if you offered
 // and clear any dealbreaker. A little hash noise keeps close races from being foregone.
 function decide(r,t){
  const f=ensureFunnel(r),u=universe(),finalists=f.top3||f.top5||[];
  const ranked=standings(r,t),score=n=>ranked.find(x=>x.name===n)?.score??-1e9;
  const noise=n=>(hash(`${r.id}|${u.year}|${n}|decide`)%(DECIDE_NOISE*2+1))-DECIDE_NOISE;
  const eligible=n=>env.canTake(n)&&(n!==t.name||mayCommit(r,t));
  const order=finalists.filter(eligible).sort((a,b)=>(score(b)+noise(b))-(score(a)+noise(a)));
  for(const team of order){
   if(env.commit(r,team)){f.decided={team,week:u.week};return{team,won:team===t.name,finalists,listed:finalists.includes(t.name),offered:hasOffer(r,t)}}
  }
  // None of his finalists has a place for him. He takes the best program that does, which can be you
  // only if you offered.
  for(const {name} of ranked){
   if(finalists.includes(name)||!eligible(name))continue;
   if(env.commit(r,name)){f.decided={team:name,week:u.week,fallback:true};return{team:name,won:name===t.name,finalists,fallback:true,listed:finalists.includes(t.name),offered:hasOffer(r,t)}}
  }
  return null;
 }
 // Run once a week before the pass: cuts first, then the decisions that have come due.
 function runFunnel(recruits,t){
  const out={decided:[],cut:[]};if(!funnelOn()||!t)return out;
  const w=universe().week;
  for(const r of recruits||[]){
   if(!r.targeted||r.committed)continue;
   const had=funnelState(r)?.cut,f=applyCuts(r,t);
   if(!had&&f.cut&&f.cut.week===w)out.cut.push(r);
   if(f.decided||w<f.decisionWeek)continue;
   const res=decide(r,t);if(res)out.decided.push({recruit:r,...res});
  }
  return out;
 }
 // The weekly roll skips a recruit who is still waiting for his decision week.
 function holds(r,t){
  if(!funnelOn()||!r.targeted||r.committed)return false;
  const f=funnelState(r);return!!f&&!f.decided&&universe().week<f.decisionWeek;
 }
 // Where he stands, for the desk. Read-only; the ranking is cached until something that moves it changes.
 const rankCache=new WeakMap();
 function liveRank(r,t){
  const rec=record(r,t,false),sig=[universe().week,r.interest,r.relationship,rec.offered?1:0,rec.inHome?1:0,(r.rivalWatch?.events||[]).map(e=>isAnswered(e)?1:0).join('')].join('|');
  const hit=rankCache.get(r);if(hit&&hit.sig===sig)return hit.ranked;
  const ranked=standings(r,t);rankCache.set(r,{sig,ranked});return ranked;
 }
 function funnelStatus(r,t){
  if(!funnelOn())return{on:false};
  const f=funnelState(r),dw=f?f.decisionWeek:decisionWeekFor(r),w=universe().week;
  const base={on:true,decisionWeek:dw,weeksLeft:Math.max(0,dw-w),top5:f?.top5||null,top3:f?.top3||null,cut:f?.cut||null,
   cutWeeks:{top5:dw-CUT_WIDE_BEFORE,top3:dw-CUT_NARROW_BEFORE}};
  if(r.committed)return{...base,stage:'decided'};
  if(f?.cut)return{...base,stage:'cut'};
  const stage=f?.top3?'top3':f?.top5?'top5':'open',next=stage==='open'?'top5':stage==='top5'?'top3':null;
  if(!r.targeted)return{...base,stage:'open',next:null};
  const ranked=liveRank(r,t),idx=ranked.findIndex(x=>x.name===t.name),size=next==='top5'?TOP_WIDE:next==='top3'?TOP_NARROW:null;
  let cushion=null;
  if(size&&idx>=0)cushion=Math.round((ranked[idx].score-(idx<size?ranked[size]?.score??0:ranked[size-1].score))*10)/10;
  return{...base,stage,next:next?{kind:next,week:next==='top5'?base.cutWeeks.top5:base.cutWeeks.top3,size}:null,rank:idx>=0?idx+1:null,cushion};
 }
 function decisionsDue(recruits,t,within=1){
  if(!funnelOn())return[];
  const w=universe().week,out=[];
  for(const r of recruits||[]){
   if(!r.targeted||r.committed)continue;
   const f=funnelState(r);if(f?.cut||f?.decided)continue;
   const dw=f?f.decisionWeek:decisionWeekFor(r);if(dw-w<=within&&dw>=w)out.push({recruit:r,decisionWeek:dw});
  }
  return out.sort((a,b)=>a.decisionWeek-b.decisionWeek);
 }

 // ---------- the season's ledger and the week's news ----------
 // What the desk did over the year, kept on the program so the season review can tell it straight.
 const LEDGER_KEEP=40;
 function readLedger(t){const l=t?.recruitingSeason;return l&&l.year===universe().year?l:null}
 function ledger(t){
  const y=universe().year;
  if(!t.recruitingSeason||t.recruitingSeason.year!==y)t.recruitingSeason={year:y,hours:0,budget:0,actions:{},won:[],lost:[],cut:[],flipped:[],rivalMoves:0,answered:0};
  return t.recruitingSeason;
 }
 const who=r=>({id:r.id,name:r.name,pos:r.pos,stars:r.stars||0});
 const keepLast=(list,x)=>{list.push(x);if(list.length>LEDGER_KEEP)list.splice(0,list.length-LEDGER_KEEP)};
 function noteSpend(t,kind,cost,answered){const l=ledger(t);l.hours+=cost;l.actions[kind]=(l.actions[kind]||0)+1;l.answered+=answered||0}
 // One weekly pass: what the funnel did, which commitments flipped away, how many rival moves appeared.
 // Returns this week's entries so the news can be built from exactly what was recorded.
 function noteWeek(t,{decided=[],cut=[],flipped=[],rivalMoves=0}={}){
  const l=ledger(t),w=universe().week,out={won:[],lost:[],cut:[],flipped:[]};
  l.budget+=hoursBudgetFor(t);l.rivalMoves+=rivalMoves;
  for(const d of decided){
   const base={...who(d.recruit),week:w};
   if(d.won){keepLast(l.won,base);out.won.push(base)}
   else{const x={...base,team:d.team,listed:!!d.listed,offered:!!d.offered,fallback:!!d.fallback};keepLast(l.lost,x);out.lost.push(x)}
  }
  for(const r of cut){
   const f=funnelState(r),at=f?.cut?.at||'top5';
   const x={...who(r),week:w,at,list:(f?.[at]||[]).filter(n=>n!==t.name).slice(0,5)};keepLast(l.cut,x);out.cut.push(x);
  }
  for(const {recruit,to} of flipped){const x={...who(recruit),week:w,team:to||null};keepLast(l.flipped,x);out.flipped.push(x)}
  return out;
 }
 // Why a recruit went elsewhere, in the plainest terms the records support.
 function lostWhy(x){
  if(x.fallback)return'None of his finalists had room, so he took the best program that did.';
  if(!x.listed)return'You were not on his final list.';
  if(!x.offered)return'You were on his final list, but you never made him an offer.';
  return`You were on his final list and he chose ${x.team}.`;
 }
 const starsOf=x=>'★'.repeat(x.stars||0);
 // Hub items for the week just played. Commitments to you already have their own "COMMITMENT" item.
 function newsItems(t){
  const last=t?.recruitingLastWeek,u=universe();
  if(!last||last.year!==u.year||last.week!==u.week-1||!last.funnel)return[];
  const f=last.funnel,items=[],label=x=>`${starsOf(x)} ${x.pos} ${x.name}`.trim();
  for(const x of f.lost||[])items.push({type:'bad-news',tab:'recruiting',recruit:x.id,kicker:'LOST',importance:46+(x.stars||0)*4,main:`${label(x)} chose ${x.team}`,sub:lostWhy(x)});
  for(const x of f.cut||[])items.push({type:'alert',tab:'recruiting',recruit:x.id,kicker:'CUT',importance:40+(x.stars||0)*3,main:`${label(x)} cut you from his Top ${x.at==='top3'?3:5}`,sub:x.list?.length?`His list: ${x.list.join(', ')}`:'You are out for the season.'});
  for(const x of last.flipped||[])items.push({type:'bad-news',tab:'recruiting',recruit:x.id,kicker:'FLIPPED',importance:64+(x.stars||0)*3,main:`${label(x)} flipped${x.team?` to ${x.team}`:''}`,sub:'A rival moved on a commitment. Check in on commitments from week 5.'});
  return items;
 }
 // The year in one place, for the season review. Null when the desk did nothing.
 function deskSummary(t){
  const l=readLedger(t);if(!l||(!l.hours&&!l.won.length&&!l.lost.length&&!l.cut.length&&!l.flipped.length))return null;
  const best=list=>list.slice().sort((a,b)=>b.stars-a.stars||a.week-b.week)[0]||null;
  const bw=best(l.won),bl=best(l.lost);
  return{hours:l.hours,budget:l.budget,actions:{...l.actions},won:l.won.length,lost:l.lost.length,cut:l.cut.length,flipped:l.flipped.length,
   rivalMoves:l.rivalMoves,answered:Math.min(l.answered,l.rivalMoves),neverOffered:l.lost.filter(x=>x.listed&&!x.offered).length,
   biggestWin:bw,biggestLoss:bl?{...bl,why:lostWhy(bl)}:null};
 }

 // ---------- board status ----------
 function status(r,t){
  const rec=record(r,t,false),u=universe(),open=!r.committed;
  const worked=rec.lastWorkedWeek===u.week,pe=open&&r.targeted?previewEffort(r,t):null,blocked=knownBlock(r,t);
  return{
   offered:!!rec.offered,inHome:!!rec.inHome,worked,blocked,rivals:open||r.committed===t.name?liveMoves(r):[],cut:!!funnelState(r)?.cut,
   cooling:!!pe&&!worked&&pe.state==='cooling',
   warm:!!pe&&!worked&&pe.state==='warm',
   ready:open&&r.targeted&&!rec.offered&&!blocked&&(r.interest||0)>=68,
   history:rec.history.slice(-3).reverse()
  };
 }
 function workload(recruits,t){
  const targets=(recruits||[]).filter(r=>r?.targeted&&!r.committed);
  let worked=0,cooling=0,ready=0,rivals=0;
  for(const r of targets){const s=status(r,t);if(s.worked)worked++;if(s.cooling)cooling++;if(s.ready)ready++;rivals+=s.rivals.length}
  // A commitment under pressure is part of the same list: it is the one you cannot afford to ignore.
  for(const r of recruits||[])if(r?.committed===t.name)rivals+=liveMoves(r).length;
  return{targets:targets.length,worked,cooling,ready,rivals,offersOut:offersOut(recruits,t),offerLimit:offerLimit(t),left:hoursLeft(t),budget:hoursBudgetFor(t)};
 }

 // ---------- staff work ----------
 // What the staff does when told to work the board: warm everyone, hand out the offers that are ripe,
 // then spend what is left on the best-fitting pitches. It never books visits or in-homes; those are
 // yours to call. Fully deterministic, so it consumes no gameplay randomness.
 function staffPlan(recruits,t,{maxOffers=4,maxPitches=3}={}){
  const targets=(recruits||[]).filter(r=>r?.targeted&&!r.committed&&!funnelState(r)?.cut).sort((a,b)=>(a.nationalRank||1e9)-(b.nationalRank||1e9));
  const done={calls:0,pitches:0,offers:0,keeps:0,hours:0};
  const run=(r,kind,opts)=>{const out=perform(r,t,kind,opts);if(out.ok){done.hours+=out.cost;if(kind==='call')done.calls++;else if(kind==='keep')done.keeps++;else if(kind==='pitch')done.pitches++;else if(kind==='offer')done.offers++}return out.ok};
  // A commitment with a rival circling is the first thing worth two hours.
  for(const r of recruits||[])if(r?.committed===t.name&&liveMoves(r).length)run(r,'keep');
  let n=0;
  // Staff do not offer a recruit who has told them they cannot clear his dealbreaker.
  // A rival's offer is worth answering sooner than an interest threshold would suggest.
  const rivalOffered=r=>liveMoves(r).some(m=>m.kind==='offer');
  // A recruit who has put you on his list cannot choose you without an offer, and two hours is cheap for that.
  const onHisList=r=>{const f=funnelState(r);return!!f&&!f.cut&&(f.top3||f.top5||[]).includes(t.name)};
  for(const r of targets){if(n>=maxOffers)break;if(!hasOffer(r,t)&&!knownBlock(r,t)&&((r.interest||0)>=STAFF_OFFER_AT||((r.interest||0)>=40&&rivalOffered(r))||onHisList(r))&&run(r,'offer'))n++}
  for(const r of targets)if(!workedThisWeek(r,t))run(r,'call');
  let p=0;
  for(const r of targets){
   if(p>=maxPitches)break;
   const best=pitchOptions(r,t)[0];
   if(best&&best.delta>=4&&run(r,'pitch',{topic:best.topic}))p++;
  }
  return done;
 }

 // ---------- automation ----------
 // "Staff handle recruiting": every week, before it plays, the staff spend whatever hours the coach
 // left unspent using the staff plan. The coach can still act first and the staff fill in around it.
 function isAuto(u){return!!u?.recruitingActions?.auto}
 function setAuto(u,on){
  if(!u)return false;
  u.recruitingActions??={version:1,year:u.year,week:u.week};
  u.recruitingActions.auto=!!on;return u.recruitingActions.auto;
 }

 // ---------- one-time migration ----------
 // A save from before the Recruiting Desk has targets that were committing on interest alone.
 // Treat those as already offered so nothing in flight changes under the player.
 function grandfather(u,t){
  // Without a controlled program there is nothing to grandfather yet; try again on the next load.
  if(!u||u.recruitingActions||!t)return false;
  u.recruitingActions={version:1,year:u.year,week:u.week,migrated:true};
  for(const r of u.recruits||[]){
   if(!r.targeted||r.committed)continue;
   const rec=record(r,t,true);rec.offered=true;rec.offerWeek=u.week;rec.grandfathered=true;
  }
  return true;
 }

 return{COSTS,LABELS,INHOME,OFFER,hoursBudgetFor,weekInfo,ensureWeek,hoursLeft,isActive,record,weekState,workedThisWeek,
  offerLimit,offersOut,hasOffer,topicStrength,motivesFor,dealbreakerUnmet,intel,knownBlock,pitchProjection,pitchOptions,availability,perform,withdrawOffer,
  effort,previewEffort,effortFromSince,weeksSinceWorked,mayCommit,pitchBoost,status,workload,staffPlan,isAuto,setAuto,funnelOn,decisionWeekFor,funnelState,funnelStatus,runFunnel,holds,decisionsDue,keepBoost,noteWeek,newsItems,deskSummary,rivalHeat,rivalPressure,addRivalEvent,generateRivals,answerRivals,rivalMoves,liveMoves,unansweredMoves,grandfather};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeRecruitingActionSystem};
}else{
 const recruitingActions=makeRecruitingActionSystem({
  getUniverse:()=>universe,clamp,priorities:PRIORITIES,
  scholarshipCapacity:t=>scholarshipCapacity(t),
  unitStrength:(t,pos)=>unitCached(t,pos),
  schemeFit:(t,r)=>recruitSchemeFit(t,r),
  distance:(t,r)=>recruitDistance(t,r),
  recruitBlocked:(t,r)=>recruitBlocked(t,r),
  growRecruiterRelationship:(r,t,gain)=>growRecruiterRelationship(r,t,gain),
  ensureTargeted:(r,t)=>{if(!r.targeted)r.targeted=true;firstRecruitEvaluation(r,t)},
  scheduleVisit:r=>scheduleVisitBeforeRecruitingActions(r),
  // Every program ranked by how it stands with him this week: the pitch it makes (rival heat and your own
  // offers and visits included), plus the pull a recruit on your board feels toward you.
  rankTeams:(r,t)=>universe.teams.filter(x=>!recruitBlocked(x,r))
   .map(x=>({name:x.name,score:recruitPitch(x,r)+(x.id===t.id&&r.targeted?10+(r.relationship||0)*.12:0)})).sort((a,b)=>b.score-a.score),
  canTake:name=>canTakeCommit(name),
  territoryBonus:(r,t)=>t?.name===$('#userTeam')?.value?globalThis.DynastyStaffAssignments?.recruitBonus(r,t)||0:0,
  commit:(r,name)=>commitRecruit(r,name),
  // The programs closest to winning him, other than yours, by the pitch they would make on their own.
  topRivals:(r,t,n)=>universe.teams.filter(x=>x.id!==t.id&&!recruitBlocked(x,r)&&canTakeCommit(x.name))
   .map(x=>({name:x.name,score:recruitPitchBeforeRecruitingActions(x,r)})).sort((a,b)=>b.score-a.score).slice(0,n).map(x=>x.name)
 });
 globalThis.DynastyRecruitingActions=recruitingActions;
 // Null when the staff have recruiting, so the weekly reminder to spend hours stays quiet.
 // For the weekly reminder: how many live rival moves are on the board, and who they are on.
 globalThis.DynastyRecruitingRivals=t=>{
  if(!t||!universe?.recruits)return null;
  const rows=recruitingActions.unansweredMoves(universe.recruits,t);
  return{count:rows.reduce((n,x)=>n+x.moves.length,0),names:rows.slice(0,3).map(x=>x.recruit.name)};
 };
 // The week's recruiting news for the This Week list, and the year's summary for the season review.
 globalThis.DynastyRecruitingNews=t=>t?recruitingActions.newsItems(t):[];
 globalThis.DynastyRecruitingSeason=t=>t?recruitingActions.deskSummary(t):null;
 // Recruits who pick a school on this advance or the next.
 globalThis.DynastyRecruitingDecisions=t=>{
  if(!t||!universe?.recruits)return null;
  const rows=recruitingActions.decisionsDue(universe.recruits,t,1);
  return{count:rows.length,names:rows.slice(0,3).map(x=>x.recruit.name),unoffered:rows.filter(x=>!recruitingActions.hasOffer(x.recruit,t)).length};
 };
 globalThis.DynastyRecruitingWeek=t=>t&&!recruitingActions.isAuto(universe)?recruitingActions.weekInfo(t):null;

 // --- engine hooks ---
 recruitEffort=function(r,t){
  const e=recruitingActions.effort(r,t);
  if(e.state==='cooling')passCooled.push(r.id);
  const pressure=recruitingActions.rivalPressure(r);
  return pressure?{...e,cool:e.cool+pressure}:e;
 };
 userMayCommit=function(r,t){return recruitingActions.mayCommit(r,t)};
 recruitHolds=function(r,u){return recruitingActions.holds(r,u)};
 recruitKeepBoost=function(r,u){return recruitingActions.keepBoost(r,u)};
 let passCooled=[];
 const recruitPitchBeforeRecruitingActions=recruitPitch;
 recruitPitch=function(t,r){
  const base=recruitPitchBeforeRecruitingActions(t,r);
  if(!r.recruitingActions&&!r.rivalWatch)return base;
  // Your edge only exists for you; a rival's heat only for that rival.
  const boost=recruitingActions.pitchBoost(r,t)+recruitingActions.rivalHeat(r,t.name);
  return boost?base+boost:base;
 };
 // A campus visit costs hours; cancelling one is free but gives nothing back.
 const scheduleVisitBeforeRecruitingActions=scheduleVisit;
 scheduleVisit=function(r){
  if(r.visitWeek)return scheduleVisitBeforeRecruitingActions(r);
  const t=selected(),res=recruitingActions.perform(r,t,'visit');
  setStatus(res.ok?`${res.label}: ${r.name}. ${res.note} ${res.remaining} recruiting hour${res.remaining===1?'':'s'} left.`:res.reason);
 };
 const advanceRecruitingBeforeRecruitingActions=advanceRecruiting;
 advanceRecruiting=function(){
  const t=selected(),playedWeek=universe.week-1;passCooled=[];
  // Cuts and decisions come due before the weekly pass, so the pass sees who has already chosen.
  const funnel=recruitingActions.runFunnel(universe.recruits,t);
  const held=t?new Set(universe.recruits.filter(r=>r.committed===t.name).map(r=>r.id)):null;
  const out=advanceRecruitingBeforeRecruitingActions();
  if(t){
   const rivalMoves=recruitingActions.generateRivals(universe.recruits,t).length;
   // The hours ledger still describes the week just played, because the counter has already moved on.
   const w=t.recruitingWeek&&t.recruitingWeek.year===universe.year&&t.recruitingWeek.week===playedWeek?t.recruitingWeek:null;
   t.recruitingLastWeek={year:universe.year,week:playedWeek,spent:w?w.spent:0,budget:recruitingActions.hoursBudgetFor(t),cooled:passCooled.slice(0,12),cooledCount:passCooled.length,rivalMoves,
    funnel:null,flipped:[]};
   // Your commitments that left during the pass, then everything the week did, recorded once.
   const flipped=universe.recruits.filter(r=>held.has(r.id)&&r.committed!==t.name).map(r=>({recruit:r,to:r.committed}));
   const week=recruitingActions.noteWeek(t,{decided:funnel.decided,cut:funnel.cut,flipped,rivalMoves});
   t.recruitingLastWeek.funnel={won:week.won,lost:week.lost,cut:week.cut};t.recruitingLastWeek.flipped=week.flipped;
  }
  return out;
 };
 // Universes created from here on never need the migration; only saves that predate the desk do.
 const initUniverseBeforeRecruitingActions=initUniverse;
 initUniverse=function(...args){
  const out=initUniverseBeforeRecruitingActions(...args);
  if(universe)universe.recruitingActions??={version:1,year:universe.year,week:universe.week};
  return out;
 };
 const normalizeUniverseBeforeRecruitingActions=normalizeUniverse;
 normalizeUniverse=function(){
  const out=normalizeUniverseBeforeRecruitingActions();
  try{recruitingActions.grandfather(universe,selected())}catch{}
  return out;
 };
 // The staff work the board before a week plays when the coach has handed recruiting over, and
 // always when the whole season is being simulated (that already hands decisions to the staff).
 const simWeekBeforeRecruitingActions=simWeek;
 simWeek=function(skipDecisions=false){
  if(recruitingActions.isActive()){
   const t=selected(),skipping=skipDecisions===true;
   if(t&&(skipping||recruitingActions.isAuto(universe))&&guidanceActionEligibility(skipping?'simulate-season':'advance-week').allowed)recruitingActions.staffPlan(universe.recruits,t);
  }
  return simWeekBeforeRecruitingActions(skipDecisions);
 };
 // The opening preseason is its own step; hand it over too.
 const beginSeasonBeforeRecruitingActions=beginSeason;
 beginSeason=function(...args){
  const t=selected();
  if(t&&openingPreseason()&&recruitingActions.isActive()&&recruitingActions.isAuto(universe))recruitingActions.staffPlan(universe.recruits,t);
  return beginSeasonBeforeRecruitingActions(...args);
 };

 // --- desk UI ---
 const raEsc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const raRecruit=id=>(universe.recruits||[]).find(x=>String(x.id)===String(id))||null;
 const hoursText=n=>`${n} hour${n===1?'':'s'}`;
 function chipsHTML(r,t){
  const s=recruitingActions.status(r,t),out=[];
  if(s.blocked)out.push(`<span class="ra-chip ra-warn" title="Your ${raEsc(s.blocked.topic)} is ${s.blocked.strength}; he needs ${s.blocked.floor}.">Dealbreaker: ${raEsc(s.blocked.topic)}</span>`);
  if(s.rivals.length){const m=s.rivals[0];out.push(`<span class="ra-chip ra-warn">${raEsc(m.team)} ${raEsc(m.verb)}${s.rivals.length>1?` +${s.rivals.length-1}`:''}</span>`)}
  if(s.offered)out.push('<span class="ra-chip ra-ok">Offer out</span>');
  if(s.inHome)out.push('<span class="ra-chip ra-ok">In-home done</span>');
  if(s.ready)out.push('<span class="ra-chip ra-hot">Ready to commit — needs an offer</span>');
  if(s.worked)out.push('<span class="ra-chip ra-ok">Worked this week</span>');
  else if(s.cooling)out.push('<span class="ra-chip ra-warn">Cooling — not worked</span>');
  else if(s.warm)out.push('<span class="ra-chip">Warm — work him this week</span>');
  return out.join('');
 }
 // What the programs chasing him have done, and what answering would take.
 function rivalHTML(r){
  const moves=recruitingActions.rivalMoves(r).slice(0,4);if(!moves.length)return'';
  const need=m=>m.answerWith.map(k=>`${recruitingActions.LABELS[k]} (${recruitingActions.COSTS[k]}h)`).join(' or ');
  const rows=moves.map(m=>{
   const what=`${raEsc(m.team)} ${raEsc(m.verb)} · wk ${m.week}`;
   const tail=m.state==='live'?`<em>Unanswered — costing you about ${Math.max(1,Math.round(m.cost*.5))} interest a week and adding to their pitch. Answer with ${raEsc(need(m))}.</em>`:m.state==='answered'?'<em>Answered.</em>':'<em>Faded.</em>';
   return`<div class="ra-rival ra-${m.state}"><b>${what}</b>${tail}</div>`;
  }).join('');
  return`<div class="ra-rivals"><span class="eyebrow">RIVAL WATCH</span>${rows}</div>`;
 }
 // Only ever what he has told you. Contacts uncover his second priority and whether he has a dealbreaker.
 function motivesHTML(r,t){
  const i=recruitingActions.intel(r,t);if(!i.on)return'';
  const more=n=>`<i title="Calls, pitches and offers each count; a campus or in-home visit shows you at once.">not yet — ${n} more contact${n===1?'':'s'}</i>`;
  let deal,warn=false;
  if(!i.dealbreaker)deal=more(i.dealbreakerIn);
  else if(i.dealbreaker.none)deal='none';
  else{const d=i.dealbreaker;warn=!d.met;deal=`${raEsc(d.topic)} — your ${d.strength}, he needs ${d.floor}${d.met?' (you clear it)':' (you do not)'}`}
  return`<div class="ra-motives"><span><b>Cares most about</b>${raEsc(i.primary)}</span><span><b>Second priority</b>${i.secondary?raEsc(i.secondary):more(i.secondaryIn)}</span><span class="${warn?'ra-warn-text':''}"><b>Dealbreaker</b>${deal}</span></div>`;
 }
 // When he decides, who is on his list, and where you stand. Read-only.
 function funnelHTML(r,t){
  const f=recruitingActions.funnelStatus(r,t);if(!f.on)return'';
  const names=list=>list.map(n=>n===t.name?'<b class="ra-you">You</b>':raEsc(n)).join(' · ');
  const cells=[`<span><b>Decides</b>week ${f.decisionWeek}${f.weeksLeft?` · ${f.weeksLeft} week${f.weeksLeft===1?'':'s'} away`:' · this week'}</span>`];
  if(f.cut)cells.push(`<span class="ra-warn-text"><b>His list</b>Cut you from his Top ${f.cut.at==='top5'?5:3} in week ${f.cut.week}</span>`);
  else{
   if(f.top3)cells.push(`<span><b>His Top 3</b>${names(f.top3)}</span>`);
   else if(f.top5)cells.push(`<span><b>His Top 5</b>${names(f.top5)}</span>`);
   if(f.next){
    const line=f.rank?`you rank #${f.rank}${f.cushion==null?'':f.cushion>=0?` · ${f.cushion} inside the line`:` · ${-f.cushion} short of the line`}`:'';
    cells.push(`<span class="${f.cushion!=null&&f.cushion<0?'ra-warn-text':''}"><b>Next cut</b>Top ${f.next.size} in week ${f.next.week}${line?` · ${line}`:''}</span>`);
   }else if(!f.top5)cells.push('<span><b>His list</b>not cut yet</span>');
  }
  const offer=!f.cut&&r.targeted&&!recruitingActions.hasOffer(r,t)?'<small class="ra-warn-text">He cannot choose you without a scholarship offer.</small>':'';
  return`<div class="ra-funnel">${cells.join('')}</div>${offer}`;
 }
 // A recruit who has committed to you: rivals work on him in flip season, and a check-in holds him.
 function careHTML(r,t){
  const w=recruitingActions.weekInfo(t),left=recruitingActions.hoursLeft(t),a=recruitingActions.availability(r,t,'keep');
  const kept=recruitingActions.record(r,t,false).keptWeek,recent=kept!=null&&universe.week-kept<=2,live=recruitingActions.liveMoves(r).length>0;
  const chips=[r.challenger?`<span class="ra-chip ra-warn">Wavering — ${raEsc(r.challenger)} is closing</span>`:'<span class="ra-chip ra-ok">Solid</span>',recent?`<span class="ra-chip ra-ok">Checked in week ${kept}</span>`:''].join('');
  const open=universe.week>=5;
  return`<section class="recruiting-desk ra-care" data-recruiting-desk="${raEsc(r.id)}"><div class="ra-head"><div><span class="eyebrow">COMMITMENT</span><strong>Committed to you · ${left} / ${w.budget} hours left</strong></div><div class="ra-chips">${chips}</div></div>${rivalHTML(r)}<div class="ra-actions"><button type="button" class="${a.ok&&live?'ra-answer':''}" data-ra-action="keep" data-ra-recruit="${raEsc(r.id)}" ${a.ok?'':`disabled title="${raEsc(a.reason)}"`}>Check in · ${recruitingActions.COSTS.keep}h</button></div><small class="muted">${open?'Flip season is on: rivals keep working on committed players. A check-in answers every move aimed at him and holds him for two weeks.':'Flip season opens in week 5; there is nothing to defend yet.'}</small></section>`;
 }
 function deskHTML(id){
  if(!universe?.teams)return'';
  const r=raRecruit(id),t=selected();if(!r||!t)return'';
  if(r.committed)return r.committed===t.name?careHTML(r,t):'';
  const w=recruitingActions.weekInfo(t),left=recruitingActions.hoursLeft(t),A=kind=>recruitingActions.availability(r,t,kind);
  const live=recruitingActions.liveMoves(r),answers=kind=>live.some(m=>m.answerWith.includes(kind));
  const btn=(kind,label)=>{const a=A(kind),ans=a.ok&&answers(kind);return`<button type="button" class="${ans?'ra-answer':''}" data-ra-action="${kind}" data-ra-recruit="${raEsc(r.id)}" ${a.ok?(ans?'title="Answers a rival move"':''):`disabled title="${raEsc(a.reason)}"`}>${label} · ${recruitingActions.COSTS[kind]}h</button>`};
  const opts=recruitingActions.pitchOptions(r,t);
  const tag=o=>o.priority?' (his priority)':o.secondary?' (also matters)':o.dealbreaker?' (dealbreaker)':'';
  const select=`<select data-ra-topic="${raEsc(r.id)}" aria-label="Pitch topic">${opts.map(o=>`<option value="${raEsc(o.topic)}">${raEsc(o.topic)}${tag(o)} — ${o.label}</option>`).join('')}</select>`;
  const rec=recruitingActions.record(r,t,false);
  const withdraw=rec.offered&&!r.committed?`<button type="button" class="ra-quiet" data-ra-action="withdraw" data-ra-recruit="${raEsc(r.id)}" title="Takes the offer back. He cools toward you.">Withdraw offer</button>`:'';
  const hist=recruitingActions.status(r,t).history.map(h=>`<span>W${h.week}: ${raEsc(h.kind==='withdraw'?'Offer withdrawn':recruitingActions.LABELS[h.kind]+(h.topic?' · '+h.topic:''))}${h.dI?` · ${h.dI>0?'+':''}${h.dI} interest`:''}</span>`).join('');
  return`<section class="recruiting-desk" data-recruiting-desk="${raEsc(r.id)}"><div class="ra-head"><div><span class="eyebrow">RECRUITING DESK</span><strong>${left} / ${w.budget} hours left this week</strong></div><div class="ra-chips">${chipsHTML(r,t)}</div></div>${motivesHTML(r,t)}${funnelHTML(r,t)}${rivalHTML(r)}<div class="ra-actions">${btn('call','Call')}<span class="ra-pitch">${select}${btn('pitch','Pitch')}</span>${btn('offer','Offer')}${btn('visit','Visit')}${btn('inhome','In-Home')}${withdraw}</div>${hist?`<div class="ra-history">${hist}</div>`:''}<small class="muted">Sell what he cares about, and only what you can back up: a weak topic costs you interest. He needs an offer before he can commit to you.</small><div class="ra-desk-staff">${staffControlsHTML(recruitingActions.workload(universe.recruits,t))}</div></section>`;
 }
 function announce(res,r){
  const t=selected();
  if(!res.ok){setStatus(res.reason);return}
  const learned=(res.reveals||[]).map(x=>`Learned: ${x}`).join(' ');
  if(learned)res.note=`${res.note||''} ${learned}`.trim();
  const d=[res.dI?`${res.dI>0?'+':''}${res.dI} interest`:'',res.dR?`${res.dR>0?'+':''}${res.dR} relationship`:''].filter(Boolean).join(', ');
  setStatus(`${res.label||'Offer withdrawn'}: ${r.name}.${d?` ${d}.`:''} ${res.note||''} ${hoursText(recruitingActions.hoursLeft(t))} left this week.`.replace(/\s+/g,' ').trim());
 }
 function bindDesk(root=document){
  root.querySelectorAll?.('[data-ra-action]').forEach(b=>{
   if(b.dataset.raBound)return;b.dataset.raBound='1';
   b.onclick=e=>{
    e.preventDefault();e.stopPropagation();
    const r=raRecruit(b.dataset.raRecruit),t=selected(),kind=b.dataset.raAction;if(!r||!t)return;
    const dialog=b.closest?.('#recruitDialog');
    let res;
    if(kind==='withdraw'){if(!confirm(`Withdraw the scholarship offer to ${r.name}? He will cool toward your program.`))return;res=recruitingActions.withdrawOffer(r,t)}
    else{const topic=kind==='pitch'?b.parentElement?.querySelector('select')?.value:undefined;res=recruitingActions.perform(r,t,kind,{topic})}
    if(res.ok)autosaveAfter('management');
    announce(res,r);
    renderRecruiting();
    if(dialog&&res.ok){const d=$('#recruitDialog');if(d?.open)d.close();showRecruitProfile(r.id)}
   };
  });
 }
 // Staff controls: a one-off "work the board now" and the standing hand-over.
 function staffControlsHTML(work){
  const auto=recruitingActions.isAuto(universe);
  return`<div class="ra-staff"><label class="ra-auto" title="Each week, before it plays, the staff spend any recruiting hours you left unused."><input type="checkbox" data-ra-auto ${auto?'checked':''}><span>Staff handle recruiting</span></label><button type="button" data-ra-staff ${work.left&&work.targets?'':'disabled'}>Work the board now</button></div>`;
 }
 // Up to four recruits with a live rival move, each one a button that opens his card.
 function rivalListHTML(){
  const rows=recruitingActions.unansweredMoves(universe.recruits,selected()).slice(0,4);if(!rows.length)return'';
  return`<div class="ra-nav-rivals"><span class="eyebrow">RIVAL MOVES</span>${rows.map(x=>`<button type="button" class="ra-rival-row" data-rwid="${raEsc(x.recruit.id)}"><b>${raEsc(x.recruit.name)}</b><small>${x.recruit.committed?'Committed · ':''}${raEsc(x.moves[0].team)} ${raEsc(x.moves[0].verb)}${x.moves.length>1?` +${x.moves.length-1}`:''}</small></button>`).join('')}</div>`;
 }
 // Recruits about to pick a school, each one a button that opens his card.
 function decisionListHTML(){
  const t=selected(),rows=recruitingActions.decisionsDue(universe.recruits,t,1).slice(0,4);if(!rows.length)return'';
  return`<div class="ra-nav-rivals"><span class="eyebrow">DECIDING SOON</span>${rows.map(x=>{const r=x.recruit,offered=recruitingActions.hasOffer(r,t);return`<button type="button" class="ra-rival-row" data-rwid="${raEsc(r.id)}"><b>${raEsc(r.name)}</b><small>Decides week ${x.decisionWeek}${offered?'':' · no offer from you yet'}</small></button>`}).join('')}</div>`;
 }
 function navHTML(){
  // The workspace paints once at page load, before any dynasty exists.
  if(!universe?.teams)return'';
  const t=selected();if(!t||!recruitingActions.isActive())return'';
  const work=recruitingActions.workload(universe.recruits,t),auto=recruitingActions.isAuto(universe);
  return`<div class="ra-nav"><span class="eyebrow">RECRUITING HOURS</span><strong>${work.left} / ${work.budget} left</strong><small>${work.targets} on the board · ${work.worked} worked · ${auto?'staff cover the rest':`${work.cooling} cooling`} · ${work.ready} ready for an offer · ${work.offersOut}/${work.offerLimit} offers out</small>${decisionListHTML()}${rivalListHTML()}${staffControlsHTML(work)}${auto?'<small>Each week the staff spend what you leave: calls for everyone, ripe offers, a few pitches. They never book visits or in-homes.</small>':''}</div>`;
 }
 // A short line for a prospect card when a rival has made a move he has not been answered on.
 function badgeHTML(id){
  if(!universe?.teams)return'';
  const r=raRecruit(id),t=selected();if(!r||!t||(r.committed&&r.committed!==t.name))return'';
  const m=recruitingActions.liveMoves(r)[0];
  if(m)return`<small class="ra-rival-badge">⚑ ${r.committed?'Committed · ':''}${raEsc(m.team)} ${raEsc(m.verb)}</small>`;
  if(r.committed||!r.targeted||!recruitingActions.funnelOn())return'';
  const f=recruitingActions.funnelState(r);
  return f?.cut?'<small class="ra-rival-badge">✂ Cut you from his list</small>':`<small class="ra-decision-badge">⏱ Decides week ${f?f.decisionWeek:recruitingActions.decisionWeekFor(r)}</small>`;
 }
 globalThis.DynastyRecruitingDesk={html:deskHTML,nav:navHTML,badge:badgeHTML,recruit:raRecruit,team:()=>selected(),bind:root=>{bindDesk(root);bindStaff(root)}};
 // What the funnel did last week: who chose you, who chose someone else, who cut you.
 function funnelLine(last){
  const f=last?.funnel;if(!f)return'';
  const bits=[],name=x=>raEsc(typeof x==='string'?x:x.name);
  if(f.won?.length)bits.push(`${f.won.map(name).join(', ')} committed to you`);
  if(f.lost?.length)bits.push(`${f.lost.map(x=>`${name(x)} chose ${raEsc(x.team)}`).join(', ')}`);
  if(f.cut?.length)bits.push(`${f.cut.map(name).join(', ')} cut you from his list`);
  return bits.length?` Decisions: ${bits.join('; ')}.`:'';
 }
 function stripHTML(t){
  const w=recruitingActions.weekInfo(t),work=recruitingActions.workload(universe.recruits,t),last=t.recruitingLastWeek;
  const lastWeek=last&&last.year===universe.year?`<small>Last week: ${last.spent} of ${last.budget} hours spent${last.cooledCount?` · ${last.cooledCount} target${last.cooledCount===1?'':'s'} cooled (${last.cooled.map(id=>raEsc(raRecruit(id)?.name||'')).filter(Boolean).slice(0,4).join(', ')}${last.cooledCount>4?'…':''})`:' · nobody cooled'}.${funnelLine(last)}</small>`:'';
  return`<div class="recruiting-hours-strip"><strong>Recruiting Hours</strong><span>${work.left} / ${w.budget} left this week</span><small>${work.targets} active target${work.targets===1?'':'s'} · ${work.worked} worked this week · ${work.cooling} cooling · ${work.ready} ready for an offer · ${work.offersOut}/${work.offerLimit} offers out</small><small>Call ${recruitingActions.COSTS.call} · Pitch ${recruitingActions.COSTS.pitch} · Offer ${recruitingActions.COSTS.offer} · Visit ${recruitingActions.COSTS.visit} · In-Home ${recruitingActions.COSTS.inhome} hours. Unused hours do not carry over. A target nobody works for two weeks starts to cool.</small>${lastWeek}${staffControlsHTML(work)}</div>`;
 }
 function staffWorkBoard(){
  const out=recruitingActions.staffPlan(universe.recruits,selected());
  if(out.hours)autosaveAfter('management');
  setStatus(out.hours?`Staff worked the board: ${out.calls} call${out.calls===1?'':'s'}, ${out.pitches} pitch${out.pitches===1?'':'es'}, ${out.offers} offer${out.offers===1?'':'s'} (${hoursText(out.hours)}).`:'The staff had nothing to add this week.');
  renderRecruiting();
 }
 function toggleAuto(on){
  recruitingActions.setAuto(universe,on);
  autosaveAfter('management');
  setStatus(on?'Staff now handle recruiting. Each week they spend any hours you leave unused; you can still act first.':'Recruiting is back in your hands. Targets nobody works will cool.');
  renderRecruiting();
 }
 function bindStaff(root){
  root.querySelectorAll?.('[data-ra-staff]').forEach(b=>{if(b.dataset.raBound)return;b.dataset.raBound='1';b.onclick=e=>{e.preventDefault();staffWorkBoard()}});
  root.querySelectorAll?.('[data-ra-auto]').forEach(b=>{if(b.dataset.raBound)return;b.dataset.raBound='1';b.onchange=()=>toggleAuto(b.checked)});
 }
 // The summary card is hidden, so the strip gets its own host under the mode switch. Workspace mode
 // shows the same numbers in its sidebar, so the strip only appears in Table mode.
 function renderRecruitingHours(){
  if(!universe?.teams)return;
  const t=selected();if(!t||!recruitingActions.isActive()){$('#raStrip')?.remove();return}
  let host=$('#raStrip');
  if(!host){
   const anchor=$('#rwSwitch')||$('#recruiting > .section-head');if(!anchor)return;
   host=document.createElement('div');host.id='raStrip';anchor.after(host);
  }
  host.innerHTML=stripHTML(t);bindStaff(host);
 }
 extendRender('recruiting',renderRecruitingHours);
 const showRecruitProfileBeforeRecruitingActions=showRecruitProfile;
 showRecruitProfile=function(id){
  showRecruitProfileBeforeRecruitingActions(id);
  const body=$('#recruitDialogBody'),r=raRecruit(id);
  if(r&&body&&!body.querySelector?.('.recruiting-desk')){const html=deskHTML(id);if(html){body.insertAdjacentHTML?.('afterbegin',html);bindDesk(body)}}
 };
}
