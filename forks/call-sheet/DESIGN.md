# Dynasty Lab: Call Sheet — Review and Unified Design

**Reviews:** *Dynasty Lab Card Battler Review Handoff* (2026-11-15)
**Date:** 2026-11-16
**Status:** design proposal. Nothing is implemented. Every number here is a paper value to be tested.

The sections follow the handoff's Section 18 order (1–8). Two additions come after them: research notes (§9),
including how OOTP's Perfect Team handles cards, and the unified game concept with its visual direction (§10).
`README.md` covers source reuse.

---

## 1. Design assessment

**The core loop is promising.** It's also more original than the two existing football deckbuilders I found.
*4th & Goal* already ships the "play card + one modifier, resolved against the defense's card" snap, and
*Dynasty!* ships play cards plus player skills plus stadium upgrades. Both are run-based roguelites. Neither has
a persistent world in which **a specific person you scouted and developed is why a combination works.** That's
the moat, and every rule should serve it.

**The main threat isn't the hand architecture. It's two things the handoff doesn't address directly:**

1. **The handoff never says how a snap resolves.** "Ratings, traits, familiarity and assignments affect
   resolution" describes a goal, not a rule. Without a concrete resolution model, no one can check whether
   recruiting changes decisions (question 4), because nothing yet connects a player to an outcome. The source
   makes this urgent. Game Engine 2's `generateOutcome()` uses **one team rating per side and a random 53%
   pass/run flip**. No plays, no players, no assignments (`game-engine-v2.js:337`). The battle needs a new
   resolution layer. §4.3 proposes one: **three named duels per play**.
2. **Volume.** A college game is about 140 scrimmage snaps, and the user would make a call on every one, on both
   sides of the ball. A *Slay the Spire* fight is 5–10 turns. At 20–25 seconds per decision, a fully hand-called
   game takes 45–60 minutes before animation. That's the likeliest way for a fun snap to become a tedious game.
   §4.9 proposes **Key Downs**: your coordinator calls routine downs with your cards and your rules, and you take
   the downs that matter.

The third threat is the one the handoff names: cards that only decorate play-calling. The defense is a
football mechanic the handoff only touches on: **tendency and constraint plays** (§4.6). Coaches really do
build offenses this way. You run Inside Zone until the linebackers cheat, then Play-Action punishes them. That
gives the deck a real setup-and-payoff loop that comes from football, not from tokens.

---

## 2. Keep, change, remove

### Established goals, all kept

Persistent dynasty; fit over overall rating; scouting that rewards attention; development that changes what a
card *does*; staff and facilities shaping the playbook; player cards, editions and selective foil; progressive
recruit reveal; small football visual cues; delegable admin; defense with equal agency; a separate fork that
doesn't disturb the base game. Nothing below contradicts these.

### Proposed mechanics

| Mechanic (from the handoff) | Verdict | Why it matters for fun |
| --- | --- | --- |
| Opponent commits before seeing your cards | **Keep. It's the best rule in the handoff** | It's the 1959 *Football Strategy* simultaneous call (§9) plus *Slay the Spire*'s honest intent. It makes information worth paying for |
| Honest information: Confirmed vs Uncertain | **Keep, tighten** | A Confirmed fact is never false. Disguise can only affect Uncertain facts. Players stop trusting any telegraph that sometimes lies |
| Players persistent, not drawn | **Keep** | A QB who goes missing because you didn't draw him breaks the fiction and the attachment |
| Edition ≠ value ≠ recruiting reputation | **Keep** | It avoids OOTP's "card color = power" problem (§9) |
| Separate offense and defense decks | **Keep** | Different verbs, same layout |
| 3 Command, and every card costs 1 | **Change** | With every card at 1, "3 Command" and "1 Play + 2 Tactics" are the same constraint stated twice, so Command never makes you choose. Costs of 0–2 based on football demand make it bind (§4.2) |
| Plays all cost the same | **Change** | Price by *what the play needs* (time, setup), not by yards. A 2-cost Vertical Shot with 3 Command leaves exactly one support card: Max Protect *or* Motion. That choice is the soul of the play |
| Drawn Play row (Option B) | **Change to a visible call sheet** | See §3. Random play access fights football and stacks a second random source on top of reads and execution, which the handoff itself warns against (§15) |
| Fundamental fallback calls | **Remove** | With a visible eight-play sheet you're never stuck, so the patch has nothing to patch |
| "Reserve one Command for the final Play", Finalize phase | **Remove** | Replace with one rule: planning is free; an information card is spent when played and can't be taken back |
| Two-point hand drawn from piles; no-peek rules | **Simplify** | The try is one more snap of the *same* possession with the same hand. Nothing new is revealed, so peeking can't happen |
| Situational actions use up the "reserved" Command | **Remove** | Command doesn't carry over anyway. Punt and FG are buttons |
| Max 2 manual tactics | **Remove the cap** | Variable costs and a 4-card hand already limit you. Fewer rules |
| Familiarity / chemistry system | **Defer** | Good later, but it's a slow-moving modifier and the prototype must test the fast loop. Tendency (§4.6) matters more first |
| Packs as presentation only, no economy | **Keep, sharpen** | Earned only, no duplicates, no paid currency (§9 OOTP lessons) |
| Selected drives, sim, offense-only as options | **Keep, and formalize as Key Downs** | Pacing is the top risk (§1) |

---

## 3. Recommended hand architecture: two rows, only one shuffled

### Comparison

| | A: one combined hand | B: two drawn rows (handoff lead) | **D: visible Call Sheet + drawn Tactic hand (recommended)** |
| --- | --- | --- | --- |
| Can you always call the right kind of play? | No, dead hands | Mostly, via fallbacks | **Yes. All eight sheet plays are always visible** |
| Where randomness lives | Plays and tactics | Plays, tactics, reads, execution | **Tactics, reads, execution** |
| What deckbuilding means | Proportions | Proportions in two piles | **Choosing your 8 (constructed) + building a 10–16-card tactic deck** |
| Repetition risk | Draw-dependent | Draw-dependent | **Handled by Tendency/Lean (§4.6), a football mechanic** |
| Draw systems | 1 | 2 | **1** |
| Two-row visual Mark likes | No | Yes | **Yes** |

