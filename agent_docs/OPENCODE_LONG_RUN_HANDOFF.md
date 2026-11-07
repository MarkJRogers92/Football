# OpenCode handoff — Dynasty Lab long-dynasty and save testing

Prepared November 6, 2026 (Chicago time). Source version: **0.14.2**.

## Assignment

Run long-term dynasties and real save/reload cycles to find reproducible bugs, broken progression, lost or duplicated history, performance degradation, and suspicious simulation trends. Work autonomously through the bounded campaign below. Deliver evidence and small reproducers, not a claim that the game is bug-free.

You may add test drivers, instrumentation and regression tests in an isolated branch. Diagnose product defects and propose fixes; do not change balance, difficulty, archive-retention policy or gameplay mechanics merely to improve a distribution. Do not publish, merge, install over Mark's game, or use his real saves. Routine decisions in generated test dynasties may be delegated. Preserve unrelated edits.

## Get the exact code

- Repository: https://github.com/MarkJRogers92/Football
- Integration PR: https://github.com/MarkJRogers92/Football/pull/35
- Candidate branch: `claude/gracious-rubin-mfi574`.
- Product-code candidate: `2dc70dfe868998da967643f468ffd637523e0544`.
- Candidate plus ticker-test setup correction: `21389d5712f1893d63c18c7d8a9f62faa419b6db`.
- The source packet includes `Football.bundle` and `SOURCE_MANIFEST.json`. The manifest identifies the actual bundled local commit, its tree and bundle hash. Local reconstruction commits differ from GitHub commit IDs; this is intentional and documented. The bundle contains full source, assets, tests and reachable Git history, but no installed dependencies or personal saves.

Preferred portable start, after unzipping the packet into a new directory:

```sh
git clone -b codex/opencode-soak-handoff Football.bundle Football-soak
cd Football-soak
git switch -c opencode/long-dynasty-audit
npm ci
npm run build
git diff --exit-code -- index.html
```

Use Node 24, matching CI. Verify `git rev-parse HEAD` against the packet manifest before creating your branch. Never overlay the packet onto a dirty checkout. Alternatively clone GitHub, check out the exact candidate SHA above, then create your own testing branch. Check PR #35 for later fixes; do not silently substitute an older default-branch version.

On Mark's Mac, the working implementation is at `/Users/markrogers/.copilot/repos/Football/.session-artifacts/living-world`. The outer checkout is older and has an unrelated trophy-rendering edit. Do not reset either checkout. The implementation's dependency directory is a machine-local symlink; a new clone needs `npm ci`.

## Verification status at packet creation

Read `agent_docs/latest_session_work.md` and the packet manifest for final integration/CI status. Do not infer that a built ZIP means the branch is merged or the website is updated.

- Product candidate passed a fresh local run of **582 Node tests and 53 smoke checks**, with zero failures; clean-source reproducible-build verification passed.
- Mark ran `test:living-world-browser`, `test:fun-features-browser`, and `test:season-features-browser` successfully in his normal Mac Terminal.
- GitHub PR run `42342382087` passed every job, including both browser matrices, storage, simulation audit, and Mac/Windows packaged-app smoke tests. Mac smoke exercised native saving, replacement/restart, restore and clean shutdown.
- Duplicate push run `42342377233` timed out at `tests/ui-upgrades-browser.js:109`, waiting for a ticker. Investigation confirmed startup and decision confirmations are intentionally filtered out; the test did not arrange an eligible headline. Commit `21389d5` adds two status-line fixtures before the existing phone-layout checks. It changes no product code, assertion or timeout.
- The next PR run `42343226831` encountered a **separate unresolved timeout** at `tests/recruiting-filters-browser.js:28`, searching for a generated punter outside the initial 220 displayed rows. Capture query text, filter state, matching names/counts and console errors if it recurs. Do not assume it is harmless load sensitivity or weaken the assertion. Later results, if any, belong in the final status note.
- Claude's earlier handoff also reported intermittent phone focus failure at `tests/recruiting-phone-browser.js:62` after removing a prospect from My Board. It passed isolated reruns. Preserve that check and investigate rerender/focus behavior if reproduced.
- Long-dynasty results below are **historical measurements**, not a new 0.14.2 soak. Actual-device Safari/iPhone and a complete manual visual playthrough are not verified.

