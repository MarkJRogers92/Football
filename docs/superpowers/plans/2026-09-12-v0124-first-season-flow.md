# Dynasty Lab v0.12.4 First-Season Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the first four regular-season weeks into a coherent coaching flow that explains what changed, what matters, how to prepare for the opponent, and what the prior game caused without changing simulation authority.

**Architecture:** Add one pure derivation module (`first-season-flow.js`) and one DOM adapter (`first-season-flow-ui.js`). Both consume the existing guidance, weekly coaching, Game Engine v2 archive, and game-plan-feedback facts; they never create a second advancement gate or consume gameplay RNG. Existing Guidance remains authoritative and receives only presentation grouping/fade behavior.

**Tech Stack:** Vanilla JavaScript, CommonJS/UMD pure modules, generated standalone HTML, Playwright browser tests, Node `node:test`, Electron-compatible source build.

**Spec:** `docs/superpowers/specs/2026-09-12-v0124-first-season-flow-design.md`

## Global Constraints

- Reuse the existing authoritative `guidanceModel`, advancement gates, weekly coaching prep, player stories, Game Engine v2 archive, and game-plan feedback.
- Guidance and briefing derivation must be deterministic and must not consume gameplay RNG.
- Existing saves must remain loadable; prefer derived state over new persistence.
- Do not hand-edit generated `index.html`.
- Weeks 1–2 use explicit guidance, Weeks 3–4 concise guidance, Week 5+ normal guidance.
- Mandatory decisions never disappear because of familiarity.
- No `gh-pages` publication until the feature branch passes release gates.

---

### Task 1: Pure first-season flow model

**Files:**
- Create: `first-season-flow.js`
- Create: `tests/first-season-flow.js`

**Interfaces:**
- Produces: `DynastyFirstSeasonFlow.guidanceMode({seasonIndex, week}) -> 'explicit'|'concise'|'normal'`
- Produces: `classifyAgenda(items, mode) -> {required,recommended,optional,mode}`
- Produces: `buildCarryForward({record, feedback, teamName}) -> object|null`
- Produces: `buildBriefing(input) -> {mode,title,summary,bullets,next}`
- Produces: `buildPrepPath(input) -> {stages:[...]}`

- [ ] **Step 1: Write failing model tests**

```js
const assert=require('node:assert/strict');
const test=require('node:test');
const Flow=require('../first-season-flow');

test('guidance fades across first four weeks',()=>{
  assert.equal(Flow.guidanceMode({seasonIndex:0,week:0}),'explicit');
  assert.equal(Flow.guidanceMode({seasonIndex:0,week:1}),'explicit');
  assert.equal(Flow.guidanceMode({seasonIndex:0,week:2}),'concise');
  assert.equal(Flow.guidanceMode({seasonIndex:0,week:3}),'concise');
  assert.equal(Flow.guidanceMode({seasonIndex:0,week:4}),'normal');
  assert.equal(Flow.guidanceMode({seasonIndex:1,week:0}),'normal');
});

test('agenda presentation never demotes must-resolve items',()=>{
  const model=Flow.classifyAgenda([
    {id:'a',meaning:'must_resolve'},
    {id:'b',meaning:'decision_due'},
    {id:'c',meaning:'monitoring'}
  ],'explicit');
  assert.deepEqual(model.required.map(x=>x.id),['a']);
  assert.deepEqual(model.recommended.map(x=>x.id),['b']);
  assert.deepEqual(model.optional.map(x=>x.id),['c']);
});

test('postgame carry-forward uses recorded evidence only',()=>{
  const result=Flow.buildCarryForward({
    teamName:'Chicago Metropolitan',
    record:{home:{name:'Chicago Metropolitan'},away:{name:'Great Lakes University'},score:{home:31,away:17}},
    feedback:{verdict:'Worked',headline:'Pressure produced 4 sacks.',detail:'Opponent averaged 5.8 yards per pass attempt.'}
  });
  assert.match(result.result,/31–17/);
  assert.equal(result.verdict,'Worked');
  assert.equal(result.headline,'Pressure produced 4 sacks.');
});
```

