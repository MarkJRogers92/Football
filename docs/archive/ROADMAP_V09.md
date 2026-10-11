# Dynasty Lab v0.9 Updated Roadmap Handoff

## Canonical project state

Repository: `MarkJRogers92/Football`
Canonical continuation branch: `codex/v081-save-continuation`

Before coding:
1. Read `CONTINUATION.md`
2. Read `STORAGE.md`
3. Confirm current branch head
4. Do not redo Milestone 1

## Milestone 1 status

Milestone 1 is complete on the newest v0.8.1 base.

Completed:
- safer archive persistence in IndexedDB
- complete portable JSON export/import
- deferred archive hydration
- migration/failure handling
- recruiting audit correction using per-team signees
- sparse packing in save round-trip tests
- current APP_VERSION on new universes
- generated `index.html` includes `storage.js`

Validation already completed:
- 52 engine checks
- 10 persistence scenarios
- 45 browser checks
- 4 real Chromium/IndexedDB scenarios
- recruiting audit: 15–30 signees/team, mean ~23.3
- build and syntax checks passed

Important caveat:
- actual iPhone Safari still needs direct validation
- production/default branch must not be changed automatically

## Global guardrails

Every v0.9 iteration must:
- remain save-compatible
- use additive/idempotent migrations
- preserve all historical careers
- preserve portable JSON export/import
- preserve hidden development profiles
- preserve fictional schools and original archetype naming
- avoid framework rewrites
- avoid fragile gzip-loader architecture
- avoid production/default-branch changes during development
- end with tests, build, commit, and continuation notes

Recommended bounded workflow:
1. Read `CONTINUATION.md` + `STORAGE.md`
2. Confirm branch head
3. Implement exactly one milestone
4. Add migrations
5. Add deterministic tests
6. Run engine tests
7. Run persistence tests
8. Run browser tests
9. Run simulation audit
10. Build generated output
11. Update `CHANGELOG.md`
12. Update `WORKLOG.md`
13. Update `CONTINUATION.md`
14. Commit
15. Stop

Do not allow a bounded chunk to become a scheduler/UI/framework rewrite.

# v0.9 design goal

v0.9 should make Dynasty Lab about:

**relationships, consequences, obligations, memory, persistent people, and legible football history.**

Success example:

> I recruited a five-star QB because my OC promised him early playing time. He lost camp to a sophomore, I broke the promise, and he transferred to Nebraska. My OC left for Nebraska the next year and helped recruit him there. Two seasons later Nebraska knocked me out of the playoff with that quarterback, and I can still open the archived box score years later to see exactly how he beat me.

If stories like this emerge naturally and remain visible in history, v0.9 has succeeded.

# v0.9.0 — Promises Become Debts

Goal: existing recruiting promises become persistent obligations rather than one-time pitch modifiers.

Recommended promise model:

```js
player.promises = [{
  id: "PR_000001",
  type: "EARLY_ROLE",
  seasonMade: 2030,
  madeWeek: 4,
  schoolId: "CHI",
  coachId: "C00000173",
  targetPosition: "WR",
  targetRole: "X",
  expectedGames: 8,
  expectedStarts: null,
  status: "ACTIVE",
  resolvedSeason: null,
  result: null,
  severity: 0,
  notes: []
}];
```

Initial promise types:
- `EARLY_ROLE`
- `POSITION_LOCK`
- `NO_REDSHIRT`
- `DEVELOPMENT_PLAN`
- `NIL_PRIORITY` can remain stored/passive until NIL is deeper

Audit rules:
- EARLY_ROLE: use actual participation, health, starts/snaps/appearances; outcomes FULFILLED/PARTIAL/BROKEN
- NO_REDSHIRT: binary except legitimate injury exception
- POSITION_LOCK: official position/role must remain consistent unless player requested change
- DEVELOPMENT_PLAN: verify matching individual development focus was actually provided

Exceptions:
- major injury
- player-requested position change
- voluntary portal entry
- future academic/disciplinary absence
- future medical retirement

Consequences:
- morale
- staff trust
- transfer risk
- future recruiting credibility
- future high-school relationship
- future recruit-pitch breakdown

