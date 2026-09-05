# v0.9.50 — Incremental Modules and Reproducible RNG

## Goal

Reduce the risk of further feature work without rewriting the game or changing
validated outcomes unnecessarily.

## Module boundaries

Extract in dependency order:

1. constants and pure utilities;
2. schedule and rivalry logic;
3. recruiting and portal logic;
4. coaching/career logic;
5. offseason phase orchestration;
6. game simulation;
7. renderers and DOM actions.

Continue producing a standalone `index.html`. Browser modules are source
organization, not a runtime network dependency. Avoid framework adoption.

## RNG design

Add a saved RNG object with universe seed, state and draw counter. Route gameplay
randomness through it. Keep non-game IDs on Web Crypto and keep deterministic
recap text on its existing isolated hash stream.

Provide named substreams only where order isolation matters, for example schedule
generation versus portrait identity. Do not over-engineer a stream per function.

## Refactor safety

- Capture distribution baselines before extraction.
- For a fixed seed, old and extracted functions should produce identical results
  where practical.
- DOM renderers receive data and should not mutate simulation state.
- Preserve public hooks used by the test harness until replacements exist.
- Move one domain per commit; never combine extraction with tuning.

## Build and tests

Update `tools/build.js` with an explicit ordered source manifest. Add a check that
every source module is included once. Extend the harness to expose modules through
one test adapter rather than rewriting source text anchors indefinitely.

## Suggested commits

1. Add RNG implementation and characterization tests without switching callers.
2. Route utilities and low-risk generators through saved RNG.
3. Route schedule/recruiting/offseason/game randomness in separate commits.
4. Extract pure engine modules one domain at a time.
5. Extract render/bind code and replace brittle harness injection.
6. Compare seeded audits and build output; document intentional differences.

## Exit criteria

A saved universe resumes the same random stream; a reported seed reproduces a
failure; engine tests no longer depend on global `Math.random`; `app.js` is an
orchestrator rather than the home of every system; the standalone build remains
self-contained.

## Non-goals

No TypeScript conversion, React migration, new bundler, state-management library
or wholesale rewrite.

