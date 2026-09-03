# Dynasty Lab — v0.9.8 recruit portrait preview

Repository: https://github.com/MarkJRogers92/Football
Current source branch: `codex/v098-recruit-portraits`
Production branch: `gh-pages`
Production remains v0.9.7 at https://markjrogers92.github.io/Football/ until this preview is reviewed.

## Preview scope

v0.9.8 is a bounded presentation/identity milestone on top of v0.9.7.

- Recruiting board rows now show deterministic Portrait V1 thumbnails.
- Signing Class cards use the recruit's actual generated portrait rather than initials.
- Commitment/flip spotlights use the recruit portrait when the recruit can be resolved from the current board.
- Recruit Profile uses a large portrait hero.
- Uncommitted prospects render in a neutral scouting uniform; committed recruits render in their committed program colors without changing face identity.
- Recruiting-board portraits paint lazily near the viewport for mobile performance.
- The existing recruit `portraitSeed` continues into the signed player object, preserving the same face after signing.

## Validation

The implementation branch passed the full pre-version pipeline before this preview: build, engine/persistence tests, desktop+iPhone browser/visual tests including new recruit portrait checks, real-browser IndexedDB regression checks and simulation audit. This preview workflow reruns the full suite after the 0.9.8 version metadata is applied.

## Storage guardrail

No IndexedDB schema change. Existing recruit portrait seed/version fields are reused. For older in-memory recruits missing a seed, the renderer assigns a stable recruit-id fallback before signing so continuity is retained.

Production and preview paths share the same GitHub Pages origin, so export a portable JSON backup before saving from a preview when a dynasty matters.

## Next step

Review Recruiting on desktop and actual iPhone Safari, especially scrolling performance, Signing Class cards, commitment spotlights and Recruit Profile. Promote only after visual review.