D is the handoff's Option C, but it keeps the two-row visual and solves C's stated weakness ("repeatedly choose
the same best base play"). The football answer to that problem is that **defenses adapt to tendencies**, so the
best play stops being the best play. §4.6 turns that into a rule.

**The tradeoff that matters most:** D gives up the surprise of drawing a play, and that surprise is real
deckbuilder joy. My bet is that football fans feel "I didn't draw a run on 3rd-and-1" as unfair, not exciting.
The surprise comes back in a better place: the tactic draw, the defense's Look, and the duel cascade at
resolution. **The prototype should include B as a toggle** (draw 3 plays from a 16-card play pile) so the
comparison is measured, not argued. This is question 1 for Mark (§8).

### The turn, playable on paper

1. **Situation:** down, distance, spot, clock, score, timeouts, the active lineup.
2. **The opponent commits** its call and tactics, using the situation, its scheme, and *your* game Tendency. It
   never sees your hand.
3. **The Look:** you see the defense's (or offense's) shown alignment as 3–4 facts, each marked Confirmed or
   Uncertain (§4.5). Refill your Tactic hand to 4. Command resets to 3.
4. **Plan, which is free:** hover plays and tactics to see each duel's matchup chip (Strong / Edge / Even / Tough /
   Danger).
5. **Commit information cards in any order.** Each one is paid and reveals its fact at once. You can't undo it.
   You may still change your plan afterward.
6. **Snap:** commit one play plus any non-information tactics within the Command left. The three duels resolve
   in sequence, the outcome goes to the Engine 2 referee (yards, clock, turnover), and stats go to the players
   who won or lost duels.
7. **Explain and advance:** one line of cause ("Hale held the edge · Park beat man coverage · 16 yards"). Used
   tactics are discarded. **Keep one unused tactic**, discard the rest.

---

## 4. Corrected working rules

### 4.1 Card types

| Type | Lives in | Persistence | Count in prototype |
| --- | --- | --- | --- |
| **Player card** | Lineup (role depth chart) | The real person, permanent | 11 per side shown; 3 per duel highlighted |
| **Play card** | Call Sheet (8 slots per side), always visible | Chosen weekly from the program playbook | 8 offense, 8 defense |
| **Tactic card** | Tactic deck → hand of 4 | Game-day deck chosen weekly | 12 per side (6 distinct × 2) |
| **Staff card** | Sideline (2 slots: coordinator + one assistant) | Changes only with staff | 1–2 passive effects each |
| Situational controls | Buttons | — | Punt, FG, timeout, spike, kneel, tempo |

Staff cards are not drawn. They are the "relics" of this game, and there are deliberately few of them (§4.8).

### 4.2 Costs and Command

- **Command: 3 per snap.** It doesn't carry over and isn't refunded.
- **Play cost 0–2, priced by demand, not yardage.** Quick and base plays cost 0. Plays that need setup or time
  cost 1. A true shot costs 2.
- **Tactics cost 1. Check-With-Me costs 2.** Player and staff signatures may make a specific tactic cost 0 under
  a written condition, at most once per snap. This is the main channel from recruiting to decisions.
- There's no cap on tactics per snap. Command and the 4-card hand do the limiting.

### 4.3 Resolution: three duels per play

Every play names three duels. Each duel pits a role against a role on specific traits. Those are the existing
seven traits and role weights in `app/01-identity-rng.js`, so no new ratings are needed.

- **Gate (G):** if it fails, the play gets its Fail result no matter what else happens. For most passes the Gate is
  protection; for runs, the point of attack.
- **Key (K)** and **Finish (F):** Gate won + both → **Explosive**; one → **Success**; neither → **Short**.

**Duel math:** each side's *grade* is the average of the listed traits ÷ 10, rounded down (a 77 is grade 7).
Margin = offense grade − defense grade + modifiers. Win chance by margin:

| Margin | ≤ −3 | −2 | −1 | 0 | +1 | +2 | ≥ +3 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Win chance | 15% | 25% | 35% | 50% | 65% | 75% | 85% |
| Chip shown | Danger | Danger | Tough | Even | Edge | Strong | Strong |

Rolls come from the seeded game RNG, so save/resume can't reroll them. Chips show before the snap; exact
percentages are available on long-press. **Modifiers come only from:** tactics, the call-vs-call matchup (the
*Football Strategy* matrix, expressed as duel modifiers), the Look/Lean, weather (`game-conditions.js`), and
signatures. That list is exhaustive. No generic "+5% offense" effects exist.

### 4.4 Prototype card catalog

**Offensive call sheet**

| Play | Cost | Gate | Key | Finish | Fail / Short / Success / Explosive |
| --- | --- | --- | --- | --- | --- |
| Inside Zone | 0 | Interior OL power+tech vs NT/3-tech | RB1 iq+tech vs MIKE | RB1 power vs Box S | −1 / 2 / 5 / 12+ |
| Outside Zone | 0 | TE1 or X power+tech vs set-edge | RB1 speed vs WILL | RB1 speed vs field CB | −3 / 1 / 6 / 15+ |
| Quick Slant | 0 | Release: slot tech+speed vs slot CB | QB tech+composure vs hook defender | Slot speed+vers. vs tackler | Inc / 4 / 7 / 14 |
| Stick | 0 | Release: TE1 tech vs LB | QB iq vs flat defender | TE1 power vs tackler | Inc / 3 / 6 / 11 |
| Deep Cross | 1 | Protection: OT tech+power vs Rush edge | Z speed+tech vs field CB | QB iq+composure vs FS iq | Sack −7 / Inc / 16 / 28 |
| Screen | 1 | QB composure vs Rush iq (sell it) | Pulling OL speed vs WILL | RB vers. vs pursuit | −4 / 2 / 9 / 20 |
| PA Boot (constraint) | 1 | TE/RB protection vs edge | **Fake:** RB1 grade vs MIKE iq | Z or TE separation vs cover man | Sack −6 / Inc / 13 / 25 |
| Vertical Shot | 2 | Protection: OT vs Rush edge | Z speed vs FS speed | Z power+composure vs CB | Sack −8 / Inc (15% INT) / 24 / 45+ |

