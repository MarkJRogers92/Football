"""Small props for The Wire's story kickers, modelled and rendered in Blender (bpy 5.0.1).

Writes assets/awards/<name>.webp for:
    hard-hat          FACILITIES (a facility level opens)
    compass           LOST, CUT, FLIPPED (a recruit went another way)
    dumbbell          PAYOFF (a player's development paid off)
    milestone-marker  MILESTONE
    podium            RECORD WATCH, SCHOOL RECORD, NATIONAL RECORD
Mapped in program-art.js (KICKER). Setup and style: tools/blender/README.md.
Run:
    .blender-venv/bin/python tools/blender/props.py [names...] [--samples N] [--png-dir DIR] [--no-webp]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *  # noqa: E402,F401,F403  (helpers, materials, plinth, renderer)
from lib import TAU, main  # noqa: E402


def extra(M):
    """Materials only these props use."""
    # navy reads too bright on the large flat areas these props have; darker than the shared one
    M['navy'] = material('navy_deep', (0.005, 0.011, 0.045), (0.010, 0.022, 0.08), (0.35, 0.5),
                         scale=6.0, ao=0.4, bump=0.03, coat=0.3)
    M['paint_gold'] = material('paint_gold', (0.48, 0.20, 0.003), (0.74, 0.37, 0.008), (0.12, 0.22),
                               scale=3.0, ao=0.4, bump=0.01, coat=0.9)
    M['blueprint'] = material('blueprint', (0.012, 0.04, 0.16), (0.03, 0.08, 0.27), (0.7, 0.85),
                              scale=30.0, ao=0.4, bump=0.05)
    M['paper'] = material('paper', (0.55, 0.48, 0.36), (0.78, 0.72, 0.58), (0.7, 0.85), scale=25.0,
                          ao=0.4, bump=0.04)
    M['enamel'] = material('enamel', (0.70, 0.66, 0.58), (0.82, 0.78, 0.70), (0.2, 0.3), scale=5.0,
                           ao=0.35, bump=0.0, coat=0.6)
    M['red'] = material('red', (0.30, 0.02, 0.015), (0.50, 0.04, 0.025), (0.25, 0.4), scale=5.0,
                        ao=0.3, bump=0.0, coat=0.5)
    M['silver'] = material('silver', (0.50, 0.52, 0.55), (0.80, 0.81, 0.83), (0.15, 0.3), metal=1.0,
                           scale=5.0, ao=0.45, bump=0.03)
    M['chrome'] = material('chrome', (0.55, 0.56, 0.58), (0.85, 0.86, 0.88), (0.08, 0.14), metal=1.0,
                           scale=60.0, ao=0.3, bump=0.06)
    M['granite'] = material('granite', (0.045, 0.045, 0.048), (0.15, 0.145, 0.14), (0.5, 0.75), scale=45.0,
                            detail=10.0, ao=0.5, bump=0.25)
    glass = D.materials.new('glass')
    glass.use_nodes = True
    b = glass.node_tree.nodes['Principled BSDF']
    b.inputs['Transmission Weight'].default_value = 1.0
    b.inputs['Roughness'].default_value = 0.02
    b.inputs['IOR'].default_value = 1.45
    b.inputs['Base Color'].default_value = (0.95, 0.97, 1.0, 1)
    M['glass'] = glass


def model_hard_hat(M):
    extra(M)
    # two rolled blueprints under the hat, one on top of the other at an angle
    for x, y, z, a in ((-0.05, 0.28, 0.13, 0.22), (0.05, 0.55, 0.13, 0.22), (0.0, 0.42, 0.37, 0.22)):
        r = group('roll', (x, y, z), (0, math.pi / 2, a))
        lathe('paper', [(0, -0.58), (0.13, -0.58), (0.13, 0.58), (0, 0.58)], [M['blueprint']], parent=r,
              segs=48, sharp=50)
        for s in (-1, 1):
            band('roll_tie', lambda _: 0.13, s * 0.34 - 0.02, s * 0.34 + 0.02, M['navy'], out=0.008, parent=r)
            # the spiral end of the roll: a pale disc with a darker core
            lathe('end', [(0.125, 0), (0, 0)][::s], [M['paper']], parent=r, loc=(0, 0, s * 0.581), segs=48)
    hat = group('hat', (0.12, -0.32, 0.0), (0, 0, math.radians(30)))
    dome = catmull([(0, 0.60), (0.18, 0.58), (0.34, 0.50), (0.45, 0.36), (0.50, 0.20), (0.52, 0.06),
                    (0.53, 0.0)], 4)
    lathe('dome', [(0, 0.04), (0.50, 0.0)] + dome[::-1], [M['paint_gold']], parent=hat, segs=72, sharp=60)
    brim = group('brim', (0, -0.04, 0.0), (0, 0, 0), hat)
    brim.scale = (1.0, 1.25, 1.0)
    lathe('brim', catmull([(0.48, 0.07), (0.53, 0.06), (0.59, 0.03), (0.62, 0.0), (0.615, -0.02),
                           (0.57, -0.005), (0.50, 0.01), (0.46, 0.02)], 3)[::-1], [M['paint_gold']],
          parent=brim, segs=72, sharp=70, closed=True)
    slab('ridge', catmull([(-0.40, 0.30), (-0.30, 0.50), (-0.15, 0.60), (0.0, 0.64), (0.15, 0.60),
                           (0.30, 0.50), (0.40, 0.30), (0.40, 0.24), (0.0, 0.56), (-0.40, 0.24)], 1),
         0.08, [M['paint_gold']], parent=hat, rot=(0, 0, math.pi / 2), bevel=0.012)
    band('hat_band', lambda z: 0.505 - (z - 0.07) * 0.1, 0.07, 0.14, M['navy'], out=0.012, parent=hat)
    star('hat_star', 0.10, 0.042, 0.03, M['brass'], parent=hat, loc=(0, -0.465, 0.34), rot=(-0.5, 0, 0))


def model_compass(M):
    extra(M)
    # a folded map sheet under the compass
    box('map', (1.6, 1.15, 0.02), (0, 0.05, 0.01), M['paper'], 0.004, rot=(0, 0, 0.18))
    box('map_fold', (0.02, 1.15, 0.021), (0.15, 0.08, 0.011), M['blueprint'], 0.002, rot=(0, 0, 0.18))
    c = group('compass', (0, 0, 0.02), (0, 0, math.radians(-10)))
    lathe('case', catmull([(0, 0), (0.50, 0), (0.56, 0.03), (0.58, 0.10), (0.57, 0.17), (0.53, 0.19),
                           (0.50, 0.16)], 3) + [(0.48, 0.12), (0, 0.12)], [M['brass']], parent=c, segs=96)
    lathe('dial', [(0.48, 0.121), (0, 0.121)], [M['enamel']], parent=c, segs=96)
    lathe('ring', [(0.40, 0.122), (0.47, 0.122), (0.47, 0.13), (0.40, 0.13)], [M['navy']], parent=c, segs=96,
          closed=True)
    for k in range(16):
        a = k * TAU / 16
        long_tick = k % 4 == 0
        box('tick', (0.012 if not long_tick else 0.022, 0.05 if not long_tick else 0.07, 0.006),
            (0.36 * math.sin(a), 0.36 * math.cos(a), 0.127), M['brass' if long_tick else 'iron'], 0.0,
            parent=c, rot=(0, 0, -a))
    n = group('needle', (0, 0, 0.135), (0, 0, math.radians(-38)), c)
    slab('needle_n', [(-0.05, 0.0), (0.05, 0.0), (0.0, 0.33)], 0.02, [M['red']], parent=n,
         rot=(math.pi / 2, 0, 0), bevel=0.004)
    slab('needle_s', [(0.05, 0.0), (-0.05, 0.0), (0.0, -0.33)], 0.02, [M['navy']], parent=n,
         rot=(math.pi / 2, 0, 0), bevel=0.004)
    lathe('pivot', catmull([(0, 0.0), (0.035, 0.0), (0.03, 0.02), (0, 0.03)], 2), [M['brass']], parent=n, segs=24)
    lathe('glass', [(0, 0.15), (0.49, 0.15)] + catmull([(0, 0.215), (0.30, 0.20), (0.46, 0.175), (0.50, 0.15)], 3)[::-1],
          [M['glass']], parent=c, segs=96, sharp=0)
    # open lid, hinged at the back, its navy inside facing the camera
    lid = group('lid', (0, 0.58, 0.17), (math.radians(-105), 0, 0), c)
    lathe('lid_shell', catmull([(0, 0), (0.56, 0), (0.58, 0.03), (0.56, 0.07), (0, 0.08)], 3), [M['brass']],
          parent=lid, loc=(0, -0.6, 0), segs=96)
    lathe('lid_inside', [(0, -0.001), (0.50, -0.001)], [M['navy']], parent=lid, loc=(0, -0.6, 0), segs=96)
    star('lid_star', 0.16, 0.065, 0.02, M['brass'], parent=lid, loc=(0, -0.6, -0.01), rot=(math.pi / 2, 0, 0))
    lathe('hinge', [(0, -0.12), (0.04, -0.12), (0.04, 0.12), (0, 0.12)], [M['brass']], parent=c,
          loc=(0, 0.58, 0.17), rot=(0, math.pi / 2, 0), segs=24)
    bow = group('bow', (0, -0.57, 0.10), (0, 0, 0), c)
    lathe('stem', [(0, 0), (0.05, 0), (0.05, 0.07), (0, 0.07)], [M['brass']], parent=bow,
          rot=(math.pi / 2, 0, 0), segs=24)
    tube('ring_loop', [(-0.07, -0.05, 0), (-0.11, -0.15, 0), (0, -0.22, 0), (0.11, -0.15, 0), (0.07, -0.05, 0)],
         0.022, M['brass'], parent=bow)


def model_dumbbell(M):
    extra(M)
    box('rack_base', (1.5, 0.62, 0.10), (0, 0, 0.05), M['navy'], 0.025)
    for x in (-0.30, 0.30):
        box('rack_post', (0.12, 0.30, 0.38), (x, 0, 0.28), M['navy'], 0.02, taper=(0.8, 0.8))
        box('cradle', (0.16, 0.36, 0.05), (x, 0, 0.49), M['brass'], 0.015)
    d = group('dumbbell', (0, 0, 0.57), (0, math.pi / 2, math.radians(8)))
    lathe('handle', [(0, -0.75), (0.055, -0.75), (0.055, 0.75), (0, 0.75)], [M['chrome']], parent=d,
          segs=32, sharp=50)
    for s in (-1, 1):
        # hexagonal iron heads: a six-sided lathe with gold collars
        lathe('head', [(0, s * 0.42), (0.17, s * 0.42), (0.20, s * 0.45), (0.20, s * 0.70), (0.17, s * 0.73),
                       (0, s * 0.73)][::s], [M['iron']], parent=d, segs=6, sharp=25,
              rot=(0, 0, math.pi / 6))
        band('collar', lambda _: 0.06, s * 0.38 - 0.035, s * 0.38 + 0.035, M['brass'], out=0.03, parent=d)
        lathe('cap', [(0, s * 0.735), (0.09, s * 0.735), (0.07, s * 0.76), (0, s * 0.765)][::s], [M['brass']],
              parent=d, segs=32)
    band('grip_ring_l', lambda _: 0.055, -0.20, -0.17, M['brass'], out=0.006, parent=d)
    band('grip_ring_r', lambda _: 0.055, 0.17, 0.20, M['brass'], out=0.006, parent=d)


def model_milestone_marker(M):
    extra(M)
    lathe('turf', [(0, 0.0)] + catmull([(0, 0.14), (0.55, 0.13), (0.78, 0.07), (0.85, 0.0)], 4)[::-1],
          [M['turf']], segs=64, sharp=0)
    m = group('marker', (0, 0, 0.08), (0, 0, math.radians(14)))
    box('post', (0.62, 0.34, 1.05), (0, 0, 0.52), M['granite'], 0.03, parent=m, taper=(0.92, 0.92))
    cap = group('cap', (0, 0, 1.04), (math.pi / 2, 0, 0), m)
    lathe('cap_round', [(0, -0.157), (0.285, -0.157), (0.285, 0.157), (0, 0.157)], [M['granite']], parent=cap,
          segs=48, sharp=50)
    box('plaque', (0.40, 0.03, 0.30), (0, -0.165, 0.68), M['plate'], 0.01, parent=m, rot=(-0.02, 0, 0))
    star('marker_star', 0.11, 0.045, 0.03, M['brass'], parent=m, loc=(0, -0.155, 1.05))
    box('foot', (0.78, 0.48, 0.12), (0, 0, 0.06), M['granite'], 0.02, parent=m)
    for (x, y, r) in ((0.55, -0.25, 0.07), (-0.5, -0.35, 0.055), (0.62, 0.15, 0.05)):
        sphere('pebble', r, (x, y, 0.12), M['granite'], scale=(1.2, 1.0, 0.7))


def model_podium(M):
    extra(M)
    steps = ((-0.62, 0.42, M['silver']), (0.0, 0.62, M['paint_gold']), (0.62, 0.30, M['bronze']))
    for x, h, top in steps:
        box('step', (0.62, 0.62, h), (x, 0, h / 2), M['navy'], 0.02)
        box('step_top', (0.64, 0.64, 0.05), (x, 0, h + 0.02), top, 0.015)
        star('step_star', 0.10, 0.042, 0.025, M['brass'], loc=(x, -0.32, h * 0.5))
    # a small gold cup on the top step
    cup = group('cup', (0, 0, 0.665), (0, 0, math.radians(30)))
    lathe('cup', catmull([(0, 0), (0.17, 0), (0.18, 0.03), (0.10, 0.06), (0.05, 0.10), (0.045, 0.22),
                          (0.10, 0.26), (0.20, 0.32), (0.25, 0.45), (0.26, 0.58), (0.24, 0.58),
                          (0.23, 0.46), (0.18, 0.35)], 3) + [(0, 0.30)], [M['brass']], parent=cup, segs=64)
    for s in (-1, 1):
        tube('cup_handle', [(s * 0.22, 0, 0.52), (s * 0.36, 0, 0.52), (s * 0.34, 0, 0.36), (s * 0.20, 0, 0.36)],
             0.022, M['brass'], parent=cup)


MODELS = {
    'hard-hat': model_hard_hat, 'compass': model_compass, 'dumbbell': model_dumbbell,
    'milestone-marker': model_milestone_marker, 'podium': model_podium,
}

if __name__ == '__main__':
    main(MODELS)