## Architecture and useful entry points

| File / area | What it provides |
| --- | --- |
| `app.js`, root feature modules | Authoritative game state, progression and presentation. |
| `tools/build.js` | Builds `index.html`; never edit generated HTML directly. |
| `tools/harness.js` | `loadEngine({seed, fullRuntime:true})`, production extension hooks and a minimal DOM shim. |
| `tools/save-size.js` | Packed save-size measurements; honors `SEED`/`SEASONS`; drives offseason phases and checks year advancement. |
| `tools/league-health.js` | League distributions, transfers, positional shortages, championships, recruiting and archive metrics. |
| `tools/longrun.js`, `tools/audit.js` | Older baseline diagnostics; inspect their limitations before using them as proof. |
| `storage.js`, `tests/persistence.js`, `tests/browser-storage.js` | IndexedDB saves, lazy history, export/import, replacement and failure paths. |
| `desktop/storage.js`, `tests/desktop-storage.js`, `tests/desktop-smoke.js` | Native chunked saves, backups, revisions, disposable-profile desktop tests. |
| `tests/living-world-integration.js` | Two-season full-runtime example: real progression, read-only adapters, title accuracy and optional follows. |
| `tests/game-engine-v2-season-soak-browser.js` and related `game-engine-v2-*browser.js` | Production detailed-game recording, season progression, postseason, archive and rollback checks. |
| `living-world*.js`, `legacy*.js`, `ceremony-snapshot-adapter.js` | Optional follows/briefings, device-local Legacy and milestone/history adapters. |

Read relevant current source before relying on older overview/version statements. `VERSION.txt`, `package.json` and the built artifact are version authorities.

### Existing-tool limitations to account for

1. Current `longrun`, `audit`, `save-size`, and `league-health` scripts call the harness without `fullRuntime:true`. They are useful baseline measurements, but do not by themselves prove the shipping extension, browser or desktop paths work. Add a bounded full-runtime driver and exercise the real browser/desktop save adapters separately.
2. `tools/audit.js` currently hardcodes seed `20260903`; setting `SEED` does not change it. `npm run longrun` hardcodes `SEASONS=12` in its script; use `node tools/longrun.js` directly when specifying another horizon.
3. The older `longrun`/`audit` loops do not provide the same explicit per-season advancement guard as `save-size`. A loop iteration is not proof of a completed season. A previous soak silently stalled at an interactive offseason gate; never repeat that measurement mistake.
4. The league-health variable labelled preseason top ten is currently captured after the regular season/conference simulation. Verify timing before drawing conclusions about preseason favorites. The no-`recruitingMemory` count is a proxy, not proof every counted player is a walk-on; generated starting rosters need a warm-up period.
5. The harness mutates global DOM/RNG/UUID helpers. Use separate processes for independent seeds and restart comparisons. Do not overwrite restored gameplay RNG or introduce fake ID collisions by resetting a test shim, then report that as a product bug.

## Campaign — staged, reproducible, and bounded

Run heavy simulations serially on the MacBook Air. Start small, record time and memory, then expand. Keep browser/desktop jobs separate from heavy Node simulations. Do not run an unlimited loop or increase memory without measuring why.

### 1. Establish baseline and resource cost

```sh
mkdir -p .session-artifacts/soak
npm test > .session-artifacts/soak/baseline-tests.log 2>&1
npm run test:desktop-storage > .session-artifacts/soak/desktop-storage.log 2>&1
SEED=7 SEASONS=2 node tools/save-size.js > .session-artifacts/soak/size-seed7-2.log 2>&1
SEED=7 SEASONS=2 node tools/league-health.js > .session-artifacts/soak/health-seed7-2.log 2>&1
```

Check every exit code before continuing. Record Node version, OS/architecture, commit, seed, action policy, timings, peak RSS/heap and available disk. Raw logs alone are not a summary.

### 2. Baseline horizon and full-runtime soak

