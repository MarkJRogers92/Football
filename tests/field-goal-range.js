const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../game-engine-v2.js');
const decisions=require('../game-engine-v2-decisions.js');

// v0.17.2: staff once recommended a 59-yard field goal on 4th and 9 in the rain, because "in range" meant
// "past the opponent's 42" for every caller. One rule now decides it, from the odds of making the kick.
const at=(fieldPosition,distance=6,extra={})=>({down:4,distance,fieldPosition,period:2,clock:400,possession:'home',score:{home:7,away:7},...extra});

test('the make curve falls away past 52 yards',()=>{
 assert.ok(E.fieldGoalChance({},40)>.75,'a 40-yarder is routine');
 assert.ok(E.fieldGoalChance({},55)>=E.FG_TRY_CHANCE,'55 yards is the edge of the range');
 assert.ok(E.fieldGoalChance({},56)<E.FG_TRY_CHANCE,'56 yards is past it');
 assert.ok(E.fieldGoalChance({},59)<.3,'a 59-yarder is a long shot');
 assert.ok(E.fieldGoalChance({},66)<E.FG_OFFER_CHANCE,'nobody is offered a 66-yarder');
});

test('the default call never kicks from out of range',()=>{
 for(let fp=1;fp<=99;fp++)for(const distance of [1,2,3,5,8,12])for(const goShort of [false,true]){
  const state=at(fp,distance);
  if(E.defaultFourthDown(state,goShort)==='field_goal')assert.ok(E.fieldGoalDistance(state)<=55,`kicked from ${E.fieldGoalDistance(state)} yards (ball on ${fp}, 4th and ${distance})`);
 }
 assert.equal(E.defaultFourthDown(at(58,9)),'punt','4th and 9 at the opponent 42: punt, not a 59-yard kick');
 assert.equal(E.defaultFourthDown(at(60,4)),'play','4th and 4 in no-man\'s land: keep the ball');
 assert.equal(E.defaultFourthDown(at(66,6)),'field_goal','a 51-yarder is still a kick');
});

test('wind and rain shorten the range',()=>{
 const rules=E.normalizeRules({conditions:{wind:26,precip:2,sky:'rain'}});
 const calm=at(63,6),wet={...at(63,6),rules};
 assert.equal(E.fieldGoalInRange(calm),true,'a 54-yarder is in range on a calm day');
 assert.ok(E.effectsOf(wet).fgFlat>0,'the conditions reach the kick');
 assert.equal(E.fieldGoalInRange(wet),false,'the same kick is out of range in wind and rain');
});

test('a coach is not offered a kick that cannot be made',()=>{
 const g=E.createGame({gameId:'fg-offer',seed:'fg-offer',home:{id:1,name:'Home'},away:{id:2,name:'Away'}});E.startGame(g);
 Object.assign(g,{possession:'home',down:4,distance:9,fieldPosition:58});
 const far=decisions.ensureDecision(g);
 assert.equal(far.staffRecommendation,'punt');
 assert.ok(far.options.some(o=>o.id==='field_goal'),'a 59-yarder stays on the card as a long shot');
 Object.assign(g,{fieldPosition:50,pendingCoachingDecision:null});
 const midfield=decisions.ensureDecision(g);
 assert.ok(!midfield.options.some(o=>o.id==='field_goal'),'a 67-yarder is not offered');
});
