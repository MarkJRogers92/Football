# Dynasty Lab — v0.9.7 checkpoint

Repository: https://github.com/MarkJRogers92/Football
Current source branch: `codex/v097-visual-identity`
Production branch: `gh-pages`
Production: v0.9.7 at https://markjrogers92.github.io/Football/

## Current release

v0.9.7 is the Visual Identity V1 release built directly on the validated v0.9.6 Coaching Market. It is intentionally presentation-only.

- darker broadcast-style global shell and stronger information hierarchy;
- deterministic controlled-school palettes and monograms;
- sports-network Dashboard and Game Lab presentation;
- portrait-led Player Profile hero;
- Recruiting Signing Class board, commitment cards and Recruit Profile hero;
- mobile fixes for Game Center, recruiting cards/profile and narrow-screen controls.

No simulation, recruiting, coaching, portrait identity, save architecture, migration or IndexedDB schema behavior was intentionally changed by this visual milestone.

## Validation checkpoint

Before promotion, the full branch release workflow passed build, engine/persistence tests, desktop+iPhone-layout browser/visual regression tests, real-browser IndexedDB regression checks and the simulation audit. The earlier targeted recruiting mobile overflow test also passed after the final containment fixes.

Actual iPhone Safari remains a manual device check; automated phone coverage is Chromium at an iPhone-sized viewport.

## Storage guardrail

Read `STORAGE.md` before altering save behavior. v0.9.7 adds no new save fields or storage migrations beyond v0.9.6. Production and preview paths share the same GitHub Pages origin, so export a portable JSON backup before switching builds when a dynasty matters.

## Next steps

Do not fold unrelated gameplay work into this visual release. Pick the next remaining v0.9 gameplay/story slice as a bounded milestone, branch from this validated source, and preserve the standing test/publish discipline.

## Resume prompt

Continue Dynasty Lab from `MarkJRogers92/Football`, using `codex/v097-visual-identity` / its promoted successor as the v0.9.7 source checkpoint. Read `CONTINUATION.md`, `STORAGE.md`, `CHANGELOG.md`, `ROADMAP_V09.md` and `VISUAL_IDENTITY.md`. Do not redo Promises, Transfers, Game Center, Portrait V1, persistent coaching careers, coach relationship portability, Coaching Market or Visual Identity V1. Keep the next milestone bounded, validate fully, and publish only after the branch is green.
