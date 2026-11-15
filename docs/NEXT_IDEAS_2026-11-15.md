# What to do after v0.33.1

Written 2026-11-15 after the v0.33.1 publish. Earlier plan: `docs/UPGRADE_PLAN_2026-11-15.md` (sections 1–7), with
the v0.32/v0.33 world systems in `IDEAS.md` D–G. This list is what still looks worth doing, from that plan and from
reviewing v0.33. Items marked **(tonight)** are the ones queued for the overnight branch `claude/overnight-v034`;
the rest need a decision from the owner, a real device, or more time than a night.

## Fixes and risks

| # | Item | Why | Size |
| --- | --- | --- | --- |
| X1 | **Save growth.** A 30-season save is 312 MB, growing ~9.7 MB a season; import takes ~5 s and 468 MB of heap. Measure a second, colder archive tier for players who never started, then build it. | The largest risk to long dynasties, and phones will hit it first. | Large |
| X2 | **Legacy in the backup** **(tonight)**. Achievements, cross-save records and challenges live only in `localStorage`, so an export or a web-to-desktop move loses them. Carry them in the export and merge on import. | Silent data loss on the one path built to prevent it. | Medium |
| X3 | **Real-device pass.** iPhone Safari, Firefox, a screen reader, a timed coached game. Write a 20-minute checklist and record runs with device and date. | Not checked since v0.18; needs a person. | Small (needs a person) |
| X4 | **Thin draft classes read as a bug.** Early declarations range 2–22 a class. Say so in the draft recap when the class is unusually thin or deep. **(tonight)** | Cheap context for a real variance. | Small |
| X5 | **Hot spots** `recruitPitchBreakdown` and `rolePlayers`/`roleStarter` (E2 in the upgrade plan). Cache with roster invalidation and hold a fixed seed byte-identical. | Seasons are 12–21 s on the test host and rise as saves grow. | Medium |
| X6 | **Board bonus decision (F4)** still open since v0.29. | Needs the owner. | — |

## Connect what exists

| # | Item | What the player sees | Size |
| --- | --- | --- | --- |
| S1 | **Pro alumni come home as coaches** **(tonight)**. A retired pro from a program can appear in the staff hiring pool, with his playing and pro career on the card and a recruiting/position bonus tied to what he played. | "Your 2029 quarterback, eight-year pro, wants to coach quarterbacks." | Medium |
| S2 | **Nemesis and favourite opponent** **(tonight)**. The game notices the opposing head coach you cannot beat and the one you always beat, and says so before the next meeting and on the Program page. | Rivalries the player earned, not ones assigned. | Small |
| S3 | **Rivalry in recruiting.** When you and your rival both chase a prospect, the last meeting nudges him, and winning the battle is recorded in the series. | The rivalry matters in February. | Medium |
| S4 | **Facilities to injuries and development.** Strength room shortens recovery; practice building lifts development plans; each upgrade names who it helped. | Facilities stop being a number. | Medium |
| S5 | **Forecast to preparation.** Midweek forecast on the preparation choices and in staff advice. | "Wind 22 mph Saturday: staff suggest the run package." | Small |
| S6 | **Locker room and pro milestones in recruiting visits.** A Leader captain or an active Pro Bowler at a recruit's position appears on his visit report. | The new systems reach the recruiting loop. | Small |

## Moments

| # | Item | Size |
| --- | --- | --- |
| M1 | **Senior Day** **(tonight)**. The last home game of the regular season gets a card on This Week naming the seniors, each with one career line (starts, best season, honours, where he ranks). No decision. | Small |
| M2 | **Trophy case** **(tonight, if time)**. One Program page section with every trophy the program holds or has held: rivalry trophies on campus (and who holds the others), conference titles, bowls, national titles, Heisman-style awards, pro Hall of Famers. | Small |
| M3 | **"You saw him first."** When a prospect you scouted or offered early becomes a star or a draft pick, show the original scouting receipt beside it. | Small |
| M4 | **Season card to share.** One image of the season, saved to the device. | Small |
| M5 | **Dynasty in one page** at every tenth season. | Small |

## Bigger upgrades (need decisions)

| # | Item | Decision needed |
| --- | --- | --- |
| U1 | Difficulty at setup (three levels scaling existing levers). | Fixed levels or sliders. |
| U2 | Fatigue, so depth matters in the fourth quarter. | Wanted at all; makes simulated blowouts a little more common. |
| U3 | Playoff size option (current, 8, 12). | Which formats. |
| U4 | Rival head coaches with identities (schemes, tendencies, poaching coordinators). | Scope; touches the carousel and the game engine. |
| U5 | Conference expansion past 12. | Needs a schedule builder for uneven sizes. |
| U6 | Halftime adjustment, one saved trick play a game, a big visit weekend, an award campaign, a bet with the administration. | Which of these, one at a time. |

## Overnight rules

- Work on `claude/overnight-v034`, one commit per item, each with tests, following the engine-extension pattern
  (new file in both extension lists, hashed randomness, no gameplay random stream).
- Run the full unit suite and the browser suites at the end, open one PR, and **do not merge or publish**: that
  waits for the owner.
- Balance-touching items (S1) get a measured before/after in `docs/`.
