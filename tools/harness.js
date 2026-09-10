// Headless harness: loads app.js in Node with a minimal DOM shim so the
// simulation engine can be exercised and measured outside a browser.
const fs = require('fs');
const path = require('path');

function makeEl(id) {
  const el = {
    id, value: '', textContent: '', innerHTML: '', dataset: {}, disabled: false,
    children: [], options: [], classList: { add(){}, remove(){}, contains(){return false} },
    appendChild(c){ this.children.push(c);this.options.push(c); }, click(){},
    querySelector(){ return makeEl('x'); }, querySelectorAll(){ return []; },
    addEventListener(){}, removeAttribute(){}, setAttribute(){}, showModal(){}, close(){}, remove(){}, insertAdjacentHTML(){},
  };
  return el;
}

function installDom() {
  const els = new Map();
  const get = sel => {
    if (!els.has(sel)) els.set(sel, makeEl(sel.replace('#','')));
    return els.get(sel);
  };
  global.document = {
    querySelector: get,
    querySelectorAll: () => [],
    createElement: tag => makeEl(tag),
    body: makeEl('body'),
    addEventListener(){},
  };
  global.window = global;
  global.crypto = global.crypto || {};
  let ctr = 0;
  global.crypto.randomUUID = () => `p${(++ctr).toString(36)}`;
  global.indexedDB = { open(){ return { onupgradeneeded:null, onsuccess:null, onerror:null }; } };
  global.Blob = class Blob { constructor(p){ this.parts = p; } };
  global.URL = global.URL || {};
  global.URL.createObjectURL = () => 'blob:x';
  global.URL.revokeObjectURL = () => {};
  global.FileReader = class FileReader { readAsText(){} };
  global.confirm = () => true;
  global.alert = () => {};
  return els;
}

/**
 * Loads app.js with its bootstrap replaced by an export hook, so tests can
 * reach the engine internals (initUniverse, simWeek, universe, ...).
 */
