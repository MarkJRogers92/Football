const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeAdminWager}=require('../admin-wager.js');
const {loadEngine}=require('../tools/harness.js');

function world(o={}){
 const t={id:1,name:'Home U',prestige:70,w:0,l:0,seasonGoals:[],...o},u={year:2030,phase:'preseason',week:0};
 let gw=0;
 const W=makeAdminWager({getUniverse:()=>u,expectation:()=>8,rivalOf:()=>({id:2,name:'Rival U'}),ensureGoals:x=>x.seasonGoals,goodwill:(x,n)=>{gw+=n}});
 return{t,u,W,goodwill:()=>gw};
}

test('the board offers three promises before the first game, and only then',()=>{
 const {t,u,W}=world();
 assert.deepEqual(W.choices(t).map(c=>c.label),['Win at least 10 games','Finish in the Top 10','Win the conference championship']);
 assert.equal(world({prestige:60}).W.choices(world({prestige:60}).t)[2].label,'Beat Rival U','a smaller program can bet on its rival');
 assert.equal(world({prestige:92}).W.choices(world({prestige:92}).t)[2].label,'Win the national championship');
 assert.equal(W.open(t),true);
 u.phase='regular';assert.equal(W.open(t),true,'week one before kickoff');
 t.w=1;assert.equal(W.open(t),false,'not once a game is played');t.w=0;
 assert.equal(W.accept(t,'nope').ok,false);
 const r=W.accept(t,'wins');assert.equal(r.ok,true);
 assert.deepEqual(t.seasonGoals.at(-1),{id:'wager',weight:'Wager',tier:'Wager',type:'wins',label:'Win at least 10 games',target:10,year:2030});
 assert.equal(W.open(t),false,'one bet a season');assert.equal(W.accept(t,'rank').ok,false);
});

test('declining closes the card for the season; a new season asks again',()=>{
 const {t,u,W}=world();
 assert.equal(W.decline(t),true);assert.equal(W.open(t),false);
 u.year=2031;assert.equal(W.open(t),true);
});

test('the wager replaces the bonus-goal stakes: +8 delivered, -6 missed; goodwill is paid once',()=>{
 const {t,W,goodwill}=world();W.accept(t,'wins');
 const review=state=>({adjustment:0,results:[{id:'wager',weight:'Wager',state}]});
 // The base evaluation already counted the wager as a bonus goal (+4 complete, -1 otherwise).
 const won=W.adjust({...review('complete'),adjustment:4},true),lost=W.adjust({...review('failed'),adjustment:-1},true);
 assert.equal(won.adjustment,8);assert.equal(lost.adjustment,-6);
 assert.equal(W.adjust({...review('complete'),adjustment:4},false).adjustment,4,'nothing changes before the season is final');
 assert.deepEqual(W.settle(t,review('complete')),{won:true,label:'Win at least 10 games'});assert.equal(goodwill(),2);
 assert.equal(W.settle(t,review('complete')),null,'once');assert.equal(goodwill(),2);
});

test('in the game, the board review counts the bet and the news reports it',async()=>{
 const e=loadEngine({seed:8484,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan'),W=globalThis.DynastyAdminWager||e.DynastyAdminWager;
 assert.ok(W.open(t),'open before the first game');
 const c=W.choices(t)[0];assert.equal(W.accept(t,c.key).ok,true);
 u.phase='complete';t.w=12;t.l=0;
 const review=e.adminSeasonReview(t);
 const goal=review.goals.find(g=>g.id==='wager');assert.equal(goal.state,'complete');
 const others=review.goals.filter(g=>g.id!=='wager'&&g.weight!=='Critical').reduce((n,g)=>n+(g.weight==='Important'?(g.state==='complete'?3:-3):(g.state==='complete'?4:-1)),0);
 assert.equal(review.goalAdjustment,others+8,'the delivered bet is worth +8 in the review');
 const ev=(u.events||[]).filter(x=>x.type==='ADMIN_WAGER');
 assert.equal(ev.length,1);assert.match(ev[0].summary,/You delivered on your bet with the board/);
});
