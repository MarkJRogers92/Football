# Dynasty Lab — v0.9.2 Game Center checkpoint

Repository: https://github.com/MarkJRogers92/Football
Canonical branch: `codex/v081-save-continuation`
Base: `939ae9f90ff6c31c39cb62186eab806d1bd06a3b` (v0.9.1)

## Completed

Permanent Game Center on top of v0.9.1 transfers, v0.9.0 promises, and v0.8.1
safe player archive persistence. Do not redo those milestones.

- Every newly completed regular-season/postseason game gets a permanent game ID.
- Pregame school IDs/names, rankings/records, venue/context, final score, actual
  team statistics, sparse per-player game deltas and injuries are snapshotted.
- Open results from Schedule, Latest Results, Weekly Hub, Game Lab and the
  selected school's History game archive. History filters to one season.
- Summary, Box Score, Drives and Play-by-Play sections fit desktop/phone layouts.
  Passing/rushing/receiving/defense/kicking/punting show only recorded fields.
- Detailed games permanently retain 24 drive outcomes. Game summaries show
  scoring drives, leaders, new injuries and former-player appearances.
- Game events carry stable game IDs, school IDs and participating former-player
  IDs. Championship games have CHAMPIONSHIP_WON events.
- Snapshots survive roster/ranking changes, rollover, browser Save/Load and
  complete JSON Export/Import. Unknown future game-archive versions fail closed.

## Play and resume

Use the latest preview URL in the task or outputs/VERCEL_PREVIEW_CHECKPOINT.md.
Production remains unchanged. Export from an older preview and Import here to
move saves between origins, or start fresh. Simulate a week, open Season, click
the completed score. Reopen previous years from History → Game archive.
Older saves' preexisting games have no recoverable player box scores; new games
are archived from v0.9.2 onward. Never reconstruct old results by simulating again.

## Validation

52 engine checks including eight seasons, 16 Node test groups (new game tests
rerun after fixing signed-zero comparisons), 59 desktop/390px browser checks,
and six real-browser persistence scenarios. Checks cover all 745 games/season,
team/player production sums, drive points plus explicit score adjustments,
no double simulation after a detailed game, stable IDs, pregame snapshots,
former-player event links, season rollover, real IndexedDB, JSON import/export,
missing optional data, unsupported future archive version and dialog width.
Build/syntax/diff checks passed. Real iPhone Safari remains untested.

## Honest engine and storage limits

Quarter scores, clock, attendance, drive yardage, possession, conversions, long
plays and other untracked stats are not invented. Existing home-field/tie points
are labeled as simulation adjustments rather than fabricated scoring plays.
The detailed engine names primary players in its text log while allocating box
production across the rotation; the UI explains this existing discrepancy.
The latest detailed game's last 160 text entries remain temporary, as before.
Permanent archives retain box scores and drive/scoring summaries, not full logs.

Game archive format 1 lives in the core save; IndexedDB stays schema 2. A seeded
full season adds about 6.6 MB (745 games) of compact game records. No history is
pruned; no decade of full play logs is loaded. Game boxes are not yet stored in
separate lazy chunks, so very long dynasties will need a later storage batch.
Do not claim 30–50-year mobile performance. Read STORAGE.md before modifying saves.

## Next batch and budget agreement

STOP after this playable milestone. User had roughly $4.50 remaining at start;
keep future work bounded, no subagents, publish a usable preview and refresh this
handoff after every agreed step. Preserve future saves; old personal saves are
expendable. Do not promote production or modify the default Claude branch.
Next roadmap milestone is v0.9.3 persistent coaching careers. Start with coach
identity/career records and a small playable slice, then deeper coaching market
work later. Football repo is canonical, not ZIP handoffs.

Resume prompt: Continue Dynasty Lab from Football branch
codex/v081-save-continuation. Read CONTINUATION.md and STORAGE.md. v0.9.2 Game
Center is complete. Agree one small coaching-career batch, preserve history,
verify, commit, publish a Vercel preview, update the handoff, then stop.
