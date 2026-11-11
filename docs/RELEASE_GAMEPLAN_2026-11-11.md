# Dynasty Lab: review and game plan to a 1.0 release

Reviewed 2026-11-11 at source `f9e43f2` (v0.17.1). This is a plan, not a status
report: nothing in the game changed in this pass.

## Verdict

Dynasty Lab is a deep, stable simulation with a strong front-office presentation.
It is not yet release ready, for four reasons, in order of weight:

1. **A long dynasty outgrows its save.** The portable save is 144 MB after twelve
   seasons and still growing about 9 MB a season. This is the one problem that
   can cost a player their dynasty.
2. **Game Day is thin where it should be the payoff.** A fully coached game is
   about seven decisions and a text feed, and can be clicked through in seconds.
3. **The offseason can be skipped with one button**, and the world lacks the
   identity (mascots, distinct names) that makes a player care who they beat.
4. **Distribution is still alpha.** The Mac build is unsigned, there is no licence,
   no crash screen, and no way to learn that a player's game broke.

Everything else found is polish, listed below with evidence.

## What was checked, and what was not

Checked on a fresh build (`npm run build`, output identical to the committed
`index.html`):

- A new dynasty through Quick Start at 1440x900 and 390x844, every one of the 15
  screens, four advanced weeks, a fully coached live game, a simulated season, the
  postseason, the whole offseason and eleven weeks of year two. Zero console errors
  or page errors throughout.
- `tools/longrun.js` for twelve seasons (seed 7).
- A heuristic scan at phone width for touch-target size, unnamed controls and
  small text. It is a script, not an audit with a screen reader.
- The build, CI workflows, Electron shell settings, storage contract and docs.

Not checked: the browser test suites, `npm run audit`, packaged desktop builds,
Safari, Firefox, a real phone, and a browser dynasty longer than two seasons. The
Node unit suite was started but had not finished when this was written; it is
slow enough to be an item in its own right (see Engineering).

## What is already strong

- **Stability.** A full season simulates in about 6 s in the browser and 8 to 9 s
  a season in Node, flat across twelve seasons. Cold load is under 2 s; a new
  dynasty is ready in under 3 s.
- **League health holds.** Over twelve seasons mean prestige stayed at 66.4 to
  66.5 and its spread narrowed only from 16.7 to 15.8. Eight different programs
  won titles, with one three-time and two two-time champions.
- **The weekly desk.** One clear next action, a factual postgame stopping point,
  and a visible saved state.
- **Recruiting and roster depth** are the richest systems in the game and read
  well at both widths.
- **Desktop shell hygiene.** `contextIsolation`, `sandbox`, no `nodeIntegration`,
  navigation and new windows denied.

## Findings

### A. Confirmed defects (fix first)

| # | Defect | Evidence | Where |
| --- | --- | --- | --- |
| A1 | The postgame Game Day panel is cut off at 1440 px. The home team, its score and the third stat column are not visible, and player-leader lines are clipped. In the reviewed game the player's own winning score was the part hidden. | `.v2-release-host` measured 1938 px of content in a 1154 px box with `overflow:hidden`. | `game-engine-v2-presentation.css`, `game-engine-v2-presentation.js` |
| A2 | Staff recommend a 59-yard field goal on 4th and 9, tied, in rain. The default policy kicks from the opponent's 42 or closer whenever more than 2 yards are needed, with no regard for kicker, weather or score, and a field goal is offered out to 67 yards. | Seen live; the rule is `oldFourthDownPolicy` (`fieldPosition>=58`). | `game-engine-v2-decisions.js` |
| A3 | The header week and the page week disagree. The header reads "2027 · Week 3" while the same screen says "Game Day · Week 4" and "Week 4 Briefing". | Seen on This Week and Game Day at both widths. | header status line in the client shell |
| A4 | "1 sacks". | Top-performer and key-performer lines. | `season-presentation-adapter.js` (`performerSummary`) |
| A5 | After a quick-simulated game, Game Day shows "Drive detail unavailable for this archived game" above the next matchup. It reads as an error on the screen a player visits most. | Seen every week after a simulated game. | Game Day last-game card |
| A6 | The same final is shown three times on one screen after a coached game (Last Game card, Quick Box, Game Day panel). | Postgame Game Day. | Game Day page composition |

### B. Risks that block a release

**B1. Save growth.** Twelve-season run, portable save size:

| Season | 1 | 3 | 6 | 9 | 12 |
| --- | --- | --- | --- | --- | --- |
| Save | 38.5 MB | 63.4 MB | 90.2 MB | 117.1 MB | 144.3 MB |

