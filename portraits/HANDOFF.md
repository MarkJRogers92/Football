# Continue the Dynasty Lab player portrait prototype

## Latest user decision — authoritative direction

The user likes the **original geometric 2.5D player portraits**. Pixel hybrid and retro pixel variants were tried, then explicitly rejected. Both have been removed from the code, controls, tests and portable build. Keep the original 2.5D renderer as the baseline.

The user wants this work saved and continued later, **not integrated into the game yet**. Keep work inside the standalone Portrait Lab. Do not connect it to live rosters, recruiting, saves or player profiles, merge it into the game branch, or deploy it without a later request.

## Where the work lives

- Repository: `MarkJRogers92/Football` (Dynasty Lab).
- Portrait branch: `codex/portrait-lab-2-5d`.
- Base: `claude/review-improvement-dwjemy` at `ea4c324a91ce63e94164359c76392171fbce4fcb`.
- Only `portraits/` is added. Existing game files are preserved from that base commit.
- Start with this document and `portraits/README.md`. For game context, read root `DYNASTY_LAB_GPT_HANDOFF.md`, `REVIEW.md`, `WORKLOG.md` and applicable repository instructions. The root handoff covers other game work; this handoff is specifically about portraits.

## Open and test

Open `portraits/lab.html` in a normal browser, or serve the folder locally. No installation or external assets are required. From the repository root:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory portraits
node portraits/test.js
node portraits/build.js
```

The local preview is `http://127.0.0.1:8766/lab.html` while that server runs. It is not a hosted/public URL and will not carry over into another chat's environment. `portraits/portrait-studio.html` is the generated, self-contained downloadable version; rebuild it after source changes. Do not hand-edit it.

## What is implemented

- Canvas 2D geometric busts with shaded facial planes, shoulders, team jerseys, block numerals and accessories.
- Stable identities derived from a seed and version with independent named random streams. Rendering never consumes gameplay randomness or mutates player inputs.
- Six head-shape parameters plus continuous jaw/chin/face/feature variation; ten skin palettes; 24 hairstyle entries; eight hair colors; seven facial-hair options; optional eye black, freckles and headbands. Some related hairstyle entries could still use stronger differentiation.
- Height/weight drive shoulders and neck; age affects neck and facial-hair defaults. Same player remains recognizable when size or jersey changes.
- A working editor with seed, physique, appearance and uniform controls; 24/50/100-player selectable galleries; fixed recruit/freshman/junior/senior-transfer comparisons; thumbnail preview; PNG portrait and contact-sheet export.
- Bounded 32 MiB raster LRU cache and batched gallery rendering.
- `renderer.js` can also be required from Node. The stable API is `renderPlayerPortrait(player, school, canvas, options)`; see README for its inputs.

## Files

| File | Purpose |
| --- | --- |
| `renderer.js` | Pure identity/appearance derivation, drawing commands, Canvas renderer, raster cache |
| `lab.html`, `lab.css`, `lab.js` | Standalone editor and synthetic fixture gallery |
| `test.js` | 13 deterministic and behavioral tests |
| `build.js` | Packs the Lab into one standalone HTML file |
| `portrait-studio.html` | Generated portable build |
| `README.md` | Launch/API details and limitations |
| `HANDOFF.md` | This continuation context |

## Verification and honest limitations

All **13 portrait tests pass** after removal of pixel variants. Three original drawing-command golden hashes are unchanged. Coverage includes call-order stability, isolated RNG streams, seed zero, input round trips, age/transfer identity, cache invalidation/eviction, nonmutation, missing data, unknown versions, 100-seed diversity, and every hair/skin pairing. These are command/trait tests, not cross-browser pixel equality claims.

Earlier Chromium checks covered the original editor, controls, career gallery and 390 px layout without horizontal overflow. A partially warm original-style 100-player run took 26 ms with 7.5 MiB cached on this Mac; this is not a cold benchmark. Actual Safari/mobile-device testing remains pending.

An earlier game test attempt used files fetched while the repository was changing and failed because the local harness referenced `rebuildIndexes` absent from the local app snapshot. This was an inconsistent snapshot, not a confirmed repository defect. No game test success is claimed for this portrait-only work. Existing game files in the saved branch come directly from one consistent base tree.

The Lab uses synthetic names, position-appropriate physiques and preview school palettes. School colors are not verified branding. Editor changes are session-only. The four career panels use a fixed 6′4″ / 224→270 lb scenario, independent of the selected player's height/weight controls. Age changes are subtle; fuller facial maturation and season-specific hair changes are not implemented.

## Sensible next work

Keep tuning the approved original style: more expressive eyes/brows, better differentiated noses/jaws, cleaner locs/braids, stronger hair silhouettes, and consistent small-size readability. Compare a fixed 100-player sheet with identical uniforms so jersey colors cannot hide repetitive faces. Keep the same seeds when comparing visual changes.

Ideas mentioned to the user, **not approved replacements**:

1. **Cel-shaded sports illustration:** retain geometric planes, simplify shadows, add stronger expressive features. Closest extension of the approved look.
2. **Inked sports comic:** selective outlines and stronger light/shadow separation, while keeping features readable in small thumbnails.
3. **Layered paper-cut illustration:** overlapping colored shapes and restrained depth/shadows for an editorial trading-card feel.

Discuss or prototype one direction only if the user requests it; do not spend credits generating a large batch of unrelated art. The user is managing a limited credit budget.

## Later integration checklist — only when requested

Persist immutable `portraitSeed` and `portraitVersion` at creation/migration; preserve them through recruit signing, transfer, archive and save/load. The current read-only ID fallback is sufficient for a preview, not a completed migration. Missing IDs fall back to one placeholder identity. Existing recruits appeared to lack height/weight in the inspected snapshot, so explicitly map their identity/physical profile into signed players. Adapt actual team colors/jersey fields, retain archived age/weight/team context, and add lazy portraits to roster/recruiting/profile screens. Never use names, team, age or array position as permanent identity. Keep visual randomness independent from the simulation. Freeze version 1 before production; future incompatible appearance changes need explicit version handling. Preserve save compatibility and run the current game suites before integration.

## Prompt to continue in regular GPT

“Continue the standalone player Portrait Lab in MarkJRogers92/Football, branch codex/portrait-lab-2-5d. Read portraits/HANDOFF.md and portraits/README.md first. I approved the original geometric 2.5D portraits and rejected the pixel variants. Do not integrate into the game or deploy yet. Help me refine the portrait artwork and variation from this working prototype.”

If GitHub access or code execution is unavailable in that chat, upload the source ZIP and this handoff. It can discuss/refine the design from those files, but should not claim to have run or pushed code without tools.
