# Dynasty Lab v0.10.2 — Game Engine 2 Postseason Checkpoint

Status: development-only checkpoint. Production remains untouched.

## Validated at this checkpoint

- Normal user **Sim Instantly** Detailed Game path records through Game Engine 2.
- Watch Mode follows the same Detailed Game v2 result.
- Legacy quick/season simulation remains isolated from the user Detailed Game v2 path.
- Twelve-game regular-season user soak passed with durable v2 archives, real-player stat lines and play-by-play.
- The regular-season soak explicitly guards against a fixed/repetitive drive count.
- User-controlled conference championship games route through the transactional v2 recorder.
- User-controlled bowl games route through the transactional v2 recorder.
- User-controlled playoff games route through the transactional v2 recorder for every round the controlled program reaches.
- AI-vs-AI postseason games intentionally remain on the legacy simulation path at this checkpoint.
- Postseason games are neutral-site simulations.
- Postseason v2 archives retain engine identity, drives, play-by-play and real-player stat lines.
- A deliberately injected post-archive conference-title failure proved that whole-stage rollback restores the complete dynasty rather than leaving a partially simulated postseason.

## Focused validation

Focused workflow `V0.10.2 V2 Postseason Gate`, run `34068561158`, completed successfully against source head `cbd52eb054605bce88be8e19a2409ed2be39b4c2` and then synced the exact tested standalone build.

Synced build commit:

`1d048b15add8ecae4849ef2dc1391aaeb7c92e2c` — `build: sync v0.10.2 v2 postseason [v0102-postseason-sync]`

The bowl regression failure immediately before this checkpoint was a test-fixture/UI-state problem: the helper forced `bowlReady` without rendering, leaving the real postseason button disabled. Rendering the forced postseason state fixed the fixture; no bowl transaction exception was present.

## Next recommended boundary

Do not switch every AI game blindly to the full archival Detailed Game path. First build and benchmark a league-wide v2 simulation adapter that can use the same v2 football model for AI/quick simulations while retaining compact archives and acceptable full-season performance. Preserve the existing legacy quick path as a rollback/reference path until league-wide calibration and season soaks are green.
