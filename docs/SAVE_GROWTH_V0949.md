# v0.9.49 storage measurement

Measured on the v0.9.49 tree, seed 4942, five simulated seasons with the full
offseason calendar. Sizes are `packUniverse` bytes — the portable export, which
v0.9.38 confirmed matches resident IndexedDB size byte for byte.

## Totals

| Point | Size |
| --- | --- |
| After 1 season | 16.1 MB |
| After 5 seasons | 63.7 MB |
| Growth | 47.6 MB over 4 seasons, **~11.9 MB/season** |

That matches the twelve-season soak (36.0 MB after one season reaching 162.9 MB
after twelve) and the earlier v0.9.27 measurement of 11.4 MB/season. The rate is
stable and well established; it is not drifting.

## Where the growth actually is

| Component | Growth | Share |
| --- | --- | --- |
| `gameArchive` | 24.00 MB | **50.5%** |
| `playerArchive` | 11.06 MB | 23.3% |
| `teams` | 9.06 MB | 19.0% |
| `draftHistory` | 1.87 MB | 3.9% |
| `events` | 1.15 MB | 2.4% |
| `coachArchive` | 0.18 MB | 0.4% |

Inside `gameArchive`, one field dominates:

| Field | Share of game archive |
| --- | --- |
| `playerStats` (per-game player deltas) | **87.9%** |
| `teamStats` | 6.0% |
| `injuries` | 1.6% |
| everything else | ~4.5% |

So per-game player deltas are roughly **44% of all save growth** — by a wide
margin the largest single lever in the file.

## The finding that changes the packet

`04-v0949` proposes dropping drive/play detail from routine AI-versus-AI games
older than a horizon. Measured over a full season:

**0 of 768 games carry any drive detail, and drive/play detail is 0.0% of the
game archive.**

This is not a surprise once stated: only the Game Lab's detailed engine produces
drives and play-by-play. A dashboard-simmed or AI-versus-AI game has a box score
with `drives: []` and no play log — the asymmetry recorded in the v0.9.36 entry.
Implementing that compaction literally would be a no-op that looks like progress.

Meanwhile the packet's retention tier lists player deltas as permanent for every
game, which puts the only field that matters explicitly out of scope.

## Options, for a decision rather than a guess

1. **Apply the packet's own tiering to the field that holds the bytes.** Keep
   full `playerStats` for controlled-team, rivalry, conference-title, bowl and
   playoff games; for routine AI-versus-AI games past a horizon, keep the leaders
   and drop the long tail of near-empty stat lines. Faithful to the packet's
   intent, contradicts the letter of its retention tier. Largest available win.
2. **Roll old seasons into a colder store.** Keeps every byte but moves seasons
   past a horizon out of the hot save so ordinary play stops carrying them.
   Preserves history exactly; more moving parts, and export must still inline.
3. **Accept the growth.** Slots and autosave are the packet's real user-facing
   value and are already done. 163 MB at season twelve is large but IndexedDB
   handles it; the risk is quota pressure on mobile.

The packet says the storage target must come from measurement, "not an invented
target in this file" — so the target should be set alongside whichever option is
chosen, not before.
