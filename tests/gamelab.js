const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('a detailed game records when it was played, not just who played',async()=>{
 const e=await setup(3201),u=e.universe;
 e.simulateUserDetailed();
 const d=u.lastDetailedGame;
 assert.ok(d,'the detailed game is captured');
 assert.equal(d.season,u.year,'stamped with the season it happened in');
 assert.equal(d.week,1,'and the scheduled week, so the Game Lab can never imply it is current');
 assert.ok(Array.isArray(d.drives)&&d.drives.length>0,'and it still carries the detail that is the point of the Game Lab');
});

test('simming your own game from the dashboard supersedes a stale detailed game',async()=>{
 const e=await setup(3202),u=e.universe;
 // Play week 1 in the Game Lab, then advance past it and sim week 2 from the dashboard.
 e.simulateUserDetailed();
 assert.ok(u.lastDetailedGame,'detail exists after the Game Lab run');
 e.simWeek();                                   // week 1's remaining games; ours was already played
 assert.ok(u.lastDetailedGame,'a game already played in the Game Lab keeps its detail');
 assert.equal(u.week,1);
 e.simWeek();                                   // week 2: the fast engine plays our game
 assert.equal(u.lastDetailedGame,null,'once the dashboard plays our game, the stale detail is dropped');
});

test('other teams simming never clears your detailed game',async()=>{
 const e=await setup(3203),u=e.universe,me=e.T('Chicago Metropolitan');
 e.simulateUserDetailed();
 const before=u.lastDetailedGame;
 assert.ok(before);
 // Our week-1 game is already played, so this week only advances other programs' games.
 e.simWeek();
 assert.equal(u.lastDetailedGame,before,'untouched — only our own game being fast-simmed supersedes it');
});

test('a full season of dashboard simming never leaves stale detail behind',async()=>{
 const e=await setup(3204),u=e.universe;
 e.simulateUserDetailed();
 assert.ok(u.lastDetailedGame);
 e.simSeason();
 assert.equal(u.lastDetailedGame,null,'fast-forwarding a season clears it like any dashboard sim');
});
