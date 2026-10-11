# Dynasty Lab v0.9.52 handoff

Branch: `codex/v0952-program-goals-polish`
Base/source line: `claude/review-improvement-dwjemy`

v0.9.52 is the final Program Lab / Season Goals polish pass before Game Engine 2 work. It adds weighted and more varied season objectives, live goal health states, Program Overview context, and preserves existing v0.9.51 goals when upgrading a save.

Validation: build/currentness and release-source checks passed; the v0.9.52 goal suites passed; the weekly-plan regression exposed by canonical validation was diagnosed as a brittle test (a legitimate Coach's Desk decision increased the global pending count) and the corrected weekly-plan suite passed. See `docs/v0952-VALIDATION.md`.

After publication, use v0.9.52 as the stable v0.9.x baseline. Prefer v0.10.0 Game Engine 2 work next rather than expanding v0.9.x except for bugs.
