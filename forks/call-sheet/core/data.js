// Call Sheet card catalog, archetype tables and signatures (rules v0.2).
// Everything a card can do lives here as data plus small condition functions. Numbers are first-pass values
// tuned by tools/sim-report.js; see DESIGN.md §11 for the rules they implement.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else (root.CallSheet=root.CallSheet||{}).data=api;
})(typeof window==='object'?window:globalThis,function(){
'use strict';

// Frozen copy of Dynasty Lab's archetype tables (app/01-identity-rng.js, v0.36.0). The fork reads the real
// player objects through an adapter later; the sandbox needs only these.
const STYLES={
  QB:['Rhythm Distributor','Field Architect','Off-Script Creator','Vertical Hunter','Power Creator','Run-First Weapon','Toolsy Project'],
  RB:['Gap Hammer','Space Cutter','Contact Glider','Third-Down Weapon','One-Cut Burner','Patient Slasher'],
  WR:['Boundary Bully','Space Hunter','Route Sculptor','Vertical Glider','Catch-Point Ace','YAC Creator','Motion Weapon'],
  TE:['Seam Hunter','Inline Mauler','Move Chesspiece','Red-Zone Tower','Backfield Hybrid'],
  OT:['Island Protector','Movement Tackle','Power Edge','Long-Frame Project'],
  OG:['Drive Blocker','Phone-Booth Anchor','Pulling Guard','Interior Technician'],
  C:['Protection Quarterback','Leverage Center','Movement Pivot','Power Pivot'],
  EDGE:['Pocket Wrecker','Speed Bender','Power Setter','Chaos Rusher','Run-Side Anchor'],
  DT:['Pocket Crusher','Gap Eater','Penetrator','Two-Gap Anchor','Interior Disruptor'],
  LB:['Range Hunter','Box Enforcer','Coverage Rover','Pressure Backer','Traffic Director'],
  CB:['Mirror Corner','Press Eraser','Ball Hunter','Boundary Fighter','Slot Shadow'],
  S:['Centerfielder','Box Hammer','Coverage Eraser','Hybrid Rover','Trigger Safety']
};
const STYLE_TRAITS={
  'Rhythm Distributor':['technique','iq','composure'],'Field Architect':['iq','technique','composure'],'Off-Script Creator':['speed','versatility','composure'],'Vertical Hunter':['power','technique','composure'],'Power Creator':['power','speed','durability'],'Run-First Weapon':['speed','power','versatility'],'Toolsy Project':['speed','technique','power'],
  'Gap Hammer':['power','durability','technique'],'Space Cutter':['speed','versatility','iq'],'Contact Glider':['power','composure','durability'],'Third-Down Weapon':['technique','versatility','iq'],'One-Cut Burner':['speed','technique','iq'],'Patient Slasher':['iq','technique','composure'],
  'Boundary Bully':['power','technique','composure'],'Space Hunter':['speed','iq','versatility'],'Route Sculptor':['technique','iq','composure'],'Vertical Glider':['speed','power','composure'],'Catch-Point Ace':['technique','power','composure'],'YAC Creator':['speed','power','versatility'],'Motion Weapon':['versatility','speed','iq'],
  'Seam Hunter':['speed','technique','iq'],'Inline Mauler':['power','durability','technique'],'Move Chesspiece':['versatility','technique','iq'],'Red-Zone Tower':['power','technique','composure'],'Backfield Hybrid':['versatility','power','iq'],
  'Island Protector':['technique','iq','composure'],'Movement Tackle':['speed','technique','versatility'],'Power Edge':['power','durability','technique'],'Long-Frame Project':['power','speed','versatility'],
  'Drive Blocker':['power','technique','durability'],'Phone-Booth Anchor':['power','durability','composure'],'Pulling Guard':['speed','versatility','technique'],'Interior Technician':['technique','iq','composure'],
  'Protection Quarterback':['iq','technique','composure'],'Leverage Center':['technique','power','iq'],'Movement Pivot':['speed','versatility','technique'],'Power Pivot':['power','durability','technique'],
  'Pocket Wrecker':['technique','speed','power'],'Speed Bender':['speed','technique','versatility'],'Power Setter':['power','durability','technique'],'Chaos Rusher':['versatility','speed','composure'],'Run-Side Anchor':['power','iq','durability'],
  'Pocket Crusher':['power','technique','composure'],'Gap Eater':['power','durability','iq'],'Penetrator':['speed','technique','composure'],'Two-Gap Anchor':['power','iq','durability'],'Interior Disruptor':['technique','power','speed'],
  'Range Hunter':['speed','iq','technique'],'Box Enforcer':['power','durability','composure'],'Coverage Rover':['versatility','speed','iq'],'Pressure Backer':['speed','power','technique'],'Traffic Director':['iq','composure','technique'],
  'Mirror Corner':['technique','speed','composure'],'Press Eraser':['power','technique','composure'],'Ball Hunter':['iq','technique','speed'],'Boundary Fighter':['power','durability','technique'],'Slot Shadow':['speed','versatility','iq'],
  'Centerfielder':['speed','iq','composure'],'Box Hammer':['power','durability','composure'],'Coverage Eraser':['technique','speed','iq'],'Hybrid Rover':['versatility','speed','power'],'Trigger Safety':['iq','speed','composure']
};
const TRAITS=['speed','power','technique','iq','composure','durability','versatility'];

// Eleven roles per side. Duels name roles; the lineup names the people in them.
const OFF_ROLES={QB:'QB',RB:'RB',X:'WR',Z:'WR',SLOT:'WR',TE:'TE',LT:'OT',LG:'OG',C:'C',RG:'OG',RT:'OT'};
const DEF_ROLES={RUSH:'EDGE',SET:'EDGE',NT:'DT',DT3:'DT',MIKE:'LB',WILL:'LB',FCB:'CB',BCB:'CB',NICKEL:'CB',FS:'S',BOXS:'S'};

// Margin → offense win chance. Shown to the player as chips; exact values on demand.
const WIN_CHANCE={'-3':.15,'-2':.25,'-1':.35,'0':.5,'1':.65,'2':.75,'3':.85};
const chip=m=>m<=-2?'Danger':m===-1?'Tough':m===0?'Even':m===1?'Edge':'Strong';

// Result tables. Each category is a weighted list of results; yards are [mean, sd].
// kind: run | catch | inc | sack | scramble. int: chance an incompletion is intercepted.
const R=(w,kind,yards,extra={})=>({w,kind,yards,...extra});

// --- Offensive plays -------------------------------------------------------------------------------
// duel: off/def role lists, the traits each side uses, a label, and a design bias (a visible modifier).
const PLAYS={
  inside_zone:{id:'inside_zone',side:'off',name:'Inside Zone',family:'run',cost:0,base:true,carrier:'RB',
    text:'Downhill run. The back reads the interior blocks and takes the crease.',
    duels:{
      G:{label:'Point of attack',off:['LG','C','RG'],ot:['power','technique'],def:['NT','DT3'],dt:['power','technique'],bias:1},
      K:{label:'Read the crease',off:['RB'],ot:['iq','technique'],def:['MIKE'],dt:['iq','power'],bias:0},
      F:{label:'Finish',off:['RB'],ot:['power','durability'],def:['BOXS'],dt:['power','technique'],bias:0}},
    results:{fail:[R(1,'run',[-1.5,1.6])],short:[R(1,'run',[2.4,1.2])],success:[R(1,'run',[5.2,1.6])],explosive:[R(1,'run',[10,4],{tail:.1})]}},
  outside_zone:{id:'outside_zone',side:'off',name:'Outside Zone',family:'run',cost:0,base:true,carrier:'RB',
    text:'Stretch the defense sideways and cut up behind the edge.',
    duels:{
      G:{label:'Edge block',off:['TE','RT'],ot:['power','technique'],def:['SET'],dt:['power','technique'],bias:1},
      K:{label:'Beat pursuit',off:['RB'],ot:['speed','iq'],def:['WILL'],dt:['speed','iq'],bias:0},
      F:{label:'Turn the corner',off:['RB'],ot:['speed','versatility'],def:['FCB'],dt:['speed','technique'],bias:0}},
    results:{fail:[R(1,'run',[-2.2,1.6])],short:[R(1,'run',[2,1.3])],success:[R(1,'run',[5.5,2])],explosive:[R(1,'run',[12,5],{tail:.12})]}},
  quick_slant:{id:'quick_slant',side:'off',name:'Quick Slant',family:'quick',cost:0,base:true,target:'SLOT',pass:true,
    text:'Ball out in 1.5 seconds to the slot. Beats pressure, small window.',
    duels:{
      G:{label:'Release',off:['SLOT'],ot:['technique','speed'],def:['NICKEL'],dt:['technique','speed'],bias:1,release:true},
      K:{label:'Timing throw',off:['QB'],ot:['technique','composure'],def:['MIKE'],dt:['iq','speed'],bias:0,qbRead:true},
      F:{label:'After the catch',off:['SLOT'],ot:['speed','versatility'],def:['WILL'],dt:['speed','technique'],bias:0}},
    results:{fail:[R(.85,'inc',[0,0],{int:.04}),R(.15,'catch',[1,1.5])],short:[R(.55,'inc',[0,0],{int:.04}),R(.45,'catch',[3.5,1.5])],success:[R(.85,'catch',[7,2]),R(.15,'inc',[0,0],{int:.03})],explosive:[R(1,'catch',[12,5],{tail:.08})]}},
  stick:{id:'stick',side:'off',name:'Stick',family:'quick',cost:0,base:true,target:'TE',pass:true,
    text:'Tight end sits down at six yards. A dependable chain-mover.',
    duels:{
      G:{label:'Release',off:['TE'],ot:['technique','iq'],def:['WILL'],dt:['technique','iq'],bias:1,release:true},
      K:{label:'Read the flat',off:['QB'],ot:['iq','technique'],def:['BOXS'],dt:['iq','speed'],bias:0,qbRead:true},
      F:{label:'Fall forward',off:['TE'],ot:['power','technique'],def:['MIKE'],dt:['power','technique'],bias:0}},
    results:{fail:[R(.8,'inc',[0,0],{int:.03}),R(.2,'catch',[2,1.5])],short:[R(.45,'inc',[0,0],{int:.03}),R(.55,'catch',[4,1.2])],success:[R(.88,'catch',[6.5,1.5]),R(.12,'inc',[0,0],{int:.02})],explosive:[R(1,'catch',[10,4],{tail:.05})]}},
  // Wrinkles: drawn from the play pile.
  deep_cross:{id:'deep_cross',side:'off',name:'Deep Cross',family:'deep',cost:1,target:'Z',pass:true,protection:true,
    text:'Z crosses at 18 yards behind the linebackers. Needs time.',
    duels:{
      G:{label:'Protection',off:['LT','RT'],ot:['technique','power'],def:['RUSH','SET'],dt:['speed','technique'],bias:1,protect:true},
      K:{label:'Separation',off:['Z'],ot:['speed','technique'],def:['FCB'],dt:['speed','technique'],bias:0,separation:true},
      F:{label:'Read the safety',off:['QB'],ot:['iq','composure'],def:['FS'],dt:['iq','speed'],bias:0,qbRead:true}},
    results:{fail:[R(.32,'sack',[-7,2]),R(.43,'inc',[0,0],{int:.05}),R(.25,'catch',[3,1.5])],short:[R(.55,'inc',[0,0],{int:.06}),R(.45,'catch',[5,2])],success:[R(.7,'catch',[14,4]),R(.3,'inc',[0,0],{int:.05})],explosive:[R(1,'catch',[23,7],{tail:.12})]}},
  vertical_shot:{id:'vertical_shot',side:'off',name:'Vertical Shot',family:'deep',cost:2,target:'X',pass:true,protection:true,
    text:'Seven-step drop, X goes deep. Big swing.',
    duels:{
      G:{label:'Protection',off:['LT','RT'],ot:['technique','power'],def:['RUSH','SET'],dt:['speed','technique'],bias:0,protect:true},
      K:{label:'Get behind',off:['X'],ot:['speed','power'],def:['FS'],dt:['speed','iq'],bias:0,separation:true},
      F:{label:'Catch point',off:['X'],ot:['power','composure'],def:['BCB'],dt:['power','technique'],bias:0}},
    results:{fail:[R(.38,'sack',[-8,2]),R(.5,'inc',[0,0],{int:.07}),R(.12,'scramble',[4,3])],short:[R(.8,'inc',[0,0],{int:.12}),R(.2,'catch',[9,3])],success:[R(.55,'catch',[22,6]),R(.45,'inc',[0,0],{int:.06})],explosive:[R(1,'catch',[33,11],{tail:.25})]}},
  pa_boot:{id:'pa_boot',side:'off',name:'PA Boot',family:'constraint',punishes:'run',cost:1,target:'Z',pass:true,protection:true,
    text:'Fake the run, roll the pocket. Deadly when the linebackers are cheating.',
    duels:{
      G:{label:'Hold the edge',off:['TE'],ot:['power','technique'],def:['SET'],dt:['speed','technique'],bias:1,protect:true},
      K:{label:'Sell the fake',off:['RB'],ot:['iq','technique','power'],def:['MIKE'],dt:['iq','composure'],bias:0,fake:true},
      F:{label:'Separation',off:['Z'],ot:['speed','technique'],def:['FCB'],dt:['speed','technique'],bias:0,separation:true}},
    results:{fail:[R(.3,'sack',[-6,2]),R(.4,'inc',[0,0],{int:.05}),R(.3,'scramble',[2,2])],short:[R(.5,'inc',[0,0],{int:.04}),R(.5,'catch',[5,2])],success:[R(.75,'catch',[11,3]),R(.25,'inc',[0,0],{int:.04})],explosive:[R(1,'catch',[22,8],{tail:.15})]}},
  screen:{id:'screen',side:'off',name:'RB Screen',family:'constraint',punishes:'pressure',cost:1,target:'RB',pass:true,
    text:'Invite the rush, dump it over them, linemen lead the way.',
    duels:{
      G:{label:'Sell it',off:['QB'],ot:['composure','iq'],def:['RUSH'],dt:['iq','speed'],bias:1,qbRead:true},
      K:{label:'Lead block',off:['LG'],ot:['speed','versatility'],def:['WILL'],dt:['speed','power'],bias:0},
      F:{label:'Make a man miss',off:['RB'],ot:['versatility','speed'],def:['NICKEL'],dt:['speed','technique'],bias:0}},
    results:{fail:[R(.4,'catch',[-3,2]),R(.6,'inc',[0,0],{int:.04})],short:[R(.7,'catch',[2,1.5]),R(.3,'inc',[0,0],{int:.02})],success:[R(1,'catch',[8,2])],explosive:[R(1,'catch',[18,8],{tail:.2})]}},
  power:{id:'power',side:'off',name:'Power',family:'run',cost:1,carrier:'RB',
    text:'Pull the guard, kick out the end, hit it downhill.',
    duels:{
      G:{label:'Kick out',off:['LG','TE'],ot:['power','technique'],def:['SET','NT'],dt:['power','technique'],bias:2},
      K:{label:'Downhill',off:['RB'],ot:['power','iq'],def:['MIKE'],dt:['power','iq'],bias:0},
      F:{label:'Finish',off:['RB'],ot:['power','durability'],def:['BOXS'],dt:['power','durability'],bias:0}},
    results:{fail:[R(1,'run',[-1,1.5])],short:[R(1,'run',[3,1])],success:[R(1,'run',[6,1.5])],explosive:[R(1,'run',[12,5],{tail:.12})]}},
  read_option:{id:'read_option',side:'off',name:'Read Option',family:'run',cost:1,carrier:'QB',needs:{role:'QB',trait:'speed',grade:7},
    text:'Leave the end unblocked and let the quarterback decide. Needs a runner at QB.',
    duels:{
      G:{label:'Read the end',off:['QB'],ot:['iq','speed'],def:['SET'],dt:['iq','speed'],bias:1,qbRead:true,qbRun:true},
      K:{label:'Get to space',off:['QB'],ot:['speed','versatility'],def:['WILL'],dt:['speed','iq'],bias:0,qbRun:true},
      F:{label:'Finish',off:['QB'],ot:['speed','power'],def:['BOXS'],dt:['speed','power'],bias:0}},
    results:{fail:[R(1,'run',[-1.5,1.5])],short:[R(1,'run',[2.5,1.5])],success:[R(1,'run',[7,2])],explosive:[R(1,'run',[15,7],{tail:.22})]}}
};

// --- Defensive calls -------------------------------------------------------------------------------
// box: light | normal | loaded. shell: 0 | 1 | 2 deep safeties. pressure: 0 none, 1 five-man, 2 all-out.
// look: what the offense sees before the snap (pressureShown can be a bluff).
const CALLS={
  two_high:{id:'two_high',side:'def',name:'Quarters',family:'zone',cost:0,base:true,box:'light',shell:2,coverage:'zone',pressure:0,counters:['deep'],look:{pressureShown:false},
    text:'Two deep safeties. Takes away the shot; light box against the run.'},
  cover1:{id:'cover1',side:'def',name:'Cover 1 Man',family:'man',cost:0,base:true,box:'normal',shell:1,coverage:'man',pressure:0,counters:['quick'],look:{pressureShown:true},
    text:'Man across the board with a deep safety. Tight on short throws.'},
  cover3:{id:'cover3',side:'def',name:'Cover 3 Sky',family:'zone',cost:0,base:true,box:'normal',shell:1,coverage:'zone',pressure:0,counters:['run'],look:{pressureShown:false},
    text:'Three-deep zone with a safety rolled down for the run.'},
  run_fit:{id:'run_fit',side:'def',name:'Run Fit Heavy',family:'man',cost:0,base:true,box:'loaded',shell:1,coverage:'man',pressure:0,counters:['run'],look:{pressureShown:false},
    text:'Eight in the box. Built to stop the run; thin behind it.'},
  zone_pressure:{id:'zone_pressure',side:'def',name:'Zone Pressure',family:'pressure',cost:1,box:'normal',shell:1,coverage:'zone',pressure:1,counters:['deep'],look:{pressureShown:true},
    text:'Five rush, three deep, three under. Heat without leaving anyone alone.'},
  cover0:{id:'cover0',side:'def',name:'Cover 0 Blitz',family:'pressure',cost:2,box:'loaded',shell:0,coverage:'man',pressure:2,counters:['run','deep'],look:{pressureShown:true},
    text:'Everyone comes. Wins fast or gives up the house.'},
  sim_pressure:{id:'sim_pressure',side:'def',name:'Sim Pressure',family:'pressure',cost:1,box:'normal',shell:1,coverage:'zone',pressure:1,counters:['quick'],look:{pressureShown:false},
    text:'Show nothing, bring a surprise rusher. The look lies.'},
  two_man:{id:'two_man',side:'def',name:'2-Man Under',family:'man',cost:1,box:'light',shell:2,coverage:'man',pressure:0,counters:['quick','deep'],look:{pressureShown:false},
    text:'Man underneath, two safeties over the top. Smothers passes; soft against the run.'},
  robber:{id:'robber',side:'def',name:'Cover 1 Robber',family:'man',cost:1,box:'normal',shell:1,coverage:'man',pressure:0,counters:['quick','constraint'],look:{pressureShown:true},
    text:'A safety lurks underneath to jump crossers and screens.'},
  bear:{id:'bear',side:'def',name:'Bear Front',family:'pressure',cost:1,box:'loaded',shell:1,coverage:'man',pressure:1,counters:['run'],look:{pressureShown:true},
    text:'Covered guards and center, a linebacker in the gap. Short-yardage hammer.'}
};

// --- Tactics ---------------------------------------------------------------------------------------
// info: resolved immediately when played live, before the call; cannot be scripted.
const TACTICS={
  motion:{id:'motion',side:'off',name:'Motion',cost:1,info:true,icon:'↔',text:'Confirms man or zone. The motioned receiver gets +1 on his release or separation duel.'},
  hard_count:{id:'hard_count',side:'off',name:'Hard Count',cost:1,info:true,icon:'!',text:'Confirms whether the shown pressure is real. A shaky center (composure 5 or less) risks a false start.'},
  max_protect:{id:'max_protect',side:'off',name:'Max Protect',cost:1,icon:'⛨',text:'+2 on a Protection duel. One fewer route: Finish −1.',needs:{protection:true}},
  route_adjust:{id:'route_adjust',side:'off',name:'Route Adjustment',cost:1,icon:'↱',text:'+1 on the target\'s separation or release duel; +1 more if Motion confirmed the coverage this snap.',needs:{pass:true,targetIq:6}},
  seal_block:{id:'seal_block',side:'off',name:'Seal Block',cost:1,icon:'▮',text:'+2 on the Gate of Outside Zone, Read Option or Power.',needs:{plays:['outside_zone','read_option','power']}},
  check_with_me:{id:'check_with_me',side:'off',name:'Check-With-Me',cost:2,info:true,icon:'✓',text:'Confirms every fact in the Look before you call.'},
  film_tell:{id:'film_tell',side:'def',name:'Film Tell',cost:1,info:true,icon:'◉',text:'Confirms the offense\'s play family (run, quick, deep or constraint).'},
  identify_protection:{id:'identify_protection',side:'def',name:'Identify Protection',cost:1,info:true,icon:'⌖',text:'Confirms whether they kept extra blockers in. Your pressure Gate +1 this snap.'},
  disguise:{id:'disguise',side:'def',name:'Disguise',cost:1,icon:'◐',text:'Their Shell fact shows false and cannot be confirmed by the QB. Their QB-read duels −2 (−1 if your FS has iq 5 or less).'},
  bracket:{id:'bracket',side:'def',name:'Bracket',cost:1,icon:'⊐',text:'+2 against their best receiver. Every other receiver duel −1 for you.'},
  spy:{id:'spy',side:'def',name:'Spy',cost:1,icon:'👁',text:'QB-run duels −2 for them. Your pressure Gates −1 (one fewer rusher).'},
  press:{id:'press',side:'def',name:'Press',cost:1,icon:'▼',text:'+1 on release duels. If they still win the release, the result improves one step.'}
};

// --- Signatures: one line of card text per archetype that changes a decision ---------------------------
// duel(ctx, key, duel) → modifier from the offense's point of view (defensive signatures return negatives).
// A duel signature applies only when its player is in that duel, unless scope:'field'.
const SIGNATURES={
  'Field Architect':{text:'Sees the shell: the Look\'s Shell is Confirmed with him at QB.',look:'shell'},
  'Vertical Hunter':{text:'Vertical Shot costs 1 with him at QB.',cost:{vertical_shot:1}},
  'Rhythm Distributor':{text:'Quick passes: +1 on the timing throw.',duel:(c,k,d)=>c.play.family==='quick'&&d.qbRead?1:0},
  'Off-Script Creator':{text:'A lost Protection duel becomes a scramble half the time.',flag:'scramble'},
  'Run-First Weapon':{text:'Read Option costs 0 with him at QB.',cost:{read_option:0}},
  'Toolsy Project':{text:'Raw: Shell is never Confirmed by him alone.',look:'noShell'},
  'Patient Slasher':{text:'Inside Zone: +1 reading the crease.',duel:(c,k)=>c.play.id==='inside_zone'&&k==='K'?1:0},
  'Gap Hammer':{text:'Runs: +1 to finish.',duel:(c,k)=>c.play.family==='run'&&k==='F'?1:0},
  'One-Cut Burner':{text:'Explosive runs go further.',flag:'burner'},
  'Third-Down Weapon':{text:'3rd down passes: a lost Key duel becomes a checkdown to him for +3.',flag:'outlet'},
  'Route Sculptor':{text:'+1 separation against man coverage.',duel:(c,k,d)=>d.separation&&c.call.coverage==='man'?1:0},
  'Space Hunter':{text:'+1 separation or release against zone.',duel:(c,k,d)=>(d.separation||d.release)&&c.call.coverage==='zone'?1:0},
  'Boundary Bully':{text:'Wins at the catch point: +1 on contested catches.',duel:(c,k)=>c.play.id==='vertical_shot'&&k==='F'?1:0},
  'Inline Mauler':{text:'Seal Block also fits Inside Zone.',flag:'mauler'},
  'Backfield Hybrid':{text:'Check-and-Release: with Max Protect against no pressure, a lost Key duel becomes +4 to him.',flag:'checkRelease'},
  'Island Protector':{text:'Protection duels: +1 without a tactic.',duel:(c,k,d)=>d.protect?1:0},
  'Pulling Guard':{text:'Power and Screen: +1 on his block.',duel:(c,k)=>(c.play.id==='power'&&k==='G')||(c.play.id==='screen'&&k==='K')?1:0},
  'Interior Technician':{text:'Hard Count costs 0 and never draws a false start.',cost:{hard_count:0},flag:'noFalseStart'},
  'Protection Quarterback':{text:'Hard Count costs 0 and never draws a false start.',cost:{hard_count:0},flag:'noFalseStart'},
  // Defense
  'Speed Bender':{text:'Pressure calls: +1 on Protection duels.',duel:(c,k,d)=>d.protect&&c.call.pressure>0?-1:0},
  'Pocket Wrecker':{text:'+1 on every Protection duel.',duel:(c,k,d)=>d.protect?-1:0},
  'Gap Eater':{text:'Draws the double: your pressure Gates +1 while he plays.',scope:'field',duel:(c,k,d)=>d.protect&&c.call.pressure>0?-1:0},
  'Two-Gap Anchor':{text:'Inside runs: +1 at the point of attack.',duel:(c,k)=>c.play.family==='run'&&k==='G'&&c.play.id!=='outside_zone'?-1:0},
  'Box Enforcer':{text:'Runs: +1 on the Key duel.',duel:(c,k)=>c.play.family==='run'&&k==='K'?-1:0},
  'Traffic Director':{text:'Film Tell costs 0 once per series.',cost:{film_tell:0},costOnce:true},
  'Press Eraser':{text:'Press costs 0.',cost:{press:0}},
  'Mirror Corner':{text:'Man coverage: +1 against separation.',duel:(c,k,d)=>d.separation&&c.call.coverage==='man'?-1:0},
  'Ball Hunter':{text:'Interception chances +50%.',flag:'ballHawk'},
  'Trigger Safety':{text:'Disguise costs 0 once per series.',cost:{disguise:0},costOnce:true},
  'Centerfielder':{text:'Deep passes: +1 against single-high shots.',duel:(c,k)=>c.play.family==='deep'&&k==='K'&&c.call.shell===1?-1:0}
};

// Game-day decks for the sandbox: base plays are always on the sheet; wrinkles and tactics are drawn.
const DEFAULT_DECKS={
  off:{base:['inside_zone','outside_zone','quick_slant','stick'],
    wrinkles:['deep_cross','deep_cross','pa_boot','pa_boot','screen','screen','power','power','vertical_shot','vertical_shot','read_option','read_option'],
    tactics:['motion','motion','hard_count','hard_count','max_protect','max_protect','route_adjust','route_adjust','seal_block','seal_block','check_with_me','check_with_me']},
  def:{base:['two_high','cover1','cover3','run_fit'],
    wrinkles:['zone_pressure','zone_pressure','cover0','cover0','sim_pressure','sim_pressure','two_man','two_man','robber','robber','bear','bear'],
    tactics:['film_tell','film_tell','identify_protection','identify_protection','disguise','disguise','bracket','bracket','spy','spy','press','press']}
};

const RULES={seriesCommand:5,wrinkleRow:3,tacticHand:4,leanBase:4,redZone:80,twoMinute:120};

return{STYLES,STYLE_TRAITS,TRAITS,OFF_ROLES,DEF_ROLES,WIN_CHANCE,chip,PLAYS,CALLS,TACTICS,SIGNATURES,DEFAULT_DECKS,RULES};
});
