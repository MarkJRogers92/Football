# Changelog

## v0.9.12 — Box scores stop rewriting themselves

- Permanent box scores now live in their own append-only chunks instead of the core save row. An ordinary save appends only the games just played; a twelve-season dynasty no longer rewrites ~75 MB of history it never touched. Measured at three seasons: a save writes 29 MB instead of 53 MB, and the gap widens every year.
- Game history is hydrated on demand, the same way archived careers already were. Opening the Game Center, the newsletter or school history loads it; exporting a dynasty hydrates it first, so portable JSON remains a complete save with every game ID intact. Nothing is ever pruned.
- Browser storage moves to schema 3. An existing save keeps working and splits its history out on the next save, exactly as the v0.9.0 career-archive upgrade did.
- The recruiting board sorts by any column header. Click to sort, click again to reverse; columns where the interesting end is the top (stars, scout grade, interest, trend) open descending. Sorting orders the entire pool before the visible slice is taken, so it surfaces the real leaders rather than reordering the first 220 rows.

## v0.9.11 — Scholarship scarcity and pulled offers

- Recruiting classes are bounded by the room the roster actually leaves instead of a flat cap of 30. Capacity derives from the 85-man limit against projected returning players, held inside a realistic signing-class band, so a heavy graduating year gives you room and a thin one squeezes you.
- Attrition is now a recruiting resource: transfers out, early declarations and graduations are what buy your next class.
- Some programs over-sign on purpose, betting on attrition they cannot name yet. Appetite is a stable trait — impatient, high-profile programs push the limit — and signing day settles the bet by pulling the weakest commitments. Roughly a third of the league has to pull an offer in a given year.
- You can pull an offer yourself. It is never free: the recruit reopens his recruitment, will not consider your program again, and the pipeline he came from takes a hit. The Weekly Hub reports it.
- The Recruiting tab shows scholarships committed against capacity, spots remaining, and a warning when you are over the limit.

## v0.9.10 — Scheme installation and position-change agency

- Coordinators now run a system of their own. Hiring an OC or DC who prefers a different scheme replaces yours and starts an installation, so the coaching market is a strategic choice rather than a pick-the-highest-rating exercise. Candidate cards say up front what a coach runs and warn when hiring him will change your system.
- Installing a scheme costs fit, never ratings. Year one bites hardest; spring and fall camp install it, and the drag fades over roughly three seasons. Players who suited the old system pay the steepest transitional price and settle below where they were — they are square pegs now, not worse players.
- A roster that no longer fits its system is likelier to leave: scheme mismatch feeds transfer risk, and only for the side of the ball that actually changed.
- The Staff tab shows what is being installed, from what, and how far along it is.
- Position changes are now a conversation. Players weigh body fit, playing time, staff trust, versatility and any standing Position Lock promise, landing on Eager / Open to it / Reluctant / Refuses. A refusal blocks the move; forcing a reluctant player through it costs morale and staff trust. The preview tells you which you are dealing with before you commit.
- Old saves keep the system they already run — migration never invents an installation, and inherited coordinators are recorded as running what their program runs.

## v0.9.9 — Game recaps and the weekly newsletter

- Every archived game now writes its own recap paragraph: who won and by how much, how they won it (yardage, turnover margin, ground vs. air, sacks, shutouts), the star lines, and colour like a player facing his former school or a multi-week injury.
- Recaps are derived from the stored box score on demand and never saved, so they appear immediately for every game already in an existing dynasty and add nothing to save size.
- Wording is drawn from a stream seeded by the game ID: a saved game always reads the same way, and generating recaps never touches the simulation RNG, so reading history can never change what happens next.
- Recaps state only what the box score supports. With no clock or quarters in the model, the prose never invents timing, attendance or late-game drama — a test enforces this.
- New Newsletter tab: pick a week and a coverage level (your program, your conference, or national). It leads with the most newsworthy game in scope — ranked matchups, upsets, one-score finishes, title games — then lists the rest, with a line tracking your own record.
- The Game Center Summary now opens with the same recap.

## v0.9.8 — Recruit Portrait Integration

