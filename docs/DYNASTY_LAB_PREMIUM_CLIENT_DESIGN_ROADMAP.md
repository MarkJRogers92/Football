# Dynasty Lab — Premium Client Design Roadmap

**Purpose:** Durable overview / handoff / reference for the next major Dynasty Lab presentation phase.

**Repository:** `MarkJRogers92/Football`

**Reference written:** September 6, 2026 (late evening, America/Chicago)

## Live state when this document was written

- **Current production:** `v0.10.1`
- Production publish branch: `codex/v0101-production-publish`
- Production publish workflow completed successfully on September 6, 2026.
- **Newest active development line observed:** `codex/v0102-weekly-coaching-loop`
- Active head when this file was written: `3ddfb228cc0e5ff3807a51525c5438717c6fcac0` — `feat: add archive-grounded postgame consequence engine`
- That active branch is newer than production and contains unrelated gameplay/coaching work. Its general validation workflow was failing at the time this reference was written even though the branch-specific weekly-coaching workflow succeeded.

**Important:** Always inspect current GitHub state before starting implementation. Dynasty Lab is moving quickly. Do not assume the branch/version snapshot above is still the newest state simply because this file exists.

---

# 1. North Star

Dynasty Lab should feel like a **purpose-built college-football front-office application**.

It should not feel like:

- a webpage with a large row of tabs;
- a SaaS analytics dashboard;
- ESPN pasted on top of a simulation;
- a console-football-game imitation;
- a prettier spreadsheet that hides the game's depth.

The conceptual neighborhood is **OOTP / Football Manager**, but Dynasty Lab should be darker, cleaner, more football-specific, and more visually intentional.

The governing design principle is:

> **Visual for decisions. Dense for analysis.**

When the user is making an important choice, the interface should become visual and contextual.

When the user wants to dig through information, the interface should still provide a fast, sortable, dense data view.

Do **not** remove power-user tables. Stop making them the front door to every important system.

---

# 2. Why this phase is next

Dynasty Lab is no longer short on gameplay systems. Recruiting, scouting, player development, staff evaluation, transfer portal, coaching, game presentation, history, persistence, schedules, goals, rivalries, branding and long-dynasty systems are now substantial.

The remaining presentation problem is structural rather than cosmetic:

1. The game still exposes too many top-level destinations at once, which makes it feel browser-like.
2. Important systems — especially recruiting — still present as databases first and games second.
3. Existing polish improved individual screens, but the application as a whole still lacks a strong client architecture.

Earlier visual work deliberately stayed additive and presentation-only. That was correct while the visual language was being discovered. The next phase should formalize that language into an actual product shell and system-specific workspaces.

---

# 3. Non-negotiable guardrails

Unless a later user instruction explicitly changes these rules:

- **Do not change simulation balance while implementing the visual roadmap.**
- **Do not alter save/storage behavior for presentation convenience.**
- **Do not expose hidden true ratings, hidden potential, hidden growth curves, hidden volatility or private simulation state merely to make a UI prettier.**
- **Do not invent sports information that the engine does not actually know** (stadium names, weather, kickoff times, TV networks, betting lines, etc.).
- Preserve the existing uncertainty model in scouting and recruiting.
- Preserve current player portrait V1 unless a separate approved portrait project replaces it.
- Prefer presentation adapters/read-only hooks over coupling visual components directly into simulation internals.
- Keep mobile behavior first-class.
- Keep reduced-motion support.
- Keep dense/table views available wherever they materially help power users.
- Changes should be incremental and testable; no giant front-end rewrite is required.

## Branching / continuation rule

This document is a **reference**, not a declaration that its host branch must be the implementation branch.

Before each milestone:

1. Inspect production, newest active branches, recent commits and workflows.
2. Identify the newest suitable validated base.
3. Create/continue a dedicated bounded design branch for the milestone.
4. Keep unrelated gameplay work isolated when practical.
5. Commit in recoverable chunks and leave a short continuation note whenever work pauses.

---

# 4. Overall design architecture

## Global structure

The interface should have three persistent levels:

1. **Application shell** — global navigation and program/season status.
2. **System navigation** — tabs/subviews only for the current area.
3. **Workspace** — the actual decision/data surface.

This is the opposite of the old model where almost every feature competed for a global tab.

## Two-mode rule

Every major management screen should support two modes when appropriate:

### PLAY VIEW
Visual, focused, contextual and decision-oriented.

### DATA VIEW
Dense, sortable, analysis-oriented and fast.

Examples:

- Recruiting: Workspace / Table
- Roster: Position Groups / Table
- Development: Results / History table
- Season: Visual schedule / compact list

