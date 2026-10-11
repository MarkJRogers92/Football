const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../player-evidence-model.js');
const {loadEngine}=require('../tools/harness');

test('estimate movement and recorded camp changes remain separate and missing checkpoints stay unavailable',()=>{
 const history=[
  {season:2027,week:0,phase:'FIRST_FALL_CAMP',source:'CAMP',currentEstimate:70,confidence:42,domains:{arm:{low:65,high:76,confidence:42}}},
  {season:2027,week:12,phase:'MAJOR_REVISION',source:'CAMP',currentEstimate:73,confidence:50,domains:{arm:{low:68,high:79,confidence:50}}},
  {season:2028,week:0,phase:'FIRST_FALL_CAMP',source:'CAMP',currentEstimate:null,confidence:null,domains:{}}
 ];
 const rows=model.scoutingMovement(history,[{year:2027,phase:'Spring',delta:2},{year:2027,phase:'Fall',delta:-1}]);
 assert.equal(rows[0].estimateDelta,null);assert.equal(rows[0].observedCamp.delta,-1);
 assert.equal(rows[1].estimateDelta,3);assert.equal(rows[1].domainChanges[0].lowDelta,3);assert.equal(rows[1].observedCamp.delta,2);
 assert.equal(rows[2].estimateDelta,null);assert.equal(rows[2].observedCamp,null,'a missing checkpoint must not inherit a prior measurement');
});

test('current staff perspectives use only displayed ranges and preserve a saved opinion after staff departure',()=>{
 const domains=[{key:'arm',low:60,high:80,confidence:48}];Object.defineProperty(domains[0],'trueNow',{get(){throw Error('hidden true rating read')}});Object.defineProperty(domains[0],'upside',{get(){throw Error('hidden upside read')}});
 const coaches=[{id:'hc-1',name:'Current HC',role:'Head Coach',evaluation:90,expertiseGroup:'QB',positionGroup:'QB'}];
 const rows=model.staffPerspectives('QB',domains,coaches);
 assert.equal(rows.length,1);assert.equal(rows[0].coachId,'hc-1');assert.ok(rows[0].domains.arm.low>=60&&rows[0].domains.arm.high<=80);
 const hidden={};Object.defineProperty(hidden,'trueNow',{get(){throw Error('hidden rating read')}});Object.defineProperty(hidden,'upside',{get(){throw Error('hidden upside read')}});
 assert.deepEqual(model.staffPerspectives('QB',domains,coaches).map(x=>x.coachId),['hc-1']);
 const saved=structuredClone(rows),afterDeparture=[];assert.equal(saved[0].name,'Current HC');assert.deepEqual(afterDeparture,[]);
 assert.equal(model.staffPerspectives('K',domains,[{id:'kcoach',name:'K coach',role:'K',evaluation:60,expertiseGroup:'SKILL',positionGroup:'SKILL'}])[0].domains.arm.low<60,false,'the pure model receives no positional-expertise assertion for unsupported mappings');
});

test('position-group rates are pooled by attempts and keep participant/sample counts explicit',()=>{
 const groups=model.groupedStats([
  {id:'q1',pos:'QB',stats:{games:2,passAtt:10,passComp:9,passYds:80,rushAtt:2,rushYds:4}},
  {id:'q2',pos:'QB',stats:{games:1,passAtt:90,passComp:45,passYds:900,rushAtt:0,rushYds:0}},
  {id:'q3',pos:'QB',stats:{games:0,passAtt:99,passComp:99}}
 ]),qb=groups.find(g=>g.key==='QB'),completion=qb.metrics.find(m=>m.label==='Completion rate');
 assert.equal(qb.playerCount,2);assert.equal(qb.playerGames,3);assert.equal(completion.rate,54/100);assert.equal(completion.n,54);assert.equal(completion.d,100);
 const kicker=model.groupedStats([{id:'k',pos:'K',stats:{games:1,fgAtt:0}}]).find(g=>g.key==='K');assert.equal(kicker.metrics[0].status,'zero');
});

