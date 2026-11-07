const test=require('node:test'),assert=require('node:assert/strict');
let W;try{W=require('../living-world')}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e}
const person=(over={})=>({key:'player:p1',id:'p1',kind:'player',name:'Alex',team:'Home',teamId:1,status:'active',role:'QB',injured:false,...over});
const snap=(over={})=>({worldKey:'seed:7',stamp:'2027:regular:1',year:2027,week:1,program:{id:1,name:'Home'},people:[person()],news:[],callbacks:[],nextGame:null,...over});
test('following is optional, immutable, persistent across JSON reloads and isolated by world',()=>{
 assert.ok(W,'living-world module exists');
 const s=W.emptyStore(),s1=W.toggleFollow(s,snap(),'player:p1');assert.equal(W.followed(s,snap()).length,0);
 assert.equal(W.followed(JSON.parse(JSON.stringify(s1)),snap())[0].key,'player:p1');
 assert.equal(W.followed(s1,snap({worldKey:'seed:8'})).length,0);
 assert.equal(W.followed(W.toggleFollow(s1,snap(),'player:p1'),snap()).length,0);
});
test('a followed transfer is reported once per boundary and routine stats do not become chores',()=>{
 assert.ok(W);let s=W.toggleFollow(W.emptyStore(),snap(),'player:p1');
 const moved=snap({stamp:'2028:regular:1',people:[person({team:'Rival',teamId:2})]});
 s=W.reconcile(s,moved);assert.match(W.followed(s,moved)[0].update.title,/Alex.*Rival/);
 assert.equal(W.briefing(moved,s).items.length,1);
 assert.equal(W.briefing(moved,W.reconcile(s,moved)).items.length,1,'reload does not consume the visible update');
 const ordinary={...moved,stamp:'2028:regular:2',week:2,people:[person({team:'Rival',teamId:2,line:'300 passing yards'})]};
 s=W.reconcile(s,ordinary);assert.equal(W.briefing(ordinary,s).items.length,0);
});
test('unavailable history does not invent an exit and a real injury return is worth an update',()=>{
 assert.ok(W);const initial=snap({people:[person({injured:true})]});let s=W.toggleFollow(W.emptyStore(),initial,'player:p1');
 const absent=snap({stamp:'2027:regular:2',people:[]});s=W.reconcile(s,absent);
 assert.equal(W.briefing(absent,s).items.length,0);assert.equal(W.followed(s,absent).length,1);
 const back=snap({stamp:'2027:regular:3'});s=W.reconcile(s,back);assert.match(W.followed(s,back)[0].update.title,/available/i);
});
test('a compact briefing favors the next opponent and personal callbacks over background news',()=>{
 assert.ok(W);const s=snap({nextGame:{opponent:{id:2,name:'Rival',w:3,l:0,rank:12},week:4,home:false,rival:true},callbacks:[{key:'coach:c1',title:'An old coordinator returns',detail:'Worked at Home in 2027.'}],news:[{id:'a',title:'Team news',detail:'Fact',mine:true,importance:70},{id:'b',title:'League news',detail:'Fact',mine:false,importance:90},{id:'c',title:'More news',detail:'Fact',mine:false,importance:80}]});
 const b=W.briefing(s,W.emptyStore());assert.equal(b.items.length,3);assert.match(b.items[0].title,/Rival/);assert.match(b.items[0].detail,/3–0/);assert.equal(b.items[1].key,'coach:c1');
 assert.equal(b.items.filter(x=>x.title==='More news').length,0);
 assert.equal(W.briefing(snap(),W.emptyStore()).items.length,0,'quiet weeks stay quiet');
});
test('rendered names are escaped and follows are buttons, not blocking decisions',()=>{
 assert.ok(W);const s=snap({people:[person({name:'<img src=x>'})]});const state=W.toggleFollow(W.emptyStore(),s,'player:p1');
 const html=W.html(s,state);assert.ok(html.includes('&lt;img src=x&gt;'));assert.ok(!html.includes('<img src=x>'));assert.match(html,/aria-pressed="true"/);assert.ok(!html.includes('data-decision='));
});
test('loading an earlier save resets the observation baseline rather than inventing reverse transfers',()=>{
 const old=snap({year:2027,week:1}),future=snap({year:2028,week:3,stamp:'2028:regular:3',people:[person({team:'Away',teamId:2})]});
 let s=W.toggleFollow(W.emptyStore(),old,'player:p1');s=W.reconcile(s,future);
 assert.ok(W.followed(s,future)[0].update);
 s=W.reconcile(s,old);assert.equal(W.followed(s,old)[0].update,null);
 assert.equal(W.followed(s,old)[0].baseline.team,'Home');
});
test('corrupt optional follow entries do not prevent a usable briefing',()=>{
 const broken={version:1,worlds:{'seed:7':[null,{},42,{key:'player:p1',name:'Alex'}]}};
 assert.equal(W.followed(broken,snap()).length,1);assert.doesNotThrow(()=>W.html(snap(),W.reconcile(broken,snap())));
});
