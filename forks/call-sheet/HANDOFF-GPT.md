# Call Sheet: handoff

**For:** the next agent continuing this work (GPT or Claude). **Owner:** Mark. **Date:** 2026-11-16.

Call Sheet is a fork of **Dynasty Lab** (a college football dynasty sim). It adds an arcade card battler, in the
spirit of Balatro: loud animations and big payoffs. Coaching a game becomes a card battle on the real rosters,
and every result flows back into Dynasty Lab's own records. Read this file first, then `INTEGRATION.md`, then
`DESIGN.md` if you need the rules in depth.

## Where everything is

| What | Where |
| --- | --- |
| The real fork (work here) | GitHub `MarkJRogers92/call-sheet`, branch **`card-battles`** (latest: 30b6677) |
| `call-sheet` `main` | Dynasty Lab plus an early copy of this folder. **It does not have the card-battles work yet.** Merge only when Mark says so |
| Prototype copy | GitHub `MarkJRogers92/Football`, branch `claude/gracious-volta-3me7m2`, folder `forks/call-sheet/` (synced with `card-battles` for `core/`, `slice/`, `tools/` and the docs; it has none of the Dynasty Lab integration files) |
| Playable sandbox | https://claude.ai/artifact/65grKWrvUGk2Ea4suJxGac (the slice bundled into one page; it runs without a dynasty) |
| Art tools | Pixel Forge (`MarkJRogers92/pixel-forge`, installed by the cloud environment's setup script), PixelLab (claude.ai connector), Meshy (3D) |

## Run, build, test

```bash
npm ci                                   # once
node tools/build.js                      # builds index.html (Dynasty Lab plus the card engine plus the battle frame)
npm test                                 # the full suite: Dynasty Lab's 1,026 tests and the card tests (must stay green)
node tests/card-gameday-browser.js       # the end-to-end browser test (Playwright); CARD_SHOTS=dir saves screenshots
node forks/call-sheet/tests/battle.test.js   # rules engine, 18 checks
node forks/call-sheet/tools/bundle.js out.html   # standalone sandbox page (what the artifact is)
```

Every new test file must be listed in `package.json` (`test`, `test:slow` or its own script). `check-test-lists.js`
fails the suite otherwise.

## Rules in one paragraph

On offense you hold a visible **call sheet** of 4 base plays, a drawn row of 3 **wrinkles** and a hand of 4
**tactics**. You get 5 **Command** per series, and a new first down deals a fresh hand. Each snap resolves in
three named **duels**: Gate, Key and Finish. A duel compares the players' trait grades (traits ÷ 10) plus labeled
modifiers, and the margin maps to a win chance. A lost Gate decides the play. **Honest Look:** a Confirmed fact
is always true. Tendencies build a Lean, and constraint plays punish it. Players catch **On Fire**. Other systems:
combos, trick plays, packs after games (rarity, one legendary per world), card evolution through mastery reps
(two permanent branches), and archetype **signature cards** for star players. Modes: key downs (default),
series, every snap, watch.

## Architecture

**Card engine** (`forks/call-sheet/core/`, UMD modules, also loaded in Node tests):
- `data.js`: catalog (PLAYS, CALLS, TACTICS), roles, archetypes (STYLE_TRAITS), archetype SIGNATURES, RARITY.
- `resolver.js`: `buildSnap` and `evaluate` (all duel modifiers, each with a `src` label), `resolve`.
- `battle.js`: the game state machine on Game Engine 2. Contains `simulate` and `preview`, and
  `duelTally(b)` (per-player duels won and lost, highlight plays). It tags engine events with `ev.card.actors` so
  Dynasty Lab credits stats to the players who actually won the duels.
- `packs.js`, `evolution.js`, `signatures.js`, `world.js` (AI programs' picks), `classes.js`, `roster.js`.
- `adapter.js`: turns a **real Dynasty Lab team** into a battle team. It builds the lineup from `roleDepth`
  (injured players sit), `toBattlePlayer`, `conditionsOf` (fatigue, composure, morale, out of position), and
  `programEdges` (scheme fit, weekly prep, crowd, familiarity). It also has `staffCommand` and `battleTeam`.

**The battle screen** (`forks/call-sheet/slice/`): `index.html`, `slice.js`, `fx.js`, `cards.js`. The same code runs
the standalone sandbox and the Dynasty Lab game day. In Dynasty Lab it runs inside an iframe (`srcdoc` =
`globalThis.CallSheetBundle`) and talks to the host through `window.parent.__callSheetDynasty`
(`launch`, `record(state,tally)`, `save`, `close`).
- The field shows 22 **player cards**. Hovering one shows the player tooltip.
- Matchup glow before the snap: green and red on your players, dashed amber on threats.
- After the play, duel winners flash gold and the playmaker pops.

**Dynasty Lab side** (repo root):
- `card-gameday.js`: the engine extension that holds all the glue. Sections:
  1. Save format: `normalizeCallSheet` runs on every load from `normalizeUniverse`.
  2. Integration framework.
  3. Game day and card-simulated games.
  4. UI: the Card Program panel, Card Settings, player and recruit cards, and the newsletter section.
- `game-engine-v2-record-run.js`: `recordV2GameLabResult({externalState})` records a finished battle
  transactionally (validation and rollback).
- `game-engine-v2-attribution.js`: `cardActor` makes stats duel-true.
- `tools/build.js` injects `card-gameday.js` and the core files, and embeds the battle bundle.
  `tools/harness.js` loads them headless.
- `brand-visuals.js` adds the "Coach with Cards" and "Classic Game Day" buttons on the next-matchup card.

**How the glue works:** `card-gameday.js` reassigns Dynasty Lab closure functions to wrap them:
`recordV2GameLabResult`, `simWeek`, `runOffseason`, `render`, `showPlayerProfile`, `showRecruitProfile` and
`renderNewsletter`. **Watch out:** some tabs call their renderer through `TAB_RENDERERS`, so after wrapping you
must also set `TAB_RENDERERS.<tab>` (as is done for the newsletter).

## Save: `universe.callSheet` (version 1)

`playbook` (decks, capacity, mastery, evolved, signatures, ringOfHonor, legendaries, record, packsOpened,
gamesPlayed), `combos`, `settings {mode, control, fast, sound, integrations{id:bool}}`, `games`, `seenHelp`,
`ai {teamId: playbook}` (programs on your schedule plus your rival, at most 40), `newsLog` (last 40 pulls and
evolutions, with year and week), `lastWeekNews`, `players {dlId: {w, l, big, games}}` (card careers), and
`moments` (last 60 newsletter moments). Everything is repaired or bounded in `normalizeCallSheet`. A newer
version refuses to load. **Opt-in:** none of this exists until the first Coach with Cards or
`DynastyCardGameDay.enable()`, so base Dynasty Lab behavior stays identical.

## Integration framework

`registerCardIntegration({id, label, about, hooks})`. The hooks:
- `launch(ctx)`: edit the battle config.
- `afterGame(ctx)`: after a card-simulated game.
- `weekTick(ctx)`: after `simWeek`. Push items onto `ctx.news` and they appear in the feed and the newsletter.
- `offseason(ctx)`.

Each integration appears automatically in **Card Settings** with an on/off switch. A throwing integration is
logged and skipped. Registered integrations: `program-edges`, `signature-graduation`, `scouting-fog`,
`practice-reps`, `ai-playbooks`, `sim-with-cards`. `INTEGRATION.md` lists every connection with its status and a
table of next ideas by hook.

## Done (newest first)

1. **Every player has a card** (30b6677):
   - Player pages show a battle card: role and depth, ability, grades, conditions and card career.
   - Recruit pages show a prospect card: scouted *ranges* (never true values), projected role, playbook usage
     and comparison with your starter.
   - Player conditions from health, wear, composure, morale and familiarity become labeled ±1 mods.
   - Card careers are recorded from coached and simulated games.
   - The weekly newsletter gets a Call Sheet section.
2. **Player cards on the field** (04e0550): portraits, hover tooltip, matchup glow, duel-win flashes.
3. **Card Program panel, Around the League news, Card Settings** (7c590f9).
4. **Integration framework**: simulated games played as card battles, scouting fog, practice reps, AI playbooks (664746d).
5. **Duel-true stats, validated saves, program edges, signature graduation** (c898988).
6. **Coach with Cards** game day on the real rosters, recorded as a real game (dd4a77d).

## Next steps (in priority order)

1. **Postseason card battles.** Conference championships, bowls and playoffs still use Classic Game Day
   (`cardGameBlocker` blocks phases other than `regular`). Postseason results go only to `universe.gameArchive`
   (see `latestUserPostseasonGame`, `app/09-careers-bowls.js`), not through `recordV2GameLabResult`. Build a
   transactional postseason recorder that mirrors the regular-season one (validation, rollback, attribution).
   Then let `buildLaunch` and `simulateCardGame` accept a postseason game. Add bowl, title and playoff packs.
2. Remaining rows of `INTEGRATION.md` → "Next integrations, by hook":
   - pitch recruits with your playbook (archetype fit raises interest through the existing pitch path);
   - nemesis recruits;
   - a signing-class pack reveal;
   - development stamps;
   - camp auditions;
   - coordinator card pools that leave with staff;
   - facilities raising playbook capacity;
   - booster packs;
   - Players of the Week feeding signature breakouts;
   - records broken mid-battle;
   - Legacy cards from retired numbers;
   - coaching-tree playbooks;
   - collection albums;
   - duel notes in box scores.
3. **Known gaps:**
   - In the standalone sandbox, AI-vs-AI games use quick results.
   - The single running back carries a heavy load.
   - Recruit prospect cards use a deterministic estimate (`scoutHash`), not Dynasty Lab's per-domain estimates.
4. **Art pass (optional):** pack wrappers, legendary and signature card art, trophies, flame effects. Use PixelLab
   or Pixel Forge. Keep player faces on Dynasty Lab's portrait renderer (`DynastyPortraits`) so they match
   everywhere.

## Rules for this codebase (keep them)

- **No parallel systems.** Read Dynasty Lab's data and write back only through its own paths.
- **Labeled effects only.** Every duel modifier has a `src` the player can read.
- **Fail safe.** Wrap integration and UI code in try/catch. UI code must bail out headless: the harness has a
  stub `document` without `getElementById`.
- **Never leak hidden truth.** Recruits and opponents under scouting fog show ranges, never true ratings.
- Keep all 1,026 Dynasty Lab tests green, and register every new test.
- Escape all HTML (`escH`).
- Commit messages end with the attribution lines the session asks for. Don't merge to `main` or open PRs unless
  Mark asks.

## What Mark wants

- **Easy to understand,** with as little reading and busywork as possible.
- **Arcade presentation:** loud, over the top, Balatro-style payoffs, not spreadsheets.
- **Every dynasty unique:** strategic pack picks, no two playbooks alike.
- **Recruits matter in the card game.** Recruiting and development should drive the battles.
- **Everything connected:** the battler should use as much Dynasty Lab data as possible, and results should flow back.
- He likes ideas and pushback, but stay impartial.
