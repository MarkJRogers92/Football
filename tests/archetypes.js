const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

test('every internal style has complete player-facing metadata',()=>{
 const e=loadEngine({seed:953});
 for(const style of Object.values(e.STYLES).flat()){
  const meta=e.ARCHETYPE_META[style];
  assert.ok(meta,`${style} is missing metadata`);
  assert.ok(meta.display,`${style} is missing a display label`);
  assert.ok(meta.short,`${style} is missing a description`);
  assert.deepEqual(meta.strengths,e.STYLE_TRAITS[style]);
 }
});

test('display renames preserve canonical simulation keys',()=>{
 const e=loadEngine({seed:954});
 const player={pos:'OT',style:'Power Edge',power:88,durability:82,technique:80,trueNow:78};
 assert.equal(e.archetypeLabel(player.style),'Power Tackle');
 assert.equal(player.style,'Power Edge');
 assert.equal(e.styleForTraits('OT',player,0),'Power Edge');
 assert.ok(e.STYLE_USAGE[player.style]);
 assert.match(e.archetypeChipHTML(player.style),/>Power Tackle<\/button>/);
});

test('archetype metadata does not consume simulation randomness',()=>{
 const decorated=loadEngine({seed:955}),before=decorated.gameplayRandom();
 for(const style of Object.values(decorated.STYLES).flat())decorated.archetypeMeta(style);
 const after=decorated.gameplayRandom(),plain=loadEngine({seed:955});
 assert.equal(before,plain.gameplayRandom());
 assert.equal(after,plain.gameplayRandom());
});