`docs/SAVE_SIZE_MEASUREMENT.md` already names the drivers (`gameArchive` and
`playerArchive`, about 80% of growth) and `STORAGE.md` notes that export and first
archive access still build the complete JSON in memory. Browser storage after one
season was 12 MB, so the resident footprint is smaller than the export, but the
export is the player's only backup and the only way to move between web and
desktop. A thirty-season dynasty would export at roughly 300 MB. Nobody has
measured whether that export succeeds on a phone or an 8 GB laptop.

**B2. No crash path.** There is no `window.onerror` or `unhandledrejection`
handler. If a render throws mid-week the player sees a frozen screen and has no
prompt to reload or export.

**B3. Unsigned Mac build.** Already documented in `docs/NOTARIZATION.md` as
blocked on an Apple Developer account. The Windows build is also unsigned, so
SmartScreen will warn.

**B4. No licence or terms.** The repository has no `LICENSE`, and the game has no
credits screen for the bundled font (OFL) or generated art.

### C. Depth and feel

- **C1. Coached games are short on coaching.** The reviewed game offered seven
  decisions: one opening posture, three fourth downs, two PAT choices and one
  tempo call. There is no play calling, no defensive call, no timeout or
  challenge, and no field on the live screen; the animated field exists only in
  the replay.
- **C2. The offseason is seven presses of the same button.** Season review,
  departures, signing class, portal, spring, fall camp and the new season all
  advance from "Next:" on This Week with nothing that makes the player stop. A
  player who never opens the Offseason or Recruiting screens still completes it.
- **C3. Recruiting starts empty and stays empty.** After three weeks untouched the
  board held 0 targets with all 60 hours unspent, and "Staff handle recruiting"
  is off by default. v0.17.0 made passivity costly; a new player who has not
  found the board pays that cost without being told.
- **C4. Program identity is generic.** Of 120 programs, 37 are "X Commonwealth",
  30 "X University", 17 "X State" and 15 "X Metropolitan". There are no mascots
  or nicknames, so results read "Chicago Metropolitan 28, Philadelphia
  Metropolitan 21".
- **C5. Expectations messaging contradicts itself.** The season review read
  "8-5 against 8 expected, confidence 38 (Hot seat)". Meeting the stated
  expectation and winning a bowl moved confidence down from its seed of 45. Either
  the expectation shown is not the one being judged, or the maths is too harsh for
  the Quick Start program.
- **C6. Scoring flow has no detail.** Lines read "Chicago Metropolitan · TD · +7"
  with no scorer or play, although the play-by-play has the names.

### D. Presentation and accessibility

- **D1. Game Day is a long stack.** Before kickoff the page runs to about 2,600 px
  at desktop width: matchup, last game, situational playbook, matchup breakdown,
  week path, scout and prep, and only then the Coach It Live control.
- **D2. Phone density.** The heuristic scan at 390 px found 12 to 36 controls per
  screen under 32 px in one dimension (worst: Roles & Depth 36, Staff 34), and 22
  to 80 text elements per screen under 11 px, some at 8 px.
- **D3. Unnamed controls.** 25 controls on This Week have no text, label or title
  (5 to 8 on other screens).
- **D4. Three `h1` elements** are present on every screen.
- **D5. Toasts overlap content** at phone width, covering the Coach It Live control
  and performer cards for their duration.

### E. Engineering

- **E1. `app.js` is 565 KB in 4,784 lines**, with 52 lines over 1,000 characters
  and the longest at 4,954. It holds about 750 functions. Feature modules are
  concatenated into its closure by a hand-ordered list in `tools/build.js`. There
  is no linter, formatter or type check, so a typo in a rarely used branch is
  found by a player.
- **E2. The unit suite is slow and serial-heavy.** `npm test` did not finish in
  ten minutes here. CI allows it sixty.
- **E3. Test hooks ship in production** (`window.__DL_TEST__`), including ones that
  mutate the universe.
- **E4. No Content-Security-Policy** in the web build or the desktop shell.
- **E5. Docs sprawl.** `docs/` holds about 100 files, most of them historical
  checkpoints, and `docs/roadmap/STATUS.md` opens with a 300-word paragraph of run
  numbers. The next contributor cannot tell what is current.

## The plan

Six releases to a 1.0 candidate. Each has one theme and an exit test, so a release
can ship or slip on its own. Order is by risk to the player, then by payoff.

### v0.17.2: Fix what is visibly wrong (small)

