# v0.9.53 Recruiting and Development Polish — Implementation Status

Updated: September 6, 2026

Branch: `codex/v0953-recruiting-development-polish`

Source baseline: `83815856c04cf6b00442e47958b25c79eb6848c9` (`codex/v0952-program-goals-polish`)

Production baseline: v0.9.52. Production publishing is not authorized by this workstream.

## Scope and working rules

Implementation follows the September 6 recruiting/development polish handoff. Work is divided into bounded commits that can be resumed by another model. Existing simulation mechanics and save keys are preserved unless a later milestone explicitly requires additive state.

Scouting features must preserve uncertainty. Player-facing recommendations may use current scouting ranges, confidence, visible recruiting context and staff evaluation, but must not expose or rank directly from hidden `trueNow`, hidden upside, hidden development profile or hidden trait values.

## Completed checkpoint: Milestone A — Archetype foundation

- Added player-facing metadata for all 69 canonical archetypes.
- Added 10 clearer display-only labels while retaining every internal `p.style` key.
- Added helper functions for labels, descriptions, strengths, and interactive chips.
- Added an Archetype Guide dialog with strengths and the existing simulation-role explanation.
- Wired the guide into roster and scouting presentation.
- Added focused regression coverage proving complete metadata, canonical-key preservation, and zero RNG consumption.

Focused validation at checkpoint: `node --test tests/archetypes.js tests/scouting.js` — 6/6 passing.

## Completed checkpoint: Milestone B — Development report capture

- Added compact before/after snapshots for development-relevant fields.
- Spring and Fall reports retain exact overall, perceived-rating, upside-read, seven-trait, body, familiarity, scouting-confidence, health, and wear deltas.
- Reports retain player and team training focuses.
- Spring development joins Fall camp in compact per-player camp history.
- Added team and position-group summary helpers.

Focused validation at checkpoint: `npm run test:development` — 9/9 passing.

## Completed checkpoint: Milestone C — Development Results Center

- Added Spring/Fall results switcher.
- Added team-growth KPIs, movement distribution, position-group summaries and observed training-focus outcomes.
- Added filters/sorting for position, improvement, regression and physical changes.
- Added compact results table and detailed player before/after panel.
- Added responsive layouts and focused HTML/result-data regression coverage.

Focused validation at checkpoint: `npm run test:development` — 10/10 passing. Standalone build completed successfully.

## Completed checkpoint: Milestone D — Global Next Action navigator

Commit: `6102d638a824ade90d138fa21f3198209f714980`

- Reuses the existing Weekly Command Center advance control as a navigator rather than an automatic action executor.
- Unresolved Coach's Desk decisions outrank ordinary checklist navigation.
- Otherwise opens the first unfinished item already produced by `weeklyPlan()`.
- Does not auto-sim games, bowls, playoffs, camps or offseason phases, so it cannot silently skip a gate.
- Added pure regression coverage for decision priority, unfinished-item ordering and all-clear state.

## Completed checkpoint: Milestone E — Bounded manual recruit scouting

Commit: `1fea3ac82b8fc91f78d17ad5adcfe47b98f13a18`

- Added weekly Evaluation Hours derived from recruiting/evaluation staff quality and bounded to 8–14 hours.
- Quick Film costs 1 hour; Full Evaluation costs 3 hours.
- Hours reset with the week and do not roll over.
- Manual evaluation tightens the existing domain ranges/confidence through the existing scouting engine; it never reveals true ratings.
- Added scouting receipts and profile/board controls.
- Prevents manual scouting of prospects committed elsewhere.
- Additive state is stored on ordinary team/recruit records and therefore follows the existing save/export path.

Focused pure-module checks passed before push for cost, weekly reset, confidence/range movement and commitment blocking.

## Completed checkpoint: Milestone F — Fallible Staff Verdict

Commit: `f2135443113a3bb0d8851b4a3edf35a545b302f9`

- Added staff labels from Pass through Priority Take.
- Verdicts summarize current scouting-domain ranges, report confidence, evaluation staff quality and a deterministic staff-specific bias.
- Added conviction levels that strengthen as evaluation improves.
- Shows best current reads and the largest unresolved area.
- Explicitly labels the verdict as staff opinion rather than hidden truth.
- Added an anti-cheat regression: changing hidden true rating/upside while holding the scouting report fixed must leave the verdict unchanged.

## Completed checkpoint: Milestone G — Recruit Compare

Commit: `c195819438f58761d0bcf996fb24d095aa775847`

- Added a three-prospect compare tray.
- Compare cards use current staff verdict, evaluation stage, confidence, strengths/risk, interest, geography, visible rank/stars and priority.
- Added anti-cheat coverage proving compare output does not change when hidden true talent changes under a fixed scouting report.

## Completed checkpoint: Milestone H — Roster Outlook & Staff Shortlist

Commit: `5667c87c53a4651a48dc0acde8dce45a3144fb61`

- Added projected position needs using returning eligibility, current commitments and positional roster targets.
- Added an eight-player staff shortlist above the full recruiting table.
- Recommendations prioritize actual roster holes, then current staff evaluation, interest, pipeline and distance.
- Hidden true talent and hidden scheme-trait values are excluded from shortlist scoring.
- Shortlist cards can add/remove a prospect from the board and use the same bounded scouting actions.
- Added pure regression coverage for roster-need arithmetic, need-vs-grade ranking, commitment exclusion and hidden-rating independence.

## Standalone build handling during this workstream

The repository's validator requires committed `index.html` to exactly match `npm run build`. Because this session cannot clone GitHub through the shell, a temporary branch-only workflow `.github/workflows/sync-v0953-build.yml` was added to build and commit the generated standalone artifact after source pushes. It is guarded against bot recursion.

Latest synced standalone checkpoint before this status update: `44cd96bca0c826c3f376ae0c8eed1818b72a2965`.

**Remove the temporary build-sync workflow before merge/release.** It is development plumbing, not a production feature.

## Validation status

- Source pushes before the build-sync bot commit fail the normal validator only at `git diff --exit-code -- index.html`, as expected.
- The build step itself has succeeded on those runs.
- This documentation checkpoint is intentionally being pushed after the standalone artifact is current so the normal full validator can exercise verify-release, engine tests, browser tests, browser storage and simulation audit on the coherent package.
- Do not publish v0.9.53 until that full validation is green or any real failures are diagnosed and fixed.

## Next bounded slices

1. Diagnose and fix any full-validator failures on the coherent package.
2. Build delayed scouting receipts: preserve what the staff believed at signing and later compare it with only information the program could legitimately know after enrollment/development/production.
3. Add recruiting-cycle recap surfaces for hits, misses, high-confidence wins and costly misreads without revealing future hidden ceilings prematurely.
4. Consider progressive development-tendency reveal for enrolled players after the scouting-receipt foundation is stable.
5. Remove the temporary build-sync workflow, run final full validation, then prepare release notes. Production remains v0.9.52 until separately authorized.
