# Dynasty Lab implementation packets

Baseline inspected: `dc3c76c` (`0.9.44`). These packets are planning artifacts;
they do not authorize publishing, merging, or changing production.

## Execution rules

1. Fetch first and confirm the intended parent commit. Never resume from
   `gh-pages`; it is deployment output.
2. One packet per branch. If the default branch moves, reconcile before coding.
3. Keep commits functional and independently testable. Generated `index.html`
   belongs only in the final build commit for a packet.
4. Run the smallest named tests after each commit, then the full Node/browser
   matrix only at the release candidate.
5. Do not create one-off release workflows. Use the permanent release path after
   the stabilization packet establishes it.
6. Do not publish or push without explicit approval.
7. Update `CHANGELOG.md`, `CONTINUATION.md`, `README.md`, `VERSION.txt`,
   `package.json`, and `APP_VERSION` together only when the packet is complete.

## Dependency order

| Order | Packet | Depends on | Primary outcome |
| --- | --- | --- | --- |
| 1 | `01-v0945-stabilization.md` | v0.9.44 | Trustworthy source/release baseline |
| 2 | `02-v0946-offseason-calendar.md` | 01 | Correct, resumable offseason phases |
| 3 | `03-v0947-transfer-portal.md` | 02 | User-controlled portal recruiting |
| 4 | `04-v0948-scheduling-rivalries.md` | 01 | Rotating schedules and protected rivals |
| 5 | `05-v0949-saves-storage.md` | 02 | Multiple slots, autosaves, bounded growth |
| 6 | `06-v0950-modularization-rng.md` | 01-05 | Safer modules and reproducible simulation |
| 7 | `07-v010-game-engine-2.md` | 06 | Clock/field-aware interactive games |
| 8 | `08-v011-program-economy.md` | 02, 06 | Real program-building decisions |
| 9 | `09-v012-encyclopedia.md` | 04-06 | Searchable living-universe history |

Packets 02 and 04 may be developed independently after 01, but should not be
published under the same version. Packet 03 must not start until packet 02's
offseason state machine is stable. Packet 07 should not be attempted in the
current monolithic engine.

## Definition of ready

Each packet below fixes its user-visible goal, names state and migration policy,
identifies source/test files, provides a commit sequence, and states exit
criteria. Unknown tuning constants are deliberately assigned to calibration
runs rather than invented in the specification.

## Credit-efficient operating pattern

- Read this index and only the active packet.
- Inspect only files named in that packet plus code reached by those functions.
- Use targeted tests during implementation.
- Run `npm run build` only after source and targeted tests are green.
- Run the full suite, browser suite, storage suite, audit, and bounded soak once
  at the release-candidate checkpoint.
- Stop and report if the parent branch changes, a migration invariant fails, or
  the work crosses into a later packet.

