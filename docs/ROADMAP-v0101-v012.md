# Dynasty Lab — Post-v0.10 Gameplay Roadmap

Status: **ACTIVE**  
Production baseline: **v0.10.1**  
Source baseline: `34e966be92b6da7520fbb921d196880878586c55`  
Active implementation branch: `codex/v0102-weekly-coaching-loop`

## Product direction

Dynasty Lab now has a real user-facing Game Day. The next releases should make the rest of the week feel like coaching a program rather than operating separate systems.

The core loop is:

**Review opponent → Handle Coach’s Desk → Scout / recruit → Prepare → Coach → Review consequences → Develop → Build history**

The roadmap prioritizes player agency, visible cause/effect, delegation, memorable players, and a living fictional college-football world. It deliberately does **not** turn Dynasty Lab into an every-play Madden-style play-calling game.

## Design rules

1. **Head-coach decisions, not every-play micromanagement.** Prompt only when a choice is consequential.
2. **Delegate everything optional.** The player can be deeply involved without being forced through dozens of menus.
3. **Show cause and effect.** Preparation, staff advice, development, and coaching decisions must generate understandable feedback.
4. **Scouting should be useful but imperfect.** Staff quality and uncertainty should matter; avoid exposing hidden exact ratings as truth.
5. **Keep the universe fast.** Full detail is for user-facing games; AI games use compact storage and simulation where possible.
6. **Protect long dynasties.** Save growth, archive size, deterministic RNG, and season-to-season durability are release gates.
7. **Mobile remains first-class.** Weekly decisions and Game Day must work comfortably on phone screens.
8. **No hidden production experiments.** Development hooks may remain for tests, but release UI must be intentional and player-facing.

---

# v0.10.1 — Game Day + Coaching Decisions — COMPLETE

Production includes:

- deterministic fourth-down decisions
- late-game tempo decisions
- halftime adjustments
- meaningful PAT / two-point decisions
- paused/resumable Interactive Game Day
- permanent transaction + rollback protection
- live scoreboard / clock / down-distance / field position / feed
- matchup intelligence and staff recommendation
- postgame game-plan receipt
- mobile Game Day regression
- Game Day IndexedDB persistence
- 12-game regular-season soak
- postseason and two-season lifecycle soak

Release source: `34e966be92b6da7520fbb921d196880878586c55`

---

# v0.10.2 — Weekly Coaching Loop

## Goal

Make Tuesday through Friday as interesting as Saturday. The player should understand the opponent, choose what to emphasize, handle a small number of meaningful people decisions, and then see those choices reflected on Game Day.

## Slice 1 — Opponent scouting + weekly preparation

### Opponent scouting report

Add a staff-generated report before kickoff containing:

- offensive tendency estimate
- likely strengths / weaknesses
- protection / coverage / run-front concerns
- key injuries and availability
- 2–4 staff observations
- confidence level / uncertainty
- recommended preparation emphases

Important: this is a **staff estimate**, not a reveal of hidden exact ratings. Low-confidence staffs should have wider or occasionally imperfect reads. Report generation must be deterministic and must not consume gameplay RNG.

### Weekly preparation budget

Give the head coach **2 preparation emphasis points** per opponent.

Initial emphasis menu:

- Pass Protection
- Run Blocking
- Explosive Passing
- Run Fits
- Coverage
- Pressure Package

Each emphasis modifies the same kickoff profile path consumed by Game Engine 2 and has an opportunity-cost or tradeoff. The player cannot maximize everything.

Requirements:

- up to 2 emphases
- staff recommendation visible
- Delegate to Staff option
- editable before kickoff
- saved on the team / week / opponent
- survives save/load
- archived with the permanent game result
- preview and permanent transaction use identical inputs
- no gameplay-RNG consumption from report generation or UI

### Slice 1 acceptance criteria

- no preparation selected = v0.10.1 kickoff profile is unchanged
- same dynasty state + same prep = same report and game inputs
- different prep choices can change matchup/game outcomes
- preview and permanent commit inputs match exactly
- weekly prep persists through IndexedDB save/load
- archived game records which emphases were used
- mobile UI remains usable
- existing v0.10.1 calibration stays green when no prep is selected

## Slice 2 — Depth chart / personnel decisions

