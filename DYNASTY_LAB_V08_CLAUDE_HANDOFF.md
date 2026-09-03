# Dynasty Lab — Claude Handoff
## Current version: v0.8

### Project vision
Dynasty Lab is a fictional college-football dynasty/management simulator inspired by OOTP-style depth rather than Madden-style presentation.

Core loop:
**Recruit → Develop → Compete → Build history**

The game should prioritize:
- long saves
- uncertainty
- recruiting stories
- player development/busts/breakouts
- coaching careers
- school history
- dynamic prestige
- rich historical records
- decisions that create consequences several seasons later

Do **not** expose a single universal OVR as unquestioned truth. Scouting uncertainty, scheme fit, role fit, staff quality, development, health, and usage should all matter.

Schools are fictional but geographically grounded in the U.S. Archetype/scheme labels are original and should not mimic EA naming.

---

# Universe structure

## Division I
- 120 fictional D-I schools
- 10 conferences × 12 schools
- 12-game regular season
- 8 conference + 4 nonconference
- conference title game: top two
- 16-team playoff
- 10 conference champions autobids + 6 at-large

Current conferences:
- Great Lakes
- Northeast
- Atlantic
- Southeastern
- Gulf
- Heartland
- Southwest
- Mountain
- Pacific
- Metro

Long-term:
- Division II planned: 72 schools / 6 conferences × 12
- Division III later
- Do not prioritize D-II until D-I feels deep and alive

---

# Current feature set through v0.8

## Core universe
- 120 schools
- dynamic prestige
- school/program profiles
- conferences
- schedules
- rankings
- conference championships
- 16-team playoff
- long-term history

## Players
- ~85–105 players per program
- hidden true ability vs perceived ability
- imperfect recruiting stars
- archetypes and scheme fit
- body/physical traits
- mental/personality traits
- health
- wear
- injuries
- morale
- transfer risk
- season/career history
- eligibility
- redshirts
- role-specific depth chart integration

## Role-based depth charts
Includes role concepts such as:
- X / Z / Slot WR
- third-down RB
- power RB
- move TE
- LT/LG/C/RG/RT
- rush EDGE
- strong-side EDGE
- nose / 3-tech
- MIKE / WILL
- nickel
- boundary / field / slot corner
- deep / box safety
- KR / PR

Role fit should continue to matter more than generic OVR.

## Recruiting
- hometowns
- real-ish U.S. geography
- school coordinates
- recruit coordinates
- distance from home
- persistent fictional high schools
- national/position/state rankings
- pipeline strength
- visits
- relationships
- promises
- recruit priorities
- interest trends
- top-five schools
- class rankings
- reasons why a school is winning/losing a battle
- 15–30 signees per program in stress tests

## Statistics
Expanded player stats by position.

Examples:

QB:
- attempts/completions
- completion %
- yards
- TD/INT
- sacks
- rushing
- fumbles
- efficiency

RB:
- carries
- yards
- YPC
- TD
- receptions
- YAC-type output
- pass-block involvement

WR/TE:
- targets
- catches
- yards
- TD
- drops
- contested catch / YAC-style stats

Defense:
- tackles
- TFL
- sacks
- pressures
- INT
- PBUs
- forced fumbles

OL:
- snaps
- sacks allowed
- pressures allowed
- penalties
- blocking performance

A Stats Center / leaderboards layer exists.

Elite passing totals were recalibrated so extreme leaders are roughly in the 4,000–4,500 yard neighborhood rather than absurd 6,000+ totals.

## Weekly Command Center
After sim progression, the user should be surfaced:
- results
- rankings movement
- injuries
- recruiting developments
- commitments
- transfer concerns
- next opponent
- key alerts

This is intended to become the main “what needs my attention?” loop.

## Injuries/wear
- health
- accumulated wear
- injury types
- recovery time
- injury history
- weekly recovery
- injured players affect lineup resolution and team strength

## Redshirts / eligibility
- proper eligibility tracking
- four-game protection concept
- exhausted players leave college correctly
- redshirt status retained historically

## Awards / records / draft
- season awards
- school records
- national records
- draft simulation
- 224 draft selections / 7 rounds
- early declarations
- UDFAs
- draft history retained

## Player archive/history
- graduates/cuts preserved
- searchable historical players
- year-by-year career timeline
- injuries
- awards
- stats
- eligibility
- transfers
- draft outcome
- recruiting origin

## Coaches — current state
Current staff/scheme system includes:
- HC / OC / DC style structure
- recruiting
- evaluation
- development
- play calling
- adaptability
- scheme identity
- contracts
- salaries
- coach movement / firing / poaching framework

However, coaching is **not yet deep enough**. v0.9 should overhaul this.

---

# v0.8: Development & Camp system

v0.8 added the first deep player-development layer.

## Hidden development profiles
Players can follow different hidden development tendencies:
- early bloomer
- late bloomer
- steady developer
- high-variance development
- physical project
- near-ceiling player
- breakout/bust potential

These should not be casually exposed as literal truth to the user.

## Scouting uncertainty
Young players are shown with uncertainty ranges rather than false precision.

Example:
- Current: 71–80
- Upside: B+ to A

