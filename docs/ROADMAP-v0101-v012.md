# Dynasty Lab — Post-v0.10 Gameplay Roadmap

Status: **ACTIVE**  
Production baseline: **v0.10.0**  
Source baseline: `859cd99844f6f6304d833fc385dadd2c43239587`  
Active implementation branch: `codex/v0101-gameday-coaching`

## Product direction

Dynasty Lab has enough simulation depth. The next releases should convert that depth into a game the player can actively coach, understand, and remember.

The core loop is:

**Scout → Recruit → Prepare → Coach → Watch consequences → Develop → Build history**

The roadmap prioritizes player agency, visible cause/effect, delegation, and a living fictional college-football world. It deliberately does **not** turn Dynasty Lab into an every-play Madden-style play-calling game.

## Design rules

1. **Head-coach decisions, not every-play micromanagement.** Prompt only when a choice is consequential.
2. **Delegate everything optional.** The player can be deeply involved without being forced through dozens of menus.
3. **Show cause and effect.** Game plans, staff advice, player development, and coaching decisions must generate understandable feedback.
4. **Keep the universe fast.** Full detail is for user-facing games; AI games use compact storage and simulation where possible.
5. **Protect long dynasties.** Save growth, archive size, deterministic RNG, and season-to-season durability are release gates.
6. **Mobile remains first-class.** Decision windows and Game Day must work comfortably on phone screens.
7. **No hidden production experiments.** Development hooks may remain for tests, but release UI must be intentional and player-facing.

---

# v0.10.1 — Game Day + Coaching Decisions

## Goal

Make a user-controlled game enjoyable to watch and meaningfully influence without requiring every-play play calling.

## 1. Decision engine foundation

Introduce a deterministic decision-window layer above Game Engine 2.

Initial decision types:

- fourth down: go for it / punt / field goal / delegate
- late-game tempo: hurry / normal / drain clock / delegate
- two-point decision where game state makes it meaningful
- halftime adjustment
- injury/substitution decision when an important player is compromised

Each decision must contain:

- stable decision ID
- game state snapshot
- reason / stakes
- legal options
- staff recommendation
- default/delegated option
- selected option
- resolution event for archive/debugging

### Release boundary for Slice 1

Start with **fourth-down decisions only**. Do not add the other decision types until the API and deterministic-resume contract are proven.

### Acceptance criteria

- Same seed + same choices = identical result.
- Same seed + different meaningful fourth-down choices can produce different event streams/results.
- No decision can leave the game in an invalid or unresumable state.
- Decision choices survive serialization/resume.
- Delegation reproduces the existing v2 fourth-down policy unless intentionally recalibrated.
- Existing v2 calibration remains inside frozen guardrails when all decisions are delegated.

## 2. Interactive Game Day presentation

Turn Game Lab / Watch Game into the primary game presentation.

Persistent header:

- score
- quarter / clock
- possession
- field position
- down and distance
- timeouts

Live surfaces:

- current drive
- play-by-play
- scoring timeline
- live player leaders
- drive chart
- meaningful event emphasis: touchdowns, turnovers, sacks, explosive plays, injuries

Decision window:

- clear game situation
- staff recommendation
- choice buttons
- Delegate option
- no modal spam for ordinary plays

## 3. Game plan feedback

Connect pregame plan choices to visible v2 outcomes.

Examples:

- pressure package → pressure/sacks vs explosive-pass tradeoff
- run emphasis → rush share, efficiency, clock effect
- aggressive offense → explosive plays vs turnovers
- ball control → pace / possession / lower variance

Postgame receipt must explain whether the plan appeared to work and the cost paid for it.

## 4. Matchup screen

Before Game Day, show:

- team comparison
- injuries
- key players
- opponent tendencies
- matchup edges
- staff recommendations
- rivalry/history/stakes
- game-plan controls

### v0.10.1 release gate

- targeted decision-engine tests
- deterministic resume tests at a pending decision
- existing Game Engine 2 suite
- frozen calibration with delegated decisions
- user 12-game soak
- postseason soak
- two-season lifecycle soak
- browser/mobile Game Day regression
- IndexedDB persistence
- simulation audit

