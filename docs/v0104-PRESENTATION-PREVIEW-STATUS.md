# v0.10 release presentation / preview status

Base: lifecycle branch checkpoint `71a045ae49f5bd638c1466c68025898f777f3939`.

## Release-facing changes
- Hide Game Engine 2 shadow/development cards while preserving their test APIs.
- Replace the experimental Game Lab surface with a Game Day recap sourced from the permanent v2 archive.
- Show final score, OT marker, team totals, variable drive chart, scoring flow and real-player leaders.
- Permanently retain quarter/clock plus down-and-field context in each archived v2 play-by-play line.
- Keep Quick Sim / league AI simulation on the proven legacy engine for this release boundary.

## Gate
The presentation workflow must pass the targeted v2 suite, frozen calibration, presentation browser regression, complete dynasty lifecycle regression and exact standalone build sync before any preview publication.

Production remains v0.9.56 and is not authorized to change.