Ranges tighten with:
- snaps
- time in program
- camp exposure
- staff evaluation quality
- coaching familiarity

## Physical maturation
Players can:
- gain weight
- gain strength
- lose some speed with heavier mass
- develop toward new positional fits

This should eventually become more nuanced by body type/frame.

## Position changes
The user can change positions.

System includes:
- projected fit
- role suitability
- position familiarity / learning curve

Future improvement:
- player willingness
- morale effects
- transfer risk
- staff disagreement
- more realistic body restrictions

## Offseason training
Current framework includes:
Team emphasis choices such as:
- Strength
- Speed
- Conditioning
- Fundamentals
- Scheme installation

Individual plans include:
- Technique
- Athleticism
- Position skills
- Football IQ
- Rehab/recovery

User should influence development, never fully control it.

## Spring / fall camp
Current v0.8 camp framework:
- spring development
- fall camp
- position battles
- staff starter recommendations
- apply camp recommendations to depth chart
- scouting confidence increases from camp

Stress tests passed through 2030 with camp active.

---

# Current deployment / files

Latest working local files:
- `Dynasty_Lab_v0_8_Standalone.html`
- `Dynasty_Lab_v0_8.zip`

Production URL:
https://dynasty-lab-markjrogers92-1989s-projects.vercel.app

Latest immutable Safari-safe v0.8 deployment created:
https://dynasty-hommdm2cy-markjrogers92-1989s-projects.vercel.app

Earlier immutable v0.8 deployment:
https://dynasty-lym2xc3pz-markjrogers92-1989s-projects.vercel.app

GitHub repo used for payload/version hosting:
`MarkJRogers92/Property-Lookup`

Dedicated branch:
`dynasty-lab-vercel`

Do **not** disturb unrelated Property-Lookup work. Dynasty files live on the dedicated branch/folders.

---

# Deployment architecture / known problem

Large standalone HTML payloads have repeatedly been silently truncated during some GitHub/Vercel connector transfers.

Workaround used:
- gzip the full standalone HTML
- split compressed payload into small ~5 KB text chunks
- publish those chunks to GitHub
- verify Git blob SHA/size
- loader reassembles payload
- browser decompresses and opens game

This worked well in Chromium.

## Safari-specific issue
iPhone Safari produced:
`Dynasty Lab could not load — Failed to Decode Data.`

Cause:
Safari failed on the native browser gzip decode path even when Chromium accepted the same payload.

Latest mitigation:
- Safari-safe loader
- try native gzip first
- if Safari throws decode failure, fall back to a pure-JavaScript gzip decoder (pako-style fallback)
- one mutated chunk was embedded directly in the loader instead of fetched remotely

Important:
Do **not** reintroduce a fragile decode path without Safari testing.

Long-term recommended deployment improvement:
- stop shipping the entire app as a compressed standalone blob
- split into a proper static app:
  - `index.html`
  - `styles.css`
  - `app.js`
  - data modules
- preferably use normal Vercel/GitHub Git deployment
- keep individual source files comfortably below connector truncation thresholds
- reduce iframe/blob-loader dependence

This should be a high-priority infrastructure cleanup.

---

# Testing already performed

v0.8 engine:
- multi-season stress tests through 2030
- 120 teams
- full regular seasons
- postseason
- recruiting
- transfers
- development
- spring/fall camp
- eligibility
- redshirts
- roster rollover

Checks passed:
- roster sizes stayed bounded
- no eligibility-dead players remained active
- recruiting classes remained within expected ranges
- spring/fall camp completed
- scouting confidence increased
- position changes did not corrupt basic role depth chart generation

Loader smoke test in Chromium:
- 120 schools initialized
- Chicago Metropolitan selected
- Top 15 populated
- Development & Camp tab present
- zero JavaScript errors

Safari:
- native compressed-loader failed with “Failed to Decode Data”
- Safari-safe fallback loader has been deployed as the mitigation
- needs direct user-device confirmation

---

# Claude review priorities

Please review the project critically rather than merely adding features.

## 1. UI / UX
Look for:
- too many tabs
- poor information hierarchy
- dense tables
- unclear calls to action
- poor mobile layout
- places where a management-screen pattern would be better
- inconsistent terminology
- places where player/school names should be clickable
- opportunities for side panels, detail drawers, filters, sorting, search
- Weekly Hub should become the primary command center

Goal:
The user should always know:
- what happened
- what requires attention
- what decision is next
- why the result occurred

## 2. Simulation logic
Audit:
- rating distributions
- stat distributions
- development rates
- positional balance
- injury frequency
- wear/recovery
- transfer probabilities
- draft logic
- recruiting class quality
- prestige movement
- playoff/ranking behavior
- aging/eligibility
- roster-size enforcement

Watch for runaway feedback loops.

## 3. Recruiting
Review:
- distance formula
- pipeline weighting
- visit effects
- promises
- recruit interest movement
- top-school logic
- commitment timing
- flip/decommit logic
- high-school generation
- state/national ranking behavior
- class-size behavior
- whether elite programs dominate too aggressively

