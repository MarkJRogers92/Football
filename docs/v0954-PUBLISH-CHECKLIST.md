# Dynasty Lab v0.9.54 — Publish Checklist

This checklist is for release-candidate preparation and preview publication only. Production remains separately gated.

## Before release-candidate freeze

- Confirm the active development tree has passed the full validator after Recruiting Board filters.
- Confirm the real multi-season Recruiting Class History lifecycle test passes through commitment, enrollment, mature evidence and archive.
- Confirm no further mechanics are required for the recruiting/scouting/development milestone.
- Remove `.github/workflows/sync-v0954-build.yml` from the release tree.
- Do not merge temporary measurement/prototype workflows from diagnostic branches.

## Version alignment

Align all release markers to `0.9.54`:

- `VERSION.txt`
- `package.json`
- `app.js` `APP_VERSION`
- generated `index.html` via `npm run build`

Run version/build freshness checks after alignment.

## Final release-candidate validation

Require one coherent run that passes:

- standalone build;
- committed-build freshness;
- releasable source-tree verification;
- complete engine/presentation tests;
- Chromium UI and visual regression suite;
- Evaluation Trail browser lifecycle;
- Recruiting Board filter browser lifecycle;
- browser IndexedDB regression;
- simulation audit.

Record the final run ID and release-candidate commit in `docs/v0954-VALIDATION.md`.

## Preview

After the release-candidate validator is green:

- Publish preview name `v0954` using the existing Publish Dynasty Lab workflow or `npm run publish:preview -- v0954`.
- Verify the served preview, not only the source tree.
- Smoke-test New Dynasty startup, Recruiting filters, Evaluation Hours, Staff Shortlist, Recruit Compare, Recruit Evaluation Trail, Recruiting Class History surface, Development Results and browser save/load.
- Check console/network errors and mobile horizontal overflow.

Expected preview URL:

`https://markjrogers92.github.io/Football/preview/v0954/`

## Production

Do not publish production as part of this checklist. Production remains v0.9.52 until the user separately authorizes v0.9.54 production publication after preview review.
