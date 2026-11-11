# v0.10.8 Player Profile / Identity — Checkpoint

## Branch

`codex/v0108-player-profile-identity`

Synchronized focused-checkpoint head: `0a543e79b877b456e35475ef8be14795dec4de8d` (`build: checkpoint v0.10.8 player identity`).

## Goal

Make an individual player feel like a football identity rather than a generic modal while preserving Portrait V1, the canonical profile, scouting uncertainty and all existing player mechanics.

## Implemented

- Added `player-identity-adapter.js`, a read-only presentation adapter using only canonical staff-facing/profile information.
- Added a premium player dossier hero via `player-identity.js` / `player-identity.css`.
- Preserved the existing Portrait V1 renderer and enlarged the canonical portrait rather than replacing it.
- Applied the player’s actual school palette to the profile header through the existing `DynastyProgramBranding` registry.
- Added jersey-number backdrop and stronger player/team/status hierarchy.
- Promoted current football context before dense detail:
  - active canonical role(s);
  - position / eligibility / style;
  - current scheme fit;
  - staff-facing current and upside ranges;
  - scout confidence;
  - current season production;
  - health;
  - staff development read;
  - training focus, position familiarity and wear.
- Existing canonical profile sections remain below unchanged: Season, Development, Health, Career, scouting history, promises, transfer history and career chronology.

## Guardrails

- No Portrait V1 rewrite.
- No player state writes.
- No roster/depth writes.
- No save/storage changes.
- No hidden true ratings, true potential, private growth curves or volatility are exposed.
- A pure model regression verifies hidden truth cannot alter the presentation output.

## Focused validation — GREEN

Workflow: `V0.10.8 Player Identity Checkpoint`, successful run `34129598812`.

Model regression:
- **3/3 passed**;
- football/staff-facing headline verified;
- supported status chips verified;
- hidden true talent/growth independence verified.

Browser regression:
- desktop 1280×900: **13/13 passed**;
- iPhone 390×844: **13/13 passed**;
- total: **26 passed, 0 failed**;
- Portrait V1 retained;
- hero portrait measured 126px desktop / 86px iPhone;
- player school branding applied from canonical palette registry;
- football role / staff evaluation / production / development read visible;
- uncertainty notice visible;
- canonical detailed profile retained;
- page-level horizontal overflow: **0px** both viewports;
- console errors: **0** both viewports.

Build/release checks:
- source syntax: pass;
- standalone build: pass;
- regenerated `index.html`: synchronized;
- reproducibility: pass;
- `npm run verify:release`: pass.

## Continuation

Next presentation focus: **Game Day & Season surfaces** — improve weekly opponent/game context, score/result hierarchy and season narrative without altering simulation or inventing unavailable venue/weather/network/betting information.
