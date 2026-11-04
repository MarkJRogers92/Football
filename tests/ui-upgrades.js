const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.14.1: Program Lab's season-by-season chart, drawn from the tenure records the game already keeps.
async function setup(seed){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 return e;
}
const tenureWith=(u,seasons)=>{u.tenure={startYear:2027,school:'Chicago Metropolitan',seasons,ended:null,closed:false}};
const row=(year,w,expected,after,extra={})=>({year,w,l:12-w,expected,after,champ:false,confChamp:false,...extra});

test('the trend chart waits for two seasons',async()=>{
 const e=await setup(9951),u=e.universe;
 tenureWith(u,[]);
 assert.match(e.programTrendsHTML(),/Complete two seasons to see the trend\./);
 tenureWith(u,[row(2027,8,8,60)]);
 assert.match(e.programTrendsHTML(),/Complete two seasons/);
 assert.doesNotMatch(e.programTrendsHTML(),/<svg/);
});

test('the trend chart draws wins, expectation and confidence with an accessible summary',async()=>{
 const e=await setup(9952),u=e.universe;
 tenureWith(u,[row(2027,6,8,48),row(2028,9,8,62,{confChamp:true}),row(2029,12,9,80,{champ:true})]);
 const html=e.programTrendsHTML();
 assert.equal((html.match(/class="trend-bar/g)||[]).length,3,'one bar per season');
 assert.equal((html.match(/class="trend-exp"/g)||[]).length,3,'one expectation marker per season');
 assert.equal((html.match(/class="trend-dot"/g)||[]).length,3,'one confidence point per season');
 assert.match(html,/trend-bar is-conf/,'a conference title is marked');
 assert.match(html,/trend-bar is-champ/,'a national title is marked');
 assert.match(html,/aria-label="Wins by season: 2027 6 \(expected 8\), 2028 9 \(expected 8\), 2029 12 \(expected 9\)\."/);
 assert.match(html,/2028: administration confidence 62/,'each point has a tooltip');
});

test('only the last ten seasons are drawn, and out-of-range values stay inside the chart',async()=>{
 const e=await setup(9953),u=e.universe;
 tenureWith(u,Array.from({length:14},(_,i)=>row(2027+i,i%13,8,i%2?120:-10)));
 const html=e.programTrendsHTML();
 assert.equal((html.match(/class="trend-bar/g)||[]).length,10);
 assert.doesNotMatch(html,/NaN|undefined|Infinity/);
 const ys=[...html.matchAll(/class="trend-dot" cx="[\d.]+" cy="([\d.-]+)"/g)].map(m=>Number(m[1]));
 assert.ok(ys.every(y=>y>=0&&y<=130),'confidence points are clamped into the chart');
});
