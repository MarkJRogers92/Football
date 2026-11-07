# Dynasty Lab — Visual Identity V2 "Midnight & Brass"

Unreleased (source still v0.14.1). Presentation only: no simulation, balance, save-shape or RNG changes.

## The idea

The title screen already had an identity (brass, stadium light, the trophy); the game behind it was a generic dark dashboard. V2 carries the title screen into every tab:

- **Brass means "what matters now".** One accent (`--bi-gold`) for the active page, the active view, primary actions, the next game and required decisions. Nothing else is gold.
- **Team colour means "who you are".** Banner gradients, estimate bars and glows use the controlled program's `--team-*` variables.
- **Condensed athletic type.** Barlow Condensed (SIL OFL, vendored in `assets/fonts/`, loaded locally so the desktop app works offline) for headlines, numbers, labels and menus; Inter/system stays for reading text.
- **Chalk and helmets instead of paragraphs.** A chalk play diagram (inline SVG) behind the program banner, the existing Meshy helmet atlas for your program, every opponent and the matchup card, and the frozen v1 portraits on roster cards.
- **One menu language.** Page tabs are an underline; in-page views (dashboard This week / Players & goals / League, the recruiting class views, Workspace/Table) are one brass segmented track.

## What draws what

| Visual | Where | Source of truth |
|---|---|---|
| Hero helmet + season strip (every game, W/L and score, next game pulses) | Dashboard banner | `DynastyBrandSnapshot.team().schedule` |
| Helmet face-off | Dashboard next matchup | same snapshot, matched by team name |
| Program radar (six attributes) | Program Lab | `team().attributes`; replaces the duplicate tile row visually (tiles stay in the DOM) |
| Admin confidence gauge, season goals ring, win pace | Program Lab | `team().confidence`, `goals`, `w` vs `expectedWins` |
| Leader bars (share of the category leader) | Stats | `--lead` set by `statLeaderRows` in `app.js` |
| Estimate range bar (25–99 scale) | Roster cards | the staff range already in each card's label |
| Recruit confidence bars | Recruiting desk | unchanged values, brand colours |

