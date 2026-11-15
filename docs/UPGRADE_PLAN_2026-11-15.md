# Dynasty Lab: upgrades, synergy and fixes after v0.31.1

Written 2026-11-15 at source `2cc65d8` (v0.31.1). This is a plan: nothing in the game changed in this pass, and
no test suite was run for it. It follows `docs/RELEASE_GAMEPLAN_2026-11-11.md`, whose six releases have all
shipped, and picks up what that plan left open plus what fourteen releases since have made possible.

Each item is marked by how sure it is:

- **Confirmed**: read in the source or in the project's own notes on 2026-11-15.
- **Check first**: a search of the source found no link between the two systems, but nobody has traced the code
  path. The first step of the item is to confirm the gap is real.

## Where the game stands

The simulation is deep and stable, a coached game now has drive calls, defensive calls, timeouts and a live 3D
field, the offseason stops for real decisions, and the web build installs and plays offline. The weakest points
are no longer missing features. They are:

1. **Systems that do not talk to each other.** The draft, rivalries, the coaching tree, facilities, depth and
   Legacy each work on their own and feed little into the others.
2. **Nothing has been tried by a person on a real device** since v0.18: no iPhone, Safari or Firefox pass, no
   screen reader, no timed coached game, no thirty-season dynasty in a browser.
3. **The project's own map is out of date**, which costs every new session time.

## 1. Fixes

| # | Fix | Status | Where |
| --- | --- | --- | --- |
| F1 | **The 1.0 game plan describes v0.22.** Its "Not done" list still names test hooks in the release build, the linter, the `app.js` split, the fast test tier, timeouts, the live 3D field and decisions on the stop cards, all shipped between v0.23 and v0.31. Rewrite its status section. | Confirmed | `docs/RELEASE_GAMEPLAN_2026-11-11.md` |
| F2 | **`STATUS.md` opens with one paragraph of about 900 words** listing every release back to v0.12. Cut it to the current release, what is pending and the next action; the changelog holds the rest. Keep the "Last reconciled" line the docs test reads. | Confirmed | `docs/roadmap/STATUS.md`, `tests/docs-consistency.js` |
| F3 | **Legacy lives outside the save.** Achievements, cross-save records, the hall of fame and challenges are kept in `localStorage` only. A backup does not carry them, and neither does a move between the web and desktop builds. Include them in the export and offer to merge on import. | Confirmed | `legacy.js`, `STORAGE.md` |
| F4 | **The board bonus decision is still open.** v0.29.0 dropped the +10 a targeted prospect gave you in decision standings. It was flagged for the owner and never answered. | Confirmed | `recruiting-actions.js`, `docs/RECRUITING_TIMELINES.md` |
| F5 | **The narrowing warning did not reduce cuts in the soak** (11.8 against 11.9 a season). Either the staff policy cannot act on it in time or the warning comes too late. Find which, then give the warning a one-press response (offer, visit) on the card. | Confirmed | `recruiting-actions.js`, `tools/recruiting-soak.js` |
| F6 | **Portal NIL and promises are not on the portal stop card**; they still need the full screen. | Confirmed | `offseason-stops.js` |
| F7 | **ESLint is pinned one release behind a fix** for a moderate `minimatch` advisory (10.14.0; 10.15.0 fixes it and was a day old at the time). Bump it. | Confirmed | `package.json` |
| F8 | **Three hand-kept test lists.** `test`, `test:fast` and `test:slow` each name about a hundred files. A new test added to one and not the others is silently skipped. Generate the lists from one manifest that marks each file fast or slow, and fail if a file under `tests/` is in none. | Confirmed | `package.json`, `tools/node-test.js` |
| F9 | **Programs cannot be renamed** because the name is the key in saves, schedules and about a thousand test references. Move to the school id as the key, with the name as display only. Large and mechanical; do it alone in one release. | Confirmed | `app/16-history-save-format.js`, `schools-data.js` |
| F10 | **Saves still grow about 8 MB a season**, most of it the player archive (about 5 MB). The season rollup was measured and declined; the next candidate is a second, older tier for players who never started a game. Measure before building. | Confirmed | `docs/SAVE_SIZE_MEASUREMENT.md` |

## 2. Synergy: connect what already exists

These add little new state. Each makes one system's output another system's input, so a decision in one place is
felt somewhere else.