Call matchups for the offense (examples): Inside Zone G +1 against two-high, −2 against a loaded box. Screen G +2
against any pressure call. Quick plays ignore pressure on the Gate but take −1 on Key. Deep passes take −1 on
Gate against pressure that turns out to be real.

**Offensive tactics (12 cards: two each)**

| Tactic | Cost | Effect | Restriction |
| --- | --- | --- | --- |
| Motion | 1 (info) | **Confirms** man or zone on one defender; the motioned SLOT/Z/MOVETE gets +1 on his Release or Separation duel | Changes alignment only |
| Hard Count | 1 (info) | **Confirms** whether the shown pressure is real | If C1 composure grade < 6: 15% false start (−5, replay, Command spent) |
| Max Protect | 1 | +2 on a Protection Gate | The TE/RB kept in can't be a target. Any duel naming him moves to the next receiver |
| Route Adjustment | 1 | Swaps one receiver's route to its listed counter (for example slant → whip against man, so he duels on tech+iq instead of speed, +1) | Receiver iq grade ≥ 6, or a route-type signature |
| Seal Block | 1 | +2 on the Gate of Outside Zone or Read Option | Needs TE1 or X on the field |
| Check-With-Me | 2 | After every reveal, switch to another sheet play, paying its cost on top | Once per snap |

**Defensive call sheet:** Two-High Zone (0), Cover 1 Man (0), Run Fit Heavy (0), Goal Line (0), Quarters Match (1),
Zone Pressure (1, choose strong or weak side when you commit), Sim Pressure (1), Cover 0 Blitz (2). Each one
changes specific offensive duels. Run Fit Heavy gives −2 on Inside Zone's Gate and +1 on Deep Cross's Separation
for the offense. Every pressure call gives the defense +1 on Protection Gates and −1 on its own coverage duels.

**Defensive tactics (12):** Identify Protection (1, info: confirms where the RB/TE protects), Film Tell (1, info:
confirms the offense's play *family*), Disguise (1: one Uncertain fact in *their* Look shows false; their QB-read
duel −2), Bracket (1: +2 against one receiver; −1 on every other coverage duel), Spy (1: −2 on QB-run duels; −1
on your pressure Gate), Press (1: +1 on Release duels; a lost Release becomes Explosive).

### 4.5 Information: the Look

The opponent's Look has four facts: **Box** (light / normal / loaded), **Shell** (one-high / two-high),
**Pressure** (shown / not shown), and **Lean** (§4.6).

- **Confirmed means true. Uncertain may be false.** This holds without exception. Disguise can falsify only an
  Uncertain fact. It also stops a QB's own iq from upgrading that fact, though info tactics still can.
- Base certainty comes from people. The Box is always Confirmed. **The Shell is Confirmed if QB1's iq grade is ≥
  8** (a Field Architect sees it), otherwise Uncertain. Pressure is always Uncertain until Hard Count or
  Identify. **Lean is Confirmed if your staff's film rating is ≥ B** (scouting staff already exists).
- Defense reads the offense the same way, using the defense's MIKE or FS iq.

This makes *who your QB is* change *what you know*, before any percentage enters the picture.

### 4.6 Tendency, Lean and constraint plays (the anti-repetition loop)

- Each side tracks **Tendency** by family for the game: Run, Quick, Deep, and Constraint (PA/Screen) on offense;
  Pressure, Man and Zone on defense. Each call adds 1.
- When a family's Tendency reaches the opposing coordinator's **Discipline** (3 for an aggressive DC, 5 for a
  disciplined one; derived from existing staff data), that coordinator **Leans**. It calls the counter more
  often, and its Look shows *Lean: Run* (or whichever family).
- **Constraint plays punish a Lean.** PA Boot gets +2 on its Key duel against *Lean: Run*. Screen gets +2 on its
  Gate against *Lean: Pressure*. Vertical Shot gets +1 on Key against *Lean: Quick*.
- **A constraint play that gains Success or better resets that family's Tendency to 0.** The opposing coordinator
  stops cheating.

The result is a cycle: establish, induce the Lean, punish, reset. It isn't a snowball, because the payoff erases
its own setup. It's the handoff's "two runs shouldn't produce a guaranteed play-action token" principle (§10)
done properly. The Lean is the opponent's real adaptive state. You can see it, a disciplined coordinator delays
it, and it costs you predictable calls to build. It also makes **opposing coaches matter**: a rival's DC gets a
recognizable personality from data the world already tracks.

### 4.7 Draw, discard, retention, transitions

- **Tactic deck:** 10–16 cards (prototype: 12). Hand of 4, refilled every snap. When the pile runs out, the discard
  reshuffles. **Keep 1** unused card between snaps of the same possession.
- **Possession ends** (score, turnover, punt, failed fourth down): discard that side's hand and clear Looks and
  snap effects. Each side's pile persists. Draw 4 when that side next takes the field.
- **Conversion:** the try is part of the same possession. Choose kick or two; a two-point try is one snap with the
  current hand plus the retained card. Then the possession ends.
- **Halftime is a real adjustment window:** swap up to 2 sheet plays and 2 tactic cards from the installed
  playbook, reshuffle both tactic decks, and halve every Tendency. This answers the handoff's halftime question
  with a coaching ritual instead of an edge-case rule.
- **Overtime:** existing Engine 2 overtime rules. Hands persist across possessions as normal, and there's no fresh
  shuffle.
- **Timeouts** keep their real football value only. No redraw, no Command.
- **Save/resume** stores pile order, hand, retained card, Tendency, the opponent's committed call and the RNG
  snapshot. Engine 2 already snapshots its RNG this way.
- **Injury mid-drive:** the depth chart's next player takes the role. Cards that now fail a requirement show the
  reason. Nothing is reshuffled or refunded.

### 4.8 Staff and program effects

Two sideline slots: the coordinator for the active side, plus one assistant. Each gives at most two written
effects, for example *Timing coordinator: once per possession, Route Adjustment costs 0.* *Film-room analyst:
Lean is always Confirmed.* Facilities and research **add cards to the playbook** (what you *can* install); they
don't add passive bonuses to the battle. That keeps the deck from becoming a second economy, which the handoff
warns against in §3.

### 4.9 Pacing: Key Downs

