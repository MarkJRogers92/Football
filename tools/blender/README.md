# Blender art pipeline

Art modelled in code with Blender, used when Meshy is not an option (no credits) or when an
object is hard-surface and easier to script than to prompt. Each script builds its models from
primitives, lathes and extruded profiles, renders them with Cycles and writes the game's sprites.

## Setup

The personal cloud environment "Football" runs this at the start of every session, so there it is
already done. Elsewhere, set it up once. The `bpy` wheel is Blender itself as a Python module; it needs Python 3.11 and has no GUI.

```bash
uv venv -p 3.11 .blender-venv
uv pip install -p .blender-venv/bin/python bpy==5.0.1 pillow
```

`.blender-venv/` is about 1 GB; keep it out of the repository (it is in `.gitignore`).

## Scripts

| Script | Writes | Run |
| --- | --- | --- |
| `lib.py` | (shared) modelling helpers, materials, plinth, renderer and `main()` | |
| `rivalry_trophies.py` | `assets/awards/rivalry-{axe,jug,barrel,anvil,spade,bucket,cannon}.webp` | `.blender-venv/bin/python tools/blender/rivalry_trophies.py [names]` |
| `props.py` | `assets/awards/{hard-hat,compass,dumbbell,milestone-marker,podium}.webp` (The Wire) | `.blender-venv/bin/python tools/blender/props.py [names]` |

A full render (512 px, 128 samples, the default) takes about 25 to 30 seconds a model on 4 CPUs, and
re-running a script reproduces the committed sprites. While iterating, use
`--samples 16 --size 384 --no-webp --png-dir <scratch dir>` and look at the PNGs: that is fast and
leaves the assets alone. Run `npm run build` afterwards so `sw.js` lists any new file.

## House style (matches the Meshy art pack and `tools/procedural-art`)

- Camera yaw 35°, pitch 24°, 22° field of view, model fitted to the frame
  (`frame_and_light`, a port of `tools/procedural-art/render.html`).
- Transparent background, rendered at 512 px, saved as 256 px WebP at quality 82.
- Warm walnut plinth with a blank brass plate; navy and gold accents; aged metals.
- No text, letters or logos on the objects.
- Blender is Z-up and the camera looks at the −Y face, so the "front" of a model faces −Y and
  its right side faces +X.

## Adding a model

Write `model_<name>(M)` (in an existing script or a new one ending in `main(MODELS, prefix)`) using the helpers (`plinth`, `box`, `lathe`, `band`, `slab`, `tube`,
`sphere`, `star`) and materials in `M`, add it to `MODELS`, then render it and compare it with
the existing sprites side by side on the app's dark background before committing.
