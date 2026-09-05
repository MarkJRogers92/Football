# v0.9.45 — Stabilization and source truth

## Goal

Make the repository, version labels, controls, and release path accurately
describe one source tree before changing simulation behavior.

## Confirmed problems

- Source and production are v0.9.44, while current README/continuation prose
  still describes v0.9.43 as live.
- Version-specific and one-off workflows remain in `.github/workflows`.
- Program switching and unrestricted Program Lab editing are exposed during a
  normal dynasty, bypassing career and program progression.
- The build is reproducible at the inspected baseline, but prior releases needed
  source/production reconciliation.
- Real iOS Safari remains unverified.

## Scope

### Source truth

- Make `VERSION.txt` the only authored version value.
- Keep placeholders in source markup neutral (`v—`) or replace them at build
  time; tests must reject an old concrete version in `body.html`.
- Rewrite the top of `README.md` and `CONTINUATION.md` to describe the actual
  current release without copying the entire historical log.
- Add a command that compares a locally built artifact with the source artifact
  expected for release.

### Release workflow

- Replace version-named workflows with one permanent validation workflow and one
  guarded publish workflow.
- Production publish must refuse:
  - a dirty source tree;
  - version disagreement;
  - a version already published from different source;
  - a build that differs from the validated artifact.
- Preview publication must remain separate from production promotion.

### Dynasty versus commissioner control

- Add `universe.mode`, defaulting legacy saves to `commissioner` only if an
  existing save has evidence of direct team switching; otherwise `dynasty`.
- In Dynasty Mode, hide the live team selector and direct rating editors.
- Career changes must occur through `acceptPost()`.
- Commissioner Mode exposes switching/editing with a persistent visual banner.
- Program renaming must continue to use stable team IDs internally. Do not add
  more name-keyed state in this packet.

## Likely files

`README.md`, `CONTINUATION.md`, `body.html`, `app.js`, `tools/build.js`,
`tools/publish.js`, `.github/workflows/*`, `tests/version.js`,
`tests/browser.js`, and a new focused commissioner-mode test.

## Suggested commits

1. Correct documentation and neutralize source version placeholders.
2. Add Dynasty/Commissioner mode and lock normal career control.
3. Add persistent generic CI/release workflows; remove obsolete one-offs.
4. Build generated output, run validation, and update release notes.

## Targeted verification

- Version test rejects mismatched source, package, standalone, or docs header.
- Dynasty Mode cannot change controlled team or directly edit institutional
  ratings.
- Commissioner Mode can switch teams and edit ratings after confirmation.
- A team rename leaves schedules, recruiting references, rivalry IDs, game
  history, coach stints and player histories resolvable.
- `npm run build` produces a clean diff after the committed build.
- Manual iPhone Safari checklist: new/load/save/import/export, recruiting table,
  portraits, Watch Mode, and one completed offseason.

## Exit criteria

One documented source head produces one validated standalone build; production
and source version agree; normal dynasty play cannot silently use commissioner
cheats; no version-specific workflow is needed for v0.9.46.

## Non-goals

No offseason reordering, schedule changes, new save slots, game tuning, or UI
redesign.