const runtimeDependencies=['game-engine-v2.js','game-engine-v2-decisions.js','game-engine-v2-adapter.js','game-engine-v2-gameday.js','game-engine-v2-attribution.js','game-engine-v2-transaction.js','game-engine-v2-lab.js','game-engine-v2-gameplan-feedback.js','weekly-coaching-engine.js','weekly-player-stories-engine.js'];
const runtimeExtensions=['staff-scouting-core.js','scouting-actions.js','scouting-trail.js','recruiting-filters.js','recruit-compare.js','recruiting-shortlist.js','scouting-receipts.js','staff-scouting-ui.js','recruiting-history.js','development-tendencies.js','recruiting-battles.js','recruiting-workspace-adapter.js','development-plans.js','development-visualization-adapter.js','roster-depth-presentation-adapter.js','staff-organization-adapter.js','player-identity-adapter.js','season-presentation-adapter.js','world-history-presentation-adapter.js','game-engine-v2-lab-integration.js','game-engine-v2-record-state.js','game-engine-v2-record-run.js','game-engine-v2-record-ui.js','game-engine-v2-cutover.js','game-engine-v2-postseason.js','career-history-fix.js','game-engine-v2-presentation.js','game-engine-v2-gameday-prep.js','game-engine-v2-gameday-record.js','game-engine-v2-gameday-ui.js','game-engine-v2-gameday-prep-bridge.js','game-engine-v2-matchup-ui.js','game-engine-v2-gameday-soak.js','weekly-coaching-loop.js','weekly-personnel-decisions.js','weekly-player-stories.js','guidance-system-ui.js','new-dynasty-setup.js'];
let fullRuntimeDependenciesLoaded=false;
function loadEngine({ seed, stubRender = true, indexedDB, fullRuntime = false } = {}) {
  const els = installDom();
  if (indexedDB) global.indexedDB = indexedDB;
  global.DynastyStorage = require('../storage.js');
  global.DynastyRng = require('../rng.js');
  global.esc = require('../escape.js');
  if (seed !== undefined) {
    // Deterministic xorshift so runs are reproducible across measurements.
    let s = seed >>> 0 || 1;
    Math.random = () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
    let cryptoState = (seed ^ 0x9e3779b9) >>> 0 || 1;
    global.crypto.getRandomValues = values => {
      for (let i = 0; i < values.length; i++) {
        cryptoState ^= cryptoState << 13; cryptoState >>>= 0;
        cryptoState ^= cryptoState >> 17;
        cryptoState ^= cryptoState << 5; cryptoState >>>= 0;
        values[i] = cryptoState;
      }
      return values;
    };
  }
  if(fullRuntime&&!fullRuntimeDependenciesLoaded){
    global.DynastyEscape=global.esc;
    const nodeModule=global.module;global.module=undefined;
    try{for(const file of runtimeDependencies)(0,eval)(fs.readFileSync(path.join(__dirname,'..',file),'utf8'))}finally{global.module=nodeModule}
    fullRuntimeDependenciesLoaded=true;
  }
  let src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  if(fullRuntime){
    const anchor='loadSchools().then(',at=src.lastIndexOf(anchor);
    if(at<0)throw new Error('runtime extension anchor not found');
    src=src.slice(0,at)+runtimeExtensions.map(file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8')).join('\n')+'\n'+src.slice(at);
  }
  const bootstrap = src.lastIndexOf('loadSchools().then(');
  if (bootstrap < 0) throw new Error('bootstrap not found in app.js');
  let head = src.slice(0, bootstrap);
  if (stubRender) {
    // The UI layer is not under test; short-circuit it so engine timings and
    // distributions are not polluted by innerHTML construction.
    head = head.replace("function render(){\n const order=ranked(),u=selected();", "function render(){\n if(globalThis.__RENDER_OFF)return;\n const order=ranked(),u=selected();");
    if (!head.includes('__RENDER_OFF')) throw new Error('render stub anchor not found');
    globalThis.__RENDER_OFF = true;
  }
  const hook = `
globalThis.__ENGINE__ = {
  get universe(){ return universe }, set universe(v){ universe = v },
  get jobOffers(){ return universe.jobOffers },
  get schools(){ return schools },
  loadSchools, initUniverse, createNewDynasty, openingPreseason, beginSeason, buildSchedule, ranked, rankingScore, profiles, gameProfiles,
  migrateNewDynastySetupState: typeof migrateNewDynastySetupState === 'function' ? migrateNewDynastySetupState : undefined,
  gameplayRandom, syncGameplayRng,
  weeklyPlan, ensureWeeklyDecisions, currentWeeklyDecisions, hasPendingWeeklyDecisions, hasPendingCareerChoice, resolveWeeklyDecision, delegateWeeklyDecisions, playerAgencyDecision, playerInteractionWindow, promisePlayerOpportunity, applyRequestedPositionChange, importantStarters, weeklyPlayerPlan, pipelineStrength, oversignAppetite, scholarshipRoom, scholarshipCapacity, scholarshipSummary, projectedReturning, projectedDepartures, pullOffer, recruitBlocked, enforceScholarshipLimits, canTakeCommit, classCommitCount, pulledOfferHubItems, SCHOLARSHIP_LIMIT,
  setTeamScheme, schemeTransition, schemeFamiliarity, advanceSchemeInstall, schemeFitFor, schemeDefFor, schemeFitPressure, applyCoachScheme, ensureCoachScheme, positionOptions, positionChangeWillingness, positionTransitionFit, applyPositionChangeCost, playerSchemeFit, SCHEME_SIDE,
  gameRecap, recapFacts, recapPicker, weeklyNewsletter, newsWeight, newsGames, newsWeeks,
  gameSim, detailedGame, findUserGame, simulateUserDetailed, watchUserDetailed, gameBoxHTML, gameSummaryHTML, renderGameArchive, showGameCenter, simWeek, simSeason, simConferenceChampionships, simPlayoff, runOffseason, advanceOffseasonPhase, advanceOffseasonTo, offseasonPhaseDone, finishOffseasonPhase, offseasonReview, offseasonDepartures, offseasonEnrollment, offseasonPortal, offseasonPreseason,
  guidanceActionBlockers, guidanceActionEligibility, guidanceNextBoundary, guidanceStoredDecisions, guidanceModel,
  runSpringCamp, runFallCamp, developmentSnapshot, developmentDelta, developmentResult, developmentTeamSummary, developmentGroupSummary, developmentFocusSummary, developmentMovementDistribution, developmentResultDetailHTML, developmentResultsHTML, makeOffseasonState, normalizeOffseasonState, OFFSEASON_PHASES, advanceRecruiting, finalizeRecruiting,
  generateRecruitPool, generatePlayer, generateRoster, conditionRating,
  roleFit, unit, starter, roleStarter, participants, eligibilityBase,
  transferRisk, transferPortalEntryReason, TRANSFER_MORALE_PIVOT, TRANSFER_ENTRY_DIVISOR, draftProjection, seasonScore, normalizeUniverse, recruitPitch, recruitCoachRelationshipBoost, ensureRecruitRelationships, assignPrimaryRecruiter, growRecruiterRelationship, coachTransferPressure,
  scoutingDefs, ensureScoutingIntel, scoutingDomainView, scoutingConfidenceLabel, refreshScoutingIntel, snapshotScouting, firstRecruitEvaluation, scoutingPanelHTML, scoutingHistoryHTML,
  STYLES, STYLE_TRAITS, STYLE_USAGE, ARCHETYPE_META, archetypeMeta, archetypeLabel, archetypeDescription, archetypeChipHTML, styleForTraits,
  ensurePortrait, portraitSeedFor, jerseyFor, schoolColors, ensureSchoolColors, commissionerMode, renderControlMode, PORTRAIT_VERSION,
  APP_VERSION,
  T, teamById, findPlayer, rebuildIndexes, packUniverse, packPlayer, conferenceChampionIdsFor, conferenceChampionTeams, freezePlayoffField, normalizePlayoffField, rebuildRecruitClassCounts,
  setRecruitPromise, commitRecruit, signPlayerPromise, auditPlayerPromises, auditPromises, normalizePromiseState,
  recordPromiseTraining, recordPromisePositionChange, promisePenalty, archiveRecord, rememberCoach, promiseHubItems, recordChaseHubItems, deriveRivalries, rivalOf, rivalryGameFor, isRivalryGame, rivalryHubItems, settleRivalryGame, rivalrySeriesText, seasonExpectation, ensureAdminState, ensureSeasonGoals, seasonGoalStatus, seasonGoalStatusLabel, evaluateSeasonGoals, seasonGoalsHTML, programOverviewHTML, adminSeasonReview, reviewControlledProgram, adminHubItems, adminConfidenceLabel, nilBudgetFor, nilRemaining, nilDealCost, nilDealActive, nilRetentionRelief, signNilDeal, applyGameplanWear, gameplanSnapshot, teamLogoHTML, careerTotals, careerWinPct, hiringCeiling, hiringMarket, closeTenure, acceptPost, careerSummaryText, tenureRecord, careerHubItems, simBowls, bowlField, seedField, buildSigningDay, signingDayOdds, ensureAcademics, academicTarget, allKnownCoaches, coachingTree, ensureAllTimeRecord, recordSeasonInHistory, programCoachingLineage, programHistoryHTML, weeklyGameplanDecision, applyGameplanDecision, teamGameplanFor, applyGameplanEdge, schemeTransition, treeHeadCoaches, creditCoachingTree, coachTreeHubItems, academicRisk, academicallyIneligible, academicStatusText, advanceAcademics, advanceAcademicsForWeek, academicDecision, applyAcademicDecision, academicHubItems, gameAvailable, signingDayPending, revealNextSigning, revealAllSigning, signingDayHubItems, decommitRecruit, bowlEligible, bowlHubItems, fanSupportTarget, updateFanSupport, homeFieldFor, cancelNilDeal, ensureNilState, resetNilSeason, careerChronologyHTML, RECORD_CATS, ensurePortalCycle, ensurePortalEntry, normalizePortalState, portalCandidates, portalCandidateId, portalLog, PORTAL_ROUNDS, PORTAL_LOG_CAP, PORTAL_TARGET_CAP, PORTAL_ATTENTION_POOL, PORTAL_ATTENTION_MAX, PORTAL_FINALISTS, openPortalCycle, advancePortalRound, targetPortalCandidate, untargetPortalCandidate, portalTargetFor, portalAttentionLeft, portalAttentionSpent, portalEntry, portalFit, portalResolveEntry, offerPortalNil, withdrawPortalNil, promisePortalCandidate, resolvePortalCommitments, portalRoomFor, attachPortalPromise, PORTAL_NIL_INTEREST, PORTAL_PROMISE_INTEREST, compactGameArchive, compactGame, gameIsProtected, keptStatLines, GAME_DETAIL_HORIZON, validateSchedule, conferenceOpponentsFor, nonConferenceOpponentsFor, buildSchedule, SCHEDULE_GAMES, SCHEDULE_CONF_GAMES, SCHEDULE_HOME_MIN, SCHEDULE_HOME_MAX, autosaveAfter, runAutosave, yieldToUserAction, autosaveBlocked, writeBrowserSave, AUTOSAVE_KINDS, ensureProtectedRivals, primaryRivalId, setPrimaryRival, recordRivalryResult, RIVALRY_POSTSEASON_CAP, migrateProtectedRivals, ensureScheduleRotation, conferenceRotationOrder, assignHomeAway,
  generateCoach, coachById, ensureCoachCareer, normalizeCoachState, recordCoachSeason, closeCoachStint, openCoachStint, archiveCoach, addCoachEvent, applyCoachRelationshipChange, coachFalloutHubItems, replaceStaffCoach, promoteCoachWithinTeam, moveCoach, retireCoach, coachCareerTotals, coachProfileHTML, chooseCoachMoveDestination, carousel, promiseHTML, applyDevelopmentPhase,
  teamStaffBudget, teamStaffSpend, candidateFitScore, generateCandidatePool, createOpening, interviewCandidate, candidateAcceptChance, extendOffer, hireCandidate, coachOpeningHubItems, COACH_SLOT_ROLES,
  captureRecruitment, transferFit, chooseTransferDestination, placeTransfer, familiarFaceItems, buildWeeklyHub, releasePlayerPromises, transferHistoryHTML, archivePlayerSeason,
  saveBrowser, loadBrowser, exportSave, importSave, installSave, validateSave, validateSaveText, validateImportedSaveText, ensureArchiveLoaded, archiveIsDeferred, ensureGamesLoaded, gamesAreDeferred, renderRecruiting, applyProgramEdit, inheritRecruitTraits,
  POS, POS_COUNTS, ROLE_DEFS, OFF_SCHEMES, DEF_SCHEMES, GROWTH_CURVES, OFF_POS,
  render: () => {},
};
})();`;
  const mod = head + hook;
  (0, eval)(mod);
  const engine = globalThis.__ENGINE__;
  engine.$el = sel => els.get(sel) || makeEl(sel);
  engine.setUserTeam = name => { els.set('#userTeam', Object.assign(makeEl('userTeam'), { value: name })); };
  return engine;
}

module.exports = { loadEngine, installDom };
