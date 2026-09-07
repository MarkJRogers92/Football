const test=require('node:test');
const assert=require('node:assert/strict');
const {makeStaffOrganizationPresentationModel}=require('../staff-organization-adapter');
const model=makeStaffOrganizationPresentationModel();
const coach=(slot,name,role,metrics={})=>({id:slot,name,role,slot,age:44,years:2,contractYears:3,salary:slot==='HC'?4.2:1.2,recruiting:70,development:71,evaluation:72,playCall:73,adaptability:74,...metrics,specialties:['Evaluation specialist','Adaptability specialist'],traitText:'Steady career profile'});
const staff={HC:coach('HC','H Coach','Head Coach'),OC:coach('OC','O Coach','Offensive Coordinator',{playCall:91}),DC:coach('DC','D Coach','Defensive Coordinator',{adaptability:90}),RC:coach('RC','R Coach','Recruiting Coordinator',{recruiting:94}),SC:coach('SC','S Coach','Strength & Performance',{development:95})};

test('organization uses only the five canonical staff slots in football hierarchy',()=>{const org=model.organization(staff);assert.equal(org.head.slot,'HC');assert.deepEqual(org.departments.map(x=>x.slot),['OC','DC','RC','SC']);assert.deepEqual(org.all.map(x=>x.slot),model.SLOT_ORDER)});
test('department strengths come from existing coach ratings',()=>{const org=model.organization(staff);assert.equal(org.departments.find(x=>x.slot==='RC').coach.strengths[0].key,'recruiting');assert.equal(org.departments.find(x=>x.slot==='SC').coach.strengths[0].key,'development')});
test('summary is descriptive only and preserves real salary/tenure inputs',()=>{const s=model.summary(staff,12);assert.equal(s.count,5);assert.equal(s.salaryTotal,9);assert.equal(s.avgTenure,3);assert.equal(s.budget,12)});
test('unmodeled hidden coach fields cannot change staff presentation output',()=>{const base=staff.OC,mutated={...base,trueAbility:99,hiddenPotential:100,privateVolatility:100,secretGrowth:100};assert.deepEqual(model.cleanCoach(base),model.cleanCoach(mutated));assert.deepEqual(model.strengths(base),model.strengths(mutated))});
