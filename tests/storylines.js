// Storyline detection: every arc needs evidence, the strongest evidence wins, and selection stays varied.
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../storylines.js');
const base=o=>({id:1,name:'A Player',pos:'RB',team:'Home U',teamId:1,eligibility:'JR',stars:null,redshirtUsed:false,injuryWeeks:0,seasons:[],current:{year:2028,games:0,production:0,line:'',rating:70},injuries:[],transfer:null,record:null,teamPosRank:null,nationalPosRank:null,award:null,...o});

test('no evidence, no storyline',()=>{assert.deepEqual(S.detect(base({})),[])});

test('school record chase and ownership use the real record holder',()=>{
 const chase=S.detect(base({record:{label:'rushing yards',total:3400,value:4000,holder:'Old Star'}}))[0];
 assert.equal(chase.type,'record_chase');assert.match(chase.summary,/600 short of Old Star's 4,000/);
 const owns=S.detect(base({record:{label:'rushing yards',total:4100,value:4000,holder:'Old Star'}}))[0];
 assert.equal(owns.title,'Owns the school record');assert.ok(owns.score>chase.score);
 assert.deepEqual(S.detect(base({record:{label:'rushing yards',total:1000,value:4000,holder:'Old Star'}})),[],'far from the record is not a story');
});

test('underdog needs a low star rating and leading the position room',()=>{
 const pl=base({stars:2,teamPosRank:1,current:{year:2028,games:5,production:9,line:'600 rush yd',rating:74}});
 assert.equal(S.detect(pl)[0].type,'underdog');
 assert.equal(S.detect({...pl,stars:5}).some(a=>a.type==='underdog'),false);
 assert.equal(S.detect({...pl,teamPosRank:2}).some(a=>a.type==='underdog'),false);
});

test('breakout compares production per game against last season, and redshirt payoff needs a saved year',()=>{
 const pl=base({seasons:[{year:2027,team:'Home U',games:10,production:6,rating:62}],current:{year:2028,games:4,production:9,line:'x',rating:70}});
 assert.ok(S.detect(pl).some(a=>a.type==='breakout'));
 assert.equal(S.detect({...pl,current:{...pl.current,production:3}}).some(a=>a.type==='breakout'),false);
 const rs=base({redshirtUsed:true,seasons:[{year:2027,team:'Home U',games:3,production:1,rating:60}],current:{year:2028,games:6,production:10,line:'y',rating:72}});
 assert.match(S.detect(rs).find(a=>a.type==='redshirt_payoff').summary,/Played 3 games in 2027/);
});

test('comeback, fresh start, development, senior and national-leader arcs cite their evidence',()=>{
 const pl=base({injuries:[{year:2027,week:5,weeks:6,type:'Knee sprain'}],current:{year:2028,games:4,production:6,line:'z',rating:70}});
 assert.match(S.detect(pl).find(a=>a.type==='comeback').summary,/Missed 6 weeks \(Knee sprain\) in 2027/);
 assert.equal(S.detect({...pl,injuryWeeks:2}).some(a=>a.type==='comeback'),false,'still hurt is not a comeback');
 assert.match(S.detect(base({transfer:{season:2028,from:'Old School'},current:{year:2028,games:3,production:7,line:'q',rating:70}}))[0].title,/leaving Old School/);
 assert.equal(S.detect(base({seasons:[{year:2026,team:'Home U',games:2,production:0,rating:58}],current:{year:2028,games:0,production:0,line:'',rating:71}}))[0].type,'climber');
 assert.equal(S.detect(base({nationalPosRank:2,current:{year:2028,games:3,production:8,line:'r',rating:70}}))[0].title,'#2 RB in the country');
});

test('selection keeps one arc per player, caps repeats of a type and respects the threshold',()=>{
 const award=i=>base({id:i,name:`P${i}`,award:{name:'Player of the Year',rank:1,move:0}});
 const picked=S.select([award(1),award(2),award(3),base({id:9,name:'Z',nationalPosRank:1,current:{year:2028,games:3,production:8,line:'r',rating:70}})],{limit:4,maxPerType:2});
 assert.deepEqual(picked.map(x=>x.arc.type),['award','award','national_leader']);
 assert.equal(S.select([base({})]).length,0);
});
