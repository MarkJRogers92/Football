// Headless harness: loads app.js in Node with a minimal DOM shim so the
// simulation engine can be exercised and measured outside a browser.
const fs = require('fs');
const path = require('path');

function makeEl(id) {
  const el = {
    id, value: '', textContent: '', innerHTML: '', dataset: {}, disabled: false,
    children: [], classList: { add(){}, remove(){}, contains(){return false} },
    appendChild(c){ this.children.push(c); }, click(){},
    querySelector(){ return makeEl('x'); }, querySelectorAll(){ return []; },
    addEventListener(){}, removeAttribute(){}, setAttribute(){}, showModal(){}, close(){},
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
  return els;
}

/**
 * Loads app.js with its bootstrap replaced by an export hook, so tests can
 * reach the engine internals (initUniverse, simWeek, universe, ...).
 */
function loadEngine({ seed, stubRender = true, indexedDB } = {}) {
  const els = installDom();
  if (indexedDB) global.indexedDB = indexedDB;
  global.DynastyStorage = require('../storage.js');
  if (seed !== undefined) {
    // Deterministic xorshift so runs are reproducible across measurements.
    let s = seed >>> 0 || 1;
    Math.random = () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }
  const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const bootstrap = src.lastIndexOf('loadSchools().then(');
  if (bootstrap < 0) throw new Error('bootstrap not found in app.js');
  let head = src.slice(0, bootstrap);
  if (stubRender) {
    // The UI layer is not under test; short-circuit it so engine timings and
    // distributions are not polluted by innerHTML construction.
    head = head.replace('function render(){const order=ranked();', 'function render(){if(globalThis.__RENDER_OFF)return;const order=ranked();');
    if (!head.includes('__RENDER_OFF')) throw new Error('render stub anchor not found');
    globalThis.__RENDER_OFF = true;
  }
  const hook = `
globalThis.__ENGINE__ = {
  get universe(){ return universe }, set universe(v){ universe = v },
  get schools(){ return schools },
  loadSchools, initUniverse, buildSchedule, ranked, rankingScore, profiles, modeledUnit,
  weeklyPlan, ensureWeeklyDecisions, currentWeeklyDecisions, hasPendingWeeklyDecisions, hasPendingCareerChoice, resolveWeeklyDecision, delegateWeeklyDecisions, playerAgencyDecision, playerInteractionWindow, promisePlayerOpportunity, applyRequestedPositionChange, importantStarters, weeklyPlayerPlan, pipelineStrength, oversignAppetite, scholarshipRoom, scholarshipCapacity, scholarshipSummary, projectedReturning, projectedDepartures, pullOffer, recruitBlocked, enforceScholarshipLimits, canTakeCommit, classCommitCount, pulledOfferHubItems, SCHOLARSHIP_LIMIT,
  setTeamScheme, schemeTransition, schemeFamiliarity, advanceSchemeInstall, schemeFitFor, schemeDefFor, schemeFitPressure, applyCoachScheme, ensureCoachScheme, positionOptions, positionChangeWillingness, positionTransitionFit, applyPositionChangeCost, playerSchemeFit, SCHEME_SIDE,
  gameRecap, recapFacts, recapPicker, weeklyNewsletter, newsWeight, newsGames, newsWeeks,
  gameSim, detailedGame, simulateUserDetailed, gameBoxHTML, gameSummaryHTML, renderGameArchive, showGameCenter, simWeek, simSeason, simConferenceChampionships, simPlayoff, runOffseason,
  runSpringCamp, runFallCamp, advanceRecruiting, finalizeRecruiting,
  generateRecruitPool, generatePlayer, generateRoster, conditionRating,
  roleFit, unit, starter, roleStarter, participants, eligibilityBase, qbRushWeight, playerUsageWeight, STYLE_USAGE, defensiveShares, defensiveActor, fieldGoalChance, quickFieldGoals, puntAverage,
  transferRisk, draftProjection, seasonScore, productionRating, normalizeUniverse, recruitPitch, recruitPitchBreakdown, recruitSchemeFit, recruitSchemePriority, recruitCoachRelationshipBoost, ensureRecruitRelationships, assignPrimaryRecruiter, growRecruiterRelationship, coachTransferPressure,
  scoutingDefs, scoutingTruth, ensureScoutingIntel, scoutingDomainView, scoutingConfidenceLabel, refreshScoutingIntel, snapshotScouting, firstRecruitEvaluation, scoutingPanelHTML, scoutingHistoryHTML, hasPlayerTraits, playerTraitFields, inheritRecruitTraits,
  ensurePortrait, portraitSeedFor, jerseyFor, schoolColors, ensureSchoolColors, PORTRAIT_VERSION,
  APP_VERSION,
  T, findPlayer, rebuildIndexes, packUniverse, packPlayer,
  setRecruitPromise, commitRecruit, signPlayerPromise, auditPlayerPromises, auditPromises, normalizePromiseState, matchupEdges, gameMatchup, gameplanRecommendation, matchupEdgeLabel, renderMatchupStrategy,
  recordPromiseTraining, recordPromisePositionChange, promisePenalty, archiveRecord, rememberCoach, promiseHubItems, recordChaseHubItems, deriveRivalries, rivalOf, rivalryGameFor, isRivalryGame, rivalryHubItems, settleRivalryGame, rivalrySeriesText, seasonExpectation, ensureAdminState, adminSeasonReview, reviewControlledProgram, adminHubItems, adminConfidenceLabel, nilBudgetFor, nilRemaining, nilDealCost, nilDealActive, nilRetentionRelief, signNilDeal, applyGameplanWear, gameplanSnapshot, careerTotals, careerWinPct, hiringCeiling, hiringMarket, closeTenure, acceptPost, careerSummaryText, tenureRecord, careerHubItems, simBowls, bowlField, seedField, buildSigningDay, signingDayOdds, ensureAcademics, academicTarget, allKnownCoaches, coachingTree, ensureAllTimeRecord, recordSeasonInHistory, programCoachingLineage, programHistoryHTML, weeklyGameplanDecision, applyGameplanDecision, teamGameplanFor, applyGameplanEdge, schemeTransition, treeHeadCoaches, creditCoachingTree, coachTreeHubItems, academicRisk, academicallyIneligible, academicStatusText, advanceAcademics, academicDecision, applyAcademicDecision, academicHubItems, gameAvailable, signingDayPending, revealNextSigning, revealAllSigning, signingDayHubItems, decommitRecruit, bowlEligible, bowlHubItems, fanSupportTarget, updateFanSupport, homeFieldFor, homeFieldScoreBonus, cancelNilDeal, ensureNilState, resetNilSeason, careerChronologyHTML, RECORD_CATS,
  generateCoach, coachById, ensureCoachCareer, normalizeCoachState, recordCoachSeason, closeCoachStint, openCoachStint, archiveCoach, addCoachEvent, applyCoachRelationshipChange, coachFalloutHubItems, replaceStaffCoach, promoteCoachWithinTeam, moveCoach, retireCoach, coachCareerTotals, coachProfileHTML, chooseCoachMoveDestination, carousel, promiseHTML, applyDevelopmentPhase,
  teamStaffBudget, teamStaffSpend, candidateFitScore, generateCandidatePool, createOpening, interviewCandidate, candidateAcceptChance, extendOffer, hireCandidate, coachOpeningHubItems, COACH_SLOT_ROLES,
  captureRecruitment, transferFit, chooseTransferDestination, placeTransfer, familiarFaceItems, buildWeeklyHub, releasePlayerPromises, transferHistoryHTML, archivePlayerSeason,
  saveBrowser, loadBrowser, exportSave, importSave, installSave, ensureArchiveLoaded, archiveIsDeferred, ensureGamesLoaded, gamesAreDeferred,
  POS, POS_COUNTS, ROLE_DEFS, OFF_SCHEMES, DEF_SCHEMES, GROWTH_CURVES, OFF_POS, STYLES, STYLE_TRAITS, styleForTraits, styleDescription,
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