- Start with seeds **7 and 11**, **20 completed seasons each**. These allow comparison with existing measurements. Use Chicago Metropolitan initially, then extend the driver to at least one strong and one weak program selected from the actual current school data.
- Add seeds **42 and 20260903** for 20 seasons if the first pair is stable and resource use is reasonable.
- Extend one stable seed toward **30 seasons**, then **50** only if storage/reload and resources permit. Report the maximum completed year, not the requested horizon. A measured storage limit is a result; do not change the limit to finish the run.
- Reuse the phase-driving patterns in `save-size.js`, `league-health.js` and the living-world integration test. Include ordinary weeks, conference games, bowls, playoffs, review, departures, recruiting/signing, portal, spring/fall camps, preseason and career changes. Resolve real gates through the normal engine functions; never force `universe.year`, `phase`, or `week` forward.
- Add per-transition and per-season watchdogs. Assert each completed outer iteration advances the year exactly once. If it stalls, persist the seed, checkpoint, action log, current phase and blocker, then fail visibly.
- Keep quick/season simulation, detailed/watch games and coached decisions labelled as separate paths. Different modes need not generate identical games; determinism means identical seed, mode, saved state and action sequence.

Existing diagnostic commands, **not substitutes for full-runtime/save tests**:

```sh
SEED=7 SEASONS=20 node tools/league-health.js > .session-artifacts/soak/health-seed7-20.log 2>&1
SEED=11 SEASONS=20 node tools/league-health.js > .session-artifacts/soak/health-seed11-20.log 2>&1
SEED=7 SEASONS=20 ANALYZE=1 node tools/save-size.js > .session-artifacts/soak/size-seed7-20.log 2>&1
SEED=11 SEASONS=20 node tools/save-size.js > .session-artifacts/soak/size-seed11-20.log 2>&1
```

Avoid resimulating the same 20 seasons in several tools if one small instrumented driver can collect their metrics and real checkpoints in a single pass.

### 3. Real persistence and cold restart — highest priority

Use synthetic dynasties and disposable browser/Electron profiles or temporary native-storage roots. Do not point tests at Mark's normal `Dynasty Lab` application data.

At years **1, 5, 10, 15, 20**, and later successful milestones:

- Save using the actual adapter, close the process/browser, reopen and load. Reconstruct deferred player and game archives through their proper APIs. `JSON.stringify` followed by `JSON.parse` alone is not a persistence test.
- Compare the loaded semantic game state, controlled team, calendar, RNG state, stable IDs, rosters, commitments, portal, careers, records and complete archived history. Exclude only genuinely non-game metadata such as `savedAt`/revision tokens, with each exclusion documented. Do not omit fields to force equality.
- Run the same next few actions from the checkpoint in uninterrupted and fresh-process branches; compare game outcomes and RNG under the same mode/action policy. Also verify repeated read-only history/profile/briefing visits do not change saved state or gameplay RNG.
- Export a complete portable JSON save, import into a fresh slot/profile, and verify both history stores hydrate. Confirm old box scores, protected detailed games, alumni and career records remain reachable.
- Exercise all three slots: label, save, switch, reload, replacement. Check that archives do not leak between dynasties and stale tabs/revisions cannot overwrite newer saves.
- Inject failed writes or malformed/missing chunks only in disposable fixtures. Confirm no false success, prior valid save remains usable, and errors identify recovery options. Reuse existing failure-path tests rather than corrupting personal saves.
- Test the size boundary below using the real desktop save/export/import path. A save that serializes but cannot be reopened is a failure.

### 4. Concrete invariants and anomaly checks

| Area | Inspect and retain evidence |
| --- | --- |
| Progression | No repeated/skipped season, permanently blocked offseason, unresolvable career offer or duplicate transition effect. |
| Identity and rosters | Unique entity IDs in appropriate collections; no active player on two teams; roster/scholarship rules at the correct phase; usable QB/K/P depth; no impossible eligibility/class loops. |
| Recruiting and portal | Commitments/enrollment counted once, valid destination, coherent roster and scholarship consequences; departed/returning players archived or rostered correctly. |
| Games | Unique permanent game IDs; one application of a result; scores, records, player/team totals and archives reconcile under the engine's actual rules. |
| History | National titles use authoritative national championship history, distinct from conference titles; completed years count once; previous bowl results do not trigger new-year milestones. |
| Retention | Intended compaction preserves required records/box scores and protected games; distinguish deliberate compaction from loss. Follow sample players/coaches across transfers, graduation, draft, retirement and jobs. |
| Numbers | Non-finite or impossible values, unexplained negative counts, severe rating/prestige inflation or collapse, pathological injuries, unrealistic concentration and stalled recruiting. Derive hard limits from current code; statistical oddities need multiple seeds before a balance verdict. |
| Living world | Optional briefing has at most three items and never blocks advancement; followed identities survive reload/rollover and old-save rollback without invented moves. Same-seed worlds share device-local follows—use isolated profiles when comparing independent runs. |
| Performance | Per-year simulation cost, actual UTF-8 packed bytes, native files/backup/chunk growth, IndexedDB footprint, save/load/export latency and RSS/heap. Compare like-for-like states; archive growth is not automatically a leak. |

