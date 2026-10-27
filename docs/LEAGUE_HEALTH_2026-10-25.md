# League health over ten seasons

Measured 2026-10-25 with `tools/league-health.js` (added the same day) on two
independent seeds. Two ten-season dynasties, same engine version (v0.12.16),
plus the Hall of Fame tuning from v0.12.17 where noted.

## How it was run

```bash
SEED=7  SEASONS=10 node tools/league-health.js
SEED=11 SEASONS=10 node tools/league-health.js
```

The tool drives the interactive offseason the way the interface does (accepts a
job when the user program is let go, runs spring and fall camps when the calendar
sits there). It reports distributions and concentration only; it changes nothing.

## Results

| Measure | Seed 7 | Seed 11 |
|---|---|---|
| National champions (distinct / 10 seasons) | **10** | **10** |
| Most titles by one program | 1 | 1 |
| Distinct conference winners | 60 | 57 |
| Most conference titles by one program | 5 | 4 |
| Distinct playoff programs | 72 | 73 |
| Most playoff appearances | 7 | 6 |
| Distinct award-winning programs | 31 | 35 |
| Most major awards by one program | 11 | 6 |
| Prestige mean / sd (season 1 → 10) | 66.5 / 16.8 → **14.3** | 66.4 / 16.9 → **14.7** |
| Roster mean range | 86.4 – 93.6 | 86.4 – 93.5 |
| Rosters at the 105 cap | 0 – 1 per season | 0 – 1 per season |
| Class-size mean (min–max) | 18.2 (12–25) | 18.3 (12–25) |
| Players at their ceiling | 25.2% | 25.3% |
| Injured at season end | 178 | 204 |
| Archived careers | 22,737 | 22,749 |
| Hall of Fame inductees (before tuning) | **254** | **268** |

## What looks healthy

- **Title spread is wide.** Ten champions in ten seasons on both seeds, no
  program repeating, and 72–73 programs reaching the playoff. A ten-season
  dynasty does not collapse into the same eight schools.
- **Prestige stays bounded.** Mean is flat at 66.5 and the spread narrows from
  ~16.8 to ~14.4 without drifting upward or downward.
- **Roster sizes stay in band.** 85–105 throughout, with at most one program at
  the cap in a given season; no runaway roster growth.
- **Injuries stay near the 5-year audit**: ~180–200 players hurt at season end
  (1.7% of ~10,700), consistent with the earlier 10% per-season figure.
- **Recruiting volume is steady**: 18–19 signees per team per cycle, no collapse.

## What needs attention

### 1. The Hall of Fame was far too generous (fixed in v0.12.17)

254 and 268 inductees after ten seasons — roughly **25 per season**. The old
player rule inducted anyone with one major award; the old coach rule inducted
anyone with three conference titles. Both are common.

New rule (shipped):

- **Players** need two major awards, or one major award plus a first-round draft
  result, or a first-round result with strong career production, and 90 points.
- **Coaches** need a national title, five conference titles, or three Coach of the
  Year awards.

**Measured after the change (seed 7, ten seasons): 64 inductees instead of 254**
— about six a season across 120 programs. The same seed produced no other
difference in the table above, which is the point: the tuning changed who is
honoured and nothing about the league.

### 2. Rosters oscillate about four players per team

The mean swings 86.4 → 93.6 → 88.2 across seasons. That is the annual cycle of
departures (draft/eligibility), cuts at 105 and a signing class of ~18, but the
size of the swing is worth a look: a settled program probably should not shed and
regain five players every year. Not urgent, not a bug — a tuning question.

### 3. Freshmen dominate the roster

At season ten: FR 3,563 / SO 2,633 / JR 2,574 / SR 1,923 (seed 7), i.e. **33%
freshmen and 18% seniors**. Real college rosters sit nearer a quarter each. The
likely causes are the 85-player floor being filled with freshmen walk-ons and
early draft declarations. Worth checking whether the four-class pyramid should be
flatter before adding more development features.

### 4. Awards concentrate more than titles

Georgia Commonwealth won 11 major awards in ten seasons (seed 7) while no program
won two titles. That may be correct — awards follow individual production — but it
is the one place a single program pulls away from the league.

## Verdict

**No simulation change is warranted from titles, prestige, roster size,
injuries or recruiting.** The one clear defect was Hall of Fame selectivity, and
that is fixed. The two open questions — annual roster swing and freshman-heavy
rosters — are design tuning, not breakage; both deserve a deliberate change with
its own measurement rather than a quiet constant edit.

## Follow-up: the four metrics this report left out (2026-10-26)

The tool now also reports portal churn, positional shortages, walk-on dependence
and blue-chip concentration. Three seasons on both seeds, same command:

| Measure | Seed 7 | Seed 11 |
|---|---|---|
| Completed transfers (3 seasons) | 466 | 466 |
| Portal entrants left unplaced | 0 | 0 |
| Program-seasons losing 2+ players | 129 | 127 |
| Thin team-seasons (of 360) | 45 | 58 |
| — kicker/punter | 36 | 47 |
| — quarterback | 7 | 8 |
| — linebacker | 5 | 8 |
| — OL / DL / secondary | 0 | 0 |
| Walk-on share of rosters (mean) | 82.2% | 82.2% |
| Blue chips signed by top-10 classes | 16.1% | 16.7% |

Three findings worth acting on, none of them balance constants:

1. **Kicker and punter depth collapses over time.** Thin team-seasons go 0 → 7 →
   38 across three seasons, almost all at K/P (`POS_COUNTS` gives 2+2, the thin
   line is 3). Walk-on fill picks positions at random rather than by need, so a
   program that loses a kicker may never replace him. This is a roster-repair
   gap, not a tuning preference.
2. **Unplaced portal entrants are always zero.** Every player who enters is
   placed, which means the portal never produces the "didn't find a home"
   outcome the fiction implies — and no program is ever left holding a vacancy.
3. **Recruiting classes explain only a minority of rosters.** Roughly four in
   five rostered players never came through a class (season one is all
   pre-generated, so later seasons read 60–86%). Blue chips are also widely
   spread: only ~16% sign with the ten strongest classes, which matches the
   ten-different-champions parity result.

The first is the only one that looks like a defect: a program can end up unable
to field a kicker. Fixing it means making walk-on and portal fill respect
positional need — a behaviour change that should be measured the same way.

### Resolved in v0.12.21 — kicking-game repair

Roster top-up now repairs critical depth (`CRITICAL_FLOOR`: QB, K and P at two)
before general need: the weakest surplus player at an over-filled position is cut
and a walk-on at the missing position is signed, recorded like any roster cut.

| Three seasons, two seeds | Before | After |
|---|---|---|
| Thin kicker/punter team-seasons (seed 7) | 36 / 360 | **0 / 360** |
| Thin kicker/punter team-seasons (seed 11) | 47 / 360 | **0 / 360** |
| Thin quarterback team-seasons (7 / 11) | 7 / 8 | 9 / 8 |
| Thin linebacker team-seasons (7 / 11) | 5 / 8 | 10 / 4 |

The kicker/punter defect is gone on both seeds. Soft depth deficits at safety,
linebacker and quarterback remain and are left alone deliberately: those are
depth, not an unplayable roster. Portal placement behaviour and the class share
of rosters are unchanged — they are design questions, not defects.