---

# 5. Milestone A — Real client shell and grouped navigation

**Priority:** Critical  
**Impact:** 5/5  
**Difficulty:** ~3/5

This is the first implementation milestone.

## Desktop shell

Use a permanent left navigation rail.

### Suggested information architecture

**DYNASTY LAB**

**HOME**
- Command Center
- News / Inbox

**PROGRAM**
- Overview
- Roster
- Depth Chart
- Development
- Staff

**RECRUITING**
- My Board
- All Recruits
- Battles
- Signing Class
- Class History

**SEASON**
- Schedule
- Game Center
- Rankings
- Stats

**WORLD**
- Teams
- Conferences
- History
- Records

Not every item above needs to become an independent top-level route. Several should be secondary views inside the parent area.

## Top status bar

Keep it restrained.

Example:

`Northern Illinois | #17 | 8–2 | 2031 · Week 11`

Right side:

`Next: at Toledo`  
`Advance Week`

`Advance Week` should be the dominant persistent action when advancing is actually available.

Save/load utilities should not consume the same prime visual territory as core gameplay. Move them to an appropriate utility/menu surface without reducing their reliability.

## Contextual second-level navigation

Examples:

### Recruiting
`My Board | All Recruits | Battles | Signing Class | History`

### Program
`Overview | Roster | Depth Chart | Development | Staff`

The global shell stays stable while individual systems can deepen without adding more global tabs.

## Mobile

Do not shrink the desktop left rail into nonsense.

Preferred mobile pattern:

- compact top program/status strip;
- hamburger/drawer for complete navigation;
- optional persistent bottom destinations for the most-used categories;
- content begins near the top of the viewport;
- no horizontal global-navigation scrolling.

A reasonable bottom set is:

`Home | Program | Recruiting | Season | More`

## Acceptance criteria

At 1280px:

- zero horizontal global navigation scrolling;
- global destinations visually grouped;
- one clear active area;
- `Advance Week` obvious but not obnoxious.

At 390px:

- meaningful game content appears immediately;
- no two-row wall of utility buttons above content;
- navigation remains complete and discoverable;
- no horizontal overflow.

A new user should be able to answer within roughly five seconds:

- What program am I controlling?
- What is my record/rank?
- Where am I in the season?
- What needs my attention next?

---

# 6. Milestone B — Formal Dynasty Lab design system

**Priority:** Very High  
**Impact:** 4/5  
**Difficulty:** ~2.5/5

Consolidate the visual language already discovered in the earlier Visual Identity / Commercial Polish passes.

## Component families

Standardize panel families instead of producing endless one-off bordered boxes:

- Surface
- Panel
- Feature
- Hero
- Inset
- Alert

## Status language

Use one coherent status-chip system:

- Neutral
- Positive
- Informational
- Warning
- Critical
- Team branded

Avoid separate visual vocabularies for every pill/badge/status treatment.

## Typography scale

Tokenize at least:

- Page title
- Section title
- Card title
- Body
- Secondary text
- Label
- Statistic
- Microcopy

No one-off microscopic uppercase labels scattered throughout the interface.

## Information density

Standardize three density modes:

### Feature
Large, visual, decision-focused.

### Standard
Normal management UI.

### Dense
Analysis/table UI.

The goal is not fewer numbers. The goal is deliberate hierarchy.

---

# 7. Milestone C — Recruiting Workspace

**Priority:** Critical  
**Impact:** 5/5  
**Difficulty:** ~4/5

This should be the flagship redesign after the shell.

Recruiting mechanics are now deep enough to deserve a purpose-built scouting workspace rather than a 14-column table as the default experience.

## Desktop workspace

Use a three-pane structure.

### Left — Board / navigation pane

Approx. 250–300px.

Contains:

- search;
- position/need filters;
- My Board;
- Staff Shortlist;
- commits;
- recently viewed;
- roster needs.

Compact prospect rows should emphasize only the highest-value information.

Example:

**Marcus Hill**  
QB · #48 NAT · ★★★★  
Illinois  
NIU: 2nd · −34

### Center — Prospect list

A condensed visual list/cards surface showing:

- portrait;
- name;
- position;
- stars;
- national ranking;
- location;
- evaluation stage;
- staff verdict;
- recruiting state;
- race position;
- momentum/pressure where available.

Do not show every field merely because it exists.

### Right — Persistent scouting dossier

Clicking a prospect updates this panel immediately.

Avoid forcing the user through repeated browser-style modal open/close cycles.

A separate **Open Full Profile** action can still open the full recruit profile.

Suggested dossier structure:

**MARCUS HILL**  
QB · 6'3" · 202  
Naperville, IL  
★★★★ · #48 NAT

**STAFF READ**  
Potential impact starter

**ATHLETICISM**  
`████████░░`

**ARM TALENT**  
`██████????`

**PROCESSING**  
`████??????`

**Evaluation confidence: 63%**

**RECRUITMENT**

1. Iowa — 782
2. Northern Illinois — 748 ↑
3. Wisconsin — 701

Decision pressure: **HIGH**

Actions:

- Quick Film
- Full Evaluation
- Priority Push
- Remove from Board

## Visual scouting reveal

Scouting uncertainty should be visible in the object itself.

Examples:

Unknown: `??????????`

Partial: `████??????`

High confidence: `███████░░░`

As evaluations improve, the visual uncertainty tightens.

This should use **only information already legitimately visible to the staff/player**.

## Preserve Table View

Mandatory.

Top-level mode switch:

`Workspace | Table`

The existing dense board remains useful for bulk work, sorting and analysis.

---

# 8. Milestone D — Development Lab

**Priority:** Very High  
**Impact:** 5/5  
**Difficulty:** ~3.5/5

The game already has development receipts and results logic. Now make development legible over time.

## Individual progression

Centerpiece:

`68 → 72 → 75 → 78`

Graph observed historical ratings/events across seasons and camps.

Example markers:

- Freshman arrival
- Spring development
- Fall camp
- End of season

Do not graph hidden potential.

## Attribute changes

Spring Development example:

| Attribute | Before | After | Change |
|---|---:|---:|---:|
| Throw Power | 82 | 84 | +2 |
| Accuracy | 71 | 74 | +3 |
| Awareness | 64 | 67 | +3 |

Emphasize meaningful movement visually.

## Development story

Translate the existing receipts into readable observed summaries.

Example:

**Strong spring**

Brooks made meaningful gains in accuracy and processing. Athletic development was limited.

**Observed pattern:** Steady progression

Again: observed evidence only, not hidden curve labels.

## Team-level development dashboard

Include:

### Biggest Risers

+6 WR Marcus Reed  
+5 CB Alan Pierce  
+5 LB Jordan Smith

### Stalled

0 QB Evan Carter  
+1 DT Marcus Allen

### Position Groups

QB +2.8  
RB +1.7  
WR +3.4  
OL +2.1

The interface should answer:

> **Is this program actually developing talent?**

---

# 9. Milestone E — Command Center 2.0

**Priority:** High  
**Impact:** 4.5/5  
**Difficulty:** ~3/5

Do not throw away the existing dashboard presentation work. Refine it into the true home screen.

## Hero

Program identity, record/rank and upcoming matchup should have one obvious hierarchy.

Avoid duplicate `NEXT UP`, duplicate last-result cards and other repeated facts.

## Needs Attention

Create a true decision queue.

Examples:

- 2 recruits near decisions
- QB1 questionable
- Development plan incomplete
- Staff recommendation available

## This Week

Group the major weekly actions:

- Recruiting
- Training
- Depth chart
- Game plan
- Advance

## News / world feed

Use actual simulation events to make the universe feel alive:

- results;
- ranking movement;
- commitments/flips;
- coaching changes;
- awards;
- injuries;
- rivalry developments;
- notable performances.

No fabricated filler.

---

# 10. Milestone F — Roster and Depth Chart Studio

**Priority:** High  
**Impact:** 4/5  
**Difficulty:** ~4/5

## Modes

`Roster | Position Groups | Depth Chart | Development`

## Roster

Keep sortable table view available.

Default visual view can group by position.

Example:

**QUARTERBACKS**

QB1 Jalen Brooks — 78 — JR  
QB2 Marcus Bell — 72 — SO  
QB3 Tyler Grant — 67 — FR

## Position Groups

Surface:

- group grade;
- starter quality;
- depth;
- experience;
- development trajectory.

## Depth Chart

Football is spatial. Use a visual formation board where practical.

Offense example:

`WR — LT LG C RG RT — TE`  
`             QB`  
`             RB`

Represent players as compact tiles.

Do not make drag-and-drop mandatory if simple click/select controls are more reliable on mobile.

## Position battles

Visual comparison should include:

- rating;
- camp grade;
- experience;
- scheme fit;
- recent performance when available.

---

# 11. Milestone G — Player and Recruit Identity

**Priority:** High  
**Impact:** 4.5/5  
**Difficulty:** ~3/5

Player Profile is already one of the stronger surfaces. Build a consistent identity language around it rather than starting over.

## Roster player identity card

Example:

**#12 JALEN BROOKS**  
QB · JR · 6'2" · 211

