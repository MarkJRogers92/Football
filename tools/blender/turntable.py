"""Turntable sprite strips for ceremonies, rendered in Blender (bpy 5.0.1).

Each strip is FRAMES frames of SIZE px in one row (like assets/ring-turn-v1.webp), written to
assets/turntables/<name>.webp and stepped through with CSS (see .cer-turn in brand-identity.css).

Sources:
  rivalry-axe, -jug, -barrel, -anvil, -spade, -bucket, -cannon   modelled in rivalry_trophies.py
  anything else (rivalry-bell, -boot, -lantern, -shield, player-of-year, ...)
      a GLB from the Meshy art pack: the Dynasty-Lab-16-Asset-Pack.zip asset of the GitHub
      release dynasty-assets-2026-11-11, unzipped; pass its models/ folder as --glb-dir.
Run:
    .blender-venv/bin/python tools/blender/turntable.py [names...] --glb-dir <pack>/models
"""
import argparse
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import ROOT, build_materials, frame_and_light, reset, setup_render  # noqa: E402
import bpy  # noqa: E402
import rivalry_trophies  # noqa: E402

DEFAULT = ['rivalry-' + n for n in ('bell', 'axe', 'boot', 'jug', 'barrel', 'anvil', 'lantern', 'spade',
                                     'bucket', 'cannon', 'shield')] + ['player-of-year']


def build(name, glb_dir):
    coded = name.removeprefix('rivalry-')
    if name.startswith('rivalry-') and coded in rivalry_trophies.MODELS:
        rivalry_trophies.MODELS[coded](build_materials())
        return
    path = os.path.join(glb_dir or '', f'{name}.glb')
    if not os.path.exists(path):
        sys.exit(f'{name}: no coded model and no GLB at {path} (pass --glb-dir)')
    bpy.ops.import_scene.gltf(filepath=path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('names', nargs='*', default=DEFAULT)
    ap.add_argument('--glb-dir')
    ap.add_argument('--frames', type=int, default=36)
    ap.add_argument('--size', type=int, default=192)
    ap.add_argument('--samples', type=int, default=48)
    ap.add_argument('--quality', type=int, default=74)
    ap.add_argument('--work-dir', default=os.path.join(ROOT, 'tools', 'blender', 'out', 'turn'))
    a = ap.parse_args()
    from PIL import Image
    out_dir = os.path.join(ROOT, 'assets', 'turntables')
    os.makedirs(out_dir, exist_ok=True)
    for name in a.names:
        reset()
        build(name, a.glb_dir)
        setup_render(a.samples, a.size * 2)
        bpy.context.scene.render.use_persistent_data = True
        rig = frame_and_light(spin=True)
        strip = Image.new('RGBA', (a.size * a.frames, a.size), (0, 0, 0, 0))
        work = os.path.join(a.work_dir, name)
        os.makedirs(work, exist_ok=True)
        for i in range(a.frames):
            rig.rotation_euler.z = math.tau * i / a.frames
            png = os.path.join(work, f'{i:02d}.png')
            bpy.context.scene.render.filepath = png
            bpy.ops.render.render(write_still=True)
            frame = Image.open(png).convert('RGBA').resize((a.size, a.size), Image.LANCZOS)
            strip.alpha_composite(frame, (i * a.size, 0))
        out = os.path.join(out_dir, f'{name}.webp')
        strip.save(out, 'WEBP', quality=a.quality, method=6)
        print('wrote', out, os.path.getsize(out), 'bytes', flush=True)


if __name__ == '__main__':
    main()
