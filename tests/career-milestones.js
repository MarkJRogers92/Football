const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('a season digest counts wins, titles and streaks without double counting',()=>{
 const {tenureDigest}=loadEngine({seed:1,fullRuntime:true});
 const d=tenureDigest([
  {w:12,l:0,champ:true,confChamp:true},
  {w:11,l:2,champ:true,confChamp:false},
  {w:4,l:8,champ:false,confChamp:false},
  {w:9,l:3}
 ]);
 assert.deepEqual(d,{w:36,l:13,titles:2,confTitles:1,winningSeasons:3,bestWins:12,perfectSeasons:1,repeatTitles:1});
 assert.equal(tenureDigest([]).w,0);assert.equal(tenureDigest(undefined).bestWins,0);
});

test('a brand-new career has no milestones and a plain progress readout',async()=>{
 const e=await setup(3201);
 const rows=e.careerMilestoneStatus();
 assert.ok(rows.length>=10);
 assert.equal(rows.filter(r=>r.done).length,0);
 assert.ok(rows.every(r=>r.value===0&&r.target>0));
});

test('milestones are reached once, remembered with the season, and surface on the hub',async()=>{
 const e=await setup(3202),t=e.T('Chicago Metropolitan');
 e.universe.tenure={startYear:e.universe.year,school:t.name,seasons:[{year:e.universe.year,w:11,l:1,champ:true,confChamp:true}],ended:null,closed:false};
 const first=e.updateCareerMilestones();
 for(const id of ['first-win','winning-season','ten-wins','conf-title','national-title'])assert.ok(first.includes(id),`${id} reached`);
 assert.ok(!first.includes('perfect')&&!first.includes('repeat'));
 assert.equal(e.universe.milestones['national-title'],e.universe.year);
 assert.deepEqual(e.updateCareerMilestones(),[],'a second pass reaches nothing new');
 assert.ok(e.milestoneHubItems().some(i=>/National champions/.test(i.main)),'this season’s milestones show on the hub');
 e.universe.year+=1;
 assert.equal(e.milestoneHubItems().length,0,'and age out of the hub');
});

test('closing a post keeps its digest so milestones survive a job change',async()=>{
 const e=await setup(3203),t=e.T('Chicago Metropolitan');
 e.universe.tenure={startYear:e.universe.year,school:t.name,seasons:[{w:10,l:2,champ:true},{w:12,l:0,champ:true}],ended:null,closed:false};
 e.closeTenure('let go');
 const post=e.universe.careerHistory.at(-1);
 assert.equal(post.titles,2);assert.equal(post.repeatTitles,1);assert.equal(post.perfectSeasons,1);
 const stats=e.careerMilestoneStats();
 assert.equal(stats.titles,2);assert.equal(stats.bestWins,12);
 e.universe.tenure={startYear:e.universe.year+1,school:t.name,seasons:[{w:3,l:9}],ended:null,closed:false};
 assert.equal(e.careerMilestoneStats().w,25,'new post adds to the old one');
 assert.equal(e.careerMilestoneStats().bestWins,12,'best season carries over');
});

test('reviewing a real season records the title flags the digest reads',async()=>{
 const e=await setup(3204),t=e.T('Chicago Metropolitan');
 t.w=12;t.l=0;t.champ=true;
 e.universe.tenure={startYear:e.universe.year,school:t.name,seasons:[],ended:null,closed:false};
 const review=e.reviewControlledProgram(t);
 assert.equal(review.champ,true);
 assert.ok(e.universe.milestones['national-title']!==undefined,'the review updates milestones');
});