Portrait + team mark

**78 OVR**

Field General

Starter · Healthy · Hot

Observed progression:

2029 — 68  
2030 — 73  
2031 — **78**

## Recruit identity

Recruit profiles should deliberately emphasize uncertainty rather than current OVR dominance.

Example:

★★★★  
#78 National  
#9 QB

**Staff Verdict:** High-upside starter  
**Evaluation confidence:** 71%

This should visually reinforce the difference between a known roster player and an uncertain prospect.

---

# 12. Milestone H — Staff Front Office

**Priority:** Medium-High  
**Impact:** 3.5/5  
**Difficulty:** ~3.5/5

Staff now has enough mechanical identity to support a real organizational view.

## Staff tree

Example:

```
              HEAD COACH
              Sam Turner

       OC                    DC
    Mike Hall           Robert Jones

 QB / RB / WR           DL / LB / DB
```

Add support/recruiting/development roles beneath as appropriate to the actual staff model.

## Coach identity card

Include legitimate known information such as:

- role;
- age;
- career record;
- coaching identity;
- recruiting/development specialties;
- scouting/evaluation specialties;
- evaluation history/ledger outcomes.

The Staff Evaluation Ledger should be visually understandable rather than buried in text.

---

# 13. Milestone I — Game Day and Season refinement

**Priority:** Medium  
**Impact:** 3.5/5  
**Difficulty:** ~3/5

Game Center already received major presentation improvements. Refine rather than rebuild.

## Pregame

Use:

- team marks/helmets;
- rank/record;
- team grades;
- legitimate injuries;
- recent form;
- rivalry/series information when known;
- active game plan.

## Final result

A completed game should feel consequential.

Example:

**FINAL**

Northern Illinois 31  
Toledo 24

Then legitimate archived facts:

- player of game / statistical leaders;
- key team stats;
- turning point if derivable from real game archive/play-by-play;
- relevant consequences.

### Box-score prominence follow-up

Treat the statistical box score as a primary postgame destination rather than a
secondary tab players must discover inside Game Center.

- Put a prominent **View Box Score** action on the Game Day final-result card and
  the Command Center's latest-result presentation.
- Open that action directly on the permanent Box Score tab while retaining
  **Full Game Center** as the secondary path to the recap, drives, and play-by-play.
- Keep the latest game's Quick Box above postgame analysis when detailed data is
  available.
- Default each player-stat category to leader order and provide sortable columns
  plus player-team and category filters inside the full Box Score.
- Label the season navigation destination **Game Lab** because it opens the
  current-game workspace, not a completed game's modal.
- Preserve the existing archive, save, and simulation contracts; this is an
  information-hierarchy change only.

## Schedule

Use stronger hierarchy for important games and compact rows for routine information.

Do not turn every schedule row into a giant card.

---

# 14. Milestone J — Dynasty World, History and Trophy Room

**Priority:** Medium-High  
**Impact:** 4/5  
**Difficulty:** ~3/5

Long-term history is a core reason management games become addictive.

## Trophy room / achievements

Surface legitimate historical accomplishments:

- national championships;
- conference titles;
- bowl wins;
- rivalry trophies;
- major awards;
- notable program records.

## Program timeline

Example:

**2031**  
12–2  
Conference Champion  
#7 Final Ranking  
Cotton Bowl Winner

**2030**  
10–3  
Conference Runner-up  
#19 Final Ranking

## Recruiting class history

Use the existing scouting-history feedback loop.

Example:

**2031 CLASS — #23 NATIONAL**

★★★★ Marcus Hill — Diamond  
★★★★ John Davis — As Scouted  
★★★ Tyler Ross — Bust

This is where years-old scouting decisions should become memorable.

---

# 15. Milestone K — Premium asset pass

**Priority:** Later  
**Impact:** 3.5/5  
**Difficulty:** ~3/5

Use 3D/static assets where they create production value without creating a fragile runtime dependency.

## Best Blender candidates

### 3D helmets

Strong fit because team-logo infrastructure already exists.

Use a consistent helmet template with:

- shell;
- facemask;
- stripe treatment;
- school colors;
- existing school mark/logo.

Render static WebP/PNG variants rather than requiring live 3D.

Potential surfaces:

- Game Center;
- rivalry games;
- team pages;
- recruiting commitment graphics;
- title games.

### Trophies

Reusable categories:

- national championship;
- conference championship;
- bowls;
- rivalry trophy families;
- individual awards.

### Environment/stadium atmosphere

Use controlled background categories rather than pretending to have accurate custom stadium renders for every school.

## Portrait note