Scope: A1 to A6, C6, D5.

- Make the postgame panel fit its container; add a browser assertion that no
  Game Day element has clipped content at 1280, 1440 and 390.
- Replace the fourth-down default with one that reads kicker range, weather,
  score and clock. Never recommend a kick beyond the kicker's realistic range;
  stop offering field goals past about 57 yards.
- One source for the week label, used by the header and every page.
- A shared `plural(n, word)` helper for stat lines; sweep performer summaries.
- Give simulated games a compact drive summary, or remove the "unavailable" line.
- One final per screen on postgame Game Day.
- Name the scorer and play in the scoring flow.
- Move toasts clear of the bottom navigation and primary controls on phones.

Exit: the new clipping assertion passes; a scripted 500-game run shows no
recommended kick over the kicker's range.

### v0.18: A dynasty that lasts (the release blocker)

Scope: B1, B2.

1. **Measure first, in the browser.** Extend `tools/save-size.js` and add a
   browser soak that plays 30 seasons, then records IndexedDB usage, weekly save
   time, export time, export size and peak memory. Run it at desktop and under a
   phone memory profile.
2. **Cut `gameArchive`.** Keep full play-by-play for the player's own games and
   for postseason games; keep box score and drive summary for the rest; after N
   seasons (a setting, default 5) reduce other programs' regular-season games to a
   score line. `STORAGE.md` governs the format change and the migration.
3. **Compress the export.** Stream the export through `CompressionStream` (gzip)
   in chunks rather than one in-memory string; accept both compressed and plain
   JSON on import.
4. **Budget and warn.** Show save size on the save screen, not only in Options,
   and warn before a quota failure rather than after.
5. **Crash screen.** A global error and rejection handler that keeps the last good
   save, tells the player what happened in plain words, and offers Reload and
   Export. Log the error text locally so it can be copied into a bug report.

Exit: a 30-season dynasty exports under 60 MB, exports and re-imports on a
mid-range phone, and weekly save time at season 30 is within 1.5x of season 1.
An older save opens and migrates with no loss the player can see.

### v0.19: Game Day worth coaching

Scope: C1, D1.

- **Put the field on the live screen.** Reuse the replay field
  (`game-cast-field.js`) for live play so each snap is seen, not only read.
- **More calls, not more clicks.** Add a per-drive offensive intent (run, balanced,
  air it out, tempo) and a defensive posture (base, pressure, prevent), plus
  timeouts in the final two minutes of each half. Target 12 to 20 meaningful
  decisions in a fully coached game, with "Coach big moments" staying at about the
  current seven.
- **Show the consequence.** After each call, one line saying what it changed
  (win chance before and after already exists).
- **Take over the screen.** Once a game is live, collapse prep, playbook and
  matchup into a drawer so the scoreboard, field and decision are the page.
- **Rework pregame.** Matchup and the Coach It Live control first; playbook, scout
  and prep behind tabs.

Exit: a coached game takes 6 to 10 minutes at default pace, the live screen fits
one viewport at 1280x800 and 390x844 without scrolling to reach a decision, and
coached and simulated results still match in distribution (the v0.17.0 parity
tests keep passing).

### v0.20: A world you care about

Scope: C2, C3, C4, C5.

- **Mascots and names.** Give each of the 120 programs a nickname and reduce the
  repeated suffixes; show the nickname in scores, headlines and play-by-play.
  Keep school IDs stable so saves are unaffected. The naming set itself is an
  owner decision (see below).
- **Offseason as a sequence of stops.** Each stage opens its own screen with a
  summary of what happened and one or two real choices (who to keep, who to
  chase in the portal, where camp reps go) before the next stage unlocks.
  "Delegate the offseason" remains as a deliberate, labelled choice.
- **Signing day and the portal as events**, resolved one name at a time for the
  players the user worked.
- **Recruiting cannot be missed.** On the first week, either the board is seeded
  with staff suggestions awaiting approval or staff handling is on until the
  player takes over. Say which, on This Week.
- **Expectations that add up.** Show the expectation the administration is
  judging against before the season, show the running verdict weekly, and make
  the season-review sentence consistent with the number. Re-tune the starting
  confidence for the Quick Start program so a new player is not on the hot seat
  after meeting expectations.

Exit: a first-time tester completes an offseason and can say what they decided at
each stage; no tester finishes week 3 with an empty board without having chosen
to delegate.

### v0.21: First hour, phone and accessibility

Scope: D2 to D4, plus first-run.