- Extended the frozen deterministic Portrait V1 renderer to recruits without changing face identity generation.
- Added recruit portrait thumbnails to the Recruiting board, portrait-led signing cards, commitment/flip spotlight art and a full Recruit Profile portrait.
- Uncommitted prospects use a neutral scouting uniform; committed prospects switch presentation to the committed school's colors while keeping the same face.
- Reused the recruit portrait seed already preserved into the signed player object, so recruit → roster continuity remains deterministic.
- Added lazy near-viewport painting for recruiting-board portraits to avoid eagerly rendering the entire 220-row board on mobile.
- Added desktop and iPhone-layout browser checks for recruit list, signing-card and profile portrait painting. No IndexedDB schema change.

## v0.9.7 — Visual Identity V1

- Added a presentation-only visual identity layer on top of the validated v0.9.6 game: darker broadcast-style shell, stronger information hierarchy, elevated cards/tables, refined tabs/buttons and more polished profile dialogs.
- Added deterministic controlled-school branding and monograms without adding brand fields to universe/save data.
- Added sports-network presentation for the Dashboard and Game Lab plus a larger portrait-led Player Profile while preserving existing game mechanics and data sources.
- Added a Recruiting Signing Class board, collectible-style commitment cards, commitment/flip spotlight and Recruit Profile hero treatment, all progressively enhanced from already-rendered recruiting data.
- Fixed narrow-screen regressions discovered during release validation, including Game Center header width, Signing Class decoration containment, recruit hero layout and mobile recruiting control overflow.
- No simulation rules, recruiting/coaching mechanics, player portrait identity logic, save migrations or IndexedDB schema changed in this release.

## v0.9.6 — Coaching Market

- Firing, retiring or losing a coach on the controlled team no longer auto-fills the slot: it opens a search. A weaker interim coach holds the role (staff ratings docked ~18%, half salary) until the user acts, so leaving a search unfilled has a real, visible cost. AI-controlled teams are unaffected and keep resolving vacancies instantly, exactly as before.
- Each opening gets a candidate market: two freshly generated candidates, up to two poachable coordinators/HCs from other programs (ambition-gated, fit-scored), and — for Head Coach openings only — the team's own OC/DC as internal-promotion candidates.
- A candidate must be interviewed before an offer can be made. Offers set salary, contract years and play-calling authority (full vs. shared); acceptance chance depends on fit, how the offer compares to their ask, and whether they were interviewed. A new per-team athletic department budget (derived from resources/prestige, matching the existing salary formula) caps what can be offered.
- Hiring an external coach closes their old stint at their old program (which then auto-fills its own vacancy, same as any AI departure) and opens a new one at the new program under the same coach identity — no duplicate coach objects. Promoting internally opens a follow-on search for the slot they vacated rather than leaving it silently unfilled.
- Declined offers mark the candidate and leave the opening searchable; accepted offers are final and clear the interim tag. Openings and the candidate market are core, portable universe state — old saves migrate additively, no IndexedDB schema change.

## v0.9.5 — Coaches take relationships with them (preview batch)

- Recruits now keep a stable primary-recruiter coach ID plus coach-specific relationship values separate from school interest.
- When a coach changes schools, the same relationship follows the coach: the old school loses that relationship boost and the new school gains recruiting/transfer pressure. Commitments are never auto-flipped by coach movement.
- Current players with strong ties to a departing recruiter receive a bounded transfer-risk bump; the coach's new school receives extra destination weight. Firing/retirement can create fallout without a destination.
- The offseason carousel now runs before portal decisions and can produce a capped number of real coordinator-to-coordinator moves, allowing players to react in the same offseason without building the full hiring market.
- Weekly/Preseason Hub surfaces recruiting fallout. Old saves infer existing recorded recruiter relationships additively from recruiting memory; no IndexedDB schema change.

## v0.9.4 — Persistent coaching careers (preview batch)

