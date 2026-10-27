# Twenty-season soak (2026-10-26)

The first run past ten seasons. Two seeds, the real engine, the interactive
offseason driven phase by phase (career choices and camps included). Measured with
`SEED=7 SEASONS=20 node tools/save-size.js` on the portable packed save shape.

## Why this exists

The health report stopped at ten seasons, so the actual ceiling of a long dynasty
was unknown. It is now measured — and the measurement itself caught a bug: the
soak tool used one `runOffseason()` per year, which silently froze at season
eleven once the calendar waited on a decision. It now drives the phases and throws
if a season does not advance.

## Result — seed 7

| Season | Total MiB | gameArchive | playerArchive | rosters |
|---|---|---|---|---|
| 1 (2028) | 27.8 | 6.1 | 1.7 | 23.8 |
| 10 (2037) | 115.9 | 35.5 | 42.3 | 29.2 |
| 15 (2042) | 161.4 | 48.1 | 68.1 | 29.3 |
| 20 (2047) | **206.6** | 60.8 | **93.9** | 29.3 |

Second seed (11) at the same points, for confirmation: 115.4 MB at season ten and
**205.4 MB at season twenty**, with the player archive at 93.4 MB. The two seeds
agree within 1 MB, so this is shape, not luck.

Note: the first attempt at this soak ran seed 7 twice, because the tool hardcoded
`seed: 7` and ignored `SEED`. That is fixed, and the numbers above are from two
genuinely different seeds.

- Growth is steady at roughly **8–9 MB per season** and does not level off.
- **The player archive becomes the dominant cost**: 1.7 → 93.9 MB, overtaking the
  game archive around season 13 and growing ~5 MB a season by the end.
- Rosters, recruits, events and history stay nearly flat (29 MB / 2 MB / 7.5 MB /
  0.3 MB), so this is not a leak in live state — it is accumulated history.

## What it means

A twenty-season dynasty is ~207 MB of portable save. That is workable on desktop,
heavy for browser storage and slow to export. It also revisits the archive question
with new evidence: at season ten the rollup looked like 2.5% of the save, but by
season twenty the archive alone is 94 MB.

The right follow-up is not the old "collapse season rows" idea — those rows are
real production. It is a **policy** question for the owner: how much career history
should a twenty-year dynasty keep, and should old seasons be summarised rather than
kept in full. Measure first, as with v0.12.16.

## Caveats

- Portable JSON only; the browser IndexedDB footprint and native saves differ.
- Two seeds; no audit of which specific records dominate at twenty seasons yet
  (`ANALYZE=1` supports it).
