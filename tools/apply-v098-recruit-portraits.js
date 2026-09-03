const fs = require('fs');

function read(path){return fs.readFileSync(path,'utf8')}
function write(path,content){fs.writeFileSync(path,content)}
function replaceOnce(src, search, replacement, label){
  const i=src.indexOf(search);
  if(i<0) throw new Error(`Missing patch target: ${label}`);
  if(src.indexOf(search,i+search.length)>=0) throw new Error(`Patch target not unique: ${label}`);
  return src.slice(0,i)+replacement+src.slice(i+search.length);
}
function replaceRegexOnce(src, re, replacement, label){
  const matches=[...src.matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];
  if(matches.length!==1) throw new Error(`${label}: expected 1 match, found ${matches.length}`);
  return src.replace(re,replacement);
}

let app=read('app.js');
if(!app.includes('data-portrait-kind="recruit"')){
  app=replaceRegexOnce(app,
    /function portraitTag\(p,size,frame\)\{[\s\S]*?\nfunction ensurePortrait\(p\)/,
`function portraitTag(p,size,frame,kind='player'){if(!p)return '';return \`<canvas class="portrait portrait-\${frame}" width="\${size}" height="\${size}" data-portrait="\${p.id}" data-portrait-size="\${size}" data-portrait-frame="\${frame}" data-portrait-kind="\${kind}" aria-label="Portrait of \${String(p.name||'player').replace(/"/g,'&quot;')}"></canvas>\`}
const RECRUIT_PORTRAIT_SCHOOL={id:'recruit-neutral',name:'National Prospect',primary:'#283747',secondary:'#b8c2cf'};
function paintPortraits(scope){
 if(typeof DynastyPortraits==='undefined')return;
 const root=scope||document,nodes=[...(root.matches?.('canvas[data-portrait]')?[root]:[]),...(root.querySelectorAll?.('canvas[data-portrait]')||[])];
 for(const c of nodes){
  if(c.dataset.portraitPainted==='1')continue;
  const isRecruit=c.dataset.portraitKind==='recruit';let p=null,team=null;
  if(isRecruit){p=(universe.recruits||[]).find(r=>String(r.id)===String(c.dataset.portrait));if(!p)continue;p.portraitSeed??=\`recruit-\${p.id}\`;p.portraitVersion??=PORTRAIT_VERSION;if(p.committed)team=T(p.committed)||null}
  else{const f=findPlayer(c.dataset.portrait);if(!f?.p)continue;p=f.p;team=f.team&&f.team.primary?f.team:null;if(!team){const nm=f.team?.name||f.p.lastTeam;if(nm)team=T(nm)||null}}
  const school=team?ensureSchoolColors(team):(isRecruit?RECRUIT_PORTRAIT_SCHOOL:schoolColors({id:0,name:p.lastTeam||'archive'}));
  const subject=isRecruit?{...p,jerseyNumber:p.jerseyNumber??jerseyFor(p.pos,p.portraitSeed)}:ensurePortrait(p);
  try{
   DynastyPortraits.renderPlayerPortrait(subject,school||{},c,{
    size:Number(c.dataset.portraitSize)||64,
    pixelRatio:Math.min(2,globalThis.devicePixelRatio||1),
    frame:c.dataset.portraitFrame||'list'
   });
   c.dataset.portraitPainted='1';
  }catch(e){c.dataset.portraitPainted='error'}
 }
}
globalThis.DynastyLabPortraits={paint:paintPortraits};
function ensurePortrait(p)`,
    'portrait renderer bridge');

  app=replaceOnce(app,
    '<td data-label="Player"><button class="player-button" data-recruit="${r.id}">${r.name}</button><div class="small muted">${r.style}</div></td>',
    '<td data-label="Player"><div class="player-cell">${portraitTag(r,64,\'list\',\'recruit\')}<div class="player-cell-text"><button class="player-button" data-recruit="${r.id}">${r.name}</button><div class="small muted">${r.style}</div></div></div></td>',
    'recruiting row portrait');
}
write('app.js',app);

let rp=read('recruit-presentation.js');
if(!rp.includes('function portraitCanvas(')){
  rp=replaceOnce(rp,
    "function initials(name){const parts=String(name||'R').trim().split(/\\s+/).filter(Boolean);return parts.length<2?(parts[0]||'R').slice(0,2).toUpperCase():(parts[0][0]+parts.at(-1)[0]).toUpperCase()}\n",
    "function initials(name){const parts=String(name||'R').trim().split(/\\s+/).filter(Boolean);return parts.length<2?(parts[0]||'R').slice(0,2).toUpperCase():(parts[0][0]+parts.at(-1)[0]).toUpperCase()}\nfunction portraitCanvas(id,name,size=96,frame='recruit-card'){if(!id)return '';return `<canvas class=\"portrait portrait-${esc(frame)}\" width=\"${size}\" height=\"${size}\" data-portrait=\"${esc(id)}\" data-portrait-size=\"${size}\" data-portrait-frame=\"${esc(frame)}\" data-portrait-kind=\"recruit\" aria-label=\"Portrait of ${esc(name||'recruit')}\"></canvas>`}\nlet portraitObserver=null;function watchPortraits(root=document){const nodes=[...root.querySelectorAll('canvas[data-portrait-kind=\"recruit\"]:not([data-recruit-portrait-watched])')];if(!nodes.length)return;const painter=globalThis.DynastyLabPortraits?.paint;if(!painter)return;if(!('IntersectionObserver' in window)){painter(root);return}portraitObserver??=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){painter(e.target);portraitObserver.unobserve(e.target)}},{rootMargin:'280px 0px'});for(const c of nodes){c.dataset.recruitPortraitWatched='1';portraitObserver.observe(c)}}\n",
    'recruit portrait helpers');

  rp=replaceOnce(rp,
    'spotlight=`<article class="commitment-spotlight"><div class="commitment-stamp">${esc(kicker)}</div><div class="commitment-avatar">${esc(initials(main.replace(/[★]/g,\'\').replace(/^\\s*[A-Z]{1,4}\\s+/,\'\').trim()))}</div>',
    'spotlight=`<article class="commitment-spotlight"><div class="commitment-stamp">${esc(kicker)}</div><div class="commitment-avatar">${rid?portraitCanvas(rid,main,112,\'recruit-spotlight\'):esc(initials(main.replace(/[★]/g,\'\').replace(/^\\s*[A-Z]{1,4}\\s+/,\'\').trim()))}</div>',
    'commitment portrait');

  rp=replaceOnce(rp,
    '<span class="signing-card-avatar">${esc(initials(r.name))}</span>',
    '<span class="signing-card-avatar">${portraitCanvas(r.id,r.name,96,\'recruit-card\')}</span>',
    'signing card portrait');

  rp=replaceOnce(rp,
    " feature.querySelectorAll('[data-signing-recruit]').forEach(b=>b.onclick=()=>document.querySelector(`#recruitBody [data-recruit=\"${CSS.escape(b.dataset.signingRecruit)}\"]`)?.click());\n",
    " feature.querySelectorAll('[data-signing-recruit]').forEach(b=>b.onclick=()=>document.querySelector(`#recruitBody [data-recruit=\"${CSS.escape(b.dataset.signingRecruit)}\"]`)?.click());watchPortraits(feature);\n",
    'signing card portrait paint');

  rp=replaceOnce(rp,
    "if(identity){const avatar=document.createElement('div');avatar.className='recruit-hero-avatar';avatar.innerHTML=`<span>${esc(initials(name))}</span><small>${esc(stars||'PROSPECT')}</small>`;identity.prepend(avatar)}",
    "if(identity){const avatar=document.createElement('div');avatar.className='recruit-hero-avatar';avatar.innerHTML=row?portraitCanvas(row.id,name,156,'recruit-profile'):`<span>${esc(initials(name))}</span><small>${esc(stars||'PROSPECT')}</small>`;identity.prepend(avatar)}",
    'recruit profile portrait');

  rp=replaceOnce(rp,
    "head.insertBefore(rail,head.querySelector('.dialog-close'));body.querySelector('.profile-grid')?.classList.add('sports-recruit-profile-grid')\n}",
    "head.insertBefore(rail,head.querySelector('.dialog-close'));body.querySelector('.profile-grid')?.classList.add('sports-recruit-profile-grid');watchPortraits(dlg)\n}",
    'recruit profile portrait paint');

  rp=replaceOnce(rp,
    "let queued=false;function run(){queued=false;renderSigningClass();renderRecruitHero()}",
    "let queued=false;function run(){queued=false;renderSigningClass();renderRecruitHero();watchPortraits(document)}",
    'global recruit portrait watch');
}
write('recruit-presentation.js',rp);

let css=read('recruit-presentation.css');
if(!css.includes('recruit portrait canvases')){
  css += `\n/* v0.9.8 recruit portrait canvases */\n.signing-card-avatar,.commitment-avatar,.recruit-hero-avatar{overflow:hidden}\n.signing-card-avatar canvas,.commitment-avatar canvas,.recruit-hero-avatar canvas{display:block;width:100%;height:100%;border-radius:inherit}\n.signing-card-avatar:has(canvas),.commitment-avatar:has(canvas),.recruit-hero-avatar:has(canvas){padding:0}\n`;
}
write('recruit-presentation.css',css);

let test=read('tests/recruit-visual.js');
if(!test.includes('recruiting list has portrait canvases')){
  test=replaceOnce(test,
    "  check(`[${label}] signing-class meter renders`,await page.locator('#signingClassFeature .signing-meter').count()===1);\n",
    "  check(`[${label}] signing-class meter renders`,await page.locator('#signingClassFeature .signing-meter').count()===1);\n  check(`[${label}] recruiting list has portrait canvases`,await page.locator('#recruitBody canvas[data-portrait-kind=\"recruit\"]').count()>0);\n  const firstPortrait=page.locator('#recruitBody canvas[data-portrait-kind=\"recruit\"]').first();await firstPortrait.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('#recruitBody canvas[data-portrait-kind=\"recruit\"]')?.dataset.portraitPainted==='1',{timeout:10000});\n  check(`[${label}] visible recruit portrait paints`,await firstPortrait.getAttribute('data-portrait-painted')==='1');\n",
    'recruit list portrait tests');

  test=replaceOnce(test,
    "  check(`[${label}] committed recruit becomes signing card`,await page.locator('#signingClassFeature .signing-card').count()>=1);\n",
    "  check(`[${label}] committed recruit becomes signing card`,await page.locator('#signingClassFeature .signing-card').count()>=1);\n  await page.waitForFunction(()=>document.querySelector('#signingClassFeature .signing-card canvas[data-portrait-kind=\"recruit\"]')?.dataset.portraitPainted==='1',{timeout:10000});\n  check(`[${label}] signing card uses painted recruit portrait`,await page.locator('#signingClassFeature .signing-card canvas[data-portrait-kind=\"recruit\"][data-portrait-painted=\"1\"]').count()>=1);\n",
    'signing portrait test');

  test=replaceOnce(test,
    "  check(`[${label}] recruit hero has identity graphic`,await page.locator('#recruitDialog .recruit-hero-avatar').count()===1);\n",
    "  check(`[${label}] recruit hero has identity graphic`,await page.locator('#recruitDialog .recruit-hero-avatar').count()===1);\n  await page.waitForFunction(()=>document.querySelector('#recruitDialog .recruit-hero-avatar canvas[data-portrait-kind=\"recruit\"]')?.dataset.portraitPainted==='1',{timeout:10000});\n  check(`[${label}] recruit profile portrait paints`,await page.locator('#recruitDialog .recruit-hero-avatar canvas[data-portrait-painted=\"1\"]').count()===1);\n",
    'profile portrait test');
}
write('tests/recruit-visual.js',test);

console.log('v0.9.8 recruit portrait patch applied');
