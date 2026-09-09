const test=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function engine(seed){const e=loadEngine({seed,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.createNewDynasty();return e}

test('setup migration treats existing dynasties as complete and remains idempotent',async()=>{
  const e=await engine(12101),u=e.universe;
  delete u.setup;delete u.setupCompleted;
  const first=e.migrateNewDynastySetupState(u),snapshot=JSON.stringify(u);
  assert.deepEqual(first,{version:1,completed:true,source:'legacy'});
  assert.equal(u.setupCompleted,true);
  e.migrateNewDynastySetupState(u);
  assert.equal(JSON.stringify(u),snapshot);
});

test('an explicit in-progress setup is not mistaken for a legacy dynasty',async()=>{
  const e=await engine(12102),u=e.universe;
  u.setup={version:1,completed:false,source:'take-the-job',coachName:'Test Coach'};
  u.setupCompleted=true;
  e.migrateNewDynastySetupState(u);
  assert.equal(u.setup.completed,false);
  assert.equal(u.setupCompleted,false);
  assert.equal(u.setup.coachName,'Test Coach');
});
