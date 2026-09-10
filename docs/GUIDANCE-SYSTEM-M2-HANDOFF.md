# Dynasty Lab Guidance System — Milestone 2 Handoff

## Completion state

- Original branch: `codex/guidance-system-m2`
- Milestone 1 base: `7310e41c0de89d9250a1aae279b8cddfae6fec53`
- Milestone 2 implementation: `05796974d6a5f27ea87e9e88fe8f23bbf82e14c3`
- Status: the planned player-facing guidance foundation is complete through Milestone 2.
- Integrated onto the current Take the Job source line for the `v0.12.2` release.
- `VERSION.txt`, `APP_VERSION`, `package.json`, and the generated user-visible labels
  are aligned at `0.12.2`.

## What Milestone 2 adds

The live guidance model from Milestone 1 now adapts without becoming a second task
system:

- Opening a guidance item records bounded familiarity for that category and team.
  Once an explanation is familiar, its cause and consequence collapse behind an
  accessible **Why this matters** disclosure while the actionable facts stay visible.
- Staff recommendations and monitoring items can be snoozed for the current calendar
  boundary and restored at any time. Must-resolve and decision-due guidance cannot be
  snoozed.
- Returning to a dynasty after at least six hours shows a compact, dismissible summary
  of the current boundary, live guidance counts, and leading items. It explicitly says
  that no simulation occurred while the player was away.
- Familiarity and snooze preferences are saved per team inside the dynasty. The
  welcome-back card is transient UI state and is never written into the universe.

The Agenda, Advance Forecast, and Next Action continue to derive their truth from the
same authoritative gameplay state and advancement eligibility rules introduced in
Milestone 1.

## Persistence contract

`guidanceState` is a small, backward-compatible record:

- schema version `1`;
- independent records keyed only by real team IDs;
- familiarity values restricted to known guidance categories and capped at `3`;
- snoozed item IDs restricted to that team, limited to optional live guidance, capped
  at 100 entries, and stamped to the current season/phase/week/offseason subphase;
- malformed records and unsupported future versions normalize safely;
- legacy saves with no record receive an empty valid state;
- save/install failure restores the prior transient return state.

Snoozing changes presentation only. It does not remove underlying guidance facts,
change the forecast, satisfy a decision, alter an advancement gate, mutate gameplay
state, or consume gameplay RNG.

## Validation performed

- `npm run build` succeeded, and a second fresh build matched `index.html`
  byte-for-byte.
- `npm run test:guidance` — 18 passed, 0 failed.
- Focused guidance, persistence, storage, save-slot, preseason, career-block, and
  next-action coverage — 61 passed, 0 failed.
- `CHROMIUM_PATH=... node tests/guidance-system-browser.js` passed the Agenda,
  familiarity, snooze/restore, welcome-back, direct-navigation, and 390px layout flow.
- `CHROMIUM_PATH=... node tests/postseason-next-action-browser.js` passed conference
  championships, bowls, playoff progression, and non-blocking warning behavior.
- `npm test` — 387 passed, 0 failed.
- JavaScript syntax checks and `git diff --check` passed.
- A final independent rules/persistence audit found no confirmed release-blocking
  issue and verified that the generated app matches its sources.

## Deliberate boundaries

This completion does not add new staff-delegation rules, situation-file/event-history
infrastructure, outcome receipts, a personal strategy planner, or conversational
advisors. Those are separate product expansions, not required for the completed
guidance foundation.

Portable JSON exports retain the persistent guidance preferences, but they do not
carry the save wrapper's `savedAt` timestamp, so importing an export does not invent a
welcome-back interval. Familiarity advances only when the player explicitly opens an
item; merely rendering the Agenda never changes it.

## Recommended next product work

Expand authoritative situation coverage only when a real decision, default, deadline,
and destination already exist in the game. New cases should plug into the shared model
and eligibility contract instead of introducing a parallel checklist or tutorial flow.