Recommended future recruiting additions:
- early signing period
- late signing day
- soft vs hard commits
- decommitments
- flips
- camps
- evaluation periods
- more transparent “why I lead / why I trail”

## 4. Development & camp
Audit:
- development volatility
- late bloomers
- bust frequency
- physical growth
- weight gain
- strength/speed interactions
- position changes
- scouting-range tightening
- staff recommendation logic
- camp battle logic

Need more four-year player stories.

## 5. Save migration
Must preserve:
- v0.7 → v0.8
- existing browser saves
- historical records
- player archive
- school history
- coach history

Future versions should normalize/migrate missing fields rather than invalidate saves.

## 6. Mobile / Safari
High priority.
Test:
- iPhone Safari
- small-screen tables
- dialog/profile behavior
- horizontal scrolling
- loader compatibility
- large localStorage saves
- export/import
- performance with ~11k active players plus historical archive

## 7. Performance
Current initial universe can be large.

Audit:
- repeated full-array scans
- unnecessary re-renders
- expensive ranking/recruiting loops
- save serialization
- history growth
- player archive growth
- long-term 30–50 season performance

Consider:
- indexes/maps by ID
- cached derived values
- incremental recalculation
- pagination/virtualization for large lists
- compressed saves if safe

---

# Guardrails

Do not:
- break the existing v0.8 production build while reviewing
- overwrite unrelated Property-Lookup repo content
- remove fictional-school identity
- replace original archetype labels with EA-style names
- expose exact hidden development profile directly
- turn the game into a Madden-like graphics project
- replace role/scheme fit with one simplistic OVR
- destroy save compatibility without a migration path

Prefer:
- additive changes
- versioned builds
- preview first
- Safari/mobile testing
- preserve historical data
- explain why decisions/results happen

---

# Recommended next version: v0.9 — Coaching overhaul

This is the strongest next step.

## Coaching market
Add real hiring pools for:
- Head Coach
- Offensive Coordinator
- Defensive Coordinator
- position coaches
- strength/performance staff later

Each opening should create candidates.

Candidate fields:
- age
- current job
- career history
- recruiting
- evaluation
- development
- play calling
- adaptability
- discipline
- clock/game management
- position specialty
- scheme
- regional recruiting ties
- ambition
- loyalty
- ego
- salary expectations
- contract years
- preferred responsibilities

## Hiring / negotiation
User should be able to:
- interview
- offer salary
- offer years
- offer title
- offer play-calling control
- negotiate
- lose candidates to other programs

## Coaching careers
Persist full career history:
- school
- role
- years
- record
- championships
- recruits developed
- draft picks developed
- awards

## Coaching trees
Track:
- who worked under whom
- coordinator lineage
- assistants promoted to HC
- downstream branches
- scheme lineage

## Staff chemistry
Potential dimensions:
- HC/OC compatibility
- HC/DC compatibility
- scheme alignment
- recruiting overlap
- personality conflict

## Coach-player relationships
Longer-term:
- QB coach relationship
- playing-time promises
- transfer risk if coach leaves
- recruit follows coach
- player development effects

## Career mode foundation
Eventually allow player to begin as:
- position coach
- coordinator
- small-school HC

Then climb through the coaching market.

This could become a major alternate game mode.

---

# After v0.9

## v0.10 — Encyclopedia / history
- full school encyclopedia pages
- all historical rosters
- all historical coaches
- all-time records
- rivalry histories
- year-by-year team pages
- recruiting-class archives
- award voting
- draft history
- conference histories
- championship pages

## v0.11 — Finances / facilities / NIL
- budgets
- stadiums
- facilities
- facility aging
- renovations
- donor wealth
- NIL collectives
- recruiting budgets
- staff budgets

## v0.12 — Conference realignment
- conference AI
- invitations
- expansion
- geography
- brand
- academics
- market
- prestige
- recorded membership history

## v0.13 — Division II
Only after D-I depth feels mature.

## v0.14+
- deeper snap engine
- packages/substitution logic
- contextual penalties
- fatigue
- weather/crowd
- 2D dots/game viewer

---

# Best near-term improvement beyond coaching

Before or during v0.9, consider cleaning the architecture:
1. extract standalone HTML into normal app files
2. eliminate compressed-blob deployment dependency
3. introduce proper data/index maps by ID
4. make UI components easier to maintain
5. add automated smoke tests for:
   - new universe
   - save/load
   - 10-season sim
   - offseason rollover
   - recruiting class
   - camp
   - draft
   - transfer
   - Safari loader fallback

That infrastructure work will make future feature development much safer.

---

# Review request to Claude

Please inspect the project and return:

1. **Top 10 bugs / risks**
2. **Top 10 simulation improvements**
3. **Top 10 UI/UX improvements**
4. **Performance concerns**
5. **Save/migration concerns**
6. **Safari/mobile concerns**
7. **Specific recommended code changes**
8. **A proposed v0.9 implementation plan**
9. Any changes you believe should be made **before** the coaching overhaul
10. A short list of changes you would **not** make yet

If modifying code:
- preserve v0.8 behavior
- create a new version/branch or clearly labeled patch
- do not replace production until tested
- include a handoff back to GPT describing every material change
