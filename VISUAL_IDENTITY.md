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

### Browser coverage
- Added `tests/visual.js` for desktop and iPhone layout checks.
- `npm run test:browser` now runs the existing full browser suite followed by the focused visual suite.
- Checks cover the dashboard broadcast desk, Game Lab matchup card, player hero, portrait retention, post-sim next-matchup promotion, mobile overflow and browser console errors.

### Build wiring
`tools/build.js` now composes, in order:
- `styles.css`
- `visual-identity.css`
- `team-branding.css`
- `sports-presentation.css`
- `sports-layout.css`
- existing body / portrait renderer / storage / app logic
- `visual-identity.js`
- `sports-presentation.js`

## Guardrails

- Do not move branding fields into `universe` or team save objects in this visual pass.
- Do not modify portrait identity/rendering logic.
- Do not redesign mechanics while doing presentation work.
- Keep presentation components additive until the visual language is approved.

## Validation status

The new presentation JavaScript was syntax-reviewed before commit and the committed files/build wiring were re-inspected from GitHub. Full repository/Playwright execution could not be run from the current local runtime because outbound GitHub access is blocked there. The branch therefore must still pass the normal project validation before preview/promotion:

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

Review desktop and phone layouts, especially Dashboard, Game Lab, player profile, Roster, Recruiting and Staff.

## Vercel status note

GitHub reports a failing Vercel deployment status on this work. The untouched v0.9.6 base commit reports the same Vercel failure, so that status predates this visual branch and is not evidence of a visual-layer regression.

## Recommended next slice after visual review

1. Add recruit commitment/signing-day graphics using Portrait V1 and the same team-mark system.
2. Add a more visual weekly results/news surface using the existing Game Center/archive data.
3. After the visual language is approved, consider explicit school logo/color editing and persistent school brand data.
