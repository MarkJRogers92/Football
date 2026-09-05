# v0.9.46 validation checkpoint

Branch: `codex/v0946-offseason-calendar`

## Calendar contract verified

- The stored sequence is `review → departures → signing → portal → spring → fall → preseason`.
- Season records, honors, administration, coaching and player-season archives finalize during review.
- Graduates, declarations and portal entrants leave before either development window.
- Signed freshmen and placed transfers join before spring and fall camp.
- Each phase records completion only after its synchronous mutation finishes.
- Every boundary survives a portable save/load cycle.
- Repeating review, departures, signing, portal, spring or fall does not duplicate work.
- Legacy saves retain old camp completion flags so development is not replayed.

## Targeted regression results

- Offseason calendar and migration: 7/7 pass.
- Headless engine smoke: 53/53 pass across eight seasons.
- Persistence, promises, transfers, career, signing, schemes, scholarships and weekly plan: pass after calendar-contract updates.
- Complete Node regression reached 171/172 with one stale scouting enrollment fixture; after moving that fixture to the explicit signing phase, scouting plus the full calendar suite pass 10/10.
- Five-season simulation audit: pass through 2031. Roster range remained 85–100; prestige mean remained 66.5; no transfer entries remained stranded.

## Twelve-season soak

The 2027–2038 soak completed without an exception. Mean player ability remained
between 64.4 and 66.5 and mean prestige remained between 66.4 and 66.5. Prestige
standard deviation narrowed from 16.7 to 14.0, consistent with the pre-existing
long-run behavior rather than a calendar failure.

Portable `packUniverse` size grew from 36.0 MB after the first season to 162.9
MB after twelve seasons, roughly 11.5 MB per additional season. That confirms
the existing archive-growth concern and belongs to the measured v0.9.49 storage
packet; it is not caused by duplicated v0.9.46 phase execution.

## Remaining environmental check

Browser UI, visual and real IndexedDB suites still require Chromium. The local
download timed out repeatedly, so no browser result is claimed here.
