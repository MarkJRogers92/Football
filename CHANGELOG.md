# Changelog

## v0.8.1 — archive persistence continuation (unreleased)

- Browser saves separate archived careers from the main dynasty record, loading
  history only when required. Existing careers are written once; later saves
  append new departures. Every career and portable JSON export is retained.
- Save and archive writes commit atomically; stale loaded tabs cannot overwrite
  newer saves. Blocked upgrades, failed writes and missing archive chunks are
  reported instead of silently losing data. Invalid imports preserve the open game.
- IndexedDB schema advances to 2; game version remains 0.8.1. See `STORAGE.md`
  for migration and rollback details. No production deployment is included.
- Recruiting audits now use final per-team signee counts recorded before pool
  rollover. The previous origin-string count included veteran roster players.
- The harness now tests actual `packUniverse()` sparse serialization. Added
  storage failure tests, engine persistence integration, and a real-browser
  save/load/history/export/import test. Storage tests are part of `npm test`.
- The generated standalone includes `storage.js`; new universes carry the
  current app version instead of the stale 0.8 value.

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

Measured in Chromium at iPhone viewport, first season, median of three runs:

| Action | v0.8 | v0.8.1 |
| --- | --- | --- |
| Sim one week | 734 ms | 306 ms |
| Sim rest of season | 6,384 ms | 2,066 ms |
| Twelve-season save | 162 MB | 74 MB |
| Save growth per season | 11.7 MB | 4.3 MB |

- `ranked()` and `confStand()` called `rankingScore()` — which profiles an
  entire roster — from inside a sort comparator, evaluating it about thirteen
  times per team per sort. Score once, then sort.
- `gameSim` recomputed both team profiles inside `recordGame`.
- `render()` rebuilt the innerHTML of all thirteen tabs on every call; it now
  renders the visible tab plus the shared chrome.
- Recruiting shuffled all 120 teams with `sort(() => Math.random() - .5)` for
  every recruit every week, and re-derived positional need each time.
- `makeRoleDepth()` re-rated every player on every comparison, across
  twenty-four roles per team.
- `recruitDistance()` recomputed a great-circle distance between fixed
  coordinates for every team a recruit considered, every week, twice.
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

### Follow-through on the review's own work list

Everything below is additive to v0.8.1; `APP_VERSION` is unchanged and no
existing save needs anything beyond the migration path `normalizeUniverse()`
already provides.

- **Mobile cards extended to Recruiting and Development.** Same treatment
  the roster table got in the review pass: `stacked-table` + `data-label`
  per cell. The Stats tab needed nothing — its leaderboards were already
  stacked `div` rows, not a `<table>`.
- **The Weekly Command Center is clickable.** Every hub item that names a
  screen (a result, a ranking move, an injury, a commitment, the next
  opponent, a transfer-risk flag, a hot target) now jumps to that tab and,
  where relevant, opens the player or recruit dialog, through a new
  `goToTab()` helper. Older saves' stored hub items simply have no
  destination and render as plain cards.
- **Decommits and flips.** The single largest gap the review named:
  `r.committed` was permanent. Committed recruits are now re-pressured every
  week against the field; a sustained pitch advantage from a challenger
  gives a small, tuned weekly chance of a flip. Measured at 4–5% of
  in-season commits per cycle (`npm run audit`) — a story beat, not churn.
  The user's attention (target/relationship/visits/promise) both defends a
  commit and wins a flip; the AI never flips a recruit to the user
  unprompted. New `universe.decommitLog` (capped at 80) and
  `universe.recruitCycle` back the hub alerts and the audit line.
- **`T()` and `findPlayer()` are now Map-indexed** instead of scanning the
  team list / every roster / the archive on every call, as the review's
  performance section recommended. Self-validating rather than
  instrumented at every mutation site: a hit is checked against the
  universe's current shape, and a miss triggers exactly one rebuild.
  Measured: `findPlayer` on a live player, 2000 lookups, 218ms → 5ms; on an
  archived player, 500 lookups, 121ms → 2ms; `T()`, 20000 lookups,
  19ms → 1ms.

Not attempted: moving `playerArchive` into its own IndexedDB store. It is
the highest-value remaining item from the review's save section but the
riskiest, since it touches save/export/import directly — see
`DYNASTY_LAB_GPT_HANDOFF.md` for what it needs.
