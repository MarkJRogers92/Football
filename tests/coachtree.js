const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

// A coach whose recorded career runs: your program first, then somewhere else.
const branch=(e,me,other,{role='Offensive Coordinator',laterRole='Head Coach',start=2027,end=2029}={})=>{
 const c=me.staff.OC;
 c.careerHistory=[{schoolId:me.id,schoolName:me.name,role,startSeason:start,endSeason:end,reasonEnded:'Left'},
  {schoolId:other.id,schoolName:other.name,role:laterRole,startSeason:end+1,endSeason:null}];
 return c;
};

test('a branch is someone who worked here and then left, not anyone who passed through',async()=>{
 const e=await setup(2801),u=e.universe,me=e.T('Chicago Metropolitan');
 const other=u.teams.find(t=>t!==me);
 assert.equal(e.coachingTree(me).filter(x=>x.coachId===me.staff.OC.id).length,0,'a sitting coordinator is not a branch');
 const c=branch(e,me,other);
 const tree=e.coachingTree(me),mine=tree.find(x=>x.coachId===c.id);
 assert.ok(mine,'once he leaves for another job he is');
 assert.equal(mine.headCoach.schoolName,other.name);
 assert.equal(mine.under.role,'Offensive Coordinator');
 // Someone who was a head coach elsewhere BEFORE joining you is not something you produced.
 c.careerHistory=[{schoolId:other.id,schoolName:other.name,role:'Head Coach',startSeason:2020,endSeason:2024},
  {schoolId:me.id,schoolName:me.name,role:'Offensive Coordinator',startSeason:2025,endSeason:null}];
 assert.equal(e.coachingTree(me).filter(x=>x.coachId===c.id).length,0,
  'a prior head coach who came to work for you is not your branch');
});

test('head coaches produced are counted separately from staff merely placed',async()=>{
 const e=await setup(2802),u=e.universe,me=e.T('Chicago Metropolitan');
 const [a,b]=u.teams.filter(t=>t!==me).slice(0,2);
 branch(e,me,a);                                        // becomes a head coach
 const c2=me.staff.DC;
 c2.careerHistory=[{schoolId:me.id,schoolName:me.name,role:'Defensive Coordinator',startSeason:2027,endSeason:2029},
  {schoolId:b.id,schoolName:b.name,role:'Offensive Coordinator',startSeason:2030,endSeason:null}];
 assert.equal(e.coachingTree(me).length,2,'both moved on');
 assert.equal(e.treeHeadCoaches(me).length,1,'but only one runs a program');
 assert.ok(e.coachingTree(me)[0].headCoach,'head coaches sort first');
});

test('producing a head coach is worth prestige, once, not every season',async()=>{
 const e=await setup(2803),u=e.universe,me=e.T('Chicago Metropolitan');
 const other=u.teams.find(t=>t!==me);
 me.prestige=70;me.program_ceiling=100;me.coachTreeCredited=[];
 branch(e,me,other);
 const gain=e.creditCoachingTree(me);
 assert.equal(gain,1);
 assert.equal(me.prestige,71);
 assert.ok(u.events.some(x=>x.type==='COACH_TREE'));
 assert.equal(e.creditCoachingTree(me),0,'the same branch does not pay out again');
 assert.equal(me.prestige,71);
});

test('the credit is capped and respects the program ceiling',async()=>{
 const e=await setup(2804),u=e.universe,me=e.T('Chicago Metropolitan');
 const others=u.teams.filter(t=>t!==me).slice(0,4);
 me.prestige=70;me.coachTreeCredited=[];me.program_ceiling=100;
 const slots=['OC','DC','RC','HC'];
 others.forEach((o,i)=>{const c=me.staff[slots[i]];
  c.careerHistory=[{schoolId:me.id,schoolName:me.name,role:'Coordinator',startSeason:2027,endSeason:2029},
   {schoolId:o.id,schoolName:o.name,role:'Head Coach',startSeason:2030,endSeason:null}];});
 assert.equal(e.treeHeadCoaches(me).length,4,'four branches at once');
 assert.equal(e.creditCoachingTree(me),2,'but at most two points in a season');
 me.prestige=99;me.program_ceiling=99;me.coachTreeCredited=[];
 e.creditCoachingTree(me);
 assert.equal(me.prestige,99,'and never past the program ceiling');
});

test('the wire announces a new head coach and the card reads for an empty tree',async()=>{
 const e=await setup(2805),u=e.universe,me=e.T('Chicago Metropolitan');
 assert.equal(e.coachTreeHubItems(me).length,0,'nothing to say before anyone leaves');
 assert.ok(e.coachingTreeHTML?e.coachingTreeHTML(me).includes('Nobody'):true);
 const other=u.teams.find(t=>t!==me);
 branch(e,me,other,{start:u.year-3,end:u.year-1});
 const tiles=e.coachTreeHubItems(me);
 assert.equal(tiles.length,1);
 assert.equal(tiles[0].importance,62);
 assert.ok(tiles[0].main.includes(other.name));
});
