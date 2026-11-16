# Call Sheet fork plan: Dynasty Lab's depth, card battles on Saturday

**Goal:** a separate game, forked from the current Dynasty Lab (v0.36.0), with all of its recruiting, scouting,
development, staff, portal, history and presentation. The only change at its heart: **the games you coach are
Call Sheet card battles**, and the card meta (playbook, packs, evolution, signature cards) layers on top.
Dynasty Lab itself stays exactly as it is.

## Where the fork lives

**Recommended:** a separate GitHub repository (for example `call-sheet`), created as a **copy** of this
repository with its full history, then developed independently. GitHub can't fork a repo into the same account,
so this is "create an empty repo, then push this one into it". That repo becomes the fork. Bug fixes can still be
cherry-picked between the two later if wanted.

Not recommended: a long-lived branch here. It's easy to merge by accident, and it shares releases, issues and CI
with Dynasty Lab.

## What's already proven (2026-11-16)

- `core/adapter.js` reads a **real Dynasty Lab team** (`roster` + `roleDepth`) into a battle lineup.
  Dynasty Lab players already carry everything the battle needs: the same seven traits, archetype (`style`),
  class year, jersey number and portrait seed.
- `tests/adapter.test.js` generates a real universe with the actual engine (`tools/harness.js`), converts 40
  teams (all 22 roles filled from depth charts, no fallbacks needed), and plays a full card battle. Every stat
  line belongs to a real roster player.
- **Recording works through Dynasty Lab's own path.** A battle's game is a Game Engine 2 state, which is what
  `game-engine-v2-transaction.js` (`buildCandidate`, `validateCandidate`, apply) consumes. Records, stats,
  awards and history then follow unchanged.

## What changes in the fork

| Dynasty Lab system | In the fork |
| --- | --- |
| Recruiting, scouting, interest, pitches, commitments, portal | **Unchanged.** Recruits matter because they become the people in your duels |
| Development, training, camp battles, depth chart | **Unchanged.** The depth chart sets who plays each battle role |
| Graduation, eligibility, redshirts | **Unchanged** (replaces the slice's simplified `classes.js`) |
| Staff, schemes | Feed the battle: coordinator personality (lean discipline, run/pass mix) and installable cards |
| Coached game day (`game-engine-v2-gameday*`) | **Replaced by the Call Sheet battle screen** (the slice's arcade UI) |
| Simulated games (other teams, delegated weeks) | Unchanged: Dynasty Lab's sim keeps running the rest of the country |
| Weekly hub | Adds the post-game pack, evolutions and breakouts to the week's flow |
| Archetype signatures, signature cards | Built from real players. A signature card retires with Dynasty Lab's own graduation |
| Rivalries, trophies, weather | Use Dynasty Lab's real rivalries, trophies and `game-conditions.js` weather |
| Packs and legendaries | AI programs in the real conference open packs too (lightweight, as in the slice) |

## Build order in the fork

1. **Copy and boot:** the fork builds and runs as Dynasty Lab with no changes. All existing tests pass.
2. **Battle modules in the build:** add `call-sheet/core/*` and the slice UI to `tools/build.js`'s module list.
3. **Coach a real game with cards:** from the weekly hub, "Coach this game" opens the battle with both real
   rosters (adapter). The result is saved through `buildCandidate`. Simulated games are untouched.
4. **Playbook in the save:** the program's playbook, packs, mastery, signatures and combo book are stored on the
   controlled team, versioned with Dynasty Lab's save format and validated on load.
5. **Recruiting shows card impact:** recruit profiles and the depth chart show each player's game impact
   (archetype effect, duels he plays, signature potential), the same one-line "what he changes on Saturday" as the
   slice.
6. **AI playbooks:** every program gets a lightweight playbook that grows by identity, so opponents feel built.
7. **Polish:** packs, evolutions and breakouts in the weekly flow, reduced reading, phone layout.

## Open decisions (defaults chosen; easy to change)

- **Game length:** Key-moments mode by default; every-snap and sim stay available.
- **Opponents' rosters:** the real ones, with their depth charts and injuries.
- **The slice:** stays in the fork as a quick-play test harness.