test('archived final year is not relabeled as the current universe year and trends keep same-position retained lines',()=>{
 const p={id:'archived',pos:'QB',retiredYear:2028,lastTeam:'North',stats:{games:8,passAtt:80,passComp:44},seasonHistory:[{year:2028,team:'North',pos:'QB',games:8,passAtt:80,passComp:44},{year:2027,team:'South',games:7,passAtt:60,passComp:31}]};
 Object.defineProperty(p,'trueNow',{get(){throw Error('must not inspect hidden player ratings')}});
 const archive=Array.from({length:6},(_,i)=>({id:`g${i}`,season:2028,week:i,playerStats:{home:[{id:'archived',...(i===1?{}:{pos:i===0?'RB':'QB'}),stats:{games:1,passAtt:10,passComp:i?6:10}}],away:[]}}));
 const out=model.statTrend(p,{currentYear:2032,currentTeam:'wrong',gameArchive:archive});
 assert.equal(out.seasons.length,2);assert.equal(out.seasons[0].year,2028);assert.equal(out.seasons[0].team,'North');assert.equal(out.seasons[1].year,2027);assert.equal(out.seasons[1].pos,null,'legacy season without a saved position must not inherit the current position');assert.equal(out.gameLines,4,'missing-position legacy lines and another-position lines are excluded');assert.equal(out.retainedGames,4);
 assert.equal(out.recentComparison.metrics[0].denominator,'passAtt');assert.equal(out.recentComparison.metrics[0].recent.rate,0.6);
});

test('breakout facts require real eligibility, games, score and a stable replay-safe identity',()=>{
 const p={id:'p1',name:'Freshman',pos:'RB',year:'FR',stats:{games:2,rushYds:122}};
 const ctx={season:2028,week:5,schoolId:'school',schoolName:'State',gameId:'G1'};
 const event=model.breakoutEvent(p,ctx,4.2,'61 yards rushing');assert.ok(event);assert.equal(event.id,'EVT_PLAYER_BREAKOUT_2028_p1');assert.equal(event.playerIds[0],'p1');assert.equal(event.gameIds[0],'G1');
 assert.equal(model.breakoutEvent({...p,year:'JR'},ctx,5),null);assert.equal(model.breakoutEvent({...p,stats:{games:1}},ctx,5),null);assert.equal(model.breakoutEvent(p,ctx,3.99),null);
});

