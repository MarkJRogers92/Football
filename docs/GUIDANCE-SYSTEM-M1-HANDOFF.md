# Dynasty Lab Guidance System — Milestone 1 Handoff

## Continuation state

- Branch: `codex/guidance-system-m1`
- Integration base: `origin/codex/true-preseason-start` at `6e179986659adad2d5f29dbcc291c8c2bdcdb63a`
- Final implementation commit: `b29affdb5c417c260e5df43f95710e54989cde1c`
- This work is local only. It was not pushed, merged, published, deployed, packaged, or released.
- `VERSION.txt` and `package.json` remain at `0.11.9`.

## Implemented behavior

The Command Center now derives a live guidance view from authoritative dynasty state:

- **Coaching Agenda** shows roughly three leading items, keeps genuine blockers first,
  expands lower-priority items, and has an explicit quiet state.
- **Advance Forecast** names the actual next simulation boundary, what that action
  processes, and whether the game is blocked, ready with cautions, or ready.
- **Current Plan** summarizes saved schemes, development focus, active recruiting
  targets, and the current unplayed game's plan without requiring confirmation.
- Guidance items open the existing decision or domain screen. A small origin bar
  returns to the Agenda without changing the calendar.
- The existing briefing wire remains in place for results and historical events.
- The main Next Action control now follows the live forecast and existing canonical
  advancement controls.

The model is computed on demand. It does not persist a duplicate task list, generate
decisions, mutate state, consume gameplay RNG, or simulate future results.

## Supported situations and authoritative rules

| Situation | Meaning | Source of truth and boundary |
| --- | --- | --- |
| Pending coaching job offers | Must resolve | Existing career offers block regular-week, season, detailed-game, and post-review offseason advancement. Season Review itself may still run first. |
| Open Coach's Desk personnel decisions | Must resolve | Existing unresolved non-gameplan weekly decisions block Advance Week and detailed play. Sim Regular Season retains its existing staff-delegation behavior. |
| Weekly game plan | Decision due | The current unplayed matchup uses the existing Standard plan if no choice is made. This warns but does not block. The item retires after the game is played. |
| Scholarship overage | Decision due | The warning is tied to playoff completion, when `finalizeRecruiting()` enforces class capacity and may pull the weakest commitments. It never creates a new blocker. |
| Open staff position | Staff recommendation | Existing open coaching-market records produce optional hiring guidance. The interim state remains valid if the player advances. |
| Empty recruiting board | Staff recommendation | During opening preseason or the regular season, available class room with no active targets produces optional guidance. Recruiting may still advance unchanged. |

Stable item IDs are scoped to team, season, kind, and occurrence. Resolved, expired,
stale, or removed targets are filtered from live work while their historical events
may remain in the briefing wire.

## Advancement integration

One eligibility helper now supplies both the forecast and the relevant live actions:

- Begin Season;
- Advance Week and Sim Regular Season;
- detailed Game Lab play;
- postseason button availability;
- offseason phase advancement.

The action revalidates immediately before running. No new confirmation dialog or
mandatory tutorial click was added to an ordinary valid week. The true-preseason
boundary remains intact: Begin Season opens Week 1 without simulating it.

## Validation performed

- `npm run build` — generated `index.html` from the source files successfully.
- `npm test` — 378 tests passed, 0 failed on the integrated milestone. The final
  audit corrections were then covered by the focused tests below.
- `node --test tests/guidance-system.js tests/next-action.js` — 17 passed, 0 failed,
  including purity/RNG, old-save normalization, blocker/default behavior, played-game
  expiry, scholarship timing, and the offseason review exception.
- Existing focused career, game-plan, Coach's Desk, offseason-calendar, and preseason
  tests passed while the shared gates were integrated.
- `CHROMIUM_PATH=... node tests/guidance-system-browser.js` — desktop and 390px-wide
  checks passed for Agenda, Forecast, Current Plan, direct navigation, return context,
  live recomputation, no-time-cost navigation, and no routine confirmation.
- `CHROMIUM_PATH=... node tests/postseason-next-action-browser.js` — postseason
  Next Action advanced conference championships, bowls, and playoff correctly, with
  non-blocking warnings preserved.
- JavaScript syntax checks and `git diff --check` passed.
- A final independent rules/persistence review found no remaining confirmed mismatch
  in advancement boundaries, stale guidance, hidden information, save behavior, or RNG.

## Known limitations and deferred work

Milestone 1 intentionally does not implement:

- adaptive or fading onboarding;
- persistent snooze/deferral choices;
- new staff-delegation rules beyond existing season-simulation behavior;
- connected situation files or a new event-history framework;
- outcome receipts;
- personal strategic priorities;
- conversational advisors;
- return-after-absence summaries.

The first milestone covers current authoritative situations rather than every future
decision type. Old unresolved decision rows may remain in a save, but expired rows are
filtered from live guidance instead of being rewritten. Monitoring is supported by the
model vocabulary but stays quiet until a real, non-speculative use is designed.

## Recommended next milestone

Milestone 2 should add a lightweight familiarity layer: remember which explanations a
player has already seen, allow optional items to be deferred without changing simulation
rules, and provide a compact return-after-absence summary. That work will require an
explicit backward-compatible save contract; it should continue to derive live urgency
and advancement eligibility from the Milestone 1 model rather than creating a second
task system.
