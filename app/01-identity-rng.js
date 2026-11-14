// app/01-identity-rng.js: Names, archetypes and the seeded gameplay random stream. Part of app.js; see tools/app-source.js.
// A fictional name from the pools; never 'Cole Cole'. Pass a Set of names already in use to avoid repeating one.
function personName(taken){let name='';for(let tries=0;tries<16;tries++){const f=pick(FIRST);let l=pick(LAST);while(l===f)l=pick(LAST);name=`${f} ${l}`;if(!taken||!taken.has(name))break}if(taken)taken.add(name);return name}
// Rename any repeats in a list of people, keeping the first holder of each name.
function uniquePeopleNames(list,taken=new Set()){for(const p of list){if(!p)continue;if(taken.has(p.name))p.name=personName(taken);else taken.add(p.name)}return list};
const STYLES={
 QB:['Rhythm Distributor','Field Architect','Off-Script Creator','Vertical Hunter','Power Creator','Run-First Weapon','Toolsy Project','Backyard Magician'],
 RB:['Gap Hammer','Space Cutter','Contact Glider','Third-Down Weapon','One-Cut Burner','Patient Slasher'],
 WR:['Boundary Bully','Space Hunter','Route Sculptor','Vertical Glider','Catch-Point Ace','YAC Creator','Motion Weapon'],
 TE:['Seam Hunter','Inline Mauler','Move Chesspiece','Red-Zone Tower','Backfield Hybrid'],
 OT:['Island Protector','Movement Tackle','Power Edge','Long-Frame Project'],OG:['Drive Blocker','Phone-Booth Anchor','Pulling Guard','Interior Technician'],C:['Protection Quarterback','Leverage Center','Movement Pivot','Power Pivot'],
 EDGE:['Pocket Wrecker','Speed Bender','Power Setter','Chaos Rusher','Run-Side Anchor'],DT:['Pocket Crusher','Gap Eater','Penetrator','Two-Gap Anchor','Interior Disruptor'],LB:['Range Hunter','Box Enforcer','Coverage Rover','Pressure Backer','Traffic Director'],
 CB:['Mirror Corner','Press Eraser','Ball Hunter','Boundary Fighter','Slot Shadow'],S:['Centerfielder','Box Hammer','Coverage Eraser','Hybrid Rover','Trigger Safety'],K:['Pressure Leg','Range Kicker','Placement Specialist'],P:['Field Flipper','Hang-Time Specialist','Directional Punter']
};
const STYLE_TRAITS={
 'Rhythm Distributor':['technique','iq','composure'],'Field Architect':['iq','technique','composure'],'Off-Script Creator':['speed','versatility','composure'],'Vertical Hunter':['power','technique','composure'],'Power Creator':['power','speed','durability'],'Run-First Weapon':['speed','power','versatility'],'Toolsy Project':['speed','technique','power'],'Backyard Magician':['versatility','composure','speed'],
 'Gap Hammer':['power','durability','technique'],'Space Cutter':['speed','versatility','iq'],'Contact Glider':['power','composure','durability'],'Third-Down Weapon':['technique','versatility','iq'],'One-Cut Burner':['speed','technique','iq'],'Patient Slasher':['iq','technique','composure'],
 'Boundary Bully':['power','technique','composure'],'Space Hunter':['speed','iq','versatility'],'Route Sculptor':['technique','iq','composure'],'Vertical Glider':['speed','power','composure'],'Catch-Point Ace':['technique','power','composure'],'YAC Creator':['speed','power','versatility'],'Motion Weapon':['versatility','speed','iq'],
 'Seam Hunter':['speed','technique','iq'],'Inline Mauler':['power','durability','technique'],'Move Chesspiece':['versatility','technique','iq'],'Red-Zone Tower':['power','technique','composure'],'Backfield Hybrid':['versatility','power','iq'],
 'Island Protector':['technique','iq','composure'],'Movement Tackle':['speed','technique','versatility'],'Power Edge':['power','durability','technique'],'Long-Frame Project':['power','speed','versatility'],'Drive Blocker':['power','technique','durability'],'Phone-Booth Anchor':['power','durability','composure'],'Pulling Guard':['speed','versatility','technique'],'Interior Technician':['technique','iq','composure'],'Protection Quarterback':['iq','technique','composure'],'Leverage Center':['technique','power','iq'],'Movement Pivot':['speed','versatility','technique'],'Power Pivot':['power','durability','technique'],
 'Pocket Wrecker':['technique','speed','power'],'Speed Bender':['speed','technique','versatility'],'Power Setter':['power','durability','technique'],'Chaos Rusher':['versatility','speed','composure'],'Run-Side Anchor':['power','iq','durability'],'Pocket Crusher':['power','technique','composure'],'Gap Eater':['power','durability','iq'],'Penetrator':['speed','technique','composure'],'Two-Gap Anchor':['power','iq','durability'],'Interior Disruptor':['technique','power','speed'],
 'Range Hunter':['speed','iq','technique'],'Box Enforcer':['power','durability','composure'],'Coverage Rover':['versatility','speed','iq'],'Pressure Backer':['speed','power','technique'],'Traffic Director':['iq','composure','technique'],'Mirror Corner':['technique','speed','composure'],'Press Eraser':['power','technique','composure'],'Ball Hunter':['iq','technique','speed'],'Boundary Fighter':['power','durability','technique'],'Slot Shadow':['speed','versatility','iq'],'Centerfielder':['speed','iq','composure'],'Box Hammer':['power','durability','composure'],'Coverage Eraser':['technique','speed','iq'],'Hybrid Rover':['versatility','speed','power'],'Trigger Safety':['iq','speed','composure'],
 'Pressure Leg':['composure','power','technique'],'Range Kicker':['power','technique','durability'],'Placement Specialist':['technique','iq','composure'],'Field Flipper':['power','technique','durability'],'Hang-Time Specialist':['technique','power','composure'],'Directional Punter':['technique','iq','composure']
};
const ARCHETYPE_LABELS={
 'Vertical Hunter':'Deep-Ball Hunter','Power Creator':'Power Dual-Threat','Toolsy Project':'Traits Project','Contact Glider':'Contact-Balance Back','Space Hunter':'Space Separator','Vertical Glider':'Vertical Burner','Move Chesspiece':'Move Weapon','Power Edge':'Power Tackle','Protection Quarterback':'Line General','Pressure Leg':'Pressure Kicker'
};
const ARCHETYPE_DESCRIPTIONS={
 'Rhythm Distributor':'Timing passer who wins with accuracy, processing and composure. Gets the ball out and keeps the offense on schedule.','Field Architect':'Cerebral pocket quarterback who diagnoses coverage and controls structure.','Off-Script Creator':'Mobile passer who creates after the original play breaks down.','Vertical Hunter':'Aggressive downfield passer built around arm strength and vertical shots.','Power Creator':'Strong runner-passer whose physicality creates offense inside and outside structure.','Run-First Weapon':'Quarterback whose legs are a primary offensive weapon rather than an emergency option.','Toolsy Project':'High-end tools with significant technical development still required.','Backyard Magician':'Improvisational creator whose versatility and composure generate unconventional plays.',
 'Gap Hammer':'Downhill runner built to attack designed lanes and finish through contact.','Space Cutter':'Quick-space runner who turns leverage and angles into chunk plays.','Contact Glider':'Runner who stays upright through glancing contact and consistently falls forward.','Third-Down Weapon':'Receiving and pass-down specialist with route and space versatility.','One-Cut Burner':'Fast runner who plants once and explodes vertically.','Patient Slasher':'Vision-based runner who waits for blocks and attacks the correct crease.',
 'Boundary Bully':'Physical outside receiver who wins through contact and at the catch point.','Space Hunter':'Finds leverage and open grass; thrives against zones and off coverage.','Route Sculptor':'Technical route runner who creates separation with timing and precision.','Vertical Glider':'Long-speed threat designed to stretch coverage.','Catch-Point Ace':'Wins contested catches and difficult throws.','YAC Creator':'Turns ordinary completions into explosive plays after the catch.','Motion Weapon':'Versatile receiver used through motion, alignment changes and manufactured touches.',
 'Seam Hunter':'Vertical receiving tight end who attacks linebackers and safeties.','Inline Mauler':'Traditional attached tight end whose blocking value drives his role.','Move Chesspiece':'Flexible receiver who aligns in the slot, wing or detached formations.','Red-Zone Tower':'Size and ball-skill specialist who becomes most valuable near the goal line.','Backfield Hybrid':'H-back and fullback-style player who moves between backfield and tight-end responsibilities.',
 'Island Protector':'Pass-protection tackle trusted alone against premium rushers.','Movement Tackle':'Athletic tackle suited for space, movement and wide run concepts.','Power Edge':'Strength-first tackle who wins through anchor and displacement.','Long-Frame Project':'Prototype body with traits that require technical development.','Drive Blocker':'Displacement blocker built for downhill run concepts.','Phone-Booth Anchor':'Compact interior protector who wins in tight space.','Pulling Guard':'Athletic guard who is most valuable on movement assignments.','Interior Technician':'Precision blocker with hand use, awareness and consistency.','Protection Quarterback':'Smart center who organizes protection and wins through recognition.','Leverage Center':'Technique and power center who wins through pad level and positioning.','Movement Pivot':'Athletic center designed for reach blocks, space and movement.','Power Pivot':'Strength-heavy center for physical interior run games.',
 'Pocket Wrecker':'Complete pass rusher with enough speed, technique and power to collapse protections.','Speed Bender':'Outside rusher who wins with first-step burst and cornering ability.','Power Setter':'Strength-first edge who can rush and adds substantial edge-setting value.','Chaos Rusher':'Unpredictable, high-variance athlete who creates pressure from multiple paths.','Run-Side Anchor':'Edge defender whose primary value is controlling the run and maintaining structure.','Pocket Crusher':'Interior power rusher who compresses the pocket.','Gap Eater':'Space-eating interior defender built to absorb blocks and control the run.','Penetrator':'Quick upfield tackle who attacks gaps before blocks develop.','Two-Gap Anchor':'Heavy interior defender who reads and controls multiple gaps.','Interior Disruptor':'Balanced interior playmaker capable of pressure and backfield disruption.',
 'Range Hunter':'Pursuit linebacker built to cover ground and finish plays.','Box Enforcer':'Physical downhill linebacker strongest against the run.','Coverage Rover':'Space linebacker used against backs, tight ends and underneath passing concepts.','Pressure Backer':'Blitz and rush-oriented linebacker who threatens the backfield.','Traffic Director':'Smart communicator who organizes the defense and consistently finds the football.','Mirror Corner':'Man-coverage technician who stays attached through route movement.','Press Eraser':'Physical press corner designed to disrupt receivers at the line.','Ball Hunter':'Aggressive playmaker who trades some conservatism for takeaways.','Boundary Fighter':'Physical outside corner who handles contact and run-support duties.','Slot Shadow':'Quick-processing nickel corner built to survive inside traffic.','Centerfielder':'Deep-range safety who closes space and hunts throws.','Box Hammer':'Physical safety whose strongest work happens near the line of scrimmage.','Coverage Eraser':'Versatile coverage safety who repairs mistakes and eliminates passing windows.','Hybrid Rover':'Multi-role safety capable of box, slot and deep assignments.','Trigger Safety':'Fast-processing safety who diagnoses quickly and attacks the play downhill.',
 'Pressure Leg':'Composure-driven kicker whose value increases in high-leverage attempts.','Range Kicker':'Power specialist capable of extending field-goal range.','Placement Specialist':'Accuracy and control kicker who prioritizes repeatable mechanics.','Field Flipper':'Distance-oriented punter who changes field position.','Hang-Time Specialist':'Control and power punter built to reduce return opportunities.','Directional Punter':'Placement-focused punter who prioritizes location and control.'
};
const ARCHETYPE_META=Object.fromEntries(Object.values(STYLES).flat().map(style=>[style,{display:ARCHETYPE_LABELS[style]||style,short:ARCHETYPE_DESCRIPTIONS[style]||'Player identity.',strengths:[...(STYLE_TRAITS[style]||[])]}]));
function archetypeMeta(style){return ARCHETYPE_META[style]||{display:style||'Unknown archetype',short:'Player identity.',strengths:[...(STYLE_TRAITS[style]||[])]}}
function archetypeLabel(style){return archetypeMeta(style).display}
function archetypeDescription(style){return archetypeMeta(style).short}
function archetypePosition(style){return Object.keys(STYLES).find(pos=>STYLES[pos].includes(style))||''}
function archetypeChipHTML(style){return `<button type="button" class="archetype-chip" data-archetype="${style}">${archetypeLabel(style)}</button>`}
const BODY={QB:[[70,78],[185,245]],RB:[[66,73],[175,235]],WR:[[67,78],[165,230]],TE:[[73,80],[220,275]],OT:[[75,81],[275,350]],OG:[[72,78],[280,350]],C:[[71,77],[275,335]],EDGE:[[72,79],[215,285]],DT:[[71,78],[270,350]],LB:[[70,77],[205,255]],CB:[[67,75],[165,215]],S:[[68,77],[180,225]],K:[[68,76],[165,225]],P:[[70,78],[175,230]]};
const OFF_SCHEMES={
 'Tempo Spread':{pass:.61,pace:91,traits:['speed','iq','technique'],qb:['Rhythm Distributor','Off-Script Creator','Run-First Weapon']},
 'Vertical Strike':{pass:.66,pace:73,traits:['speed','power','composure'],qb:['Vertical Hunter','Power Creator','Backyard Magician']},
 'Rhythm Control':{pass:.58,pace:67,traits:['iq','technique','composure'],qb:['Rhythm Distributor','Field Architect']},
 'Ground Pressure':{pass:.37,pace:58,traits:['power','technique','durability'],qb:['Power Creator','Field Architect']},
 'Option Motion':{pass:.35,pace:82,traits:['speed','versatility','iq'],qb:['Run-First Weapon','Off-Script Creator']},
 'Heavy Play Action':{pass:.46,pace:55,traits:['power','iq','technique'],qb:['Field Architect','Vertical Hunter','Power Creator']},
 'Multiple':{pass:.51,pace:68,traits:['versatility','iq','technique'],qb:['Field Architect','Off-Script Creator','Rhythm Distributor']}
};
const DEF_SCHEMES={
 'Pressure Multiple':{pressure:88,coverage:66,run:73,traits:['speed','technique','versatility']},
 'Odd Front Control':{pressure:70,coverage:68,run:88,traits:['power','technique','iq']},
 'Four-Down Attack':{pressure:82,coverage:65,run:80,traits:['power','speed','technique']},
 'Match Quarters':{pressure:66,coverage:91,run:69,traits:['iq','speed','technique']},
 'Aggressive Man':{pressure:79,coverage:86,run:65,traits:['speed','technique','composure']},
 'Split-Safety Control':{pressure:61,coverage:88,run:76,traits:['iq','technique','versatility']},
 'Contain & Rally':{pressure:57,coverage:78,run:86,traits:['iq','power','durability']}
};
const PRIORITIES=['Prestige','NIL','Development','Early Role','Coaching','Academics','Scheme Fit','Winning','Stay Close','Campus Life'];
const PROMISES=['None','Early Role','Position Lock','No Redshirt','Development Plan','NIL Priority'];
const INJURIES=['Ankle sprain','Hamstring strain','Shoulder sprain','Knee sprain','Hand injury','Concussion protocol','Back strain'];
const TEAM_TRAINING={
 'Balanced':{desc:'Broad development with no major tradeoff.',attrs:{}},
 'Strength & Mass':{desc:'More strength and healthy weight gain; modest speed-retention risk.',attrs:{power:1.5,durability:.4}},
 'Speed & Explosion':{desc:'Prioritizes movement skills; less mass gain and more soft-tissue exposure.',attrs:{speed:1.4,versatility:.4}},
 'Fundamentals':{desc:'Technique-heavy offseason with reliable floor improvement.',attrs:{technique:1.4,iq:.4}},
 'Conditioning':{desc:'Durability, recovery and late-game readiness over raw skill growth.',attrs:{durability:1.2,composure:.5}},
 'Scheme Installation':{desc:'Accelerates system mastery and position familiarity.',attrs:{iq:.9,technique:.4,versatility:.4}}
};
const INDIVIDUAL_TRAINING=['Balanced','Technique','Athleticism','Strength','Football IQ','Conditioning','Rehab','Position Transition'];
const GROWTH_PROFILE_KEYS=['early','steady','steady','steady','late','volatile','physical','near'];
const GROWTH_CURVES={early:[1.35,1.10,.72,.45],steady:[1.02,1.00,.90,.70],late:[.55,.82,1.25,1.38],volatile:[1,1,1,1],physical:[1.18,1.08,.82,.58],near:[.52,.43,.34,.25]};
const SCOUT_DOMAIN_GROUPS={
 QB:[['arm','Arm Strength',{power:.7,technique:.3}],['accuracy','Accuracy',{technique:.7,composure:.3}],['processing','Processing',{iq:.7,composure:.3}],['mobility','Mobility',{speed:.7,versatility:.3}]],
 RB:[['athleticism','Athleticism',{speed:.65,versatility:.35}],['vision','Vision',{iq:.55,technique:.45}],['contact','Contact Ability',{power:.65,durability:.35}],['receiving','Receiving',{technique:.55,versatility:.45}]],
 WR:[['athleticism','Athleticism',{speed:.7,power:.3}],['route','Route Skill',{technique:.65,iq:.35}],['hands','Hands',{technique:.6,composure:.4}],['separation','Separation',{speed:.55,technique:.45}]],
 TE:[['athleticism','Athleticism',{speed:.55,power:.45}],['receiving','Receiving',{technique:.55,composure:.25,iq:.2}],['blocking','Blocking',{power:.55,technique:.45}],['processing','Processing',{iq:.65,versatility:.35}]],
 OL:[['power','Power',{power:.75,durability:.25}],['technique','Technique',{technique:.75,iq:.25}],['protection','Pass Protection',{technique:.55,iq:.3,composure:.15}],['mobility','Mobility',{speed:.5,versatility:.5}]],
 EDGE:[['burst','Burst',{speed:.65,versatility:.35}],['power','Power',{power:.7,durability:.3}],['rush','Rush Skill',{technique:.65,iq:.35}],['discipline','Run Discipline',{iq:.5,technique:.3,power:.2}]],
 DT:[['power','Power',{power:.75,durability:.25}],['getoff','Get-off',{speed:.45,technique:.4,composure:.15}],['technique','Technique',{technique:.7,iq:.3}],['anchor','Run Anchor',{power:.55,durability:.3,iq:.15}]],
 LB:[['range','Range',{speed:.55,versatility:.45}],['processing','Processing',{iq:.7,composure:.3}],['tackling','Tackling',{technique:.5,power:.3,durability:.2}],['coverage','Coverage',{speed:.4,technique:.35,iq:.25}]],
 DB:[['athleticism','Athleticism',{speed:.7,versatility:.3}],['coverage','Coverage',{technique:.55,speed:.3,iq:.15}],['ball','Ball Skills',{technique:.5,composure:.3,iq:.2}],['processing','Processing',{iq:.65,composure:.35}]],
 ST:[['leg','Leg Strength',{power:.8,durability:.2}],['control','Control',{technique:.75,iq:.25}],['pressure','Pressure',{composure:.75,iq:.25}],['athleticism','Athleticism',{speed:.55,versatility:.45}]]
};
const POSITION_TRANSITIONS={QB:['WR','RB'],RB:['WR','S'],WR:['TE','RB','CB'],TE:['WR','OT'],OT:['OG','TE'],OG:['C','OT'],C:['OG'],EDGE:['LB','DT'],DT:['EDGE'],LB:['EDGE','S'],CB:['S','WR'],S:['CB','LB'],K:['P'],P:['K']};
const CLASS_NAMES=['FR','SO','JR','SR'];
const ROLE_DEFS=[
 {id:'QB1',label:'Starting QB',side:'Offense',eligible:['QB'],base:true,weights:{iq:.30,technique:.28,composure:.22,speed:.10,power:.10}},
 {id:'RB1',label:'Lead Back',side:'Offense',eligible:['RB'],base:true,weights:{speed:.25,power:.25,technique:.24,iq:.14,durability:.12}},
 {id:'3DRB',label:'Third-Down Back',side:'Offense',eligible:['RB'],weights:{speed:.28,technique:.26,iq:.24,versatility:.22}},
 {id:'PWRB',label:'Power / Goal-Line Back',side:'Offense',eligible:['RB','TE'],weights:{power:.42,durability:.25,technique:.18,composure:.15}},
 {id:'X',label:'X Receiver',side:'Offense',eligible:['WR','TE'],base:true,weights:{power:.26,technique:.28,speed:.20,composure:.16,iq:.10}},
 {id:'Z',label:'Z Receiver',side:'Offense',eligible:['WR'],base:true,weights:{speed:.34,technique:.28,iq:.18,composure:.12,versatility:.08}},
 {id:'SLOT',label:'Slot Receiver',side:'Offense',eligible:['WR','TE','RB'],base:true,weights:{speed:.23,technique:.27,iq:.26,versatility:.24}},
 {id:'TE1',label:'Inline Tight End',side:'Offense',eligible:['TE'],base:true,weights:{power:.30,technique:.30,iq:.18,durability:.14,versatility:.08}},
 {id:'MOVETE',label:'Move TE / H-Back',side:'Offense',eligible:['TE','WR','RB'],weights:{versatility:.31,speed:.20,iq:.22,technique:.17,power:.10}},
 {id:'LT',label:'Left Tackle',side:'Offense',eligible:['OT'],base:true,weights:{technique:.38,power:.25,iq:.19,speed:.10,durability:.08}},
 {id:'LG',label:'Left Guard',side:'Offense',eligible:['OG'],base:true,weights:{power:.34,technique:.34,iq:.16,durability:.10,versatility:.06}},
 {id:'C1',label:'Center',side:'Offense',eligible:['C'],base:true,weights:{iq:.31,technique:.31,power:.22,composure:.10,versatility:.06}},
 {id:'RG',label:'Right Guard',side:'Offense',eligible:['OG'],base:true,weights:{power:.36,technique:.31,iq:.15,durability:.12,versatility:.06}},
 {id:'RT',label:'Right Tackle',side:'Offense',eligible:['OT'],base:true,weights:{power:.30,technique:.31,iq:.17,durability:.12,speed:.10}},
 {id:'RUSH',label:'Rush EDGE',side:'Defense',eligible:['EDGE','LB'],base:true,weights:{speed:.29,technique:.30,power:.23,iq:.10,composure:.08}},
 {id:'SETEDGE',label:'Strong-Side EDGE',side:'Defense',eligible:['EDGE','LB'],base:true,weights:{power:.34,technique:.28,durability:.16,iq:.14,speed:.08}},
 {id:'NT',label:'Nose / One-Tech',side:'Defense',eligible:['DT'],base:true,weights:{power:.42,durability:.22,technique:.22,iq:.09,composure:.05}},
 {id:'3TECH',label:'3-Tech / Interior Rush',side:'Defense',eligible:['DT','EDGE'],base:true,weights:{technique:.31,power:.27,speed:.18,iq:.14,durability:.10}},
 {id:'MIKE',label:'MIKE Linebacker',side:'Defense',eligible:['LB'],base:true,weights:{iq:.31,power:.22,technique:.22,speed:.13,composure:.12}},
 {id:'WILL',label:'WILL / Range Backer',side:'Defense',eligible:['LB','S'],base:true,weights:{speed:.28,iq:.27,technique:.23,versatility:.14,composure:.08}},
 {id:'NICKEL',label:'Nickel Defender',side:'Defense',eligible:['CB','S','LB'],weights:{speed:.28,technique:.28,iq:.24,versatility:.20}},
 {id:'BCB',label:'Boundary Corner',side:'Defense',eligible:['CB'],base:true,weights:{technique:.31,power:.19,speed:.25,composure:.15,iq:.10}},
 {id:'FCB',label:'Field Corner',side:'Defense',eligible:['CB'],base:true,weights:{speed:.34,technique:.29,iq:.17,composure:.12,versatility:.08}},
 {id:'SLOTCB',label:'Slot Corner',side:'Defense',eligible:['CB','S'],weights:{speed:.27,technique:.28,iq:.25,versatility:.20}},
 {id:'FS',label:'Deep Safety',side:'Defense',eligible:['S','CB'],base:true,weights:{iq:.31,speed:.26,technique:.23,composure:.12,versatility:.08}},
 {id:'BOXS',label:'Box Safety',side:'Defense',eligible:['S','LB'],base:true,weights:{power:.27,iq:.25,technique:.23,speed:.13,durability:.12}},
 {id:'K1',label:'Kicker',side:'Special Teams',eligible:['K'],base:true,weights:{technique:.45,composure:.35,power:.20}},
 {id:'P1',label:'Punter',side:'Special Teams',eligible:['P'],base:true,weights:{power:.35,technique:.37,composure:.28}},
 {id:'KR',label:'Kick Returner',side:'Special Teams',eligible:['WR','RB','CB'],weights:{speed:.48,versatility:.24,composure:.16,technique:.12}},
 {id:'PR',label:'Punt Returner',side:'Special Teams',eligible:['WR','RB','CB'],weights:{speed:.37,technique:.25,iq:.18,versatility:.20}}
];
const ROLE_BY_ID=Object.fromEntries(ROLE_DEFS.map(r=>[r.id,r]));
const POS_ROLE={QB:'QB1',RB:'RB1',WR:'X',TE:'TE1',OT:'LT',OG:'LG',C:'C1',EDGE:'RUSH',DT:'3TECH',LB:'MIKE',CB:'BCB',S:'FS',K:'K1',P:'P1'};
const RECORD_CATS={passYds:'Passing Yards',passTD:'Passing TD',rushYds:'Rushing Yards',rushTD:'Rushing TD',recYds:'Receiving Yards',recTD:'Receiving TD',receptions:'Receptions',tackles:'Tackles',tfl:'Tackles for Loss',sacks:'Sacks',pressures:'Pressures',intDef:'Interceptions'};
const OFF_POS=new Set(['QB','RB','WR','TE','OT','OG','C','K','P']);
const PLAYER_TRAITS=['speed','power','technique','iq','composure','durability','versatility'];
let schools=[],universe=null,developmentResultsPhase='',developmentResultsFilter='ALL',developmentResultsSort='jump';