- Default: **Key Downs mode.** Your coordinators call routine snaps from *your* call sheet and *your* tactic
  hand, under exactly these rules, and each shows as one summary line. You take over on 3rd and 4th down, in the
  red zone, in the last 4:00 of each half, after a turnover, and whenever a **Lean appears** (a "Read Alert").
- Estimate: about 45–55 user decisions per game instead of about 140 → **20–30 minutes**. This has to be
  measured.
- Options: *Call every snap*, and *10-minute quarters* (Engine 2's quarter length is one constant, so roughly
  two-thirds of the snaps).

### 4.10 Unresolved choices, stated plainly

- Multiple personnel packages. The prototype uses one per side. Later, a sheet play could list its package and a
  package swap could cost a Command.
- Whether duel results should also drive fatigue and injury.
- How familiarity should change duels once it's added.
- Exact Discipline values, costs and yard tables. These are paper values.

---

## 5. Worked turns

### Offense: 2nd and 6 at midfield, Q2 6:10, tied 7–7

**Your relevant players (grades):** QB Dante Ruiz, *Field Architect*: iq 8, tech+composure 7. LT Marcus Hale,
*Island Protector*: 7. Z Theo Park, *Route Sculptor*: speed+tech 8; signature *+1 Separation against man*. SLOT
Jalen Cross, *Space Hunter*: 7. TE1 Nico Bell, *Backfield Hybrid*: 7. RB1: 7.

**Defense (AI, committed before you look):** Rush edge *Speed Bender* 8, field CB *Mirror Corner* 8, slot CB 6, FS 7,
MIKE iq 6.

