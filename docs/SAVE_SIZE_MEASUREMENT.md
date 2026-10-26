# Roadmap B — live-league save size: measurement

Measured at v0.9.27 before writing any optimisation, because the roadmap's
stated assumption turned out to be wrong in both directions.

## Method

Six consecutive full seasons on one universe (seed 99, 120 programs), measuring
`Buffer.byteLength(JSON.stringify(...))` of `packUniverse(u)` and of each major
component after every completed offseason. This is the **portable export**
shape. Browser storage defers `playerArchive` into chunks (see `STORAGE.md`), so
the resident IndexedDB footprint is not the same number — see *Caveat* below.

## Result

| Season | Total | gameArchive | playerArchive | rosters | events | seasonHistory | recruits |
|---|---|---|---|---|---|---|---|
| 1 | 27.13 MB | 6.02 | 1.72 | 23.75 | 0.28 | 1.23 | 1.80 |
| 2 | 39.43 MB | 12.12 | 5.67 | 24.48 | 0.55 | 1.78 | 1.80 |
| 3 | 51.73 MB | 18.02 | 10.00 | 25.29 | 0.82 | 1.91 | 1.80 |
| 4 | 62.25 MB | 23.72 | 11.10 | 28.92 | 1.12 | 2.86 | 1.80 |
| 5 | 73.39 MB | 29.54 | 15.65 | 28.27 | 1.41 | 2.57 | 1.80 |
| 6 | 84.11 MB | 35.15 | 19.22 | 28.95 | 1.72 | 2.88 | 1.80 |

Growth per season, seasons 1→6:

| Component | Per season | Share at season 6 |
|---|---|---|
| **gameArchive** | **+5.83 MB** | **41.8%** |
| **playerArchive** | **+3.50 MB** | **22.9%** |
| rosters | +1.04 MB | 34.4% (but near-flat) |
| seasonHistory | +0.33 MB | — |
| events | +0.29 MB | 2.0% |
| recruits | +0.00 MB | 2.1% |
| history, decommitLog | ~0.00 MB | 0.1% |

**Total growth is +11.40 MB/season**, and a six-season league is 84 MB.

## What this overturns

`CONTINUATION.md` and `ROADMAP_V09.md` both said:

> Remaining growth (~4 MB/season) is `universe.events` and per-player
> `seasonHistory` across 120 teams.

Every part of that is wrong:

- Growth is **11.4 MB/season**, not ~4.
- `universe.events` is **2.0%** of the save and grows +0.29 MB/season. Even
  deleting the entire event ledger would return under 3% and cost the wire,
  the story surface and every feature built on it since v0.9.19.
- `seasonHistory` grows +0.33 MB/season — also nearly irrelevant.
- The two actual drivers, `gameArchive` (+5.83) and `playerArchive` (+3.50),
  are **80% of all growth** between them and neither was named.
- `rosters` is the largest single component at season 6 (34.4%) but is
  essentially a fixed cost — it grows +1.04 MB/season, mostly from accumulating
  per-player history on active players, not from more players.

## Caveat before acting on this

These are portable-export numbers. `STORAGE.md` records that browser saves
already write `playerArchive` into separate chunks and leave careers deferred
until something needs them, so the *resident* browser cost of `playerArchive` is
lower than the table suggests. The same is not documented for `gameArchive`.

**So the next measurement, not the next optimisation, is: what does IndexedDB
actually hold after six seasons?** Instrument `saveBrowser` and read back the
real record sizes. Optimising the export shape would be optimising the wrong
number.

## If it does turn out to need work

Ranked by measured payoff, once the IndexedDB numbers confirm the shape:

1. **`gameArchive`** — 41.8% and the fastest-growing thing in the save. It is
   already chunked by v0.9.12's design for archives; the question is whether
   old seasons' play-level detail can be rolled up to box-score level after N
   seasons. v0.9.2's design notes say drives and play-by-play are the bulk.
2. **`playerArchive`** — 22.9%. Already deferred in the browser. A retired
   player keeps a full `seasonHistory`; a rollup for players who never played
   meaningful snaps would be safe.
3. **Everything else** — not worth touching. `events` in particular is a
   rounding error, and it is load-bearing for the wire.

## Update — resident IndexedDB measured directly (v0.9.38)

The original measurement above used `packUniverse()` — the **portable export**
shape — with a caveat that the browser already chunks and defers
`playerArchive`, so the real IndexedDB footprint might be meaningfully
smaller. That caveat is now checked and **disproved**.

### Method

Same six-season run, but driven through the real `storage.js` against
`fake-indexeddb`, calling `store.save()` exactly the way `saveBrowser()` does
in `app.js` (append-only `additions`/`gameAdditions`, real chunking). Then
every object store was read back with `getAll()` and weighed for real —
this is what actually sits in a browser's IndexedDB, not an estimate.

