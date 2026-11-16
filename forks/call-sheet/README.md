# Dynasty Lab: Call Sheet (experimental fork)

**Status:** design only. Nothing in this folder is loaded by the build, the tests or the shipped game.
`tools/build.js` injects modules from a fixed list, so files here can't leak into Dynasty Lab.

**Working title:** *Call Sheet*. It's named after the laminated play sheet a coordinator holds on the sideline,
which is the central object of the proposed battle design (see `DESIGN.md` §3).

## Why a folder and not a GitHub fork (yet)

Right now the fork is a set of design documents. A separate repository only pays off once there's code to keep
apart. Until then, one folder in the main repo keeps the design next to the source it depends on: the
archetypes, roles, scouting confidence and Game Engine 2.

When a prototype is authorized, the recommended order is:

1. **Standalone battle sandbox** (`forks/call-sheet/sandbox/`, a single HTML/JS page). It imports only
   `rng.js`, `game-engine-v2.js` and `game-conditions.js`, plus a frozen copy of the archetype/role tables.
   There's no dynasty, no saves and no build integration. Its job is to prove the battle is fun (`DESIGN.md` §7).
2. **Real fork** (a separate repo, or a long-lived `call-sheet` branch), created only after the sandbox meets
   its evidence bar. That fork replaces the Saturday game-day screen with the battle and keeps everything else.
3. Base Dynasty Lab stays untouched throughout. Any shared improvement (for example, an outcome hook in Engine 2)
   goes to the base game as its own reviewed change.

## Files

| File | Contents |
| --- | --- |
| `DESIGN.md` | The review of the 2026-11-15 handoff, in the order its Section 18 requested, plus the unified game concept |
| `README.md` | This file: fork strategy and the reuse map |

## Reuse map (verified by reading source on 2026-11-16, v0.36.0)

| Existing system | File(s) | Use in Call Sheet | Verified? |
| --- | --- | --- | --- |
| Game state machine: downs, clock, scoring, kicks, punts with returns, penalties, OT, two-point shootout | `game-engine-v2.js` | Keep as the referee. The card resolver produces an `outcome` object and hands it to `applyScrimmage` | Yes. `step()` already separates `generateOutcome()` from `applyScrimmage()` (`game-engine-v2.js:350-355`) |
| Snap outcome generation | `generateOutcome()` in `game-engine-v2.js` | **Replace for user-played games.** It uses one team rating, a random pass/run flip (53%) and a Gaussian. No plays, players or assignments exist in it | Yes, read directly |
| Deterministic RNG with snapshots | `rng.js`, `state.rng` | Pile order, draws and duel rolls stored the same way, so save/resume can't reroll a hand | Pattern verified; card use is new |
| Weather and stadium effects | `game-conditions.js` | Feed duel modifiers (wind → deep duels, rain → ball security) | Yes |
| Player archetypes (about 60), seven traits, descriptions | `app/01-identity-rng.js` (`STYLE_TRAITS`, `ARCHETYPE_DESCRIPTIONS`) | Each archetype becomes a card **Signature** (`DESIGN.md` §6) | Yes |
| Offensive/defensive scheme identities | `OFF_SCHEMES`, `DEF_SCHEMES` | Seed call sheets and AI coordinator tendencies | Yes |
| Role depth (QB1, X, Z, SLOT, TE1, MOVETE, RUSH, NICKEL, FS, BOXS…) | `ROLE_DEFS`, `makeRoleDepth` | The persistent lineup. Duels name roles, roles name people | Yes |
| Scouting domains with confidence ranges | `app/02-players-scouting.js` | Progressive reveal on recruit cards. Unknown traits show as ranges on the card face | Yes |
| Per-player box-score attribution | `game-engine-v2-attribution.js` | Today it assigns stats after the fact. The resolver knows who won each duel, so it can attribute directly | Partly. Attribution is post hoc today |
| Players of the Week | `players-of-week.js` | A weekly "Saturday Standout" card edition | Exists; edition is new |
| Portrait renderer | `portraits/renderer-v1.js` | Card face art, already deterministic per player | Exists |
| Game Day transaction/record back into the season | `game-engine-v2-transaction.js`, `-record-*.js` | Write the battle result back exactly as a coached game does today | Exists; the fit needs verifying when building |

**Must verify before building:** whether `applyScrimmage` and the kick functions can be exported without changing
base-game behavior; how live-game save/resume serializes a session (`game-engine-v2-gameday.js`); and whether the
record path assumes `generateOutcome`'s pass/run split anywhere.
