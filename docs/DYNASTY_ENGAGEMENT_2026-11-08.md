# Dynasty Lab engagement handoff implementation — November 8, 2026

Local, unreleased work on `codex/dynasty-lab-correctness-current-20261108`. This stage starts at `9b8728dc1b967ef4e21c5806d8ffd7ef4f2b58be`, preserving the verified D1–D4 repairs and Claude's completed PR #43 (`6e226c2`). The version remains 0.15.2. Nothing is pushed, merged, published or installed into a user's app.

## What the player sees

- A factual homegrown first college start becomes a permanent entry in the existing player profile and school milestone history, with links to the real game. It uses the recorded first-start callback and an actual start in the game's player line. A depth-chart promotion alone creates no milestone. The existing callback features one eligible signee, prioritizing the recruitment the desk invested in; there is no new following system or invented biography.
- The opening briefing introduces two real, currently selected role players with profile links. It stays within the three-item limit and retains required work and staff receipts. After the first game, the existing recorded final, consequence and next-opponent flow takes over.
- The default optional tour has three stops: the weekly briefing/agenda, preparation, and the first-Saturday result/next action. The original seven-stop tour is still available through “Explore all desks.” Prior completion/dismissal state is respected. The tour opens any collapsed section containing the content it introduces. Neither tour blocks progress.
- Staff Assignments has a saved medical instruction for delegated worn-starter decisions: limit their role (the existing default) or rest them. A coach's manually resolved decision takes precedence. New promises, personnel moves and other sensitive authority are not added to this setting.
- “Coach big moments” uses the existing Game Day decision boundaries and automatically advances between choices. It pauses for the controlled program's actual fourth-down, halftime, conversion and late-clock decisions. Normal play-by-play navigation remains available. Mode and explicit actions survive a paused-game save; saves with no mode retain manual navigation.
- Preparation buttons expose pressed state and their shared point-budget explanation to assistive technology. Existing visible tradeoff descriptions remain available before choosing. The yearbook traps Tab/Shift-Tab inside the modal and restores the opener after Close or Escape, with a current-opener fallback if a render replaced it.

The Midnight & Brass styles and the existing football engine, replay, archives, preparation effects and result presentation are reused.

## Correctness and safety

First-start milestones use a stable player story ID and the existing incremental story index. Re-reading or skipping weeks cannot create duplicates. A failed game transaction removes the new entry along with the failed game; retry records it once. The event remains through career-history compaction and packed/browser-store restoration. There is no speculative backfill of pre-upgrade milestones or transfer debuts.

Big-moments mode adds presentation metadata to the existing version-1 live-game save. It records the same explicit `decision`/`choice` actions the manual controls already use. Rebuilding a paused game replays those actions without auto-inserting additional decisions. A focused test compares the exact full game-session snapshots for equal seeds and equal choices before and after restoration; legacy saves are tested separately. The engine's RNG, probabilities and decision policies are unchanged.

The staff instruction is an additive team field. Old saves default to Limited role. Invalid values cannot create an unsupported choice. Saves, historical events, actual game records, imported originals and Claude's completed work are preserved. No real user save is opened or migrated by these changes.

## Validation

Tests were written against the missing behavior first: permanent first-start discovery and rollback; two-player first briefing and three-stop/full-tour split; yearbook focus containment/restoration; preparation accessibility; a saved medical instruction and manual precedence; and big-moments save/replay equivalence. Existing regression suites cover the unchanged game engine and history behavior. Final verification: **842/842 registered Node tests, 53/53 smoke checks and 8/8 selected Chromium suites pass** at code `e83a98cc2cf5d8a5a4c4eec0eed02ff4338f0eaa`; build/source verification also passes. Source identity, commands and whole-suite counts are recorded in `VALIDATION_DYNASTY_ENGAGEMENT_2026-11-08.txt`. The final registered Node sequence runs under the native Node runtime in four file batches with concurrency four, preserving the same registered test files. A command-runner attempt that disappeared without a summary is kept as diagnostic evidence and excluded from pass totals.

The initial command-runner Chromium launch failed before page execution with `socket() failed: Operation not permitted` (SIGABRT). Investigation isolated denied Unix-domain socket creation in that runner. The native desktop terminal can create those sockets and launch `/usr/lib/chromium/chromium`; its default PATH lacks Node, so the existing workspace Node binary was used. Browser policy also disallows local file URLs. A preview server bound to `127.0.0.1:18767` supplies the identical local candidate over HTTP. No browser policy was disabled, no remote site was published and no new chat was needed.

The affected browser fixtures accept `DYNASTY_BROWSER_BASE_URL` through a small tested URL helper, with ordinary file URLs retained as the default for other developer environments. A temporary local preview server answers the optional favicon request with HTTP 204, preserving strict console-error assertions. For the correctness fixture, the optional briefing is explicitly opened and its displayed staff receipt must match the latest real recorded action; the medical effect and its own factual receipt are asserted separately.

The eight selected Chromium suites cover the compact receipt, manual personnel choice, first-season flow and preparation, short/full tours, staff assignments, player/class desks, game archives, weekly personnel, yearbook keyboard focus, IndexedDB storage, and the new engagement flow. The new engagement suite changes the medical instruction through the real control and verifies browser Save/Load, then starts big-moments coaching, chooses an option, verifies automatic advance, saves, reloads the page, checks the exact reconstructed session and action log, and records the final. Tests use disposable browser profiles and synthetic dynasties only. They do not open real user saves.

A visible Chromium preview was also opened through the browser service. Live inspection revealed that the short tour's briefing was initially collapsed. A new browser assertion reproduced the failure before the tour was changed to reveal its target; the desktop and phone checks pass after the fix. An independent read-only review found no further substantive issues.

Native-package builds, physical devices, other browser engines and the complete repository browser matrix remain untested in this stage. Selected browser passes and final Node counts are recorded separately; they are not a claim that every browser suite or desktop installer was exercised.

## Deliberate limits and rollback

This implements the feasible engagement work in the handoff using existing architecture. Transfer/rivalry reunions and additional career milestones remain later extensions after their underlying evidence is dependable. Broader staff policies beyond the conservative medical instruction would need explicit semantics; the existing recruiting and situational-playbook instructions continue to apply.

The new data fields and event type are additive. Returning to the prior candidate requires no save rewrite; an older build will ignore the new navigation mode and cannot display the new first-start story type. Normal saved action replay remains in the existing format. Keep a backup before any eventual real-save release trial. Deployment and integration remain separate decisions.
