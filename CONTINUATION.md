# Dynasty Lab — v0.9.22 production checkpoint

Repository: https://github.com/MarkJRogers92/Football

Source branch: `codex/v0922-consolidation-tuning`

Production branch: `gh-pages`

Production: v0.9.22 at https://markjrogers92.github.io/Football/

Preview target: https://markjrogers92.github.io/Football/preview/v0922/

## Release boundary

v0.9.22 is a consolidation/tuning release. It validates the v0.9.21 NIL,
administration and rivalry systems across 15 simulated dynasty-seasons; makes
recruit NIL allocation playable and closes a cross-school accounting bug;
finishes recruiting-screen hierarchy and scouting-confidence presentation;
and replaces the flat 14-tab shell with five primary areas plus a contextual
second level.

Program Pipeline was not started. v0.9.22 was promoted only after its preview
and complete validation checkpoint were reviewed.

## Tuning result

Run `npm run audit:stakes` to reproduce the fixed three-seed, five-season audit.
The completed run measured:

- league NIL budgets: 3–12, median 8;
- recruit-deal pitch lift: 6–9, mean 7.3;
- roster-deal transfer-risk relief: 6–26, mean 12.8;
- administration confidence: 13–100, with Hot seat, Final warning and Secure
  outcomes all exercised;
- rivalry meetings: exactly one per paired program per season.

No numeric formula was retuned. The distributions show that NIL changes close
races without buying a guaranteed signing, confidence reaches both punitive
and rewarding states, and rivalry results consistently move fan support. The
implementation fixes were usability/accounting gaps found by the audit, not a
new economy.

## Storage checkpoint

Read `STORAGE.md` before changing saves. No storage code or schema changed;
IndexedDB remains schema 3. Average measured growth per completed season was
2.59 MB browser core, 3.13 MB retired-player archive, 5.69 MB immutable game
archive and 11.41 MB complete portable JSON. Stakes state was below 0.005 MB
per season. These are serialized payload measurements, not browser-quota or
iPhone Safari results, and all historical records remain intact.

## Commercial-polish checkpoint

Both remaining partials in `docs/COMMERCIAL_POLISH_AUDIT.md` are complete:

- Recruiting opens on the national board; My Battles and Signing Class are
  local views. Every prospect row has a projected grade/range and a confidence
  meter derived without eagerly creating scouting state.
- The shell has Home, Team, Competition, Recruiting and Program as primary
  areas. The existing 14 destinations remain direct, testable second-level
  panels with their original IDs.

## Validation checkpoint

- Implementation-targeted checks passed during development: 14/14 NIL,
  administration and rivalry tests; 119/119 main browser checks; and 21/21
  recruiting visual/layout checks at desktop and iPhone widths.
- Final release gate passed: 53/53 engine smoke checks, 103/103 Node tests,
  and 154/154 desktop + iPhone-layout browser checks (119 + 14 + 21), with
  zero console errors and no mobile page overflow. The generated standalone is
  current and `npm run audit:stakes` completed once with the figures above.

## Resume prompt

Continue from the validated v0.9.22 source on
`codex/v0922-consolidation-tuning`. Production is v0.9.22. If the release is
stable, define Program Pipeline as a separate bounded milestone rather than
adding it retroactively to this release. Keep the existing measurement-first
storage guardrail and use the smallest deterministic calibration that can
answer the next release question.
