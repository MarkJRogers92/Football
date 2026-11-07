# Dynasty Lab — handoff for Claude

**Prepared November 6, 2026 (America/Chicago).** This packet is context for continuing Mark's work. His latest request and current project instructions take precedence over this document.

## Start here

**Use this existing worktree:** `/Users/markrogers/.codex/worktrees/recruiting-weekly-desk/Football`

- Branch: `codex/recruiting-weekly-desk`.
- Base HEAD: `252a784e8a55ae48d09920be396d709b8e60dd7a` (v0.14.1).
- The implementation is **uncommitted and unreleased**. Source version remains 0.14.1. No commit, push, merge, publication, app packaging or installation was performed.
- Do not start from the older original checkout: `/Users/markrogers/.copilot/repos/Football` is still at `d1d2975ca5957d4d07b384fc6c68ad912446fc9c` with Mark's existing `tools/render-meshy-trophy.py` edit. That edit was preserved and is outside this package.
- Local `node_modules` is an ignored symlink to the original checkout's dependencies. No new packages were needed. If the symlink is unavailable elsewhere, install this project's existing dependencies normally.

**Mark's design direction:** use fewer menus and keep things condensed and clean. We tried a Tools dropdown, then replaced it with one flat strip of direct view buttons. Preserve that correction. Reuse existing components and canonical action handlers; avoid duplicate controls or a new menu hierarchy.

**Working agreement:** give plain explanations; make routine reversible choices; inspect actual source/status before trusting handoffs. Preserve unrelated edits. Never weaken tests or change timing thresholds to get a pass. Run affected checks after changes, then proportionate broader checks once stable. Do not repeat already reliable runs without a new change or unresolved concern. There is no standing authorization in this chat to commit, push, merge, publish or install; new explicit authorization from Mark can change that.

## What is finished

### 1. Recruiting explanation parity

`app.js`: `recruitPitchBreakdown` supplies the actual pitch calculation and the explanation. Correct baseline prestige weight is 0.42, with an additional 0.22 for Prestige priority. Academics and season record are included; contribution addition order is preserved. The blocked-team sentinel remains.

A complete regular season, conference championships and playoff with a fixed seed serialized **identically before and after**. This was an explanation repair, not balance tuning. Evidence: `pitch-parity.json` in the November 4 review folder below. The profile still shows the largest contributions rather than an exhaustive ledger.

### 2. Shorter weekly desk

Compact program identity and one existing primary action lead the page. The summary names the real blocking decision. Required decisions stay accessible; optional game planning is labeled optional and folded with the full briefing. Program ratings/secondary simulation controls also fold. Guidance opens the correct disclosure, returns to the weekly view and preserves the real gates. Welcome-back information remains visible.

Matched seed-7 phone fixture: page height **4587 → 1851px**; primary action **y=1185 → y=472**. This is a fixture measurement, not a universal guarantee.

### 3. Two further presentation accuracy repairs

- Program win bars scale proportionally above 12 wins; 12/15/17-win seasons no longer look identical. Confidence keeps its separate 0–100 scale.
- Game Cast recognizes successful two-point tries and safeties in scoring plays, excludes failed tries, and avoids double-counting reconciliation points. Its score cells now follow the advertised away–home order. Archived game results are not rewritten.

### 4. Recruiting count/search clarity and phone workflow

- Workspace hides the inactive table count. Table restores its own capped row count. Full-pool matching totals remain available.
- Workspace search uses the canonical full-pool name/school/city query; reset works across Workspace/Table. Search has an accessible label and the shared 40-character limit.
- Extra Workspace filters use persistent native `details`; open state and keyboard focus survive canonical refresh/reparenting. Table retains inline controls.
- At <=700px, selecting a prospect opens a dedicated dossier. Back restores selected card, loaded-card count, inner list/page scroll and keyboard focus. Desktop retains its split view.
- Removing the open My Board prospect returns to a safe list/search control; it does not focus the next prospect's Remove action. Responsive transitions keep focus on a visible control.
- The phone first-prospect target **y<600** remains covered by a browser regression, including the subsequent view strip.

### 5. Peer class views and roster outlook