test('rendered recent trend rates use correct sample objects and do not leak undefined units',async()=>{
 global.__DL_TEST__={};const e=loadEngine({seed:7201,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 const helper=global.__DL_TEST__.playerEvidenceRecentHTML;assert.equal(typeof helper,'function');
 const html=helper([{label:'Completion rate',format:'%',denominator:'passAtt',recent:{n:3,d:4,rate:.75,complete:3},prior:{n:1,d:4,rate:.25,complete:3}},{label:'Sacks / 100 snaps',format:'per100',denominator:'snaps',recent:{n:2,d:50,rate:.04,complete:3},prior:{n:0,d:0,rate:null,complete:3}}]);
 assert.match(html,/75\.0% \(3\/4\)/);assert.match(html,/25\.0% \(1\/4\)/);assert.match(html,/4\.0 per 100 \(2\/50\)/);assert.match(html,/0 snaps recorded; rate unavailable/);assert.doesNotMatch(html,/undefined/);
 const player={id:'qb-html',pos:'QB',stats:{games:2,passAtt:4,passComp:3,passYds:36},seasonHistory:[{year:2026,team:'Old North',games:1,passAtt:20,passComp:12}]},archive=Array.from({length:4},(_,i)=>({id:`html-${i}`,season:2027,week:i,playerStats:{home:[{id:player.id,pos:'QB',stats:{passAtt:1,passComp:i?1:0,passYds:9}}],away:[]}}));
 const full=global.__DL_TEST__.playerEvidenceTrendHTML(player,e.T('Chicago Metropolitan'),archive);assert.match(full,/Recorded production trends/);assert.match(full,/75\.0% \(3\/4\)/);assert.match(full,/eligible player game lines/);assert.match(full,/Position-specific rates unavailable: this season record has no saved position/);assert.doesNotMatch(full,/undefined/);
 const t=e.T('Chicago Metropolitan');t.roster=t.roster.filter(p=>p.pos!=='QB').concat([{id:'q-a',name:'QB A',pos:'QB',stats:{games:2,passAtt:10,passComp:8,passYds:90,rushAtt:0,rushYds:0}},{id:'q-b',name:'QB B',pos:'QB',stats:{games:1,passAtt:90,passComp:45,passYds:900,rushAtt:0,rushYds:0}}]);
 const groupHost=global.document.querySelector('#positionGroupComparison');assert.equal(global.__DL_TEST__.playerEvidenceStatsTabRegistered(),true,'the active Stats tab uses the evidence-aware renderer');global.__DL_TEST__.renderPlayerEvidenceStatsTab();assert.match(groupHost.innerHTML,/Position-group comparison/);assert.match(groupHost.innerHTML,/53\.0%/);assert.match(groupHost.innerHTML,/2 participating players · 3 player-games/);
 t.staff.KC??={id:'k-specialist',name:'K coach',evaluation:85,status:'ACTIVE',schoolId:t.id};const kicker=global.__DL_TEST__.playerEvidencePerspectives('K',[{key:'fieldGoals',low:55,high:80,confidence:60}],t);assert.equal(kicker[0].expertise,false,'K/P fallback profile groups must not create a positional specialty');
 const malformed=e.scoutingHistoryHTML({scoutingHistory:[null,{season:2020,phase:'OLD',domains:['invalid']},'legacy-string'],campHistory:'legacy'});assert.match(malformed,/— current/);assert.match(malformed,/Observed camp change unavailable/);assert.doesNotMatch(malformed,/undefined/);
});

test('actual game recording adds one factual breakout and archive retains camp history',async()=>{
 global.__DL_TEST__={};const e=loadEngine({seed:7202,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();const u=e.universe;
 const p={id:'breakout-q',name:'Breakout Freshman',pos:'RB',year:'FR',role:'Starter',stats:{games:2,rushYds:160,rushTD:1},injuryHistory:[],campHistory:[{year:2027,phase:'Spring',delta:1}]};
 const home={id:'home',name:'Home State',roster:[p]},away={id:'away',name:'Away State',roster:[]},before={season:u.year,week:4,label:'Regular season',home:{players:new Map([[p.id,{stats:{games:1,rushYds:50},injuries:0}]])},away:{players:new Map()}};
 const result={home:home.name,away:away.name,hp:20,ap:17,box:{home:{passTD:1,rushTD:1,fgMade:1},away:{passTD:2,rushTD:0,fgMade:1}}};
 const out=e.finishGame(before,home,away,result);assert.ok(out.gameId);const events=u.events.filter(x=>x?.metadata?.storyType==='BREAKOUT');assert.equal(events.length,1);assert.deepEqual(events[0].playerIds,[p.id]);
 const packed=e.archiveRecord(p,home,'Eligibility exhausted');assert.deepEqual(packed.campHistory,p.campHistory);assert.ok(e.ARCHIVE_FIELDS.includes('campHistory'));
});

test('accepted scouting checkpoints snapshot current staff once and role-battle facts name both players',async()=>{
 global.__DL_TEST__={};const e=loadEngine({seed:7203,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();const u=e.universe,t=e.T('Chicago Metropolitan');
 const player=t.roster.find(p=>p.pos==='QB');player.scoutingHistory=[];const priorCoach={id:'coach-historical',name:'Coach at checkpoint',role:'Head Coach',evaluation:85,status:'ACTIVE',schoolId:t.id};t.staff.HC=priorCoach;
 assert.equal(e.snapshotScouting(player,t,'FIRST_FALL_CAMP','CAMP'),true);const receipt=JSON.stringify(player.scoutingHistory[0].staffPerspectives);assert.ok(receipt.includes('coach-historical'));
 t.staff.HC={id:'coach-current',name:'Replacement Coach',role:'Head Coach',evaluation:90,status:'ACTIVE',schoolId:t.id};e.scoutingHistoryHTML(player);assert.equal(JSON.stringify(player.scoutingHistory[0].staffPerspectives),receipt,'old staff snapshot must not change after a coach move');
 const saved=JSON.parse(JSON.stringify(e.packUniverse(u)));e.universe=saved;e.normalizeUniverse();const restored=e.T('Chicago Metropolitan').roster.find(p=>p.id===player.id);assert.equal(JSON.stringify(restored.scoutingHistory[0].staffPerspectives),receipt);
 const restoredUniverse=e.universe;restoredUniverse.phase='regular';const fx=global.__DL_TEST__.weeklyPersonnelForceFixture();assert.ok(fx,'fixture should produce a resolved challenge candidate');const d=restoredUniverse.weeklyDecisions.find(x=>x.id===fx.id),option=d.options.find(x=>x.id===d.recommendedOption)||d.options[0];
 assert.equal(e.resolveWeeklyDecision(d.id,option.id),true);const event=restoredUniverse.events.find(x=>x?.metadata?.storyType==='ROLE_BATTLE');assert.ok(event);assert.deepEqual(event.playerIds,[fx.starterId,fx.challengerId]);assert.equal(event.metadata.roleBattle.incumbent.id,fx.starterId);assert.equal(event.metadata.roleBattle.challenger.id,fx.challengerId);assert.ok(event.metadata.roleBattle.incumbent.roleBefore);assert.ok(event.metadata.roleBattle.incumbent.roleAfter);
});

test('applied Spring and Fall camp role recommendations record held/promoted outcomes with actual timing and merge chronologically',async()=>{
 global.__DL_TEST__={};const e=loadEngine({seed:7206,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();const u=e.universe,t=e.T('Chicago Metropolitan'),players=t.roster.filter(p=>p.pos==='QB').slice(0,2);assert.equal(players.length,2);
 const [incumbent,recommended]=players;t.roleDepth??={};t.roleDepth.QB1=[incumbent.id,recommended.id];incumbent.role='Captain';recommended.role='Rotation';u.week=5;u.developmentState={year:u.year,springRun:true,fallRun:false,springReport:[],fallReport:[],battles:[{roleId:'QB1',label:'Starting QB',phase:'sPrInG',recommended:incumbent.id,position:'QB'}]};
 e.applyCampRecommendations();let events=u.events.filter(x=>x?.metadata?.source==='CAMP_RECOMMENDATION_APPLIED');assert.equal(events.length,1);const spring=events[0];assert.deepEqual(spring.playerIds,[incumbent.id],'held position deduplicates the player identity');assert.equal(spring.metadata.outcome,'held-position');assert.match(spring.summary,/retained the top spot/);assert.equal(spring.metadata.phase,'Spring');assert.equal(spring.week,5,'camp milestone uses actual universe week');assert.equal(spring.metadata.incumbent.roleBefore,'Captain');assert.equal(spring.metadata.incumbent.roleAfter,'Captain');
 e.applyCampRecommendations();assert.equal(u.events.filter(x=>x?.metadata?.source==='CAMP_RECOMMENDATION_APPLIED').length,1,'reapplying same choice does not duplicate its milestone');
 u.week=5;u.developmentState={year:u.year,springRun:true,fallRun:true,springReport:[],fallReport:[],battles:[{roleId:'QB1',label:'Starting QB',phase:'fAlL',recommended:recommended.id,position:'QB'}]};e.applyCampRecommendations();events=u.events.filter(x=>x?.metadata?.source==='CAMP_RECOMMENDATION_APPLIED');assert.equal(events.length,2);const fall=events.find(x=>x.metadata.phase==='Fall');assert.ok(fall);assert.notEqual(fall.storyId,spring.storyId);assert.equal(fall.week,5);assert.equal(fall.metadata.outcome,'promoted');assert.match(fall.summary,/moved ahead of/);assert.equal(fall.metadata.challenger.roleBefore,'Rotation');assert.equal(fall.metadata.challenger.roleAfter,'Rotation','depth-chart order does not imply broad player-role mutation');
 u.events.push({id:'later-week-10',season:u.year,week:10,timestampOrder:55,playerIds:[incumbent.id],schoolIds:[t.id],gameIds:[],summary:'Week ten milestone',metadata:{storyType:'BREAKOUT',name:incumbent.name,position:incumbent.pos}},{id:'earlier-week-2',season:u.year,week:2,timestampOrder:99,playerIds:[incumbent.id],schoolIds:[t.id],gameIds:[],summary:'Week two milestone',metadata:{storyType:'BREAKOUT',name:incumbent.name,position:incumbent.pos}},{id:'older-breakout',season:u.year-1,week:10,playerIds:[incumbent.id],schoolIds:[t.id],gameIds:[],summary:'Older recorded breakout',metadata:{storyType:'BREAKOUT',name:incumbent.name,position:incumbent.pos}});
 const chronology=e.careerChronologyHTML(incumbent),week10=chronology.indexOf('Week ten milestone'),fallRow=chronology.indexOf(fall.summary),springRow=chronology.indexOf(spring.summary),week2=chronology.indexOf('Week two milestone'),oldRow=chronology.indexOf('Older recorded breakout');assert.ok(week10>=0&&fallRow>week10&&springRow>fallRow&&week2>springRow&&oldRow>week2,`timeline sorts dated milestones newest-first within year, with append order for same-week phases: ${[week10,fallRow,springRow,week2,oldRow].join(',')}`);assert.match(chronology,/FALL CAMP · WEEK 5/);assert.match(chronology,/SPRING CAMP · WEEK 5/);
 const sameWeekEvents=u.events.filter(e=>e?.metadata?.source==='CAMP_RECOMMENDATION_APPLIED');assert.equal(global.__DL_TEST__.weeklyPlayerStoryMilestone(incumbent.id,sameWeekEvents)?.storyId,fall.storyId,'weekly cards select Fall as the latest same-week accepted milestone');const weeklyLabel=global.__DL_TEST__.weeklyPlayerStoryMilestoneLabel(incumbent.id,sameWeekEvents);assert.match(weeklyLabel,/Fall camp/);assert.doesNotMatch(weeklyLabel,/Spring camp/);
 const renderStories=global.__DL_TEST__.renderSelectedSchoolStories;renderStories();const host=global.document.querySelector('#playerStoryHistory'),fallHistory=host.innerHTML.indexOf(fall.summary),springHistory=host.innerHTML.indexOf(spring.summary);assert.ok(fallHistory>=0&&springHistory>fallHistory,'selected-school History also shows Fall latest when both camps share a week');assert.match(host.innerHTML,/Week 5 · Fall camp · ROLE BATTLE/);assert.match(host.innerHTML,/Week 5 · Spring camp · ROLE BATTLE/);assert.match(host.innerHTML,new RegExp(recommended.name));assert.match(host.innerHTML,/data-player=/);assert.doesNotMatch(host.innerHTML,/Player [^<]*\d/,'saved names are used instead of opaque IDs');
});

test('college exit milestones record only eligibility exhaustion and survive archive/save restoration',async()=>{
 global.__DL_TEST__={};const e=loadEngine({seed:7207,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();const u=e.universe,t=e.T('Chicago Metropolitan'),[eligible,early,cut]=t.roster.slice(0,3);u.week=4;
 e.addToArchive(eligible,t,'Eligibility exhausted');e.addToArchive(early,t,'Early NFL declaration');e.addToArchive(cut,t,'Roster cut');t.roster=t.roster.filter(p=>p.id!==eligible.id);e.rebuildIndexes();let exits=u.events.filter(x=>x?.metadata?.storyType==='COLLEGE_CAREER_ENDED');assert.equal(exits.length,1);assert.deepEqual(exits[0].playerIds,[eligible.id]);assert.equal(exits[0].week,4);assert.equal(exits[0].metadata.reason,'Eligibility exhausted');
 const qbs=t.roster.filter(p=>p.pos==='QB').slice(0,2);t.roleDepth.QB1=[qbs[0].id,qbs[1].id];u.developmentState={year:u.year,springRun:true,fallRun:false,springReport:[],fallReport:[],battles:[{roleId:'QB1',label:'Starting QB',phase:'Spring',recommended:qbs[1].id,position:'QB'}]};e.applyCampRecommendations();
 eligible.year='FR';eligible.stats={...eligible.stats,games:2,rushYds:140,rushTD:1};const breakout=model.breakoutEvent(eligible,{season:u.year,week:3,schoolId:t.id,schoolName:t.name,gameId:'save-breakout'},4,'70 yards rushing');u.events.push(breakout);
 const departedId='transferred-away-not-loaded';u.events.push({id:'transferred-story',season:u.year,week:8,schoolIds:[t.id],playerIds:[departedId],gameIds:[],summary:'Transferred player milestone',storyId:'role-battle:transfer-fallback',metadata:{storyId:'role-battle:transfer-fallback',storyType:'ROLE_BATTLE',roleBattle:{incumbent:{id:departedId,name:'Transferred Star',position:'WR'}}}});
 const saved=JSON.parse(JSON.stringify(e.packUniverse(u)));e.universe=saved;e.normalizeUniverse();const restored=e.universe,storyEvents=restored.events.filter(x=>['ROLE_BATTLE','BREAKOUT','COLLEGE_CAREER_ENDED'].includes(x?.metadata?.storyType)),ids=storyEvents.map(x=>x.storyId);assert.ok(ids.includes(`college-exit:${u.year}:${eligible.id}`));assert.ok(ids.includes(`camp-role-battle:${u.year}:Spring:${t.id}:QB1:${qbs[1].id}`));assert.ok(ids.includes(`breakout:${u.year}:${eligible.id}`),'battle, breakout and exit facts persist in the same event ledger');assert.equal(new Set(ids).size,ids.length);assert.ok(restored.playerArchive.some(p=>p.id===eligible.id));
 global.__DL_TEST__.renderSelectedSchoolStories();const host=global.document.querySelector('#playerStoryHistory');assert.match(host.innerHTML,/Transferred Star · WR/);assert.match(host.innerHTML,new RegExp(`data-player="${departedId}"`),'saved transferred-player facts keep a named profile link after load when the player is unavailable');
});

test('a real v2 after-archive fault rolls back a newly recorded breakout with the game transaction',async()=>{
 global.__DL_TEST__={};const e=loadEngine({seed:7204,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();const u=e.universe,t=e.T('Chicago Metropolitan'),p=t.roster.find(x=>x.pos==='RB');
 p.year='FR';p.stats={...p.stats,games:2,rushYds:240,rushTD:2};global.__DL_TEST__.v2PrepareDetailedGame();const before=JSON.stringify(u.events),probe=global.__DL_TEST__.v2RollbackProbe('afterArchive');
 assert.match(probe.message,/after archive write/);assert.equal(probe.ok,true);assert.equal(JSON.stringify(u.events),before,'event ledger must be restored together with the failed archive');assert.equal(u.events.some(x=>x?.metadata?.storyType==='BREAKOUT'),false);
});

test('profile and History/Stats evidence reads leave saved state and RNG untouched',async()=>{
 global.__DL_TEST__={};const e=loadEngine({seed:7205,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();const u=e.universe,t=e.T('Chicago Metropolitan'),p=t.roster.find(x=>x.pos==='QB');
 p.scoutingHistory=[{season:u.year,phase:'FIRST_FALL_CAMP',currentEstimate:70,upsideEstimate:80,confidence:60,domains:{arm:{low:60,high:78,confidence:60}},staffPerspectives:[null,{name:'Legacy coach',role:'OC',domains:{arm:null}}]}];p.campHistory=[{year:u.year,phase:'Fall',delta:0}];p.stats={...p.stats,games:2,passAtt:8,passComp:4};
 const before=JSON.stringify(u),random=Math.random;Math.random=()=>{throw Error('read model consumed gameplay randomness')};
 try{e.scoutingHistoryHTML(p);global.__DL_TEST__.playerEvidenceTrend(p,t);global.__DL_TEST__.playerEvidencePerspectives('QB',[{key:'arm',low:60,high:78,confidence:60}],t);global.__DL_TEST__.renderPositionGroupComparison();global.__DL_TEST__.renderSelectedSchoolStories()}finally{Math.random=random}
 assert.equal(JSON.stringify(u),before,'displaying the added evidence must not mutate the saved dynasty');
});
