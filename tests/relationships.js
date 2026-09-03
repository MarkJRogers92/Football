const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

function setup(seed=951){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');return e.loadSchools().then(()=>{e.initUniverse();return e});
}

test('primary recruiter relationship follows the same coach without auto-flipping a commit',async()=>{
 const e=await setup(951),u=e.universe,from=u.teams[0],to=u.teams[1],c=from.staff.RC,r=u.recruits[0];
 r.coachRelationships={[c.id]:86};r.primaryRecruiterCoachId=c.id;r.committed=from.name;
 const fromBoost=e.recruitCoachRelationshipBoost(from,r),toBoost=e.recruitCoachRelationshipBoost(to,r);
 assert.ok(fromBoost>5);assert.equal(toBoost,0);
 e.moveCoach(c,from,to,'RC','Accepted a new recruiting coordinator job');
 assert.equal(to.staff.RC.id,c.id);assert.equal(r.committed,from.name,'coach movement creates pressure, not an automatic flip');
 assert.equal(e.recruitCoachRelationshipBoost(from,r),0);assert.ok(e.recruitCoachRelationshipBoost(to,r)>5);
 assert.equal(r.coachDeparturePressure.toSchoolId,to.id);assert.ok(r.coachDeparturePressure.strength>0);
 const fallout=u.events.filter(x=>x.type==='COACH_RELATIONSHIP_FALLOUT'&&x.coachIds.includes(c.id));
 assert.equal(fallout.length,1);assert.ok(fallout[0].metadata.recruitsAffected>=1);
});

test('players tied to a departing recruiter gain transfer risk and destination pressure while unrelated players do not',async()=>{
 const e=await setup(952),u=e.universe,from=u.teams[0],to=u.teams[1],c=from.staff.RC,p=from.roster[0],q=from.roster[1];
 p.primaryRecruiterCoachId=c.id;p.recruitingMemory={recruiterCoachId:c.id,relationship:88};p.coachRelationships={[c.id]:88};p.morale=70;p.role='Starter mix';
 q.coachRelationships={};q.primaryRecruiterCoachId=null;q.morale=70;q.role='Starter mix';
 const p0=e.transferRisk(p),q0=e.transferRisk(q);
 e.moveCoach(c,from,to,'RC','Accepted a new recruiting coordinator job');
 assert.ok(e.transferRisk(p)>p0);assert.equal(e.transferRisk(q),q0);
 const fit=e.transferFit(p,to,from,'PLAYING_TIME');assert.ok(fit.relationship>=88);assert.ok(fit.follow>0);
 assert.equal(p.coachDeparturePressure.toSchoolId,to.id);assert.equal(q.coachDeparturePressure,undefined);
});

test('firing creates bounded relationship fallout even without a destination and is idempotent',async()=>{
 const e=await setup(953),u=e.universe,t=u.teams[0],c=t.staff.OC,p=t.roster.find(x=>['QB','RB','WR','TE','OT','OG','C'].includes(x.pos))||t.roster[0];
 p.primaryRecruiterCoachId=c.id;p.coachRelationships={[c.id]:80};p.morale=50;p.role='Starter mix';
 const before=e.transferRisk(p),first=e.applyCoachRelationshipChange(c,t,null,'Fired after the season'),count=u.events.length,second=e.applyCoachRelationshipChange(c,t,null,'Fired after the season');
 assert.ok(first.playersAffected>=1);assert.deepEqual(second,first);assert.equal(u.events.length,count);
 assert.equal(p.coachDeparturePressure.toSchoolId,null);assert.ok(e.transferRisk(p)>before);
 e.replaceStaffCoach(t,'OC','Fired after the season','FIRED',u.year+1);
 assert.equal(u.events.filter(x=>x.type==='COACH_RELATIONSHIP_FALLOUT'&&x.coachIds.includes(c.id)).length,1);
});

test('commitment captures a stable primary recruiter and player metadata survives portable save/load',async()=>{
 const e=await setup(954),u=e.universe,t=u.teams[0],r=u.recruits.find(x=>!x.committed);
 r.targeted=true;r.relationship=78;assert.ok(e.commitRecruit(r,t.name));assert.ok(r.primaryRecruiterCoachId);assert.ok(r.coachRelationships[r.primaryRecruiterCoachId]>=78);
 assert.equal(r.recruitingMemory.recruiterCoachId,r.primaryRecruiterCoachId);
 const p=e.generatePlayer(t,r.pos,99);p.recruitingMemory=structuredClone(r.recruitingMemory);p.primaryRecruiterCoachId=r.primaryRecruiterCoachId;p.coachRelationships=structuredClone(r.coachRelationships);p.currentSchoolId=t.id;t.roster.push(p);
 const id=p.id,expected=structuredClone({primary:p.primaryRecruiterCoachId,rels:p.coachRelationships});
 const portable=JSON.parse(JSON.stringify(e.packUniverse(u)));e.installSave({version:'0.9.5',userTeam:t.name,universe:portable});
 const loaded=e.findPlayer(id).p;assert.equal(loaded.primaryRecruiterCoachId,expected.primary);assert.deepEqual(loaded.coachRelationships,expected.rels);
});

test('bounded coach destination never selects the controlled program or the source',async()=>{
 const e=await setup(955),u=e.universe,from=u.teams[1],c=from.staff.OC,changed=new Map(u.teams.map(t=>[t.id,new Set()])),moved=new Set();
 const dest=e.chooseCoachMoveDestination(c,from,'OC',changed,moved);assert.ok(dest);assert.notEqual(dest.id,from.id);assert.notEqual(dest.name,'Chicago Metropolitan');
});