`recruiting-class-views.js` routes the mounted Current, Rising and Outlook components. Switching views preserves their independent filters/selection and does not advance calendar or RNG.

`rosterOutlook` in `recruiting-needs.js`, using the expanded read-only `DynastyRecruitingNeeds` bridge in `app.js`, shows position counts: current roster, eligibility exits, returning players, commitments not yet enrolled, projected/designed depth, current targets and future watches. Targets/watches do not count as roster additions. Same-year offseason checkpoints prevent subtracting processed departures or adding enrolled commitments twice; prior-year checkpoints are ignored. Uncertain draft/transfer changes are explained rather than invented as numerical predictions.

Position shortcuts open the correct class and apply its existing filters. Current-board guidance reveals Current; scholarship-summary guidance now reveals Class summary.

### 6. Focused supporting views — latest completed package

The single, horizontally scrollable phone strip has direct **Current / Rising / Outlook / Map / Shortlist / Class summary / History** buttons. No additional Tools dropdown remains.

- **Current:** prospect desk/Table, filters and actions. Compact shared evaluation hours stay in the existing Workspace/Table toolbar.
- **Map:** existing map and star filters; marks still open canonical recruit profiles.
- **Shortlist:** existing ranking, recommendation reasons, targeting and scouting actions. Duplicate roster-need tiles were removed because Outlook is now its own view. Ranking logic was not changed.
- **Class summary:** existing class totals, scholarship information, full evaluation-hour explanation, signing board and signing-day controls.
- **History:** dedicated `#recruitingHistory` section in `body.html`. The existing scouting-receipt and recruiting-history renderers populate it. Fresh games show a clear empty state. Recorded receipts retain their existing school filtering and maturation gates. History is no longer duplicated inside Class summary.

The view controller watches direct panel additions and canonical Summary rebuilds, rather than repainting navigation for every map hover/portrait change. Guidance return context stays reachable across views. View navigation preserves map filters, selected prospects, loaded cards, inner list scroll and history disclosure state.

## Source map

- `app.js`: shared pitch, weekly decision rendering, win chart, read-only recruiting-needs snapshot bridge.
- `body.html`: desk markup/disclosures and dedicated recruiting History host.
- `dashboard-views.js/.css`, `next-action.js`, `guidance-system-ui.js`: desk routing, truthful action state and guidance destinations.
- `game-cast.js`: scoring presentation repairs.
- `recruiting-workspace.js/.css`: compact filters/toolbar, canonical search, phone dossier/Back, flat view-strip styling.
- **New** `recruiting-class-views.js`: recruiting panel classification and direct navigation.
- `recruiting-needs.js`: pure outlook model plus UI and position shortcuts.
- `scouting-receipts.js`: receipt recap now renders into History; calculation/freezing hooks retain existing behavior.
- `recruiting-shortlist.js`: supporting-view heading/content condensed; model/ranking unchanged.
- `tools/build.js`: integrates the new class-view module. **Edit source and rebuild `index.html`; do not edit generated HTML directly.**
- `package.json`: new targeted browser commands and coverage registration; version unchanged.
- Older browser tests were updated to open disclosures or focused views before inspecting their moved controls. Their behavioral assertions remain.

## Verification — distinguish the checkpoints

**Earlier full engine checkpoint (November 5, before later recruiting UI additions):** `npm test` passed **53 smoke checks and 538 Node tests**. This is not a fresh full-suite result for the final UI tree.

**Final focused-view package:**

- **54 targeted Node tests passed:** recruiting history, scouting receipts, map, shortlist, filters, actions, outlook, rising class and pitch explanation.
- **New focused-view browser passed at 1280 and 390 widths:** one-row direct navigation; first phone prospect <600; canonical map profile; shortlist Quick Film costs exactly one hour; targeting; correct visible hours; empty and positive history; immutable receipt; retained map/list/history state; no root horizontal overflow.
- Phone dossier regression, peer-class regression, preseason desktop/phone flow and recruiting portrait checks passed (**21 portrait checks**).
- Broad browser smoke: **119 passed, zero failed** on the final implementation.
- Final source/standalone check: in-memory `tools/build.js` output exactly matched `index.html` without rewriting it.
- Documentation consistency and `git diff --check` passed during closure.
- Independent native read-only review of the focused-view changes found no confirmed scoped regression; it did not rerun tests. Earlier bridge review limits/timeouts are recorded in `latest_session_work.md`.

