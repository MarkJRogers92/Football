# Living-world review — 2026-11-07 handoff

## User direction

Mark wants a living football world without making play feel like a chore. Favor a short weekly briefing, recurring people, consequences grounded in recorded events, and optional depth. Routine work should remain delegable. Do not add difficulty tuning or release without authorization.

## Reviewed source and scope

- Branch: `claude/gracious-rubin-mfi574`, based on `252a784e8a55ae48d09920be396d709b8e60dd7a`.
- Read the current handoff, visual identity document, recent session entries, implementation, and tests.
- Isolated review snapshot: `/tmp/football-review-20261107`. Restored the committed base with Git archive and overlaid changed files read through GitHub. Rebuilt generated `index.html` has Git blob SHA `61f60e7d2d0beca03a1b82d161975cd28e6e4e95`, matching the branch's generated file exactly.
- Original checkout's existing trophy-rendering edit remains untouched. No product code, branch, published site, installed game, or user save was changed.

## Verified findings

1. **Legacy credits false national championships.** `legacy-snapshot-adapter.js` copies `tenure.seasons[].champ` as a national title. The originating admin review uses `t.champ`, which is also set for conference winners. Seed 7, Chicago Metropolitan, 2027: the team finished 10–4, won its conference, and did not win the national championship. After offseason review, Legacy credited one national title. Use authoritative national championship history rather than the ambiguous tenure flag.
2. **Legacy counts a completed season twice.** `legacy.js` combines all tenure seasons with the current completed season without deduplicating years. The same 2027 run's one conference championship became two. The best-ever store preserves this inflated total into later seasons, so a fix must also consider already-written device records.
3. **Bowl ceremony data can carry into the next year.** After the 2028 bowl win and rollover to 2029 Week 0, the ceremony adapter still returned a bowl milestone under the new year. It reads the retained `universe.bowls` list without validating the game's season. This proves stale milestone data, not a visually observed duplicate modal.
4. **Narrative continuity is limited.** `storylines.js` selects the highest-scoring current arc per player, with type caps. It has no follow/watch selection or prior-story continuity tracking. This is an upgrade opportunity, not a simulation failure.

## Validation

- Build matches the reviewed branch's generated HTML exactly.
- Version/build plumbing passed; smoke suite passed 53/53.
- Two-season engine/adapter probe completed 2027 → 2028 → 2029 using normal engine progression and offseason actions. History-based storylines appeared in year two. Adapter reads preserved serialized save and gameplay RNG at every sampled checkpoint. The probe also exposed the correctness findings above; completion is not a blanket feature pass.
- Draft milestone data appeared in the offseason. This run did not prove the complete Signing Day ceremony or any modal rendering.
- Browser suite could not start: Chrome exited with SIGABRT. The preview browser separately denied the local file URL. No browser matrix, desktop/phone screenshots, visual playthrough, packaged app, or real-device validation is claimed.
- Full `npm test` completed successfully: version/build checks, 53/53 smoke checks, and 566/566 Node tests (0 failed, cancelled, skipped, or todo). The Node test-runner portion took about 222 seconds. The suite's green result does not cover the adapter correctness defects exposed by the separate two-season probe.

## Recommended upgrades, in order

| Priority | Upgrade | Experience | Keep it light |
|---|---|---|---|
| 1 | Weekly changes briefing | A few genuinely new developments, next matchup stakes, and the one decision that matters most | Consolidate existing desk/news/story cards; no obligation to read every story and no manufactured weekly decision quota |
| 2 | Recurring cast and callbacks | Follow a recruit, former player, rival coach, or rising program; recognize them when their paths cross yours | Optional following; show updates only when something changes; use actual stored identity and history |
| 3 | Standing staff instructions | Build on existing delegation so routine training, scouting, and roster upkeep follow chosen priorities | Ask again only for meaningful exceptions; delegated play must remain viable, with clear responsibility for consequential choices |
| 4 | Visible league consequences | Connect coaching moves, scheme changes, recruit movement, rankings, and upcoming opponents | Report supported chains of events, distinguishing chronology from proven causation; no invented quotes or mechanics |
| 5 | Distinct football settings | Use the existing visual identity for a restrained weekly sports cover, matchup presentation, signing board, and season history wall | Put it within existing views; avoid extra rooms to navigate, extra clicks, repeated entrances, or constant animation |
| 6 | Flexible session pacing | Brief recap → optional decisions → game → short consequences; let users stop at meaningful boundaries | Reuse existing advance/delegation controls; never silently cross a major commitment or bury a real blocker |

## Design standard

An ordinary week should be playable quickly. The league can be busy while the player's inbox stays quiet. Major decisions and earned milestones deserve attention; informational stories should not require acknowledgement. Preserve depth for users who open it, and surface only meaningful changes by default.

Start with briefing consolidation and recurring-story continuity after correcting the verified history errors. Expand delegation where concrete friction remains. The helmet editor and additional ceremonial effects can wait; they do less to make the world feel connected.
