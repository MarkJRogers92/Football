const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeSeasonCard}=require('../season-card.js');

test('the season card says the outcome, record, ranking, defining moment, leaders and awards',()=>{
 const C=makeSeasonCard();
 const m={year:2031,team:"St. Mary's Tech",outcome:'Won the Rose Bowl',record:'11–2',conference:'7–1 Pacific',rank:'#6',champion:false,
  games:[{win:true},{win:false},{win:true}],moments:[{kind:'loss',title:'Heartbreaker',text:'Fell to X 20–21'},{kind:'best',title:'Signature win',text:'Beat #2 Y 31–17'}],
  leaders:[{label:'Passing',pos:'QB',name:'A',line:'3,100 yds · 28 TD'},{label:'Rushing',pos:'RB',name:'B',line:'1,200 yds · 12 TD'},{label:'Receiving',pos:'WR',name:'C',line:'900 yds'},{label:'Tackles',pos:'LB',name:'D',line:'99'}],
  awards:[{name:'Quarterback of the Year',playerName:'A'}]};
 const c=C.lines(m,{name:"St. Mary's Tech",primary:'#123456',secondary:'#abcdef'});
 assert.equal(c.kicker,'2031 SEASON');assert.equal(c.headline,'Won the Rose Bowl');assert.equal(c.rank,'Final ranking #6');
 assert.equal(c.moment,'Signature win: Beat #2 Y 31–17','the best win, not the heartbreaker');
 assert.equal(c.leaders.length,3);assert.deepEqual(c.awards,['Quarterback of the Year: A']);
 assert.deepEqual(c.strip,['W','L','W']);assert.equal(c.wins,2);
 assert.equal(c.file,'dynasty-lab-st-mary-s-tech-2031.png');assert.deepEqual(c.colors,{primary:'#123456',secondary:'#abcdef'});
 assert.equal(C.lines(null),null);
});
