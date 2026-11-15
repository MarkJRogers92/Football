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
