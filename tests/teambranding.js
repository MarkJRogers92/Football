const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const vm=require('node:vm');
const {loadEngine}=require('../tools/harness');

test('every team id 1-120 resolves to a distinct atlas cell, keyed only by numeric id',async()=>{
 const e=await(async()=>{const eng=loadEngine({seed:1});eng.setUserTeam('Chicago Metropolitan');await eng.loadSchools();eng.initUniverse();return eng})();
 const seen=new Set();
 for(const t of e.universe.teams){
  assert.ok(Number.isInteger(t.id)&&t.id>=1&&t.id<=120,`${t.name} has a real numeric id`);
  assert.ok(!seen.has(t.id),`id ${t.id} is not reused across teams`);
  seen.add(t.id);
  const html=e.teamLogoHTML(t.id,24);
  assert.ok(html.includes('team-logo')&&!html.includes('team-logo--fallback'),`id ${t.id} (${t.name}) resolves to a real cell, not the fallback`);
 }
 assert.equal(seen.size,120,'all 120 ids are present exactly once');
});

test('row-boundary and conference-boundary ids land on the exact cell the atlas spec defines',()=>{
 const e=loadEngine({seed:1});
 const cases=[[1,0,0],[12,11,0],[13,0,1],[24,11,1],[45,8,3],[48,11,3],[49,0,4],[73,0,6],[85,0,7],[97,0,8],[109,0,9],[120,11,9]];
 for(const [id,col,row] of cases){
  const html=e.teamLogoHTML(id,32);
  assert.ok(html.includes(`-${col*32}px -${row*32}px`),`id ${id} -> col ${col} row ${row}: ${html}`);
 }
});

test('an invalid id gets a visible, styled fallback instead of a broken image or a thrown error',()=>{
 const e=loadEngine({seed:1});
 for(const bad of [0,121,-1,1.5,NaN,null,undefined,'not-a-number']){
  const html=e.teamLogoHTML(bad,24);
  assert.ok(html.includes('team-logo--fallback'),`bad id ${bad} falls back cleanly`);
  assert.ok(!html.includes('background-image'),'the fallback never points at the atlas at all');
 }
});

test('logo size scales the cell and the background-size together, keeping the same cell visible',()=>{
 const e=loadEngine({seed:1});
 const html=e.teamLogoHTML(13,40);
 assert.ok(html.includes('width:40px;height:40px'));
 assert.ok(html.includes('background-size:480px 400px'),'12 cols/10 rows scaled to the requested size');
 assert.ok(html.includes('-0px -40px'),'row 1 at size 40 shifts by exactly one cell height');
});

test('coverage adapter carries the exact 120-school canonical roster with no duplicates',()=>{
 const src=fs.readFileSync(path.join(__dirname,'..','team-logo-coverage.js'),'utf8');
 const match=src.match(/const TEAM_NAMES=\[(.*?)\];/s);
 assert.ok(match,'coverage adapter exposes its canonical roster literal');
 const teams=Function(`return [${match[1]}]`)();
 assert.equal(teams.length,120);
 assert.equal(new Set(teams).size,120);
 assert.equal(teams[0],'Chicago Metropolitan');
 assert.equal(teams[44],'Knoxville Tech');
 assert.equal(teams[47],'Kentucky Commonwealth');
 assert.equal(teams[48],'Louisiana Commonwealth');
 assert.equal(teams[72],'Texas Republic University');
 assert.equal(teams[84],'Colorado Commonwealth');
 assert.equal(teams[96],'Southern California Commonwealth');
 assert.equal(teams[108],'Philadelphia Metropolitan');
 assert.equal(teams[119],'Toronto International University');
});

