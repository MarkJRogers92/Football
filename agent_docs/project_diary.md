# Project Diary

## Decisions and Lessons

- A storage completion event and visible UI paint are separate boundaries. Await the visible saved indicator before browser assertions; preserve the exact persistence and cold-reload checks.
- Match release documentation to the real GitHub ancestry. Reconstructed local commits can have identical trees but different commit IDs; preserve actual remote parents when integrating.
- A new save scope needs a usable recruiting default before the opening save captures UI preferences, not only after rows first render. Initialize All Recruits; restore an explicit My Board preference when a matching saved view exists.
- Displaying scouting hours must not initialize or rewrite a scouting week. Use a pure current-week budget snapshot for reads and persist the reset only when hours are spent; otherwise rendering after rollback changes the restored dynasty. Diagnose exact changed fields before treating a digest mismatch as timing.
- Manually driven debounce tests need a controlled clock while keeping the storage implementation real. Separately test the 899/900ms boundary; otherwise a successful background write can race an explicit test call and create a false failure.
- A saved indicator needs a mutation/checkpoint boundary, not only a season/week stamp: resolving a same-week choice or recording a detailed final can change durable state without advancing the calendar. Update status only after real writes, and test with disposable storage plus cold reload.
- Put a stopping point in the existing recap. Keep factual payoff visible and secondary coverage optional; routine results should not compete with earned milestone ceremonies.
- Restore UI preferences through bounded view APIs, scoped by storage identity and program. Never replay clicks or restore management actions to recover a screen.

- Treat root source files as canonical and regenerate `index.html` with `npm run build`; the standalone file and `gh-pages` output are derived artifacts.
- Keep browser and desktop persistence behind `DynastyStorage`, with complete JSON export/import as the portable bridge. Do not bypass the storage contract for a new save feature.
- Treat `VERSION.txt`, `app.js` `APP_VERSION`, and `package.json` as the current release-version authorities. Several older handoffs and the README still contain historical `v0.9.x`/`v0.12.0` statements (older root handoffs now live in `docs/archive/`), so verify branch, version, and publication state before reusing them.
- Preserve the information boundary: player hidden ability and other hidden simulation state are not valid UI ranking inputs; use observed evaluations, receipts, and public game state.
