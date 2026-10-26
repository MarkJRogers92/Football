# History and offseason clarity

## Scope
Approved: history accuracy, roster-change explanations, offseason recap. No balance tuning, version bump, commit, push, publish or installed-app replacement. Baseline 539fad9 / v0.12.17; initially clean working tree. Work directly (project Light route); lead gpt-6.1-sol.

## Plan and acceptance
1. Regressions first: archive actual championship opponent and champion record; snapshot school IDs and conference membership; stable standings tie-breaks; honest legacy fallbacks; preserve recorded off-field career events.
2. Add factual per-team offseason accounting using existing phase reports, including eligibility/early draft exits, portal out/in, signees, walk-ons and cuts. Persist a compact last recap across the year boundary. Do not change roster rules or consume RNG.
3. Show the running recap, best observed additions/losses, camp improvements, battles and the next calendar decision. Label unavailable legacy accounting rather than inventing totals.
4. Build generated HTML; regression tests, full unit suite and desktop/mobile browser checks. Review diff and report known limits.

## Completed locally
- Actual final-game opponent and champion record are archived; IDs and conference membership are frozen per season. Timeline uses matching records and real finals, never rank two. Missing legacy facts stay unknown; missing legacy membership is explicitly estimated from current teams.
- Standings now compare both teams' overall records correctly. Season/conference controls refresh on new archives or save switches; renamed historical schools open by stable ID without changing the controlled program.
- Compact archives preserve recorded off-field history, including recruitment, transfers, injuries, camps, evaluations, seasons and relationships. Previously discarded fields cannot be restored.
- Review begins one roster receipt per team. Actual exits, enrollments, portal placements, walk-ons and cuts update counters; all 120 teams balance across enrollment/portal in regression tests. Replay, save/load, cut/floor, stale in-season receipt, observed-only camp evaluation and unexpected-count tests pass.
- Dashboard recap shows the running equation, top three staff-evaluated additions/losses, observed camp risers, role battles and navigation-only next step. Last completed receipt is retained across the year boundary. No fabricated legacy baseline. Imported text/numeric fields are escaped.

## Verification
- Full final npm test: version/build check PASS, smoke 53/53, unit tests 489/489; no skips or failures.
- Focused regressions 39/39. Desktop + 390px mobile recap/history accuracy tests PASS; original history-index browser check PASS. Screenshots inspected. Save/reload and lazy persistence covered by the full suite.
- Build and git diff --check PASS. Generated index.html rebuilt, not hand-edited.
- Seed-7 ten-season storage rerun advanced to 2037: portable save 114.1 MiB versus prior 108.2 MiB (+5.9 MiB / ~5.5%). Archive 41.5 MiB versus 35.7 MiB. Game archive/rosters/events unchanged. Tradeoff recorded in docs/SAVE_SIZE_MEASUREMENT.md; not a native storage benchmark.
- Evidence: .session-artifacts/evidence/2026-10-26T05-04-25-067Z-dynasty-history-accuracy-and-offseason-cla/summary.md. Browser/storage logs are attached artifacts; concurrent evidence commands overwrote some index entries, so logs were re-attached serially after all jobs ended. Their actual checks passed.
- New untracked deliverables: this handoff; tests/offseason-recap.js, tests/offseason-recap-browser.js, tests/history-accuracy-browser.js; local evidence artifacts. Include new tests if later committing, not just git diff's tracked files.

## Integration authorization — 2026-10-26
User requested push, merge and install. Source synchronized to v0.12.18.
Plan: feature branch, full CI, merge into confirmed default branch
claude/review-improvement-dwjemy, then install matching CI-built Mac app while
keeping a v0.12.17 backup and all saves. No production web publication.
Completed: PR #13 merged as 4157493 after full CI 40297216363 passed.
Tested PR merge tree 6a0c594 and actual merge tree 4157493 are identical.
Mac v0.12.18 installed; signature verifies and app.asar matches the CI ZIP.
All 17 save files are byte-identical. Backup: ~/Applications/Dynasty Lab 0.12.17.app.
App left closed. No production web or GitHub release publication.
Installation evidence: /var/folders/q6/wd0w60596vg_rnm736shphw00000gn/T/dynasty-v01218-r82nlimi/installation-verification.json.

## Deferred work Extended
league-health metrics, Hall-of-Fame transparency, notarisation and balance tuning
remain outside this implementation. Used gpt-6.1-sol directly; no subagents.
