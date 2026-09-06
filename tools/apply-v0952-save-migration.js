const fs=require('fs');
const path='app.js';
let src=fs.readFileSync(path,'utf8');
const from="if(t.seasonGoalsYear===universe.year&&Array.isArray(t.seasonGoals)&&t.seasonGoals.length)return t.seasonGoals;";
const to=`if(t.seasonGoalsYear===universe.year&&Array.isArray(t.seasonGoals)&&t.seasonGoals.length){
  for(const g of t.seasonGoals){
    g.weight??=g.tier==='Primary'?'Critical':g.tier==='Secondary'?'Important':'Bonus';
    g.tier??=g.weight==='Critical'?'Primary':g.weight==='Important'?'Secondary':'Stretch';
    if(g.type==='top25'){g.type='rank';g.target??=25}
  }
  return t.seasonGoals;
 }`;
if(!src.includes(from))throw new Error('v0.9.52 season-goal persistence anchor not found');
src=src.replace(from,to);
fs.writeFileSync(path,src);
console.log('Applied v0.9.51 → v0.9.52 season-goal compatibility migration.');