- [ ] **Step 2: Run the unit test and verify RED**

Run: `node --test tests/first-season-flow.js`

Expected: FAIL because `../first-season-flow` does not exist.

- [ ] **Step 3: Implement the pure module**

Use an existing UMD/CommonJS shape, clone arrays before sorting/grouping, and never call `Math.random`, `Date.now`, or simulation helpers.

```js
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DynastyFirstSeasonFlow=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const guidanceMode=({seasonIndex=0,week=0}={})=>Number(seasonIndex)===0?(week<=1?'explicit':week<=3?'concise':'normal'):'normal';
  // classifyAgenda, buildCarryForward, buildBriefing, buildPrepPath follow the spec and return new objects only.
  return {guidanceMode,classifyAgenda,buildCarryForward,buildBriefing,buildPrepPath};
});
```

- [ ] **Step 4: Run the unit test and verify GREEN**

Run: `node --test tests/first-season-flow.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add first-season-flow.js tests/first-season-flow.js
git commit -m "feat: add first-season flow model"
```

---

### Task 2: Dashboard week-opening briefing and guidance grouping

**Files:**
- Create: `first-season-flow-ui.js`
- Create: `first-season-flow.css`
- Modify: `guidance-system-ui.js`
- Modify: `tools/build.js`
- Create: `tests/first-season-flow-browser.js`

**Interfaces:**
- Consumes: `DynastyFirstSeasonFlow`, `guidanceModel()`, `findUserGame()`, `selected()`, `v0102WeeklyOpponentReport()`.
- Produces: `renderFirstSeasonFlow()` and `window.getFirstSeasonFlow()` for browser verification.

- [ ] **Step 1: Write the browser test for Week 1 briefing and grouped agenda**

```js
await startNewDynasty(page);
const flow=await page.evaluate(()=>window.getFirstSeasonFlow());
assert.equal(flow.mode,'explicit');
assert.equal(await page.locator('#firstSeasonBriefing').count(),1);
assert.ok(await page.locator('[data-guidance-group="required"]').count());
assert.ok(await page.locator('[data-guidance-group="recommended"]').count());
assert.ok(await page.locator('[data-guidance-group="optional"]').count());
```

- [ ] **Step 2: Run and verify RED**

Run: `node tests/first-season-flow-browser.js`

Expected: FAIL because the briefing and grouped agenda do not exist.

- [ ] **Step 3: Add the dashboard adapter**

Create `#firstSeasonBriefing` adjacent to `#coachingAgenda`. Derive previous game, opponent scout, agenda counts, and next action from existing read-only helpers. Never mutate universe state.

- [ ] **Step 4: Group the existing agenda without changing meanings**

In `guidance-system-ui.js`, call `DynastyFirstSeasonFlow.classifyAgenda(model.items, mode)` and render headings:

```html
<section data-guidance-group="required">...</section>
<section data-guidance-group="recommended">...</section>
<section data-guidance-group="optional">...</section>
```

Explicit mode keeps cause/consequence visible; concise mode collapses explanatory text for non-required familiar items; normal mode preserves current behavior.

- [ ] **Step 5: Wire build order and CSS**

In `tools/build.js`:
- load `first-season-flow.js` before `appSource`, beside `weekly-coaching-engine.js`;
- inject `first-season-flow-ui.js` after `guidance-system-ui.js` in the extension list so it can wrap dashboard/Game Lab renders;
- include `first-season-flow.css` with the other feature styles.

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm run build
node --test tests/first-season-flow.js tests/guidance-system.js tests/guidance-system-m2.js
node tests/first-season-flow-browser.js
node tests/guidance-system-browser.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add first-season-flow-ui.js first-season-flow.css guidance-system-ui.js tools/build.js tests/first-season-flow-browser.js
git commit -m "feat: add week-opening coaching briefing"
```

---

### Task 3: Game Lab preparation path

**Files:**
- Modify: `first-season-flow-ui.js`
- Modify: `first-season-flow.css`
- Modify: `tests/first-season-flow-browser.js`

**Interfaces:**
- Consumes: `v0102WeeklyOpponentReport`, `v0102WeeklyPrepFor`, `guidanceModel`, `findUserGame`, existing weekly decision state.
- Produces: `#firstSeasonPrepPath` with stage buttons using existing destinations and controls.