---

# v0.10.2 — Compact League-Wide Game Engine 2

## Goal

Move the entire fictional universe onto one football model without making saves or season simulation unreasonably large.

## Simulation modes

### Full v2

Used for user Detailed / Watch games.

Retains:

- full game state
- real-player attribution
- drives
- useful play-by-play
- decision receipts
- Game Day recap

### Compact v2

Used for AI-vs-AI and bulk simulation.

Retains:

- final score
- team box score
- real-player statistical lines
- scoring summary
- major events / leaders
- injuries / consequential events

Does **not** retain every ordinary snap.

## Acceptance criteria

- AI and user games share the same core football model.
- Full-season performance remains acceptable.
- Save growth is measured across 1, 5, 10, and 25 seasons.
- League statistical distributions remain within calibrated ranges.
- Legacy quick simulation remains available as rollback/reference until compact v2 passes release gates.

---

# v0.10.3 — Matchup + Gameplan Intelligence

## Goal

Make preparation matter before kickoff and make its consequences understandable afterward.

Features:

- opponent scouting tendencies
- strengths / weaknesses
- personnel mismatch detection
- staff game-plan recommendations
- uncertainty where scouting quality is weak
- pregame keys to victory
- postgame plan report
- opponent-adjusted performance context

The player should be able to answer:

> What did I think would work, what did I choose, what actually happened, and why?

---

# v0.11 — The Head Coach Experience

## Goal

Make the weekly experience feel like running a program rather than operating a spreadsheet.

Major systems:

- coordinator autonomy and trust
- delegation profiles by responsibility
- weekly practice allocation
- player role conversations
- promises and playing-time management
- redshirt decisions
- injury/risk decisions
- morale and locker-room consequences
- discipline / culture events
- staff responsibilities
- coordinator philosophy clashes
- administrator / booster pressure
- hot-seat and contract expectations
- richer coaching market and career decisions

## Weekly command flow

Dashboard should make the next action obvious:

1. Review opponent
2. Handle Coach’s Desk
3. Scout / recruit
4. Adjust board
5. Set game plan
6. Play / watch / sim
7. Review consequences
8. Advance

Every step can be delegated where sensible.

---

# v0.12 — Living College Football World

## Goal

Make long dynasties worth remembering.

Features:

- encyclopedia / universe browser
- richer program histories
- coaching trees
- coach career records
- player career pages
- legendary players
- award history
- rivalry history
- postseason history
- records by school / conference / nation
- recruiting class retrospectives
- draft/pro career summaries where appropriate
- historical rankings and season summaries
- storylines generated from real universe state

The target is an alternate college-football universe with enough continuity that a player can remember names, eras, upsets, dynasties, collapses, and coaching careers years later.

---

# First-time player experience

This is a cross-cutting requirement rather than a separate late feature.

As depth grows, the Dashboard should provide a quiet guided path rather than a mandatory tutorial.

Principles:

- always show the single most important next action
- explain blocked actions in plain language
- surface optional depth without requiring it
- distinguish "must do" from "can delegate"
- provide short contextual help near unfamiliar systems

---

# Implementation order

1. **v0.10.1 Slice 1 — deterministic fourth-down decision API**
2. v0.10.1 Slice 2 — paused/resumable user Game Day runner
3. v0.10.1 Slice 3 — Game Day scoreboard + decision UI
4. v0.10.1 Slice 4 — halftime / tempo / two-point decision windows
5. v0.10.1 Slice 5 — game-plan feedback + matchup screen
6. v0.10.1 release soak / preview / production
7. v0.10.2 compact league-wide v2
8. v0.10.3 matchup intelligence expansion
9. v0.11 Head Coach Experience
10. v0.12 Living World / encyclopedia

# Current implementation checkpoint

**Next code task:** implement Slice 1 as a small, testable Game Engine 2 API change. The existing automatic fourth-down behavior becomes the delegated/default policy. Interactive UI comes only after deterministic pause/resume and archive semantics are proven.
