const test = require('node:test');
const assert = require('node:assert/strict');
const {loadEngine} = require('../tools/harness');

async function setup() {
  const e = loadEngine({seed: 17041});
  e.setUserTeam('Chicago Metropolitan');
  await e.loadSchools();
  e.initUniverse();
  return {e, team: e.T('Chicago Metropolitan'), recruit: e.universe.recruits[0]};
}

test('the recruit explanation shows the actual prestige contributions', async () => {
  const {e, team, recruit} = await setup();
  team.prestige = 80;
  recruit.priority = 'Prestige';
  const parts = new Map(e.recruitPitchBreakdown(team, recruit));
  assert.equal(parts.get('Program prestige'), 33.6);
  assert.equal(parts.get('Prestige priority'), 17.6);
  team.prestige = 90;
  const next = new Map(e.recruitPitchBreakdown(team, recruit));
  assert.equal(next.get('Program prestige'), 37.8);
  assert.equal(next.get('Prestige priority'), 19.8);
});

test('the explanation includes baseline academics and the current record', async () => {
  const {e, team, recruit} = await setup();
  team.academics = 80;
  team.w = 6;
  team.l = 2;
  recruit.priority = 'Development';
  const parts = new Map(e.recruitPitchBreakdown(team, recruit));
  assert.equal(parts.get('Academics'), 4.8);
  assert.equal(parts.get('Season record'), 2.8);
});

test('all priority explanations reconcile with the real pitch without consuming randomness', async () => {
  const {e, team, recruit} = await setup();
  team.w = 5; team.l = 3;
  const before = JSON.stringify(e.packUniverse(e.universe).rng);
  for (const priority of ['Prestige','NIL','Development','Early Role','Coaching','Academics','Scheme Fit','Winning','Stay Close','Campus Life']) {
    recruit.priority = priority;
    recruit.nilDeal = {year:e.universe.year,schoolId:team.id,amount:2};
    const parts = e.recruitPitchBreakdown(team, recruit);
    const total = parts.reduce((sum, [, value]) => sum + value, 0);
    assert.equal(total, e.recruitPitch(team, recruit), `${priority}: shown contributions must explain the pitch`);
    assert.equal(new Map(parts).get('NIL deal'), 6);
  }
  assert.equal(JSON.stringify(e.packUniverse(e.universe).rng), before);
});
