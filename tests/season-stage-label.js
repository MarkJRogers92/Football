const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.12.30: the Season tab showed engine terms ("2027 · regular · Week 0") while the header
// said "Opening week". One label now serves both surfaces.
test('season stage reads as copy, never as engine phase keys',async()=>{
 const e=loadEngine({seed:9801});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 const label=(phase,week)=>e.seasonStageLabel({phase,week});
 assert.equal(label('preseason',0),'Preseason');
 assert.equal(label('regular',0),'Regular season · Week 1');
 assert.equal(label('regular',7),'Regular season · Week 8','the label names the week being prepared, as the briefing and Game Day do');
 assert.equal(label('confReady',12),'Conference championships');
 assert.equal(label('bowlReady',12),'Bowl season');
 assert.equal(label('playoffReady',12),'Playoff');
 assert.equal(label('complete',12),'Season complete');
 for(const phase of ['regular','confReady','bowlReady','playoffReady','complete'])
  assert.doesNotMatch(label(phase,3),/confReady|bowlReady|playoffReady|^regular\b|Week 0\b/,`${phase} leaks a raw engine key`);
 assert.equal(label('mystery',4),'mystery · Week 4','an unknown phase still renders something');
});