- Coaches now keep one durable identity across jobs, role changes and retirement, with persistent career stints and season-by-season team records.
- The existing offseason carousel records each staff season before turnover, preserves fired/departed/retired coaches, and can make a bounded internal coordinator-to-HC promotion without introducing the full hiring market.
- Staff names open a Coach Profile with descriptive specialties/traits, tracked record, titles, recent seasons and a career timeline. Former coaches remain visible from the selected program. Hidden personality numbers are not exposed.
- Coach movement/retirement events use stable coach IDs; existing player/recruit coach references continue to resolve. Old saves receive additive legacy career stints without fabricated historical wins or titles.
- Full interviews, competing offers, salary negotiation, staff budgets and relationship portability remain intentionally deferred to later v0.9 slices.

## v0.9.3 — Portrait V1 and release hardening

- Frozen deterministic Portrait V1 is integrated into roster and player profiles; identity survives recruiting-to-signing, saves, transfers and player archive.
- School jersey colors are deterministic and portrait rendering is cached.
- `VERSION.txt` is the single release-version source checked against the app/package at build/test time.
- GitHub Pages publishing now lives entirely in the Football repo, with production at `markjrogers92.github.io/Football/`.

## v0.9.2 — Permanent Game Center (preview batch)

- Stable game IDs and historical school/rank/record snapshots for every new game.
- Permanent team/player box scores, injuries, game leaders and detailed drive
  outcomes. Summary / Box Score / Drives / Play-by-Play sections; no invented
  quarters or clocks. Existing unlogged score adjustments are disclosed.
- Schedule, results, Weekly Hub, Game Lab and season-filtered school History
  reopen saved results. Game/championship events and former-player links use IDs.
- Core archive format 1 survives rollover, IndexedDB and JSON import/export;
  unknown future formats are rejected. About 6.6 MB per full 745-game season.
  Full play logs remain temporary; permanent boxes/drives are never pruned.
- Validation: 52 engine checks, 16 Node groups, 59 desktop/mobile-layout browser
  checks and six browser persistence scenarios. Actual iPhone Safari untested.

## v0.9.1 — Transfer destinations and memory (preview batch)

- Transfer destinations now weigh recruiting finalists/known offers, playing
  opportunity, scheme, geography, prestige, pipelines and retained coach ties.
  A weighted choice preserves variation; full rosters and the current school
  are excluded. No destination causes the player to remain in a saved portal queue.
- Moves preserve the same player, eligibility/redshirt record, injury history,
  hidden development profile, promises and career history. Season totals reset
  after archival, fixing transfer statistics being counted again the next year.
- Persistent transfer records and events retain origin/destination IDs and names,
  year, reason and coach references. Profiles show transfer history; the Weekly
  Hub flags upcoming matchups involving former players without claiming a start.
- Uncompleted obligations are explicitly released on roster cuts/portal departures.
  Existing broken promise history remains intact.
- Checks: 52 engine checks, 14 storage/promise/transfer test groups, 45 browser
  checks and five browser persistence scenarios. Three-season audit: 55/45/59
  transfers, zero unplaced players, bounded rosters; final recruiting flips 4.3%.
  Actual iPhone Safari testing remains outstanding.

## v0.9.0 — Promises Become Debts (preview batch)

- Recruiting offers now retain school and recruiter identity; signed players carry
  first-season obligations. A rival signing never inherits another school's offer.
- Early Role uses actual appearances (eight, reduced by recorded injury weeks);
  No Redshirt respects major injury exceptions; Position Lock remembers forced
  changes; Development Plan requires actual Technique training in both camps.
  NIL Priority is recorded passively.
- One-time offseason audits change morale, staff trust and transfer risk, append
  structured events, and retain results in active/archived profiles and exports.
  Significant breaches appear in the Weekly Hub. Transfer penalties follow the
  original school for one subsequent season, not the player's destination.
- Existing coach IDs remain stable; missing IDs are assigned once and departing
  coaches are archived. Legacy promise labels are retained without invented terms
  or retroactive penalties. IndexedDB remains schema 2.
- Checks: 52 engine checks, 12 persistence/promise test groups, 45 browser checks,
  five browser persistence scenarios. Recruiting audit: 15–30 signees per school,
  mean 23.3, flips 4.8%. Actual iPhone Safari remains untested.

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
