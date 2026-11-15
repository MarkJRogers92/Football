// v0.34 — "You saw him first." When a player the coach signed without much fanfare (three stars or fewer, or a
// staff grade of 73 or lower at signing) goes in the first three rounds of the draft or wins a national award, the
// game says so and quotes the scouting receipt frozen when he signed: his stars, his national rank, and what the staff
// thought of him then. The news goes in The Wire for that week and in the event ledger, so it stays in history.
//
// Nothing new is stored on players. One SCOUTING_VINDICATED event per player per kind (draft, award), at most three a
// draft and two an awards night.
function makeSawHimFirst(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const MAX_STARS=3,MAX_VERDICT=73,MAX_ROUND=3,PER_DRAFT=3,PER_AWARDS=2;
 const WORDS=['zero','one','two','three','four','five'];
 function receiptOf(p){return p?.recruitingMemory?.scoutingReceipt||null}
 // A modest signing: few stars, or the staff did not think much of him.
 function overlooked(rec){if(!rec)return false;const stars=Number(rec.stars);return(Number.isFinite(stars)&&stars<=MAX_STARS)||Number(rec.verdictScore)<=MAX_VERDICT}
 function signingText(rec){
  const stars=Number(rec.stars),rank=Number(rec.nationalRank);
  const who=Number.isFinite(stars)?`a ${WORDS[stars]||stars}-star prospect`:'a prospect';
  const label=String(rec.verdictLabel||'').toLowerCase();
  return`signed in ${rec.season} as ${who}${Number.isFinite(rank)&&rank>0?`, No. ${rank} nationally`:''}, graded ${rec.currentRead}${label?` (${label})`:''} by your staff`;
 }
 function already(kind,playerId){return(universe().events||[]).some(e=>e?.type==='SCOUTING_VINDICATED'&&e.metadata?.kind===kind&&(e.playerIds||[]).includes(playerId))}
 function push(kind,p,t,rec,text,importance){
  const u=universe();u.events??=[];
  const e={id:`EVT_SAW_${kind}_${u.year}_${p.id}`,type:'SCOUTING_VINDICATED',season:u.year,week:u.week,schoolIds:[t.id],playerIds:[p.id],coachIds:[],gameIds:[],importance,summary:text,metadata:{kind,stars:rec.stars??null,verdictScore:rec.verdictScore??null,signed:rec.season}};
  u.events.push(e);return e;
 }
 // Draft night: the coach's overlooked signees taken in the first three rounds.
 function afterDraft(records,t,findPlayer){
  if(!t)return[];const out=[];
  for(const r of(records||[]).filter(r=>String(r.schoolId)===String(t.id)&&r.round&&r.round<=MAX_ROUND).sort((a,b)=>a.round-b.round||a.pick-b.pick)){
   if(out.length>=PER_DRAFT)break;
   const p=findPlayer(r.playerId),rec=receiptOf(p);if(!overlooked(rec)||already('draft',r.playerId)||String(rec.schoolId)!==String(t.id))continue;
   out.push(push('draft',p,t,rec,`You saw him first: ${r.pos} ${r.playerName} ${signingText(rec)}. He went in round ${r.round} of the draft.`,r.round===1?72:66));
  }
  return out;
 }
 // Awards night: the coach's overlooked signees who won a national award.
 function afterAwards(awards,t,findPlayer){
  if(!t)return[];const out=[];
  for(const a of(awards||[]).filter(a=>a?.team===t.name&&a.playerId)){
   if(out.length>=PER_AWARDS)break;
   const p=findPlayer(a.playerId),rec=receiptOf(p);if(!overlooked(rec)||already('award',a.playerId)||String(rec.schoolId)!==String(t.id))continue;
   out.push(push('award',p,t,rec,`You saw him first: ${a.pos} ${a.playerName} ${signingText(rec)}. He is the ${a.name}.`,70));
  }
  return out;
 }
 return{overlooked,signingText,afterDraft,afterAwards};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeSawHimFirst};
}else{
 const sawHimFirst=makeSawHimFirst({getUniverse:()=>universe});
 globalThis.DynastySawHimFirst=sawHimFirst;
 const playerById=id=>{const f=findPlayer(id);return f?.p||null};
 const runDraftBeforeSaw=runDraft;
 runDraft=function runDraftWithReceipts(){
  const out=runDraftBeforeSaw.apply(this,arguments);
  try{sawHimFirst.afterDraft(out,selected(),playerById)}catch(err){console.error(err)}
  return out;
 };
 const honorsBeforeSaw=finalizeSeasonHonors;
 finalizeSeasonHonors=function finalizeSeasonHonorsWithReceipts(){
  const had=!!universe.awards?.[universe.year],out=honorsBeforeSaw.apply(this,arguments);
  try{if(!had)sawHimFirst.afterAwards(out,selected(),playerById)}catch(err){console.error(err)}
  return out;
 };
}
