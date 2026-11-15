# Dynasty world measurements (v0.32.0 and v0.33.0)

Recorded 2026-11-15. All runs load the engine extensions (`FULL=1`).

## Balance: v0.32.0 against v0.31.1

`FULL=1 SEED=<n> SEASONS=10 node tools/league-health.js`, run on v0.31.1 (`2cc65d8`) and v0.32.0 (`f021698`).

| Seed | Distinct champions (old / new) | Titles by a preseason top-10 program | Distinct playoff programs | Distinct conference champions |
| --- | --- | --- | --- | --- |
| 7 | 7 / 9 | 6 / 6 | 67 / 64 | 53 / 46 |
| 11 | 8 / 4 | 6 / 9 | 57 / 68 | 48 / 58 |
| 23 | 6 / 7 | 8 / 5 | 59 / 67 | 49 / 53 |
| 31 | 8 / 8 | 8 / 6 | 58 / 63 | 46 / 50 |
| **Total** | **29 / 28** | **28 / 26 of 40** | **241 / 262** | **196 / 207** |

Prestige mean and spread, portal placement (7.0-8.3% unplaced), roster sizes and positional shortages are within
the same ranges. Verdict: chemistry and media payouts do not concentrate success; playoff and conference variety is
slightly higher. Single seeds swing widely (seed 11), so judge by the totals.

## Cost of the pro pipeline (v0.33.0 before the undrafted trim, against v0.32.0)

Seed 4711, six seasons, both runs at the same time on one machine.

| Season | Season sim ms (v0.32 / +pipeline) | Offseason ms | draftHistory KB | Whole save KB |
| --- | --- | --- | --- | --- |
| 2027 | 11663 / 11375 | 1163 / 1382 | 512 / 533 | 41379 / 41433 |
| 2028 | 11773 / 13221 | 1221 / 1160 | 1000 / 1042 | 55811 / 55961 |
| 2029 | 12476 / 12811 | 963 / 1195 | 1605 / 1671 | 70687 / 70888 |
| 2030 | 12363 / 12587 | 963 / 953 | 2120 / 2211 | 80733 / 80764 |
| 2031 | 11666 / 13603 | 1100 / 1176 | 2559 / 2674 | 90555 / 90597 |
| 2032 | 13544 / 13427 | 1150 / 1141 | 3052 / 3169 | 99822 / 99880 |

About +20 KB a season of draft history (about 0.2% of save growth), most of it undrafted players; v0.33.0 then keeps a
grade only for undrafted players graded 74 or better. The season-time difference (about 5%) is inside run-to-run
noise: the new draft board changes who is drafted and declares early, so the two leagues diverge. Working out every
program's alumni takes a few milliseconds and is cached per season.

## Pro career shape

One real draft class (seed 5), projected 30 seasons ahead:

| Round | Average career | Never made a roster | Made a Pro Bowl |
| --- | --- | --- | --- |
| 1 | 7.9 seasons | 0% | 31% |
| 2 | 5.6 | 3% | 13% |
| 3 | 5.3 | 9% | 6% |
| 4-7 | 2.8-4.0 | 25-50% | 0-6% |
| Undrafted | 0.3 | 93% | under 1% |

About four Hall of Famers per class at the 30-year horizon.
