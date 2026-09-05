# Strategy integrity audit

Checkpoint: v0.9.39 plus player-identity commits through `2e4427f` on
`codex/player-identity-batches`. This is a source audit, not a release claim.

## Standard

A strategy surface is **functional** when a player can predict the direction of
its effect and the simulation reads that same state. It is **partial** when it
has a real but narrower effect than the UI implies. It is **decorative** when it
does not affect the promised outcome, or when displayed evidence is disconnected
from the hidden state eventually used by the game.

Randomness is appropriate after the matchup establishes the odds. It must not
replace the matchup. The desired chain is:

`scouted evidence -> roster/depth/scheme/gameplan choice -> matchup probabilities -> actual plays -> box score/history`

## Findings

| Surface | Status | What the engine actually does | Main gap |
| --- | --- | --- | --- |
| Offensive scheme pass tendency and pace | Functional | Directly changes pass share and play/drive volume in both engines. | Situational play calling is still shallow. |
| Defensive scheme pressure and run control | Functional/partial | Pressure and run values affect relevant formulas. | Scheme coverage barely affects quick sim and does not directly enter detailed completion outcomes. |
| Scheme fit | Partial | Core attribute averages affect team profiles; transition familiarity imposes a real penalty. | Only QB archetype gets an explicit style-fit bonus. Team fit is a broad average rather than package/on-field fit. |
| Overall/current rating | Functional but blunt | `trueNow`, health and wear drive unit strength; unit strength drives most game probabilities. | A generic overall often matters more than the position-specific ratings the UI invites the player to study. |
| Position ratings | Partial | They select role starters and distribute individual yards, tackles, sacks, interceptions and negative OL events. Detailed QB/RB/WR plays read a few attributes directly. | Many ratings rearrange the box score after team totals are generated instead of changing whether the team succeeds. |
| Player archetype | Partial, improved on branch | New branch logic directs QB/RB/receiver/defender/OL statistical usage. | Generated ratings are still independent of the label; Watch Mode does not yet use the same actors/tendencies. |
| Role depth chart | Functional/partial | Chooses the players used by unit ratings and individual stat allocation. Availability fallbacks work. | Overlapping roles can stack usage and packages/formations are not simulated explicitly. |
| Weekly gameplan | Functional | Stop-run, protect-pass and pressure trade one component for another; full/balanced prep add smaller general edges and charge wear. | Recommendation reads only opponent scheme pass rate, ignoring roster strength, injuries, role matchups and observed production. Existing outcome test asserts the wrong defensive direction and is not a trustworthy balance gate. |
| Matchup screen | Partial | Displays real raw unit/profile values. | It does not display gameplan-adjusted values, home field, likely play mix, numeric edges, opponent injuries, role mismatches or uncertainty. “Scheme fit” is team-wide, not opponent-specific. |
| Active-player scouting | Functional | Position domains derive from actual hidden attributes; confidence narrows ranges with experience/camps. | The game does not clearly show which game outcomes each domain changes. |
| Recruit scouting | Disconnected | Domain “truth” is a deterministic variation around recruit overall because recruits have no hidden position attributes. | At signing, a new player's attributes are generated independently while the old scouting domains/history are retained. Scouting can therefore describe abilities the signee does not have. This is the highest-priority integrity defect. |
| Strengths and weaknesses | Mostly absent | Unit grades and scheme labels provide raw ingredients. | No shared evaluator converts evidence into honest actionable claims such as “their tackles struggle with speed rush” and then uses that same edge in the simulation. |
| Injuries, availability and wear | Functional | Remove or weaken players used by role and unit calculations. | The matchup UI does not explain the resulting personnel edge well. |
| Morale | Context-specific | Drives transfer risk and some player-management systems. | It does not affect game performance; any performance implication would be decorative. |
| Staff | Functional/partial | Play-calling affects team profiles and detailed plays; development/evaluation/recruiting ratings affect their named systems. | Generated specialty text mostly describes rating shape rather than adding a distinct tactical effect. |
| Individual statistics | Functional downstream | Drive awards, records, career history and draft production components. | They do not inform opponent tendencies, gameplan recommendations or adaptive defensive choices. Detailed stats are still redistributed after narration. |
| Home field | Functional | Fan support creates a bounded score bonus and neutral games suppress it. | It is omitted from the pregame matchup explanation. |
| Watch Mode attribution | Disconnected | Team outcomes use matchup formulas, then individual stats are allocated. | Narration names one RB/WR while the box credits multiple players; QB runs and targets are not actual recorded play actors. |