| # | Connection | What the player sees | Status |
| --- | --- | --- | --- |
| S1 | **Draft to recruiting.** Players drafted from a program at a position become a pitch factor for recruits at that position, decaying over about four classes. | "Three linemen drafted since 2028" on a tackle's pitch card; developing players pays off twice. | Check first |
| S2 | **Rivalry to recruiting.** When you and your rival both pursue a prospect, the last meeting's result nudges his interest, and beating the rival for him is recorded in the series page. | The rivalry matters in February, not only one Saturday. | Check first |
| S3 | **Coaching tree to hiring and recruiting.** Former assistants who are now head coaches elsewhere appear as a warm pool: easier to hire back, harder to recruit against in their region. | The tree stops being a display and becomes a network. | Check first |
| S4 | **Depth to Game Day through fatigue.** Starters tire over long drives and under tempo; a real second string holds the fourth quarter. The engine has almost no fatigue today. | Roles & Depth decisions show up in close games; tempo has a cost. | Check first |
| S5 | **Facilities to injuries and development.** The strength room shortens recovery and lowers soft-tissue injury odds; the practice building raises the ceiling on development plans. | Each facility upgrade names the players it helped that season. | Check first |
| S6 | **Game conditions to preparation.** The forecast is known midweek, so wind and rain appear on the weekly preparation choices and in staff drive-call advice, not only at kickoff. | "Wind 22 mph Saturday: staff suggest the run package." | Check first |
| S7 | **National timeline to The Wire.** A standing record or a repeat of a past upset is called out when it is about to happen, using the timeline that v0.30 already derives. | "The last unranked team to win here was in 2031." | Check first |
| S8 | **Legacy challenges to the weekly desk.** An accepted challenge shows its progress beside season goals. | One place for everything the season is being judged on. | Check first |

Rule for all of these: every new effect is shown where it applies, with its size, in the same explanation the
player already reads (the pitch breakdown, the injury note, the staff recommendation). No hidden modifiers.

## 3. Upgrades: new depth

| # | Upgrade | Why now | Size |
| --- | --- | --- | --- |
| U1 | **Difficulty and length at setup.** The setup screen says difficulty needs "real simulation support". One setting that scales levers that already exist: administration patience, recruiting pull, staff quality on offer and NIL budget. Three levels, shown before the first season, changeable between seasons. | Deferred twice; it is the most common first question from a new player. | Medium |
| U2 | **Captains and locker-room leadership.** Name up to four captains each fall. Leaders steady morale after a loss, lower transfer risk for their position group and give a small edge in one-score games. The source has no captain or chemistry system today. | Morale, promises and transfer risk exist but have no face. | Medium |
| U3 | **Playoff and bowl format options.** Choose the playoff size at setup (the current format, 8 or 12). | Named on the setup screen as waiting for simulation support. | Medium |
| U4 | **Conference realignment as a rare event.** Every few seasons a program on the rise is invited up and one is left out, with rivalries and schedules following. Depends on F9. | Thirty-season dynasties need the world to move. | Large |
| U5 | **A season-in-review reel.** The five biggest plays and decisions of the year replayed on the 3D field from recorded games, at the season stop. | The field, the recordings and the moments list all exist. | Small |

## 4. Engineering

- **E1. Per-file test timing, then a faster default.** The suite takes about 665 s on four cores; the timing work
  was started and stopped at v0.31.0. Finish it, move the slowest files to the slow tier and make `test:fast` the
  pre-push default.
- **E2. The next two hot spots**: `recruitPitchBreakdown` and the role-depth helpers (`rolePlayers`,
  `roleStarter`) in the game sim. Both need a cache that is cleared when a roster or position changes. Hold
  results byte-identical for a fixed seed, as v0.31.1 did.
- **E3. Build order from a manifest.** `app/manifest.json` orders the core; the feature modules are still a
  hand-ordered list in `tools/build.js`. Give each module declared dependencies and sort from them.
- **E4. Widen the linter** from errors only to unused variables in new and changed files.
- **E5. A real-device checklist that can be run in twenty minutes**: install, start a dynasty, coach a game,
  export, import, go offline. Record each run with device and date in one file so "not checked" stops recurring.
