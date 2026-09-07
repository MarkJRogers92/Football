(() => {
'use strict';
let signature='';
const add=(parent,tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=String(text);parent.appendChild(el);return el};
function render(){
 const model=globalThis.DynastyLabWorldHistoryPresentation?.snapshot?.();
 const section=document.querySelector('#history');
 if(!section||!model)return;
 const next=JSON.stringify([model.teamId,model.tracked,model.titleYears,model.awardRows,model.seasons]);
 if(next===signature)return;
 signature=next;
 let host=document.querySelector('#dynastyMuseum');
 if(!host){host=document.createElement('section');host.id='dynastyMuseum';host.className='dynasty-museum';section.querySelector(':scope > .section-head')?.insertAdjacentElement('afterend',host)}
 host.replaceChildren();
 const hero=add(host,'div','legacy-hero');
 const identity=add(hero,'div','legacy-identity');
 add(identity,'span','legacy-kicker','PROGRAM LEGACY');
 add(identity,'h3','legacy-name',model.teamName);
 add(identity,'small','legacy-meta',model.conference+' · tracked dynasty history');
 const total=model.tracked.wins+model.tracked.losses,pct=total?Math.round(model.tracked.wins/total*1000)/10:'—';
 const record=add(hero,'div','legacy-record');
 add(record,'strong','',model.tracked.wins+'–'+model.tracked.losses);
 add(record,'span','',pct+'% tracked win rate · '+model.tracked.seasons+' seasons');
 const metrics=add(host,'div','legacy-metrics');
 for(const [label,value] of [['CONFERENCE TITLES',model.tracked.conferenceTitles],['NATIONAL TITLES',model.tracked.nationalTitles],['RECENT ARCHIVES',model.seasons.length]]){const box=add(metrics,'div');add(box,'span','',label);add(box,'strong','',value)}
 const grid=add(host,'div','legacy-grid');
 const trophy=add(grid,'section','legacy-panel');add(trophy,'span','legacy-kicker','TROPHY ROOM');add(trophy,'h4','','Championships');
 const chips=add(trophy,'div','legacy-chips');
 if(model.titleYears.length)for(const year of model.titleYears)add(chips,'span','legacy-chip',year+' NATIONAL TITLE');else add(chips,'div','legacy-empty','No archived national title yet.');
 add(trophy,'span','legacy-kicker legacy-awards-kicker','PROGRAM HONORS');add(trophy,'h4','','Recent major awards');
 const awards=add(trophy,'div','legacy-awards');
 if(model.awardRows.length)for(const row of model.awardRows){const item=add(awards,'div','legacy-award');add(item,'span','',row.year+' · '+row.name);add(item,'strong','',row.playerName+(row.pos?' · '+row.pos:''))}else add(awards,'div','legacy-empty','Major award history will collect here as seasons are archived.');
 const timeline=add(grid,'section','legacy-panel');add(timeline,'span','legacy-kicker','DYNASTY TIMELINE');add(timeline,'h4','','Recent archived seasons');
 const seasons=add(timeline,'div','legacy-seasons');
 if(model.seasons.length)for(const row of model.seasons){const item=add(seasons,'article','legacy-season'+(row.champion?' is-title':''));add(item,'strong','',row.year+' · '+row.record);add(item,'span','',row.conferenceRecord+' conf · '+(row.rank?'#'+row.rank+' final':'NR'));add(item,'small','',row.champion?'National champion':row.awards.length?row.awards[0].name+' · '+row.awards[0].playerName:'Season archived')}else add(seasons,'div','legacy-empty','Complete a season to begin the program timeline.');
 const brand=globalThis.DynastyProgramBranding?.brandFor?.(+model.teamId);
 if(brand){hero.style.setProperty('--legacy-primary-rgb',brand.primaryRgb);hero.style.setProperty('--legacy-secondary-rgb',brand.secondaryRgb);hero.style.setProperty('--legacy-secondary',brand.secondary)}
}
const queue=()=>setTimeout(render,0);
document.addEventListener('click',event=>{if(event.target.closest?.('[data-tab="history"],[data-client-tab="history"]'))queue()});
document.querySelector('#userTeam')?.addEventListener('change',()=>{signature='';queue()});
queue();
})();
