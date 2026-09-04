(() => {
'use strict';

// Presentation-only enhancement. Reads rendered DOM; never mutates universe/save data.
const palettes=[
 ['#173b67','#79b4ff','121,180,255'],['#6a1f2b','#f0c56f','240,197,111'],
 ['#1f513f','#79d7ad','121,215,173'],['#47306e','#b39cff','179,156,255'],
 ['#8a3e16','#ffad72','255,173,114'],['#155360','#78d4df','120,212,223'],
 ['#622e46','#ef9fbd','239,159,189'],['#3d3a20','#e8ce72','232,206,114'],
 ['#274b8b','#8bb7ff','139,183,255'],['#712829','#ff9292','255,146,146'],
 ['#315022','#a5d77b','165,215,123'],['#55324e','#cfa2c4','207,162,196']
];
function hash(s){let h=2166136261;for(const c of String(s||'DL')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function palette(name){const p=palettes[hash(name)%palettes.length];return {primary:p[0],secondary:p[1],rgb:p[2]}}
function initials(name){const skip=new Set(['university','state','commonwealth','metropolitan','tech','college','maritime']);let a=String(name||'DL').trim().split(/\s+/).filter(Boolean),b=a.filter(x=>!skip.has(x.toLowerCase()));a=b.length?b:a;return !a.length?'DL':a.length===1?a[0].slice(0,2).toUpperCase():(a[0][0]+a.at(-1)[0]).toUpperCase()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function team(){const p=document.querySelector('#userTeam'),n=document.querySelector('#teamName')?.textContent;return (n||p?.options[p.selectedIndex]?.text||'Program').trim()}
function txt(el,sel){return (el?.querySelector(sel)?.textContent||'').trim()}
function mark(name,size=''){const p=palette(name);return `<div class="sports-mark ${size}" style="--mark-primary:${p.primary};--mark-secondary:${p.secondary};--mark-rgb:${p.rgb}" aria-hidden="true">${esc(initials(name))}</div>`}
function go(tab){document.querySelector(`.tabs button[data-tab="${tab}"]`)?.click()}

function dashboard(){
 const d=document.querySelector('#dashboard'),hero=d?.querySelector('.program-masthead,.hero-grid'),hub=document.querySelector('#weeklyHub');if(!d||!hero||!hub)return;
 let f=document.querySelector('#broadcastFeature');if(!f){f=document.createElement('section');f.id='broadcastFeature';f.className='broadcast-feature';hero.after(f)}
 const items=[...hub.querySelectorAll('.hub-item')],next=items.find(x=>txt(x,'.hub-kicker').toUpperCase()==='NEXT UP'),last=items.find(x=>txt(x,'.hub-kicker').toUpperCase()==='FINAL');
 for(const x of items)x.classList.toggle('hub-promoted',x===next||x===last);hub.classList.toggle('hub-quiet',items.length>0&&items.every(x=>x===next||x===last));
 const u=team(),record=document.querySelector('#recordBig')?.textContent||'0–0',rank=document.querySelector('#rankLine')?.textContent||'Preseason',week=document.querySelector('#weekLine')?.textContent||'';
 if(next){const main=txt(next,'.hub-main'),sub=txt(next,'.hub-sub'),m=main.match(/^Week\s+(\d+):\s+(vs|@)\s+(.+)$/i),wk=m?.[1]||'—',loc=m?.[2]||'vs',opp=(m?.[3]||main).trim();f.innerHTML=`<div class="broadcast-feature-main"><div class="broadcast-kicker">WEEK ${esc(wk)} · NEXT MATCHUP</div><div class="broadcast-matchup"><div class="broadcast-team">${mark(u,'large')}<div><span class="broadcast-team-role">YOUR PROGRAM</span><strong>${esc(u)}</strong><span>${esc(record)} · ${esc(rank)}</span></div></div><div class="broadcast-versus"><b>${loc==='@'?'AT':'VS'}</b><span>SCOUTING DESK</span></div><div class="broadcast-team opponent">${mark(opp,'large')}<div><span class="broadcast-team-role">OPPONENT</span><strong>${esc(opp)}</strong><span>${esc(sub)}</span></div></div></div><div class="broadcast-actions"><button type="button" data-sports-tab="gamelab">Open Game Lab</button><span>${esc(week)}</span></div></div><aside class="broadcast-result"><div class="broadcast-kicker">${last?'LAST RESULT':'PROGRAM STATUS'}</div>${last?`<strong>${esc(txt(last,'.hub-main'))}</strong><span>${esc(txt(last,'.hub-sub'))}</span><button type="button" data-sports-final="1">Game Center</button>`:`<strong>${esc(record)}</strong><span>${esc(rank)} · ${esc(week)}</span>`}</aside>`}
 else if(last){f.innerHTML=`<div class="broadcast-feature-main"><div class="broadcast-kicker">DYNASTY LAB · FINAL</div><div class="broadcast-final">${mark(u,'large')}<div><strong>${esc(txt(last,'.hub-main'))}</strong><span>${esc(txt(last,'.hub-sub'))}</span></div></div><div class="broadcast-actions"><button type="button" data-sports-final="1">Game Center</button><button type="button" data-sports-tab="season">Season</button><span>${esc(week)}</span></div></div>`}
 else f.innerHTML=`<div class="broadcast-feature-main"><div class="broadcast-kicker">DYNASTY LAB · PROGRAM DESK</div><div class="broadcast-final">${mark(u,'large')}<div><strong>${esc(u)}</strong><span>${esc(record)} · ${esc(rank)} · ${esc(week)}</span></div></div><div class="broadcast-actions"><span>Matchup and result graphics will surface here as the season advances.</span></div></div>`;
}

function playerHero(){
 const dlg=document.querySelector('#playerDialog');if(!dlg?.hasAttribute('open'))return;const head=dlg.querySelector('.dialog-head'),id=head?.querySelector('.dialog-identity'),body=document.querySelector('#playerDialogBody');if(!head||!id||!body)return;
 const name=document.querySelector('#playerDialogName')?.textContent||'Player',meta=document.querySelector('#playerDialogMeta')?.textContent||'',stats=[...body.querySelectorAll('.profile-grid .profile-stat')];if(stats.length<3)return;
 const key=name+'|'+meta+'|'+stats.slice(0,3).map(x=>x.textContent).join('|');if(dlg.dataset.sportsHeroKey===key)return;dlg.dataset.sportsHeroKey=key;dlg.classList.add('sports-player-dialog');head.querySelector('.player-hero-rail')?.remove();id.querySelector('.player-hero-team-mark')?.remove();
 const parts=meta.split('·').map(x=>x.trim()).filter(Boolean),school=parts.length>=5?parts.at(-1):team(),pos=parts[0]||'PLAYER',p=palette(school);let tm=document.createElement('div');tm.className='player-hero-team-mark';tm.style.cssText=`--mark-primary:${p.primary};--mark-secondary:${p.secondary};--mark-rgb:${p.rgb}`;tm.innerHTML=`<span>${esc(initials(school))}</span><small>${esc(school)}</small>`;id.append(tm);
 let rail=document.createElement('div');rail.className='player-hero-rail';rail.innerHTML=`<div class="player-position-chip">${esc(pos)}</div>`+stats.slice(0,3).map((x,i)=>`<div class="player-hero-rating ${i===0?'primary':''}"><span>${esc(x.querySelector('.small')?.textContent||'')}</span><strong>${esc(x.querySelector('.v')?.textContent||'—')}</strong></div>`).join('');head.insertBefore(rail,head.querySelector('.dialog-close'));body.querySelector('.profile-grid')?.classList.add('sports-profile-grid')
}

function matchup(){
 const c=document.querySelector('#nextGameCard');if(!c||c.querySelector('.matchup-shell'))return;const title=c.querySelector('strong')?.textContent?.trim(),detail=c.querySelector('.muted')?.textContent?.trim();if(!title||!detail)return;const m=title.match(/^Week\s+(\d+):\s+(vs|@)\s+(.+)$/i);if(!m)return;const [,wk,loc,opp]=m,u=team(),halves=detail.split(/\s+·\s+/);c.innerHTML=`<div class="matchup-shell"><div class="matchup-label">WEEK ${esc(wk)} · GAME LAB PREVIEW</div><div class="matchup-board"><div class="matchup-team is-user">${mark(u,'xl')}<strong>${esc(u)}</strong><span>${esc((halves[0]||'').replace(u+':','').trim())}</span></div><div class="matchup-center"><b>${loc==='@'?'AT':'VS'}</b><span>TALE OF THE TAPE</span></div><div class="matchup-team">${mark(opp,'xl')}<strong>${esc(opp)}</strong><span>${esc((halves.slice(1).join(' · ')||'').replace(opp+':','').trim())}</span></div></div><div class="matchup-footer"><span>Current staff/game-model reads</span><strong>${loc==='@'?'ROAD GAME':'HOME GAME'}</strong></div></div>`
}
function top15(){for(const row of document.querySelectorAll('#top15 .rankrow')){const cell=row.firstElementChild;if(!cell||cell.querySelector('.sports-mark'))continue;const name=[...cell.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();if(!name)continue;cell.querySelector('.rank')?.insertAdjacentHTML('afterend',mark(name,'small'))}}
function gamecenter(){
 const dlg=document.querySelector('#gameDialog');if(!dlg?.hasAttribute('open'))return;const h=document.querySelector('#gameDialogName'),head=dlg.querySelector('.dialog-head');if(!h||!head)return;const title=(h.textContent||'').trim(),m=title.match(/^(.+?)\s+(\d+)\s+—\s+(\d+)\s+(.+)$/);if(!m)return;
 const meta=(document.querySelector('#gameDialogMeta')?.textContent||'').split('·').map(x=>x.trim()).filter(Boolean),pre=document.querySelector('#gamePregame')?.textContent||'',key=title+'|'+meta.join('|')+'|'+pre;if(dlg.dataset.sportsScoreKey===key)return;dlg.dataset.sportsScoreKey=key;dlg.classList.add('sports-game-dialog');
 const [,away,as,hs,home]=m,rec=name=>{const r=pre.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+(\\S+)\\s+\\(#([^)]+)\\)'));return r?`${r[1]}${r[2]!=='—'?' · #'+r[2]:''}`:''},aw=+as>+hs,hw=+hs>+as;
 let sb=head.querySelector('.scoreboard');if(!sb){sb=document.createElement('div');sb.className='scoreboard';h.after(sb)}
 const side=(name,score,win,role)=>`<div class="sb-team${win?' winner':''}">${mark(name,'large')}<div class="sb-copy"><span class="sb-role">${role}</span><strong>${esc(name)}</strong><small>${esc(rec(name))}</small></div><b class="sb-score">${esc(score)}</b></div>`;
 sb.innerHTML=side(away,as,aw,'AWAY')+`<div class="sb-mid"><span class="sb-status">${esc(meta[0]||'FINAL')}</span><span>${esc(meta.slice(1,3).join(' · '))}</span><span>${esc(meta.slice(3).join(' · '))}</span></div>`+side(home,hs,hw,'HOME');
}
function score(){document.querySelector('#detailedBox .big')?.classList.add('sports-scoreline')}
let queued=false;function run(){queued=false;dashboard();top15();playerHero();matchup();gamecenter();score()}function queue(){if(queued)return;queued=true;if(window.requestAnimationFrame)window.requestAnimationFrame(run);else setTimeout(run,0)}
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-sports-final]')){e.preventDefault();[...document.querySelectorAll('#weeklyHub .hub-item')].find(x=>txt(x,'.hub-kicker').toUpperCase()==='FINAL')?.click();return}const tab=e.target?.closest?.('[data-sports-tab]')?.dataset?.sportsTab;if(tab){e.preventDefault();go(tab)}setTimeout(queue,0)});document.querySelector('#userTeam')?.addEventListener('change',()=>setTimeout(queue,0));
if(window.MutationObserver){for(const sel of ['#weeklyHub','#top15','#playerDialog','#gameDialog','#nextGameCard','#detailedBox']){const el=document.querySelector(sel);if(el)new MutationObserver(queue).observe(el,{childList:true,subtree:true,characterData:true,attributes:sel==='#playerDialog'||sel==='#gameDialog'})}}
queue();
})();
