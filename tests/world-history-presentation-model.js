const test=require('node:test');
const assert=require('node:assert/strict');
const {makeWorldHistoryPresentationModel}=require('../world-history-presentation-adapter.js');
const model=makeWorldHistoryPresentationModel();
const season=(year,{team='Chicago Metropolitan',w=10,l=3,cw=7,cl=2,champion=false,rank=4,awards=[]}={})=>({type:'season',year,champion:champion?team:'Another Program',records:[{name:team,w,l,cw,cl}],top10:rank?[...Array(Math.max(rank,1))].map((_,i)=>i===rank-1?{name:team}:{name:`Team ${i}`}):[],awards});

test('season extraction uses archived records, final rank, championship and awards',()=>{
 const row=model.seasonForTeam(season(2031,{w:12,l:2,cw:8,cl:1,champion:true,rank:2,awards:[{name:'National Player of the Year',playerName:'A. Carter',pos:'QB',team:'Chicago Metropolitan'}]}),'Chicago Metropolitan');
 assert.deepEqual(row,{year:2031,record:'12-2',conferenceRecord:'8-1',rank:2,champion:true,awards:[{name:'National Player of the Year',playerName:'A. Carter',pos:'QB'}]});
});

test('unrelated and non-season history entries do not become program seasons',()=>{
 assert.equal(model.seasonForTeam({type:'event',year:2030},'Chicago Metropolitan'),null);
 assert.equal(model.seasonForTeam(season(2030,{team:'Other Program'}),'Chicago Metropolitan'),null);
});

test('snapshot separates tracked all-time totals from archived trophy and award evidence',()=>{
 const raw={teamId:1,teamName:'Chicago Metropolitan',conference:'Great Lakes',tracked:{w:25,l:4,seasons:2,confTitles:2,natTitles:1},history:[season(2030,{w:13,l:1,champion:true,rank:1,awards:[{name:'National Player of the Year',playerName:'A. Carter',pos:'QB',team:'Chicago Metropolitan'}]}),season(2029,{w:12,l:3,rank:5})]};
 const out=model.snapshot(raw);
 assert.deepEqual(out.tracked,{wins:25,losses:4,seasons:2,conferenceTitles:2,nationalTitles:1});
 assert.deepEqual(out.titleYears,[2030]);
 assert.deepEqual(out.awardRows,[{name:'National Player of the Year',playerName:'A. Carter',pos:'QB',year:2030}]);
 assert.deepEqual(out.seasons.map(s=>s.year),[2030,2029]);
});

test('unsupported hidden program fields cannot alter history presentation output',()=>{
 const base={teamId:1,teamName:'Chicago Metropolitan',conference:'Great Lakes',tracked:{w:10,l:2,seasons:1,confTitles:1,natTitles:0},history:[season(2029)]};
 const a=model.snapshot(base),b=model.snapshot({...base,trueTalent:100,hiddenPrestigeTrajectory:999,privatePotential:'A+'});
 assert.deepEqual(b,a);
});
