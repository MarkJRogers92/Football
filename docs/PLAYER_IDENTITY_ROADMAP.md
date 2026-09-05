# Player identity, ratings and production roadmap

Branch: `codex/player-identity-batches`
Base: validated v0.9.39 source `ba26de1` (production remains v0.9.39).
User authorization: cover all positions, ratings and descriptions; work and push
in small, independently reviewable batches so Claude or another chat can resume.
Budget: focused deterministic checks first; no long season calibration per batch.

## Contract

Scheme, role depth, availability and game situation determine opportunity.
Attributes determine ability and efficiency; archetypes express tendencies supported
by those attributes. A label must never promise behavior the engine cannot model.
Use the same identity/usage helpers in quick and detailed simulation. Detailed
statistics must come from recorded plays, with the named participants receiving
the credited production. Preserve existing saves and immutable historical stats.
Scouted descriptions must respect uncertainty instead of exposing hidden ability.

## Batches and acceptance criteria

0. Roadmap and durable handoff — complete in the first documentation commit.
1. QB rushing allocation — implemented. Read the actual QB style
   and mobility, with scheme affecting usage. Test all seven schemes, equal-rating
   style comparisons, mobility changes and team/player total conservation. This
   fixes allocation only; designed runs and scrambles in Watch remain batch 4.
2. Identity definitions and generation — implemented for new players and recruits.
   A central table covers EVERY existing style and position with three intended
   rating emphases and supported usage prose. Generation assigns a correlated but
   varied style from the actual traits. Existing saves are neither relabeled nor
   rerolled; their identities and history remain intact.
3. Offensive opportunities and efficiency — initial quick-sim allocation implemented
   for RB, WR, TE and OL; fuller QB
   behavior. Review stacked SLOT/3DRB/MOVETE usage and caps; receiving attributes
   must support target/catch efficiency. Add passing depth, catch/YAC and run-type
   tendencies where modeled. Separate QB accuracy/decisions/mobility from generic
   overall; map OL movement, power and protection to relevant outcomes. Test
   healthy backups, overlapping roles, injuries, redshirts and limited players.
4. Actual play attribution — structured plays with passer, runner, target,
   defender where actually modeled, yards, result and scoring type. Add designed
   QB runs and pressure-driven scrambles using shared identity logic. Generate
   Watch text and box scores from those plays; remove post-game redistribution
   for detailed games. Fix random TD-type reassignment at the goal line. Verify
   named players, plays, drives, TDs and box totals agree, including sacks/turnovers.
5. Defense — initial quick-sim allocation implemented. EDGE/DT: rush vs run responsibilities, pressure and sack efficiency;
   LB: box, pursuit, coverage and blitz; CB/S: coverage roles, targets allowed,
   breakups and interceptions only if those events are tracked. Use opportunity
   denominators; do not invent individual tackles/coverage facts from narration.
   Keep untracked fields explicitly unavailable in profiles and historical saves.
6. Specialists — implemented for tracked outcomes. K technique/power/composure
   drive accuracy, range and pressure attempts; P power/technique drive distance.
   Hang time, direction and returns remain explicitly untracked rather than being
   presented as decorative effects.
7. UI, progression and downstream consumers — audit player/recruit cards,
   scouting prose/confidence, role fit, auto depth, scheme fit, position changes,
   training, awards, records, draft evaluation, recaps and career production.
   QB awards must recognize rushing; RB evaluation must recognize receiving.
   Ensure stronger displayed ratings imply the described ability, while retaining
   meaningful scouting error. Explain scheme fit separately from overall ability.
8. Release validation — paired seeded isolated games for each position/style,
   holding teammates/opponents constant; test direction and plausible ranges,
   not exact random outputs. Start with 50–100 games per relevant comparison and
   increase only when uncertainty warrants it. Validate quick/detailed distributions,
   save/load and export/import with old and new records. Measure added save size
   before retaining extra play data. One full standard validation and preview
   at release readiness; production promotion requires user approval.

## Known evidence in v0.9.39

- `generatePlayer` chooses style independently of attributes; recruit style is
  also random. QB style gets a scheme-fit bonus; RB style does not direct usage.
- `applyGameStats` checks the SCHEME's preferred QB styles for rushing allocation,
  not the player's style. Its intended Option Motion .18 fallback is unreachable.
- Receiver role weights stack: SLOT .18 + 3DRB .08 + MOVETE .05 can make an RB
  the leading receiver regardless of his style. This is a mechanism, not proof
  of the user's exact save; that save was not inspected.
- Quick sim builds team totals, then allocates individual production. Detailed
  sim narrates one RB/WR but redistributes the box afterward. Detailed TD type is
  chosen using a new random draw instead of the actual scoring play.
- Ratings already affect role selection, unit strength and some efficiency;
  this is a partial connection, not an absence of rating effects.

## Handoff protocol

Before editing, fetch origin, inspect branch/worktree and read CONTINUATION.md,
this document, WORKLOG.md and relevant tests. Finish one batch and its focused
checks, update progress/limitations here and in CONTINUATION, commit and push.
Keep the branch name stable. Source pushes are checkpoints, not published builds.
Do not merge or overwrite Claude's concurrent changes. Check gh-pages version
occupancy before assigning a release number. Never rewrite historical saves to
make old stats fit a new identity model.
