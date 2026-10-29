// Career milestones for the head coach the player controls. Everything is read from the tenure and
// career records the game already keeps; the only stored state is universe.milestones, a map of
// milestone id to the season it was first reached, so the card can say when.
function careerMilestoneStats(){
 const sum={w:0,l:0,titles:0,confTitles:0,winningSeasons:0,perfectSeasons:0,repeatTitles:0,bestWins:0,seasons:0,posts:0};
 const add=d=>{for(const key of ['w','l','titles','confTitles','winningSeasons','perfectSeasons','repeatTitles'])sum[key]+=d[key]||0;sum.bestWins=Math.max(sum.bestWins,d.bestWins||0)};
 for(const post of universe.careerHistory||[])add(post);
 if(universe.tenure&&!universe.tenure.closed)add(tenureDigest(universe.tenure.seasons));
 const totals=careerTotals();
 sum.seasons=totals.seasons;sum.posts=totals.posts;
 const rival=rivalOf(selected());
 sum.rivalWins=selected()?.rivalry?.series?.w||0;sum.rivalName=rival?.name||null;
 return sum;
}
const CAREER_MILESTONES=[
 {id:'first-win',label:'First win',detail:'Win a game as a head coach.',target:1,value:s=>s.w},
 {id:'winning-season',label:'Winning season',detail:'Finish a season over .500.',target:1,value:s=>s.winningSeasons},
 {id:'ten-wins',label:'Ten-win season',detail:'Win ten games in one season.',target:10,value:s=>s.bestWins},
 {id:'rival',label:'Rival slayer',detail:'Beat your primary rival.',target:1,value:s=>s.rivalWins},
 {id:'conf-title',label:'Conference champions',detail:'Win a conference title.',target:1,value:s=>s.confTitles},
 {id:'national-title',label:'National champions',detail:'Win the national title.',target:1,value:s=>s.titles},
 {id:'perfect',label:'Perfect season',detail:'Go undefeated in the regular season.',target:1,value:s=>s.perfectSeasons},
 {id:'repeat',label:'Back-to-back',detail:'Win national titles in consecutive seasons.',target:1,value:s=>s.repeatTitles},
 {id:'wins-50',label:'50 career wins',detail:'Reach 50 wins.',target:50,value:s=>s.w},
 {id:'wins-100',label:'100 career wins',detail:'Reach 100 wins.',target:100,value:s=>s.w},
 {id:'wins-250',label:'250 career wins',detail:'Reach 250 wins.',target:250,value:s=>s.w},
 {id:'seasons-10',label:'Decade on the sideline',detail:'Coach ten seasons.',target:10,value:s=>s.seasons},
 {id:'three-posts',label:'Well travelled',detail:'Hold three head coaching posts.',target:3,value:s=>s.posts}
];
function careerMilestoneStatus(stats=careerMilestoneStats()){
 return CAREER_MILESTONES.map(m=>{
  const value=m.value(stats),done=value>=m.target;
  return {id:m.id,label:m.label,detail:m.detail,target:m.target,value:Math.min(value,m.target),done,year:universe.milestones?.[m.id]??null};
 });
}
// Called when a season is reviewed. Returns the ids reached for the first time.
function updateCareerMilestones(){
 universe.milestones??={};
 const fresh=[];
 for(const m of careerMilestoneStatus())if(m.done&&universe.milestones[m.id]===undefined){universe.milestones[m.id]=universe.year;fresh.push(m.id)}
 return fresh;
}
function milestoneHubItems(){
 return Object.entries(universe.milestones||{}).filter(([,year])=>year===universe.year).map(([id])=>CAREER_MILESTONES.find(m=>m.id===id)).filter(Boolean)
  .map(m=>({type:'good-news',tab:'program',importance:68,kicker:'MILESTONE',main:`Career milestone: ${m.label}`,sub:m.detail}));
}
function renderCareerMilestones(){
 const host=$('#careerMilestones');if(!host||!universe)return;
 const rows=careerMilestoneStatus(),reached=rows.filter(r=>r.done).length;
 host.innerHTML=`<div class="section-head"><div><div class="eyebrow">CAREER</div><h3>Milestones</h3><div class="muted">Reached across every post you hold. ${reached} of ${rows.length} so far.</div></div></div><div class="milestone-grid">${rows.map(r=>`<div class="milestone${r.done?' is-done':''}"><strong>${esc(r.label)}</strong><span>${esc(r.detail)}</span>${r.done?`<em>${r.year?`Reached ${r.year}`:'Reached'}</em>`:`<div class="milestone-bar" role="meter" aria-valuemin="0" aria-valuemax="${r.target}" aria-valuenow="${r.value}"><i style="width:${Math.round(r.value/r.target*100)}%"></i></div><em>${r.value} / ${r.target}</em>`}</div>`).join('')}</div>`;
}
const renderProgramWithSettings=TAB_RENDERERS.program;
TAB_RENDERERS.program=()=>{renderProgramWithSettings();renderCareerMilestones()};