**Not verified for the final UI tree:** the entire engine/browser matrices, packaged desktop, actual-device iPhone/Safari and final release pipeline. No claim is made that the installed app or published web app contains this work.

A prior concurrent browser run hit the unchanged 4-second desktop simulation timing check at 4281ms; its isolated rerun passed. The latest focused-view smoke also passed. Keep the threshold; avoid competing heavy browser/test jobs when investigating timing.

### Reference commands

These are a continuation reference, not an instruction to repeat all completed checks immediately.

```sh
cd /Users/markrogers/.codex/worktrees/recruiting-weekly-desk/Football
git status --short
npm run build
npm run test:recruiting-tools-browser
npm run test:recruiting-class-views-browser
npm run test:recruiting-phone-browser
```

The final 54-test targeted set was:

```sh
node --test tests/recruiting-history.js tests/scouting-receipts.js tests/recruit-map.js tests/recruiting-shortlist.js tests/recruiting-filters.js tests/scouting-actions.js tests/recruiting-outlook.js tests/rising-class.js tests/recruit-pitch-explanation.js
```

Other relevant checks: `node tests/browser.js`, `node tests/recruit-visual.js`, `node tests/preseason-start-browser.js`, `node tests/guidance-system-browser.js`, `node tests/rising-class-browser.js`, `node tests/recruiting-needs-browser.js`, `node tests/recruiting-filters-browser.js`.

`node tools/publish.js --verify` requires committed/clean source and currently stops there because these changes are deliberately uncommitted. Run the release workflow only after the relevant authorization and preparation.

## Evidence and previews

- Complete proposed roadmap and baseline audit: `/Users/markrogers/Documents/Codex/2026-11-04/dynasty-upgrade-review/ROADMAP.html`.
- Pitch parity and matched weekly desk evidence: same November 4 review directory.
- **Latest focused-view previews:** `/Users/markrogers/Documents/Codex/2026-11-06/recruiting-tools/` (`desk-390.png`, map/shortlist/summary/history at 390 and 1280 widths, `verification.json`).
- Prior class/outlook previews: `/Users/markrogers/Documents/Codex/2026-11-06/recruiting-class-views/`.
- Prior phone-dossier previews: `/Users/markrogers/Documents/Codex/2026-11-06/recruiting-workspace/`.

The positive History preview is a controlled browser-test signing receipt fixture. The production UI does not fabricate history for initial players. Some older preview folders show earlier navigation; use the latest focused-view folder for the current layout.

The November 4 `source/` review snapshot and recovery ZIP are **older baselines**, not the current implementation checkout.

## Suggested next step for Claude

1. Inspect the current worktree and this package's diff, preserving all existing edits. Read `agent_docs/latest_session_work.md` for supporting evidence only when needed.
2. Do a bounded visual-density/interaction review of the latest desktop and phone screens against Mark's fewer-menus goal. Fix confirmed problems and run checks for the affected path. Avoid redesigning shipped slices or repeating the earlier broad investigation without a reason.
3. Decide the next implementation/release scope with Mark. If he authorizes release, perform the version/changelog, clean-source/release checks and any requested desktop packaging/install. Do not assume release authorization from this handoff.
4. Larger roadmap candidates remain living rival recruiting, connected player/program history and **measured** long-save responsiveness. Do not start balance tuning or enlarge the watchlist/shared budget without a defined target and evidence. Existing watch limit and canonical budget behavior were retained.

## Recovery bundle

A fresh recovery copy for this handoff is at:

`/Users/markrogers/Documents/Codex/2026-11-06/claude-handoff/DYNASTY_LAB_CLAUDE_BUNDLE_2026-11-06.zip`

It contains all modified/new source files in this worktree, a tracked-change patch, this handoff, source-file hashes, verification records and latest focused-view previews. Restore only against the recorded base commit and inspect the manifest/diff first. It is a recovery delta, not a full repository or desktop installer. The active worktree is the source of truth. A copy of the handoff and bundle is also placed in Mark's Downloads for transfer to Claude.
