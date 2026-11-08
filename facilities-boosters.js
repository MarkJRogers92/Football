// Facilities and boosters (v0.16). Facilities used to be a single number that only moved by +1 when the board
// was happy. This makes it something you build: raise money from boosters, decide whether it goes to the
// facilities fund or to this season's NIL budget, and spend the fund on multi-season building projects.
//
//   Booster goodwill (0-100)  moves with wins against expectation and titles, and sets how generous gifts are.
//   Booster fund (units)      banked money. Gifts arrive each offseason and from campaigns you run in a season.
//   Three build tracks        Stadium & Game Day (fan support = home field), Training & Performance (development)
//                             and Football Operations (recruiting hours), five levels each. A project is paid
//                             for out of the fund, then takes one to three seasons to build.
//   The NIL trade-off         a campaign's gift goes to the fund or to NIL, and unspent NIL can be redirected
//                             into the fund. Holding the starter and finishing the stadium are the same money.
//
// Every program has a plan. The controlled program's is yours to run; the others run on a fixed rule at each
// season rollover (see aiSeason), on the same income and costs. Nothing here draws gameplay randomness: campaign results come from a hash of the program, season and campaign
// number, so reloading a save never changes an outcome. A save without a plan behaves as it always did.
function makeFacilitySystem(env){
 'use strict';
 const universe=()=>env.getUniverse(),clamp=env.clamp;
 const TRACKS={
  stadium:{label:'Stadium & Game Day',short:'Stadium',blurb:'Seats, sightlines and a louder crowd.',perLevel:'+2 fan support (a bigger home-field edge), gifts grow'},
  training:{label:'Training & Performance Center',short:'Training',blurb:'Weight room, recovery and sports science.',perLevel:'+1 development at levels 2 and 4'},
  football_ops:{label:'Football Operations Building',short:'Football Ops',blurb:'Film rooms, a recruiting lounge and staff space.',perLevel:'+2 recruiting hours a week'}
 };
 const TRACK_IDS=Object.keys(TRACKS);
 const MAX_LEVEL=5,LEVEL_COST=[4,7,11,16,22],BUILD_SEASONS=[1,1,2,2,3];
 const FACILITY_POINTS=2,UPKEEP_PER_LEVEL=.9,FUND_CAP=40,MAX_PROJECTS=2,CAMPAIGNS_PER_SEASON=3,LOG_LIMIT=14;
 const STADIUM_FAN=2,TRAINING_DEV_LEVELS=[2,4],OPS_HOURS=2;
 const CAMPAIGNS={
  dinner:{label:'Booster Dinner',blurb:'A steady evening with the people who write the checks.'},
  ask:{label:'Major Gift Ask',blurb:'A big request. It lands with a happy donor base and costs goodwill when it does not.'}
 };
 const DESTINATIONS={facilities:'the facilities fund',nil:'this season’s NIL budget'};

 // FNV-1a over the parts: a stable roll that never touches the gameplay random stream.
 function hash(...parts){let h=2166136261;for(const ch of parts.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 const int=(v,fallback=0)=>Number.isFinite(Number(v))?Math.round(Number(v)):fallback;

 function startingGoodwill(t){return clamp(Math.round(34+(t?.fan_support??60)*.3+((t?.prestige??60)-60)*.22),20,85)}
 function state(t,create=true){
  if(!t)return null;
  if(!t.facilityPlan&&!create)return null;
  const p=t.facilityPlan??={version:1};
  p.fund=clamp(int(p.fund,2),0,FUND_CAP);
  p.goodwill=clamp(int(p.goodwill,startingGoodwill(t)),0,100);
  p.levels={...(p.levels||{})};for(const id of TRACK_IDS)p.levels[id]=clamp(int(p.levels[id],0),0,MAX_LEVEL);
  p.projects=Array.isArray(p.projects)?p.projects.filter(x=>x&&TRACKS[x.track]):[];
  p.campaigns=p.campaigns&&typeof p.campaigns==='object'?p.campaigns:{year:null,used:0};
  p.log=Array.isArray(p.log)?p.log.slice(-LOG_LIMIT):[];
  p.nextId=int(p.nextId,1);
  return p;
 }
 const level=(t,track)=>state(t,false)?.levels?.[track]??0;
 const fundOf=t=>state(t,false)?.fund??2;
 const goodwillOf=t=>state(t,false)?.goodwill??startingGoodwill(t);
 const totalLevels=t=>TRACK_IDS.reduce((n,id)=>n+level(t,id),0);
 const goodwillLabel=g=>g>=80?'Devoted':g>=62?'Supportive':g>=45?'Steady':g>=28?'Restless':'Angry';
 function campaignsUsed(t){const p=state(t,false),y=universe().year;return p&&p.campaigns.year===y?p.campaigns.used:0}
 function campaignsLeft(t){return Math.max(0,CAMPAIGNS_PER_SEASON-campaignsUsed(t))}

 function note(t,text){const p=state(t),u=universe();p.log.push({year:u.year,week:u.week,text});if(p.log.length>LOG_LIMIT)p.log.splice(0,p.log.length-LOG_LIMIT)}
 function event(t,type,summary,importance=48,metadata={}){
  const u=universe(),order=u.nextEventId++;u.events??=[];
  u.events.push({id:`EVT_${order}`,season:u.year,week:u.week,timestampOrder:order,type,importance,schoolIds:[t.id],playerIds:[],coachIds:[],recruitIds:[],gameIds:[],summary,metadata});
 }

 // What the boosters give each offseason: a base, more from a happy base, a bigger stadium and a loud crowd.
 function annualIncome(t){
  const p=state(t,false),g=p?p.goodwill:startingGoodwill(t),stadium=level(t,'stadium');
  return clamp(Math.round(1.5+g/28+stadium*.6+((t?.fan_support??60)-60)/25+(t?.resources??60)/60),2,10);
 }
 // Buildings cost money to keep up. Upkeep comes out of each offseason's gifts, so a program with big gifts can keep a
 // lot of buildings and a poor one cannot; without it every program could afford every level.
 function upkeep(t){return Math.floor(totalLevels(t)*UPKEEP_PER_LEVEL)}
 function netIncome(t){return Math.max(0,annualIncome(t)-upkeep(t))}
 // A rating near the top has less room to improve.
 function facilityGain(rating){return(rating??60)>=90?1:FACILITY_POINTS}
 function nextCost(t,track){const l=level(t,track);return l>=MAX_LEVEL?null:LEVEL_COST[l]}
 function activeProjects(t){return state(t,false)?.projects||[]}
 function projectFor(t,track){return activeProjects(t).find(x=>x.track===track)||null}
 function status(project){
  if(project.paid<project.cost)return'funding';
  return'building';
 }
 // Seasons until a fully funded project opens, counting the season it was paid in.
 function opensIn(project){return project.completeYear==null?null:Math.max(0,project.completeYear-universe().year)}

 function startProject(t,track){
  if(!TRACKS[track])return{ok:false,reason:'Unknown project.'};
  const p=state(t),l=level(t,track);
  if(l>=MAX_LEVEL)return{ok:false,reason:`${TRACKS[track].label} is already as good as it gets.`};
  if(projectFor(t,track))return{ok:false,reason:`${TRACKS[track].label} already has a project underway.`};
  if(p.projects.length>=MAX_PROJECTS)return{ok:false,reason:`Only ${MAX_PROJECTS} projects can be underway at once.`};
  const project={id:`FP${p.nextId++}`,track,level:l+1,cost:LEVEL_COST[l],paid:0,startedYear:universe().year,fundedYear:null,completeYear:null};
  p.projects.push(project);
  note(t,`Broke ground on ${TRACKS[track].label}, level ${project.level} (${project.cost} units).`);
  return{ok:true,project};
 }
 function fundProject(t,id,units){
  const p=state(t),project=p.projects.find(x=>x.id===id);
  if(!project)return{ok:false,reason:'That project is no longer underway.'};
  if(project.paid>=project.cost)return{ok:false,reason:'This project is already fully funded.'};
  const want=Math.max(0,int(units===undefined?project.cost-project.paid:units));
  if(!want)return{ok:false,reason:'Nothing to put in.'};
  const amount=Math.min(want,project.cost-project.paid,p.fund);
  if(amount<=0)return{ok:false,reason:'The booster fund is empty.'};
  p.fund-=amount;project.paid+=amount;
  let funded=false;
  if(project.paid>=project.cost){
   funded=true;project.fundedYear=universe().year;project.completeYear=project.fundedYear+BUILD_SEASONS[project.level-1];
   note(t,`Fully funded ${TRACKS[project.track].label}, level ${project.level}. It opens in ${BUILD_SEASONS[project.level-1]} season${BUILD_SEASONS[project.level-1]===1?'':'s'}.`);
  }
  return{ok:true,amount,funded,project};
 }
 // Reversible until it is fully funded: a misallocated pledge comes back, a signed contractor does not.
 function cancelProject(t,id){
  const p=state(t),i=p.projects.findIndex(x=>x.id===id);
  if(i<0)return{ok:false,reason:'That project is no longer underway.'};
  const project=p.projects[i];
  if(project.paid>=project.cost)return{ok:false,reason:'Construction has been contracted; it cannot be stopped.'};
  p.fund=clamp(p.fund+project.paid,0,FUND_CAP);p.projects.splice(i,1);
  note(t,`Shelved ${TRACKS[project.track].label}, level ${project.level}; ${project.paid} units returned.`);
  return{ok:true,refund:project.paid};
 }

 // Gifts. A dinner is steady; an ask is large when the base is happy and costs goodwill when it is not.
 function campaign(t,kind,destination='facilities'){
  if(!CAMPAIGNS[kind])return{ok:false,reason:'Unknown campaign.'};
  if(!DESTINATIONS[destination])return{ok:false,reason:'Unknown destination.'};
  const p=state(t),u=universe();
  if(campaignsLeft(t)<=0)return{ok:false,reason:`You have run all ${CAMPAIGNS_PER_SEASON} campaigns for ${u.year}.`};
  if(destination==='nil'&&env.nilAvailable&&!env.nilAvailable(t))return{ok:false,reason:'NIL is not available to this program.'};
  const used=campaignsUsed(t),roll=hash(t.id,u.year,used,kind)%100,g=p.goodwill;
  let units=0,success=true,goodwillDelta=0;
  if(kind==='dinner'){units=clamp(Math.round(1+g/40),1,3);goodwillDelta=1}
  else{
   const chance=clamp(Math.round(g*.85-10),15,90);
   success=roll<chance;units=success?clamp(3+Math.round(g/25),4,7):0;goodwillDelta=success?0:-4;
  }
  p.campaigns={year:u.year,used:used+1};
  p.goodwill=clamp(p.goodwill+goodwillDelta,0,100);
  if(units>0)deposit(t,units,destination);
  const label=CAMPAIGNS[kind].label;
  const text=units>0?`${label} raised ${units} unit${units===1?'':'s'} for ${DESTINATIONS[destination]}.`:`${label} fell flat. The boosters felt pressed and goodwill slipped.`;
  note(t,text);
  event(t,'BOOSTER_CAMPAIGN',`${t.name} ${text.replace(/^[A-Z]/,c=>c.toLowerCase())}`,units>=5?56:44,{kind,destination,units,success});
  return{ok:true,kind,label,units,success,destination,text,left:campaignsLeft(t)};
 }
 function deposit(t,units,destination){
  const p=state(t);
  if(destination==='nil'){
   const y=universe().year;
   p.nilBonus={year:y,amount:(p.nilBonus&&p.nilBonus.year===y?p.nilBonus.amount:0)+units};
  }else p.fund=clamp(p.fund+units,0,FUND_CAP);
 }
 // The NIL budget gets whatever the boosters sent it this season. It is read by nilBudgetFor.
 function nilBonus(t){const p=state(t,false),y=universe().year;return p&&p.nilBonus&&p.nilBonus.year===y?p.nilBonus.amount:0}
 // Money already earmarked for NIL deals can be moved into the fund. It is gone from NIL for the season.
 function divertNil(t,units=1){
  const n=Math.max(0,int(units));if(!n)return{ok:false,reason:'Nothing to move.'};
  if(!env.nilRemaining)return{ok:false,reason:'NIL is not available.'};
  const left=env.nilRemaining(t);
  if(left<n)return{ok:false,reason:`Only ${left} NIL unit${left===1?'':'s'} left this season.`};
  const p=state(t);
  if(p.fund>=FUND_CAP)return{ok:false,reason:'The facilities fund is full.'};
  const moved=Math.min(n,FUND_CAP-p.fund);
  t.nilSpent=(t.nilSpent||0)+moved;p.fund+=moved;
  note(t,`Redirected ${moved} NIL unit${moved===1?'':'s'} into the facilities fund.`);
  event(t,'FACILITY_DIVERSION',`${t.name} moved ${moved} NIL unit${moved===1?'':'s'} into facilities.`,42,{units:moved});
  return{ok:true,moved,nilLeft:env.nilRemaining(t)};
 }

 function complete(t,project,quiet=false){
  const p=state(t),track=TRACKS[project.track];
  p.levels[project.track]=Math.max(p.levels[project.track],project.level);
  t.facilities=clamp((t.facilities||60)+facilityGain(t.facilities),0,99);
  if(project.track==='stadium')t.fan_support=clamp((t.fan_support||60)+STADIUM_FAN,0,99);
  if(project.track==='training'&&TRAINING_DEV_LEVELS.includes(project.level))t.development=clamp((t.development||60)+1,0,99);
  p.goodwill=clamp(p.goodwill+3,0,100);
  p.completed=[...(p.completed||[]).filter(x=>x.year===universe().year),{year:universe().year,track:project.track,level:project.level}];
  if(quiet)return;
  note(t,`${track.label} level ${project.level} opened.`);
  event(t,'FACILITY_OPENED',`${t.name} opened ${track.label}, level ${project.level}.`,project.level>=4?62:52,{track:project.track,level:project.level});
 }
 // How the boosters felt about the season that just ended.
 function goodwillShift(t,{wins,expected,champion,confChampion,bowlWin}){
  const delta=(wins-expected)*2.5+(champion?12:0)+(confChampion?4:0)+(bowlWin?2:0)-(wins<expected-2?4:0);
  return Math.round(delta);
 }
 // Shared by every program: judge the season just played, open what has finished building, bank the gifts.
 function advance(t,last,quiet){
  const p=state(t),u=universe(),report={year:u.year,income:0,opened:[],goodwill:{before:p.goodwill,after:p.goodwill}};
  const before=p.goodwill,delta=goodwillShift(t,{wins:last.wins??0,expected:last.expected??6,champion:!!last.champion,confChampion:!!last.confChampion,bowlWin:!!last.bowlWin});
  p.goodwill=clamp(Math.round(before*.9+55*.1+delta),5,100);
  const done=p.projects.filter(x=>x.completeYear!=null&&u.year>=x.completeYear);
  for(const project of done){complete(t,project,quiet);report.opened.push({track:project.track,level:project.level})}
  p.projects=p.projects.filter(x=>!done.includes(x));
  report.goodwill={before,after:p.goodwill};
  const gross=annualIncome(t),keep=upkeep(t),income=Math.max(0,gross-keep);
  p.fund=clamp(p.fund+income,0,FUND_CAP);report.income=income;report.upkeep=Math.min(gross,keep);
  p.campaigns={year:u.year,used:0};
  if(!quiet){
   note(t,`Booster gifts for ${u.year}: ${gross} units${keep?`, ${Math.min(gross,keep)} to upkeep`:''}. Goodwill ${before} → ${p.goodwill}.`);
   event(t,'BOOSTER_GIFTS',`${t.name} boosters gave ${gross} units for ${u.year}${keep?` (${Math.min(gross,keep)} went to upkeep)`:''}; goodwill is ${goodwillLabel(p.goodwill).toLowerCase()}.`,40,{income,gross,upkeep:keep,goodwill:p.goodwill});
  }
  return report;
 }
 // Called once as a new season begins, for the controlled program. `last` describes the season just played.
 function newSeason(t,last={}){
  if(!t)return null;
  return advance(t,last,false);
 }
 // The other programs. They have the same gifts and the same prices, and spend by a fixed rule: finish what is
 // underway, then break ground on the weakest track (ties go to a stable hash of the program and the year), one
 // project at a time. No campaigns, no NIL trade, and nothing is written to the news.
 function aiSeason(t,last={}){
  if(!t)return null;
  const report=advance(t,last,true),p=state(t);
  for(const project of p.projects){
   if(project.paid>=project.cost)continue;
   const put=Math.min(project.cost-project.paid,p.fund);
   if(put<=0)break;
   p.fund-=put;project.paid+=put;
   if(project.paid>=project.cost){project.fundedYear=universe().year;project.completeYear=project.fundedYear+BUILD_SEASONS[project.level-1]}
  }
  if(!p.projects.length){
   const open=TRACK_IDS.filter(id=>level(t,id)<MAX_LEVEL);
   if(open.length){
    const low=Math.min(...open.map(id=>level(t,id))),ties=open.filter(id=>level(t,id)===low);
    const track=ties[hash(t.id,universe().year,'track')%ties.length];
    const started=startProject(t,track);
    if(started.ok){
     // startProject is the player's action and writes to the log; keep the other programs' plans small.
     p.log.length=0;
     const project=started.project,put=Math.min(project.cost,p.fund);
     p.fund-=put;project.paid+=put;
     if(project.paid>=project.cost){project.fundedYear=universe().year;project.completeYear=project.fundedYear+BUILD_SEASONS[project.level-1]}
    }
   }
  }
  return report;
 }

 // Effects the rest of the game reads.
 function hoursBonus(t){return level(t,'football_ops')*OPS_HOURS}
 function effectsText(t){
  const s=level(t,'stadium'),tr=level(t,'training'),o=level(t,'football_ops'),out=[];
  if(s)out.push(`Stadium level ${s}: +${s*STADIUM_FAN} fan support, bigger gifts`);
  if(tr)out.push(`Training level ${tr}: +${TRAINING_DEV_LEVELS.filter(x=>x<=tr).length} development`);
  if(o)out.push(`Football Ops level ${o}: +${o*OPS_HOURS} recruiting hours a week`);
  return out;
 }
 function trackRows(t){
  return TRACK_IDS.map(id=>{
   const project=projectFor(t,id),l=level(t,id);
   return{id,...TRACKS[id],level:l,max:MAX_LEVEL,nextCost:nextCost(t,id),buildSeasons:l<MAX_LEVEL?BUILD_SEASONS[l]:null,
    project:project?{...project,status:status(project),opensIn:opensIn(project)}:null};
  });
 }
 function summary(t){
  const p=state(t,false);
  return{fund:p?p.fund:2,goodwill:goodwillOf(t),goodwillLabel:goodwillLabel(goodwillOf(t)),income:netIncome(t),gross:annualIncome(t),upkeep:upkeep(t),campaignsLeft:campaignsLeft(t),
   totalLevels:totalLevels(t),projects:activeProjects(t).length,facilities:t?.facilities??null,nilBonus:nilBonus(t),log:p?p.log.slice(-6):[]};
 }
 // Items for the weekly hub: a building that opened, and money sitting unused in the offseason.
 function newsItems(t){
  const p=state(t,false),u=universe();if(!p)return[];
  const out=[];
  for(const c of (p.completed||[]).filter(x=>x.year===u.year)){
   out.push({type:'good-news',tab:'program',kicker:'FACILITIES',importance:58,main:`${TRACKS[c.track].label} level ${c.level} is open`,sub:effectsText(t)[0]||'Boosters are pleased.'});
  }
  const cheapest=TRACK_IDS.map(id=>projectFor(t,id)?null:nextCost(t,id)).filter(x=>x!=null).sort((a,b)=>a-b)[0];
  if((u.phase==='preseason'||u.phase==='complete')&&cheapest!=null&&p.fund>=cheapest&&p.projects.length<MAX_PROJECTS&&!(p.noticedYear===u.year)){
   p.noticedYear=u.year;
   out.push({type:'alert',tab:'program',kicker:'BOOSTERS',importance:46,main:`${p.fund} units are banked in the facilities fund`,sub:'Start a building project on your Program page, or send the money to NIL.'});
  }
  if(p.goodwill<=28&&(u.phase==='preseason')&&!(p.angryYear===u.year)){
   p.angryYear=u.year;
   out.push({type:'bad-news',tab:'program',kicker:'BOOSTERS',importance:54,main:'Boosters are restless',sub:'Goodwill is low, so gifts will be small and a big ask is likely to fail. Winning is the fix.'});
  }
  return out;
 }

 return{TRACKS,TRACK_IDS,CAMPAIGNS,DESTINATIONS,MAX_LEVEL,LEVEL_COST,BUILD_SEASONS,FACILITY_POINTS,FUND_CAP,MAX_PROJECTS,CAMPAIGNS_PER_SEASON,
  state,level,fundOf,goodwillOf,goodwillLabel,totalLevels,annualIncome,upkeep,netIncome,facilityGain,UPKEEP_PER_LEVEL,nextCost,activeProjects,projectFor,status,opensIn,startProject,fundProject,cancelProject,
  aiSeason,campaign,campaignsLeft,campaignsUsed,nilBonus,divertNil,newSeason,goodwillShift,hoursBonus,effectsText,trackRows,summary,newsItems};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeFacilitySystem};
}else{
 const facilities=makeFacilitySystem({getUniverse:()=>universe,clamp,nilRemaining:t=>nilRemaining(t),nilAvailable:t=>nilBudgetFor(t)>0});
 globalThis.DynastyFacilities=facilities;
 const fbEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const isMine=t=>t&&t.name===$('#userTeam')?.value;

 // NIL and facilities are the same pool of booster money: a campaign sent to NIL raises this season's budget.
 const nilBudgetBeforeFacilities=nilBudgetFor;
 nilBudgetFor=function nilBudgetForWithBoosters(t){return nilBudgetBeforeFacilities(t)+(t&&isMine(t)?facilities.nilBonus(t):0)};

 // A new season: judge the one just played, open what was finished, and bank the gifts. Every program does this;
 // yours is the only one with the news and the choices.
 const resetNilSeasonBeforeFacilities=resetNilSeason;
 resetNilSeason=function resetNilSeasonWithFacilities(){
  const me=selected(),champs=conferenceChampionIdsFor(),seasonYear=universe.year-1;
  // The calendar has already moved to the new year; the record on each team is still last season's.
  const lastOf=t=>({wins:t.w||0,expected:seasonExpectation(t),champion:!!t.champ,confChampion:champs.includes(t.id),bowlWin:t.bowlResult?.won===true&&t.bowlResult?.year===seasonYear});
  const out=resetNilSeasonBeforeFacilities.apply(this,arguments);
  for(const t of universe.teams||[]){
   if(me&&t===me)facilities.newSeason(t,lastOf(t));
   else if(!globalThis.__FACILITIES_AI_OFF)facilities.aiSeason(t,lastOf(t));   // the switch is for soak comparisons
  }
  return out;
 };

 const CTL=(label,attrs,{disabled=false,title='',cls=''}={})=>`<button type="button" class="fb-button ${cls}" ${attrs} ${disabled?'disabled':''} title="${fbEsc(title)}">${label}</button>`;
 function trackHTML(t,row){
  const pips=Array.from({length:row.max},(_,i)=>`<i class="fb-pip${i<row.level?' is-on':''}" aria-hidden="true"></i>`).join('');
  const p=row.project;let action='';
  if(p){
   const pct=Math.round(100*p.paid/p.cost);
   if(p.status==='funding'){
    const fund=facilities.fundOf(t);
    action=`<div class="fb-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${p.cost}" aria-valuenow="${p.paid}"><i style="width:${pct}%"></i></div><div class="small muted">Level ${p.level} · ${p.paid} of ${p.cost} units paid</div><div class="fb-actions">${CTL('Put in 1',`data-fb-fund="${p.id}" data-fb-units="1"`,{disabled:fund<1})}${CTL(`Fund the rest · ${p.cost-p.paid}`,`data-fb-fund="${p.id}"`,{disabled:fund<1,title:fund<p.cost-p.paid?`Puts in all ${fund} available`:''})}${CTL('Shelve',`data-fb-cancel="${p.id}"`,{cls:'fb-quiet',title:'Gets back everything paid so far'})}</div>`;
   }else{
    const left=p.opensIn;
    action=`<div class="fb-progress is-built" role="progressbar" aria-valuemin="0" aria-valuemax="${p.cost}" aria-valuenow="${p.cost}"><i style="width:100%"></i></div><div class="small">Under construction · level ${p.level} opens ${left>0?`in ${left} season${left===1?'':'s'} (${p.completeYear})`:'this offseason'}</div>`;
   }
  }else if(row.nextCost!=null){
   const l=row.level+1,fits=facilities.activeProjects(t).length<facilities.MAX_PROJECTS;
   action=`<div class="small muted">Level ${l} costs ${row.nextCost} units and takes ${row.buildSeasons} season${row.buildSeasons===1?'':'s'} to build.</div><div class="fb-actions">${CTL(`Start level ${l}`,`data-fb-start="${row.id}"`,{disabled:!fits,title:fits?'':`Only ${facilities.MAX_PROJECTS} projects at a time`})}</div>`;
  }else action='<div class="small muted">Finished. This is as good as it gets.</div>';
  return`<div class="fb-track" data-fb-track="${row.id}"><div class="fb-track-head"><strong>${fbEsc(row.label)}</strong><span class="fb-pips" aria-label="Level ${row.level} of ${row.max}">${pips}</span></div><div class="small muted">${fbEsc(row.blurb)} Each level: ${fbEsc(row.perLevel)}.</div>${action}</div>`;
 }
 function cardHTML(t){
  const s=facilities.summary(t),rows=facilities.trackRows(t),nilLeft=nilRemaining(t),nilTotal=nilBudgetFor(t),left=s.campaignsLeft;
  const effects=facilities.effectsText(t);
  const camp=(kind,dest)=>CTL(`${facilities.CAMPAIGNS[kind].label} → ${dest==='nil'?'NIL':'Facilities'}`,`data-fb-campaign="${kind}" data-fb-dest="${dest}"`,{disabled:left<=0,title:facilities.CAMPAIGNS[kind].blurb});
  const log=s.log.length?`<details class="fb-log"><summary>Recent activity</summary><ul>${s.log.slice().reverse().map(x=>`<li><span class="muted">${x.year}</span> ${fbEsc(x.text)}</li>`).join('')}</ul></details>`:'';
  return`<div class="section-head"><div><div class="eyebrow">FACILITIES &amp; BOOSTERS</div><h3>Build the program</h3><div class="muted">Boosters give money. You decide whether it becomes buildings or NIL.</div></div></div>
  <div class="fb-summary"><div><span class="small muted">Facilities rating</span><strong>${s.facilities??'—'}</strong></div><div><span class="small muted">Booster fund</span><strong>${s.fund}<small> units</small></strong></div><div><span class="small muted">Goodwill</span><strong>${s.goodwill}<small> ${fbEsc(s.goodwillLabel)}</small></strong></div><div><span class="small muted">Gifts next offseason</span><strong>+${s.income}<small>${s.upkeep?` (${s.gross} − ${Math.min(s.gross,s.upkeep)} upkeep)`:''}</small></strong></div><div><span class="small muted">NIL this season</span><strong>${nilLeft}<small> of ${nilTotal}</small></strong></div></div>
  ${effects.length?`<div class="small fb-effects">${effects.map(fbEsc).join(' · ')}</div>`:''}
  <div class="fb-tracks">${rows.map(r=>trackHTML(t,r)).join('')}</div>
  <div class="fb-money"><div><strong>Raise money</strong><div class="small muted">${left} of ${facilities.CAMPAIGNS_PER_SEASON} campaigns left in ${universe.year}. Choose where the gift goes before you ask.</div></div><div class="fb-actions">${camp('dinner','facilities')}${camp('dinner','nil')}${camp('ask','facilities')}${camp('ask','nil')}</div></div>
  <div class="fb-money"><div><strong>Redirect NIL</strong><div class="small muted">Move unspent NIL into the fund. It cannot be moved back this season.</div></div><div class="fb-actions">${CTL('Move 1 NIL to facilities','data-fb-divert="1"',{disabled:nilLeft<1})}${CTL('Move 3','data-fb-divert="3"',{disabled:nilLeft<3})}</div></div>${log}`;
 }
 function bind(root,t){
  const done=(r,msg)=>{setStatus(r.ok?msg(r):r.reason);if(r.ok)autosaveAfter('management');render()};
  root.querySelectorAll('[data-fb-start]').forEach(b=>b.onclick=()=>done(facilities.startProject(t,b.dataset.fbStart),r=>`Broke ground on ${facilities.TRACKS[r.project.track].label}, level ${r.project.level}.`));
  root.querySelectorAll('[data-fb-fund]').forEach(b=>b.onclick=()=>done(facilities.fundProject(t,b.dataset.fbFund,b.dataset.fbUnits?Number(b.dataset.fbUnits):undefined),r=>r.funded?`Fully funded. ${facilities.TRACKS[r.project.track].label} will open in ${facilities.BUILD_SEASONS[r.project.level-1]} season${facilities.BUILD_SEASONS[r.project.level-1]===1?'':'s'}.`:`Put ${r.amount} unit${r.amount===1?'':'s'} into ${facilities.TRACKS[r.project.track].label}.`));
  root.querySelectorAll('[data-fb-cancel]').forEach(b=>b.onclick=()=>done(facilities.cancelProject(t,b.dataset.fbCancel),r=>`Shelved the project; ${r.refund} unit${r.refund===1?'':'s'} back in the fund.`));
  root.querySelectorAll('[data-fb-campaign]').forEach(b=>b.onclick=()=>done(facilities.campaign(t,b.dataset.fbCampaign,b.dataset.fbDest),r=>r.text));
  root.querySelectorAll('[data-fb-divert]').forEach(b=>b.onclick=()=>done(facilities.divertNil(t,Number(b.dataset.fbDivert)),r=>`Moved ${r.moved} NIL unit${r.moved===1?'':'s'} into the facilities fund.`));
 }
 function renderFacilities(){
  const host=$('#facilitiesBoosters'),t=selected();
  if(!host||!universe||!t)return;
  facilities.state(t);
  host.innerHTML=cardHTML(t);bind(host,t);
 }
 const renderProgramBeforeFacilities=TAB_RENDERERS.program;
 TAB_RENDERERS.program=()=>{renderProgramBeforeFacilities();renderFacilities()};
 globalThis.DynastyFacilityNews=t=>t&&isMine(t)?facilities.newsItems(t):[];
}
