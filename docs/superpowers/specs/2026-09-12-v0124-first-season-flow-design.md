# Dynasty Lab v0.12.4 — First-Season Flow / Game Week Experience

## Purpose

Make the first four regular-season weeks feel like one continuous head-coaching job rather than a set of independent screens. The player should always understand what changed, what matters now, what is mandatory, what is optional, how this opponent changes the week, and what the previous game caused—without turning Dynasty Lab into a linear tutorial.

## Product test

A player can start a fresh dynasty and play through Week 4 without having to ask “what am I supposed to do now?”, while an experienced player can still ignore or compress the guidance layer and use the existing open-ended management screens.

## Non-negotiable constraints

- Reuse the existing authoritative `guidanceModel`, advancement gates, weekly coaching prep, player stories, Game Engine v2 archive, and game-plan feedback. Do not create a parallel checklist, second advancement gate, or duplicate simulation state.
- Guidance and briefing derivation must be deterministic and must not consume gameplay RNG.
- Existing saves must remain loadable. Any new persisted state must be optional and version-tolerant; prefer derived state.
- Existing simulation, archive, save, rollback, Game Engine v2, recruiting, and postseason behavior must remain unchanged unless explicitly required by this milestone.
- Web and Electron desktop use the same source behavior. Mobile layouts remain usable.
- `index.html` remains generated output. Edit source files and `tools/build.js`, never hand-edit generated HTML.
- Weeks 1–2 may be explicit, Weeks 3–4 concise, Week 5+ normal/minimal. Mandatory decisions never disappear because of familiarity.

## Architecture

### 1. Pure first-season flow model

Add `first-season-flow.js` as a small UMD/CommonJS-compatible pure module, loaded before the main app. It receives already-known facts and returns presentation-ready data only.

Public API:

```js
DynastyFirstSeasonFlow.guidanceMode({ seasonIndex, week })
DynastyFirstSeasonFlow.buildBriefing(input)
DynastyFirstSeasonFlow.classifyAgenda(items, mode)
DynastyFirstSeasonFlow.buildPrepPath(input)
DynastyFirstSeasonFlow.buildCarryForward(input)
```

The module owns no universe mutations, no browser access, no storage, and no RNG. It exists so the first-season rules are unit-testable without booting the full simulation.

### 2. Week-opening briefing

Add a dashboard briefing rendered from current authoritative facts. It summarizes, in this order when available:

1. Previous game result and one evidence-backed cause from archived Game Engine v2 / game-plan feedback.
2. Current opponent and the strongest staff scouting observation from `weekly-coaching-engine.js`.
3. Required/due Coaching Agenda count from `guidanceModel()`.
4. One meaningful roster/player-story/recruiting/admin item already represented by existing systems.
5. A clear next-step sentence linked to the same destination the Guidance system uses.

The briefing is not an inbox and does not persist its own facts. It is recomputed whenever the dashboard renders.

### 3. Required / Recommended / Optional agenda presentation

Do not change existing guidance meanings or advancement semantics. Map them for presentation:

- Required: `must_resolve`
- Recommended: `decision_due` and consequential staff recommendations
- Optional: monitoring and ordinary staff recommendations

Weeks 1–2 show short cause/consequence explanations inline. Weeks 3–4 keep labels and collapse familiar explanation text. Week 5+ keeps the existing restrained guidance behavior. Familiarity never hides required items.

### 4. Game-week preparation path

On weeks with a user game, derive a visible preparation path from systems that already exist:

1. Review opponent
2. Resolve required decisions
3. Set weekly prep / game plan
4. Review personnel issues when one exists
5. Start Detailed Game / advance

Each stage is `done`, `current`, `optional`, or `blocked`. Stages deep-link to existing tabs/elements; they do not duplicate controls. Weekly prep remains the same two-point prep budget and staff-delegation system.

### 5. Postgame carry-forward

After a completed user game, the next dashboard briefing should explain one or two concrete consequences using existing records:

- final result / score,
- Gameplan Feedback verdict/headline/detail when available,
- injuries or player-story items already generated,
- ranking/admin/recruiting facts only when an existing authoritative value changed and can be named safely.

No generated narrative may invent a causal effect that the simulation did not record.

### 6. First-season narrative texture

Narrative texture is assembled from authoritative existing facts, not random flavor text. Eligible sources include current season goals/expectations, admin confidence, rivalry/conference context, recruiting board pressure, player stories, injuries, starter challenges, and game-plan feedback.

The UI can phrase these facts with coaching language, but it must not claim new morale, recruiting, media, or hot-seat effects unless those systems already expose them.

## UI placement

- `#firstSeasonBriefing`: dashboard, immediately before or adjacent to the Coaching Agenda.
- `#firstSeasonPrepPath`: Game Lab, above the existing opponent scout / weekly prep card.
- Existing Coaching Agenda receives group headings rather than a replacement component.
- New CSS lives in `first-season-flow.css` and follows the current dark client-shell/panel visual language.

## Data flow

```text
existing universe / archive / guidance / weekly coaching facts
            ↓
first-season-flow.js (pure derivation)
            ↓
first-season-flow-ui.js (DOM + deep links only)
            ↓
existing tabs, controls, and authoritative actions
```

The UI adapter may call read-only helpers such as `guidanceModel()`, `findUserGame()`, `v0102WeeklyOpponentReport()`, `v0102WeeklyPrepFor()`, and Gameplan Feedback. It must not simulate time or resolve decisions on the player's behalf.

## Guidance fade rules

`guidanceMode()` returns:

- `explicit` for first-season Weeks 1–2,
- `concise` for first-season Weeks 3–4,
- `normal` otherwise.

“First season” means the coach’s first tracked season with the selected program when that fact is available; the fallback is the dynasty’s initial season. The rule must degrade safely on old saves.

## Tests

### Pure tests

Create `tests/first-season-flow.js` covering:

- guidance fade boundaries,
- Required / Recommended / Optional classification,
- deterministic briefing priority,
- prep-path stage status transitions,
- postgame carry-forward from a recorded feedback object,
- no mutation of supplied inputs.

### Browser tests

Create `tests/first-season-flow-browser.js` covering a fresh dynasty:

- briefing appears in Week 1,
- explicit mode labels required/recommended/optional,
- prep path appears in Game Lab and points to existing controls,
- resolving a real weekly decision changes path/agenda state,
- setting weekly prep changes the preparation stage to done,
- after recording a Detailed Game, the following week displays a prior-game carry-forward,
- Week 3/4 uses concise presentation,
- no console/page errors at desktop and narrow viewport widths.

### Regression gates

Run existing guidance, weekly coaching, Game Engine v2 cutover/transaction, save/storage, RNG, and full CI gates. The milestone is not complete if the generated build diverges from source or if presentation rendering consumes gameplay RNG.

## Release boundary

Do not publish `gh-pages` or replace the production release as part of feature construction. Complete source + tests on `codex/v0124-first-season-flow`, validate, then prepare the version/release changes as a distinct final task.