- [ ] **Step 1: Add failing browser assertions for stage transitions**

```js
await goTab(page,'gamelab');
let path=await page.evaluate(()=>window.getFirstSeasonFlow().prepPath);
assert.equal(path.stages.find(x=>x.key==='opponent').status,'current');
await page.evaluate(()=>window.__DL_TEST__.weeklyCoachingSet(['pass_protection']));
path=await page.evaluate(()=>window.getFirstSeasonFlow().prepPath);
assert.equal(path.stages.find(x=>x.key==='prep').status,'done');
```

- [ ] **Step 2: Run and verify RED**

Run: `node tests/first-season-flow-browser.js`

- [ ] **Step 3: Render the preparation path**

Stages are derived only:

```js
[
  {key:'opponent',label:'Review opponent'},
  {key:'decisions',label:'Resolve decisions'},
  {key:'prep',label:'Set weekly prep'},
  {key:'personnel',label:'Review personnel'},
  {key:'gameday',label:'Game Day'}
]
```

Clicking a stage scrolls/focuses the existing `#v2MatchupIntelligence`, `#weeklyDecisions`, `#v0102WeeklyCoaching`, personnel card, or `#simDetailedGame`; it never performs the action itself.

- [ ] **Step 4: Verify state changes**

Run:

```bash
node --test tests/first-season-flow.js tests/weekly-coaching-loop.js
node tests/first-season-flow-browser.js
node tests/weekly-coaching-loop-browser.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add first-season-flow-ui.js first-season-flow.css tests/first-season-flow-browser.js
git commit -m "feat: connect weekly prep path"
```

---

### Task 4: Postgame carry-forward and first-season texture

**Files:**
- Modify: `first-season-flow-ui.js`
- Modify: `first-season-flow.js`
- Modify: `tests/first-season-flow.js`
- Modify: `tests/first-season-flow-browser.js`

**Interfaces:**
- Consumes: `universe.gameArchive`, `DynastyGameplanFeedback.forTeam`, existing guidance/player-story items, team/admin/season-goal facts.
- Produces: evidence-backed `carryForward` and `texture` fields in `getFirstSeasonFlow()`.

- [ ] **Step 1: Add failing pure tests for evidence priority**

```js
const briefing=Flow.buildBriefing({
  mode:'explicit',
  opponent:'Wisconsin Commonwealth',
  carryForward:{result:'Won 31–17',verdict:'Worked',headline:'Pressure produced 4 sacks.'},
  agenda:{required:[{title:'Answer player role concern'}],recommended:[],optional:[]},
  scout:['Opponent leans pass.']
});
assert.equal(briefing.bullets[0].kind,'last_game');
assert.equal(briefing.bullets[1].kind,'opponent');
assert.equal(briefing.bullets[2].kind,'required');
```

- [ ] **Step 2: Add browser assertion across a recorded game boundary**

Record a real Detailed Game through the existing test bridge, advance to the next week, and assert `#firstSeasonBriefing` includes the previous score plus either the archived game-plan verdict/headline or baseline result language.

- [ ] **Step 3: Implement carry-forward extraction**

Select the most recent archive record containing the user team, pass it to `DynastyGameplanFeedback.forTeam`, and catch only the “team not part of record” case. Do not synthesize unrecorded morale/recruiting consequences.

- [ ] **Step 4: Add factual texture**

At most one extra texture line is selected from already-active guidance/player-story/admin/season-goal facts by deterministic priority. No random media quotes or invented effects.

- [ ] **Step 5: Run focused + RNG regressions**