Conceptual reaction:
```js
reaction =
  breachSeverity
  * player.promiseSensitivity
  * personalityFactor
  * coachRelationshipFactor;
```

UI:
- player profile gets a Promises section
- Weekly Hub surfaces significant breaches, not every minor fulfillment

Event ledger foundation:
```js
addDynastyEvent({
  type,
  season,
  week,
  schoolIds,
  playerIds,
  coachIds,
  recruitIds,
  gameIds,
  importance,
  metadata,
  summary
});
```

Minimum event types:
- `PROMISE_MADE`
- `PROMISE_FULFILLED`
- `PROMISE_PARTIAL`
- `PROMISE_BROKEN`

Recommended event shape:
```js
{
  id: "EVT_2033_08_000144",
  season: 2033,
  week: 8,
  timestampOrder: 144,
  type: "PROMISE_BROKEN",
  importance: 68,
  schoolIds: ["CHI"],
  playerIds: ["P_88291"],
  coachIds: ["C_00173"],
  recruitIds: [],
  gameIds: [],
  summary: "Chicago broke Marcus Tate's Early Role promise.",
  metadata: {
    promiseId: "PR_9281",
    expectedGames: 8,
    actualGames: 2
  }
}
```

Store data + plain summary, not rendered HTML.

Coach identity foundation:
- do not build full coaching market yet
- every coach gets a permanent unique ID
- coach IDs survive save/load, offseason, firing, staff movement, archive/history
- promises store `coachId`, not just role text
- use universe-level counter like `universe.nextCoachId`
- never derive coach identity only from names

Migration:
```js
player.promises ??= [];
universe.events ??= [];
coach.id ??= assignStableCoachId();
```

All migrations must be idempotent.

Tests:
- Early Role fulfilled
- Early Role broken
- No Redshirt fulfilled
- No Redshirt broken
- Position Lock broken
- injury exception
- promise persists save/load
- promise persists rollover
- broken promise changes morale/transfer risk
- same audit does not run twice
- event ledger gets exactly one resolution event
- coach IDs persist save/load

Exit criteria:
a recruit can sign with a promise, play a season, have the promise audited, receive consequences, and retain history after reload.

# v0.9.1 — Transfers Have Destinations and Memory

Goal: portal players remain living members of the universe.

Destination weighting should consider:
1. original recruiting top five
2. prior offers
3. geography
4. playing-time opportunity
5. prestige
6. scheme fit
7. pipeline
8. coach relationship
9. coach who recruited him now working elsewhere
10. broken-promise reason

Starting score concept:
```js
score =
  priorInterest * 0.20 +
  opportunity * 0.25 +
  schemeFit * 0.15 +
  coachRelationship * 0.20 +
  proximity * 0.10 +
  prestige * 0.10;
```

Tune statistically, not as fixed truth.

Transfer history:
```js
player.transferHistory = [{
  season: 2032,
  fromSchoolId: "CHI",
  toSchoolId: "WIS",
  reason: "BROKEN_PROMISE",
  priorRelationship: 72,
  coachId: "C00000173"
}];
```

Preserve:
- class year
- redshirt history
- stats
- injuries
- promises
- career history
- identity

Do not clone the player.

Weekly Hub:
> FAMILIAR FACE — Former Chicago QB Marcus Tate will start for Wisconsin this week.

Raise importance for former starter, elite recruit, broken-promise transfer, rivalry/championship game.

Tests:
- valid destination
- no same-cycle return to current school
- top-five weighting works statistically
- roster caps safe
- history survives
- stats remain one career
- former-player matchup alert works
- save/load preserves destination

# v0.9.2 — Permanent Game Center / ESPN-style Box Scores

This is an early-v0.9 requirement and should happen before the deeper coaching market work.

## Goal

Completed games must be easy to revisit and understand.

The current postgame/result flow is too confusing. Replace it with a dedicated, persistent **Game Center** experience modeled on the clarity of ESPN-style game pages.

## Permanent game identity

Every completed game gets a permanent stable `gameId`.