**The Look:** Box **loaded** (Confirmed) · Shell **one-high** (Confirmed, because Dante's iq is 8) · Pressure **edge
shown** (Uncertain) · **Lean: Run** (Confirmed by film, after four early runs).

**Hand:** Motion, Hard Count, Max Protect, Route Adjustment. **Command 3.**

| Line | Sequence and cost | Duels (margin → chance) | Character |
| --- | --- | --- | --- |
| **A: quick answer** | Hard Count (1) → pressure **real**. Motion (1) → **man** confirmed. Quick Slant (0). **Total 2**; keep Max Protect | G: Jalen 7 +1 motion vs slot CB 6 → +2 (75%). K: Dante 7 −1 quick vs real pressure vs hook 6 → 0 (50%). F: 7 vs 6 → +1 (65%) | Safe, likely 4–7 yards. The info was bought in order, and the second card was chosen *because of* the first |
| **B: punish the Lean** | PA Boot (1) + Max Protect on Nico (1). **Total 2**; keep Motion | G: Nico 7 +2 vs edge 8 +1 (pressure, if real) → 0 to +1. K (Fake): RB 7 +2 Lean vs MIKE 6 → +3 (85%). F: Theo 8 (+1 if man) vs CB 8 → 0 or +1 | The big swing. Success resets your Run Tendency |
| **C: the shot** | Vertical Shot (2) + Max Protect (1). **Total 3**; keep Motion or Hard Count | G: Hale 7 +2 vs 8 (+1 if real) → 0 or +1. K: Theo 8 vs FS 7 → +1. F: 8 (+1 if man) vs 8 → 0 or +1 | You can't afford information. You're betting the pressure isn't real |
| **D: the stubborn run** | Inside Zone (0). Keep anything | G: 7 −2 loaded box vs NT 7 → −2 (25%) | Legal but bad. The defense's Look is doing its job |

The lines also differ on *order*. Line A only works because Hard Count was played before you chose the play.
If Hard Count had shown the pressure was fake, Line C becomes the obvious call, with 2 Command left for Max
Protect.

**Replace the QB** with freshman *Toolsy Project* (iq 5, tech+composure 5). The Shell drops to Uncertain, so you
can't tell man from zone without spending Motion. Line A's Key duel falls to −2. Line C's Read collapses. **Line
B is unaffected**, because the Fake duel is the RB against the MIKE. So the preferred line changes for an
understandable football reason: *young QB, lean on the run game and play-action.*

**Develop Nico Bell (year 2): *Check-and-Release*.** "When Nico is under Max Protect and the defense didn't call
pressure, a lost Key duel becomes Short +4 to Nico instead of incomplete." That's a rule change, not a
percentage. Max Protect stops meaning "lose a receiver" against base defenses, which makes Line C far safer on
non-pressure downs. You'll feel it, and you'll know why.

### Defense: 3rd and 7 at their 35

**Opponent:** *Vertical Strike* offense. X is a *Boundary Bully* (grade 9). Film shows the RB in protection 70% of
the time.
**Your players:** Rush edge *Speed Bender* 8. DT Ray Odom, *Gap Eater*, a **68-overall ordinary starter** whose
signature is *Draws the Double: your pressure Gates +1 while he's on the field*. FS Mason Reyes, *Trigger Safety*
(iq 8). Boundary CB *Press Eraser* 7.
**Their Look (your read of them):** 3×1, X isolated · RB in the backfield · Tendency *Deep 3* (Confirmed).
**Hand:** Identify Protection, Disguise, Bracket, Spy. **Command 3.**

| Line | Sequence and cost | Effect | Risk |
| --- | --- | --- | --- |
| **A: take away X** | Cover 1 Man (0) + Bracket X (1) + Disguise (1). **Total 2**; keep Identify | X's duels +2 for you. Their QB-read duel −2, because Reyes rotates late and they see a false two-high | Every other coverage duel −1. If their call targets the slot or TE, Bracket was wasted |
| **B: send it** | Identify Protection (1) → the RB is set **weak**. Zone Pressure **strong** (1) + Disguise (1). **Total 3** | Protection Gate: your edge 8 +1 pressure +1 unblocked side +1 Odom vs their RT 7 → +4, the 85% cap | Your coverage duels −1. If the Gate is lost, X against a soft three-deep is Explosive |

Their committed play (Deep Cross, RB protecting) is revealed only at the snap. Both lines are reasonable bets
against it, which is the point.

**Replace Reyes** with a freshman FS (iq 5). Disguise's rule says the rotation has to come from the disguising
safety, and below grade 6 its QB-read penalty falls from −2 to −1. Line A weakens, so Line B becomes the call.
And the reason B works at all is **Odom, a 68-overall run-stuffer**. An ordinary player who supplies one missing
capability matters without being a star.

---

## 6. Synergy examples

Every signature comes from an existing archetype. The roster already holds about 60 of them (`STYLE_TRAITS`),
so each needs one card line, not a new system.

| Contributor (archetype) | Condition | Effect | Beneficiary | Counter |
| --- | --- | --- | --- | --- |
| LT *Island Protector* | Protection Gate on his side | +1 without a tactic | Your Command budget: Deep Cross + Motion + Route Adjustment becomes affordable | Sim Pressure / interior stunts move the Gate to a guard |
| C *Interior Technician* (often a 3-star) | Every snap | Hard Count costs 0 and never false-starts | QB: free pressure info every snap changes sequencing | Disguise keeps the *Shell* Uncertain; Hard Count only answers pressure |
| TE *Inline Mauler* + RB *Gap Hammer* | Seal Block on the Mauler | Seal Block also fits Inside Zone (cutback lane): +2 Gate | RB1. It widens compatibility rather than adding a bonus | Run Fit Heavy; a Box Safety with high power |
| CB *Press Eraser* + edge *Speed Bender* | Press wins the Release duel | Their Protection Gate −1 that snap (the QB holds the ball) | Your pass rush | Quick plays ignore the Gate; a motioned receiver can't be pressed |
| FS *Trigger Safety* | Disguise played | Full strength (−2); costs 0 once per possession | The whole coverage call | *Field Architect* QB (Shell Confirmed regardless); Motion |
| RB *Third-Down Weapon* (low overall) | 3rd down, any pass | A lost Key duel becomes Short +3 to him | QB and the 3rd-and-long situation | Spy, or a *Coverage Rover* LB |

Each one changes a *decision*: cost, legality, information, or which line is best. None is a plain +x%.

**Recruiting consequence:** the handoff's tight-end example (84 explosive vs 76 dependable blocker) now has a
precise answer. If your LT is an *Island Protector*, you rarely need Max Protect, so the 84 receiver is worth
more. If you have a young LT, the 76 blocker's Max Protect value can keep your Deep Cross alive. The card text
shows this. No hidden fit score does the work.

---

## 7. Prototype recommendation (needs separate authorization)

**Build a standalone battle sandbox, not a fork of the full game.** One HTML/JS page in
`forks/call-sheet/sandbox/` with:

- **Engine 2 as the referee**, plus a new duel resolver that produces the `outcome` object.
- Eight plays and six tactics per side (§4.4), the Look, Tendency/Lean, and an AI coordinator with two
  personalities (aggressive, disciplined).
- **Rosters from a draft harness, like OOTP's *Perfect Draft*:** deal archetype players and pick 11 per side in
  about 3 minutes. That gives contrasting rosters for testing instantly, and it's plausibly a permanent quick-play
  mode later. Plus three presets: veteran *Ground Pressure*, freshman *Tempo Spread*, and star QB with a weak line.
- Toggles: **Key Downs / every snap**, and **Call Sheet (D) / drawn Play row (B)**.
- Telemetry, and a **solver bot** that lists every legal line in seeded situations and computes expected value
  per roster.

**Leave out:** dynasty integration, packs, editions, familiarity, facilities, staff beyond the coordinator, real art.

**Evidence to continue** (these thresholds are my proposals):

| Signal | Bar |
| --- | --- |
| Solver: best line differs between the 3 preset rosters | ≥ 40% of sampled situations |
| No single play exceeds this share of human calls | 25% |
| Lean → punish → reset cycles per game | ≥ 3 |
| Median decision time | ≤ 20 s |
| Key Downs full game | ≤ 30 min |
| Testers choose "one more drive" after a failed drive | Observed, not just measured |
| Defensive possessions rated as fun as offense | Comparable |
| Testers can say why a big play worked | Most of the time |
| D vs B: fewer "unfair draw" complaints with no loss of excitement | Decides the architecture |

---

## 8. Questions for Mark

1. **What draws you to separate Play cards: drawing them by luck, or having plays exist as visible, collectible
   cards with their own art?** If it's the second, the Call Sheet gives you that without dead draws. If it's the
   first, B stays in the running.
2. **Should a normal game default to Key Downs** (coordinators handle routine downs, about 25 minutes), **or to
   calling every snap** (45–60 minutes, more control)?
3. **Do you want an OOTP-style quick mode** (draft a team from dealt cards and play a single game or a short
   bracket) **as a permanent side mode, or only as a test harness?** It changes how much the card collection
   matters outside the dynasty.

---

## 9. Research notes

**Network limits:** the session's network blocked direct fetches of the OOTP, Steam and Wikipedia pages, so these
notes come from search-engine summaries. Some OOTP material is from 2018–2024 and may be out of date for OOTP 27.

### OOTP Perfect Team: what to copy and what to avoid

- **Quality tiers** (Iron → Bronze → Silver → Gold → Diamond → Perfect) map almost directly to rating, and resale
  value scales with tier. [OOTP 21 manual](https://manuals.ootpdevelopments.com/index.php?man=ootp21&page=perfect_team),
  [OOTP 20 manual](https://manuals.ootpdevelopments.com/index.php?man=ootp20&page=perfect_team).
  **Lesson:** a frame color you can read at a glance is powerful, but if color *is* power, the collection becomes a
  stat grind. Call Sheet: a small grade badge shows power, and the frame or foil shows **story**: Signed, Starter,
  Captain, Standout, All-Conference, Legend.
- **Live cards** follow real performance; **Card Combinator** upgrades component ratings by feeding in other cards.
  [OOTP wiki: Card Combinator](https://wiki.ootpdevelopments.com/index.php?title=OOTP_Baseball%3APerfect_Team%2FCard_Combinator).
  **Lesson:** the "live" idea is great and we get it for free, because our players really develop. A card updates
  each season and keeps yearly snapshots under one identity. **Skip** anything combinator-like: feeding cards to
  other cards turns people into material.
- **Collection missions** (for example "collect 15 cards from a team"). **Lesson:** good for albums (a signing
  class, a title team, rivalry wins), with cosmetic or historical rewards only, never stat bonuses.
- **Perfect Draft:** build a team from dealt cards you don't own. It was well received, with complaints about
  draft length (15–20 minutes) and lobbies not filling.
  [OOTP forum thread](https://forums.ootpdevelopments.com/showthread.php?p=4762326).
  **Lesson:** the best test harness and quick mode for us. Keep it short (about 3 minutes) and single-player, so it
  never waits on other people.
- **Walled off from franchise mode,** and identical cards perform differently on different rosters by design.
  [Fangraphs](https://fantasy.fangraphs.com/texas-red-bulls-a-20-ootp-perfect-team),
  [OOTP forum](https://forums.ootpdevelopments.com/showthread.php?p=5022718).
  **Lesson:** OOTP keeps cards and the deep sim apart. Our pitch is the opposite: the cards *are* the dynasty's
  people. Roster-dependent performance is exactly the fit-over-overall principle.
- **Criticism:** duplicate-heavy packs and pressure to spend real money (2025-era forum complaints).
  **Lesson:** earned packs only, no duplicates, no currency. Every pack reveals a real event.

### Football deckbuilders and tabletop

- **4th & Goal:** offense and defense each pick a play card plus *one* modifier, resolved by play strength, scheme
  matchup and coach/player perks; the outcome shows as a shifting bar; separate offense and defense decks;
  roguelite gauntlet. [Steam](https://store.steampowered.com/app/4466560/4th_Goal/),
  [demo](https://store.steampowered.com/app/4474030/4th__Goal_Demo/). **Lesson:** the handoff's snap is close to
  a shipped game. Call Sheet stands out through persistent people, named duels, honest information and Tendency.
- **Dynasty!:** play cards, player cards, 46 player skills, 20 augments, 36 stadium upgrades; roguelite; very few
  reviews, one complaining of a winless season. [Steam](https://store.steampowered.com/app/4796920/Dynasty/),
  [community](https://steamcommunity.com/app/4796920). **Lesson:** legibility and difficulty tuning decide whether
  players stay. Our explanation line and pre-snap chips address that.
- **Football Strategy (Avalon Hill, 1959):** defense secretly picks one of 10 formations, offense one of about 20
  plays, and a cross-indexed matrix resolves them; dice only for long gains and kicks; it shaped many later
  titles. [analog.games](https://www.analog.games/gameItem/show/419cd83f9656f45d01965730d05c19a7/football-strategy?lang=FR),
  [codex99 history](https://dcmpx.remotevs.com/com/codex99/PL/design/100.html). **Lesson:** simultaneous secret
  calls have carried a football game for 60+ years. Our call-vs-call duel modifiers are that matrix, made readable.
- **Slay the Spire's intent:** enemy plans are telegraphed honestly, randomness lives in your draw, and turns
  become a solvable puzzle under uncertainty. [Analysis](https://saschb2b.github.io/game-mechanics/concepts/enemy-intent-telegraph).
  **Lesson:** this is the source of the "Confirmed is never false" rule.

---

## 10. The unified game

### Pitch

*Dynasty Lab: Call Sheet* is a college football dynasty where Saturday is a card battle. You still scout,
recruit, develop, hire and build, and every one of those decisions shows up as text on a card you play. Each
snap, both coordinators commit in secret. You read an honest but incomplete Look, spend 3 Command on information
and adjustments, call one play from your eight-play Call Sheet, and watch three named duels decide it. Run the
ball until their linebackers cheat, then make them pay. Win with the kid you found at a camp nobody else
attended.

### The week (the dynasty loop the battle plugs into)

1. **Monday, the Film Room:** opponent scouting shows their coordinator's Discipline, their signature players, and
   which of your plays they're built to stop. Delegable.
2. **Practice:** pick 8 plays per side from the playbook and adjust the tactic deck. Staff suggest a sheet in one
   click. Development work changes traits and unlocks signatures.
3. **Recruiting and portal:** unchanged from Dynasty Lab, plus progressive card reveal. Unscouted traits show as
   ranges and greyed signature text that sharpens as scouting progresses.
4. **Saturday:** the battle. Key Downs by default.
5. **Sunday:** results write back to the dynasty exactly as Game Engine 2 games do today. Saturday Standout cards
   go to the players of the week (`players-of-week.js` already picks them).

### Card anatomy

- **Player card:** a deterministic portrait (the existing `portraits/renderer-v1.js`), name, number, role, the
  archetype name as a title bar, three letter grades for the traits that card's duels use, **one signature line**
  in plain English, and the edition frame. The back holds scouting history, a development log with the cause of
  each change, and season snapshots.
- **Play card:** a **procedurally drawn chalk X/O diagram** generated from the play's assignments, plus cost pips,
  a family icon, and G/K/F duel icons with role tags. It's beautiful, consistent and cheap, and it teaches
  football. When you call the play, its diagram animates on the field.
- **Tactic card:** a bold single icon (eye, shield, arrow, padlock), a cost, one effect line and requirement chips.
  An unusable card says *why* ("needs a receiver with iq 6+").

### Visual direction (Midnight & Brass)

- **The board:** a dark field drawn in chalk lines. The opponent's Look sits at the top as four fact tiles,
  Confirmed tiles solid and Uncertain ones hatched. The Call Sheet is a laminated brass-edged strip; the tactic
  hand fans out below it. Players appear as small cards on their alignment spots, and the three duel players rise
  when a play is hovered.
- **Resolution cascade (the Balatro moment):** three face-offs flip in sequence, Gate then Key then Finish. Each
  shows two player cards, the margin, and WIN/LOSE stamped in brass. Then the yardage counts up and one line of
  cause appears. About 3 seconds, skippable, with a reduced-motion static version.
- **Lean alert:** the defense's tile glows amber with "LEAN: RUN", and constraint plays on your sheet show a
  matching amber notch. A cue you can read without opening a tooltip.
- **Editions and foil:** holo shader treatments only for earned moments: Captain, Standout, All-Conference,
  Legend. Signing Day envelopes and camp-evidence reveals use the same presentation system, with open-all and
  instant reveal.
- **Tools we have:** the portrait renderer and existing turntable art (rivalry trophies, awards) for ceremonies;
  CSS/WebGL for foil; procedural SVG for play diagrams; and **Meshy** (connected to this environment) for 3D
  trophy, helmet and pack props in reveal moments. Art comes after the sandbox proves the battle.

### What makes it stick

- **Attachment:** the people are persistent, and their signatures come from who they really are.
- **Mastery:** honest information, ordered information buys, and the Lean cycle reward reading football.
- **Variety without content bloat:** about 60 archetype signatures × 8-play sheets × rival coordinator
  personalities × weather, instead of hundreds of renamed cards.
- **Renewal:** graduation and the portal rewrite your signatures every year. Facilities and research grow the
  *playbook*, not raw power, so mature dynasties keep facing real decisions.

The central test from the handoff still holds: **does building the program give you interesting things to do on
Saturday, and does Saturday make you care about the next recruiting decision?** The duel system, archetype
signatures and the Lean cycle are this design's answer. The sandbox in §7 is how we find out whether it's right.

---

## 11. Rules v0.2: what's built (2026-11-16)

Mark's answers to §8 changed three things:

1. **Synergy *and* luck.** Plays now come from two sources. The **base sheet** has 4 always-available
   identity plays, so you're never stuck without a basic call. The **wrinkle row** holds 3 plays drawn from a
   12-card play pile: Deep Cross, PA Boot, Screen, Power, Vertical Shot, Read Option. The luck is whether you're
   holding PA Boot when their linebackers start cheating. The tactic hand (4 drawn) works as before.
2. **A hand is a series.** At every new set of downs you get a fresh hand and **5 Command for the whole series**.
   Moving the chains refills the hand, which makes it the reward. The real sequencing decision is *spend on early
   downs to stay ahead of the sticks, or save Command for 3rd down*. Retention across snaps is gone; the series
   is the unit.
3. **Draft mode is a test tool only.** `roster.dealDraft()` exists, but there's no screen for it yet.

### The control dial (all modes play identical rules, so stats agree)

| Mode | What you do | Stops per game* | Est. time* |
| --- | --- | --- | --- |
| Every snap | Call every snap, offense and defense | ~160 | ~59 min |
| **Series** | Script 1st and 2nd down at each new set of downs (or hand them to the coordinator); call 3rd/4th down, the red zone and the last 2:00 live | ~115 | ~32 min |
| **Key moments** | The coordinator plays routine downs *with your cards*; you take 3rd/4th down, red zone, last 2:00 | ~62 | ~21 min |
| Sim | Watch or skip | 0 | instant |

\*Measured by `tools/sim-report.js` with the person coaching both sides; times assume about 20 s per live call,
12 s per series plan and 3 s of animation. **Coaching offense only cuts stops by about 40%** (key moments: 61 →
37 stops), and defense only by about 58% (→ 26). The middle ground Mark asked for probably isn't one mode. It's
*Key moments + offense only* (around 15 minutes) for routine weeks, and *Series, both sides* for rivalry games.
The playtest needs to confirm this.

**Honest finding:** Series mode doesn't save as much time as hoped, because it asks for a plan at every new set
of downs on *both* sides. A quick fix to test: offer the series plan only on offense, and let the defensive
coordinator plan early downs unless you open the defense card.

### Implemented and verified

- `core/data.js`: 10 offensive plays, 10 defensive calls, 12 tactics, 31 archetype signatures, plus the
  archetype tables copied from Dynasty Lab.
- `core/resolver.js`: three duels per play. Every modifier carries a visible source; the same function drives the
  AI, the pre-snap chips and the real roll.
- `core/battle.js`: series hands and Command, the Look (Confirmed is never false), Tendency → Lean → punish →
  reset, coordinator AI for both sides, fourth downs, penalties, overtime, a box score, deterministic save/resume.
  **Game Engine 2 is the referee, called through its exported API. The base game is unmodified.**
- `core/roster.js`: four contrasting presets built from real archetypes.
- `sandbox/index.html`: a playable page with scoreboard, field strip, Look tiles, a call sheet with chalk diagrams,
  a tactic hand, Command pips, a duel projection with modifier sources, a series planner, fourth-down choices, the
  three-duel result cascade, a game log and a final box score with standouts. Works at phone width; honors
  reduced motion.
- `tests/battle.test.js`: 11 tests (determinism, save/resume, Command limits, honest Looks, the Lean cycle,
  *a QB swap changes the best line*, signatures, series scripting, hand refill, card conservation).

### Calibration (160 coordinator-vs-coordinator games, `tools/latest-report.txt`)

Per team per game: 28.1 points · 71.8 plays · 6.2 yds/play · 31.7 rushes at 4.7 · 38.1 passes, 64.5% complete,
8.2 yds/att · 2.0 sacks · 0.8 INT · 0.49 fumbles lost · 37% on 3rd down · 6.0 explosive plays · 5.5 penalties.
Every value is inside or at the edge of FBS-style bands. Punts run slightly high (5.8). No single play exceeds 14%
of calls, and no play-plus-tactic line exceeds 9%. Engine validation passed in every game.

### Next steps, in order

1. **Play it.** Mark plays 3–5 games in each dial setting and notes where he gets bored or confused. That's the
   real test from §7.
2. Offense-only series plans (above); a **"why" overlay** on the result cascade (tap a duel to see its modifiers).
3. **Solver bot:** list every legal line in seeded situations per preset to measure "roster changes best line"
   (target ≥ 40%).
4. Clock management (hurry-up / bleed as persistent controls), and user two-point decisions (Engine 2 currently
   auto-kicks).
5. A Dynasty Lab adapter: read real rosters (`ROLE_DEFS` depth → lineup roles, real traits and archetypes) and
   write the box score back through the Game Day record path. This is the step that becomes the real fork.

---

## 12. The dynasty deck: why no two programs end up the same (direction, 2026-11-16)

**Mark's direction:** Balatro-style presentation with loud, over-the-top animations, effects and payoffs. *Not* a
pick-up-and-play roguelite: every dynasty should be unique, cards are chosen strategically, and no two teams can
be the same. Packs after games.

### Where uniqueness comes from

The three sources stack on each other:

1. **People:** recruits, archetypes and signatures. Already unique, because every world is generated.
2. **Playbook:** the cards you *chose* to take and keep. Scarcity forces identity.
3. **Lineage:** the coordinators you hired and the plays the program has run for years.

### Packs: after every game, not only wins

Packs only after wins would make strong programs stronger every week. That's exactly the snowball the handoff warns
against, and it makes losing streaks hopeless. Instead:

| Pack | When | What it holds | The choice |
| --- | --- | --- | --- |
| **Game pack** | After every game | Plays, tactics, upgrades | **Win:** pick 1 of 4 · **Loss:** pick 1 of 3 from a **Film Study** pack weighted toward counters to whatever beat you |
| **Rivalry / Bowl / Title pack** | Big wins | Rarer cards, foil, Legendary chance | Pick 1, with the full Balatro reveal |
| **Coordinator pack** | When you hire a coordinator | His scheme's pool | Pick 3 to install |
| **Clinic pack** | Each offseason research project | Cards from the family you studied | Pick 1–2 |
| **Signing Day** | Recruits commit | Player cards: real people, never duplicated | Already exists in Dynasty Lab |

**You always pick, never just receive.** Choosing 1 of 3 or 4 (as in Slay the Spire's card rewards) is where
strategy and identity come from. No currency, no paid packs.

### Scarcity creates identity

- **Playbook slots:** the number of installed plays and tactics is limited (for example about 20, growing slowly
  with facilities and staff). A new card often means cutting an old one, and that cut is the identity decision.
- **Install time:** a new card needs practice weeks before it's game-ready (it starts as "Raw" with a −1 on its
  design duel). Midseason pickups cost something.
- **The weekly game-day deck** is chosen from the playbook for each opponent. Staff can suggest one.
- Cards you don't install go to the binder. They aren't lost, but they don't play.

### Cards that diverge between dynasties

- **Mastery and branching evolution:** plays level up with reps in real games, then **branch**. For example,
  Inside Zone at mastery 3 becomes *Duo* (power-flavored) or *Split Zone* (constraint-flavored). Two dynasties with
  the same starting card end up with different ones.
- **Duplicates feed mastery** instead of cluttering the binder.
- **World-unique Legendaries:** some cards exist once per world (*The Fumblerooski*, *The Philly Special*-style
  trick plays, under original names). AI programs open packs too, so **a rival can own the card you wanted**, and
  you'll face it in a rivalry game.
- **Signature cards from your people:** a developed player unlocks a personal card. It graduates with him and goes
  to the Ring of Honor. A coordinator's scheme cards can leave with him unless they've been installed long enough
  to become *program knowledge*.
- **Program tradition card:** one per school, generated from its history and stadium (for example a home crowd
  that causes false starts on 3rd down).

### Keeping mature dynasties interesting (anti-snowball)

- **The league adapts across seasons:** a signature play you run constantly becomes **Scouted** league-wide. It
  loses its surprise bonus until you evolve it. This is the in-game Lean, scaled up to the dynasty.
- Graduation and staff turnover take cards away. Playbook capacity grows slowly. Loss packs give counters. Win
  packs are only a little better.

### Presentation (Balatro with loud payoffs)

- **Pack rip:** the pack shakes, tears with a burst, and cards fly out face-down. Rarity escalates the reveal:
  common is a flip; rare gets a gold flash; signature and legendary get a foil explosion, light rays, screen shake
  and a crowd roar. Then the pick-one moment, with the cards you're passing on burning away.
- **In battle:** fighting-game-style duel clashes, a yardage counter that ticks up while bonuses flash in, giant
  callouts (FIRST DOWN, SACK, TOUCHDOWN), on-fire player cards, a crowd meter, confetti and light flares on scores.
  All skippable, with a reduced-motion version.

### Next build: the vertical slice

One snap in the arcade style (fanned hand, drag to call, the play running on the field, duel clashes, counted
yards, callout), plus **On Fire**, one named combo, and a **post-game pack pick with the full rip**. This tests
the feel of both halves of the loop: Saturday and the playbook.

---

## 13. Vertical slice (rules v0.3, built 2026-11-16)

Open `slice/index.html`. One program, one game at a time, one pack after every game, with the playbook persisting
in the browser.

**New rules in the engine (all tested):**
- **On Fire:** a playmaker who wins every duel he's in for 3 straight snaps gets +1 (−1 against him on
  defense) until he loses one. You can cool off a hot receiver with Bracket.
- **Combos:** *Establish the Run* (run, run, then PA Boot in one drive: Key +1 and +1 Command) and *Chain Gang*
  (3 first downs in one drive: +1 Command next series). The combo book fills in as you discover them.
- **Trick plays:** used once per game, then exhausted (*Statue Left*, *Midnight Mirage*).
- **Upgrades:** *Inside Zone+*, *Quick Slant+*, *PA Boot+* replace the base card.
- **New cards:** Draw, Four Verts, Corner Blitz, Cover 2 Trap. Card text uses data-driven matchups
  ("Rushers ran right past it").
- **Packs (`core/packs.js`):** after a win, pick 1 of 4; after a loss, a Film Study pack (1 of 3) leads with
  counters to the opponent's most-used family. Rarity is common, rare or legendary, and reveals escalate in that
  order. **The play pile and tactic deck hold 14 each, so picks start forcing cuts after the second pack.**
  Legendaries exist once per world (`worldTaken` excludes ones AI programs own).

**Presentation:** a broadcast-style scoreboard, a tilted stadium field with all 22 players, Look tags (solid
for confirmed, hatched for uncertain, glowing for a lean), and a fanned hand with 3D tilt, rarity frames
(gold sweep for rare, holographic for legendary) and drag-to-field calling. Command shows as coins. The
three-duel clash shows player cards slamming together, modifier chips, WIN/LOSE stamps, sparks and screen shake.
The play animates on the field, the yardage counts up, and giant callouts follow (TOUCHDOWN with light rays and
confetti; SACK, PICKED OFF, FIRST DOWN, BIG PLAY), plus ON FIRE, COMBO and LEAN BROKEN banners. The pack shakes,
rips, deals its cards and reveals them in rarity order. You pick one and the rest burn; a full playbook forces a
cut. All sound is synthesized (crowd, whistle, clash, chimes, rip, burn). There's a skip button, a fast speed and
reduced-motion support.

**Not in the slice yet:** series planning mode (the slice offers key moments or every snap), saving a game in
progress, AI programs opening packs, card mastery and branching evolution, signature player cards, and real art.
