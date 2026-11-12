"""Rivalry trophy sprites, modelled and rendered in Blender (bpy 5.0.1).

Builds the seven trophy nouns from TROPHY_NOUNS in app.js that had no art of
their own (axe, jug, barrel, anvil, spade, bucket, cannon), renders each with
Cycles at 512px on a transparent background and writes 256px WebP sprites to
assets/awards/rivalry-<noun>.webp, matching the art pack (camera yaw 35,
pitch 24, walnut plinths, navy and gold accents).

Setup (once, Python 3.11 is required by the bpy wheel):
    uv venv -p 3.11 .blender-venv
    uv pip install -p .blender-venv/bin/python bpy==5.0.1 pillow
Run:
    .blender-venv/bin/python tools/blender/rivalry_trophies.py [names...] [--samples N] [--png-dir DIR] [--no-webp]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *  # noqa: E402,F401,F403  (helpers, materials, plinth, renderer)
from lib import D, TAU, Vector, main  # noqa: E402


# --------------------------------------------------------------------- models
def model_axe(M):
    top = plinth(M, 1.25, 1.0)
    g = group('axe', (0, 0, top))
    g.scale = (1.35, 1.35, 1.0)  # thicker handle and wider head without changing the height
    lathe('collar', [(0, 0), (0.16, 0), (0.16, 0.05), (0.12, 0.09), (0.09, 0.1), (0, 0.1)], [M['brass']], parent=g)
    lathe('handle', catmull([(0, 0.05), (0.07, 0.05), (0.075, 0.12), (0.062, 0.25), (0.052, 0.8),
                             (0.046, 1.3), (0.05, 1.62), (0.044, 1.7), (0, 1.7)], 3),
          [M['hickory']], parent=g, segs=40)
    band('grip', lambda z: 0.064 - 0.01 * (z - 0.2), 0.16, 0.55, M['navy'], out=0.012, parent=g)
    for z in (0.16, 0.55):
        band('grip_ring', lambda _: 0.062, z - 0.015, z + 0.015, M['brass'], out=0.014, parent=g)
    band('neck_ring', lambda _: 0.048, 1.28, 1.33, M['brass'], out=0.012, parent=g)
    head = [(-0.21, -0.10), (0.06, -0.10), (0.26, -0.13), (0.44, -0.24), (0.56, -0.31), (0.60, -0.16),
            (0.615, 0.0), (0.60, 0.16), (0.56, 0.31), (0.44, 0.24), (0.26, 0.13), (0.06, 0.10),
            (-0.21, 0.10), (-0.23, 0.0)]

    def taper(co):
        f = min(1.0, max(0.0, (co.x - 0.08) / 0.52))
        co.y *= 1.0 - 0.88 * f

    slab('head', head, 0.17, [M['navy'], M['steel']], parent=g, loc=(0, 0, 1.52),
         cuts_x=(0.0, 0.1, 0.2, 0.3, 0.42, 0.5, 0.56), shape=taper,
         matfn=lambda c: 1 if c.x > 0.43 else 0, bevel=0.012)
    star('head_star', 0.07, 0.03, 0.02, M['brass'], parent=g, loc=(0.24, -0.06, 1.52),
         rot=(0, 0, 0.12))


def model_jug(M):
    top = plinth(M, 1.45, 1.15)
    g = group('jug', (0, 0, top), (0, 0, math.radians(35)))
    prof = [(0, 0), (0.36, 0), (0.41, 0.03), (0.47, 0.12), (0.52, 0.28), (0.54, 0.42), (0.52, 0.56),
            (0.46, 0.70), (0.36, 0.83), (0.24, 0.94), (0.16, 1.02), (0.14, 1.10), (0.165, 1.16),
            (0.185, 1.20), (0.165, 1.235), (0.12, 1.225), (0.10, 1.16), (0, 1.14)]
    prof = resample(catmull(prof, 4), 0.012)

    def mf(c):
        z = c.z
        return 1 if 0.56 < z < 0.635 else 3 if 0.635 <= z < 0.665 else 2 if z >= 0.665 else 0

    lathe('body', prof, [M['glaze_brown'], M['navy'], M['glaze_cream'], M['brass']], parent=g,
          segs=72, matfn=mf, sharp=0)
    tube('handle', [(0.12, 0, 1.0), (0.40, 0, 1.07), (0.68, 0, 0.94), (0.68, 0, 0.66), (0.49, 0, 0.56)],
         0.05, M['glaze_cream'], parent=g)
    lathe('cork', [(0, 1.15), (0.105, 1.15), (0.125, 1.33), (0.11, 1.35), (0, 1.35)], [M['cork']], parent=g,
          segs=40)


def barrel_r(z, H=1.25):
    return 0.40 + 0.10 * math.sin(math.pi * min(max(z / H, 0), 1))


def model_barrel(M):
    top = plinth(M, 1.4, 1.25)
    H = 1.25
    g = group('barrel', (0, 0, top), (0, 0, math.radians(20)))
    prof = [(0, 0.05), (0.37, 0.05), (0.37, 0.0)]
    prof += [(barrel_r(H * i / 30), H * i / 30) for i in range(31)]
    prof += [(0.37, H), (0.37, H - 0.05), (0, H - 0.05)]
    lathe('staves', prof, [M['oak'], M['oak_lid']], parent=g, segs=72,
          matfn=lambda c: 1 if c.z > H - 0.06 and Vector((c.x, c.y)).length < 0.369 else 0, sharp=50)
    for z in (0.08, 0.30, 0.95, 1.17):
        band('hoop', barrel_r, z - 0.035, z + 0.035, M['iron'], parent=g)
    band('belt', barrel_r, 0.56, 0.69, M['navy'], out=0.016, parent=g)
    for z in (0.545, 0.705):
        band('belt_trim', barrel_r, z - 0.012, z + 0.012, M['brass'], out=0.022, parent=g)
    # tap on the side facing the camera
    a = math.radians(-55 - 20)
    r = barrel_r(0.3)
    t = group('tap', (r * math.cos(a), r * math.sin(a), 0.3), (math.pi / 2, 0, a + math.pi / 2), parent=g)
    lathe('tap_pipe', [(0, -0.02), (0.05, -0.02), (0.05, 0.08), (0.035, 0.1), (0.035, 0.2), (0, 0.2)],
          [M['brass']], parent=t, rot=(0, 0, 0), segs=32)
    lathe('tap_nozzle', [(0, 0), (0.03, 0), (0.03, 0.10), (0.04, 0.12), (0, 0.12)], [M['brass']],
          parent=t, loc=(0, 0, 0.17), rot=(math.pi / 2, 0, 0), segs=32)
    box('tap_key', (0.12, 0.02, 0.03), (0, -0.07, 0.15), M['brass'], 0.006, parent=t)
    star('lid_star', 0.11, 0.045, 0.02, M['brass'], parent=g, loc=(0, 0, H - 0.04), rot=(math.pi / 2, 0, 0))


def bucket_r(z, H=0.8):
    return 0.36 + 0.11 * z / H


def model_bucket(M):
    top = plinth(M, 1.35, 1.15)
    H = 0.8
    g = group('bucket', (0, 0, top), (0, 0, math.radians(25)))
    prof = [(0, 0.04), (0.34, 0.04), (0.34, 0.0), (0.36, 0.0), (0.47, H), (0.43, H), (0.33, 0.10), (0, 0.10)]
    lathe('staves', resample(prof, 0.05), [M['oak']], parent=g, segs=72, sharp=50)
    for z in (0.12, 0.62):
        band('hoop', bucket_r, z - 0.04, z + 0.04, M['brass'], parent=g)
    for s in (-1, 1):
        box('ear', (0.05, 0.09, 0.12), (s * 0.475, 0, 0.70), M['iron'], 0.012, parent=g,
            rot=(0, s * -0.14, 0))
    tube('bail', [(-0.50, 0, 0.70), (-0.56, 0, 1.08), (-0.26, 0, 1.36), (0, 0, 1.38), (0.26, 0, 1.36),
                  (0.56, 0, 1.08), (0.50, 0, 0.70)], 0.018, M['iron'], parent=g)
    lathe('grip', catmull([(0, -0.15), (0.04, -0.15), (0.05, -0.11), (0.052, 0.0), (0.05, 0.11),
                           (0.04, 0.15), (0, 0.15)], 3), [M['hickory']], parent=g,
          loc=(0, 0, 1.305), rot=(0, math.pi / 2, 0), segs=32)


def model_anvil(M):
    top = plinth(M, 1.75, 1.05)
    g = group('anvil', (-0.08, 0, top))
    box('foot', (0.95, 0.55, 0.14), (-0.08, 0, 0.07), M['iron'], 0.02, parent=g, taper=(0.8, 0.78))
    box('waist', (0.62, 0.36, 0.28), (-0.08, 0, 0.28), M['iron'], 0.02, parent=g, taper=(0.72, 0.78))
    box('flare', (0.62, 0.30, 0.12), (-0.08, 0, 0.48), M['iron'], 0.02, parent=g, taper=(1.75, 1.33))
    box('face', (1.12, 0.40, 0.22), (-0.10, 0, 0.65), M['iron'], 0.025, parent=g)
    box('face_steel', (1.08, 0.37, 0.03), (-0.10, 0, 0.765), M['steel'], 0.008, parent=g)
    box('hardy', (0.06, 0.06, 0.02), (-0.48, 0.05, 0.775), M['iron'], 0.004, parent=g)
    lathe('horn', catmull([(0, 0), (0.13, 0), (0.12, 0.12), (0.09, 0.28), (0.052, 0.44), (0.018, 0.57),
                           (0, 0.6)], 3), [M['iron']], parent=g, loc=(0.42, 0, 0.66),
          rot=(0, math.pi / 2 - 0.08, 0), segs=48)
    star('waist_star', 0.085, 0.035, 0.02, M['brass'], parent=g, loc=(-0.08, -0.155, 0.29),
         rot=(-0.11, 0, 0))


def model_spade(M):
    top = plinth(M, 1.2, 1.0)
    sphere('mound', 0.5, (0, 0, top - 0.02), M['turf'], scale=(1.0, 0.8, 0.28))
    g = group('spade', (0, 0, top + 0.02), (0, math.radians(14), math.radians(22)))
    g.scale = (1.4, 1.4, 1.0)
    blade = [(0, 0), (0.17, 0.12), (0.25, 0.30), (0.27, 0.55), (0.26, 0.62), (0.08, 0.64), (-0.08, 0.64),
             (-0.26, 0.62), (-0.27, 0.55), (-0.25, 0.30), (-0.17, 0.12)]

    def dish(co):
        co.y += 0.35 * co.x * co.x

    slab('blade', blade, 0.025, [M['brass']], parent=g, cuts_x=[i * 0.05 for i in range(-5, 6)],
         cuts_z=(0.15, 0.3, 0.45), shape=dish, bevel=0.006)
    lathe('socket', [(0, 0.6), (0.09, 0.6), (0.085, 0.66), (0.05, 0.86), (0, 0.86)], [M['brass']], parent=g,
          segs=40)
    lathe('shaft', [(0, 0.84), (0.042, 0.84), (0.04, 1.7), (0, 1.7)], [M['hickory']], parent=g, segs=32)
    band('grip', lambda _: 0.041, 1.38, 1.62, M['navy'], out=0.01, parent=g)
    band('ferrule', lambda _: 0.042, 1.66, 1.74, M['brass'], out=0.012, parent=g)
    tube('d_left', [(0, 0, 1.72), (-0.10, 0, 1.80), (-0.14, 0, 1.96)], 0.026, M['hickory'], parent=g)
    tube('d_right', [(0, 0, 1.72), (0.10, 0, 1.80), (0.14, 0, 1.96)], 0.026, M['hickory'], parent=g)
    lathe('d_bar', [(0, -0.17), (0.035, -0.17), (0.035, 0.17), (0, 0.17)], [M['hickory']], parent=g,
          loc=(0, 0, 1.97), rot=(0, math.pi / 2, 0), segs=24)
    for s in (-1, 1):
        sphere('d_cap', 0.04, (s * 0.17, 0, 1.97), M['brass'], parent=g)


def wheel(M, parent, loc):
    w = group('wheel', loc, (math.pi / 2, 0, 0), parent)
    lathe('rim', [(0.29, -0.035), (0.345, -0.035), (0.345, 0.035), (0.29, 0.035)], [M['hickory']], parent=w,
          closed=True, sharp=50)
    lathe('tire', [(0.343, -0.04), (0.365, -0.04), (0.365, 0.04), (0.343, 0.04)], [M['iron']], parent=w,
          closed=True, sharp=50)
    lathe('hub', catmull([(0, -0.10), (0.05, -0.10), (0.075, -0.05), (0.08, 0), (0.075, 0.05),
                          (0.05, 0.10), (0, 0.10)], 3), [M['brass']], parent=w, segs=32)
    for k in range(10):
        lathe('spoke', [(0, 0.06), (0.02, 0.06), (0.016, 0.31), (0, 0.31)], [M['hickory']], parent=w,
              rot=(math.pi / 2, 0, k * TAU / 10), segs=12)


def model_cannon(M):
    top = plinth(M, 2.0, 1.25)
    g = group('cannon', (0.12, 0, top), (0, 0, math.radians(-12)))
    R = 0.365
    for y in (-0.33, 0.33):
        wheel(M, g, (0, y, R))
    lathe('axle', [(0, -0.42), (0.03, -0.42), (0.03, 0.42), (0, 0.42)], [M['iron']], parent=g,
          loc=(0, 0, R), rot=(math.pi / 2, 0, 0), segs=16)
    for y in (-0.2, 0.2):
        box('cheek', (0.75, 0.06, 0.26), (-0.12, y, R + 0.12), M['navy'], 0.015, parent=g)
        box('cheek_trim', (0.75, 0.065, 0.025), (-0.12, y, R + 0.255), M['brass'], 0.006, parent=g)
    box('trail', (0.95, 0.30, 0.10), (-0.66, 0, 0.27), M['navy'], 0.02, parent=g, rot=(0, -0.44, 0))
    b = group('barrel', (0, 0, R + 0.30), (0, math.radians(-8), 0), g)
    prof = [(0, 0), (0.04, 0), (0.055, 0.03), (0.04, 0.07), (0.032, 0.09), (0.12, 0.11), (0.19, 0.16),
            (0.205, 0.22), (0.19, 0.245), (0.19, 0.36), (0.205, 0.38), (0.205, 0.42), (0.18, 0.44),
            (0.145, 1.12), (0.168, 1.16), (0.168, 1.22), (0.148, 1.25), (0.162, 1.28), (0.162, 1.31),
            (0.085, 1.31), (0.085, 1.18), (0, 1.18)]
    lathe('tube', prof, [M['bronze']], parent=b, loc=(-0.45, 0, 0), rot=(0, math.pi / 2, 0), segs=64)
    lathe('trunnions', [(0, -0.27), (0.045, -0.27), (0.045, 0.27), (0, 0.27)], [M['bronze']], parent=b,
          rot=(math.pi / 2, 0, 0), segs=24)
    for loc in ((0.62, -0.42, 0.09), (0.80, -0.38, 0.09), (0.71, -0.24, 0.09), (0.71, -0.35, 0.235)):
        sphere('ball', 0.09, loc, M['iron'])
    for o in D.objects:
        if o.name.startswith('ball'):
            o.location.z += top


MODELS = {
    'axe': model_axe, 'jug': model_jug, 'barrel': model_barrel, 'anvil': model_anvil,
    'spade': model_spade, 'bucket': model_bucket, 'cannon': model_cannon,
}


if __name__ == '__main__':
    main(MODELS, 'rivalry-')
