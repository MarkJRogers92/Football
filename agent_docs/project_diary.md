# Project Diary

## Decisions and Lessons

- Treat root source files as canonical and regenerate `index.html` with `npm run build`; the standalone file and `gh-pages` output are derived artifacts.
- Keep browser and desktop persistence behind `DynastyStorage`, with complete JSON export/import as the portable bridge. Do not bypass the storage contract for a new save feature.
- Treat `VERSION.txt`, `app.js` `APP_VERSION`, and `package.json` as the current release-version authorities. Several older handoffs and the README still contain historical `v0.9.x`/`v0.12.0` statements, so verify branch, version, and publication state before reusing them.
- Preserve the information boundary: player hidden ability and other hidden simulation state are not valid UI ranking inputs; use observed evaluations, receipts, and public game state.
