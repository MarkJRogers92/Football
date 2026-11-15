# Project Diary

## Decisions and Lessons

- Complete a stacked release by merging the follow-up PR into its upstream branch first, then merging upstream. Verify both the published artifact hash and a live player flow; a successful deployment push alone does not establish that the new game is served.

- A refusal should not consume a completed-deal quota. For realignment, value recurring payouts over the contract cycle and reserve conference slots only after acceptance or a pending user offer.

- Check the caller’s clock before enforcing class-based eligibility. Departures has already charged the current season; early draft entry therefore reads completed seasons plus redshirt time, not the preseason class index.

- Separate derived lifetime simulation data from the public career-to-date view. A deterministic future is still hidden information until its season happens.
- Preserve draft-time names as historical labels; use stable school IDs for current alumni attribution, with a read-only legacy fallback and cache invalidation on rename.
- Keep optional world stories bounded and current. A resolved incident replaces its original flashpoint in the short briefing.
- Test scripts are executable coverage policy: check every test file has a command and full/fast/slow lists agree. A green suite cannot cover files never assigned to it.

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
