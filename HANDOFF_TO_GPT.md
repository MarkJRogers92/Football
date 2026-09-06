# Handoff — Dynasty Lab v0.9.50

## Checkpoint

- Repository: `MarkJRogers92/Football`
- Working branch: `codex/v0950-continuation`
- Baseline: `1492070` (`claude/review-improvement-dwjemy`)
- Completed commits:
  - `de5a14f` — deterministic RNG implementation and characterization tests
  - `5e059e0` — saved gameplay RNG lifecycle and shared utility routing
- Release version remains **v0.9.49**. Nothing here is merged or published.
- Production `gh-pages`: `bdcf0d2`; rollback: `23e8aeb`.

## Completed

`rng.js` is a standalone UMD Mulberry32 stream with versioned snapshots,
reported-seed replay, helpers, and named substreams. It is included exactly once
in the generated standalone build before `app.js`.

New universes now establish the gameplay stream before generating high schools,
staff, rosters, and recruits, then store `{version, seed, state, draws}` on the
universe. The shared `rng`, `gi`, `pick`, and `gauss` utilities use that
stream. Save/export synchronizes the current snapshot; load and normalization
restore it. Legacy saves receive a stable zero-draw seed derived from existing
save identity before any migration defaults run.

The numeric seed stored in a save can recreate the stream from draw zero. IDs
remain on Web Crypto, portrait identity remains on its separate non-game path,
and recap text remains on its existing isolated hash stream. Direct
`Math.random` calls in gameplay domains have deliberately not been mass-edited.

The harness now loads `rng.js` explicitly and exposes only the two RNG adapter
hooks needed by integration tests. Its deterministic Web Crypto shim uses a
separate state from `Math.random`, preserving persistence tests that forbid
gameplay randomness during a save.

## Validation

- RNG unit + lifecycle integration: 10 PASS, 0 FAIL
- Focused control-mode/portrait/RNG set: 21 PASS, 0 FAIL
- Persistence save/load/lazy archive/export/import/offseason: PASS
- Headless eight-season smoke: 53 PASS, 0 FAIL
- Standalone build: PASS, 673 KB; `root.DynastyRng` occurs exactly once
- Version plumbing and `git diff --check`: PASS
- Claude's immediately preceding v0.9.49 browser run: 169/169 PASS

The full Node runner was not used because it is known to go quiet for long
periods and the user asked to conserve credits. A combined targeted runner was
stopped after its scheduling portion went silent; every emitted test except one
diagnosed harness-entropy interaction passed. That interaction was fixed, and
the previously failing persistence test then passed in isolation.

## Next precise task

Continue suggested commit 3 in separate domain commits. Route direct gameplay
`Math.random` calls through `gameplayRandom()` one domain at a time, starting
with schedule/rivalry, then recruiting/portal, offseason/coaching, and game sim.
Do not combine domains or change probability thresholds.

For each domain, add a fixed-seed save/resume test at a boundary inside that
domain. Do not route `uid()`, `portraitSeedFor()`, or recap hash selection.
Synchronizing the snapshot at save boundaries is already handled.

After all gameplay domains are routed, grep `Math.random` and classify every
remaining occurrence explicitly before beginning module extraction. Keep
`index.html` self-contained and rebuild it after every source change.

Do not merge, publish, deploy, or touch `gh-pages` without explicit approval.