- Minimum 44 px touch targets and 12 px text at phone width; fix Roles & Depth and
  Staff first.
- Name every control; one `h1` per screen; run an automated accessibility checker
  in the browser suite and fix what it reports; one manual pass with VoiceOver and
  with keyboard only.
- Test on real Safari (iOS and macOS) and Firefox. The storage contract already
  flags iPhone Safari as unverified.
- First-hour pass: watch three new players through Quick Start to the end of week
  3 without help, and fix the three places they stall most.
- Difficulty and length settings surfaced at setup (they exist in part under
  Program settings).

Exit: the automated checker reports no serious issues on the 15 screens; three new
players reach week 4 unaided.

### v0.22 to 1.0 candidate: Ship it properly

Scope: B3, B4, E3, E4, and the release mechanics.

- Sign and notarise the Mac build; sign the Windows build; move from ZIP to a DMG
  and an installer. Steps are already written in `docs/NOTARIZATION.md`.
- In-app update prompt on desktop that downloads, not only links.
- Choose a licence; add a Credits screen (font OFL notice, art provenance).
- Strip or gate `__DL_TEST__` in release builds; add a Content-Security-Policy.
- Installable web app: manifest, icons, offline cache, so the web build works
  without a connection and can sit on a home screen.
- A bug-report path: a "Report a problem" control that packages version, platform,
  the logged error and an optional save.
- Store presence, if wanted: page copy, six screenshots, a 60-second trailer, a
  press kit. All can be captured from the existing browser harness.
- Freeze the save format at 1.0 and write the compatibility promise in
  `STORAGE.md`.

Exit: a stranger can download, install, play three seasons, update to the next
build and keep their dynasty, on macOS, Windows and the web, without reading a
workaround.

### Engineering, alongside every release

- **Make the suite fast.** Split `npm test` into a parallel fast tier (under two
  minutes) and a slow simulation tier; run the fast tier on every push.
- **Add a linter** (ESLint with `no-undef` and `no-unused-vars` to start) and wire
  it into CI. Fix reported real errors; do not reformat `app.js` in the same
  change.
- **Stop growing `app.js`.** New work goes in modules; each release moves one
  domain out (suggested order: game presentation, recruiting, offseason). Generate
  the build's module list from a manifest with declared dependencies rather than a
  hand-ordered array.
- **Prune the docs.** Move pre-v0.15 checkpoints to `docs/archive/`, cut
  `docs/roadmap/STATUS.md` to current state plus next action, and make this file
  the roadmap it points to.

## Sequencing and size

| Release | Theme | Relative size | Depends on |
| --- | --- | --- | --- |
| v0.17.2 | Visible defects | Small | none |
| v0.18 | Long-dynasty saves, crash screen | Large | none |
| v0.19 | Game Day depth | Large | v0.17.2 |
| v0.20 | World identity, offseason | Large | naming decision |
| v0.21 | First hour, phone, accessibility | Medium | v0.19, v0.20 |
| v0.22 | Distribution | Medium | Apple and Windows certificates, licence decision |
| 1.0 | Candidate, two-week beta, fixes only | Small | all above |

v0.18 and v0.19 touch different code and can run in parallel. v0.22 can start as
soon as the accounts exist.

## Decisions needed from the owner

1. **Apple Developer and Windows signing certificates.** Paid, and the only way
   past the install warnings. Without them 1.0 ships with the current workaround.
2. **Licence and price.** Free and open, free and closed, or paid. This sets the
   licence file, the store work and whether the web build stays public.
3. **Program names.** Approve a naming and mascot set for the 120 programs. Real
   school names and marks stay out; the current city-plus-suffix pattern is safe
   but flat.
4. **Old saves at 1.0.** Migrate every alpha save forward, or declare a clean
   break at 1.0. Migration is the recommendation; it is what v0.18 budgets for.
5. **How much play calling.** The v0.19 plan stops at per-drive intent. Per-play
   calling is a different game and roughly doubles that release.
6. **Telemetry.** None exists. Opt-in crash reports would shorten every bug hunt;
   it is a privacy choice, not a technical one.

## Definition of release ready

- A 30-season dynasty saves, exports, imports and migrates on desktop and phone.
- No screen clips content or needs sideways scrolling at 390, 1280 and 1440.
- A coached game is the best ten minutes in the product.
- The offseason asks for decisions and remembers them.
- Signed installers on macOS and Windows; an installable, offline web build.
- A licence, credits, a crash screen and a way to report a problem.
- The fast test tier, the linter and the accessibility check gate every push.
