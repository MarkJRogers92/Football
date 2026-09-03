const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function setup(seed){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e;
}
const otherScheme=(e,side,cur)=>Object.keys(side==='off'?e.OFF_SCHEMES:e.DEF_SCHEMES).find(s=>s!==cur);

test('a coordinator who runs a different system starts an installation; one who does not, does not',async()=>{
 const e=await setup(1001),t=e.universe.teams[0];
 assert.equal(e.schemeTransition(t,'off'),null,'a new dynasty is not mid-installation');
 // Hiring a coordinator who already runs the house system changes nothing.
 const sameGuy={...t.staff.OC,id:'C_same',preferredScheme:t.offScheme};
 t.staff.OC=sameGuy;e.applyCoachScheme(sameGuy,'OC',t,'test');
 assert.equal(e.schemeTransition(t,'off'),null,'matching schemes must not start a transition');
 const was=t.offScheme,to=otherScheme(e,'off',was);
 const newGuy={...t.staff.OC,id:'C_new',preferredScheme:to,adaptability:70};
 t.staff.OC=newGuy;e.applyCoachScheme(newGuy,'OC',t,'test hire');
 const tr=e.schemeTransition(t,'off');
 assert.ok(tr,'a different system must start an installation');
 assert.equal(t.offScheme,to);assert.equal(tr.from,was);assert.equal(tr.to,to);
 assert.ok(tr.familiarity>=20&&tr.familiarity<=55,`unexpected starting familiarity ${tr.familiarity}`);
 assert.equal(e.schemeTransition(t,'def'),null,'the other side of the ball is untouched');
});

test('installation progresses through camp and finishes, year one costing the most',async()=>{
 const e=await setup(1002),t=e.universe.teams[0];
 e.setTeamScheme(t,'off',otherScheme(e,'off',t.offScheme),'test');
 const start=e.schemeFamiliarity(t,'off');
 e.advanceSchemeInstall(t,'spring');
 const afterSpring=e.schemeFamiliarity(t,'off');
 e.advanceSchemeInstall(t,'fall');
 const afterFall=e.schemeFamiliarity(t,'off');
 assert.ok(afterSpring>start&&afterFall>afterSpring,'camp must install the system');
 assert.ok(afterSpring-start>=afterFall-afterSpring,'spring should teach more than fall camp');
 for(let i=0;i<6;i++){e.advanceSchemeInstall(t,'spring');e.advanceSchemeInstall(t,'fall')}
 assert.equal(e.schemeTransition(t,'off'),null,'the installation must eventually complete and clear');
 assert.equal(e.schemeFamiliarity(t,'off'),100);
});

test('a scheme change costs fit, not ratings, and the cost fades as it installs',async()=>{
 const e=await setup(1003),t=e.universe.teams[0],to=otherScheme(e,'off',t.offScheme);
 // Pick the player who suits the incoming system least.
 const loser=t.roster.filter(p=>e.OFF_POS?.has?.(p.pos)??['QB','RB','WR','TE','OT','OG','C'].includes(p.pos))
  .map(p=>({p,d:e.schemeFitFor(p,e.schemeDefFor('off',to))-e.schemeFitFor(p,e.schemeDefFor('off',t.offScheme))}))
  .sort((a,b)=>a.d-b.d)[0].p;
 const ratings={trueNow:loser.trueNow,perceived:loser.perceived,speed:loser.speed,power:loser.power,technique:loser.technique};
 const fitBefore=e.playerSchemeFit(loser,t);
 e.setTeamScheme(t,'off',to,'test');
 const fitDuring=e.playerSchemeFit(loser,t);
 assert.ok(fitDuring<fitBefore,'a player who suited the old system should lose fit');
 for(const k of Object.keys(ratings))
  assert.equal(loser[k],ratings[k],`a scheme change must not touch ${k} — the cost is fit, not a rating penalty`);
 // The drag shrinks as the system is installed.
 e.advanceSchemeInstall(t,'spring');e.advanceSchemeInstall(t,'fall');
 const fitLater=e.playerSchemeFit(loser,t);
 for(let i=0;i<6;i++){e.advanceSchemeInstall(t,'spring');e.advanceSchemeInstall(t,'fall')}
 const fitInstalled=e.playerSchemeFit(loser,t);
 assert.ok(fitLater>=fitDuring,'fit should recover as the system installs');
 assert.ok(fitInstalled>=fitLater);
});