Add selective situations rather than constant micromanagement:

- struggling starter vs backup
- injured starter risk decision
- freshman pushing a veteran
- RB workload split
- third-down / nickel specialist
- redshirt decision
- temporary benching / role adjustment

Surface only a few meaningful situations each week. Existing depth-chart and player-agency systems remain authoritative.

## Slice 3 — Staff Room

Create a staff advice layer where OC / DC / other staff can disagree.

Features:

- coordinator recommendation cards
- confidence / trust context
- conflicting recommendations
- Delegate by responsibility
- staff personality / ability influences usefulness
- postgame receipt comparing recommendation vs result

## Slice 4 — Player Story Cards

Surface 3–6 relevant players each week rather than forcing roster-table inspection.

Examples:

- breakout freshman
- unhappy backup
- injured star
- player nearing a record
- former recruit / transfer facing you
- player on a hot or cold stretch
- player affected by a recent promise

Stories must come from real universe state and remain traceable to player/history data.

## Slice 5 — Postgame consequences

After Game Day, produce a short consequence layer:

- breakout / disappointment
- injury fallout
- coordinator praise / criticism
- recruiting momentum
- rivalry / upset significance
- fan / admin reaction
- relevant player morale / role consequences

Avoid random flavor disconnected from the simulation.

### v0.10.2 release gate

- pure weekly-scouting determinism tests
- prep-profile integration tests
- Interactive Game Day preview/commit parity
- permanent archive receipt
- 12-game weekly-loop soak
- postseason + two-season lifecycle
- mobile weekly-prep regression
- IndexedDB persistence
- standard browser / engine suites
- simulation audit

---

# v0.10.3 — Player Stories + Staff Room Expansion

## Goal

Make coaches and players memorable and make advice feel like it comes from people rather than generic UI.

Features:

- richer staff personalities and disagreement
- coordinator autonomy / trust
- player story history
- staff recommendation track record
- player role conversations
- promises / playing-time management
- richer Coach’s Desk events
- media / booster / administrator reactions where grounded in universe state

---

# v0.10.4 — Compact League-Wide Game Engine 2

## Goal

Move the entire fictional universe onto one football model without making saves or season simulation unreasonably large.

### Full v2

Used for user Detailed / Watch games. Retains full useful Game Day detail.

### Compact v2

Used for AI-vs-AI and bulk simulation. Retains:

- final score
- team box score
- real-player statistical lines
- scoring summary
- major events / leaders
- injuries / consequential events

Does **not** retain every ordinary snap.

Acceptance criteria:

- AI and user games share the same core football model
- full-season performance remains acceptable
- save growth measured across long dynasties
- league statistical distributions remain within calibrated ranges
- legacy quick simulation remains available as rollback/reference until compact v2 passes release gates

---

# v0.11 — Full Head Coach Experience

## Goal

Make the weekly experience feel like running a program.

Major systems:

- coordinator autonomy and trust
- delegation profiles by responsibility
- weekly practice allocation expansion
- player role conversations
- promises and playing-time management
- injury / risk decisions
- morale and locker-room consequences
- discipline / culture events
- coordinator philosophy clashes
- administrator / booster pressure
- hot-seat and contract expectations
- richer coaching market and career decisions
- emergent Program Identity traits such as QB Factory, Defensive Factory, Development Program, Giant Killer, Home Fortress, Portal Mercenaries, etc.

## Weekly command flow

1. Review opponent
2. Handle Coach’s Desk
3. Scout / recruit
4. Adjust recruiting board
5. Set weekly preparation
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
- historical rankings and season summaries
- storylines generated from real universe state

The target is an alternate college-football universe with enough continuity that a player can remember names, eras, upsets, dynasties, collapses, and coaching careers years later.

---

# First-time player experience

This remains a cross-cutting requirement.

Principles:

- always show the single most important next action
- explain blocked actions in plain language
- surface optional depth without requiring it
- distinguish **must do** from **can delegate**
- provide short contextual help near unfamiliar systems

# Current implementation checkpoint

**Next code task:** v0.10.2 Slice 1 — deterministic opponent scouting report + two-point weekly preparation budget integrated into the existing Game Engine 2 kickoff profile path. No new Game Day decision types until this weekly preparation contract is proven.
