# Dynasty Lab — idea backlog

Written at the v0.9.20 checkpoint, after milestone A closed. Everything here is
grounded in what the code actually does today; where an idea leans on a field
that already exists, the field is named so the next session can find it.

The top three (**hot seat**, **rivalries**, **NIL as a budget**) are specced in
detail at the bottom and are being implemented in v0.9.21.

---

## 1. Career stakes

### The hot seat *(top 3 — see spec)*
The single largest gap. `admin_patience` exists on all 120 schools and already
fires AI head coaches:

```js
expected=clamp(Math.round((t.prestige-30)/8),4,10), bad=t.w<expected-2,
fire=bad&&Math.random()>(t.admin_patience/100)
```

The controlled team is explicitly skipped (`if(t.name===controlled)` creates an
opening instead). Every AI program in the world lives with consequences and the
player does not — you can go 2-10 for a decade and nothing happens.

Note the framing constraint: the player runs a *program* and hires their own HC,
so this is administration confidence in the program's direction, not a coach
being fired.

## 2. Data the game stores but barely reads

Every school carries `prestige`, `resources`, `development`, `nil`, `academics`,
`fan_support`, `facilities`, `admin_patience`, `program_ceiling`. Four are nearly
inert:

### NIL as a spendable budget *(top 3 — see spec)*
`t.nil` is a static number that only tilts `recruitPitch` (weight `.16`). Make it
a resource you allocate — hold a player whose `transferRisk` is climbing, or close
a wavering commit (`pressure`/`challenger` already modelled). Plugs into two
systems that already exist.

### ~~Fan support as a living number~~ — shipped in v0.9.23
`t.fan_support` is static and feeds exactly one thing: the "Campus Life"
recruiting pitch. Let wins, rivalry results and trajectory move it, then feed it
into home-field advantage in `gameSim` (currently a flat `ha=2.2`) and into
administration confidence. Turns a constant into a feedback loop.

### Academic eligibility
`t.academics` is a recruiting weight and nothing else. Give players an academic
standing; weak-academics programs risk losing contributors. Gives the Coach's
Desk a genuinely hard decision (study table vs. practice reps) and makes a
3-star at a 90-academics school different from one at a 55.

## 3. Structural football that is missing entirely

### Rivalries *(top 3 — see spec)*
Zero occurrences in the codebase. Every school has `lat`/`lon`, `state` and
`conference`, so rivals can be derived rather than authored.

### ~~Bowl season~~ — shipped in v0.9.23
Also zero. The phase machine runs `regular → confReady → playoffReady → complete`,
so roughly 112 of 120 teams simply stop. A bowl tier gives every mediocre program
a reason to care about weeks 9–12 (six wins = eligible), an extra game, bowl
practices feeding the existing camp system, and recruiting momentum. Fits as a
`bowlReady` phase.

## 4. Depth on systems already built

### Signing day, live
`pressure` and `challenger` are already modelled on wavering commits. Resolve
them one at a time as an event sequence instead of silently. The best story
moment in the recruiting calendar, from data that already exists.

### Coaching tree
Coach career stints, relationships and a carousel all exist. Show where former
assistants ended up and give prestige credit for producing head coaches.

### Opponent scouting / weekly gameplan
Scouting Intelligence is per-player. The extension is per-opponent: a Coach's
Desk decision trading practice time against scheme familiarity, using the
existing `playCall` and familiarity systems.

## 5. Presentation

### Program history page
All-time record, coaching lineage, records by era — all stored already. The
Career Chronology (v0.9.20) proved the pattern.

### Tab coherence (roadmap milestone C)
Fourteen tabs is too many. Five groups: **Program** (dashboard/program/history),
**Team** (roster/depth/development), **Recruiting**, **Games**
(season/gamelab/stats/newsletter), **Offseason** (staff/offseason/records).

### Save size (roadmap milestone B)
Measure before touching. Likely `universe.events` dominates and wants a
per-season rollup — but that is a guess until measured.

---

# Specs for the top three

## A. Rivalries

**Derivation.** For each team, the nearest same-conference team by
`haversineMiles`. In-conference matters: weeks 4–11 are a conference round-robin,
so an in-conference rival is guaranteed to be played every season without
touching `buildSchedule`. Pair mutually where both pick each other; otherwise the
nearest available.

**State** (additive, backfilled in `normalizeUniverse`):
```
t.rivalry = {rivalId, trophy, series:{w,l,streak,lastYear,lastResult}}
```

**Effects**
- The scheduled meeting is recognisable before it is played (Game Lab, the wire).
- All-time series and current streak on the Program tab.
- Result moves `fan_support` and administration confidence — losing three
  straight to your rival should genuinely hurt.
- Wire tiles: the upcoming rivalry game, and the result, at importance above a
  routine game.

## B. The hot seat (administration confidence)

**State**
```
t.adminConfidence   // 0-100, seeded from admin_patience
t.mandate           // {year, wins, text} when confidence is low enough
universe.tenure     // {startYear, seasons:[{year,w,l,expected,delta}]}
```

**Expectation.** Reuse the carousel's own formula so the player is judged on the
same scale as the AI: `clamp(Math.round((prestige-30)/8),4,10)`, adjusted for
`program_ceiling`.

**Confidence movement** at season end: wins vs expectation dominates; conference
title and playoff runs add; the rivalry result and a losing season subtract.
`admin_patience` sets how fast it moves — a patient administration (78) forgives,
an impatient one (25) does not.

**Consequences that hook existing systems**
- High confidence: small `resources`/`facilities` investment, more staff budget.
- Low: reduced staff budget and recruiting pull.
- Very low: a stated mandate for next season, surfaced all year.
- Zero: tenure ends.

**In-season visibility.** Wire tiles as the mandate slips out of reach, and a
confidence meter on the Program tab. The number must never be a surprise.

*Shipped in v0.9.22:* being rehired at a lower-prestige program and carrying a
career record across tenures. The hot seat now has an ending **and** a next
chapter.

## C. NIL as a spendable budget

**State**
```
t.nilBudget, t.nilSpent     // per season, budget from t.nil and t.resources
p.nilDeal / r.nilDeal       // {amount, year} on players and recruits
```

**Spending**
- **Retention:** a deal on a rostered player reduces `transferRisk` (which today
  sums morale, promises, coach pressure and scheme fit — NIL becomes a lever
  against all of it).
- **Recruiting:** a deal on a targeted recruit raises `recruitPitch`, i.e. the
  same channel the static `t.nil` weight already feeds.

**Constraints.** The budget is finite and resets each offseason, so it is a real
allocation problem: hold the disgruntled starter or sign the blue-chip, not both.
Spending must be visible and reversible before the week is simmed.
