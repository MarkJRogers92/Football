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

## v0.33 follow-up baseline — 2026-11-15

Four full-runtime ten-season runs at PR #64 head `5c12a9c`, using seeds 7, 11, 23 and 31. Each run drove the existing offseason gates and completed 2027–2036.

| Seed | Distinct champions | Playoff programs | Conference champions | Top-10 class blue-chip share | Unplaced portal entrants | Final prestige mean / SD |
| --- | --- | --- | --- | --- | --- | --- |
| 7 | 6 | 60 | 49 | 23.9% | 7.9% | 66.4 / 15.7 |
| 11 | 7 | 66 | 49 | 24.5% | 7.3% | 66.4 / 15.0 |
| 23 | 8 | 63 | 47 | 22.7% | 6.9% | 66.4 / 15.2 |
| 31 | 7 | 60 | 51 | 26.1% | 7.9% | 66.3 / 15.3 |

All four final roster ranges were 85–105. These are comparisons across seeds, not proof that a particular school or save will behave identically.

Measurement correction: the older driver captured its purported preseason prestige ranking after the regular season and conference championships. It now captures it before `simSeason()`. Do not compare the old table's “preseason top-10” conversion numbers directly with corrected runs. Other metrics above use the same definitions.

The driver now reports early declarations and eventual pro Hall eligibility per actual draft class. The latter deliberately projects ahead for offline balance measurement only; the game's profiles remain chronological.

### Early-entry clock correction

The follow-up found that `offseasonDepartures` increments eligibility used before calling `earlyDeclaration`, whose old `[2,3)` gate was written as though the increment had not happened. In a controlled real-departures test, 8 of 20 ordinary sophomore first-round talents left after only two seasons. The revised check requires at least three completed college years (used seasons plus a redshirt year), with eligibility remaining. The same test now excludes ordinary sophomores and considers juniors and redshirt sophomores.

This matches the three-years-out-of-high-school requirement in [NFL Football Operations' draft rules](https://operations.nfl.com/calendar-events/nfl-draft/nfl-draft-rules), within the game's existing college/redshirt model. Draft grades and declaration probabilities were not retuned. Final follow-up runs include this correction; provisional runs from before it are excluded.

### Invitation decision calibration

The first two provisional ten-season runs (seeds 7 and 11) produced zero swaps and 13 recorded refusals each. Those runs exposed two issues in the new decision path: it valued only one year of a four-year payout, and refused pairings consumed the proposal slots before willing alternatives could be examined. The final decision values the whole media-deal cycle and reserves a conference/window slot only for an accepted move or the coach's pending invitation. The two-swap limit and one-use-per-conference rule remain intact. Final measurements below supersede these provisional results.

### Final follow-up: four seeds × ten seasons

Run with `FULL=1 SEED=<seed> SEASONS=10 node tools/league-health.js`, after the eligibility and invitation fixes. All 40 seasons advanced successfully; every measured roster stayed between 85 and 105 players.

| Seed | Champions | Playoff programs | Conference champions | Top-10 blue-chip share | Unplaced portal entrants | Final prestige mean / SD | Swaps / retained refusals | Early declarations | Eventual pro Hall inductees |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | 7 | 67 | 53 | 24.4% | 6.8% | 66.3 / 15.2 | 4 / 14 | 122 | 35 |
| 11 | 8 | 64 | 50 | 25.6% | 8.5% | 66.4 / 15.7 | 4 / 14 | 134 | 61 |
| 23 | 6 | 63 | 53 | 23.3% | 7.6% | 66.4 / 15.3 | 4 / 13 | 113 | 38 |
| 31 | 7 | 60 | 50 | 23.6% | 8.0% | 66.3 / 15.4 | 4 / 14 | 119 | 49 |

Compared with the baseline, the summed per-run distinct champion count is unchanged at 28; playoff-program counts total 254 versus 249, and conference-champion counts total 206 versus 196. The average top-ten blue-chip share is 24.2% versus 24.3%. These samples do not show a reason for further concentration tuning. The runs include both the eligibility correction and AI decisions, so differences cannot be attributed to one mechanic alone.

Early declarations averaged **12.2 per class** (range 2–22). Eventual pro Hall inductions averaged **4.6 per class** (range 0–11), evaluated 40 years after each class for measurement. Those are eventual outcomes, not honors already earned inside the ten-season save; players never see this projection. No grade, departure-probability or Hall threshold retuning was made. The earlier “one or two per class” source comment was inaccurate and has been removed.

Each seed had four completed swaps across its two windows, alongside 13–14 recorded refusals. A refusal can move the offer to another school, or let another conference pairing proceed. Accepted/pending moves still reserve both conferences and count toward the two-swap window cap.

### Thirty-season save campaign

`SEASONS=30 SEED=17 ROUNDTRIP=15 node tools/facilities-soak.js`, with save and metrics output enabled, completed 2027–2056 and reached the 2057 preseason with **no invariant problems**. It used the full runtime and played 430 user games through Game Engine 2, including a serialization roundtrip after season 15. There were 11 distinct national champions.

The portable save reached **311.8 MB**, growing about 9.7 MB per season; facility plans accounted for 40,915 bytes. Seasons averaged 14.8 seconds on the test host (13.0 first, 21.4 last). This is evidence that the run completes, not that the existing archive growth or long-save cost is solved. Browser import/reload timings are recorded in the session handoff; real-device checks remain separate.

## v0.33.1 Hall of Fame tightening

Draft classes from `FULL=1 SEASONS=5 node tools/league-health.js` at seeds 7, 11 and 23 (15 classes), each projected 40 years ahead. Pro Bowls cluster heavily on a few elite careers (of about 3,500 retired pros, 46 had eight or more), so a Pro Bowl count alone let in too many.

| Rule | Inductees per class (mean) | Range |
| --- | --- | --- |
| v0.33.0: 8 PB, or 4 AP, or 6 PB + 2 rings | 3.60 | 0–7 |
| v0.33.1: 5 AP, or 9 PB + 2 AP, or 7 PB + 3 AP + ring | 2.20 | 0–4 |

The wait after retirement is now five seasons (was three). Measurement only; players never see projected careers.

## v0.34 faster recruiting weeks

Profile of one full-runtime regular season (seed 9108): `scholarshipCapacity` was 17% of the season by itself,
reached through `canTakeCommit` from the recruiting funnel (`runFunnel`) and rival moves in `recruiting-actions.js`.
Those run after the core weekly pass, outside the per-pass capacity cache added in v0.31.1. Rosters cannot change
during them (commitments fill classes, not rosters), so the same cache now covers them.

| Seed | Regular season before / after | Universe SHA-256 after season + postseason (first 16 hex) |
| --- | --- | --- |
| 9108 | 9.0 s / 6.8 s | `c56cd5e6dbb32dae` both |
| 4711 | 9.3 s / 6.9 s | `2f02c8eb9cac653b` both |

Identical universes, about 25% less time per season. The next cost is `rankTeams` in the funnel (every program's
pitch for every open prospect, ~15%); caching it needs invalidation on interest and commitment changes inside a pass.