test('coverage adapter replaces every remaining initials-based team identity family',()=>{
 const src=fs.readFileSync(path.join(__dirname,'..','team-logo-coverage.js'),'utf8');
 for(const fn of ['patchTopbar','patchMasthead','patchSportsMarks','patchPlayerHero','patchCommitmentSchool','patchInlineIdentity'])
  assert.match(src,new RegExp(`function ${fn}\\(`),`${fn} is part of the coverage pass`);
 assert.match(src,/\.matchup-team/,'Game Lab matchup cards are included');
 assert.match(src,/\.broadcast-team/,'dashboard broadcast marks are included');
 assert.match(src,/\.player-hero-team-mark/,'player school identity is included');
 assert.match(src,/\.commitment-school/,'recruiting commitment identity is included');
 assert.match(src,/topbar-team-logo/,'the app header initials mark is superseded');
 assert.match(src,/assets\/team-logos-atlas-32\.png/,'the adapter uses the locked real-logo atlas');
});

function luminance(hex){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));
 return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2];
}
function contrast(a,b){const hi=Math.max(luminance(a),luminance(b)),lo=Math.min(luminance(a),luminance(b));return (hi+0.05)/(lo+0.05)}

test('program branding has one accessible three-color identity for every numeric team id',()=>{
 const src=fs.readFileSync(path.join(__dirname,'..','program-branding.js'),'utf8');
 const context={window:{}};vm.runInNewContext(src,context);
 const branding=context.window.DynastyProgramBranding;
 assert.ok(branding,'program branding registry is exposed');
 assert.equal(branding.teamCount,120);
 assert.equal(branding.colors.length,121,'index zero is reserved so teamId maps directly to its palette');
 const seen=new Set();
 for(let id=1;id<=120;id++){
  const brand=branding.brandFor(id),triple=[brand.primary,brand.secondary,brand.accent];
  assert.ok(triple.every(x=>/^#[0-9A-F]{6}$/i.test(x)),`team ${id} uses valid six-digit hex colors`);
  assert.ok(contrast(brand.primary,'#FFFFFF')>=4.5,`team ${id} primary supports white UI text`);
  assert.ok(contrast(brand.secondary,'#101821')>=3,`team ${id} secondary remains visible on the dark game surface`);
  const key=triple.join('|');assert.ok(!seen.has(key),`team ${id} has its own full palette`);seen.add(key);
 }
 assert.equal(seen.size,120);
});

test('program color coverage reaches the core logo-enabled presentation surfaces',()=>{
 const src=fs.readFileSync(path.join(__dirname,'..','program-color-coverage.js'),'utf8');
 for(const marker of ['#top15 .rankrow','#confStandings .rankrow','#teamSchedule .resultrow','#recruitBattleBoard .battle-school','#stats .leader-row','#awardsBoard .award-card','#historyLog .historyrow','.player-hero-team-mark','.commitment-school','.broadcast-team','.matchup-team','.sb-team'])
  assert.ok(src.includes(marker),`${marker} participates in program color coverage`);
 assert.match(src,/DynastyProgramBranding/,'coverage uses the central numeric registry');
 assert.match(src,/brandTeamId/,'coverage leaves a numeric team-id marker for styling/QC');
});

test('standalone build loads program colors before visual identity and color coverage after logo coverage',()=>{
 const src=fs.readFileSync(path.join(__dirname,'..','tools','build.js'),'utf8');
 const registry=src.indexOf("read('program-branding.js')");
 const visual=src.indexOf("read('visual-identity.js')");
 const sports=src.indexOf("read('sports-presentation.js')");
 const recruiting=src.indexOf("read('recruit-presentation.js')");
 const coverage=src.indexOf("read('team-logo-coverage.js')");
 const colors=src.indexOf("read('program-color-coverage.js')");
 assert.ok([registry,visual,sports,recruiting,coverage,colors].every(x=>x>=0),'all identity/presentation sources are part of the standalone build');
 assert.ok(registry<visual,'numeric program registry exists before the active-team visual layer runs');
 assert.ok(coverage>sports&&coverage>recruiting,'real-logo coverage still runs after legacy presentation layers');
 assert.ok(colors>coverage,'program color coverage runs after logos expose numeric team identity');
});