### Result

| Season | `archives` | `games` | `saves` (core) | **IDB total** | portable export |
|---|---|---|---|---|---|
| 1 | 1.75 MB | 6.11 MB | 19.40 MB | **27.25 MB** | 27.25 MB |
| 6 | 19.25 MB | 35.56 MB | 29.95 MB | **84.76 MB** | 84.76 MB |

**Resident IndexedDB size is the same as the portable export, byte for
byte.** Chunking splits `playerArchive`/`gameArchive` into multiple records
so the app can *load* them lazily — it does not reduce how many bytes are
written to disk. The growth rate is unchanged: **+11.5 MB/season**, and the
linear projection is **~188 MB by season 15**.

One further thing this run surfaced that the export-only measurement
couldn't: the `saves` store (the core snapshot — everything except the
deferred archives, so 120 full team rosters, the live recruit pool, etc.) is
not small either — 19.4 MB at season 1, growing to 29.95 MB by season 6
(+2.1 MB/season). It's the single largest store early on and stays roughly
a third of the total throughout. `gameArchive` overtakes it as the dominant
driver by season 3, matching the original measurement's finding.

### What this changes

The original write-up's conclusion — "measure before optimizing, because the
roadmap's own hypothesis was already wrong once" — holds, but the specific
reason to *not* worry ("the browser already shrinks it") does not. There is
no hidden discount. A twelve-season dynasty is a genuinely large IndexedDB
footprint (roughly 130–150 MB by extrapolation), and on a storage-constrained
context — mobile Safari in particular, which this project already targets
(390px viewport tests throughout the suite) — that is the range where quota
prompts or eviction become a real risk, not a theoretical one.

### Recommendation

This is now a real, not hypothetical, item for a storage-reduction pass —
not urgent (nothing breaks below quota, and quota itself varies enormously
by browser/device/free disk space), but worth scheduling before this project
targets long dynasties as a headline feature. Ranked by the same measured
payoff as before:

