# Dynasty Lab v0.9.54 — History Lifecycle Continuation

Updated: September 6, 2026

Active upstream workstream: `codex/v0954-recruiting-performance`
Preserved continuation branch: `codex/v0954-history-lifecycle`
Production remains v0.9.52 and was not touched.

## Verified upstream state

The latest coherent active-branch validator is green:

- branch head at inspection: `2ddd02c44ad970c3c269a5bd038dfcd23114bd72`
- validator: `34049451316`
- result: success
- the v0.9.54 Evaluation Workload and Recruiting Board filter slices are therefore cleared on the synchronized active tree.

The newest canonical handoff is `docs/v0954-CONTINUATION.md`. Its next required bounded slice is a multi-season browser lifecycle for Recruiting Class History.

## Preserved implementation

Commit:

`e992ee54aa1cc04d4e40b145e2a098e000e8068f`

Branch:

`codex/v0954-history-lifecycle`

Diff versus `codex/v0954-recruiting-performance`:

- adds `tests/recruiting-history-browser.js`
- adds that test to `npm run test:browser`
- no gameplay source change
- no standalone-artifact source change
- no production/release change

The browser scenario:

1. starts a fresh dynasty;
2. selects a real signable recruit for the controlled school;
3. creates a real recruiting evaluation and commitment;
4. verifies the scouting receipt freezes at commitment;
5. runs review/departures/signing/portal enrollment;
6. verifies the signee exists on the roster with the frozen receipt;
7. advances a first offseason rollover;
8. adds observed games/starts/confidence;
9. archives that observed season;
10. advances a second rollover;
11. opens Recruiting Class History;
12. verifies the signed class and player are visible with a mature Diamond/Hit/Bust/Miss/As Scouted result.

The test intentionally avoids adding another scouting mechanic or touching hidden-truth ranking logic.

## Validation status

- JavaScript syntax check for the new browser test: passed with `node --check`.
- Full browser execution is still required.
- A local clone could not be run because this runtime has no direct GitHub DNS/network access.
- The GitHub connector blocked direct update of the existing active branch ref and also blocked PR creation, so the prepared commit was preserved on the isolated continuation branch instead of being lost.

These are connector/runtime limitations, not gameplay or test failures.

## Exact next step

1. Inspect live GitHub first in case another run has moved the active branch.
2. If `codex/v0954-recruiting-performance` still descends from `2ddd02c...`, integrate commit `e992ee54aa1cc04d4e40b145e2a098e000e8068f` by fast-forward/cherry-pick.
3. Run `node tests/recruiting-history-browser.js` with Chromium.
4. Run the coherent full validator.
5. If the lifecycle is green, mark Recruiting Class History multi-season/browser verification complete.
6. Then decide whether the optional final board-usability preset/search polish is worth doing.
7. Before release-candidate preparation, remove `.github/workflows/sync-v0954-build.yml`, align v0.9.54 version/release notes, rebuild once with normal tooling, and run one final coherent validator.
8. Do not publish production without explicit authorization.
