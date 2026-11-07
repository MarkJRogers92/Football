(() => {
'use strict';
let signature='';
const add=(parent,tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=String(text);parent.appendChild(el);return el};
function person(parent,row){const button=add(parent,'button','player-button legacy-person',row.name+(row.pos?' · '+row.pos:''));button.type='button';button.dataset.player=String(row.id);button.onclick=()=>globalThis.DynastyEncyclopedia?.open({kind:'player',id:row.id});return button}
function program(parent,id,name){const button=add(parent,'button','player-button legacy-program',name);button.type='button';button.dataset.legacyTeam=String(id);button.onclick=()=>globalThis.DynastyEncyclopedia?.open({kind:'team',id,name});return button}
function progression(parent,rows){
 const list=add(parent,'ol','legacy-progression');
 if(!rows.length){add(parent,'small','legacy-empty','No completed school season recorded.');return}
 for(const row of rows)add(list,'li','',row.year+' · '+row.games+' G / '+row.starts+' GS'+(row.rating!=null?' · staff read '+row.rating:''));
}
function personalHistory(host,model,open){
 const memory=add(host,'details','legacy-memory');memory.open=open;
 const summary=add(memory,'summary','legacy-memory-summary');add(summary,'strong','','People, classes & rivalry');add(summary,'span','','Recorded player seasons and recent meetings');
 const grid=add(memory,'div','legacy-memory-grid');
 const classes=add(grid,'section','legacy-memory-section');add(classes,'h4','','Signing classes');
 add(classes,'p','legacy-note','Retained signing receipts, with up to three player files per class. Counts may be partial; development below uses completed seasons at this school.');
 if(model.archives.playersDeferred)add(classes,'p','legacy-note legacy-deferred','Archived careers are not loaded. These signing receipts are partial; the Player Archive below can load a career.');
 if(!model.classes.length)add(classes,'p','legacy-empty','No signing records are available for this program. A roster spot or class year does not establish a signing.');
 for(const row of model.classes){
  const group=add(classes,'article','legacy-class');add(group,'h5','','Class of '+row.year);add(group,'small','legacy-note',row.retained+' retained player record'+(row.retained===1?'':'s')+(row.retained>row.players.length?' · showing '+row.players.length:''));
  for(const p of row.players){const item=add(group,'div','legacy-player-file');person(item,p);add(item,'small','legacy-note',(p.stars!=null?p.stars+'★ at signing':'Stars not recorded')+(p.signingRead!=null?' · staff read '+p.signingRead+' at signing':'')+' · '+(p.status==='active'?(String(p.schoolId)===String(model.teamId)?'On roster':'Now at '+p.schoolName):p.status==='portal'?'Transfer portal':'Archived career'));progression(item,p.seasons)}
 }
 const recurring=add(grid,'section','legacy-memory-section');add(recurring,'h4','','Returning names');add(recurring,'p','legacy-note','Current players with at least two recorded seasons at this school.');
 if(!model.recurringPlayers.length)add(recurring,'p','legacy-empty','Players appear here after two distinct school seasons are recorded.');
 for(const row of model.recurringPlayers){const item=add(recurring,'article','legacy-player-file');person(item,row);progression(item,row.seasons)}
 const rival=add(grid,'section','legacy-memory-section');add(rival,'h4','','Rivalry meetings');
 if(model.rivalry){
  const row=model.rivalry;program(rival,row.teamId,row.teamName);
  add(rival,'p','legacy-note',[row.trophy,row.series?row.series.wins+'–'+row.series.losses+' tracked series':null].filter(Boolean).join(' · '));
  if(model.archives.gamesDeferred)add(rival,'p','legacy-note legacy-deferred','The full game archive is not loaded. Meetings shown here are partial.');
  if(!row.meetings.length)add(rival,'p','legacy-empty','No completed rivalry box scores are available in the loaded records.');
  const list=add(rival,'div','legacy-meetings');
  for(const g of row.meetings){const item=add(list,'article','legacy-meeting');const button=add(item,'button','game-link',g.year+' · '+g.result+' '+g.us+'–'+g.them);button.type='button';button.dataset.game=String(g.id);button.dataset.gameTab='Summary';add(item,'small','legacy-note',(g.week!=null?'Week '+g.week+' · ':'')+g.label+' · '+(g.venue==='neutral'?'Neutral site':g.venue==='away'?'Away':'Home'))}
 }else add(rival,'p','legacy-empty','No rivalry is recorded for this program.');
}
function render(){
 const section=document.querySelector('#history');
 if(!section?.classList.contains('active'))return;
 const model=globalThis.DynastyLabWorldHistoryPresentation?.snapshot?.();
 if(!section||!model)return;
 const next=JSON.stringify(model);
 if(next===signature)return;
 signature=next;
 let host=document.querySelector('#dynastyMuseum');
 if(!host){host=document.createElement('section');host.id='dynastyMuseum';host.className='dynasty-museum';section.querySelector(':scope > .section-head')?.insertAdjacentElement('afterend',host)}
 const wasOpen=host.dataset.teamId===String(model.teamId)&&!!host.querySelector('.legacy-memory')?.open;
 host.dataset.teamId=String(model.teamId);host.replaceChildren();
 const hasHistory=Object.values(model.tracked).some(value=>value>0)||model.seasons.length>0||model.titleYears.length>0||model.awardRows.length>0||model.classes.length>0||model.recurringPlayers.length>0||model.rivalry?.meetings.length>0||(model.rivalry?.series?.wins||0)+(model.rivalry?.series?.losses||0)>0;
 const hero=add(host,'div','legacy-hero');
 const identity=add(hero,'div','legacy-identity');
 add(identity,'span','legacy-kicker','PROGRAM LEGACY');
 program(add(identity,'h3','legacy-name'),model.teamId,model.teamName);
 add(identity,'small','legacy-meta',model.conference+(hasHistory?(model.tracked.seasons?' · tracked dynasty history':model.seasons.length?' · archived seasons available':' · no completed seasons tracked'):''));
 if(hasHistory){
 const total=model.tracked.wins+model.tracked.losses,pct=total?Math.round(model.tracked.wins/total*1000)/10:'—';
 const record=add(hero,'div','legacy-record');
 add(record,'strong','',model.tracked.wins+'–'+model.tracked.losses);
 add(record,'span','',model.tracked.seasons?(total?pct+'% tracked win rate':'Win rate unavailable')+' · '+model.tracked.seasons+(model.tracked.seasons===1?' season':' seasons'):'No completed seasons tracked');
 const metrics=add(host,'div','legacy-metrics');
 for(const [label,value] of [['CONFERENCE TITLES',model.tracked.conferenceTitles],['NATIONAL TITLES',model.tracked.nationalTitles],['RECENT ARCHIVES',model.seasons.length]]){const box=add(metrics,'div');add(box,'span','',label);add(box,'strong','',value)}
 }
 const grid=hasHistory?add(host,'div','legacy-grid'):host;
 if(hasHistory){
 const trophy=add(grid,'section','legacy-panel');add(trophy,'span','legacy-kicker','TROPHY ROOM');add(trophy,'h4','','Championships');
 const chips=add(trophy,'div','legacy-chips');
 if(model.titleYears.length)for(const year of model.titleYears)add(chips,'span','legacy-chip',year+' NATIONAL TITLE');else add(chips,'div','legacy-empty',model.tracked.nationalTitles?'Title years are unavailable in these archives; '+model.tracked.nationalTitles+' national title'+(model.tracked.nationalTitles===1?' is':'s are')+' tracked.':'No national title recorded in these archives.');
 add(trophy,'span','legacy-kicker legacy-awards-kicker','PROGRAM HONORS');add(trophy,'h4','','Recent major awards');
 const awards=add(trophy,'div','legacy-awards');
 if(model.awardRows.length)for(const row of model.awardRows){const item=add(awards,'div','legacy-award');add(item,'span','',row.year+' · '+row.name);if(row.playerId!=null&&row.pos!=='HC')person(item,{id:row.playerId,name:row.playerName,pos:row.pos});else add(item,'strong','',row.playerName+(row.pos?' · '+row.pos:''))}else add(awards,'div','legacy-empty','Recorded major award winners appear here when archived.');
 }
 const timeline=add(grid,'section','legacy-panel');add(timeline,'span','legacy-kicker','DYNASTY TIMELINE');add(timeline,'h4','','Recent archived seasons');
 const seasons=add(timeline,'div','legacy-seasons');
 if(model.seasons.length)for(const row of model.seasons){const item=add(seasons,'article','legacy-season'+(row.champion?' is-title':''));add(item,'strong','',row.year+' · '+row.record);add(item,'span','',row.conferenceRecord+' conf · '+(row.rank?'#'+row.rank+' final':'No top-10 finish recorded'));add(item,'small','',row.champion?'National champion':row.awards.length?row.awards[0].name+' · '+row.awards[0].playerName:'Season archived')}else add(seasons,'div','legacy-empty',hasHistory?'No archived program seasons are available yet.':'No completed seasons tracked. Season records and honors appear here when archived.');
 personalHistory(host,model,wasOpen);
 const brand=globalThis.DynastyProgramBranding?.brandFor?.(+model.teamId);
 if(brand){hero.style.setProperty('--legacy-primary-rgb',brand.primaryRgb);hero.style.setProperty('--legacy-secondary-rgb',brand.secondaryRgb);hero.style.setProperty('--legacy-secondary',brand.secondary)}
}
let pending=false;
const queue=()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;render()},0)};
document.addEventListener('click',event=>{if(event.target.closest?.('[data-tab="history"],[data-client-tab="history"]'))queue()});
document.querySelector('#userTeam')?.addEventListener('change',()=>{signature='';queue()});
if(typeof MutationObserver==='function')for(const id of ['gameHistoryList','archiveResults']){const target=document.getElementById(id);if(target)new MutationObserver(queue).observe(target,{childList:true,subtree:true})}
queue();
})();
