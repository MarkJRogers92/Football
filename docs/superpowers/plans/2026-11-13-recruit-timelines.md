# Natural Recruiting Timelines Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement and independently review the complete change.

**Goal:** Make recruiting timing variable but legible without universal exact dates.
**Architecture:** Version the existing season-scoped funnel state; evaluate deterministic readiness for all uncommitted recruits after weekly recruiting actions. Public status exposes observed clues, lists and voluntary announcements only.
**Tech Stack:** Existing vanilla JavaScript factory, Node test runner and browser harness.
**Spec:** ../specs/2026-11-13-recruit-timelines-design.md

## Global Constraints
Preserve signing/flip code, offer eligibility, old save history, deterministic RNG, source-generated build contract. Do not deploy or merge.

## Review Focus
- No targeting-only clock acceleration or status leak.
- Existing midseason saves and reopened commitments cannot become stranded.
- Scheduled visits count only when completed; repeat evaluation is idempotent.
- Capacity failures must remain available to signing day.
- Announcements are uncommon and postponement reasons remain visible.

## Tasks
- [x] Write failing factory tests for private status, uniform timing, relationship clues, idempotency, persistence, visits, announcement/postponement and migration.
- [x] Implement timeline profile/readiness inside recruiting-actions.js; preserve cut and commitment semantics, process all prospects and report board outcomes only.
- [x] Update engine wrapper, player-arcs history and desk/sidebar/reminder UI; remove future cut dates and certainty claims.
- [x] Replace obsolete fixed-date tests with behavior checks; update soak invariants and browser coverage.
- [ ] Build, run full tests, simulate multiple seasons and review balance. Run browser checks where available; document any exact blocker.
- [ ] Independent whole-change review, resolve findings, commit and prepare a draft PR without publishing.
