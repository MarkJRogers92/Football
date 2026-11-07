// Pure geometry and models behind the brand visuals: charts must draw the real values.
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../brand-visuals.js');

test('radar puts the first axis straight up and scales by value',()=>{
 const pts=V.radarPoints([100,50,0,100,100,100],{radius:100});
 assert.deepEqual(pts[0],[0,-100]);
 const [x,y]=pts[1];assert.ok(Math.abs(Math.hypot(x,y)-50)<0.2,'half value sits at half radius');
 assert.deepEqual(pts[2],[0,0]);
 assert.deepEqual(V.radarPoints([150],{radius:10})[0],[0,-10],'values clamp to the maximum');
});

test('gauge runs left (0) to right (max) across the top',()=>{
 assert.deepEqual(V.gaugePoint(0,{radius:10}),[-10,0]);
 assert.deepEqual(V.gaugePoint(50,{radius:10}),[0,-10]);
 assert.deepEqual(V.gaugePoint(100,{radius:10}),[10,0]);
 assert.match(V.gaugeArc(0,100,{radius:10}),/^M-10 0A10 10 0 0 1 10 0$/);
});

test('estimate ranges map onto the 25-99 scale and reject unreadable labels',()=>{
 assert.deepEqual(V.estimateRange('A- · 85-93'),{low:85,high:93,start:81.1,end:91.9});
 assert.deepEqual(V.estimateRange('B · 93–85').low,85,'reversed ranges are ordered');
 assert.equal(V.estimateRange('Staff read unavailable'),null);
 assert.equal(V.estimateRange('F · 10-30').start,0,'below the scale clamps to the start');
});

test('season strip orders weeks, labels results and marks only the first unplayed game as next',()=>{
 const strip=V.seasonStrip([
  {week:3,home:true,played:false,opponent:{id:3,name:'C'}},
  {week:1,home:true,played:true,result:'W',us:31,them:17,opponent:{id:1,name:'A'}},
  {week:2,home:false,played:true,result:'L',us:10,them:24,opponent:{id:2,name:'B'}},
  {week:4,home:false,played:false,opponent:{id:4,name:'D'}}
 ]);
 assert.deepEqual(strip.map(g=>g.week),[1,2,3,4]);
 assert.deepEqual(strip.map(g=>g.label),['W 31-17','L 10-24','vs','@']);
 assert.deepEqual(strip.map(g=>g.next),[false,false,true,false]);
 assert.equal(V.seasonStrip([]).length,0);
});

test('SVG builders expose the values to assistive technology and escape names',()=>{
 const radar=V.radarSVG([{label:'Prestige',value:92},{label:'NIL',value:86},{label:'A<b>',value:1}]);
 assert.match(radar,/aria-label="Program attributes: Prestige 92, NIL 86, A&lt;b&gt; 1"/);
 assert.match(V.gaugeSVG(45,{label:'Administration confidence',caption:'Watched'}),/aria-label="Administration confidence: 45 of 100, Watched"/);
 assert.match(V.ringSVG(2,4,{label:'Season goals'}),/2 of 4 complete/);
 assert.match(V.helmetHTML(13),/--col:0;--row:1/);
 assert.match(V.helmetHTML(0),/bi-helmet--none/);
});
