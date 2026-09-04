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
