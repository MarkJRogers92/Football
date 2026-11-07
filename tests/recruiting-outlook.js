const test=require('node:test');
const assert=require('node:assert/strict');
const {rosterOutlook}=require('../recruiting-needs');
const {loadEngine}=require('../tools/harness');

test('outlook keeps projected roster, commitments and future watches separate',()=>{
 const snap={players:[{pos:'QB',year:'SR'},{pos:'QB',year:'JR'},{pos:'WR',year:'FR'}],committed:{QB:1},targeted:{QB:4},watched:{QB:5},departuresDone:false};
 const before=JSON.stringify(snap),rows=rosterOutlook(snap,{QB:3,WR:5});
 assert.deepEqual(rows[0],{pos:'QB',target:3,current:2,departing:1,returning:1,committed:1,targeted:4,watched:5,projected:2,gap:1});
 assert.equal(rows[1].gap,4);
 assert.equal(JSON.stringify(snap),before);
});

test('processed departures and enrolled commitments are not counted twice',()=>{
 const rows=rosterOutlook({players:[{pos:'QB',year:'SR'},{pos:'QB',year:'FR'}],committed:{QB:1},departuresDone:true,enrolled:true},{QB:3});
 assert.equal(rows[0].departing,0,'promoted seniors are already part of the next roster');
 assert.equal(rows[0].returning,2);
 assert.equal(rows[0].committed,0,'enrolled freshmen are already in the roster');
 assert.equal(rows[0].projected,2);
});

test('read-only bridge distinguishes current commitments and rising watches',async()=>{
 const e=loadEngine({seed:6031});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse('dynasty',{seed:'outlook'});
 const t=e.T('Chicago Metropolitan'),current=e.universe.recruits[0],future=e.universe.risingClass[0];
 current.pos='QB';current.committed=t.name;future.pos='QB';future.watch=true;
 const rng=JSON.stringify(e.packUniverse(e.universe).rng),snap=globalThis.DynastyRecruitingNeeds.snapshot();
 assert.equal(snap.year,2027);assert.equal(snap.committed.QB,1);assert.equal(snap.watched.QB,1);
 assert.equal(JSON.stringify(e.packUniverse(e.universe).rng),rng);
 e.universe.phase='complete';e.universe.offseason=e.makeOffseasonState(2027,'portal',['review','departures','signing']);
 const enrolled=globalThis.DynastyRecruitingNeeds.snapshot();
 assert.equal(enrolled.departuresDone,true);assert.equal(enrolled.enrolled,true);
 e.universe.offseason.year=2026;
 assert.equal(globalThis.DynastyRecruitingNeeds.snapshot().enrolled,false,'a prior class checkpoint does not mark the current class enrolled');
});
