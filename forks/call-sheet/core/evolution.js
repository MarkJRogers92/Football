// Call Sheet card evolution (rules v0.4).
// Every play or call your program actually runs earns reps. At its threshold the card evolves, and you choose one of
// two branches. Branches are permanent, so two dynasties that start with the same Inside Zone end up with different
// cards. Evolved cards don't appear in packs.
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const deps=node?[require('./data.js')]:[root.CallSheet.data];
  const api=factory(...deps);
  if(node)module.exports=api;else root.CallSheet.evolution=api;
})(typeof window==='object'?window:globalThis,function(D){
'use strict';
const clone=v=>JSON.parse(JSON.stringify(v));

// Offensive branch: copy the play, then change duel biases, matchups, family or results.
function branchPlay(rootId,id,name,o){
  const c=clone(D.PLAYS[rootId]);c.id=id;c.name=name;c.evolvedFrom=rootId;delete c.upgradeOf;
  for(const [k,v] of Object.entries(o.bias||{}))c.duels[k].bias+=v;
  if(o.matchups)c.matchups=[...(c.matchups||[]),...o.matchups];
  if(o.family)c.family=o.family;if(o.punishes)c.punishes=o.punishes;if(o.cost!==undefined)c.cost=o.cost;
  if(o.explosive)c.results.explosive=o.explosive;
  c.text=`EVOLVED · ${o.text}`;c.branch=o.tag;D.PLAYS[id]=c;D.RARITY[id]='evolved';
}
// Defensive branch: copy the call and change what it takes away.
function branchCall(rootId,id,name,o){
  const c=clone(D.CALLS[rootId]);c.id=id;c.name=name;c.evolvedFrom=rootId;
  for(const k of ['counters','pressure','box','shell','coverage','family','cost'])if(o[k]!==undefined)c[k]=o[k];
  if(o.pressureShown!==undefined)c.look={pressureShown:o.pressureShown};
  c.text=`EVOLVED · ${o.text}`;c.branch=o.tag;D.CALLS[id]=c;D.RARITY[id]='evolved';
}

// rootId → two branches. Tags describe the identity each branch pushes you toward.
const TREE={
  inside_zone:[['duo','Duo',{tag:'Power',bias:{G:1},matchups:[{when:'loaded',duel:'G',v:1,src:'Double teams at the point'}],text:'Two double teams, no reads. Gate +1, and +1 more against a loaded box.'}],
               ['split_zone','Split Zone',{tag:'Misdirection',matchups:[{when:'pressure',duel:'K',v:2,src:'Backside end crashed'}],bias:{F:1},text:'The H-back kicks out the crashing end. Key +2 against pressure; Finish +1.'}]],
  outside_zone:[['jet_sweep','Jet Sweep',{tag:'Speed',bias:{F:1},matchups:[{when:'man',duel:'K',v:1,src:'Man defender lost in motion'}],explosive:[{w:1,kind:'run',yards:[15,6],tail:.25}],text:'Full-speed motion into the handoff. Finish +1, Key +1 against man, bigger explosives.'}],
                ['toss_crack','Toss Crack',{tag:'Power',bias:{G:2},matchups:[{when:'light',duel:'K',v:1,src:'Nobody left to fill'}],text:'The receiver cracks the force player. Gate +2, Key +1 against a light box.'}]],
  quick_slant:[['slant_flat','Slant-Flat',{tag:'Timing',matchups:[{when:'zone',duel:'K',v:2,src:'High-low on the flat defender'}],text:'A two-man read on the flat defender. Key +2 against zone.'}],
               ['glance_rpo','Glance RPO',{tag:'Option',family:'constraint',punishes:'run',matchups:[{when:'loaded',duel:'G',v:2,src:'Linebackers bit on the run action'}],text:'Run action, quick glance behind it. Punishes a run lean; Gate +2 against a loaded box.'}]],
  stick:[['snag','Snag',{tag:'Timing',matchups:[{when:'man',duel:'G',v:1,src:'Rub on the man defender'}],bias:{K:1},text:'A triangle read. Key +1, release +1 against man.'}],
         ['stick_nod','Stick-Nod',{tag:'Shot',cost:1,explosive:[{w:1,kind:'catch',yards:[26,8],tail:.3}],matchups:[{when:'shell1',duel:'F',v:1,src:'The safety jumped the stick'}],text:'Sell the stick, then go. Costs 1; explosives become shots.'}]],
  pa_boot:[['pa_throwback','PA Throwback',{tag:'Misdirection',bias:{F:1},matchups:[{when:'pressure',duel:'K',v:1,src:'Pursuit flowed with the boot'}],text:'Boot one way, throw back the other. Finish +1, Key +1 against pressure.'}],
           ['pa_shot','PA Shot',{tag:'Shot',cost:2,explosive:[{w:1,kind:'catch',yards:[34,10],tail:.35}],bias:{K:1},text:'Max-protect play-action deep shot. Costs 2, Key +1, explosives go the distance.'}]],
  deep_cross:[['mesh_cross','Mesh Cross',{tag:'Timing',matchups:[{when:'man',duel:'K',v:2,src:'Mesh rub picked the man defender'}],text:'Crossers rub underneath. Key +2 against man.'}],
              ['yankee','Yankee',{tag:'Shot',matchups:[{when:'shell1',duel:'F',v:2,src:'The lone safety had to pick one'}],text:'A deep over and a post on one safety. Finish +2 against single-high.'}]],
  screen:[['jailbreak','Jailbreak Screen',{tag:'Speed',matchups:[{when:'pressure',duel:'F',v:1,src:'Every lineman out in front'}],bias:{K:1},text:'All five linemen release. Key +1, Finish +1 against pressure.'}],
          ['tunnel','Tunnel Screen',{tag:'Misdirection',matchups:[{when:'man',duel:'K',v:2,src:'Corner chased the decoy'}],text:'The receiver comes back inside behind the linemen. Key +2 against man.'}]],
  power:[['counter','Counter',{tag:'Misdirection',matchups:[{when:'pressure',duel:'G',v:1,src:'Flow went the wrong way'}],bias:{K:1},text:'Counter step, then two pullers. Key +1, Gate +1 against pressure.'}],
         ['power_read','Power Read',{tag:'Option',matchups:[{when:'man',duel:'F',v:2,src:'The end chased the sweep'}],text:'Read the end: pull and keep, or give. Finish +2 against man.'}]],
  two_high:[['quarters_match','Quarters Match',{tag:'Coverage',counters:['deep','quick'],text:'Pattern-match quarters. Counters deep and quick passes.'}],
            ['cover6','Cover 6',{tag:'Run fits',counters:['deep','run'],box:'normal',text:'Quarter-quarter-half: a boundary safety fits the run. Counters deep and run.'}]],
  cover1:[['cover1_rat','Cover 1 Rat',{tag:'Coverage',counters:['quick','constraint'],text:'A rat in the hole takes away crossers and screens.'}],
          ['cover1_press','Cover 1 Press',{tag:'Aggression',counters:['quick','deep'],pressure:1,pressureShown:false,text:'Press everyone and send one. Counters quick and deep; brings five.'}]],
  cover3:[['cover3_buzz','Cover 3 Buzz',{tag:'Run fits',counters:['run','quick'],text:'The safety buzzes to the hook. Counters run and quick.'}],
          ['cover3_cloud','Cover 3 Cloud',{tag:'Coverage',counters:['deep','constraint'],text:'A cloud corner sits on the flat. Counters deep and constraint plays.'}]],
  run_fit:[['bear_stack','Bear Stack',{tag:'Aggression',counters:['run','constraint'],pressure:1,text:'Stack the box and send a backer. Counters run and play-action.'}],
           ['spill','Spill and Rally',{tag:'Run fits',counters:['run','quick'],text:'Wrong-arm everything outside and rally. Counters run and quick.'}]],
  zone_pressure:[['creeper','Creeper',{tag:'Coverage',pressure:1,pressureShown:false,counters:['deep','quick'],text:'Four rush, but never the four they expect. Counters deep and quick.'}],
                 ['fire_zone_x','Fire Zone X',{tag:'Aggression',pressure:2,counters:['run','deep'],cost:2,text:'Six come, three deep. Costs 2.'}]]
};
for(const [rootId,branches] of Object.entries(TREE)){
  for(const [id,name,o] of branches){if(D.PLAYS[rootId])branchPlay(rootId,id,name,o);else branchCall(rootId,id,name,o)}
}
// Measured: a base play gets ~10-16 reps a game and a heavily used wrinkle up to ~15, so both evolve after
// roughly 3 games of real use. That makes an evolution a regular event, not a constant one.
const BASE_REPS=40,WRINKLE_REPS=24;
const rootOf=id=>{const c=D.PLAYS[id]||D.CALLS[id];return c?.upgradeOf||id};
function threshold(pb,rootId){
  const side=D.PLAYS[rootId]?'off':'def';
  return pb[side].base.some(id=>rootOf(id)===rootId)?BASE_REPS:WRINKLE_REPS;
}
// Count reps from a finished battle for the side `side` (home/away) into the playbook.
function recordReps(pb,log,side){
  pb.mastery??={};const gained={};
  for(const e of log){
    if(e.type!=='snap'||e.penalty)continue;
    const id=e.offSide===side?e.play:e.defSide===side?e.call:null;if(!id)continue;
    const r=rootOf(id);if(!TREE[r])continue;
    pb.mastery[r]=(pb.mastery[r]||0)+1;gained[r]=(gained[r]||0)+1;
  }
  return gained;
}
function addReps(pb,rootId,n){pb.mastery??={};pb.mastery[rootId]=(pb.mastery[rootId]||0)+n}
// Cards whose reps reached the threshold and that the program still holds.
function ready(pb){
  pb.mastery??={};pb.evolved??={};const out=[];
  for(const [rootId,reps] of Object.entries(pb.mastery)){
    if(pb.evolved[rootId]||!TREE[rootId])continue;
    const side=D.PLAYS[rootId]?'off':'def',holds=[...pb[side].base,...pb[side].wrinkles].some(id=>rootOf(id)===rootId);
    if(holds&&reps>=threshold(pb,rootId))out.push({rootId,side,options:TREE[rootId].map(([id])=>id)});
  }
  return out;
}
function progress(pb,id){const r=rootOf(id);if(!TREE[r]||pb.evolved?.[r])return null;return{reps:pb.mastery?.[r]||0,need:threshold(pb,r)}}
// Replace every copy (and its upgrade) with the chosen branch.
function evolve(pb,rootId,branchId){
  if(!TREE[rootId]?.some(([id])=>id===branchId))throw new Error('Not a branch of that card.');
  const side=D.PLAYS[rootId]?'off':'def';
  for(const pile of ['base','wrinkles'])pb[side][pile]=pb[side][pile].map(id=>rootOf(id)===rootId?branchId:id);
  pb.evolved??={};pb.evolved[rootId]=branchId;
  (pb.history??=[]).push({id:branchId,kind:'evolution',side,from:rootId});
  return branchId;
}
const branchTag=id=>(D.PLAYS[id]||D.CALLS[id])?.branch||'';

return{TREE,BASE_REPS,WRINKLE_REPS,rootOf,recordReps,addReps,ready,progress,evolve,branchTag};
});