## Critical code evidence

1. `scoutingTruth(..., recruit=true)` builds every position domain from recruit
   overall plus a hash. It cannot distinguish real arm, route, coverage or line
   traits because those fields do not exist on recruits.
2. `runOffseason` calls `generatePlayer` at signing, then overwrites identity and
   overall fields from the recruit while retaining newly randomized attributes
   and the recruit's old scouting history.
3. `unit` reduces active role starters to `conditionRating`, which is overall
   minus health/wear. Most team-level outcomes therefore do not read the richer
   role-fit rating directly.
4. Quick sim creates team totals first; `applyGameStats` allocates those totals.
   The branch's archetype work makes allocation more honest but cannot make a
   player's skills change team success without an upstream matchup change.
5. Detailed sim chooses one QB/RB/WR at drive start. Every narrated run uses that
   RB and every target uses that WR, before `applyGameStats` redistributes totals.
6. `renderGameLab` uses raw `profiles`, so it cannot show the chosen gameplan's
   adjusted matchup even though `gameProfiles` applies it during simulation.
7. The gameplan recommendation compares only the opponent scheme's base pass
   share to fixed thresholds. It performs no personnel or evidence analysis.

## Repair order

### 1. Establish one persistent player truth

Give recruits the same hidden position attributes a player will retain after
signing. Generate archetype from that profile (or shape the profile from the
archetype), scout those exact fields, and carry them unchanged into the roster.
Do not retrofit old saves or rewrite historical evaluations. Additive migration
can generate hidden traits only for newly created recruiting classes; existing
recruits should be clearly treated as legacy evaluations until they sign.

Acceptance: holding a recruit constant, higher scouting confidence converges on
the exact signed-player domains; export/import preserves both truth and belief.

### 2. Build a shared matchup model

Calculate named edges from the actual role starters, ratings, scheme, health,
wear, staff and gameplan. Examples: pass protection vs rush, run blocking vs
front, target group vs coverage, QB processing vs pressure. Both game engines
and the matchup UI must consume the same object.

Acceptance: changing one relevant rating moves the named edge and the paired
simulation outcome in the expected direction; irrelevant ratings do not.

### 3. Make the strategy screen actionable and honest

Show the expected play mix, adjusted unit edges, important unavailable players,
home-field effect, evidence confidence and the likely benefit/cost of each plan.
Recommend a plan from matchup evidence, not scheme label alone. Avoid fake point
predictions until calibration supports them.

Acceptance: every displayed strength/weakness includes its evidence, confidence,
suggested response and the exact matchup-model key affected by that response.

### 4. Record actual plays and derive detailed stats

Choose runner and target per play from shared role/archetype usage, add designed
QB runs and scrambles, record relevant defenders, and derive narration and box
scores from those events. Keep quick sim aggregate-first for speed, but validate
both engines against the same matchup direction tests.

Acceptance: every named action reconciles with player/team totals; Watch cannot
credit a player who was not the recorded actor.

### 5. Tune with counterfactuals, then distributions

First use paired seeds with one controlled change: rating, starter, scheme or
gameplan. Assert directional effects and conservation. Then run 50–100 isolated
games per important comparison. Use longer season calibration only after these
causal checks pass and only when a season-level question requires it.

## Immediate small batches

1. Fix recruit truth continuity and tests. **Implemented on this branch.** New
   recruits carry seven persistent traits; active-cycle legacy recruits retain
   the old fallback and are labeled. A fresh 2,800-recruit save increased from
   16,606,083 to 16,865,918 bytes: +259,835 bytes (+1.56%).
2. Add shared matchup edges for pass protection/rush, run game/front and targets/coverage.
3. Render those edges plus gameplan adjustments and replace the shallow recommendation.
4. Correct the gameplan outcome test and add paired directional tests.
5. Convert detailed play attribution in a separate storage-measured batch.

Production remains v0.9.39. Each batch should be committed and pushed separately;
run one full validation only when the combined milestone is ready for preview.
