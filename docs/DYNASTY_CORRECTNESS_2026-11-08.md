# Dynasty Lab correctness repairs — November 8, 2026

This is a local implementation report, not a publication or deployment record.

Follow-up: the engagement stage in [DYNASTY_ENGAGEMENT_2026-11-08.md](DYNASTY_ENGAGEMENT_2026-11-08.md) resolved the Chromium launch limitation described below and exercised the correctness browser fixture. It also implements the feasible engagement extensions listed at the end of this historical report. Final stage-specific results are recorded with that delivery.

## Source and concurrent work

The handoff's pinned default was `ad84ec444b4b06ddaa30538b6b9d61ce46bc4e45`, package 0.15.2. Work began in the new isolated `dynasty-lab-implementation-20261108` checkout on `codex/dynasty-lab-correctness-20261108`. No existing checkout or saved game was changed.

Claude's concurrent PR #43 changed the play model, facilities/boosters and desktop save staging. It merged during this work at `6e226c2260b5106c4113218e98c65b813ecd9434`. The delivery worktree, `dynasty-lab-current-20261108`, starts from that merge on `codex/dynasty-lab-correctness-current-20261108`. The repairs were applied as local commits. `app.js` applied without conflicts; the `package.json` test command required retaining Claude's full updated list and adding the two new regression files. Claude's source, dependencies, new engine rules and facilities work are retained. No remote branch was written, no merge was made and nothing was deployed or installed into a user's app.

## Repairs and evidence

### D1: actual staff decisions

Delegation now selects actual options and uses the same effect path as manual choices, including the starter-challenge extension. Each successful decision records its option, selector and head-coach identity, with one ordinary event. Interactive choices own their save/render boundary; a season batch uses the existing week checkpoint. No new promises are made automatically; position changes defer, while actual recommended medical, academic and redshirt options execute. Missing targets, unknown decisions or absent staff authority stop season advancement without marking success. Expired optional gameplans for a game already completed are ignored using the existing live-decision rule. Unknown imported decision names, including inherited JavaScript property names, are rejected safely.

Seed 1402 is cloned before the choice. Manual Limited role and delegated Limited role produce identical availability, replacement starter, actual game results and player statistics. Reload/repeat does not apply effects again; next-week availability expires. Additional tests cover academics, redshirts, missing targets, invalid options, absent authority, conservative promise handling, personnel promotions, an ordinary season through `confReady`, optional prep after a detailed game, and historical `delegate` events.

The existing optional opening briefing reads the real event receipt and remains capped at three items. There are no added acknowledgments. Historical synthetic `delegate` choices stay readable and are not replayed.

### D2: learned territory pairs

Suggestions compare original and final coach/territory pairs. An unchanged pair retains `regionSince`; a genuine move or removal follows the existing learning rule. The regression failed before the repair when repeated suggestions changed week 0 to week 2 and lost the +2 bonus. It now passes through repeated suggestions, save restoration, swaps and removal/reassignment.

### D3: factual school records

Records sum recorded school/year season lines for active, portal and archived players. Current production is included only when that school/year is not already archived. Comparisons include other active players and exclude the player's own total. Tests pin a transfer's exact 3,500 yards at the former school and 500 at the new school, current-season archival, retirement, reload, two active challengers and ties. A tie is described as tied. Unattributed career totals or deferred archives suppress school-leadership claims and show only known school production. The adapter does not alter saved history.

### D4: explicit redshirt season

The adapter carries `redshirtSeason` and the story matches that recorded year. An earlier injury/bench season cannot substitute. Wording names the recorded year without inventing why the player sat. When no year can be established, no redshirt-payoff claim is emitted.

## Review and test changes

An independent read-only review found the completed-game optional-prep stall described above. It was reproduced as a failing regression before the repair and passes afterward. No further blocking D2–D4 findings were reported.

The original whole-suite run found a portal test failure: active targeting signed 1 while passive signed 2. A saved-state counterfactual reproduced it. Adding a previously absent finalist changes subsequent random draw consumption, so equal initial seeds did not isolate attention. The test now starts from one saved real portal and targets players already considering the user, keeping league state, finalists and RNG equal. It still asserts actual signings improve (3 versus 2 in seed 4722); no portal production code was changed.

## Validation status

Final counts and commands are recorded in VALIDATION_DYNASTY_CORRECTNESS_2026-11-08.txt beside this report. The initial pinned-base run had 53/53 smoke checks and 796/797 Node tests passing; its one failure is the portal comparison documented above. The current-source focused run before the two extra review regressions passed 64/64, and the final delegation group passes 8/8.

Browser test `node tests/correctness-browser.js` uses only a temporary fixture page and disposable browser profile. The first launch was blocked before page execution by Chromium's `socket() failed: Operation not permitted` runtime restriction. Browser rendering, actual disk-backed browser reload, native packaging, physical devices, the deployed website and installed desktop builds are therefore not claimed as tested. In-memory packed-save restoration and normalization are covered automatically. The temporary fixture is removed on failure.

## Data safety and remaining work

There is no save-schema version bump, destructive migration or real-save rewrite. New actor fields are additive. Legacy events and saves are retained. Returning to the previous code does not require rewriting saved production/history, but old builds retain the defects. Back up a real save before any eventual release trial; no real saves were opened during this implementation.

This delivery covers the handoff's initial D1–D4 correctness stage and its briefing receipt. Longer-term first-start timeline expansion, onboarding compression, standing staff instructions, big-moment coaching and other engagement proposals remain separate future work. Release, deployment and physical-device validation remain separate decisions.
