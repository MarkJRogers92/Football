# v0.10.7 Staff Organization & Hierarchy — Checkpoint

## Branch

`codex/v0107-staff-organization`

Synchronized focused-checkpoint head: `c38df989caf37666ab59fd7ef6ceb442d54792c6` (`build: checkpoint v0.10.7 staff organization`).

## Milestone

Premium Presentation **Milestone E — Staff Organization & Hierarchy**.

Goal: make the coaching staff read like an actual football operation without inventing staff jobs, reporting mechanics, bonuses, or coaching systems that Dynasty Lab does not model.

## Implemented

- Added read-only staff presentation adapter: `staff-organization-adapter.js`.
- Added a **Football Operations** hierarchy above the existing staff surfaces.
- Uses exactly the five canonical Dynasty Lab staff jobs:
  - Head Coach (`HC`)
  - Offensive Coordinator (`OC`)
  - Defensive Coordinator (`DC`)
  - Recruiting Coordinator (`RC`)
  - Strength & Performance (`SC`)
- Head Coach is presented as program leadership with the four real functional departments underneath.
- Staff cards surface only existing supported information:
  - contract and salary;
  - play-calling authority;
  - recruiting, development, evaluation, play calling and adaptability ratings;
  - existing specialties and career-trait read;
  - current scheme identity / coordinator system;
  - interim status.
- Added staff payroll/budget and continuity summaries derived from the existing staff-budget/spend and tenure data.
- Coach names in the visual hierarchy open the existing canonical coach profile.
- Existing canonical staff cards, scheme identity, coaching market, coaching tree, scheme-fit leaders and former-coach history remain available below the new organization view.
- Responsive 4 → 2 → 1 department layout for desktop/tablet/mobile.

## Guardrails

The presentation is read-only.

It does **not** add position coaches, new staff slots, reporting bonuses, hidden coaching ratings, new career logic, hiring logic, recruiting/development modifiers, save fields or simulation behavior.

The hierarchy intentionally describes responsibility rather than creating new responsibility mechanics.

## Focused validation — GREEN

Workflow: `V0.10.7 Staff Organization Checkpoint`, successful run `34128799815`.

Model regression:
- **4/4 passed**
- canonical five-slot organization verified;
- specialty/strength presentation verified against existing ratings;
- salary/tenure summary verified;
- unmodeled hidden coach fields cannot affect presentation output.

Browser regression:
- desktop 1280×900: **13/13 passed**;
- iPhone 390×844: **13/13 passed**;
- total: **26 passed, 0 failed**;
- exact slots verified: `HC, OC, DC, RC, SC`;
- existing staff/scheme/market/tree surfaces retained;
- visual coach link opens canonical coach profile;
- page-level horizontal overflow: **0px** on both viewports;
- console errors: **0** on both viewports.

Release/build checks:
- source syntax: pass;
- standalone artifact build: pass;
- regenerated `index.html`: synchronized;
- clean reproducibility: pass;
- `npm run verify:release`: pass.

## Milestone boundary

Milestones A through E of the simplified Premium Presentation roadmap now have implemented focused checkpoints.

This documentation checkpoint carries `[full-ci]` to request the policy-required milestone-boundary full validation. Production remains unchanged unless explicitly authorized.

## Continuation

Next presentation slice: **Player Profile / Player Identity**.

Preserve Portrait V1 and the existing canonical player-profile data/uncertainty. Improve the identity hierarchy and football presentation around the current profile rather than replacing player mechanics or revealing hidden truth.
