const test=require('node:test');
const assert=require('node:assert/strict');
const {makePlayerIdentityPresentationModel}=require('../player-identity-adapter');
const model=makePlayerIdentityPresentationModel();
const player={id:'p1',teamId:1,teamName:'Chicago Metropolitan',name:'Marcus Reed',jerseyNumber:7,pos:'QB',eligibility:'JR',height:'6′ 3″',weight:218,style:'Field General',status:'ACTIVE PLAYER',currentLabel:'80–84',upsideLabel:'84–88',confidence:76,healthLabel:'Healthy',schemeFit:89,schemeFitGrade:'A',roles:['Starting QB'],seasonProduction:'185/276 · 2,340 pass yds · 21 TD · 6 INT',careerProduction:'5,010 pass yds',developmentNote:'Staff sees steady upward movement.',trainingFocus:'Processing',positionFamiliarity:94,wear:18,redshirtLabel:'Redshirt used 2027',academicLabel:'Eligible',morale:82};

test('player headline prioritizes football identity and staff-facing evaluation',()=>{const h=model.headline(player);assert.equal(h.identity,'#7 · QB · JR');assert.equal(h.role,'Starting QB');assert.equal(h.scheme,'A (89)');assert.equal(h.current,'80–84');assert.equal(h.confidence,'76%')});
test('status chips preserve active roles and supported profile context',()=>{const chips=model.statusChips(player);assert.deepEqual(chips.slice(0,3).map(x=>x.label),['Starting QB','Field General','Redshirt used 2027']);assert.ok(chips.some(x=>x.label==='Eligible'))});
test('hidden true talent and growth fields cannot alter player identity output',()=>{const mutated={...player,trueNow:21,trueTalent:99,potential:100,growth:100,volatility:100,privateDevelopmentCurve:'elite'};assert.deepEqual(model.cleanPlayer(player),model.cleanPlayer(mutated));assert.deepEqual(model.headline(player),model.headline(mutated));assert.deepEqual(model.statusChips(player),model.statusChips(mutated))});
