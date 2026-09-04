const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

test('drive replay presents immutable outcomes without inventing field position',()=>{
 const e=loadEngine();
 const game={
  away:{name:'Lake City'},home:{name:'Prairie Tech'},
  drives:[
   {side:'away',label:'A1',plays:6,result:'TD',points:7},
   {side:'home',label:'H1',plays:4,result:'PUNT',points:0},
   {side:'away',label:'A2',plays:8,result:'FG',points:3},
   {side:'home',label:'H2',plays:9,result:'TD',points:7},
  ],
 };
 const frozen=JSON.stringify(game),html=e.gameDrivesHTML(game);
 assert.equal((html.match(/data-drive-step=/g)||[]).length,4);
 assert.match(html,/data-away-score="10" data-home-score="7"/);
 assert.match(html,/exact field position, clock and possession time were not retained/);
 assert.match(html,/aria-live="polite"/);
 assert.equal(JSON.stringify(game),frozen,'presentation must not alter the archived game');
 assert.match(e.gameDrivesHTML({...game,drives:[]}),/No drive detail recorded/);
});

test('watch mode hides the final and exposes broadcast controls without changing the game',()=>{
 const e=loadEngine();
 const game={
  away:{name:'Lake City'},home:{name:'Prairie Tech'},score:{away:10,home:10},scoreAdjustment:{home:3,away:0},
  drives:[
   {side:'away',label:'A1',plays:6,result:'TD',points:7},
   {side:'home',label:'H1',plays:4,result:'PUNT',points:0},
   {side:'away',label:'A2',plays:8,result:'FG',points:3},
   {side:'home',label:'H2',plays:9,result:'TD',points:7},
  ],
 };
 const frozen=JSON.stringify(game),html=e.gameWatchHTML(game);
 assert.equal((html.match(/data-watch-drive=/g)||[]).length,4);
 assert.equal((html.match(/class="watch-drive"[^>]* hidden/g)||[]).length,4);
 assert.match(html,/data-watch-play/);
 assert.match(html,/data-watch-next/);
 assert.match(html,/data-watch-speed/);
 assert.match(html,/data-watch-skip/);
 assert.match(html,/calculated once before this broadcast begins/);
 assert.equal(JSON.stringify(game),frozen,'watch presentation must not alter the archived game');
 assert.match(e.gameWatchHTML({...game,drives:[]}),/Watch Mode unavailable/);
});

test('detailed drive volume varies with tempo and game flow',()=>{
 const e=loadEngine({seed:931});
 const fast=e.OFF_SCHEMES['Tempo Spread'],slow=e.OFF_SCHEMES['Heavy Play Action'],balanced=e.OFF_SCHEMES.Multiple;
 assert.ok(e.detailedDriveCount(fast,fast,0)>e.detailedDriveCount(slow,slow,0),'tempo should move the neutral drive target');
 assert.equal(e.detailedDriveCount(fast,fast,100),30);
 assert.equal(e.detailedDriveCount(slow,slow,-100),18);
 const counts=Array.from({length:80},()=>e.detailedDriveCount(balanced,balanced));
 assert.ok(counts.every(n=>n>=18&&n<=30));
 assert.ok(new Set(counts).size>=5,'game-level variance should produce several drive totals');
});