- **E6. Stricter script policy.** The page's policy allows inline scripts because the game is one inlined file.
  Hash the one script block at build time and drop `'unsafe-inline'`.

## 5. Order of work

Each release has one theme and an exit test, and can ship or slip alone.

| Release | Theme | Items | Exit test |
| --- | --- | --- | --- |
| v0.31.2 | Housekeeping | F1, F2, F7, F8, E1 | The docs test passes; a test file left out of the manifest fails the build; `test:fast` under 90 s. |
| v0.32 | Recruiting pays off twice | F4, F5, F6, S1, S2 | A ten-season soak shows cuts on warned prospects fall, and league prestige spread stays within the v0.29.1 range. |
| v0.33 | Depth matters on Saturday | S4, S5, S6, E2 | Coached and simulated results still match in distribution; a team with a thin second string loses measurably more fourth quarters. |
| v0.34 | Your career, carried | F3, S3, S7, S8, U5 | An export from the web build restores Legacy on the desktop build; old backups still import. |
| v0.35 | Your rules | U1, U2, U3 | Each difficulty level moves ten-season win totals in the stated direction on three seeds. |
| v0.36 | Identity keys | F9, F10 | Every v0.35 save opens with nothing the player can see changed; a renamed program survives a season and a reload. |
| v0.37 | A world that moves | U4 | A thirty-season run realigns at least twice with no orphaned rivalry, schedule gap or broken history page. |

E3 to E6 fit alongside any release. v0.32 and v0.33 touch different code and can run in parallel.

Synergy items change game balance. For each one: confirm the gap, add the effect at a small size, run
`npm run audit` and the relevant soak before and after, and record the numbers in `docs/` as earlier releases did.

## 6. Decisions for the owner

1. **The board bonus (F4).** Restore the +10 for targeting a prospect, or keep targeting neutral.
2. **Difficulty (U1).** Three fixed levels, or sliders for each lever.
3. **Fatigue (S4).** It makes depth matter and makes simulated blowouts slightly more common. Wanted, or leave
   stamina out of the engine.
4. **Renaming (F9).** Worth a whole release, or keep the 120 names fixed for good.
5. **Still open from the last plan:** signing certificates, a licence, and a person on a real phone. None of the
   work above needs them, and 1.0 does.

## 7. More ideas: depth without chores

Added 2026-11-15 at the owner's request. These are ideas, not findings: none has been checked against the source
beyond knowing the system it builds on exists. Each needs the same "confirm, add small, measure" steps as section 2.

**The test every idea here had to pass:**

- **No new weekly task.** A new decision happens once a game or once a season, never every week.
- **The payoff is seen, soon.** The choice is answered within the same game, or by a named moment later in the
  season, with the player's choice credited in the text.
- **Staff can do it.** Every choice has a default the staff take if the player ignores it, and ignoring it costs
  nothing but the upside.
- **It reads what is already saved** where it can, so it adds story before it adds state.

### Moments that reward what the player already did

| # | Idea | The gratification | Builds on | Size |
| --- | --- | --- | --- | --- |
| M1 | **"You saw him first."** When a prospect the player scouted or offered before he was rated highly becomes a starter, an all-conference pick or a draft pick, the game says so and shows the original scouting receipt beside the result. | Proof that the player's eye was right, years later. | Scouting receipts, player history, The Wire | Small |
| M2 | **Senior Day.** The last home game opens with the seniors, each with one career line (first start, best game, where he ranks in the record book). No decisions. | The roster the player built gets a goodbye. | Homegrown first starts, career records, ceremonies | Small |
| M3 | **Alumni in the pros.** Drafted players keep a one-line pro career that updates each offseason; the best appear in The Wire and on the program page. Feeds S1. | Players do not vanish at the draft. | Draft Night, player archive | Medium |
| M4 | **Ring of honor.** When a great player leaves, the player may retire his number or add him to a ring of honor, shown on the program page and in the yearbook. A handful per decade, so each one is a choice. | A permanent mark the player placed on purpose. | Hall of Fame, program history | Small |
| M5 | **Trophy case.** One screen with every trophy the program holds: rivalry trophies currently on campus, conference crowns, bowls, national titles, awards, with empty spaces for the ones a rival holds. | The art already made, collected in one place, with gaps that itch. | Rivalry trophies, turntables, awards art | Small |
| M6 | **Milestone wins.** The 50th, 100th and 200th win, the first win over a top-five team and the first road win at a rival get a short ceremony and a line in the career chronology. | Long dynasties get markers. | Career milestones, ceremonies | Small |
| M7 | **Nemesis and favourite opponent.** The game notices the coach the player cannot beat and the one they always beat, and says so before the next meeting. | Rivalries the player earned, not ones assigned. | Coach careers, series records, Around Your Program | Small |

