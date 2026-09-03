(function(){
'use strict';
const P=DynastyPortraits,$=id=>document.getElementById(id);
const schools=[{name:'Chicago Metropolitan',primary:'#174d46',secondary:'#ecb45b',background:'#294347'},{name:'Texas Republic',primary:'#7d3024',secondary:'#edce8c',background:'#46382f'},{name:'Pacific Coast',primary:'#244775',secondary:'#b9d4ed',background:'#2c3b50'},{name:'Unsigned recruit',primary:'#495862',secondary:'#a7b7bc',background:'#303d43'}];
const first=['Marcus','Devin','Isaiah','Caleb','Jaylen','Noah','Malik','Owen','Darius','Cameron','Elijah','Miles','Andre','Jalen','Ethan','Tyler','Xavier','Roman','Cole','Jordan','Nico','Trey','Quinn','Zion'];
const last=['Tate','Carter','Brooks','Hayes','Reed','Bennett','Johnson','Sullivan','Price','Coleman','Grant','Ellis','Williams','Porter','Mason','Washington','Cruz','Walker','James','Mitchell','Davis','Foster','Harris','Wells'];
const positions=['QB','RB','WR','TE','OL','EDGE','DT','LB','CB','S'];
let player={portraitSeed:'84723911',portraitVersion:1,name:'Marcus Tate',pos:'EDGE',age:20,height:76,weight:258,jerseyNumber:7},overrides={},classSeed=2030,generation=0,galleryPlayers=[];
const heightText=h=>`${Math.floor(h/12)}′${h%12}″`;
const school=()=>schools[Number($('school').value)];
const options=()=>({size:256,pixelRatio:Math.min(window.devicePixelRatio||1,2),neutral:$('school').value==='3',background:school().background,overrides:{...overrides,accessories:$('accessories').checked}});
function selectOptions(id,labels){$(id).replaceChildren(...labels.map((text,i)=>{const o=document.createElement('option');o.value=i;o.textContent=text;return o;}));}
selectOptions('hair',P.HAIR);selectOptions('beard',P.BEARDS);
function swatches(id,colors,field){colors.forEach((color,i)=>{const b=document.createElement('button');b.className='swatch';b.style.background=color;b.setAttribute('aria-label',`${field==='skin'?'Skin tone':'Hair color'} ${i+1}`);b.onclick=()=>{overrides[field]=i;render();};$(id).append(b);});}
swatches('skins',P.SKIN,'skin');swatches('hairColors',P.HAIR_COLORS,'hairColor');
function markSwatches(id,active){[...$(id).children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===active)));}
function syncControls(){for(const [id,key] of [['seed','portraitSeed'],['position','pos'],['age','age'],['height','height'],['weight','weight'],['number','jerseyNumber']])$(id).value=player[key];}
function render(){
 const op=options(),appearance=P.renderPlayerPortrait(player,school(),$('hero'),op);
 P.renderPlayerPortrait(player,school(),$('tiny'),{...op,size:48,pixelRatio:1});
 $('playerName').textContent=player.name;$('playerMeta').textContent=`${player.pos} · ${heightText(player.height)} / ${player.weight} lb · Age ${player.age}`;
 $('numberBadge').textContent=String(player.jerseyNumber).padStart(2,'0');$('cardPosition').textContent=player.pos;$('cardYear').textContent=player.age<18?'RECRUIT':['FR','SO','JR','SR'][Math.min(3,player.age-18)];
 $('seedBadge').textContent=`#${String(player.portraitSeed).slice(0,18)}`;
 $('ageValue').textContent=`${player.age} years`;$('heightValue').textContent=heightText(player.height);$('weightValue').textContent=`${player.weight} lb`;
 $('hair').value=appearance.hair;$('beard').value=appearance.beard;markSwatches('skins',appearance.skin);markSwatches('hairColors',appearance.hairColor);
 renderCareer();document.querySelectorAll('.player-card').forEach(b=>b.classList.toggle('selected',b.dataset.seed===String(player.portraitSeed)));
}
function renderCareer(){
 const stages=[['Recruit',17,224,3],['Freshman',18,230,0],['Junior',20,258,0],['Senior · transfer',22,270,1]];
 $('career').replaceChildren(...stages.map(([title,age,weight,s])=>{const fig=document.createElement('figure'),c=document.createElement('canvas'),cap=document.createElement('figcaption');c.setAttribute('aria-label',`${player.name}, ${title}`);P.renderPlayerPortrait({...player,age,weight,height:76},schools[s],c,{...options(),size:128,pixelRatio:1,neutral:s===3,background:schools[s].background});cap.textContent=title;const small=document.createElement('small');small.textContent=`Age ${age} · ${weight} lb`;cap.append(small);fig.append(c,cap);return fig;}));
}
function fixture(i){
 const r=P.rng(classSeed,`fixture-${i}`),pos=positions[Math.floor(r()*positions.length)],seed=String(P.hash(`${classSeed}:player:${i}`));
 const builds={QB:[72,7,195,45],RB:[68,7,185,45],WR:[69,9,170,45],TE:[75,6,235,40],OL:[75,6,285,65],EDGE:[74,7,230,50],DT:[73,7,285,65],LB:[71,7,215,40],CB:[69,7,170,35],S:[70,7,185,40]};
 const [h,dh,w,dw]=builds[pos];
 return {portraitSeed:seed,portraitVersion:1,name:`${first[Math.floor(r()*first.length)]} ${last[Math.floor(r()*last.length)]}`,pos,age:18+Math.floor(r()*5),height:h+Math.floor(r()*dh),weight:w+Math.floor(r()*dw),jerseyNumber:Math.floor(r()*99),school:Math.floor(r()*3)};
}
function renderGallery(){
 const ticket=++generation,n=Number($('count').value),start=performance.now(),same=$('uniformGallery').checked;
 galleryPlayers=Array.from({length:n},(_,i)=>fixture(i));$('gallery').replaceChildren();$('stats').textContent='Drawing class…';let index=0;
 function batch(){if(ticket!==generation)return;const deadline=performance.now()+8;
  do{const p=galleryPlayers[index],s=schools[same?0:p.school],button=document.createElement('button'),c=document.createElement('canvas'),info=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small'),pos=document.createElement('span');
    button.className='player-card';button.dataset.seed=p.portraitSeed;button.setAttribute('aria-label',`Edit ${p.name}, ${p.pos}`);c.setAttribute('aria-hidden','true');
    P.renderPlayerPortrait(p,s,c,{size:128,background:s.background,overrides:{accessories:!same}});
    info.className='info';name.textContent=p.name;meta.textContent=`${p.pos} · ${heightText(p.height)} · ${p.weight} lb`;pos.className='pos';pos.textContent=p.pos;info.append(name,meta);button.append(c,pos,info);button.onclick=()=>{player={...p};overrides={};$('school').value=String(same?0:p.school);syncControls();render();};$('gallery').append(button);index++;
  }while(index<n&&performance.now()<deadline);
  if(index<n)requestAnimationFrame(batch);else{$('stats').textContent=`${n} players · ${Math.round(performance.now()-start)} ms · ${(P.cache.bytes/1048576).toFixed(1)} MB cache`;}
 }
 requestAnimationFrame(batch);
}
for(const [id,key] of [['age','age'],['height','height'],['weight','weight'],['number','jerseyNumber']])$(id).addEventListener('input',()=>{if($(id).value==='')return;player[key]=Math.min(Number($(id).max),Math.max(Number($(id).min),Number($(id).value)));render();});
$('position').onchange=()=>{player.pos=$('position').value;render();};
for(const id of ['hair','beard'])$(id).onchange=()=>{overrides[id]=Number($(id).value);render();};
$('school').onchange=render;$('accessories').onchange=render;
$('applySeed').onclick=()=>{const seed=$('seed').value.trim();if(seed){player.portraitSeed=seed;overrides={};render();}};
$('seed').addEventListener('keydown',e=>{if(e.key==='Enter')$('applySeed').click();});
$('reset').onclick=()=>{overrides={};player={...player,age:20,height:76,weight:258,jerseyNumber:7,pos:'EDGE'};$('accessories').checked=true;$('school').value='0';syncControls();render();};
let sequence=0;
$('randomize').onclick=()=>{player=fixture(100+(++sequence));overrides={};$('school').value=String(player.school);syncControls();render();};
$('newClass').onclick=()=>{classSeed++;renderGallery();};$('count').onchange=renderGallery;$('uniformGallery').onchange=renderGallery;
function download(canvas,name){const a=document.createElement('a');a.download=name;a.href=canvas.toDataURL('image/png');a.click();}
$('export').onclick=()=>{const c=document.createElement('canvas');P.renderPlayerPortrait(player,school(),c,{...options(),size:512,pixelRatio:1});download(c,`dynasty-player-${P.hash(player.portraitSeed)}.png`);};
$('contactSheet').onclick=()=>{const c=document.createElement('canvas'),cols=10,cell=144,rows=Math.ceil(galleryPlayers.length/cols);c.width=cols*cell;c.height=rows*(cell+30);const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#0d1317';ctx.fillRect(0,0,c.width,c.height);galleryPlayers.forEach((p,i)=>{const portrait=document.createElement('canvas'),s=schools[$('uniformGallery').checked?0:p.school];P.renderPlayerPortrait(p,s,portrait,{size:128,background:s.background,overrides:{accessories:!$('uniformGallery').checked}});const x=(i%cols)*cell+8,y=Math.floor(i/cols)*(cell+30)+8;ctx.drawImage(portrait,x,y);ctx.fillStyle='#f0f1ec';ctx.font='11px sans-serif';ctx.fillText(p.name,x,y+142);ctx.fillStyle='#9aaeb4';ctx.font='9px monospace';ctx.fillText(p.portraitSeed,x,y+156);});download(c,`dynasty-class-${classSeed}.png`);};
syncControls();render();renderGallery();
})();