### 5. Browser and desktop spot checks

Use `tests/helpers/chromium-path.js`; set `CHROMIUM_PATH` if your browser is elsewhere. If Chromium must be installed, `npx playwright-core install chromium` installs it, then obtain its executable path with `node -p "require('playwright-core').chromium.executablePath()"` and set `CHROMIUM_PATH` to that result.

```sh
npm run test:browser-storage
npm run test:living-world-browser
npm run test:season-features-browser
npm run test:game-engine-v2-season-soak-browser
npm run test:game-engine-v2-postseason-browser
npm run test:desktop-storage
```

The existing season-soak browser test covers one regular season; it is not a 20-season browser proof. Add selected browser/native checks with real long-save fixtures. Inspect desktop and 390px-wide layouts after loading a long save: opening weeks, roster, recruiting, offseason, alumni/history, old game details and Legacy. Record console errors, freezes, duplicate rows, overflow, lost focus and misleading/missing history. Screenshots of a fresh dynasty do not validate long-save UI.

For native startup/save/restart coverage, follow `tests/desktop-smoke.js` and its disposable profile rather than opening the packaged app against normal application data. `npm run test:desktop-packaged` builds and runs that check on a supported desktop platform.

## Known long-save concern to verify first

`docs/SOAK_20_SEASONS.md` recorded approximately **206.6 MiB (seed 7)** and **205.4 MiB (seed 11)** at 20 seasons on an older version; player history was roughly 94 MiB and growing. Re-measure current source; those numbers are not current test results.

Current `desktop/storage.js` defines `MAX_JSON_BYTES = 256 * 1024 * 1024` and validates the serialized snapshot. This creates a plausible long-dynasty storage ceiling. Determine exactly which save/export/import operations hit it, at which year and size, whether chunking changes the outcome, whether previous saves survive rejection, and what the player sees. Do not equate raw-universe, packed portable, IndexedDB and native-disk sizes. Do not delete history or raise the cap as an unmeasured fix.

## Evidence, reports and stopping rules

Keep raw logs, synthetic checkpoints and screenshots under `.session-artifacts/soak/<run-id>/`; don't commit giant saves or logs. Retain milestone checkpoints and the last known good state before a failure, not every weekly 200 MiB snapshot. Preserve failed evidence while allowing unrelated seeds to finish. Avoid whole-save dumps in terminal output.

Produce:

1. `SOAK_REPORT.md`: exact revision/runtime, tested matrix, actual years reached, passes/failures, important limits and recommended next fixes.
2. `season-metrics.csv` (or JSONL): seed, program, mode, year, phase, elapsed time, memory, packed/native sizes, save/load times, archive counts, roster/recruit/portal/title metrics.
3. A bug table: severity, seed, checkpoint/year/week, exact action sequence/command, expected versus actual behavior, frequency, source locations, evidence files and smallest reproducer. Separate confirmed product defects, test-harness problems, performance ceilings, statistical concerns and unverified hypotheses.
4. Small regression tests for confirmed defects, failing on the unmodified candidate. Keep proposed fixes isolated and measured; retain the original reproducer. No assertion removal, hidden retry-until-green, larger timeouts or silent exception swallowing.
5. A concise continuation note with what remains untested and which artifacts are needed. Report interrupted/failed runs as such; never count requested seasons or a green process exit as verified progress without checking state.

Start with the baseline and two-season driver validation, then the two 20-season seeds and real restart checks. Extend only after those results are interpretable. No deployment is part of this assignment.
