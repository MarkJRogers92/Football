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