1. **`gameArchive` first** (41–42% of the total, fastest-growing). It is
   already chunked; the next lever is rolling old seasons' play-level detail
   (drives, play-by-play — see v0.9.2's design notes) down to box-score
   granularity after N seasons, keeping the record permanent but smaller.
2. **The core `saves` row second.** It is large from season one because it
   holds all 120 rosters and the full recruit pool, not just the controlled
   team's. Worth checking whether AI-team roster detail needs to be as rich
   as the controlled team's for save purposes, or whether it can be
   compacted for teams the player doesn't control.
3. **`playerArchive` third** (unchanged from the original measurement).

Still no code changed here — this is measurement only, same discipline as
before.

---

# Update — 2026-10-25 (measured on v0.12.9, source `89727e8`)

The sections above stop at v0.9.38 and are kept for provenance. This update
corrects two claims that no longer hold and replaces the ranking.

## What changed since the last measurement

**Tiered game-detail compaction shipped in v0.9.49** (`GAME_DETAIL_HORIZON = 3`)
and does run in the offseason: games older than three seasons lose their
non-leading per-game stat lines while scores, participants, team box, injuries,
leaders, titles, bowls, the user's games and rivalry games are kept
(`app.js`, `compactGameArchive`). The v0.9.38 note "still no code changed here"
is therefore obsolete: code changed, and it changed the biggest component.

## Measurement

`SEASONS=6 node tools/save-size.js` (new in v0.12.10), seed 7, one universe,
packed export shape — the same bytes the browser writes.

| Season | Total | gameArchive | playerArchive | rosters | recruits | events | compacted games |
|---|---|---|---|---|---|---|---|
| 2028 | 28.1 MB | 6.1 | 1.8 | 23.8 | 2.0 | 0.4 | 0 |
| 2029 | 41.2 MB | 12.3 | 5.9 | 24.9 | 2.0 | 0.7 | 0 |
| 2030 | 54.5 MB | 18.2 | 10.6 | 26.0 | 2.0 | 1.0 | 0 |
| 2031 | 62.2 MB | 20.4 | 11.8 | 29.8 | 2.0 | 1.4 | 649 |
| 2032 | 71.0 MB | 22.7 | 17.1 | 29.1 | 2.0 | 1.8 | 1,298 |
| 2033 | 79.2 MB | 25.0 | 21.2 | 29.8 | 2.0 | 2.2 | 1,947 |

## What this changes

- Growth is now **~6-7 MB/season in steady state**, not 11.5. Compaction cut
  `gameArchive` growth from ~+5.8 MB/season to ~+2.3 MB/season once the horizon
  starts to bite (season 4 onward). The earlier headline "188 MB by season 15"
  overstates the current build.
- **`playerArchive` is now the fastest-growing component**: +4.1 MB/season by
  season 6 and still linear, because every retired player keeps a full career
  record. It passed `gameArchive`'s growth rate at season 5.
- **`rosters` is a flat ~30 MB tax**, not a growth driver: 120 teams carrying
  85-105 players each, near the previous number, roughly a third of the save.
- `events` remains a rounding error (2.2 MB at season 6), as measured before.

## Revised ranking

1. **`playerArchive` rollup.** Retired players who never recorded a meaningful
   snap keep a full `seasonHistory`; collapsing those to career totals (keeping
   awards, draft result, last team and exit reason) is the largest remaining
   lever and does not touch a player anyone would look up.
2. **`rosters` for AI programs.** The core save is large from season one. Before
   compacting it, measure how much of an AI roster is ever read by a surface the
   player opens; hidden development detail is a candidate, not the ratings.
3. **`gameArchive`** is now second-order: extend the horizon only if a longer
   window proves unnecessary. Play-level detail is already absent for routine
   games.

Still measurement plus the already-shipped compaction; no new size code in
v0.12.10. Any rollup must keep same-seed box scores and every stable ID intact.

## Ten-season measurement — 2026-10-25 (v0.12.14, seed 7)

`SEASONS=10 node tools/save-size.js`, same packed-export shape.

| Season | Total | gameArchive | playerArchive | rosters | recruits | events | compacted games |
|---|---|---|---|---|---|---|---|
| 2033 | 79.2 MB | 25.0 | 21.2 | 29.8 | 2.0 | 2.2 | 1,947 |
| 2034 | 88.7 MB | 27.4 | 27.6 | 29.0 | 2.0 | 2.5 | 2,596 |
| 2035 | 98.2 MB | 29.6 | 33.8 | 28.6 | 2.0 | 2.9 | 3,245 |
| 2036 | 106.4 MB | 31.9 | 37.7 | 29.5 | 2.0 | 3.3 | 3,894 |
| 2037 | 115.4 MB | 34.3 | 42.9 | 29.4 | 2.0 | 3.7 | 4,543 |

- A ten-season dynasty is **115 MB**, against an earlier extrapolation of
  130-150 MB. Growth settles near **+9 MB/season**, not +6-7 as the six-season
  window suggested.
- **`playerArchive` is 37% of the save and the only component still accelerating**
  (+5.1 MB in the last season, 42.9 MB total). `gameArchive` grows a steady
  +2.3 MB with compaction doing its job; `rosters` is flat at ~29 MB; `events`
  is still a rounding error at 3.7 MB.
- This is the before-measurement for the rollup: **`playerArchive` is the
  target**, and any reduction should be measured at ten seasons against these
  numbers.

## Where those bytes are — 2026-10-25 (`ANALYZE=1`, v0.12.15, ten seasons)

| Group | Bytes | Share of archive |
|---|---|---|
| seasonHistory | 11.3 MB | 26.4% |
| career totals | 0.9 MB | 2.1% |
| awards | 0.0 MB | 0.1% |
| everything else (identity, ratings, scouting trails, relationships, camp rows) | 30.7 MB | 71.4% |

Players with **no recorded games**: 6,925 of 22,737 (30.5%), holding **12.0 MB**
(27.9% of the archive). Slimmed to identity + observed reads + draft + awards +
career totals + exit reason they would hold 1.4 MB.

## Decision — shipped in v0.12.16

Slimming never-played careers is worth **10.6 MB at season ten** (9.2% of the
whole save) and it removes nothing that describes a game, because no game
happened. It ships as a **write-time** summary record (`recordTier: 'summary'`):

- New archives of careers with no recorded games keep identity, perceived and
  upside reads, portrait seed, draft result, awards, career totals, promise trail,
  staff trust and exit reason. Scouting trails, coach relationships, camp rows and
  season rows are not stored (the keys stay present and empty so a record survives
  a save/load round trip unchanged).
- Played careers are archived exactly as before.
- **Existing saves are untouched** — this is not a migration. Older dynasties keep
  their full records and remain loadable; the profile of a summary record shows
  no season rows rather than zeroed ones.
### Measured result (same seed, ten seasons)

| | Baseline (v0.12.15) | Summary records (v0.12.16) | Change |
|---|---|---|---|
| Season 10 total | 115.4 MB | **108.2 MB** | **−7.2 MB (−6.2%)** |
| playerArchive | 42.9 MB | 35.7 MB | −7.2 MB |
| gameArchive / rosters / events | 34.3 / 29.4 / 3.7 | 34.3 / 29.4 / 3.7 | unchanged |

The estimate said 10.6 MB; the measured saving is 7.2 MB, because summary records
still carry identity, observed reads and the promise trail (the shape-stabilising
keys cost the remaining ~1 MB). Growth per season fell from ~9.0 MB to ~8.0 MB.
Only records written after v0.12.16 are affected — an existing save keeps its
full archive until a career is written under the new rule.


