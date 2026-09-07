# v0.10.6 Roster & Depth Experience — Checkpoint

## Branch

`codex/v0106-roster-depth-experience`

Synchronized focused-checkpoint head: `b867ae9f0237620a1007b3bbd99254be5d90e774` (`build: checkpoint v0.10.6 roster depth experience`).

## Milestone

Premium Presentation **Milestone D — Roster & Depth Chart Experience**.

Goal: make roster and personnel management feel like football without replacing the existing sortable roster, canonical role-depth state, availability rules, or assignment mechanics.

## Implemented

- Added a read-only roster/depth presentation adapter (`roster-depth-presentation-adapter.js`).
- Added a visual **Roster Room** grouped by football position above the existing dense roster table.
- Added offense and defense **formation boards** built from the real canonical `ROLE_DEFS` and current `roleDepth` state.
- Formation cards surface staff-visible player reads, role fit, availability and active-player status.
- Visual assignment selectors delegate changes to the existing `#depthGrid select[data-role]` controls; the presentation layer owns no duplicate depth-chart state.
- Existing roster table, role cards, Auto-Set Role Fits, scheme/package summaries, redshirt handling, injury/academic availability and player-profile links remain canonical.
- Desktop and mobile presentation are both supported without page-level horizontal overflow.

## Guardrails

The presentation uses staff-visible perceived/scouting information and existing canonical role-fit/depth helpers only.

It does **not** expose hidden true ratings, true potential, growth curves, volatility or private simulation state. It does not create a second personnel/depth mechanic.

No roster balance, role-fit calculation, availability rule, save schema, persistence behavior, weekly-coaching logic or simulation behavior was changed.

## Focused validation — GREEN

Workflow: `V0.10.6 Roster Depth Experience Checkpoint`, run `34127959196`.

- source syntax checks: pass;
- standalone build: pass;
- presentation-model regression: **3/3 passed**;
- hidden-player-truth independence: pass;
- desktop 1280×900 browser presentation: **12/12 passed**;
- iPhone 390×844 browser presentation: **12/12 passed**;
- visual assignment round-trip through canonical role control: pass on both viewports;
- page-level horizontal overflow: **0px** on both viewports;
- console errors: **0** on both viewports;
- regenerated `index.html`: synchronized;
- clean reproducible release source / `verify:release`: pass.

Total focused presentation browser result: **24 passed, 0 failed**.

## Milestone boundary

This documentation commit intentionally carries `[full-ci]` to request the policy-required milestone-boundary full validation. The focused checkpoint is already green and the next presentation milestone may proceed on an isolated branch while that longer validation runs.

## Continuation

Next: **Milestone E — Staff Organization & Hierarchy**.

Use the existing five canonical staff slots (`HC`, `OC`, `DC`, `RC`, `SC`) and current coach fields/career/market/scheme systems. Add organization and responsibility presentation only; do not invent unsupported position-coach staff or new coaching mechanics merely to fill the org chart.
