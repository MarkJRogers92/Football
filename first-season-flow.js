(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DynastyFirstSeasonFlow=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const MODES=new Set(['explicit','concise','normal']);
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const text=value=>value==null?'':String(value).trim();
const cloneItem=item=>item&&typeof item==='object'?{...item}:item;

function guidanceMode({seasonIndex=0,week=0}={}){
  if(finite(seasonIndex)!==0)return 'normal';
  const currentWeek=Math.max(0,finite(week));
  if(currentWeek<=1)return 'explicit';
  if(currentWeek<=3)return 'concise';
  return 'normal';
}

function classifyAgenda(items=[],mode='normal'){
  const resolvedMode=MODES.has(mode)?mode:'normal';
  const groups={required:[],recommended:[],optional:[]};
  for(const original of Array.isArray(items)?items:[]){
    const item=cloneItem(original);
    if(!item||typeof item!=='object')continue;
    const meaning=text(item.meaning);
    if(meaning==='must_resolve')groups.required.push(item);
    else if(meaning==='decision_due')groups.recommended.push(item);
    else if(meaning==='staff_recommendation'&&finite(item.priority)<200)groups.optional.push(item);
    else if(meaning==='staff_recommendation')groups.recommended.push(item);
    else groups.optional.push(item);
  }
  return{...groups,mode:resolvedMode};
}

function sideForTeam(record,teamId,teamName){
  if(!record||typeof record!=='object')return null;
  const id=teamId==null?'':String(teamId),name=text(teamName);
  const matches=team=>{
    if(!team||typeof team!=='object')return false;
    if(id&&team.id!=null&&String(team.id)===id)return true;
    return Boolean(name&&text(team.name)===name);
  };
  if(matches(record.home))return 'home';
  if(matches(record.away))return 'away';
  return null;
}

function buildCarryForward({record=null,feedback=null,teamId=null,teamName=''}={}){
  const side=sideForTeam(record,teamId,teamName);
  if(!side)return null;
  const opponentSide=side==='home'?'away':'home';
  const mine=finite(record?.score?.[side]),theirs=finite(record?.score?.[opponentSide]);
  const outcome=mine>theirs?'win':mine<theirs?'loss':'tie';
  const verb=outcome==='win'?'Won':outcome==='loss'?'Lost':'Tied';
  const opponent=text(record?.[opponentSide]?.name)||'opponent';
  return{
    outcome,
    result:`${verb} ${mine}–${theirs} vs ${opponent}`,
    opponent,
    score:{for:mine,against:theirs},
    verdict:text(feedback?.verdict)||null,
    headline:text(feedback?.headline)||null,
    detail:text(feedback?.detail)||null
  };
}

function buildBriefing({mode='normal',week=0,opponent='',carryForward=null,agenda=null,scout=[],texture=[],next=null}={}){
  const resolvedMode=MODES.has(mode)?mode:'normal';
  const bullets=[];
  if(carryForward&&text(carryForward.result)){
    const evidence=text(carryForward.headline);
    bullets.push({kind:'last_game',text:evidence?`${text(carryForward.result)} — ${evidence}`:text(carryForward.result),verdict:text(carryForward.verdict)||null});
  }
  const scoutFacts=Array.isArray(scout)?scout:[];
  const scoutText=text(scoutFacts[0]);
  if(text(opponent)||scoutText){
    bullets.push({kind:'opponent',text:scoutText||`Next: ${text(opponent)}`});
  }
  const required=Array.isArray(agenda?.required)?agenda.required:[];
  if(required.length){
    const firstTitle=text(required[0]?.title)||'Required decision';
    bullets.push({kind:'required',text:required.length===1?firstTitle:`${required.length} required items — first: ${firstTitle}`,count:required.length});
  }
  const textureFacts=Array.isArray(texture)?texture:[];
  if(textureFacts.length){
    const fact=textureFacts[0];
    if(typeof fact==='string')bullets.push({kind:'context',text:text(fact)});
    else if(fact&&text(fact.text))bullets.push({kind:text(fact.kind)||'context',text:text(fact.text)});
  }
  const nextStep=next&&typeof next==='object'?{...next}:next;
  return{
    mode:resolvedMode,
    title:`Week ${Math.max(0,finite(week))+1} briefing`,
    summary:text(opponent)?`Prepare for ${text(opponent)}.`:(bullets[0]?.text||'Review the week ahead.'),
    bullets,
    next:nextStep||null
  };
}

function buildPrepPath({hasGame=false,opponentReviewed=false,requiredCount=0,prepSet=false,personnelPending=false,gamedayReady=false,gameStarted=false}={}){
  if(!hasGame)return{hasGame:false,stages:[],currentKey:null};
  const required=Math.max(0,finite(requiredCount));
  const opponentStatus=opponentReviewed?'done':'current';
  const decisionsStatus=required>0?'current':'done';
  const prepStatus=prepSet?'done':required>0?'blocked':gamedayReady?'optional':'current';
  const personnelStatus=personnelPending?'current':'optional';
  const gamedayStatus=gameStarted?'done':gamedayReady?'current':'blocked';
  const stages=[
    {key:'opponent',label:'Review opponent',status:opponentStatus},
    {key:'decisions',label:'Resolve decisions',status:decisionsStatus},
    {key:'prep',label:'Set weekly prep',status:prepStatus},
    {key:'personnel',label:'Review personnel',status:personnelStatus},
    {key:'gameday',label:'Game Day',status:gamedayStatus}
  ];
  return{hasGame:true,stages,currentKey:stages.find(stage=>stage.status==='current')?.key||null};
}

return{guidanceMode,classifyAgenda,buildCarryForward,buildBriefing,buildPrepPath};
});
