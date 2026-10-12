const test=require('node:test');
const assert=require('node:assert/strict');
const {makeRecruitCompareSystem}=require('../recruit-compare');
const verdict=()=>({label:'Strong target',score:78,conviction:'Medium',confidence:64,strong:['Speed','Technique'],risk:'Processing'});
const record=()=>({season:2027,quick:true,full:false});
const api=()=>makeRecruitCompareSystem({staffVerdict:verdict,scoutingRecord:record});

test('compare list toggles and caps at three',()=>{const x=api();let ids=[];for(const id of ['1','2','3'])ids=x.toggle(ids,id).ids;const blocked=x.toggle(ids,'4');assert.equal(blocked.ok,false);assert.deepEqual(blocked.ids,['1','2','3']);const removed=x.toggle(ids,'2');assert.equal(removed.ok,true);assert.deepEqual(removed.ids,['1','3'])});

test('compare summary is staff-report only',()=>{const x=api(),t={id:1},r={id:'1',name:'Prospect',pos:'QB',trueNow:99,upside:99},a=x.summary(r,t);r.trueNow=25;r.upside=30;const b=x.summary(r,t);assert.deepEqual(b,a)});

test('compare summary carries scouting stage and uncertainty',()=>{const x=api(),s=x.summary({id:'1',name:'Prospect',pos:'QB'},{});assert.equal(s.stage,'Film reviewed');assert.equal(s.verdict,'Strong target');assert.equal(s.risk,'Processing')});

const domains=map=>r=>map[String(r.id)]||[];
const dom=(entries)=>makeRecruitCompareSystem({staffVerdict:verdict,scoutingRecord:record,domains:domains(entries)});

test('attribute comparison separates a decisive lead from an overlapping read',()=>{
 const x=dom({
  '1':[{key:'arm',label:'Arm Strength',low:80,high:90,confidence:70},{key:'accuracy',label:'Accuracy',low:50,high:70,confidence:60}],
  '2':[{key:'arm',label:'Arm Strength',low:60,high:70,confidence:70},{key:'accuracy',label:'Accuracy',low:55,high:72,confidence:60}]
 });
 const cmp=x.attributeComparison([{id:'1',name:'A',pos:'QB'},{id:'2',name:'B',pos:'QB'}],{});
 const arm=cmp.rows.find(r=>r.key==='arm'),accuracy=cmp.rows.find(r=>r.key==='accuracy');
 assert.equal(arm.status,'decisive');assert.equal(arm.decisive,true);assert.equal(arm.leaderIndex,0);assert.deepEqual(arm.cells.map(c=>[c.low,c.high]),[[80,90],[60,70]]);
 assert.equal(accuracy.status,'overlap');assert.equal(accuracy.decisive,false);assert.equal(accuracy.leaderIndex,1,'the higher midpoint leads even when the row is indeterminate');
 assert.deepEqual(cmp.summary,{attributes:2,comparable:2,decisive:1,overlapping:1,single:0,unscouted:0});
});

test('equal or partly overlapping scouted ranges stay indeterminate',()=>{
 const x=dom({'1':[{key:'arm',low:70,high:80,confidence:50}],'2':[{key:'arm',low:70,high:80,confidence:50}],'3':[{key:'arm',low:75,high:82,confidence:50}]});
 const arm=x.attributeComparison([{id:'1'},{id:'2'},{id:'3'}],{}).rows[0];
 assert.equal(arm.status,'overlap');assert.equal(arm.decisive,false);assert.equal(arm.leaderIndex,2,'highest midpoint leads but does not separate from the 70-80 ranges');
});

test('absent scouted attributes stay unavailable and an unwired model is safe',()=>{
 const cmp=dom({'1':[{key:'arm',low:70,high:80,confidence:50}],'2':[]}).attributeComparison([{id:'1'},{id:'2'}],{});
 assert.equal(cmp.rows[0].status,'single');assert.equal(cmp.rows[0].cells[1].available,false);assert.equal(cmp.rows[0].cells[1].low,undefined);
 assert.deepEqual(cmp.summary,{attributes:1,comparable:0,decisive:0,overlapping:0,single:1,unscouted:0});
 const bare=makeRecruitCompareSystem({staffVerdict:verdict,scoutingRecord:record});
 assert.deepEqual(bare.attributeComparison([{id:'1'},{id:'2'}],{}).summary,{attributes:0,comparable:0,decisive:0,overlapping:0,single:0,unscouted:0});
 assert.deepEqual(bare.attributeComparison([]).rows,[]);
});

test('attribute comparison is deterministic for identical scouted ranges',()=>{
 const build=()=>dom({'1':[{key:'arm',low:70,high:80,confidence:50},{key:'upside',low:75,high:88,confidence:40}],'2':[{key:'arm',low:62,high:71,confidence:52},{key:'upside',low:80,high:95,confidence:40}]});
 const players=[{id:'1',name:'A',pos:'QB'},{id:'2',name:'B',pos:'QB'}];
 assert.deepEqual(build().attributeComparison(players,{}),build().attributeComparison(players,{}));
});

test('rendered compare tray shows scouted ranges and flags the decisive row',async()=>{
 const {loadEngine}=require('../tools/harness');
 global.__DL_TEST__={};const e=loadEngine({seed:7301,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 const t=e.T('Chicago Metropolitan'),probe=global.__DL_TEST__.recruitCompare;assert.ok(probe,'the compare model is exposed for the UI test');
 const [a,b]=[e.universe.recruits[0],e.universe.recruits.find(r=>r.id!==e.universe.recruits[0].id&&r.pos===e.universe.recruits[0].pos)];
 assert.ok(a&&b&&a.pos===b.pos,'the UI test needs two recruits who share a position-domain set');for(const r of [a,b])r.scoutingDomains={};
 const key=e.scoutingDomainView(a,t,true)[0].key;
 a.scoutingDomains[key]={estimate:93,confidence:82};b.scoutingDomains[key]={estimate:38,confidence:82};
 const da=e.scoutingDomainView(a,t,true).find(d=>d.key===key),db=e.scoutingDomainView(b,t,true).find(d=>d.key===key);
 assert.ok(da.low>db.high,`a forced gap must separate the reads: ${da.low} > ${db.high}`);
 probe.setIds([a.id,b.id]);const html=probe.attributeHTML(t);
 assert.match(html,/Scouted attribute comparison/);assert.ok(html.includes(`${a.pos} ${a.name}`)&&html.includes(`${b.pos} ${b.name}`));
 assert.ok(html.includes(`${da.low}–${da.high}`)&&html.includes(`${db.low}–${db.high}`),'rendered ranges match the scouting view');
 assert.ok((html.match(/rc-lead/g)||[]).length>=1,'the separated attribute is marked as a decisive lead');
 assert.match(html,/\d+ of \d+ comparable attribute/);assert.doesNotMatch(html,/undefined/);
});
