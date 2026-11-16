const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeFacilityEffects}=require('../facility-effects.js');
const {loadEngine}=require('../tools/harness.js');

test('recovery: level×5% a week to heal a week early, hashed and repeatable, nothing without a training center',()=>{
 const u={year:2031,week:4};const F=makeFacilityEffects({getUniverse:()=>u});
 assert.equal(F.recoveryChance(0),0);assert.equal(F.recoveryChance(5),.25);assert.equal(F.recoveryChance(9),.25);
 const roster=()=>Array.from({length:400},(_,i)=>({id:`P${i}`,name:`P${i}`,pos:'RB',injury:'Hamstring strain',injuryWeeks:i%3===0?1:3}));
 const a=roster(),b=roster();
 const ha=F.recover({roster:a},5),hb=F.recover({roster:b},5);
 assert.deepEqual(ha,hb,'the same players heal on a reload');
 const share=ha.length/400;assert.ok(share>.18&&share<.32,`about a quarter: ${share}`);
 const back=ha.filter(h=>h.back);assert.ok(back.length>0&&back.every(h=>a.find(p=>p.id===h.playerId).injury===null));
 assert.ok(ha.filter(h=>!h.back).every(h=>h.weeksLeft===2));
 assert.deepEqual(F.recover({roster:roster()},0),[]);
 const healthy=[{id:'h',injuryWeeks:0}];assert.deepEqual(F.recover({roster:healthy},5),[]);
 const low=F.recover({roster:roster()},1).length/400;assert.ok(low<share,'a smaller building helps fewer');
});

test('development: featured plans get a tenth of a plan bonus per level in their focus, less in the fall',()=>{
 const F=makeFacilityEffects({getUniverse:()=>({year:2031})});
 const bonus={Balanced:{technique:.25,iq:.25},Strength:{power:.8,durability:.25}};
 assert.deepEqual(F.devBoost(5,'Strength',bonus,'spring'),{power:.4,durability:.4});
 assert.deepEqual(F.devBoost(5,'Strength',bonus,'fall'),{power:.22,durability:.22});
 assert.deepEqual(F.devBoost(2,'Unknown',bonus,'spring'),{technique:.16,iq:.16},'an unknown focus is balanced work');
 assert.equal(F.devBoost(0,'Strength',bonus,'spring'),null);
});

test('the help log keeps two seasons, one row per player and moment, and reads plainly',()=>{
 const u={year:2031};const F=makeFacilityEffects({getUniverse:()=>u});const t={};
 assert.equal(F.note(t,{kind:'recovery',year:2031,week:3,playerId:'a',name:'Al',pos:'RB',injury:'Ankle sprain',back:true}),true);
 assert.equal(F.note(t,{kind:'recovery',year:2031,week:3,playerId:'a',name:'Al',pos:'RB',back:true}),false,'once');
 F.note(t,{kind:'development',year:2031,phase:'spring',playerId:'b',name:'Bo',pos:'QB',focus:'Football IQ'});
 assert.equal(F.rowText(t.facilityHelp.rows[0]),'RB Al returned a week early from Ankle sprain (week 3, 2031)');
 assert.equal(F.rowText(t.facilityHelp.rows[1]),'QB Bo: extra Football IQ work at spring camp (2031)');
 u.year=2033;F.log(t);assert.equal(t.facilityHelp.rows.length,0,'older seasons drop off');
 u.year=2034;for(let i=0;i<30;i++)F.note(t,{kind:'recovery',year:2034,week:i,playerId:`p${i}`,name:'X',pos:'S'});
 assert.equal(t.facilityHelp.rows.length,F.LOG_MAX);
});

test('in the game, a training center heals injured players after the week and the coach\'s program logs them by name',async()=>{
 const e=loadEngine({seed:9191,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan');if(u.phase==='preseason')e.beginSeason();
 const fac=globalThis.DynastyFacilities;fac.state(t).levels.training=5;
 // Injure a dozen players for a long time so some heal early whatever the week's own injuries do.
 const hurt=t.roster.slice(20,40);for(const p of hurt){p.injury='Knee sprain';p.injuryWeeks=8}
 e.simWeek();
 const ahead=hurt.filter(p=>p.injuryWeeks<7);
 assert.ok(ahead.length>=1,'a level-five center helps someone among twenty');
 assert.ok(hurt.every(p=>p.injuryWeeks>=6),'never more than one extra week');
 const rows=t.facilityHelp.rows.filter(r=>r.kind==='recovery');
 assert.ok(rows.length>=ahead.length);
 for(const p of ahead)assert.ok(rows.some(r=>r.playerId===p.id));
 // Another program's players heal on their own level but are not logged.
 const other=u.teams.find(x=>x!==t);assert.equal(other.facilityHelp,undefined);
});

test('in the game, a featured plan gets extra camp work from the training center and it is logged',async()=>{
 const e=loadEngine({seed:9292,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan');
 const p=t.roster.find(x=>x.pos==='QB');p.developmentPlan={season:u.year+(u.phase==='complete'?1:0),featured:true,focus:'Strength',createdYear:u.year,receipts:[]};
 const fac=globalThis.DynastyFacilities;
 fac.state(t).levels.training=0;const plain=e.trainingAttrBoost(p,'Balanced','Strength','spring');
 fac.state(t).levels.training=4;const built=e.trainingAttrBoost(p,'Balanced','Strength','spring');
 assert.equal(Math.round((built.power-plain.power)*1000)/1000,.32);assert.equal(Math.round((built.durability-plain.durability)*1000)/1000,.32);
 assert.equal(built.speed,plain.speed,'only the focus traits');
 assert.ok(t.facilityHelp.rows.some(r=>r.kind==='development'&&r.playerId===p.id&&r.focus==='Strength'));
 delete p.developmentPlan;const none=e.trainingAttrBoost(p,'Balanced','Strength','spring');assert.equal(none.power,e.trainingAttrBoost(p,'Balanced','Strength','spring').power);
});