Example:
```js
{
  id: "G2034_W14_CHI_MIC_001",
  season: 2034,
  week: 14,
  phase: "PLAYOFF",
  homeTeamId: "MIC",
  awayTeamId: "CHI",
  final: true
}
```

Do not derive identity only from matchup text.

## Archived game record

Store enough information so the same game can be reopened many seasons later without rerunning the simulation.

Recommended record:

```js
{
  id,
  season,
  week,
  dateLabel,
  phase,

  homeTeamId,
  awayTeamId,

  homeRank,
  awayRank,
  homeRecordBefore,
  awayRecordBefore,

  venue,
  attendance: null,

  score: {
    away: 31,
    home: 27,
    quartersAway: [7, 3, 7, 14],
    quartersHome: [10, 7, 7, 3]
  },

  teamStats: {},
  playerStats: {},
  scoringSummary: [],
  drives: [],
  plays: [],
  injuries: [],
  leaders: {},

  storyFlags: [],
  generatedAtSeason: 2034
}
```

Avoid storing excessive redundant UI markup. Store compact structured data.

## Entry points

A completed game should be clickable from:
- schedule
- Weekly Hub
- team history
- school page
- standings/results views where appropriate
- future player history/encyclopedia
- future rivalry history
- future record/event ledger entries

## Game Center layout

Top section should immediately answer:
- who won
- final score
- quarter-by-quarter scoring
- team records/rankings
- date/week
- venue
- postseason/conference context where relevant

Example:

> Chicago Metropolitan 31 — Michigan Commonwealth 27  
> Chicago scored 14 unanswered in the fourth quarter.  
> QB Marcus Tate: 24/33, 318 YDS, 3 TD, 1 INT

## Tabs

Use:

**Summary | Box Score | Drives | Play-by-Play**

If the engine does not yet retain enough detail for a full play-by-play, preserve the tab/interface and populate only what actually exists. Do not fabricate missing events.

## Summary tab

Include:
- final score
- quarter scoring
- team records/rankings
- venue/date
- game leaders
- key scoring summary
- notable injuries
- major story flags
- short generated "why the game happened" summary based on actual stats/events

## Box Score tab

### Team statistics
At minimum where tracked:
- first downs
- total yards
- passing yards
- rushing yards
- turnovers
- sacks
- penalties
- third down
- fourth down
- possession if available
- red-zone results if available

### Passing
Columns:
- Cmp
- Att
- Yds
- TD
- INT
- Sacks
- Long

### Rushing
Columns:
- Car
- Yds
- Avg
- TD
- Long

### Receiving
Columns:
- Rec
- Yds
- Avg
- TD
- Long
- Targets if tracked

### Defense
Columns:
- Tkl
- TFL
- Sack
- INT
- PD
- FF

Use only fields the simulation actually tracks. Do not synthesize fake precision.

### Kicking / Punting
Where available:
- FG made/attempted
- XP
- punting attempts
- average
- long
- touchbacks/inside 20 if later tracked

## Drives tab

If drive data exists, show:
- drive start
- number of plays
- yards
- time if tracked
- result
- scoring play
- turnover

If only partial drive-level data exists, show the subset cleanly.

## Play-by-Play tab

Use actual retained play data only.

Long term this connects naturally to the deeper snap engine / 2D viewer.

## Historical durability

A 2034 playoff game should still open correctly in 2048.

Game archive must survive:
- save/load
- JSON export/import
- season rollover
- browser archive persistence

Game records must not depend on mutable current roster/team values for old historical presentation.

For example, the game should preserve the team ranking and record at the time it happened.

## Player-history linkage

Future player chronology can contain:

> 2034 National Semifinal — 412 passing yards, 4 TD

Clicking that line should open the archived Game Center.

The same should eventually work from:
- coach career milestones
- school timeline
- rivalry history
- records
- championship pages

## Event ledger integration

Important games should generate events carrying `gameId`.

Examples:
- `GAME_COMPLETED`
- `MAJOR_UPSET`
- `RECORD_BROKEN`
- `RIVALRY_STREAK_ENDED`
- `CHAMPIONSHIP_WON`
- `FORMER_PLAYER_REVENGE`

