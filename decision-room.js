// Decision Room: a required weekly decision opens in its own window with the people involved side
// by side (depth position, staff grade, season line, morale), what the staff recommends and what
// each choice does. Choosing resolves the same decision the Coach's Desk card does.
function decisionRoomDecision(id){const t=selected();return t?guidanceStoredDecisions(t).find(d=>String(d.id)===String(id))||null:null}
function decisionRoomPeople(d,t){
  const rows=[],seen=new Set(),push=(id,tag)=>{if(id==null||seen.has(String(id)))return;const hit=findPlayer(id);if(!hit?.p)return;seen.add(String(id));rows.push({p:hit.p,team:hit.team||t,tag})};
  if(d.starterId!=null){push(d.starterId,'Starter');push(d.playerId,'Challenger')}else push(d.playerId,d.source==='PLAYER'?'Asking':'Player');
  // For a playing-time question, compare with the players ahead of him at his position.
  const p=rows[0]?.p,order=p&&t?.depthChart?.[p.pos];
  if(rows.length===1&&Array.isArray(order)){const at=order.indexOf(p.id);for(const id of order.slice(0,Math.max(0,at)).slice(-2).reverse())push(id,'Ahead of him')}
  return rows;
}
function decisionRoomPersonHTML(row,t){
  const p=ensurePortrait(row.p),order=t?.depthChart?.[p.pos]||[],depth=order.indexOf(p.id),s=p.stats||{},games=Number(s.games)||0;
  const morale=Number.isFinite(p.morale)?Math.round(p.morale):null,risk=typeof transferRisk==='function'?Math.round(transferRisk(p)):null;
  const stat=games?statLine(s).split(' · ').slice(0,3).join(' · '):'No games yet this season';
  const facts=[['Depth',depth>=0?`${p.pos}${depth+1}`:p.pos],['Staff grade',`${grade(p.perceived)} · ${scoutRange(p,t).join('–')}`],['Role',p.role||'—'],['Games',String(games)],morale!=null?['Morale',String(morale)]:null,risk!=null&&row.tag!=='Ahead of him'?['Transfer risk',`${risk}%`]:null].filter(Boolean);
  return `<article class="decision-room-person${row.tag==='Ahead of him'?' is-context':''}"><span class="decision-room-tag">${gameEscape(row.tag)}</span><button type="button" class="decision-room-face" data-player="${gameEscape(p.id)}">${portraitTag(p,72,'list')}<span><b>${gameEscape(p.name)}</b><small>#${gameEscape(p.jerseyNumber??'')} · ${gameEscape(p.pos)} · ${gameEscape(p.year||'')}</small></span></button><dl>${facts.map(([k,v])=>`<div><dt>${gameEscape(k)}</dt><dd>${gameEscape(v)}</dd></div>`).join('')}</dl><p class="decision-room-line">${gameEscape(stat)}</p></article>`;
}
function ensureDecisionRoomDialog(){
  let dialog=document.querySelector('#decisionRoom');if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.id='decisionRoom';dialog.className='decision-room';dialog.setAttribute('aria-labelledby','decisionRoomTitle');document.body.appendChild(dialog);
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});return dialog;
}
function openDecisionRoom(id){
  const d=decisionRoomDecision(id),t=selected();if(!d||!t||typeof document==='undefined')return false;
  const dialog=ensureDecisionRoomDialog(),people=decisionRoomPeople(d,t),pick=d.options.find(o=>o.recommended);
  dialog.innerHTML=`<div class="decision-room-shell"><header><div><span class="eyebrow">${d.source==='PLAYER'?'PLAYER REQUEST':'DECISION'}</span><h2 id="decisionRoomTitle">${gameEscape(d.title)}</h2></div><button type="button" class="dialog-close" data-room-close aria-label="Close decision">Close</button></header><p class="decision-room-summary">${gameEscape(d.summary)}</p>${people.length?`<div class="decision-room-people">${people.map(r=>decisionRoomPersonHTML(r,t)).join('')}</div>`:''}${pick?`<p class="decision-room-staff"><b>Staff pick:</b> ${gameEscape(pick.label)}</p>`:''}<div class="decision-room-options">${d.options.map(o=>`<button type="button" class="decision-room-option${o.recommended?' is-pick':''}" data-room-choice="${gameEscape(o.id)}"><strong>${gameEscape(o.label)}</strong><small>${gameEscape(o.description)}</small></button>`).join('')}</div><footer><button type="button" class="guidance-text-action" data-room-close>Decide later</button></footer></div>`;
  dialog.querySelectorAll('[data-room-close]').forEach(b=>b.onclick=()=>dialog.close());
  dialog.querySelectorAll('[data-room-choice]').forEach(b=>b.onclick=()=>{dialog.close();resolveWeeklyDecision(d.id,b.dataset.roomChoice)});
  dialog.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>{dialog.close();showPlayerProfile(b.dataset.player)});
  if(!dialog.open)dialog.showModal?.();paintPortraits(dialog);return true;
}
globalThis.DynastyDecisionRoom={open:openDecisionRoom,people:(id)=>{const d=decisionRoomDecision(id),t=selected();return d?decisionRoomPeople(d,t).map(r=>({id:r.p.id,tag:r.tag})):[]}};
