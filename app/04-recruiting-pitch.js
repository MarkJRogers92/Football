// app/04-recruiting-pitch.js: Recruit consideration lists, geography, recruiter relationships and the pitch. Part of app.js; see tools/app-source.js.
// A recruit's real list: the programs that pitch him best. Before this, every choice was made among a random 20 of the
// 120 programs, so a blue-blood was in the running for a given prospect only a sixth of the time and elite talent
// spread almost evenly across the league. Cached per recruit and refreshed at the season's turn and at midseason
// (records move the pitch); the user's program is left to the user's own recruiting.
const RECRUIT_LIST_SIZE=6,RECRUIT_RANDOM_LOOK=14;
function recruitAiList(r){
 const stamp=`${universe.year}:${universe.week<6?0:1}`;
 if(r.aiList?.stamp===stamp)return r.aiList.ids.map(id=>teamById(id)).filter(Boolean);
 const user=selected()?.name,ranked=universe.teams.filter(t=>t.name!==user).map(t=>({t,p:recruitPitch(t,r)})).sort((a,b)=>b.p-a.p).slice(0,RECRUIT_LIST_SIZE).map(x=>x.t);
 r.aiList={stamp,ids:ranked.map(t=>t.id)};return ranked;
}
function recruitConsideration(r,n=RECRUIT_RANDOM_LOOK){const list=recruitAiList(r),seen=new Set(list.map(t=>t.id));return[...list,...sample(universe.teams,n).filter(t=>!seen.has(t.id))]}
// Programs spend early scholarships on prospects at their level; anyone can sign late. The user's program decides
// for itself.
// Strong programs also keep room for the prospects they expect to land: below their target level they fill at most
// 60% of the class before signing week.
function aiWantsRecruit(t,r){
 if(!t||t.name===selected()?.name||universe.week>=10)return true;
 const stars=r.stars||1,floor=t.prestige>=85?3:t.prestige>=70?2:1,target=t.prestige>=85?4:t.prestige>=70?3:t.prestige>=55?2:1;
 if(stars>=target)return true;if(stars<floor)return false;
 return classCommitCount(t.name)<Math.floor(scholarshipCapacity(t)*.6)
}
function recruitTopSchools(r,n=5){return universe.teams.map(t=>({t,score:recruitPitch(t,r)+(t.name===selected()?.name&&r.targeted?10+r.relationship*.12:0)})).sort((a,b)=>b.score-a.score).slice(0,n)}
function normalizeRecruitGeography(r,hsPool=universe.highSchools||[]){if(!r.highSchoolId){let h=weightedHighSchool(hsPool);Object.assign(r,{highSchoolId:h.id,highSchool:h.name,homeCity:h.city,homeState:h.state,lat:h.lat,lon:h.lon,homeRegion:h.region,distanceImportance:gi(5,100),distanceTolerance:pick([100,150,250,400,600,900,1500,2500])})}r.prevInterest??=r.interest;r.trend??=0;ensureRecruitRelationships(r)}
function recruitHash(value){let h=2166136261>>>0;for(const ch of String(value??'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function ensureRecruitRelationships(r){if(!r)return r;r.coachRelationships??={};r.primaryRecruiterCoachId??=r.recruitingMemory?.primaryRecruiterCoachId||r.recruitingMemory?.recruiterCoachId||null;return r}
function primaryRecruiterFor(t,r){if(!t||!r)return null;ensureRecruitRelationships(r);let existing=r.primaryRecruiterCoachId&&Object.values(t.staff||{}).find(c=>c?.id===r.primaryRecruiterCoachId);if(existing)return existing;const side=OFF_POS.has(r.pos)&&!['K','P'].includes(r.pos)?t.staff?.OC:(!OFF_POS.has(r.pos)?t.staff?.DC:null),roll=recruitHash(`${r.id}|${t.id}|primary`)%100;return roll<45?t.staff?.RC:roll<85?(side||t.staff?.RC):t.staff?.HC}
function deterministicRecruitRelationship(r,t,c){const wiggle=(recruitHash(`${r.id}|${t.id}|${c.id}|rel`)%17)-8;return clamp(Math.round(38+(r.stars||3)*4+(c.recruiting||60)*.10+wiggle),28,90)}
function assignPrimaryRecruiter(r,t,relationship=null){ensureRecruitRelationships(r);const c=primaryRecruiterFor(t,r);if(!c)return null;r.primaryRecruiterCoachId=c.id;const base=relationship==null?deterministicRecruitRelationship(r,t,c):clamp(Math.round(relationship),0,100);r.coachRelationships[c.id]=Math.max(r.coachRelationships[c.id]??0,base);return c}
function growRecruiterRelationship(r,t,gain){ensureRecruitRelationships(r);let c=primaryRecruiterFor(t,r);if(!c)return null;r.primaryRecruiterCoachId=c.id;const start=r.coachRelationships[c.id]??clamp(r.relationship??45,20,85);r.coachRelationships[c.id]=clamp(start+Math.max(0,gain||0),0,100);return c}
function coachRelationshipValue(person,coachId,fallback=20){if(!person||!coachId)return fallback;return clamp(person.coachRelationships?.[coachId]??fallback,0,100)}
function recruitCoachRelationshipBoost(t,r){if(!t||!r)return 0;ensureRecruitRelationships(r);let best=20;for(const c of Object.values(t.staff||{}))best=Math.max(best,coachRelationshipValue(r,c.id,20));return clamp((best-20)*.10,0,8)}
function coachRelationshipPortability(c,person){let factor=.50+(c?.recruiting||60)/260;if(person?.priority==='Coaching')factor*=1.12;else if(person?.priority==='Stay Close')factor*=.88;else if(person?.composure!=null)factor*=1+(70-person.composure)/300;return clamp(factor,.35,.95)}
function coachTransferPressure(p){const x=p?.coachDeparturePressure;if(!x||x.fromSchoolId!==p.currentSchoolId)return 0;const age=universe.year-(x.season??universe.year);if(age<0||age>1)return 0;const factor=x.toSchoolId?(age===0?.28:.20):(age===0?.16:.11);return clamp(Math.round((x.strength||0)*factor),0,20)}
function mergeShares(parts,cap=Infinity){let out=new Map();for(const x of parts){if(!x||!x.p)continue;let cur=out.get(x.p.id);if(cur)cur.weight+=x.weight;else out.set(x.p.id,{p:x.p,weight:x.weight})}let a=[...out.values()];for(const x of a)x.weight=Math.min(x.weight,cap);return a}
function splitInteger(total,parts){if(!parts.length||total<=0)return new Map();let sum=parts.reduce((a,x)=>a+Math.max(.01,x.weight),0),raw=parts.map(x=>({p:x.p,v:total*Math.max(.01,x.weight)/sum})),out=new Map(raw.map(x=>[x.p,Math.floor(x.v)])),left=total-[...out.values()].reduce((a,b)=>a+b,0);raw.sort((a,b)=>(b.v-Math.floor(b.v))-(a.v-Math.floor(a.v)));for(let i=0;i<left;i++)out.set(raw[i%raw.length].p,(out.get(raw[i%raw.length].p)||0)+1);return out}
const QB_RUSH_STYLE_WEIGHT={'Rhythm Distributor':.03,'Field Architect':.04,'Off-Script Creator':.095,'Vertical Hunter':.045,'Power Creator':.075,'Run-First Weapon':.155,'Toolsy Project':.065,'Backyard Magician':.085};
const QB_RUSH_SCHEME_WEIGHT={'Tempo Spread':.025,'Vertical Strike':0,'Rhythm Control':-.005,'Ground Pressure':.015,'Option Motion':.065,'Heavy Play Action':.005,'Multiple':.01};
function qbRushWeight(q,team){if(!q)return 0;const base=QB_RUSH_STYLE_WEIGHT[q.style]??.055,scheme=QB_RUSH_SCHEME_WEIGHT[team?.offScheme]??0,mobility=clamp((((q.speed??q.trueNow)*.65+(q.versatility??q.trueNow)*.35)-70)*.0015,-.035,.045);return Math.round(clamp(base+scheme+mobility,.02,.26)*1000)/1000}
// Opportunity multipliers say how a player is used inside his assigned role.
// Ratings still decide role fit and how efficiently the resulting chances go.
const STYLE_USAGE={
 'Gap Hammer':{carry:1.18,target:.72},'Space Cutter':{carry:1.02,target:1.08},'Contact Glider':{carry:1.12,target:.86},'Third-Down Weapon':{carry:.72,target:1.55},'One-Cut Burner':{carry:1.15,target:.72},'Patient Slasher':{carry:1.08,target:.88},
 'Boundary Bully':{target:1.04},'Space Hunter':{target:1.10},'Route Sculptor':{target:1.12},'Vertical Glider':{target:.94},'Catch-Point Ace':{target:1.04},'YAC Creator':{target:1.02},'Motion Weapon':{target:1.10},
 'Seam Hunter':{target:1.10,protect:1.08},'Inline Mauler':{target:.78,protect:.86},'Move Chesspiece':{target:1.18,protect:1.12},'Red-Zone Tower':{target:1.02,protect:1.06},'Backfield Hybrid':{target:1.16,protect:1.04},
 'Island Protector':{protect:.78},'Movement Tackle':{protect:1.08},'Power Edge':{protect:.90},'Long-Frame Project':{protect:1.15},'Drive Blocker':{protect:1.05},'Phone-Booth Anchor':{protect:.82},'Pulling Guard':{protect:1.12},'Interior Technician':{protect:.80},'Protection Quarterback':{protect:.76},'Leverage Center':{protect:.86},'Movement Pivot':{protect:1.10},'Power Pivot':{protect:.92},
 'Pocket Wrecker':{rush:1.24,tackle:.94},'Speed Bender':{rush:1.20,tackle:.88},'Power Setter':{rush:.94,tackle:1.18},'Chaos Rusher':{rush:1.16,tackle:.92},'Run-Side Anchor':{rush:.78,tackle:1.25},'Pocket Crusher':{rush:1.18,tackle:1.02},'Gap Eater':{rush:.76,tackle:1.25},'Penetrator':{rush:1.22,tackle:.94},'Two-Gap Anchor':{rush:.74,tackle:1.28},'Interior Disruptor':{rush:1.20,tackle:1.00},
 'Range Hunter':{tackle:1.14,coverage:1.04,takeaway:1.04},'Box Enforcer':{tackle:1.24,coverage:.82,takeaway:.86},'Coverage Rover':{tackle:.94,coverage:1.18,takeaway:1.12},'Pressure Backer':{tackle:1.00,rush:1.22,coverage:.84},'Traffic Director':{tackle:1.10,coverage:1.10,takeaway:1.08},
 'Mirror Corner':{coverage:1.18,takeaway:.94,tackle:.88},'Press Eraser':{coverage:1.14,takeaway:.96,tackle:1.00},'Ball Hunter':{coverage:1.04,takeaway:1.30,tackle:.88},'Boundary Fighter':{coverage:1.00,takeaway:.94,tackle:1.15},'Slot Shadow':{coverage:1.16,takeaway:1.02,tackle:1.04},
 'Centerfielder':{coverage:1.12,takeaway:1.22,tackle:.88},'Box Hammer':{coverage:.82,takeaway:.88,tackle:1.28},'Coverage Eraser':{coverage:1.22,takeaway:1.12,tackle:.90},'Hybrid Rover':{coverage:1.06,takeaway:1.04,tackle:1.12},'Trigger Safety':{coverage:1.04,takeaway:1.14,tackle:1.10}
};
function playerUsageWeight(p,kind,base=1){return !p?0:base*(STYLE_USAGE[p.style]?.[kind]??1)}
function rushingShares(team){const q=roleStarter(team,'QB1')||starter(team,'QB'),part=(p,weight)=>({p,weight:p?.pos==='QB'?weight:playerUsageWeight(p,'carry',weight)});return mergeShares([part(roleStarter(team,'RB1'),.46),part(rotationAt(team,'RB',1),.19),part(roleStarter(team,'3DRB'),.11),part(roleStarter(team,'PWRB'),.10),part(rotationAt(team,'RB',2),.06),part(q,qbRushWeight(q,team))],.62)}
function receivingShares(team){const part=(p,weight)=>({p,weight:playerUsageWeight(p,'target',weight)});return mergeShares([part(roleStarter(team,'X'),.21),part(roleStarter(team,'Z'),.19),part(roleStarter(team,'SLOT'),.18),part(roleStarter(team,'TE1'),.14),part(roleStarter(team,'3DRB'),.08),part(roleStarter(team,'MOVETE'),.05),part(rotationAt(team,'WR',3),.07),part(rotationAt(team,'WR',4),.04),part(rotationAt(team,'TE',1),.04)],.36)}
function defensiveShares(team){return mergeShares([...['MIKE','WILL','BOXS','FS','BCB','FCB','NICKEL','RUSH','SETEDGE','3TECH','NT'].map(id=>({p:roleStarter(team,id),weight:1})),...[['DT',.52],['EDGE',.44],['LB',.34],['CB',.28],['S',.26]].flatMap(([pos,w])=>[{p:rotationAt(team,pos,2),weight:w},{p:rotationAt(team,pos,3),weight:w*.45}])],1.35)}
function defensiveActor(team,kind,positions){const traits={tackle:{iq:.5,technique:.5},rush:{technique:.45,speed:.35,power:.2},takeaway:{iq:.4,technique:.35,speed:.25},coverage:{technique:.5,speed:.3,iq:.2}}[kind]||{iq:.5,technique:.5},parts=defensiveShares(team).filter(x=>!positions||positions.includes(x.p.pos)).map(x=>({p:x.p,weight:x.weight*playerUsageWeight(x.p,kind)*Object.entries(traits).reduce((n,[key,w])=>n+(x.p[key]??x.p.trueNow)*w,0)}));return weightedPlayer(parts)}
function weightedPlayer(parts){if(!parts.length)return null;const total=parts.reduce((n,x)=>n+Math.max(.01,x.weight),0);let roll=gameplayRandom()*total;for(const x of parts){roll-=Math.max(.01,x.weight);if(roll<=0)return x.p}return parts.at(-1).p}
function fieldGoalChance(k,distance=38,pressure=false){if(!k)return .55;const rangePenalty=Math.max(0,distance-32)*(.0095-Math.max(-20,k.power-70)*.00004),pressureWeight=pressure?.003:.0015;return clamp(.90+(k.technique-75)*.005+(k.power-75)*.002+(k.composure-75)*pressureWeight-rangePenalty,.20,.98)}
function quickFieldGoals(team,attempts,O,D){const k=roleStarter(team,'K1')||starter(team,'K');let made=0;for(let i=0;i<attempts;i++){const distance=clamp(Math.round(39+(D.defense-O.offense)*.10+gauss()*6),22,59);if(gameplayRandom()<fieldGoalChance(k,distance,i===attempts-1))made++}return made}
function puntAverage(p,noise=gauss()){return clamp(41+(p?.power-70)*.18+(p?.technique-70)*.08+noise*1.2,33,53)}
function exactOffenseLine(lines,p){let x=lines.get(p.id);if(!x){x={p,stats:newStats()};lines.set(p.id,x)}return x.stats}
function exactDefenseLine(lines,p){let x=lines.get(p.id);if(!x){x={p,stats:newStats()};lines.set(p.id,x)}return x.stats}
function addGameAppearance(p,start=false){if(!p)return;p.stats.games=(p.stats.games||0)+1;if(start)p.stats.starts=(p.stats.starts||0)+1}
function applyGameStats(team,s,opp,exactOffense=null,exactDefense=null){const q=roleStarter(team,'QB1')||starter(team,'QB');let core=[q,roleStarter(team,'RB1'),roleStarter(team,'X'),roleStarter(team,'Z'),roleStarter(team,'SLOT'),roleStarter(team,'TE1'),roleStarter(team,'LT'),roleStarter(team,'LG'),roleStarter(team,'C1'),roleStarter(team,'RG'),roleStarter(team,'RT'),roleStarter(team,'RUSH'),roleStarter(team,'SETEDGE'),roleStarter(team,'NT'),roleStarter(team,'3TECH'),roleStarter(team,'MIKE'),roleStarter(team,'WILL'),roleStarter(team,'NICKEL'),roleStarter(team,'BCB'),roleStarter(team,'FCB'),roleStarter(team,'FS'),roleStarter(team,'BOXS')].filter(Boolean);const starters=new Set();for(const p of [...new Map(core.map(p=>[p.id,p])).values()]){addGameAppearance(p,true);starters.add(p.id)}
 let qbs=[],rushers=[],recs=[];if(exactOffense){for(const x of exactOffense.values()){for(const k of ['passAtt','passComp','passYds','passTD','int','sacksTaken','rushAtt','rushYds','rushTD','targets','receptions','recYds','recTD','drops','yac'])x.p.stats[k]+=(x.stats[k]||0);if(x.stats.passAtt||x.stats.sacksTaken)qbs.push({p:x.p});if(x.stats.rushAtt)rushers.push({p:x.p});if(x.stats.targets)recs.push({p:x.p})}}
 else{const qb2=rotationAt(team,'QB',1),margin=(s.pts||0)-(opp?.pts||0),qb2Share=!qb2?0:margin>=35?.32:margin>=21?.20:0;qbs=qb2Share?[{p:q,weight:1-qb2Share},{p:qb2,weight:qb2Share}]:[{p:q,weight:1}];qbs=mergeShares(qbs.filter(x=>x.p));if(qbs.length){for(const k of ['passAtt','passComp','passYds','passTD','int','sacksTaken']){let split=splitInteger(s[k]||0,qbs);for(const x of qbs)x.p.stats[k]+=(split.get(x.p)||0)}}
 rushers=rushingShares(team);let att=splitInteger(s.rushAtt||0,rushers),yds=splitInteger(Math.max(0,s.rushYds||0),rushers.map(x=>({p:x.p,weight:x.weight*(x.p.speed*.45+x.p.power*.35+x.p.iq*.20)}))),td=splitInteger(s.rushTD||0,rushers.map(x=>({p:x.p,weight:x.weight*(x.p.power*.6+x.p.composure*.4)})));for(const x of rushers){x.p.stats.rushAtt+=(att.get(x.p)||0);x.p.stats.rushYds+=(yds.get(x.p)||0);x.p.stats.rushTD+=(td.get(x.p)||0)}
 recs=receivingShares(team);let catches=splitInteger(s.passComp||0,recs.map(x=>({p:x.p,weight:x.weight*(x.p.technique*.55+x.p.iq*.30+x.p.composure*.15)}))),extraTargets=splitInteger(Math.max(0,(s.passAtt||0)-(s.passComp||0)),recs),ryds=splitInteger(Math.max(0,s.passYds||0),recs.map(x=>({p:x.p,weight:x.weight*(x.p.speed*.42+x.p.technique*.38+x.p.power*.2)}))),rtd=splitInteger(s.passTD||0,recs.map(x=>({p:x.p,weight:x.weight*(x.p.technique*.45+x.p.power*.3+x.p.composure*.25)})));for(const x of recs){let c=catches.get(x.p)||0,tg=c+(extraTargets.get(x.p)||0);x.p.stats.targets+=tg;x.p.stats.receptions+=c;x.p.stats.recYds+=(ryds.get(x.p)||0);x.p.stats.recTD+=(rtd.get(x.p)||0);x.p.stats.yac+=Math.round((ryds.get(x.p)||0)*rng(.25,.48));x.p.stats.drops+=Math.max(0,Math.round((tg-c)*clamp((90-x.p.technique)/250,0,.15)))} }
 let defShares=defensiveShares(team),def=defShares.map(x=>x.p);
 if(exactDefense){for(const x of exactDefense.values())for(const k of ['tackles','tfl','sacks','pressures','intDef','passBreakups','forcedFumbles'])x.p.stats[k]+=(x.stats[k]||0)}
 else{let posWeight=p=>(p.pos==='LB'?1.25:p.pos==='S'?1.05:p.pos==='DT'?.8:1),tackleTotal=Math.max(35,Math.round((opp?.plays||65)*.72)),tacks=splitInteger(tackleTotal,defShares.map(x=>({p:x.p,weight:x.weight*playerUsageWeight(x.p,'tackle')*posWeight(x.p)*(x.p.iq*.5+x.p.technique*.5)})));for(const p of def)p.stats.tackles+=(tacks.get(p)||0);let front=defShares.filter(x=>['EDGE','DT','LB'].includes(x.p.pos)),sacks=splitInteger(opp?.sacksTaken||0,front.map(x=>({p:x.p,weight:x.weight*playerUsageWeight(x.p,'rush')*(x.p.technique*.55+x.p.speed*.25+x.p.power*.2)}))),press=splitInteger(Math.max(opp?.sacksTaken||0,Math.round((opp?.passAtt||30)*.14)),front.map(x=>({p:x.p,weight:x.weight*playerUsageWeight(x.p,'rush')*(x.p.technique*.45+x.p.speed*.35+x.p.power*.2)})));for(const {p} of front){p.stats.sacks+=(sacks.get(p)||0);p.stats.pressures+=(press.get(p)||0);p.stats.tfl+=Math.round((tacks.get(p)||0)*rng(.08,.25))}let db=defShares.filter(x=>['CB','S','LB'].includes(x.p.pos)),ints=splitInteger(opp?.int||0,db.map(x=>({p:x.p,weight:x.weight*playerUsageWeight(x.p,'takeaway')*(x.p.iq*.4+x.p.technique*.35+x.p.speed*.25)}))),pbus=splitInteger(Math.max(0,Math.round(((opp?.passAtt||0)-(opp?.passComp||0)-(opp?.int||0))*0.24)),db.map(x=>({p:x.p,weight:x.weight*playerUsageWeight(x.p,'coverage')*(x.p.technique*.5+x.p.speed*.3+x.p.iq*.2)})));for(const {p} of db){p.stats.intDef+=(ints.get(p)||0);p.stats.passBreakups+=(pbus.get(p)||0)}}
 let ol=[...new Map(['LT','LG','C1','RG','RT'].map(id=>roleStarter(team,id)).filter(Boolean).map(p=>[p.id,p])).values()],snaps=(s.plays||((s.passAtt||0)+(s.rushAtt||0)+(s.sacksTaken||0)));for(const p of ol)p.stats.snaps+=snaps;let protectionWeight=p=>(110-p.technique)*playerUsageWeight(p,'protect'),sa=splitInteger(s.sacksTaken||0,ol.map(p=>({p,weight:protectionWeight(p)}))),pa=splitInteger(Math.max(s.sacksTaken||0,Math.round((s.passAtt||30)*.07)),ol.map(p=>({p,weight:protectionWeight(p)})));for(const p of ol){p.stats.sacksAllowed+=(sa.get(p)||0);p.stats.pressuresAllowed+=(pa.get(p)||0)}
 let k=roleStarter(team,'K1'),pu=roleStarter(team,'P1');if(k){k.stats.fgMade+=s.fgMade||0;k.stats.fgAtt+=s.fgAtt||0}if(pu){pu.stats.punts+=s.punts||0;pu.stats.puntYds+=Math.round((s.punts||0)*puntAverage(pu))}
 for(const x of [...qbs,...rushers,...recs,...defShares,{p:k},{p:pu}])if(x.p&&!starters.has(x.p.id)){addGameAppearance(x.p,false);starters.add(x.p.id)}}

async function loadSchools(){schools=EMBEDDED_SCHOOLS}
function staffRating(base=65){return clamp(Math.round(base+gauss()*12),25,99)}
function generateCoach(role,school,tenure=null){
 const base=56+school.prestige*.16+school.resources*.08;
 const c={id:uid(),name:personName(),role,age:gi(31,66),recruiting:staffRating(base),development:staffRating(base),evaluation:staffRating(base),playCall:staffRating(base),adaptability:staffRating(base),loyalty:staffRating(63),ambition:staffRating(68),years:tenure==null?gi(0,6):tenure,contractYears:gi(2,5),salary:Math.round((0.35+school.resources/35+school.prestige/45+(role==='Head Coach'?2.4:role.includes('Coordinator')?0.9:0))*10)/10,schoolId:school.id,schoolName:school.name,status:'ACTIVE',careerHistory:[],seasons:[]};
 c.specialties=coachSpecialties(c);
 // Coordinators arrive with a system of their own; ambitious ones are likelier
 // to want to install it rather than inherit what the program already runs.
 if(role==='Offensive Coordinator')c.preferredScheme=c.ambition>=62?pick(Object.keys(OFF_SCHEMES)):(school.offScheme||pick(Object.keys(OFF_SCHEMES)));
 else if(role==='Defensive Coordinator')c.preferredScheme=c.ambition>=62?pick(Object.keys(DEF_SCHEMES)):(school.defScheme||pick(Object.keys(DEF_SCHEMES)));
 return c;
}
function generateStaff(s){return {HC:generateCoach('Head Coach',s),OC:generateCoach('Offensive Coordinator',s),DC:generateCoach('Defensive Coordinator',s),RC:generateCoach('Recruiting Coordinator',s),SC:generateCoach('Strength & Performance',s)}}
function generatePositionAttributes(pos,trueNow){return {speed:clamp(Math.round(trueNow+gauss()*10+(['WR','CB','RB','S'].includes(pos)?7:['DT','OG','C'].includes(pos)?-11:0)),25,99),power:clamp(Math.round(trueNow+gauss()*9+(['DT','OG','C','OT','EDGE','TE'].includes(pos)?6:['CB','WR'].includes(pos)?-8:0)),25,99),technique:clamp(Math.round(trueNow+gauss()*9),25,99),iq:clamp(Math.round(trueNow+gauss()*11),20,99),composure:clamp(Math.round(66+gauss()*15),15,99),durability:clamp(Math.round(72+gauss()*14),20,99),versatility:clamp(Math.round(64+gauss()*17),15,99)}}
// A generated roster looks like the steady state a program settles into: 35% freshmen (half of them redshirt
// freshmen), then 25/20/20. Seniors used to be half as common, and with no redshirt freshmen nearly the whole first
// freshman class redshirted at once, leaving about six sophomores a team the next season: an echo that thinned one
// class in four and swung departures between 6 and 26 a year.
const STARTING_CLASS_YEARS=['FR','FR','FR','FR','FR','FR','FR','SO','SO','SO','SO','SO','JR','JR','JR','JR','SR','SR','SR','SR'],STARTING_RS_FRESHMAN=.5;
function generatePlayer(school,pos,idx){
 const [hr,wr]=BODY[pos],h=gi(hr[0],hr[1]),w=gi(wr[0],wr[1]),classYr=pick(STARTING_CLASS_YEARS);
 const program=school.prestige*.48+school.resources*.16+school.development*.22+school.facilities*.14;
 const trueNow=clamp(Math.round(42+program*.38+gauss()*8+(classYr==='FR'?-5:classYr==='SO'?-2:classYr==='SR'?3:1)),38,97);
 const attrs=generatePositionAttributes(pos,trueNow),style=styleForTraits(pos,attrs);
 const dev=clamp(Math.round(61+school.development*.18+gauss()*16),20,99),work=clamp(Math.round(65+gauss()*18),15,99),coach=clamp(Math.round(68+gauss()*16),15,99),upside=clamp(Math.round(trueNow+(100-trueNow)*(dev/100)*rng(.34,.92)),trueNow,99);
 const scoutErr=gauss()*((100-school.development)/18+2.2),perceived=clamp(Math.round(trueNow+scoutErr),35,99),perceivedUpside=clamp(Math.round(upside+gauss()*6),perceived,99),morale=clamp(Math.round(72+gauss()*13),20,99);
 let role=idx<Math.ceil((POS_COUNTS[pos]||4)*.35)?'Starter mix':idx<Math.ceil((POS_COUNTS[pos]||4)*.7)?'Rotation':'Development';if(classYr==='FR'&&role==='Development')role='Redshirt candidate';let eligibilityUsed={FR:0,SO:1,JR:2,SR:3}[classYr],redshirtUsed=eligibilityUsed>0?gameplayRandom()<.28:gameplayRandom()<STARTING_RS_FRESHMAN;
 let growthProfile=pick(GROWTH_PROFILE_KEYS),growthVolatility=clamp(Math.round(45+gauss()*22),10,95),framePotential=clamp(Math.round(58+gauss()*20),10,98),speedRetention=clamp(Math.round(70+gauss()*16),20,99),scoutConfidence=clamp(Math.round(38+eligibilityUsed*13+school.development*.18+gauss()*5),28,94);return {id:uid(),name:personName(),pos,year:classYr,eligibilityUsed,redshirtUsed,redshirtActive:false,redshirtSeason:null,height:h,weight:w,style,trueNow,upside,perceived,perceivedUpside,dev,work,coach,morale,role,...attrs,health:100,wear:gi(0,8),injury:null,injuryWeeks:0,injuryHistory:[],seasonHistory:[],awards:[],draftResult:null,promise:null,promiseBaseline:perceived,growthProfile,growthVolatility,framePotential,speedRetention,heightGrowthRemaining:eligibilityUsed===0&&gameplayRandom()<.24?1:0,trainingFocus:'Balanced',positionFamiliarity:{[pos]:100},formerPositions:[],scoutConfidence,lastDevelopmentDelta:0,lastPhysicalChange:'',campGrade:null,campHistory:[],stats:newStats(),career:newStats(),origin:'Initial roster',portraitSeed:portraitSeedFor(),portraitVersion:PORTRAIT_VERSION};
}
function packStats(o){if(!o)return{};let out={};for(const k in o)if(o[k])out[k]=o[k];return out}
function newStats(){return {games:0,starts:0,snaps:0,passAtt:0,passComp:0,passYds:0,passTD:0,int:0,sacksTaken:0,rushAtt:0,rushYds:0,rushTD:0,fumbles:0,targets:0,receptions:0,recYds:0,recTD:0,drops:0,yac:0,tackles:0,tfl:0,sacks:0,pressures:0,intDef:0,passBreakups:0,forcedFumbles:0,sacksAllowed:0,pressuresAllowed:0,penalties:0,fgMade:0,fgAtt:0,punts:0,puntYds:0,returns:0,returnYds:0,returnTD:0}}
function generateRoster(s){let r=[];Object.entries(POS_COUNTS).forEach(([p,n])=>{for(let i=0;i<n;i++)r.push(generatePlayer(s,p,i))});while(r.length<93)r.push(generatePlayer(s,pick(POS),99));return uniquePeopleNames(r)}
function generateFreshman(s,pos,origin='Walk-on / late addition'){let p=generatePlayer(s,pos,99);const onRoster=new Set((s?.roster||[]).map(x=>x.name));if(onRoster.has(p.name))p.name=personName(onRoster);p.year='FR';p.eligibilityUsed=0;p.redshirtUsed=false;p.redshirtActive=false;p.redshirtSeason=null;p.origin=origin;return p}
// v0.12.29: specialists are recruited too. Before this the pool held no K or P at all, so
// every kicker and punter on a roster came from the anonymous walk-on top-up.
// One K and one P in every 31 prospects, interleaved so order never favours them.
const SPECIALIST_EVERY=31;
// Three stars at most: a kicker ranked #2 nationally (and counted as a blue chip) reads wrong,
// and elite placement should be about skill-position talent.
const SPECIALIST_MAX_RAW=71;
function generateRecruitPool(n,hsPool=universe?.highSchools||generateHighSchools()){let out=[];for(let i=0;i<n;i++){let pos=i%SPECIALIST_EVERY===7?'K':i%SPECIALIST_EVERY===22?'P':pick(POS.filter(x=>!['K','P'].includes(x))),raw=clamp(Math.round(58+gauss()*12),38,['K','P'].includes(pos)?SPECIALIST_MAX_RAW:97),st=recruitStars(raw),up=clamp(Math.round(raw+rng(4,22)+gauss()*5),raw,99),h=weightedHighSchool(hsPool),traits=generatePositionAttributes(pos,raw),style=styleForTraits(pos,traits);out.push({id:uid(),name:personName(),pos,stars:st,style,trueNow:raw,upside:up,...traits,scout:clamp(Math.round(raw+gauss()*6),35,99),scoutUp:clamp(Math.round(up+gauss()*8),40,99),highSchoolId:h.id,highSchool:h.name,homeCity:h.city,homeState:h.state,lat:h.lat,lon:h.lon,homeRegion:h.region,distanceImportance:gi(5,100),distanceTolerance:pick([100,150,250,400,600,900,1500,2500]),priority:pick(PRIORITIES),portraitSeed:portraitSeedFor(),portraitVersion:PORTRAIT_VERSION,targeted:false,interest:gi(5,45),prevInterest:0,trend:0,relationship:gi(0,20),leader:null,committed:null,commitWeek:null,visit:false,visitWeek:null,promise:'None',work:clamp(Math.round(65+gauss()*18),15,99),dev:clamp(Math.round(68+gauss()*18),15,99)});out.at(-1).prevInterest=out.at(-1).interest}uniquePeopleNames(out,new Set((universe?.teams||[]).flatMap(t=>(t.roster||[]).map(p=>p.name))));return assignRecruitRanks(out)}
// --- v0.13.0: multi-year recruiting --------------------------------------------
// Next year's best prospects exist now. The rising class is the top RISING_CLASS_SIZE of a
// full class, generated at the start of every season. You can watch up to WATCHLIST_LIMIT of
// them; when the class rolls over they join the board already targeted, with a relationship
// and interest head start, so a recruiting pitch can span two seasons. The rest of the new
// class is the bottom of a fresh sample, which keeps the star distribution of a normal class.
const RECRUIT_POOL_SIZE=2800,RISING_CLASS_SIZE=600,WATCHLIST_LIMIT=15,WATCH_RELATIONSHIP=12,WATCH_INTEREST=8;
function generateRisingClass(hsPool=universe?.highSchools){return generateRecruitPool(RECRUIT_POOL_SIZE,hsPool).slice(0,RISING_CLASS_SIZE).map(r=>({...r,rising:true,watch:false}))}
function toggleRisingWatch(id){
 const r=(universe.risingClass||[]).find(x=>x.id===id);if(!r)return{ok:false,reason:'not-found'};
 if(r.watch){r.watch=false;return{ok:true,watching:false}}
 if(universe.risingClass.filter(x=>x.watch).length>=WATCHLIST_LIMIT)return{ok:false,reason:'limit'};
 r.watch=true;return{ok:true,watching:true};
}
function rollRecruitClass(){
 const rising=(universe.risingClass||[]).map(r=>{const c={...r};delete c.rising;c.fromRisingClass=true;return c});
 const fresh=generateRecruitPool(RECRUIT_POOL_SIZE,universe.highSchools);
 universe.recruits=rising.length?assignRecruitRanks(uniquePeopleNames([...rising,...fresh.slice(rising.length)],new Set(universe.teams.flatMap(t=>t.roster.map(p=>p.name))))):fresh;
 let carried=0;const user=selected();
 if(user)for(const r of universe.recruits){
  if(!r.watch)continue;
  r.watch=false;r.watchedHeadStart=true;r.targeted=true;
  // "Film reviewed" / "Full evaluation" are season-scoped; the intel itself carries, so carry the flags too.
  const scouted=r.manualScouting?.[String(user.id)];if(scouted)scouted.season=universe.year;
  r.relationship=clamp((r.relationship||0)+WATCH_RELATIONSHIP,0,100);
  r.interest=clamp((r.interest||0)+WATCH_INTEREST,0,100);r.prevInterest=r.interest;
  firstRecruitEvaluation(r,user);carried++;
 }
 for(const r of universe.recruits)delete r.watch;
 universe.risingClass=generateRisingClass(universe.highSchools);
 universe.lastRisingCarry={year:universe.year,carried};
}
// Scouting actions and the rising card address a prospect in either class.
function findRecruitAnyClass(id){const key=String(id);return(universe.recruits||[]).find(x=>String(x.id)===key)||(universe.risingClass||[]).find(x=>String(x.id)===key)||null}
// The rivals do not wait for the season. Before it starts, a few of the best rising prospects can
// commit to their best rival: 5-stars most often. A prospect you watched is mostly protected, but
// only while your projected pitch (a target's +10 and the relationship head start included) is
// within 4 of the leading rival; a watched prospect you are trailing is as exposed as any other.
const EARLY_COMMIT_POOL=150,EARLY_COMMIT_CHANCE={5:.35,4:.22,3:.08},EARLY_COMMIT_PROTECTED=.25,EARLY_COMMIT_MARGIN=4;
function applyEarlyCommitments(){
 const user=selected(),log={year:universe.year,total:0,watched:0,kept:0,lost:[]};
 clearUnitCache();
 const candidates=universe.recruits.filter(r=>r.fromRisingClass&&!r.committed).sort((a,b)=>(a.nationalRank||1e9)-(b.nationalRank||1e9)).slice(0,EARLY_COMMIT_POOL);
 for(const r of candidates){
  const chance=EARLY_COMMIT_CHANCE[r.stars];if(!chance)continue;
  const rivals=recruitConsideration(r).filter(t=>t.name!==user?.name).map(t=>({t,pitch:recruitPitch(t,r)})).sort((a,b)=>b.pitch-a.pitch);
  const dest=rivals.find(x=>canTakeCommit(x.t.name)&&aiWantsRecruit(x.t,r));
  const watched=!!r.watchedHeadStart;if(watched)log.watched++;
  if(!dest)continue;
  let p=chance;
  if(watched&&user&&recruitPitch(user,r)+10+r.relationship*.12>=dest.pitch-EARLY_COMMIT_MARGIN)p*=EARLY_COMMIT_PROTECTED;
  if(gameplayRandom()<p&&commitRecruit(r,dest.t.name)){
   r.earlyCommit=true;log.total++;
   if(watched)log.lost.push({id:r.id,name:r.name,pos:r.pos,stars:r.stars,to:dest.t.name});
  }
 }
 log.kept=log.watched-log.lost.length;
 universe.earlyCommitLog=log;
 return log;
}
function initUniverse(mode='dynasty',{startingPhase='regular',seed=null}={}){const phase=startingPhase==='preseason'?'preseason':'regular';IDX.teams=null;IDX.players=null;activateGameplayRng(seed??undefined);const os=Object.keys(OFF_SCHEMES),ds=Object.keys(DEF_SCHEMES),highSchools=generateHighSchools();const teams=schools.map(s=>({...s,nickname:'',staff:generateStaff(s),offScheme:pick(os),defScheme:pick(ds),roster:generateRoster(s),...schoolColors(s),w:0,l:0,cw:0,cl:0,pf:0,pa:0,sos:0,rank:null,champ:false,schedule:[],history:[],commits:[],records:{}}));for(const t of teams){t.schemeTransition={off:null,def:null};t.staff.OC.preferredScheme=t.offScheme;t.staff.DC.preferredScheme=t.defScheme;t.pipelines=makePipelines(t);autoRedshirts(t);autoDepthTeam(t,false);autoRoleDepth(t,false)}universe={version:APP_VERSION,mode:mode==='commissioner'?'commissioner':'dynasty',year:2027,week:0,recoveredWeek:-1,phase,teams,highSchools,recruits:generateRecruitPool(RECRUIT_POOL_SIZE,highSchools),risingClass:generateRisingClass(highSchools),history:[],playerArchive:[],awards:{},records:{nationalSeason:{},nationalCareer:{}},draftHistory:{},latest:[],weeklyHub:[],weeklyDecisions:[],bowls:[],confChamps:[],playoffFieldIds:[],playoffFieldUnavailable:false,academicProgression:{season:2027,week:0,teamIds:[]},champion:null,lastDetailedGame:null,movementLog:[],recruitClassCounts:{},campHistory:{},developmentState:{year:2027,springRun:false,fallRun:false,springReport:[],fallReport:[],battles:[]},offseasonDone:false,openings:[],candidateMarket:{},guidanceState:{version:1,teams:{}}};{const rosterNames=new Set(teams.flatMap(t=>t.roster.map(p=>p.name)));uniquePeopleNames([...universe.recruits,...universe.risingClass],rosterNames)}guidanceReturnState=null;normalizeGuidanceState();gameplayRngUniverse=universe;for(const t of teams){ensureTeamDevelopment(t);for(const p of t.roster){ensurePlayerDevelopment(p,t);ensureAcademics(p,t)}}normalizePromiseState();buildSchedule();deriveRivalries();universe.teams.forEach(t=>{ensureAdminState(t);ensureNilState(t)});ranked();buildPreseasonHub();syncGameplayRng()}
function createNewDynasty(mode='dynasty',options={}){return initUniverse(mode,{startingPhase:'preseason',seed:options.seed??null})}
const IDX={teams:null,players:null,archive:null,archived:0,pop:-1,miss:null};
function rosterPopulation(){let n=0;for(const t of universe.teams)n+=t.roster.length;return n}
function rebuildIndexes(){IDX.teams=new Map();IDX.players=new Map();universe.teams.forEach((t,i)=>{IDX.teams.set(t.name,{t,i});for(const p of t.roster)IDX.players.set(p.id,{p,t,i})});IDX.pop=rosterPopulation();IDX.archive=new Map();IDX.archived=0;IDX.miss=null;indexArchive()}
function indexArchive(){const a=universe.playerArchive||[];for(;IDX.archived<a.length;IDX.archived++)IDX.archive.set(a[IDX.archived].id,a[IDX.archived])}
function T(name){if(!IDX.teams)rebuildIndexes();let h=IDX.teams.get(name);if(h&&universe.teams[h.i]===h.t)return h.t;let t=universe.teams.find(t=>t.name===name);if(t)rebuildIndexes();return t}
function teamById(id,u=universe){return (u?.teams||[]).find(t=>String(t.id)===String(id))}
function conferenceChampionIdsFor(u=universe){
 const ids=[],teams=u?.teams||[];
 for(const ref of u?.confChamps||[]){
  const id=typeof ref==='object'?ref?.id:ref;
  const name=typeof ref==='object'?ref?.name:ref;
  const t=teams.find(t=>String(t.id)===String(id))||teams.find(t=>t.name===name);
  if(t&&!ids.includes(t.id))ids.push(t.id);
 }
 return ids;
}
function normalizeConferenceChampions(){universe.confChamps=conferenceChampionIdsFor(universe);return universe.confChamps}
function conferenceChampionTeams(){return conferenceChampionIdsFor(universe).map(id=>teamById(id)).filter(Boolean)}
function playoffFieldIdsFor(u=universe){
 const ids=[],teams=u?.teams||[];
 for(const id of u?.playoffFieldIds||[]){const t=teams.find(t=>String(t.id)===String(id));if(t&&!ids.includes(t.id))ids.push(t.id)}
 return ids;
}
function playoffFieldFromIds(){return playoffFieldIdsFor(universe).map(id=>teamById(id)).filter(Boolean)}
function selectPlayoffField(){let r=ranked(),champs=conferenceChampionTeams(),set=new Set(champs.map(t=>t.id)),ats=r.filter(t=>!set.has(t.id)).slice(0,6);return [...champs,...ats].map(t=>({t,s:rankingScore(t)})).sort((a,b)=>b.s-a.s).map(x=>x.t).slice(0,16)}
function freezePlayoffField(){const frozen=playoffFieldFromIds();if(frozen.length===16)return frozen;const field=selectPlayoffField();universe.playoffFieldIds=field.map(t=>t.id);universe.playoffFieldUnavailable=false;return field}
function normalizePlayoffField(){
 const ids=playoffFieldIdsFor(universe);
 if(ids.length===16){universe.playoffFieldIds=ids;universe.playoffFieldUnavailable=false;return}
 universe.playoffFieldIds=[];
 // Old saves that already played bowls never recorded the pre-bowl field. Re-selecting now
 // would turn bowl winners into playoff qualifiers, so leave that field explicitly unavailable.
 universe.playoffFieldUnavailable=universe.phase==='playoffReady'&&(universe.bowls||[]).length>0;
}
function rebuildRecruitClassCounts(){
 const counts={};
 for(const r of universe.recruits||[])if(r.committed)counts[r.committed]=(counts[r.committed]||0)+1;
 universe.recruitClassCounts=counts;
 for(const t of universe.teams||[])t.commits=(universe.recruits||[]).filter(r=>r.committed===t.name);
 return counts;
}
function selected(){return T($('#userTeam').value)}
function allConfs(){return [...new Set(universe.teams.map(t=>t.conference))]}
function starter(team,pos){let rid=POS_ROLE[pos],rp=rid?roleStarter(team,rid):null;if(rp&&gameAvailable(rp))return rp;const healthy=orderedAt(team,pos).filter(gameAvailable);return healthy[0]||orderedAt(team,pos)[0]||team.roster[0]}
let unitCache=null;
function clearUnitCache(){unitCache=null}
function unitCached(team,pos){unitCache??=new Map();let k=team.name+'|'+pos,v=unitCache.get(k);if(v===undefined){v=unit(team,[pos]);unitCache.set(k,v)}return v}
function unit(team,positions){let ids=[];let key=positions.slice().sort().join(',');if(key==='QB')ids=['QB1'];else if(key==='RB,TE,WR')ids=['RB1','X','Z','SLOT','TE1'];else if(key==='C,OG,OT')ids=['LT','LG','C1','RG','RT'];else if(key==='DT,EDGE,LB')ids=['RUSH','SETEDGE','NT','3TECH','MIKE','WILL'];else if(key==='CB,S')ids=['BCB','FCB','NICKEL','FS','BOXS'];if(ids.length){let v=ids.map(id=>roleStarter(team,id)).filter(gameAvailable).map(conditionRating);return avg(v)}let v=[];positions.forEach(pos=>{const a=orderedAt(team,pos).filter(gameAvailable);const n=(pos==='WR'||pos==='CB')?3:['OT','OG','EDGE','DT','LB','S'].includes(pos)?2:1;v.push(...a.slice(0,n).map(conditionRating))});return avg(v)}
function modeledUnit(team,positions,roles,weights){const base=unit(team,positions),players=[...new Map(roles.map(id=>roleStarter(team,id)).filter(gameAvailable).map(p=>[p.id,p])).values()];if(!players.length)return base;const traits=avg(players.map(p=>Object.entries(weights).reduce((n,[key,w])=>n+(p[key]??p.trueNow)*w,0)));return clamp(base*.62+traits*.38,35,99)}
// --- v0.9.10: scheme transitions -------------------------------------------
// A coordinator brings a system with him. Installing it costs a season or two
// of fit rather than a blunt rating penalty: while familiarity is low the
// roster still plays partly like the old scheme, plus a small install friction.
const SCHEME_SIDE={OC:'off',DC:'def'};
function schemeListFor(side){return Object.keys(side==='off'?OFF_SCHEMES:DEF_SCHEMES)}
function schemeDefFor(side,name){return (side==='off'?OFF_SCHEMES:DEF_SCHEMES)[name]}
function coachPreferredScheme(c,slot,t){
 const side=SCHEME_SIDE[slot];if(!side)return null;
 if(c.preferredScheme&&schemeDefFor(side,c.preferredScheme))return c.preferredScheme;
 return side==='off'?t?.offScheme||schemeListFor('off')[0]:t?.defScheme||schemeListFor('def')[0];
}
function ensureCoachScheme(c,slot,t){
 const side=SCHEME_SIDE[slot];if(!side||!c)return c;
 // Old saves get the scheme they are already running, so loading a v0.9.9
 // dynasty never starts a transition nobody asked for.
 c.preferredScheme??=(side==='off'?t?.offScheme:t?.defScheme)||schemeListFor(side)[0];
 return c;
}
function schemeTransition(t,side){const tr=t?.schemeTransition?.[side];return tr&&tr.familiarity<100?tr:null}
function schemeFamiliarity(t,side){return schemeTransition(t,side)?.familiarity??100}
function setTeamScheme(t,side,to,reason='Staff change'){
 if(!t||!schemeDefFor(side,to))return null;
 const from=side==='off'?t.offScheme:t.defScheme;
 if(from===to){if(t.schemeTransition)t.schemeTransition[side]=null;return null}
 const coach=side==='off'?t.staff?.OC:t.staff?.DC;
 // A veteran roster and an adaptable coordinator start further along.
 const returning=(t.roster||[]).filter(p=>p.year!=='FR').length,depth=clamp(Math.round(returning/Math.max(1,(t.roster||[]).length)*100),0,100);
 const start=clamp(Math.round(18+(coach?.adaptability||60)*.18+depth*.10),20,55);
 if(side==='off')t.offScheme=to;else t.defScheme=to;
 t.schemeTransition??={off:null,def:null};
 t.schemeTransition[side]={from,to,side,startSeason:universe.year,familiarity:start,reason};
 return t.schemeTransition[side];
}
function advanceSchemeInstall(t,phase){
 t.schemeTransition??={off:null,def:null};
 for(const side of ['off','def']){
  const tr=schemeTransition(t,side);if(!tr)continue;
  const coach=side==='off'?t.staff?.OC:t.staff?.DC;
  const teach=((coach?.playCall||60)+(coach?.adaptability||60))/2;
  const gain=(phase==='spring'?20:phase==='fall'?14:7)+Math.round((teach-60)*.22)+Math.round(((t.development||60)-60)*.10);
  tr.familiarity=clamp(tr.familiarity+Math.max(3,gain),0,100);
  if(tr.familiarity>=100)t.schemeTransition[side]=null;
 }
}
function schemeFitFor(p,def){if(!def)return null;const vals=def.traits.map(k=>p[k]||p.trueNow);let fit=avg(vals);if(p.pos==='QB'&&def.qb&&def.qb.includes(p.style))fit+=8;return fit}
function schemeInstallNote(t,side){
 const tr=schemeTransition(t,side);if(!tr)return '';
 const yr=universe.year-tr.startSeason;
 return `Installing ${tr.to} (from ${tr.from}) · ${tr.familiarity}% installed · ${yr<=0?'first offseason':`year ${yr+1}`}`;
}
function playerSchemeFit(p,t){
 const off=OFF_POS.has(p.pos),side=off?'off':'def';
 let fit=schemeFitFor(p,off?OFF_SCHEMES[t.offScheme]:DEF_SCHEMES[t.defScheme]);
 const tr=schemeTransition(t,side);
 if(tr){
  // Installing costs most in year one and eases as the system goes in. A player
  // who was well suited to the old scheme has the most to unlearn, so he pays
  // the steepest transitional price on top of already fitting the new one less.
  const prev=schemeFitFor(p,schemeDefFor(side,tr.from));
  const drag=(100-clamp(tr.familiarity,0,100))/100;
  const relearn=prev==null?1:clamp(1+Math.max(0,prev-fit)/50,1,1.8);
  fit-=drag*7*relearn;
 }
 return clamp(Math.round(fit),35,99);
}
function profiles(t){
 const qb=modeledUnit(t,['QB'],['QB1'],{technique:.40,iq:.35,composure:.15,power:.10}),skill=modeledUnit(t,['RB','WR','TE'],['RB1','X','Z','SLOT','TE1','3DRB','PWRB','MOVETE'],{speed:.30,technique:.30,power:.15,iq:.15,versatility:.10}),ol=modeledUnit(t,['OT','OG','C'],['LT','LG','C1','RG','RT'],{power:.35,technique:.35,iq:.20,durability:.10}),front=modeledUnit(t,['EDGE','DT','LB'],['RUSH','SETEDGE','NT','3TECH','MIKE','WILL'],{power:.30,technique:.30,speed:.20,iq:.10,durability:.10}),coverage=modeledUnit(t,['CB','S'],['BCB','FCB','NICKEL','FS','BOXS'],{speed:.30,technique:.35,iq:.25,composure:.10});
 const offPlayers=t.roster.filter(p=>OFF_POS.has(p.pos)&&(p.injuryWeeks||0)===0).sort((a,b)=>conditionRating(b)-conditionRating(a)).slice(0,22),defPlayers=t.roster.filter(p=>!OFF_POS.has(p.pos)&&(p.injuryWeeks||0)===0).sort((a,b)=>conditionRating(b)-conditionRating(a)).slice(0,22);
 const offFit=avg(offPlayers.map(p=>playerSchemeFit(p,t))),defFit=avg(defPlayers.map(p=>playerSchemeFit(p,t))),oc=t.staff.OC,dc=t.staff.DC;
 const offense=clamp(qb*.29+skill*.27+ol*.22+offFit*.08+oc.playCall*.07+oc.development*.03+t.facilities*.04,35,99),defense=clamp(front*.39+coverage*.32+defFit*.09+dc.playCall*.08+dc.development*.04+t.facilities*.04+DEF_SCHEMES[t.defScheme].run*.02+DEF_SCHEMES[t.defScheme].coverage*.02,35,99);
 return {qb,skill,ol,front,coverage,offFit,defFit,offense,defense,overall:(offense+defense)/2};
}
function circlePair(arr,round){let a=[...arr],fixed=a[0],rest=a.slice(1);for(let r=0;r<round;r++)rest=[rest.at(-1),...rest.slice(0,-1)];a=[fixed,...rest];let o=[];for(let i=0;i<a.length/2;i++)o.push([a[i],a[a.length-1-i]]);return o}