`brand-snapshot-adapter.js` is an engine extension (shares `app.js`'s closure) and only copies values out. `brand-visuals.js` is the DOM layer: pure geometry is exported for `tests/brand-visuals.js`, mounting happens in the browser only, and repaints are signature-guarded so they never loop with the app's own renders.

## Motion

Section entrance (cards rise in once per tab change), radar/gauge/bar draw-ins, a light sweep on brass buttons, a soft pulse on the next game. All of it stops under `prefers-reduced-motion` and the in-game *Reduce motion* option (`body.motion-reduced`).

## Decluttering in the same pass

- Stats no longer lists eight "0 SCK · 0 INT" defenders before any game; it says *No defensive statistics yet*.
- The required-decision focus line reads as a slim status header instead of a second copy of the decision card below it.
- The recruiting *Recruiting mode* explainer card became just its toggle (and shares the class-view row on wide screens).

## Cohesion and fun pass

- **Navigation:** `TAB_GROUPS` in `app.js` (and the copies in `client-shell.js`, `game-hud.js`) are the sidebar's five sections. `brand-visuals.js` writes the active section onto the tab strip (`data-section`).
- **Faces:** `playerFaceChip` / `decisionFacesHTML` in `app.js`; stat leaders use `portraitTag`.
- **Keys:** `LEGENDS` in `brand-visuals.js`, mounted into each section header once.
- **Coach It Live:** `gameday-momentum.js` (pure, tested in `tests/gameday-momentum.js`) estimates win chance from score, time left, possession, field position and home field; `game-engine-v2-gameday-ui.js` renders it and exposes `[data-coach-live]`. Nothing feeds back into the simulation.
- **Rival Watch:** `rival-snapshot-adapter.js` (read-only) + `rival-watch.js`; archetypes and lines are deterministic functions of real ratings and facts.
- **Ceremonies:** `ceremony-snapshot-adapter.js` (read-only) + `ceremonies.js`. A ceremony plays when a milestone key appears that was not in the previous snapshot for the same program and season; loading or switching programs resets the baseline. They stay off under browser automation unless a test sets `DynastyCeremonies.autoplay=true`.

## Feel and long-term goals

- **Sound:** `sound.js` synthesizes every cue with Web Audio (deterministic noise, no files). Preferences live in `localStorage` (`dynastyLabSound`); automated browsers stay silent unless a test calls `DynastySound.enableForTests()`. `renderWav(cue)` renders a cue offline for review.
- **Storylines:** `storyline-snapshot-adapter.js` (read-only, cached per game week) builds plain player records; `storylines.js` detects arcs (`detect`) and picks a varied set (`select`). Tested in `tests/storylines.js`.
- **Legacy:** `legacy-snapshot-adapter.js` + `legacy.js`; the store is `localStorage.dynastyLabLegacy`, never the save. Tested in `tests/legacy.js`.
- **Season moments:** `season-moments-adapter.js` + `season-moments.js` (highlights, Rivalry Week, yearbook); the rivalry trophy ceremony is part of `ceremonies.js`.
- Class prefixes: Rival Watch uses `rvw-` because `rw-` belongs to the recruiting workspace.

## Files

`brand-identity.css` (last in the cascade), `brand-visuals.js`, `brand-snapshot-adapter.js`, `gameday-momentum.js`, `rival-snapshot-adapter.js`, `rival-watch.js`, `ceremony-snapshot-adapter.js`, `ceremonies.js`, `sound.js`, `storyline-snapshot-adapter.js`, `storylines.js`, `legacy-snapshot-adapter.js`, `legacy.js`, `season-moments-adapter.js`, `season-moments.js`, `assets/fonts/*`. Tests: `tests/brand-visuals.js`, `tests/gameday-momentum.js`, `tests/rival-ceremonies.js`, `tests/storylines.js`, `tests/legacy.js`, `tests/brand-identity-browser.js`, `tests/fun-features-browser.js`, `tests/season-features-browser.js`.

---

# Dynasty Lab — Visual Identity V1

Branch: `codex/v097-visual-identity`
Base: v0.9.6 source commit `1ea198cd49d03bb8ca02c17fc8dac960e4c9143e`

## Purpose

Give the existing deep v0.9.6 game a more finished sports-management presentation without changing simulation behavior, save state, storage, recruiting, coaching, portraits, or universe data.

## Implemented

### Global presentation layer
- Added `visual-identity.css` after the legacy stylesheet rather than rewriting `styles.css`.
- New darker broadcast-style shell, stronger text hierarchy, elevated cards, cleaner tables, more intentional buttons, refined tabs, dashboard hero treatment, command-center treatment, and improved profile dialogs.
- Mobile and reduced-motion behavior included.

### Team identity layer
- Added `team-branding.css` and `visual-identity.js`.
- The controlled school gets a deterministic curated sports palette derived from its school name.
- The palette updates when the user switches programs or edits the controlled school name.
- The top-left Dynasty Lab mark becomes a school monogram and dashboard/header accents follow the controlled school.
- This is presentation-only: no team objects, universe state, save data, migrations, or IndexedDB schema are changed.

### Sports presentation slice
- Added `sports-presentation.css`, `sports-layout.css`, and `sports-presentation.js`.
- Dashboard now receives a sports-network-style program desk. During the season it promotes the next matchup, the controlled program/record/rank, opponent identity and the latest result into a dedicated broadcast feature above the weekly command center.
- The feature links directly into Game Lab and Season without replacing the existing weekly-hub mechanics.
- Game Lab's existing next-game text is progressively enhanced into a two-team matchup card with team marks, home/road context and the existing offense/defense reads.
- Player Profile now becomes a true portrait hero: larger portrait, program mark, position chip, Current/Upside/Scout Confidence rating rail, with those duplicate ratings removed from the lower stat grid.
- Detailed-game score and Season result/schedule rows receive a presentation polish pass.
- All enhancements read already-rendered DOM and do not touch `app.js` game state or the portrait renderer.

### Recruiting / signing-day slice
- Added `recruit-presentation.css` and `recruit-presentation.js`.
- Recruiting gets a dedicated Signing Class board with current class rank, commitment count, blue-chip count and a 30-slot class meter.
- Board-visible committed/wavering prospects become collectible-style signing cards with national rank, stars, position, location and commitment state.
- A new weekly `COMMITMENT` or `FLIP` item is promoted into a larger team-branded recruiting headline graphic.
- Recruit Profile is progressively enhanced into a prospect hero with identity graphic, position, national rank, interest and prospect/committed/wavering status.
- The presentation layer intentionally does not access private universe state. Overall class count/rank remain sourced from the existing class summary; individual class cards are generated from committed prospects currently present in the rendered board. This avoids modifying recruiting mechanics or save state.

### Browser coverage
- Added `tests/visual.js` for desktop and iPhone sports-layout checks.
- Added `tests/recruit-visual.js` for the Signing Class board, commitment card path, recruit hero, mobile overflow and console errors.
- `npm run test:browser` now runs the existing full browser suite followed by both focused visual suites.

### Build wiring
`tools/build.js` now composes, in order:
- `styles.css`
- `visual-identity.css`
- `team-branding.css`
- `sports-presentation.css`
- `sports-layout.css`
- `recruit-presentation.css`
- existing body / portrait renderer / storage / app logic
- `visual-identity.js`
- `sports-presentation.js`
- `recruit-presentation.js`

## Guardrails

- Do not move branding fields into `universe` or team save objects in this visual pass.
- Do not modify portrait identity/rendering logic.
- Do not redesign mechanics while doing presentation work.
- Keep presentation components additive until the visual language is approved.

## Validation status

The new recruiting presentation JavaScript passed a local `node --check` syntax pass. Full repository/Playwright execution still cannot be run from the current local runtime because outbound GitHub access is blocked there. The branch therefore must still pass the normal project validation before preview/promotion:

```bash
npm install
npm run build
npm test
npm run test:browser
npm run audit
```

Then publish a preview, not production:

```bash
npm run publish:preview -- v097-visual-identity
```

Review desktop and phone layouts, especially Dashboard, Game Lab, Player Profile, Recruiting, Recruit Profile, Roster and Staff.

## Vercel status note

GitHub reports a failing Vercel deployment status on this work. The untouched v0.9.6 base commit reports the same Vercel failure, so that status predates this visual branch and is not evidence of a visual-layer regression.

## Recommended next slice after visual review

1. Add a more visual weekly results/news surface using the existing Game Center/archive data.
2. If recruit portraits are desired on signing cards, expose a narrow read-only presentation hook from recruiting rather than coupling this layer to the simulation internals.
3. After the visual language is approved, consider explicit school logo/color editing and persistent school brand data.