## Storage/performance guardrails

Do not let game history destroy long-save performance.

Preferred approach:
- keep compact structured records
- archive old game detail similarly to player history if necessary
- defer large play-by-play hydration where possible
- do not preload decades of every play on initial load
- preserve full portable JSON history unless user explicitly chooses retention/pruning

If full play-by-play is too expensive initially:
- preserve box score + scoring summary + drive summary permanently
- treat detailed play-by-play as optional/deferred

## Tests

Minimum:
- completed game receives stable `gameId`
- Game Center opens from schedule
- final score matches simulation result
- quarter scores add to final
- player box stats match game result
- team stats match stored game
- archived game survives season rollover
- archived game survives save/load
- archived game survives JSON export/import
- old game shows historical ranking/record, not current ranking
- missing optional drive/play data does not break UI
- event ledger can link back to `gameId`
- former-player matchup/history can link into Game Center
- mobile layout works at iPhone viewport

## Exit criteria

A user can finish a game, return to the schedule, click the result, and immediately understand what happened through a clean permanent box score page.

They can reopen that same game years later and see the same historical record.

# v0.9.3 — Persistent Coaching Careers

Recommended coach object:
```js
{
  id,
  firstName,
  lastName,
  age,
  role,
  schoolId,
  ratings: {
    recruiting,
    evaluation,
    development,
    playCalling,
    adaptability,
    discipline,
    gameManagement
  },
  specialties: [],
  schemeOffense,
  schemeDefense,
  personality: {
    ambition,
    loyalty,
    ego,
    patience
  },
  regions: {},
  careerHistory: [],
  relationships: {},
  contract: {}
}
```

Do not expose all hidden personality values directly. Prefer descriptions like:
- Highly ambitious
- Strong Midwest recruiter
- QB development specialist

Career stint:
```js
{
  schoolId,
  role,
  startSeason,
  endSeason,
  record,
  titles,
  playoffAppearances,
  notablePlayers,
  draftPicks
}
```

Recruit/player relationship:
```js
recruit.coachRelationships = {
  C00000173: 68,
  C00000923: 41
};
```

Keep school interest separate from coach relationship.

Tests:
- coach ID never changes
- school move preserves history
- ratings/personality persist
- recruit/player links still point to same coach
- generated coach distributions sane
- retirement archives coach rather than deleting

# v0.9.4 — Coaches Take Relationships With Them

When a coach leaves, identify:
- recruits he was primary recruiter for
- current players he recruited
- players he developed closely
- scheme-dependent players

Portable relationship concept:
```js
portableRelationship =
  existingRelationship
  * coachRelationshipPortability
  * recruitPersonalityFactor;
```

The effect should create pressure, not instant flips.

Add:
```js
recruit.primaryRecruiterCoachId
```

Hub example:
> RECRUITING FALLOUT — Three Chicago commits had strong relationships with departing OC Darren Caldwell.

Current players may get:
- transfer-risk bump
- portal interest toward coach's new school

Tests:
- departing coach transfers relationship correctly
- unrelated recruits unaffected
- current-player transfer risk changes
- relationship caps respected
- firing and voluntary departure both work
- save/load preserves changes

# v0.9.5 — Coaching Market

Open jobs when:
- coach fired
- contract ends
- coach retires
- coach accepts another job
- coordinator promoted

States:
- OPEN
- INTERVIEWING
- OFFERED
- FILLED

Candidates:
- coordinators
- position coaches
- unemployed coaches
- lower-prestige HCs
- internal promotions

Interest factors:
- prestige
- salary
- role
- geography
- ambition
- staff relationship
- scheme
- career trajectory
- current job security

Initial user actions:
- Interview
- Make Offer
- Withdraw Offer
- Promote Internally

Initial offer terms:
- salary
- years
- role
- play-calling authority

Avoid overbuilding negotiation initially.

AI hiring should use fit, not just highest rating.

Concept:
```js
hireScore =
  ability +
  schemeFit +
  recruitingRegionFit +
  affordability +
  reputationFit +
  relationshipFit +
  randomness;
```

