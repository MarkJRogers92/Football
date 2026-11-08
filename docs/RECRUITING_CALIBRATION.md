# Recruiting Desk: calibration and soak

Every number in `recruiting-actions.js` (costs, effects, the dealbreaker rate, the funnel's cuts) was set by
playing full seasons and reading the classes that came out, not by feel. This page is how to do that again, how to
read it, and what it cannot tell you. Two tools:

| Tool | Command | Answers |
| --- | --- | --- |
| `tools/recruiting-calibrate.js` | `npm run calibrate:recruiting` | Does a change make recruiting too strong, too weak, or unfair to a kind of player? |
| `tools/recruiting-soak.js` | `npm run soak:recruiting` | Does a long dynasty with the desk on stay healthy: save size, stuck funnels, bad numbers, drift? |

## Calibration

```bash
npm run calibrate:recruiting                                  # all policies, all tiers, 9 seeds (about 3 minutes)
node tools/recruiting-calibrate.js --policies legacy,staff --tiers mid --seeds 4
node tools/recruiting-calibrate.js --board upside             # target the 25 highest-upside prospects instead
node tools/recruiting-calibrate.js --tune '{"INTEREST_PIVOT=55,INTEREST_WEIGHT=.45":"INTEREST_PIVOT=60,INTEREST_WEIGHT=.45"}'
```

`--tune` swaps exact text in `recruiting-actions.js` in memory for that run only, so a candidate value can be
compared against the current one without editing anything. It fails if the text is not found. Run the same command
without `--tune` first; the two tables are what you compare.

### The policies

Each plays a full season with a fixed board of 25 targets, in programs from three prestige tiers (three programs per
tier, rotated by seed), and reports the class that signed.

| Policy | What it does |
| --- | --- |
| `legacy` | The desk removed entirely: how the game recruited before v0.15.0. Always measured; every other row is read against it. |
| `idle` | Targets a board and never works it. |
| `casual` | Calls everyone each week and offers at 60% interest. Ignores rivals and commitments. A player who is busy and not paying attention. |
| `staff` | "Staff handle recruiting" and nothing else. |
| `skilled` | Works the ten most winnable targets: answers rival moves, avoids known dealbreakers, offers early, books in-homes, pitches the best topic, and checks in on commitments under pressure. |

### Reading the output

- **Blue chips per class** is the headline. The bracket is the change against `legacy`.
- **Average stars** and **board targets landed** show whether a change is about quality or about getting the people
  you chased.
- **League-average stars of the other 119 classes must not move** (it sits at 2.81 to 2.82). If it does, a change
  has leaked into programs the player does not control.
- Noise is real. With 9 seeds, a difference under about half a blue chip is not a result.

### Where the numbers stood at v0.15.0

The standard run (9 seeds, `--board winnable`, blue chips per class, change against the pre-desk behavior):

```text
Blue chips (4-5 star) per class, change against legacy in brackets
policy   low             mid             high            
legacy   0.78            2.22            2.22            
idle     0.33 (-0.44)    2.33 (+0.11)    2.22 (+0.00)    
casual   0.33 (-0.44)    2.89 (+0.67)    2.11 (-0.11)    
staff    1.44 (+0.67)    4.11 (+1.89)    2.00 (-0.22)    
skilled  2.33 (+1.56)    4.00 (+1.78)    2.00 (-0.22)    

Average stars of the class
policy   low             mid             high            
legacy   2.87            2.62            2.83            
idle     2.89 (+0.02)    2.89 (+0.27)    2.74 (-0.10)    
casual   2.89 (+0.02)    2.94 (+0.32)    2.73 (-0.10)    
staff    2.92 (+0.05)    3.03 (+0.41)    2.82 (-0.02)    
skilled  2.96 (+0.10)    3.08 (+0.46)    2.77 (-0.06)    

Board targets landed (of 25)
policy   low             mid             high            
legacy   2.22            1.56            0.22            
idle     0.00 (-2.22)    0.00 (-1.56)    0.00 (-0.22)    
casual   0.22 (-2.00)    1.11 (-0.44)    0.44 (+0.22)    
staff    1.33 (-0.89)    3.22 (+1.67)    2.56 (+2.33)    
skilled  3.00 (+0.78)    4.78 (+3.22)    1.00 (+0.78)    
```

What to take from it:

- **Effort matters at the bottom and middle.** Idle and casual play land at or below the old behavior for
  low-prestige programs; staff-run and skilled play beat it for low and mid programs.
- **The top tier barely moves.** Top programs' classes fill from natural commits before the board is reached, so
  every policy sits within noise of the old behavior.
- **An open question.** Staff-run play is about as good as the scripted skilled player in blue chips for mid
  programs (4.1 against 4.0) and trails it only for low programs (1.4 against 2.3). The scripted player's edge is
  mostly in board targets landed (4.8 against 3.2). Whether a person does meaningfully better than the staff is the
  thing the bots cannot settle; if play shows it does not, the staff plan's offer and pitch limits
  (`maxOffers`, `maxPitches`, `STAFF_OFFER_AT` in `staffPlan`) are the dial to leave a human headroom.
- **Compare like with like.** This tool samples three programs per tier rotated by seed, so its numbers differ
  from earlier hand-run tables; only compare two runs of the same tool.

### What this cannot tell you

- **Bots are not you.** Every constant was tuned against scripted policies. Whether the hours feel tight, the
  dealbreakers fair, or the rival moves urgent is something only play can say.
- **Tiers are samples.** Three programs per tier, rotated by seed. A specific school can differ a lot from its tier.
- **One board shape.** The board is the 25 most winnable prospects by pitch (or the 25 highest-upside with
  `--board upside`, which a low-prestige program can barely reach). A real coach's board is a mixture.

### Lessons that cost time once

- Ranking the program by raw pitch alone at the funnel's cuts was far too punishing: skilled play for low programs
  fell from 3.8 to 0.2 blue chips, because the work you do lives in his interest, not in your program's stats. His
  interest is now part of your standing.
- Pitch heat alone moved a recruit's interest by under a point a week, which made ignoring rivals free. Unanswered
  moves now also take interest directly.
- A recruit whose finalists all have no room must fall back to the best program that does, or he never decides.
- The hold on random commits (a target waits for his date) is itself a large advantage; the interest pivot was
  raised to keep skilled mid-prestige gains near +1.8 blue chips.
- Staff-run play left offers on the table for recruits who had put the program on their list; the staff plan now
  offers to them.

## Soak

```bash
node --max-old-space-size=6144 tools/recruiting-soak.js      # 30 seasons, staff-run, seed 7 (about 12 minutes, up to 4 GB of memory)
SEASONS=12 SEED=3 POLICY=skilled node tools/recruiting-soak.js
node tools/recruiting-soak.js --seasons 20 --json
```

It plays the controlled program through full seasons (preseason, twelve weeks, postseason, camps, offseason, career
changes), working a board every week, and checks after each:

- hours never exceed the budget, offers out never exceed the limit;
- every recruit's interest and relationship stay finite and in range, and every decision week is 5 to 11;
- the class count the game keeps equals the commitments that exist, and a class never exceeds capacity by more than
  the over-sign allowance;
- the season ledger never shows more hours than were available;
- no record of the desk survives from an old class into a new one, and no funnel exists before a week is played;
- the save does not grow faster over the second half of the run than the first (`SOAK_STRICT_SIZE=1` makes this a
  failure; by default it is reported), and the desk's own share of a save stays small.

It exits 1 on any violation. `tests/recruiting-calibration-tools.js` runs two short soaks and the calibration tool in
`npm test`.

### Where the soak stood at v0.15.0

30 seasons, staff-run, seed 7: every check held, 30 of 30.

- **The desk is flat.** Its records add about 32 KB to a save and that does not change over the whole run (0.01% of
  a save). The season ledger stays on the one controlled program. No funnel is ever stuck, no record from an old
  class survives, and no number leaves its range.
- **The staff use about 70% of the budget** (464 of 657 hours a season) and the classes stay a healthy 14 to 24, with
  3.1 blue chips on average.
- **The save grows 11 MB a season, linearly (30 MB to 356 MB), with or without the desk.** A game with the desk
  removed produces byte-identical saves (30.4, 45.2 and 60.6 MB after three seasons with and without it), so this is
  the existing archive growth described in `docs/SAVE_SIZE_MEASUREMENT.md`. It matters because the portable save
  passes 256 MiB at about season 22, the size of the native snapshot guard named in
  `agent_docs/OPENCODE_LONG_RUN_HANDOFF.md`. Browser storage defers part of this, so the same number does not apply
  there.
- **Memory and speed follow the same growth:** the heap climbs to about 4 GB (and is collected back down), and a
  season takes 6.6 s at the start and 31 s by season 30. Run a 30-season soak with `--max-old-space-size=6144`.
