# Dynasty Lab — v0.9.3 live checkpoint

Repository: https://github.com/MarkJRogers92/Football
Canonical development branch: `claude/review-improvement-dwjemy`
Housekeeping branch: `codex/v0931-housekeeping`
Live site branch: `gh-pages`
Production: https://markjrogers92.github.io/Football/

## Current state

The live game is **Dynasty Lab v0.9.3**. Football is now both the canonical source repository and the GitHub Pages host; the old Property-Lookup deployment is no longer part of the normal workflow.

Completed milestones that must not be redone:

- **v0.8.1** — safe incremental browser archive persistence, complete portable JSON export/import, deferred historical-player hydration, migration/failure handling, recruiting audit correction, and v0.8.1 simulation/performance fixes.
- **v0.9.0** — Promises Become Debts, stable coach identity, promise audits/consequences, and dynasty event-ledger foundation.
- **v0.9.1** — transfer destinations and memory. The same player object moves, keeps one career, and retains recruiting/coach context and transfer history.
- **v0.9.2** — permanent Game Center and historical box scores with stable game IDs, team/player snapshots, drive summaries, injuries, leaders, history links, and portable save support.
- **v0.9.3** — Portrait V1 integration. Players/recruits receive deterministic portrait identity; recruit-to-signee identity survives signing, saves, transfers, and archive. School jersey colors are deterministic. Roster/profile portraits render through the frozen renderer. Version handling was also single-sourced through `VERSION.txt` so release labels cannot silently drift again.

## v0.9.3 validation already completed

Portrait integration was validated with 52 engine checks, 21 storage/persistence/promise/transfer/game/portrait test groups, and 63 desktop/390px browser checks. The follow-up single-source-version change reported 52 engine checks, 22 test groups, and 63 browser checks.

The GitHub Pages publishing workflow was moved entirely into this repository and round-tripped against the live `gh-pages` branch: production publish, preview publish, preview listing, preview removal, and preview-index cleanup all worked.

Actual iPhone Safari remains a separate real-device validation item; responsive Chromium/iPhone-width testing is not the same thing.

## Publishing and rollback

Source changes belong on a development branch. `gh-pages` contains only the generated site.

Production publish:

```bash
npm run publish
```

Preview publish:

```bash
npm run publish:preview -- NAME
```

List/remove previews:

```bash
node tools/publish.js --list
node tools/publish.js --remove NAME
```

Production URL: https://markjrogers92.github.io/Football/
Preview index: https://markjrogers92.github.io/Football/preview/

Do not hand-edit generated `gh-pages` files as the development source. To roll back production, republish the last known-good source commit/build rather than rewriting save data.

## Important storage limits

The permanent Game Center currently keeps compact game archives in the core save. A seeded 745-game season was measured around 6.6 MB of game records. Full play logs are not permanently retained; box scores and drive/scoring summaries are. Long 30–50-year mobile scalability is not yet proven.

Read `STORAGE.md` before changing browser save/archive behavior. Do not prune careers or historical games without an explicit user decision.

## Next roadmap sequence

Because v0.9.3 was used for Portrait V1 rather than the originally planned coaching-career milestone, shift the coaching roadmap forward instead of pretending it already shipped.

### v0.9.4 — Persistent coaching careers

Build one bounded coaching-career slice first:
- durable coach identities and full career stints
- age/role/school/scheme/specialty history
- coordinator/head-coach movement history
- visible career profile/history without exposing hidden personality numbers
- persistent player/recruit links to coach IDs
- retirement/archive path rather than deleting coaches

Do **not** build the entire coaching market in this same chunk.

### v0.9.5 — Coaches take relationships with them

- primary recruiter links
- departing coach carries a tuned share of recruit relationship
- current players he recruited receive transfer-risk/interest effects
- new school receives relationship pressure, not automatic flips
- Weekly Hub surfaces recruiting fallout

### v0.9.6 — Coaching market

- openings
- candidate pool
- interviews/offers
- salary/years/role/play-calling authority
- internal promotions
- AI hiring based on fit rather than raw rating only

### Later v0.9 batches

Then continue with scholarship scarcity/pulled offers and recruiting pressure, scheme-change hangover, position-change willingness, record chases, high-school relationship feedback, and the broader story-surface pass. Preserve the existing decommit/flip system already shipped in the v0.8.1 follow-through rather than rebuilding it from scratch.

## Resume prompt

Continue Dynasty Lab from `MarkJRogers92/Football`. Read `CONTINUATION.md`, `STORAGE.md`, `CHANGELOG.md`, and `ROADMAP_V09.md` before editing. The live release is v0.9.3 at `https://markjrogers92.github.io/Football/`; v0.9.0 promises, v0.9.1 transfers, v0.9.2 Game Center, and v0.9.3 Portrait V1 are complete. Do not redo them. Implement only one bounded v0.9.4 persistent-coaching-career slice, preserve save/history compatibility, test it, commit it on a development branch, publish a preview first, update the handoff, and stop for review before production promotion.
