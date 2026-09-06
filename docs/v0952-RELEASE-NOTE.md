# Dynasty Lab v0.9.52 release candidate

Branch: `codex/v0952-program-goals-polish`

This release candidate builds on the v0.9.51 Program Lab rendering hotfix and focuses on making the program-management layer coherent before v0.10 Game Engine 2.

## Included

- deterministic season-goal variety by program and season;
- Critical / Important / Bonus objective weights;
- live Complete / On track / At risk / Failed states;
- recruiting objectives that can emphasize blue-chip quality or class size;
- stature-based bowl, ranking, conference-title and national-title stretch goals;
- Program Overview with record, ranking, administration confidence, season expectation, goal health, rivalry and mandate;
- tighter Program Lab layout;
- preservation of the existing wins-vs-expectation administration model as the primary season judgement;
- migration of already-created v0.9.51 goals in place, including legacy `top25` goals, so a current season is not rerolled on load;
- regression coverage for goal rendering, variety, risk state and v0.9.51 goal migration.

The standalone artifact is rebuilt at v0.9.52 and the focused release verification passed. Production remains v0.9.51 until this candidate is deliberately published.