Tests:
- every opening fills
- no coach holds two simultaneous jobs
- candidate interest works
- AI does not routinely hire impossible candidates
- internal promotion works
- contracts persist
- old stint closes/new stint opens

# v0.9.6 — Decommits, Flips, Scholarship Scarcity

Commitments become persistent pressure states:

```js
{
  schoolId,
  state: "COMMITTED",
  strength: 86,
  committedWeek: 7
}
```

States:
- OPEN
- LEAN
- COMMITTED
- SIGNED
- DECOMMITTED

Strength rises with:
- coach stability
- strong visit
- team success
- promise credibility
- pipeline
- opportunity

Strength falls with:
- coach departure
- scheme change
- depth filling up
- rival surge
- broken institutional promises
- pulled-offer threat

Flips possible when:
- commitment strength falls enough
- competing interest becomes high enough
- signing deadline approaches
- trigger event occurs

Flips should be uncommon but memorable.

Scholarship availability should derive from:
```text
target roster limit
- returning scholarship players
- current signed/committed recruits
```

Not a flat class cap.

Allow Pull Offer.

Consequences:
- recruit becomes available
- program credibility hit
- high-school relationship hit
- other recruits may react
- event ledger entry

Pulling a committed offer should be much worse than pulling an uncommitted one.

Tests:
- commitment strength changes correctly
- coach departure can trigger decommit
- flips occur at sane rates
- scholarship count correct
- unlimited classes impossible
- pulled offer frees spot
- pulled recruit can sign elsewhere
- recruiting audit sane
- no roster explosion

# v0.9.7 — Scheme Hangover + Position Change Agency

Scheme transition:
```js
team.schemeTransition = {
  from: "Ground Pressure",
  to: "Tempo Spread",
  startSeason: 2033,
  familiarity: 35
};
```

Familiarity improves with:
- spring practice
- fall camp
- coaching quality
- returning players
- scheme stability

Effects:
- role fit rescored
- opportunities change
- transfer risk changes
- camp reports mention fit

Do not apply arbitrary global OVR penalty.

Target feel:
- Year 1: meaningful transition cost
- Year 2: smaller
- Year 3: mostly installed

Position-change willingness considers:
- promises
- personality
- playing time
- NFL projection
- body fit
- coach trust
- transfer alternatives

States:
- EAGER
- OPEN
- RELUCTANT
- REFUSES

Forcing a reluctant change can hurt morale/trust.

Tests:
- scheme change triggers transition
- same scheme does not
- familiarity improves
- role-fit differences affect transfer risk
- Position Lock affects willingness
- refusal works
- forced change affects morale/trust

# v0.9.8 — Story Surface Pass

Record chase alerts:
- compare current pace to school/national records
- account for games remaining
- only show realistic chases

Example:
> RECORD WATCH — RB Darius Cole needs 243 rushing yards over the final two games to set the Chicago Metropolitan season record.

High-school relationship evolution:

```js
school.highSchoolRelations[hsId] = {
  score: 61,
  history: []
};
```

Positive:
- player starts
- award
- graduation
- drafted
- fulfilled promises

Negative:
- unhappy transfer
- pulled scholarship
- broken promise
- repeated mishandling

Keep effect meaningful but not overpowering.

Suggested Weekly Hub importance:
```text
90 championship
85 major upset
80 five-star flip
75 coach hired/fired
70 broken major promise
65 former-player revenge game
60 record broken
50 transfer
40 minor recruiting movement
```

Show top events, not everything.

Player chronology example:
```text
2030 — Signed with Chicago Metropolitan
2031 — Redshirted
2032 — Early Role promise broken
2033 — Transferred to Wisconsin Commonwealth
2034 — Named All-Great Lakes
2034 — National Semifinal: 412 passing yards, 4 TD
```

The game line can link directly to the archived Game Center.

# Calibration before v0.9 release

Run a multi-season automated dynasty audit, ideally 10 seasons.

