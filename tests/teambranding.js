const {test}=require('node:test');
const assert=require('node:assert/strict');
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
 const {loadEngine}=require('../tools/harness');
 const e=loadEngine({seed:1});
 // Spec: index = id-1, col = index % 12, row = floor(index/12). Spot-check the handoff's own list.
 const cases=[[1,0,0],[12,11,0],[13,0,1],[24,11,1],[45,8,3],[48,11,3],[49,0,4],[73,0,6],[85,0,7],[97,0,8],[109,0,9],[120,11,9]];
 for(const [id,col,row] of cases){
  const html=e.teamLogoHTML(id,32);
  assert.ok(html.includes(`-${col*32}px -${row*32}px`),`id ${id} -> col ${col} row ${row}: ${html}`);
 }
});

test('an invalid id gets a visible, styled fallback instead of a broken image or a thrown error',()=>{
 const {loadEngine}=require('../tools/harness');
 const e=loadEngine({seed:1});
 for(const bad of [0,121,-1,1.5,NaN,null,undefined,'not-a-number']){
  const html=e.teamLogoHTML(bad,24);
  assert.ok(html.includes('team-logo--fallback'),`bad id ${bad} falls back cleanly`);
  assert.ok(!html.includes('background-image'),'the fallback never points at the atlas at all');
 }
});

test('logo size scales the cell and the background-size together, keeping the same cell visible',()=>{
 const {loadEngine}=require('../tools/harness');
 const e=loadEngine({seed:1});
 const html=e.teamLogoHTML(13,40);   // id 13 -> col 0, row 1 per the spec
 assert.ok(html.includes('width:40px;height:40px'));
 assert.ok(html.includes('background-size:480px 400px'),'12 cols/10 rows scaled to the requested size');
 assert.ok(html.includes('-0px -40px'),'row 1 at size 40 shifts by exactly one cell height');
});
