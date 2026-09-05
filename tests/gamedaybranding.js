const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('v0.9.44 defines ten distinct canonical conference identities',()=>{
 const context={window:{}};vm.runInNewContext(read('conference-branding.js'),context);
 const branding=context.window.DynastyConferenceBranding;
 assert.ok(branding,'conference branding registry is exposed');
 assert.deepEqual(Array.from(branding.names),['Great Lakes','Northeast','Atlantic','Southeastern','Gulf','Heartland','Southwest','Mountain','Pacific','Metro']);
 const palettes=new Set(),shorts=new Set();
 for(const name of branding.names){
  const identity=branding.identity(name);
  assert.match(identity.primary,/^#[0-9A-F]{6}$/i);
  assert.match(identity.secondary,/^#[0-9A-F]{6}$/i);
  assert.match(identity.accent,/^#[0-9A-F]{6}$/i);
  assert.ok(identity.tagline.length>=10,`${name} has a real identity line`);
  assert.ok(!palettes.has(`${identity.primary}|${identity.secondary}|${identity.accent}`),`${name} palette is distinct`);
  assert.ok(!shorts.has(identity.short),`${name} crest abbreviation is distinct`);
  palettes.add(`${identity.primary}|${identity.secondary}|${identity.accent}`);shorts.add(identity.short);
 }
 assert.equal(palettes.size,10);assert.equal(shorts.size,10);
});

test('Game Lab exposes only real engine facts to the presentation layer',()=>{
 const app=read('app.js');
 for(const field of ['data-user-record','data-opponent-record','data-user-rank','data-opponent-rank','data-user-conference','data-opponent-conference','data-venue','data-stakes','data-rivalry','data-active-plan','data-recommended-plan'])
  assert.ok(app.includes(field),`${field} is present on the structured game-day handoff`);
 assert.ok(app.includes('rivalrySeriesText(u)'),'rivalry presentation uses the persisted series, not invented copy');
 assert.ok(app.includes('homeTeam.city')&&app.includes('homeTeam.state'),'venue presentation uses canonical school geography');
});

test('conference and game-day presentation covers core surfaces and build order',()=>{
 const sports=read('sports-presentation.js'),build=read('tools/build.js');
 for(const marker of ['#teamMeta','#confStandings','#latestResults','.gameday-data','gameday-intel','gameday-recommendation','conference-banner','conference-result-label'])
  assert.ok(sports.includes(marker),`${marker} participates in v0.9.44 presentation`);
 const confRegistry=build.indexOf("read('conference-branding.js')"),sportsLayer=build.indexOf("read('sports-presentation.js')");
 assert.ok(confRegistry>=0&&confRegistry<sportsLayer,'conference registry loads before sports presentation');
 assert.ok(build.includes("read('conference-branding.css')"),'conference identity CSS is included in the standalone build');
});