Track:
- promise fulfillment %
- promise breach %
- transfers/team/year
- transfer causes
- decommitment %
- flip %
- coach turnover
- coach promotions
- scheme changes
- scholarship utilization
- unsigned recruits
- roster sizes
- morale distribution
- transfer-risk distribution
- high-school relationship distribution
- record alerts/year
- event volume/team/year
- archived games/season
- average archived game payload size
- history-load time
- Game Center reopen failures
- box-score stat consistency

Initial ranges to test around:
- major promise breach: ~8–18%
- flips: ~3–8%
- decommits: ~4–10%
- coordinator turnover meaningfully higher than HC turnover
- AI pulled committed offers: rare
- scheme transitions: meaningful, not constant
- transfers: enough to matter, not roster chaos

Tune against simulation.

# Save migration strategy

Prefer additive initialization:

```js
player.promises ??= [];
player.transferHistory ??= [];
universe.events ??= [];
universe.gameArchive ??= [];
universe.coachArchive ??= [];
team.highSchoolRelations ??= {};
```

Migrations must be idempotent.

Never use display names as stable IDs.

Persistent IDs required for:
- players
- coaches
- schools
- high schools
- promises
- events
- games

# Backlog after v0.9

## Injury stories
- better durability differentiation
- rare permanent athletic loss
- medical redshirt
- comeback arcs

## v0.10 — Encyclopedia / program ledger UI
- school timelines
- player timelines
- coach history
- coaching trees
- rivalry history
- record books
- recruiting archives
- draft history
- historical Game Center links

## Legacy recruits
18–22 seasons after an archived player:
- generate recruit with matching surname/hometown
- tag as legacy/son
- interest lean toward or against father's school based on career outcome

## Rivalries
- 1–2 designated rivals per school
- protected scheduling
- series record
- streaks
- shared-territory recruiting effect
- head-to-head tiebreaker support

## Athletic Director expectations
- yearly mandate
- prestige/class/rivalry goals
- budget/staff consequences
- hold user firing until career-mode decision is explicit

## Conference realignment
Keep as later major feature because scheduler/history implications are significant.

# Portrait system — parallel side project

Approved direction: deterministic 2.5D/voxel-style player portraits.

Requirements:
- deterministic player seed
- same identity across years
- strong variation in head shape, skin tone, hair, facial hair, eyes, brows, nose, neck/shoulders, jersey colors/numbers, accessories
- physique tied to height/weight/position
- subtle age/development changes without changing core identity
- browser-native Canvas/SVG preferred
- cache rendered portraits
- build standalone Portrait Lab first
- generate 50–100 random players at once to inspect repetition
- do not use per-player AI generation

This can proceed separately from v0.9 save/coaching work and merge later.

# Preserved brainstorm list

1. Promises become debts
2. Transfers land somewhere and remember
3. Coaches take relationships with them
4. Injuries that end one career and start another
5. Legacy recruits
6. Decommits and flips
7. Scholarship scarcity with pulled offers
8. Program ledger that writes itself
9. Rivalries with a scoreboard
10. Players can say no to a position change
11. Record chases surfaced in the hub
12. Pipelines earned/lost through specific players
13. Scheme changes have a hangover
14. Athletic director expectations
15. Conference realignment with membership memory
16. Permanent ESPN-style postgame Game Center / box-score archive

# Immediate next coding instruction for ChatGPT Work

Do only v0.9.0 first.

Suggested resume prompt:

> Continue Dynasty Lab from `MarkJRogers92/Football` branch `codex/v081-save-continuation`. Read `CONTINUATION.md` and `STORAGE.md` first. Do not redo Milestone 1. Implement v0.9.0 only: Promises Become Debts, stable persistent coach IDs, and the additive dynasty-event ledger foundation. Preserve save compatibility and portable JSON. Add deterministic tests, run the existing engine/persistence/browser/audit/build checks, update `CHANGELOG.md`, `WORKLOG.md`, and `CONTINUATION.md`, commit the bounded chunk, and stop. Do not touch production/default branch.

After v0.9.0 is reviewed, proceed to v0.9.1 transfers, then v0.9.2 permanent Game Center/box scores before the deeper coaching iterations.
