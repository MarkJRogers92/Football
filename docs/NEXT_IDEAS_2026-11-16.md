# Ideas after v0.36 — 2026-11-16

Brainstorm written after v0.36.0. The owner picked the items marked **(v0.37.0)**; the rest are still open. Earlier
lists: `docs/NEXT_IDEAS_2026-11-15.md`, `IDEAS.md`.

## Fixes and risks

| Item | Status |
| --- | --- |
| Save growth: cold archive tier for players who never started; phone-sized import time | **(v0.37.0)** −6.8% player archive at 12 seasons (camp history kept); about 17 s import at 4× CPU. Next targets: the game archive (box scores of other programs' old games) and live rosters. |
| Hot spots: `rankTeams` in the recruiting funnel, `rolePlayers`/`roleStarter` | **(v0.37.0)** role lookups and postseason snapshots done (postseason ~32% faster). `rankTeams` is pitch math that changes as commitments land within a pass, so caching it would change results; left alone. |
| Players of the Week and retired numbers in a long run | Open: check award concentration and whether the 12-number cap ever binds. |
| Real-device pass (iPhone Safari, Firefox, a screen reader, a timed coached game) | Open; needs a person. |
| Board bonus decision (F4) | Open since v0.29; needs the owner. |

## Combinations

| Item | Status |
| --- | --- |
| Players of the Week → award race, draft stock, Draft Night and Hall of Fame | **(v0.37.0)** |
| Facilities → injuries and development, naming who it helped (S4) | **(v0.37.0)** |
| Staff advice from the forecast (S5) | **(v0.37.0)** |
| Retired numbers as a recruiting pitch (un-retire one for a five-star) | Open |
| Traditions feed home-field advantage | Open |
| Rivalry in recruiting (S3) | Open |
| Locker room and pro alumni on recruiting visits (S6) | Open |
| Nemesis wager with the board | Open |
| Alumni coaches carry a coaching tree and a homecoming game | Open |

## Moments

| Item | Status |
| --- | --- |
| Where are they now (every 5th season) | **(v0.37.0)** |
| Anniversary flashbacks | **(v0.37.0)** |
| Milestone watch | **(v0.37.0)** |
| Spring game, press conference, captain's farewell, Ring of Honor ceremony | Open |

## Game Day

| Item | Status |
| --- | --- |
| Halftime adjustment changes second-half play calling (U6) | **(v0.37.0)** extended the existing coached-game choice; simulated games stay balanced so coached and simulated games still match. |
| Light fourth-quarter fatigue (U2), measured | **(v0.37.0)** blowouts unchanged; `docs/FATIGUE_MEASUREMENT_2026-11-16.md`. |
| Two-point and onside decisions in the recap | **(v0.37.0)** two-point/extra-point only: the engine has no onside kicks. Fourth-down review would be the natural next step. |
| One saved trick play a game | Open |

## Bigger (need decisions)

Difficulty at setup (U1), playoff size (U3), conference expansion past 12 (U5), suspensions and discipline,
per-position recruiter assignments and a "keep warm" action for commits.
