# v0.10.1 Game Engine 2 — Multiweek Recorded-Game Soak

## Baseline
- Working branch: `codex/v0101-v2-multiweek-soak`
- Parent: synchronized recorded-game checkpoint `761fbadd73d4a8864742e586e17dd4d23f3abfd0`
- Production remains v0.9.56.
- Quick Sim remains the existing engine.

## Purpose
The single-game recorded-v2 gate is green, including an injected failure after archive creation that proved exact rollback and a successful permanent Game Center reopen. This slice tests whether the same v2 recorded-game path survives repeated weekly use while the rest of the league continues through the existing weekly simulation.

## Soak contract
The test-only `v2RecordedSoakProbe(6)`:
1. starts from a fresh regular-season dynasty;
2. resolves/delegates ordinary weekly decisions when needed;
3. records the controlled program's current scheduled game through the validated v2 transaction path;
4. verifies the schedule points to that permanent v2 archive;
5. lets the existing `simWeek()` finish the other games and advance the universe;
6. repeats for six consecutive controlled-program games.

After six weeks it requires:
- the universe week advanced exactly six times;
- the controlled program's W+L total increased by six;
- exactly six new controlled-program archives are tagged `engine: 'v2'`;
- all six archive IDs are unique;
- every v2 archive retains transaction version 1, real-player stat lines, drive detail and generated play-by-play;
- the most recent detailed result remains the latest v2 game.

A browser regression then reopens the sixth result from the Season schedule after all intervening weekly mutations and requires durable archived play-by-play to still render with no page or console errors.

## Non-goals
- No production publication.
- No Quick Sim cutover.
- No postseason v2 cutover in this soak.
- No change to the frozen v2 calibration targets.

## Next decision if green
If the six-week soak and full validator pass, the next bounded slice should make Game Engine 2 the development branch's normal **user Detailed Game** engine rather than a separate development button. Keep Quick Sim unchanged. After that cutover, run a season-level regression before preparing any preview release.
