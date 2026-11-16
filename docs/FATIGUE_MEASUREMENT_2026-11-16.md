# Fourth-quarter fatigue — measurement (v0.37, 2026-11-16)

`fatigue.js` gives each side of the ball a small fourth-quarter and overtime penalty:
0.5 + 0.35 × (gap − 4) rating points, capped at 3, where the gap is the average distance between the starters and
the players who rotate in late (RB2, WR4–5, TE2, the sixth and seventh linemen, the second wave of the front, the
nickel and dime backs). Quick simulation, which has no quarters, applies a quarter of it across the game.

## Starter-to-backup gap on new universes (seed 5, 120 programs)

| Side | p10 | p50 | p90 |
| --- | --- | --- | --- |
| Offense | 4.2 | 5.9 | 7.8 |
| Defense | 5.0 | 6.7 | 8.7 |

So the penalty runs about 0.6 (deep) to 2.2 (thin) rating points.

## League results, one regular season, before (`3ae9a15`) and after

`/tmp` script: full runtime, delegated weekly decisions, `simWeek` to week 12, every regular-season game (720).

| Seed | Blowouts (28+) before → after | One-score games before → after | Average margin before → after |
| --- | --- | --- | --- |
| 7 | 9.58% → 9.44% | 37.64% → 40.69% | 13.57 → 13.14 |
| 11 | 9.44% → 11.11% | 36.25% → 33.47% | 13.87 → 14.44 |
| 23 | 10.69% → 9.86% | 35.69% → 35.69% | 14.01 → 13.66 |
| 31 | 11.39% → 11.11% | 35.69% → 35.28% | 14.15 → 14.13 |
| **Mean** | **10.28% → 10.38%** | **36.32% → 36.28%** | **13.90 → 13.84** |

Blowout and close-game rates are unchanged within seed noise. Both teams pay the base penalty, so only the
difference in depth moves results.

## Detailed games (Game Engine 2), 3,000 neutral-site games between equal 80-rated teams

| Matchup | Home win rate | Home Q4 point margin | Home Q1–Q3 point margin |
| --- | --- | --- | --- |
| No fatigue | 49.2% | −0.17 | −0.11 |
| Deep (0.6) vs thin (2.4) | 50.9% | +0.30 | −0.11 |

The first three quarters are identical (same random stream); the deep side gains about half a point in the
fourth quarter and 1.7 points of win rate. That is the intended "light" size: depth matters late without
deciding games.
