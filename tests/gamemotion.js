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