test('losing your fit in a new system raises transfer risk; keeping it does not',async()=>{
 const e=await setup(1004),t=e.universe.teams[0],to=otherScheme(e,'off',t.offScheme);
 const scored=t.roster.filter(p=>['QB','RB','WR','TE','OT','OG','C'].includes(p.pos))
  .map(p=>({p,d:e.schemeFitFor(p,e.schemeDefFor('off',to))-e.schemeFitFor(p,e.schemeDefFor('off',t.offScheme))}))
  .sort((a,b)=>a.d-b.d);
 const loser=scored[0].p,gainer=scored[scored.length-1].p;
 // Keep both off the floor of the clamp so the scheme term is observable.
 loser.morale=50;gainer.morale=50;
 const before={loser:e.transferRisk(loser),gainer:e.transferRisk(gainer)};
 e.setTeamScheme(t,'off',to,'test');
 assert.ok(e.schemeFitPressure(loser)>0,'a player who no longer fits should feel scheme pressure');
 assert.ok(e.transferRisk(loser)>before.loser,'a player who no longer fits should be likelier to leave');
 assert.equal(e.schemeFitPressure(gainer),0,'a player who fits the new system gains no transfer pressure');
 assert.equal(e.transferRisk(gainer),before.gainer);
 // Defensive players are unaffected by an offensive change.
 const dl=t.roster.find(p=>p.pos==='LB');
 assert.equal(e.schemeFitPressure(dl),0,'an offensive install must not push defenders out');
});

test('an older save keeps its system instead of inventing an installation',async()=>{
 const e=await setup(1005),u=e.universe,t=u.teams[0],off=t.offScheme,def=t.defScheme;
 // A v0.9.9 save has neither scheme preferences nor a transition field.
 for(const team of u.teams){delete team.schemeTransition;for(const c of Object.values(team.staff))delete c.preferredScheme}
 const portable=JSON.parse(JSON.stringify(e.packUniverse(u)));
 e.installSave({version:'0.9.9',userTeam:t.name,universe:portable});
 const again=e.universe.teams.find(x=>x.id===t.id);
 assert.equal(again.offScheme,off,'migration must not change the system a program runs');
 assert.equal(again.defScheme,def);
 assert.equal(e.schemeTransition(again,'off'),null,'migration must not start an installation nobody asked for');
 assert.equal(e.schemeTransition(again,'def'),null);
 assert.equal(again.staff.OC.preferredScheme,off,'an inherited coordinator runs what the program runs');
 assert.equal(again.staff.DC.preferredScheme,def);
});

test('a standing Position Lock promise makes a player refuse the move',async()=>{
 const e=await setup(1006),t=e.universe.teams[0];
 const p=t.roster.find(x=>x.pos==='WR');
 p.role='Starter';p.staffTrust=70;p.morale=70;p.promises=[];
 const open=e.positionChangeWillingness(p,t,'CB');
 p.promises=[{id:'PR_x',type:'POSITION_LOCK',status:'ACTIVE',targetPosition:'WR',firstSeason:e.universe.year-1,notes:[]}];
 const locked=e.positionChangeWillingness(p,t,'CB');
 assert.ok(locked.score<open.score,'a position promise must count against the move');
 assert.equal(locked.state,'REFUSES');
 assert.ok(locked.reasons.some(r=>/promised/.test(r)),'the refusal should say why');
});

test('a buried player is willing, an entrenched starter is not, and forcing it costs morale and trust',async()=>{
 const e=await setup(1007),t=e.universe.teams[0];
 const base=()=>{const p=structuredClone(t.roster.find(x=>x.pos==='RB'));p.promises=[];p.staffTrust=70;p.morale=70;return p};
 const buried=base();buried.role='Development';
 const starter=base();starter.role='Starter';
 assert.ok(e.positionChangeWillingness(buried,t,'WR').score>e.positionChangeWillingness(starter,t,'WR').score,
  'a buried player should be more open to moving than a starter');
 const p=base();p.morale=70;p.staffTrust=70;
 assert.equal(e.applyPositionChangeCost(p,'RELUCTANT'),true);
 assert.ok(p.morale<70&&p.staffTrust<70,'forcing a reluctant move must cost morale and staff trust');
 const willing=base();willing.morale=70;willing.staffTrust=70;
 assert.equal(e.applyPositionChangeCost(willing,'EAGER'),false);
 assert.equal(willing.staffTrust,70,'a willing move costs nothing');
 assert.ok(willing.morale>=70);
});

test('a full offseason installs systems league-wide without breaking the sim',async()=>{
 const e=await setup(1008),u=e.universe;
 for(let i=0;i<12;i++)e.simWeek();
 e.simConferenceChampionships();e.simPlayoff();
 e.runSpringCamp();e.runFallCamp();e.runOffseason();
 const mid=u.teams.filter(t=>e.schemeTransition(t,'off')||e.schemeTransition(t,'def'));
 assert.ok(mid.length>0,'coordinator turnover should leave some programs installing a new system');
 for(const t of u.teams){
  for(const side of ['off','def']){
   const tr=e.schemeTransition(t,side);
   if(!tr)continue;
   assert.ok(tr.familiarity>=0&&tr.familiarity<100,`familiarity out of range: ${tr.familiarity}`);
   assert.notEqual(tr.from,tr.to,'an installation must actually be a change');
   assert.ok(e.schemeDefFor(side,tr.to),'the installed system must be a real scheme');
  }
  assert.ok(e.OFF_SCHEMES[t.offScheme]&&e.DEF_SCHEMES[t.defScheme],'every program still runs a valid system');
 }
});
