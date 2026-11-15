# Dynasty world follow-ups

Goal: finish the authorized v0.33 follow-ups without adding management chores.
Base: GitHub PR #64, 5c12a9cfb840524e507d39f62bee548e103438fb. Work in an isolated checkout; preserve the outer repository.
Execution: Light route, direct implementation. User approved all five recommendations plus alumni identity and future-visibility checks. No new pro league or expanded conferences.

- [x] Verify baseline and run full-runtime, four-seed league measurements; measure early departures and Hall of Fame rates before tuning.
- [x] Protect alumni identity with school IDs and a legacy-record fallback; invalidate summaries on school rename. Test renamed programs and old draft records.
- [x] Hide unplayed career outcomes. Test rookie/undrafted profiles, chronological honors and Hall eligibility.
- [x] Surface current locker-room and pro milestones in the existing Wire/briefing, with links and limits. Test freshness, deduplication, escaped names and no save/RNG changes on reads.
- [x] Add deterministic AI invitation decisions based on media/prestige gain, travel and rivalry cost. Test accept, decline, replacement offers, user control and unchanged conference sizes.
- [x] Add a restrained Ring of Honor using existing ceremonies; test induction timing, reload suppression and reduced motion.
- [x] Improve recruiting narrowing guidance using available actions and known motivations only. Test useful options and cases where pursuit cannot be saved.
- [x] Browser playthrough including invitation, flashpoint, schedule trade and alumni profile; fix observed usability issues. Run full Node, browser, extended, accessibility and storage checks, build/lint/release verification.
- [x] Record measured outcomes, remaining limitations and exact continuation state; preserve changes in a reviewable branch/PR.

Acceptance: no duplicate/future alumni honors, no lost alumni after rename, meaningful AI declines without schedule damage, relevant optional weekly stories, reproducible full-runtime balance evidence, passing checks or explicit environment blockers.

Discovered during measurement review: departures charged the season before applying an early-entry gate written for the prior class. Regression reproduced eight ordinary sophomores declaring early; corrected the completed-season clock, counting redshirt time. Final measurements and relevant checks were rerun after this gameplay fix. Verification and remaining limits are recorded in `agent_docs/latest_session_work.md`.
