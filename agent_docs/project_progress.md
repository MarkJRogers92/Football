# Project Progress

## Version and branch

Source is `0.12.21` on `claude/review-improvement-dwjemy`. PR #16 merged as
f57e770 after full CI 40430159066 passed; v0.12.21 fixes the kicking-game defect
found by the v0.12.20 metrics: critical depth (QB/K/P floor of two) is repaired
before general need, and thin kicker/punter team-seasons fell from 36/47 to 0/0
across the two measured seeds. Mac v0.12.21 is installed from its matching
artifact (signature and ZIP hash verified, 17 save files untouched, v0.12.20 app
backed up). Published desktop and web release is v0.12.21 (web publish
40431220621). v0.12.20 added the four league-health metrics (PR #15); v0.12.19
Hall of Fame browsing (PR #14); v0.12.18 history accuracy, off-field career
preservation and the offseason recap (PR #13).

## Overall progress

- Simulation: recruiting, scouting and development, transfer portal, coaching
  careers, bowls and playoffs, NIL, hot seat, rivalries, academic eligibility,
  guidance/first-season flow, Game Engine v2, 3D Game Cast replay.
- Presentation: premium client shell, recruiting workspace, development
  visualisation, Game HUD, playbook search, player identity, staff organisation,
  world history, legacy museum.
- Delivery: web production on `gh-pages`; Electron Alpha packages built by CI
  on `[release-ci]`; releases published from the packaged artifacts.

## Current position

v0.12.18 source merged and Mac installed: historical championship/conference facts,
off-field career preservation, roster accounting and offseason recap.
Live web remains v0.12.17. Further league-health metrics and Hall of Fame
transparency remain backlog; no balance tuning was performed.

## Next milestone

Named in `docs/roadmap/STATUS.md`. Do not infer a milestone from older root
handoffs in `docs/archive/`.
