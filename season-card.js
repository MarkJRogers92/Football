// v0.34 — a season card to share. The Season in Review gets a "Save season card" button that draws one image of the
// year (1200×630, the size social sites preview) in the program's colours: the outcome, record, final ranking, the
// defining moment, team leaders and awards. It is saved to the device as a PNG; nothing is uploaded and nothing is
// stored in the dynasty.
function makeSeasonCard(){
 'use strict';
 const W=1200,H=630;
 // What the card says, as plain lines, from the Season in Review model. Pure, so it can be checked without a canvas.
 function lines(m,t){
  if(!m)return null;
  const best=(m.moments||[]).find(x=>x.kind==='best')||(m.moments||[]).find(x=>x.kind==='rivalry')||null;
  const leaders=(m.leaders||[]).slice(0,3).map(x=>`${x.label}: ${x.pos} ${x.name}, ${x.line}`);
  const awards=(m.awards||[]).slice(0,3).map(a=>`${a.name}: ${a.playerName}`);
  const wins=(m.games||[]).filter(g=>g.win).length,losses=(m.games||[]).length-wins;
  return{kicker:`${m.year} SEASON`,team:String(m.team||t?.name||''),headline:String(m.outcome||''),record:String(m.record||''),conference:String(m.conference||''),rank:`Final ranking ${m.rank}`,
   moment:best?`${best.title}: ${best.text}`:'',leaders,awards,strip:(m.games||[]).map(g=>g.win?'W':'L'),wins,losses,champion:!!m.champion,
   colors:{primary:t?.primary||'#1f3a5f',secondary:t?.secondary||'#d9a441'},file:`dynasty-lab-${String(m.team||'season').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${m.year}.png`};
 }
 function fit(ctx,text,max,size,weight='700',family='Inter, Arial, sans-serif'){
  let s=size;do{ctx.font=`${weight} ${s}px ${family}`;if(ctx.measureText(text).width<=max)break;s-=2}while(s>14);
  if(ctx.measureText(text).width>max){let cut=text;while(cut.length>4&&ctx.measureText(cut+'…').width>max)cut=cut.slice(0,-1);return cut+'…'}
  return text;
 }
 function draw(canvas,c){
  canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');if(!ctx)return false;
  const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,c.colors.primary);g.addColorStop(1,'#0b0f17');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=c.colors.secondary;ctx.fillRect(0,0,W,10);ctx.fillRect(0,H-10,W,10);
  ctx.textBaseline='top';ctx.fillStyle=c.colors.secondary;ctx.font='700 26px Inter, Arial, sans-serif';ctx.fillText(c.kicker+(c.champion?' · NATIONAL CHAMPIONS':''),60,48);
  ctx.fillStyle='#ffffff';ctx.fillText(fit(ctx,c.team.toUpperCase(),1080,64,'800'),60,86);
  ctx.fillStyle='#ffffff';const headline=fit(ctx,c.headline,1080,44,'700');ctx.fillText(headline,60,166);
  ctx.fillStyle='rgba(255,255,255,.82)';ctx.font='500 28px Inter, Arial, sans-serif';ctx.fillText(fit(ctx,`${c.record} · ${c.conference} · ${c.rank}`,1080,28,'500'),60,224);
  // The season, game by game.
  const box=Math.min(56,Math.floor(1080/Math.max(1,c.strip.length))-6);
  c.strip.forEach((r,i)=>{const x=60+i*(box+6),y=280;ctx.fillStyle=r==='W'?'#5fae7a':'#d0605a';ctx.fillRect(x,y,box,box);ctx.fillStyle='#0b0f17';ctx.font=`800 ${Math.round(box*.5)}px Inter, Arial, sans-serif`;const tw=ctx.measureText(r).width;ctx.fillText(r,x+(box-tw)/2,y+box*.22)});
  let y=370;
  if(c.moment){ctx.fillStyle=c.colors.secondary;ctx.fillText(fit(ctx,c.moment,1080,30,'700'),60,y);y+=48}
  ctx.fillStyle='rgba(255,255,255,.9)';
  for(const line of [...c.leaders,...c.awards].slice(0,4)){ctx.fillText(fit(ctx,line,1080,24,'500'),60,y);y+=36}
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.font='600 20px Inter, Arial, sans-serif';const mark='DYNASTY LAB';ctx.fillText(mark,W-60-ctx.measureText(mark).width,H-46);
  return true;
 }
 return{W,H,lines,draw};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeSeasonCard};
}else{
 const seasonCard=makeSeasonCard();
 globalThis.DynastySeasonCard=seasonCard;
 function saveSeasonCard(){
  const t=selected(),c=seasonCard.lines(globalThis.DynastySeasonReview?.model?.(),t);if(!c)return;
  const canvas=document.createElement('canvas');if(!seasonCard.draw(canvas,c)){setStatus('This browser cannot draw the season card.');return}
  canvas.toBlob(blob=>{
   if(!blob){setStatus('The season card could not be saved.');return}
   const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=c.file;document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(a.href),1000);setStatus(`Season card saved as ${c.file}.`);
  },'image/png');
 }
 function addSeasonCardButton(){
  const host=$('#seasonReview');if(!host||host.hidden||host.querySelector('[data-season-card]'))return;
  const head=host.querySelector('.section-head');if(!head)return;
  const b=document.createElement('button');b.type='button';b.className='dw-button season-card-button';b.dataset.seasonCard='1';b.textContent='Save season card';
  b.setAttribute('aria-label','Save an image of this season to your device');b.onclick=saveSeasonCard;head.append(b);
 }
 extendRender('dashboard',addSeasonCardButton);
}
