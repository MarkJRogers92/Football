# Dynasty Lab — Visual Identity V1

Branch: `codex/v097-visual-identity`
Base: v0.9.6 source commit `1ea198cd49d03bb8ca02c17fc8dac960e4c9143e`

## Purpose

Give the existing deep v0.9.6 game a more finished sports-management presentation without changing simulation behavior, save state, storage, recruiting, coaching, portraits, or universe data.

## Implemented in the first bounded slice

### Global presentation layer
- Added `visual-identity.css` after the legacy stylesheet rather than rewriting `styles.css`.
- New darker broadcast-style shell, stronger text hierarchy, elevated cards, cleaner tables, more intentional buttons, refined tabs, dashboard hero treatment, command-center treatment, and improved player/profile dialogs.
- Mobile and reduced-motion behavior included.

### Team identity layer
- Added `team-branding.css` and `visual-identity.js`.
- The controlled school gets a deterministic curated sports palette derived from its school name.
- The palette updates when the user switches programs or edits the controlled school name.
- The top-left Dynasty Lab mark becomes a school monogram and the dashboard/header accents follow the controlled school.
- This is presentation-only: no team objects, universe state, save data, migrations, or IndexedDB schema are changed.
- A later Create-a-School/logo pass can replace deterministic palettes with explicit user-selected colors without migrating saves from this layer.

### Build wiring
- `tools/build.js` now concatenates, in order:
  - `styles.css`
  - `visual-identity.css`
  - `team-branding.css`
  - existing markup/scripts
  - `visual-identity.js`
- Theme-color metadata was darkened to match the new shell.

## Guardrails

- Do not move branding fields into `universe` or team save objects in this visual pass.
- Do not modify portrait identity/rendering logic.
- Do not redesign mechanics while doing presentation work.
- Keep new presentation components additive and independently removable until the visual language is approved.

## Required validation before preview/promotion

Run from this branch:

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

Review desktop and phone layouts, especially Dashboard, Roster, Recruiting, Staff, Game Lab, and player/recruit/coach dialogs.

## Vercel status note

GitHub currently reports a failing Vercel deployment status on this branch. The untouched v0.9.6 base commit reports the same Vercel failure, so it predates this visual work and should not be treated as a regression from the new CSS/build wiring.

## Recommended next slice after visual review

1. Make the dashboard more sports-broadcast-like with a dedicated next-matchup/result presentation.
2. Turn the player dialog header into a true player hero card using the existing Portrait V1 renderer.
3. Add reusable matchup/result/recruit-commit visual components.
4. Only after those are approved, consider explicit school logo/color editing and persistent school brand data.