### One choice, one big answer

| # | Idea | The choice | The answer | Size |
| --- | --- | --- | --- | --- |
| C1 | **Halftime adjustment.** | One of three at the half, each written from what actually happened in the first half ("They have run for 140: load the box"). | The third-quarter line on the live screen says what the adjustment did. | Medium |
| C2 | **The play you saved.** | One special call a game (a trick play, a fake, an all-out blitz), held until the player chooses the moment. | Played out on the 3D field; remembered in the recap whether it worked or not. | Medium |
| C3 | **The big visit weekend.** | Once a season, pick one home game to host the top targets on the board. | Win it and every visitor's interest jumps; lose badly and it drops. The game suddenly matters twice. | Medium |
| C4 | **The award campaign.** | Once a season, back one player for a national award. | He gets more featured touches and more attention in the award race; the rest of the offense gets slightly fewer. The awards ceremony credits the campaign. | Small |
| C5 | **A bet with the administration.** | Before the season, optionally promise one thing above the stated expectation (beat the rival, win the conference). | Deliver it and confidence and next year's budget rise more than usual; miss it and they fall. Skipping the bet changes nothing. | Small |
| C6 | **Spring game.** | None required: one watchable scrimmage at the spring stop. | Camp risers and position battles are revealed on the field instead of in a list; the player may name one winner on the spot. | Medium |

### A world with more faces

| # | Idea | What changes | Size |
| --- | --- | --- | --- |
| W1 | **Legacy recruits and package deals.** A few prospects each class are the younger brother or son of a former player of some program, or the high-school teammate of another prospect. Signing one tilts the other. | Recruiting stories that write themselves, from the player's own history. | Medium |
| W2 | **Former players return as coaches.** Some archived players reappear in the hiring pool years later, with their playing career on their card. Fits S3. | "Your 2029 quarterback wants to come home as position coach." | Medium |
| W3 | **Trap games and statement wins.** The game flags the week a tired, ranked team visits a hungry one, and names the win that changed how the season is seen. | Ordinary weeks get stakes, with no added decision. | Small |
| W4 | **Stadium atmosphere.** Sellout streaks, a home winning streak that gets a name once it is long enough, and night games against rivals that count for more at home. | Fan support becomes something the player can watch grow. | Small |
| W5 | **Program traditions.** Sustained achievements unlock a named tradition (ten straight home wins, five straight over the rival, four straight top-ten classes) with a small lasting benefit that ends if the streak does. | Something to protect, not just to reach. | Medium |

### Play again, show it off

| # | Idea | What it is | Size |
| --- | --- | --- | --- |
| P1 | **The one that got away.** Re-coach any archived game of the player's own from the opening kick, outside the dynasty. Nothing in the save changes. | Medium |
| P2 | **A season card to share.** One image of the season: record, final ranking, trophies, best player, biggest win. Saved to the device; nothing is uploaded. | Small |
| P3 | **Dynasty in one page.** A decade summary at every tenth season: titles, best team, best player, best class, the coach's record against each rival. | Small |

### Deliberately left out

These add depth and would also add a chore: weekly NIL bookkeeping, practice reps set position by position,
per-play calling, manual scheduling of every non-conference game, dorm, compliance or budget ledgers, and any
meter that must be topped up each week to avoid a penalty.

### Where they fit

M1, M2, M5, M6, M7, W3 and P2 are small and read existing data: they can ride with any release in section 5.
C1 and C2 belong with v0.33 (Saturday). C3, W1 and M3 belong with v0.32 (recruiting). M4, W2, P1 and P3 belong
with v0.34 (career). C4, C5, C6, W4 and W5 belong with v0.35 (your rules).

**If only five are built:** M1, C1, C3, M5 and W1. Together they reward scouting, make halftime a moment, make one
home game matter twice, collect the art in one place and let recruiting tell stories from the player's own past.
