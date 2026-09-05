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

## Browser validation — RESOLVED

Run on a environment with Chromium available, against the merged v0.9.46 head:

- `tests/browser.js`: 113/113 pass (desktop + iPhone).
- `tests/visual.js`: 35/35 pass (after the fix below; 34/35 before it).
- `tests/recruit-visual.js`: 21/21 pass.

### One real failure, found and fixed

`[iphone] game-day card has no horizontal overflow — 10px`. This was not a
test artifact and not caused by v0.9.46; it shipped live in v0.9.44.

At `max-width:720px` the game-day board is laid out as
`minmax(0,1fr) 54px minmax(0,1fr)` with only 8px of side padding, so its two
`.matchup-team` cards already sit flush to the card edge. The entry animation
(`matchup-in-left` / `matchup-in-right`) starts them at `translateX(±18px)`,
which puts them outside the card before settling — clipped by
`#nextGameCard`'s `overflow:hidden`, so on a phone the cards slid in from
behind a hard cut edge, and `scrollWidth` exceeded `clientWidth` by 10px for
the animation's duration.

Fixed by entering vertically instead of horizontally at that breakpoint
(`matchup-in-up`, `translateY(10px)`). The desktop horizontal slide is
unchanged, since it has the room for it.

This is the second bug of exactly this shape in this file's mobile rules
(see the v0.9.41 `.scoreboard` cascade fix): narrow-width overrides in
`sports-presentation.css` are worth checking against the animation and
cascade rules around them, not just in isolation.