Run:

```bash
node --test tests/first-season-flow.js tests/game-engine-v2-gameplan-feedback.js tests/rng.js tests/rng-integration.js
node tests/first-season-flow-browser.js
node tests/game-engine-v2-cutover-browser.js
```

Expected: PASS and no RNG state change caused by rendering.

- [ ] **Step 6: Commit**

```bash
git add first-season-flow.js first-season-flow-ui.js tests/first-season-flow.js tests/first-season-flow-browser.js
git commit -m "feat: carry game consequences into next week"
```

---

### Task 5: Fade behavior, mobile behavior, and regression hardening

**Files:**
- Modify: `first-season-flow-ui.js`
- Modify: `first-season-flow.css`
- Modify: `tests/first-season-flow-browser.js`
- Modify: `package.json`

**Interfaces:**
- Adds npm scripts `test:first-season-flow` and `test:first-season-flow-browser` and includes the pure test in the main `npm test` gate.

- [ ] **Step 1: Add Week 3/4 and mobile assertions**

```js
const mode=await page.evaluate(()=>window.getFirstSeasonFlow().mode);
assert.equal(mode,'concise');
await page.setViewportSize({width:390,height:844});
assert.ok(await page.locator('#firstSeasonBriefing').isVisible());
assert.ok(await page.locator('#firstSeasonPrepPath').isVisible());
```

- [ ] **Step 2: Ensure explicit guidance fades, not disappears**

Weeks 3–4 collapse explanatory copy for non-required familiar items. Required items keep their label, reason, and action. Week 5+ uses existing Guidance presentation as closely as possible.

- [ ] **Step 3: Add scripts and full-test inclusion**

```json
"test:first-season-flow": "node --test tests/first-season-flow.js",
"test:first-season-flow-browser": "node tests/first-season-flow-browser.js"
```

Add `tests/first-season-flow.js` to `npm test`.

- [ ] **Step 4: Run focused validation**

```bash
npm run build
npm run test:first-season-flow
npm run test:first-season-flow-browser
npm run test:guidance
npm run test:game-engine-v2
npm run test:storage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add first-season-flow-ui.js first-season-flow.css tests/first-season-flow-browser.js package.json
git commit -m "test: harden first-season coaching flow"
```

---

### Task 6: v0.12.4 release prep and full validation

**Files:**
- Modify: `VERSION.txt`
- Modify: `package.json`
- Modify: `app.js` only for the existing `APP_VERSION` marker
- Modify: `CHANGELOG.md`
- Modify: `agent_docs/latest_session_work.md`

**Interfaces:**
- Version authorities must all equal `0.12.4`.

- [ ] **Step 1: Bump the three version authorities**

Set `VERSION.txt`, `package.json#version`, and `app.js` `APP_VERSION` to `0.12.4` without modifying unrelated app logic.

- [ ] **Step 2: Add release notes**

Document:
- week-opening briefing,
- Required / Recommended / Optional agenda grouping,
- first-four-week guidance fade,
- Game Lab prep path,
- archived postgame carry-forward,
- no new simulation/RNG/persistence authority.

- [ ] **Step 3: Run full validation**

Run:

```bash
npm run validate:full
npm run test:guidance-browser
npm run test:weekly-coaching-loop-browser
npm run test:game-engine-v2-gameday-browser
npm run test:game-engine-v2-gameday-record-browser
```

Expected: all PASS.

- [ ] **Step 4: Inspect generated diff and branch comparison**

Confirm no unexpected generated-source drift, no direct `index.html` edit, and no production branch change.

- [ ] **Step 5: Commit release prep**

```bash
git add VERSION.txt package.json app.js CHANGELOG.md agent_docs/latest_session_work.md index.html
git commit -m "release: prepare Dynasty Lab v0.12.4 [full-ci]"
```

- [ ] **Step 6: Open a draft PR**

Open `codex/v0124-first-season-flow` against the current source baseline with validation results and explicitly state that production publishing is out of scope until review.