let gameplayRng=null,gameplayRngUniverse=null;
function freshGameplaySeed(){const words=new Uint32Array(2),c=globalThis.crypto;if(c?.getRandomValues){c.getRandomValues(words);return `${words[0].toString(16).padStart(8,'0')}${words[1].toString(16).padStart(8,'0')}`}return `local-${Date.now().toString(36)}`}
function legacyGameplaySeed(u){return `legacy:${u?.year||0}:${u?.week||0}:${u?.teams?.[0]?.id||u?.teams?.[0]?.name||'dynasty'}`}
function activateGameplayRng(saved,owner=null){gameplayRng=DynastyRng.create(saved??freshGameplaySeed());gameplayRngUniverse=owner;return gameplayRng}
function ensureGameplayRng(){if(universe&&gameplayRngUniverse!==universe)activateGameplayRng(universe.rng??legacyGameplaySeed(universe),universe);else if(!gameplayRng)activateGameplayRng();return gameplayRng}
function syncGameplayRng(u=universe){if(u&&gameplayRng&&(!gameplayRngUniverse||gameplayRngUniverse===u)){u.rng=gameplayRng.snapshot();gameplayRngUniverse=u}return u?.rng||null}
function gameplayRandom(){return ensureGameplayRng().next()}
const rng=(a,b)=>gameplayRandom()*(b-a)+a, gi=(a,b)=>Math.floor(rng(a,b+1)), pick=a=>a[gi(0,a.length-1)], clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function gauss(){let u=0,v=0;while(!u)u=gameplayRandom();while(!v)v=gameplayRandom();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function uid(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():`${Date.now()}-${Math.random()}`}
function grade(v){return v>=94?'A+':v>=90?'A':v>=86?'A-':v>=82?'B+':v>=78?'B':v>=74?'B-':v>=70?'C+':v>=66?'C':v>=62?'C-':v>=57?'D+':v>=52?'D':'F'}
function stars(v){return v>=91?5:v>=82?4:v>=70?3:v>=58?2:1}