Do not replace Portrait V1 as part of this roadmap merely because Blender exists. Player faces are a separate project and should only change when a clearly superior approved system is ready.

---

# 16. Milestone L — Motion and interaction polish

**Priority:** Last  
**Impact:** 3/5  
**Difficulty:** ~2/5

Only after structure is correct.

Good uses:

- panel transitions;
- recruit dossier change;
- scouting reveal;
- ranking movement;
- commitment reveal;
- development-number progression;
- game-result reveal.

Avoid gratuitous bouncing/glowing/constant motion.

Motion should communicate state changes, not announce that CSS exists.

---

# 17. Recommended execution order

| Order | Milestone | Impact | Difficulty |
|---|---|---:|---:|
| 1 | Client Shell + Navigation | 5/5 | 3/5 |
| 2 | Design System Consolidation | 4/5 | 2.5/5 |
| 3 | Recruiting Workspace | 5/5 | 4/5 |
| 4 | Development Lab | 5/5 | 3.5/5 |
| 5 | Command Center 2.0 | 4.5/5 | 3/5 |
| 6 | Roster / Depth Chart Studio | 4/5 | 4/5 |
| 7 | Player / Recruit Identity | 4.5/5 | 3/5 |
| 8 | Staff Front Office | 3.5/5 | 3.5/5 |
| 9 | Season / Game Day refinement | 3.5/5 | 3/5 |
| 10 | World / History / Trophy Room | 4/5 | 3/5 |
| 11 | 3D helmets / trophy assets | 3.5/5 | 3/5 |
| 12 | Motion / final polish | 3/5 | 2/5 |

---

# 18. Tonight's implementation strategy

The roadmap is intentionally larger than one session. Tonight should proceed in bounded chunks.

## First target

**Milestone A — Client Shell + Navigation**

Recommended implementation sequence:

1. Inspect newest validated base and active branch state.
2. Inventory current global tabs/routes and map each to the new information architecture.
3. Build the desktop shell without deleting old routing behavior.
4. Add secondary navigation for Program / Recruiting / Season / World.
5. Move save/load utilities out of prime gameplay chrome without changing their functions.
6. Implement mobile drawer/bottom-navigation behavior.
7. Verify every existing destination remains reachable.
8. Verify `Advance Week`, save/load, program switch, dialogs and browser back/focus behavior that currently exists.
9. Test 1280px and 390px.
10. Commit and leave a continuation note before beginning Recruiting Workspace.

## Second target

**Milestone B/C — design-system consolidation, then Recruiting Workspace.**

Do not attempt to implement all twelve milestones tonight in one branch.

---

# 19. Validation expectations for every design milestone

At minimum, before promotion:

- `npm run build`
- relevant Node/unit tests
- normal browser UI suite
- storage/save regression suite when shell changes interact with save/load controls
- simulation audit if the normal release process requires it
- visual/manual browser verification at desktop and mobile widths

Specific manual smoke tests:

- new dynasty start;
- load existing save;
- navigate every global area;
- `Advance Week`;
- open/close Player Profile;
- open/close Recruit Profile;
- Recruiting actions;
- Staff screen;
- Game Center/Game Lab;
- offseason/portal access;
- no console errors;
- no horizontal overflow at 390px;
- keyboard/focus behavior remains usable where currently supported.

A presentation-only milestone should not be promoted if it silently changes simulation output or save shape.

---

# 20. Definition of success

This roadmap is successful when Dynasty Lab no longer feels like a deep browser game that has been progressively styled.

It should feel like a coherent application where:

- the shell tells the user where they are;
- the command center tells them what matters now;
- recruiting feels like scouting and roster building;
- development visibly tells a player's story;
- depth charts feel like football;
- staff looks like an organization;
- game day feels consequential;
- long-term history feels collectible and worth revisiting;
- dense data remains one click away whenever the user wants it.

The goal is not to make Dynasty Lab less complicated.

The goal is to make its complexity feel **intentional, navigable and worth paying for**.

---

# 21. Resume instructions for any future agent/chat

If asked to continue this roadmap:

1. Read this file first.
2. Inspect current GitHub production and active branches before changing anything.
3. Read `VISUAL_IDENTITY.md` and `docs/COMMERCIAL_POLISH_AUDIT.md` for the visual history and already-completed polish.
4. Do not redo completed visual fixes just because older audit language mentions them.
5. Determine which roadmap milestone is currently active from the newest design branch/continuation note.
6. Work in bounded commits.
7. Preserve simulation/save behavior unless the user explicitly expands scope.
8. Leave an updated handoff/reference note before stopping.

**Default next milestone if no newer design work exists: Milestone A — Client Shell + Navigation.**
