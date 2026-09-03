# Changelog

## v0.8.1 — review pass

Behaviour-preserving where possible; every change below is either a defect fix,
a measured performance win, or a bounded simulation correction. v0.7 and v0.8
saves continue to load through `normalizeUniverse()`.

### Fixed

- **Rushing yardage inflation.** Role shares were not merged, so a back who was
  both `RB1` and `3DRB` — true on 112 of 120 teams — was credited each role's
  yards separately. League rushing leaders were ~5,500 yards; they are now
  ~1,600. Shares are now merged and capped so no player can exceed a plausible
  single-player workload.
- **Scouting-confidence precedence.** `p.stats?.games || 0 > 6` parses as
  `games || (0 > 6)`, so the experienced-player bonus applied to anyone who had
  ever taken a snap.
- **Run-first quarterback carries.** `scheme.qb.includes('Run-First')` compared
  against whole style names (`'Run-First Weapon'`) and was never true.
- **Schedule desync after a JSON save round-trip.** The league schedule and each
  team's schedule shared objects in memory but became independent copies through
  JSON. Results recorded on one were invisible to the other. They are relinked
  on load.
- **Specialists recorded nothing.** Kickers and punters accrued wear and
  injuries but never a statistic. Field goals, attempts, punts and punt yards
  are now tracked.
- **Duplicated offensive-line snaps** when an injury pushed one lineman into two
  spots.
- **Contradictory ranking display.** The dashboard read "Unranked" while the
  command centre beside it reported the team's exact ranking.
- **Upside range could sit below the current range**, which reads as a defect
  rather than as uncertainty.
- **Stale version strings.** Export wrote `version: '0.7'`; the header and the
  ready message disagreed with the title.

### Simulation

- **Rotation.** Backups now take real snaps: second-string running backs,
  receivers, defensive line and secondary, plus the backup quarterback in
  blowouts. Players recording an appearance rose from 23% of all rosters to
  ~40%, so depth and four-year careers can produce a statistical record.
- **Development produces visible careers.** The hidden growth curves added in
  v0.8 were statistically invisible: growth was ~0.8 raw points per phase
  against noise of standard deviation ~1.4, then rounded to an integer, so the
  signal was destroyed. Over a full career, late bloomers averaged +4.1 and
  early bloomers +4.9 — a difference of less than one rating point. The
  fractional remainder now carries between phases instead of being rounded
  away, the base magnitude is scaled to the headroom players actually have, and
  prospects with high development grades carry more of it.

  | Four-year arc (n=3,124) | v0.8 | v0.8.1 |
  | --- | --- | --- |
  | Median growth | +4 | +9 |
  | 95th percentile | +10 | +18 |
  | Breakouts (+15 or more) | 0% | 15% |
  | Busts (+2 or less) | 32% | 11% |
  | Share of upside realised | 35% | 57% |
  | Spread across hidden profiles | 2.2–4.9 | 4.4–10.3 |

  As a side effect the title race gains texture: a twelve-season run produced
  twelve different champions before, and eight after, with the strongest
  programs repeating.

- **Recruit star ratings mean something.** The generic `stars()` thresholds
  were applied to a recruit pool centred at 58, so the median recruit sat
  exactly on the one-star/two-star boundary: 49% of every class was one star and
  the entire country produced seven five-stars. There was nothing to fight over.
  Recruit bands are now calibrated against the generator's own distribution.

  | Recruit pool (n=2,800) | v0.8 | v0.8.1 |
  | --- | --- | --- |
  | 5-star | 7 | 27 |
  | 4-star | 58 | 320 |
  | 3-star | 390 | 1,342 |
  | 2-star | 975 | 895 |
  | 1-star | 1,370 | 216 |

  Blue-chip signings now stratify the way the design intends: the top twenty
  programs by prestige sign 4.3 four- and five-stars per class against 0.1 for
  the bottom twenty, where before it was 0.6 against 0.0.

- **Prestige no longer deflates.** Expected wins were anchored at prestige 50
  while the league averages 66, so a typical program lost prestige every year
  and the universe drifted down ~0.4 prestige per season indefinitely. The
  baseline is now the league's own centre; mean prestige is flat across a
  twelve-season run and the spread between elite and weak programs survives.

### Performance

Measured in Chromium at iPhone viewport, first season:

| Action | v0.8 | v0.8.1 |
| --- | --- | --- |
| Sim one week | 691 ms | 223 ms |
| Sim rest of season | 7,381 ms | 1,299 ms |
| Twelve-season save | 162 MB | 78 MB |
| Save growth per season | 11.7 MB | 4.6 MB |

- `ranked()` and `confStand()` called `rankingScore()` — which profiles an
  entire roster — from inside a sort comparator, evaluating it about thirteen
  times per team per sort. Score once, then sort.
- `gameSim` recomputed both team profiles inside `recordGame`.
- `render()` rebuilt the innerHTML of all thirteen tabs on every call; it now
  renders the visible tab plus the shared chrome.
- Recruiting shuffled all 120 teams with `sort(() => Math.random() - .5)` for
  every recruit every week, and re-derived positional need each time.
- Archive rows were full player clones. They now keep only the fields the
  archive and records screens read, and stat blocks serialize sparsely.

### Interface

- The roster table stacks into per-player cards below 700px. Six of eleven
  columns were previously off-screen behind a horizontal scroll on a phone.
- The tab strip fades at its right edge so the off-screen tabs are discoverable.

### Infrastructure

- `index.html` is generated from `app.js`, `styles.css` and `body.html` by
  `tools/build.js`, reproducing the shipped v0.8 file byte for byte.
- `tools/harness.js` runs the engine headless in Node behind a DOM shim.
- `tests/smoke.js` — 46 engine checks. `tests/browser.js` — 43 Chromium checks
  across desktop and iPhone viewports. Both pass.
