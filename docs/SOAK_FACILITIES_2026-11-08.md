# Soak: play model and facilities (2026-11-08)

`tools/facilities-soak.js` plays the production runtime for 20 seasons: every user game through Game Engine 2
(penalties, returns, pressure, conditions), the offseason driven phase by phase, a scripted booster policy, and a
watchdog that fails if a season does not advance exactly one year. Node 22, source commit after `64fe908`.

```bash
SEED=7 SEASONS=20 POLICY=active ROUNDTRIP=10 node tools/facilities-soak.js   # POLICY=idle, AI=off, OUT=file.json
```

## Results

| Check | Result |
| --- | --- |
| Stalls, non-finite values, out-of-range ratings, fund or goodwill outside bounds, more than two projects | None in any run (seeds 7 and 11, 20 seasons each, active and idle policy, AI on and off). |
| Save size | 227.0 to 227.7 MB at season 20 in every configuration, 10.3 to 10.4 MB a season. That is the existing archive growth: the no-AI, no-investment baseline is 227.6 MB. All 120 facility plans together are 42 KB, and a game's `conditions` is about 90 bytes. |
| Time and memory | 8 to 13 s a season, rising slowly with archive size; the heap peaks near 2 GB and is collected. No leak. |
| Reload | A pack, JSON, normalize round-trip after season 10 against an uninterrupted run, same seed: every gameplay field for the next ten seasons is identical (records, flags, returns, pressures, points, conditions counts, facility levels, fund, goodwill, league ratings). Only packed size differs, by 0.8 MB at the reload converging to zero by season 15. |
| Play model over about 265 user games a run | 5.0 to 5.3 flags per team, 63 to 68 return yards per team, 7.5 to 7.7 pressures allowed per team, about 40 points a game. Matches the tuning. Every game archived with conditions. |
| Titles | 15 to 20 distinct national champions in 20 seasons in every run: AI investment does not concentrate titles. |

## What the soak found, and the change it caused

With AI programs investing all their gifts and no running cost, the league saturated: mean 11.6 of 15 levels by season
20, mean rating 66 to 86, 42 programs pinned at the 99 cap and the rating spread compressed (SD 18.4 to 15.4). Every program could afford
every level, which also made the player's investment meaningless.

Two changes, measured over the same seeds:

- **Upkeep**: each level costs 0.9 units a season out of the gifts (rounded down). A program with large gifts keeps more
  buildings than a poor one.
- **Diminishing returns**: a finished level adds +1 to the rating (not +2) once the rating is 90 or more.

| Season 20, seed 7 | No AI investment | AI, no upkeep | AI, upkeep 0.6 | AI, upkeep 0.9 (shipped) |
| --- | --- | --- | --- | --- |
| League mean levels | 0 | 11.6 | 9.3 | 7.6 |
| Programs at 99 or more | 5 | 42 | 16 | 11 |
| Mean facilities rating | 66.4 | 85.8 | 81.6 | 79.1 |
| Levels, top / middle / bottom third of programs by prestige | n/a | 12.2 / 11.9 / 10.1 | 10.8 / 9.5 / 7.2 | 8.8 / 7.9 / 5.7 |

An engaged player (three campaigns a season, every gift to buildings) reaches 12 to 13 levels with an empty fund: it is
a real budget, not a free upgrade. An idle player stays at the league average, 7.6.

## Weak and mid-tier programs

The same soak with the engaged-player policy, 20 seasons, after the upkeep change. Vermont State (prestige 28, seed 7) and Gulf Plains University (prestige 31, seed 11) are two of the weakest programs; Cape Fear State (prestige 67) is mid-table. No stalls and no invariant problems in any run.

| | Levels built | Facilities rating | Rank of 120 | Booster goodwill |
| --- | --- | --- | --- | --- |
| Weak, seed 7, active | 7 (stadium 3, training 2, ops 2) | 35 to 49 | 111 | 10 to 31 |
| Weak, seed 11, active | 6 (2, 2, 2) | 25 to 37 | 117 | 18 to 36 |
| Weak, seed 7, idle | 0 | 35 | 118 | 30 to 45; fund sits at the 40 cap |
| Mid, seed 7, active | 13 (5, 4, 4) | 56 to 98 | 12 | 94 to 100 |
| League mean, every run | 7.6 to 7.7 | | | |

- A weak program is **not locked out**: it builds 6 to 7 levels, about the league average, so it keeps pace with the AI programs rather than falling behind. It cannot catch up, because its gifts are small and its goodwill is low from losing (these coaches won 2 to 4 games a year).
- The Major Gift Ask is a trap for an unhappy donor base: the floor is a 15% chance, and a failure costs 4 goodwill. The scripted policy asks anyway and stays near 10 to 30 goodwill; a player should skip the ask until winning restores it.
- An idle weak program banks gifts to the 40-unit cap and wastes them. A fund-idle nudge already appears in the offseason hub.
- A mid-tier program that invests fully climbs from rank about 60 to rank 12 in facilities.

## Not covered

- Real Chromium and desktop-packaged saves at season 20 (the soak uses the Node harness and the packed save shape).
- A weak program that is fired (none was, in these runs).
- Whether 7.6 average levels is the right long-run feel. The numbers are tunable in `facilities-boosters.js`
  (`UPKEEP_PER_LEVEL`, `LEVEL_COST`, income) and `tools/facilities-soak.js` prints the table to tune against.
