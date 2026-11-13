"""Small props for The Wire's story kickers, modelled and rendered in Blender (bpy 5.0.1).

Writes assets/awards/<name>.webp for:
    hard-hat          FACILITIES (a facility level opens)
    compass           LOST, CUT, FLIPPED (a recruit went another way)
    dumbbell          PAYOFF (a player's development paid off)
    milestone-marker  MILESTONE
    podium            RECORD WATCH, SCHOOL RECORD, NATIONAL RECORD
    balance-scale     ROLE BATTLE (season stories), Position Battles
    chalkboard        Offensive / Defensive / Scheme Identity
    coaching-tree     COACHING TREE, Coaching Tree
    seedling          EMERGING (season stories)
    cornerstone       CORNERSTONE (season stories)
    file-cabinet      Player Archive
    binoculars        Following (Around Your Program briefing)
    globe             League (Around Your Program briefing)
Mapped in program-art.js (KICKER) or placed in body.html. Setup and style: tools/blender/README.md.
Run:
    .blender-venv/bin/python tools/blender/props.py [names...] [--samples N] [--png-dir DIR] [--no-webp]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *  # noqa: E402,F401,F403  (helpers, materials, plinth, renderer)
from lib import TAU, D, _n, main  # noqa: E402


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


def extra2(M):
    """Materials for the second batch."""
    extra(M)
    M['slate'] = material('slate', (0.012, 0.03, 0.022), (0.03, 0.06, 0.045), (0.75, 0.9), scale=20.0,
                          ao=0.3, bump=0.05)
    M['chalk'] = material('chalk', (0.70, 0.70, 0.66), (0.90, 0.90, 0.86), (0.9, 1.0), scale=80.0,
                          ao=0.0, bump=0.2)
    M['soil'] = material('soil', (0.025, 0.015, 0.008), (0.07, 0.045, 0.025), (0.85, 1.0), scale=70.0,
                         detail=8.0, bump=0.6)
    M['leaf'] = material('leaf', (0.005, 0.024, 0.005), (0.018, 0.065, 0.010), (0.45, 0.6), scale=30.0,
                         detail=8.0, ao=0.6, bump=0.6)
    M['bark'] = material('bark', (0.04, 0.022, 0.012), (0.12, 0.075, 0.045), (0.7, 0.9), pattern='wood',
                         scale=18.0, distortion=12.0, detail=8.0, bump=0.5, band_dir='Z')
    # brick: a brick texture on the wall faces (x + y runs along both walls, z is up)
    m = D.materials.new('brick')
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    tc = _n(nt, 'ShaderNodeTexCoord')
    sep = _n(nt, 'ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs[0])
    add = _n(nt, 'ShaderNodeMath', operation='ADD')
    nt.links.new(sep.outputs['X'], add.inputs[0])
    nt.links.new(sep.outputs['Y'], add.inputs[1])
    comb = _n(nt, 'ShaderNodeCombineXYZ')
    nt.links.new(add.outputs[0], comb.inputs['X'])
    nt.links.new(sep.outputs['Z'], comb.inputs['Y'])
    br = _n(nt, 'ShaderNodeTexBrick')
    br.inputs['Color1'].default_value = (0.20, 0.045, 0.02, 1)
    br.inputs['Color2'].default_value = (0.30, 0.08, 0.035, 1)
    br.inputs['Mortar'].default_value = (0.38, 0.35, 0.30, 1)
    br.inputs['Scale'].default_value = 7.0
    br.inputs['Mortar Size'].default_value = 0.018
    br.inputs['Brick Width'].default_value = 0.5
    br.inputs['Row Height'].default_value = 0.18
    nt.links.new(comb.outputs[0], br.inputs['Vector'])
    nt.links.new(br.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.85
    bp = _n(nt, 'ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.4
    bp.inputs['Distance'].default_value = 0.02
    inv = _n(nt, 'ShaderNodeMath', operation='SUBTRACT')
    inv.inputs[0].default_value = 1.0
    nt.links.new(br.outputs['Fac'], inv.inputs[1])
    nt.links.new(inv.outputs[0], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], bsdf.inputs['Normal'])
    M['brick'] = m


def chain(name, a, b, mat, parent=None, links=7):
    """A row of small brass links from a to b, drawn as a thin tube with beads."""
    tube(name, [a, tuple((x + y) / 2 for x, y in zip(a, b)), b], 0.008, mat, parent=parent)
    for k in range(1, links):
        t = k / links
        sphere(name + '_bead', 0.016, tuple(x + (y - x) * t for x, y in zip(a, b)), mat, parent=parent)


def model_balance_scale(M):
    extra2(M)
    lathe('base', catmull([(0, 0), (0.42, 0), (0.44, 0.04), (0.40, 0.09), (0.30, 0.12), (0.16, 0.15),
                           (0.07, 0.20)], 3) + [(0, 0.20)], [M['walnut']], segs=64)
    lathe('column', catmull([(0, 0.18), (0.06, 0.18), (0.05, 0.40), (0.04, 1.30), (0.05, 1.36), (0.07, 1.40),
                             (0.05, 1.44)], 3) + [(0, 1.44)], [M['brass']], segs=40)
    sphere('finial', 0.06, (0, 0, 1.70), M['brass'])
    lathe('finial_stem', [(0, 1.44), (0.025, 1.44), (0.02, 1.66), (0, 1.66)], [M['brass']], segs=24)
    tilt = math.radians(9)  # the left pan is winning
    beam = group('beam', (0, 0, 1.47), (0, -tilt, 0))
    slab('beam_bar', catmull([(-0.80, -0.02), (-0.4, -0.03), (0, -0.05), (0.4, -0.03), (0.80, -0.02),
                              (0.80, 0.02), (0.4, 0.04), (0, 0.07), (-0.4, 0.04), (-0.80, 0.02)], 1),
         0.05, [M['brass']], parent=beam, bevel=0.008)
    star('beam_star', 0.075, 0.032, 0.02, M['navy'], parent=beam, loc=(0, -0.03, 0.0))
    for s in (-1, 1):
        sphere('beam_end', 0.04, (s * 0.80, 0, 0), M['brass'], parent=beam)
    for s in (-1, 1):
        # pans hang straight down from the beam ends, wherever the tilt puts them
        ex = s * 0.80 * math.cos(tilt)
        ez = 1.47 + s * 0.80 * math.sin(tilt)
        pan_z = ez - 0.78
        top = (ex, 0, ez - 0.02)
        for k in range(3):
            a = k * TAU / 3 + 0.4
            chain('chain', top, (ex + 0.27 * math.cos(a), 0.27 * math.sin(a), pan_z + 0.09), M['brass'])
        lathe('pan', catmull([(0, pan_z), (0.18, pan_z + 0.005), (0.28, pan_z + 0.05), (0.31, pan_z + 0.10),
                              (0.29, pan_z + 0.10), (0.26, pan_z + 0.06), (0.16, pan_z + 0.03)], 3)
              + [(0, pan_z + 0.025)], [M['brass']], loc=(ex, 0, 0), segs=64)
    # a gold star weight on the heavier pan, a smaller silver one on the other
    lz = 1.47 - 0.80 * math.sin(tilt) - 0.78
    star('weight_l', 0.13, 0.055, 0.06, M['brass'], loc=(-0.80 * math.cos(tilt), 0, lz + 0.155), rot=(0, 0, 0))
    rz = 1.47 + 0.80 * math.sin(tilt) - 0.78
    star('weight_r', 0.09, 0.038, 0.05, M['silver'], loc=(0.80 * math.cos(tilt), 0, rz + 0.12))


def model_chalkboard(M):
    extra2(M)
    b = group('board', (0, 0, 0.0), (math.radians(-8), 0, 0))
    W, H, z0 = 1.6, 1.05, 0.55
    box('slate', (W, 0.04, H), (0, 0, z0 + H / 2), M['slate'], 0.004, parent=b)
    for (sx, sz, x, z) in ((W + 0.12, 0.08, 0, z0 - 0.02), (W + 0.12, 0.08, 0, z0 + H + 0.02),
                           (0.08, H + 0.12, -W / 2 - 0.02, z0 + H / 2), (0.08, H + 0.12, W / 2 + 0.02, z0 + H / 2)):
        box('frame', (sx, 0.09, sz), (x, 0, z), M['walnut'], 0.015, parent=b)
    box('tray', (W - 0.1, 0.16, 0.035), (0, -0.09, z0 - 0.045), M['walnut'], 0.01, parent=b)
    lathe('chalk_stick', [(0, -0.07), (0.016, -0.07), (0.016, 0.07), (0, 0.07)], [M['chalk']], parent=b,
          loc=(0.35, -0.10, z0 - 0.01), rot=(0, math.pi / 2, 0.2), segs=12)
    box('eraser', (0.24, 0.09, 0.07), (-0.45, -0.10, z0 + 0.0), M['navy'], 0.012, parent=b)
    box('eraser_felt', (0.23, 0.085, 0.02), (-0.45, -0.10, z0 - 0.035), M['chalk'], 0.005, parent=b)
    y = -0.022  # just in front of the slate
    # offence: a line of circles; defence: triangles; routes: arrows
    for k, x in enumerate((-0.40, -0.20, 0.0, 0.20, 0.40)):
        lathe('o', [(0.045, -0.006), (0.065, -0.006), (0.065, 0.006), (0.045, 0.006)], [M['chalk']], parent=b,
              loc=(x, y, z0 + 0.30), rot=(math.pi / 2, 0, 0), segs=24, closed=True)
    for x, zz in ((-0.55, 0.62), (-0.15, 0.68), (0.25, 0.68), (0.6, 0.62)):
        slab('tri', [(-0.06, -0.04), (0.06, -0.04), (0.0, 0.06)], 0.012, [M['chalk']], parent=b,
             loc=(x, y, z0 + zz), bevel=0.0)
    routes = (((-0.40, 0.36), (-0.45, 0.62), (-0.70, 0.86)), ((0.40, 0.36), (0.48, 0.60), (0.72, 0.70)),
              ((0.0, 0.36), (0.05, 0.55), (0.30, 0.90)))
    for pts in routes:
        tube('route', [(px, y, z0 + pz) for px, pz in pts], 0.011, M['chalk'], parent=b)
        (ax, az), (bx, bz) = pts[-2], pts[-1]
        ang = math.atan2(bz - az, bx - ax)
        slab('arrow', [(0.0, -0.045), (0.08, 0.0), (0.0, 0.045)], 0.012, [M['chalk']], parent=b,
             loc=(bx, y, z0 + bz), rot=(0, -ang, 0), bevel=0.0)
    # easel legs
    for x in (-0.55, 0.55):
        box('leg', (0.07, 0.07, 1.75), (x, 0.085, 0.86), M['walnut'], 0.012, parent=b)
    box('back_leg', (0.07, 0.07, 1.7), (0, 0.36, 0.80), M['walnut'], 0.012, parent=b, rot=(0.34, 0, 0))


def pot(M, parent, r=0.42, h=0.42, shape='round'):
    """A navy glazed pot with a gold rim and soil, base at z=0; returns the soil height."""
    if shape == 'round':
        prof = catmull([(0, 0), (r * 0.62, 0), (r * 0.8, 0.04), (r * 0.98, h * 0.55), (r, h * 0.9),
                        (r * 1.06, h), (r * 0.93, h)], 3) + [(r * 0.9, h * 0.85), (0, h * 0.85)]
        lathe('pot', prof, [M['navy']], parent=parent, segs=64)
        band('pot_rim', lambda _: r * 1.04, h - 0.035, h + 0.005, M['brass'], out=0.012, parent=parent)
        lathe('soil', [(r * 0.92, h * 0.88), (0, h * 0.9)], [M['soil']], parent=parent, segs=64)
        return h * 0.9
    box('pot', (r * 2.2, r * 1.4, h), (0, 0, h / 2 + 0.05), M['navy'], 0.02, parent=parent, taper=(1.08, 1.1))
    for sx, sy, w, d in ((0, -1, r * 2.42, 0.06), (0, 1, r * 2.42, 0.06), (-1, 0, 0.06, r * 1.58), (1, 0, 0.06, r * 1.58)):
        box('pot_rim', (w, d, 0.04), (sx * (r * 1.21 - 0.03), sy * (r * 0.79 - 0.03), h + 0.05), M['brass'], 0.008,
            parent=parent)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box('pot_foot', (0.09, 0.09, 0.06), (sx * r * 0.85, sy * r * 0.5, 0.03), M['brass'], 0.01,
                parent=parent)
    box('soil', (r * 2.3, r * 1.46, 0.03), (0, 0, h + 0.045), M['soil'], 0.0, parent=parent)
    return h + 0.04


def foliage(name, loc, size, M, parent=None, seed=0):
    """A bonsai foliage pad: a cluster of flattened spheres."""
    import random
    rnd = random.Random(seed)
    for k in range(7):
        dx, dy = rnd.uniform(-1, 1) * size * 0.6, rnd.uniform(-1, 1) * size * 0.45
        dz = rnd.uniform(-0.2, 0.25) * size
        r = size * rnd.uniform(0.38, 0.55)
        sphere(name, r, (loc[0] + dx, loc[1] + dy, loc[2] + dz), M['leaf'], parent=parent, scale=(1.2, 1.1, 0.62))


def model_coaching_tree(M):
    extra2(M)
    g = group('bonsai', (0, 0, 0), (0, 0, math.radians(15)))
    top = pot(M, g, r=0.48, h=0.30, shape='rect')
    # trunk: an S curve built from tubes that thin as they rise
    trunk = [(0.0, 0, top - 0.02), (0.10, 0, top + 0.25), (-0.08, 0.02, top + 0.55), (0.05, 0, top + 0.85),
             (0.0, 0, top + 1.05)]
    for k, rad in enumerate((0.095, 0.075, 0.058, 0.045)):
        tube('trunk', [trunk[k], tuple((a + b) / 2 for a, b in zip(trunk[k], trunk[k + 1])), trunk[k + 1]],
             rad, M['bark'], parent=g)
        sphere('knot', rad, trunk[k + 1], M['bark'], parent=g)
    sphere('root_flare', 0.13, (0, 0, top - 0.02), M['bark'], parent=g, scale=(1.3, 1.1, 0.45))
    branches = (((0.10, 0, top + 0.25), (0.45, 0.02, top + 0.42), 0.035, (0.50, 0.0, top + 0.50), 0.36, 1),
                ((-0.08, 0.02, top + 0.55), (-0.45, 0.0, top + 0.70), 0.03, (-0.50, 0.0, top + 0.78), 0.32, 2),
                ((0.05, 0, top + 0.85), (0.30, -0.05, top + 0.98), 0.025, (0.30, -0.05, top + 1.04), 0.28, 3))
    for a, b, rad, pad, size, seed in branches:
        tube('branch', [a, ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + 0.05), b], rad,
             M['bark'], parent=g)
        foliage('pad', pad, size, M, parent=g, seed=seed)
    foliage('crown', (0.0, 0, top + 1.13), 0.34, M, parent=g, seed=4)
    for x, y in ((0.28, 0.12), (-0.3, -0.1), (0.15, -0.2)):
        sphere('moss', 0.06, (x, y, top + 0.01), M['turf'], parent=g, scale=(1.4, 1.2, 0.35))


def model_seedling(M):
    extra2(M)
    g = group('seedling', (0, 0, 0), (0, 0, math.radians(25)))
    top = pot(M, g, r=0.36, h=0.48)
    tube('stem', [(0, 0, top - 0.02), (0.02, 0, top + 0.25), (-0.02, 0, top + 0.45), (0.0, 0, top + 0.58)],
         0.022, M['leaf'], parent=g)
    leaf = catmull([(0, 0), (0.10, 0.06), (0.22, 0.07), (0.34, 0.03), (0.40, 0.0), (0.33, -0.035),
                    (0.20, -0.05), (0.09, -0.04)], 2)

    def curl(co):
        co.z += 0.5 * co.x * co.x
        co.y += 0.08 * co.x

    for s, z, a in ((1, 0.55, 0.15), (-1, 0.42, 0.25)):
        slab('leaf', leaf, 0.012, [M['leaf']], parent=g, loc=(0, 0, top + z),
             rot=(0, -a, 0 if s > 0 else math.pi), cuts_x=(0.1, 0.2, 0.3), shape=curl, bevel=0.003)
    # a small gold plant tag, blank
    tag = group('tag', (-0.18, -0.12, top - 0.05), (0.12, 0.2, 0.2), g)
    box('tag_stake', (0.025, 0.012, 0.32), (0, 0, 0.12), M['brass'], 0.004, parent=tag)
    box('tag_plate', (0.16, 0.014, 0.10), (0, 0, 0.30), M['brass'], 0.006, parent=tag)


def model_cornerstone(M):
    extra2(M)
    H = 0.95
    box('wall_a', (1.30, 0.32, H), (-0.49, 0, H / 2), M['brick'], 0.01)
    box('wall_b', (0.32, 0.98, H), (0, 0.65, H / 2), M['brick'], 0.01)
    box('cap_a', (1.36, 0.38, 0.07), (-0.49, 0, H + 0.035), M['granite'], 0.012)
    box('cap_b', (0.38, 1.0, 0.07), (0, 0.68, H + 0.035), M['granite'], 0.012)
    box('cornerstone', (0.62, 0.62, 0.42), (-0.14, 0.14, 0.21), M['granite'], 0.015)
    box('stone_plate', (0.30, 0.02, 0.18), (-0.18, -0.172, 0.22), M['plate'], 0.006)
    star('stone_star', 0.06, 0.025, 0.02, M['brass'], loc=(0.172, 0.18, 0.22), rot=(0, 0, math.pi / 2))
    # a brass trowel resting on the cap
    t = group('trowel', (-0.55, -0.02, H + 0.075), (0, 0, math.radians(-20)))
    slab('blade', [(0, -0.13), (0.34, 0.0), (0, 0.13)], 0.012, [M['brass']], parent=t, rot=(math.pi / 2, 0, 0),
         loc=(0, 0, 0.008), bevel=0.003)
    tube('shank', [(0.0, 0, 0.012), (-0.06, 0, 0.09), (-0.12, 0, 0.10)], 0.012, M['iron'], parent=t)
    lathe('trowel_handle', catmull([(0, 0), (0.028, 0), (0.035, 0.08), (0.03, 0.17), (0, 0.18)], 2),
          [M['hickory']], parent=t, loc=(-0.12, 0, 0.10), rot=(0, -math.pi / 2, 0), segs=20)


def model_file_cabinet(M):
    extra2(M)
    W, Dp, H = 0.78, 0.82, 1.55
    g = group('cabinet', (0, 0, 0), (0, 0, math.radians(-8)))
    box('body', (W, Dp, H), (0, 0, H / 2 + 0.04), M['navy'], 0.02, parent=g)
    box('top', (W + 0.05, Dp + 0.05, 0.04), (0, 0, H + 0.06), M['walnut'], 0.012, parent=g)
    box('plinth', (W - 0.04, Dp - 0.04, 0.05), (0, 0, 0.025), M['walnut'], 0.01, parent=g)
    dh = (H - 0.10) / 3
    for k in range(3):
        zc = 0.04 + 0.05 + dh * (k + 0.5)
        pull = 0.42 if k == 2 else 0.0
        d = group('drawer', (0, -pull, zc), (0, 0, 0), g)
        box('front', (W - 0.08, 0.05, dh - 0.05), (0, -Dp / 2 - 0.005, 0), M['navy'], 0.012, parent=d)
        box('label', (0.20, 0.012, 0.075), (0, -Dp / 2 - 0.034, dh * 0.22), M['brass'], 0.004, parent=d)
        box('label_card', (0.17, 0.01, 0.05), (0, -Dp / 2 - 0.04, dh * 0.22), M['paper'], 0.002, parent=d)
        tube('handle', [(-0.12, -Dp / 2 - 0.03, 0.0), (0, -Dp / 2 - 0.09, 0.0), (0.12, -Dp / 2 - 0.03, 0.0)],
             0.016, M['brass'], parent=d)
        if pull:
            # the open drawer's sides and a row of folders
            for sx in (-1, 1):
                box('side', (0.03, 0.62, dh - 0.12), (sx * (W / 2 - 0.07), -Dp / 2 + 0.31, -0.02), M['navy'],
                    0.006, parent=d)
            for i in range(7):
                y = -Dp / 2 + 0.08 + i * 0.075
                col = M['paper'] if i % 2 else M['blueprint']
                box('folder', (W - 0.2, 0.02, dh - 0.10), (0, y, 0.03), col, 0.004, parent=d, rot=(0.12, 0, 0))
                box('tab', (0.14, 0.021, 0.05), (-0.18 + (i % 3) * 0.18, y + 0.006, 0.03 + (dh - 0.10) / 2 + 0.02),
                    col, 0.003, parent=d, rot=(0.12, 0, 0))


def model_binoculars(M):
    """Field binoculars resting on a folded navy strap, objectives toward the camera."""
    extra(M)
    M['leather'] = material('leather', (0.012, 0.008, 0.006), (0.04, 0.026, 0.018), (0.55, 0.75), scale=40.0,
                            detail=8.0, ao=0.5, bump=0.18)
    box('strap', (1.5, 0.22, 0.03), (0.05, 0.42, 0.015), M['navy'], 0.01, rot=(0, 0, 0.25))
    box('strap2', (0.9, 0.22, 0.03), (-0.35, -0.48, 0.015), M['navy'], 0.01, rot=(0, 0, -0.4))
    b = group('binoculars', (0, 0, 0.27), (math.radians(-8), 0, math.radians(-14)))
    # lathe along local z, turned so +z points at the camera (-Y)
    prof = [(0, -0.62), (0.10, -0.62), (0.12, -0.58), (0.12, -0.42), (0.17, -0.34), (0.20, -0.10),
            (0.205, 0.30), (0.23, 0.36), (0.23, 0.52), (0.20, 0.55), (0, 0.55)]
    for x in (-0.25, 0.25):
        tb = group('barrel', (x, 0, 0), (math.pi / 2, 0, 0), b)
        lathe('body', prof, [M['leather']], parent=tb, segs=64, sharp=35)
        band('front_ring', lambda _: 0.23, 0.36, 0.53, M['iron'], out=0.012, parent=tb)
        lathe('objective', [(0, 0.552), (0.19, 0.552)], [M['glass']], parent=tb, segs=64)
        lathe('objective_back', [(0.19, 0.50), (0, 0.50)], [M['blueprint']], parent=tb, segs=64)
        band('eye_ring', lambda _: 0.12, -0.60, -0.45, M['iron'], out=0.02, parent=tb)
        band('trim', lambda _: 0.205, 0.05, 0.09, M['brass'], out=0.008, parent=tb)
    # hinge bridge and focus wheel between the barrels
    for z in (0.12, -0.18):
        box('bridge', (0.36, 0.10, 0.10), (0, z, 0.0), M['iron'], 0.03, parent=b)
    wheel = group('wheel', (0, -0.36, 0.06), (0, math.pi / 2, 0), b)
    lathe('focus', [(0, -0.07), (0.09, -0.07), (0.09, 0.07), (0, 0.07)], [M['brass']], parent=wheel, segs=24,
          sharp=20)
    for x in (-0.25, 0.25):
        sphere('lug', 0.035, (x + (0.21 if x > 0 else -0.21), -0.30, 0.0), M['brass'], parent=b)


def model_globe(M):
    """A desk globe on a brass meridian and walnut base: navy seas, gold graticule, no continents or text."""
    extra(M)
    lathe('base', catmull([(0, 0), (0.62, 0), (0.64, 0.04), (0.58, 0.10), (0.40, 0.14), (0.22, 0.20),
                           (0.14, 0.28)], 3) + [(0, 0.28)], [M['walnut']], segs=96)
    band('base_ring', lambda _: 0.60, 0.02, 0.07, M['brass'], out=0.02)
    lathe('stem', catmull([(0, 0.27), (0.08, 0.27), (0.05, 0.40), (0.07, 0.52), (0.045, 0.62)], 3) + [(0, 0.62)],
          [M['brass']], segs=48)
    R, cz = 0.62, 1.30
    g = group('globe', (0, 0, cz), (0, math.radians(23.4), math.radians(-25)))
    sphere('sea', R, (0, 0, 0), M['blueprint'], parent=g)
    # graticule: parallels and meridians standing just proud of the sea
    for lat in (-60, -30, 0, 30, 60):
        a = math.radians(lat)
        r, z = R * math.cos(a), R * math.sin(a)
        lathe('parallel', [(r + 0.004, z - 0.006), (r + 0.012, z - 0.006), (r + 0.012, z + 0.006),
                           (r + 0.004, z + 0.006)], [M['paint_gold' if lat else 'brass']], parent=g, segs=96,
              closed=True)
    for k in range(6):
        m = group('meridian', (0, 0, 0), (0, 0, k * math.pi / 6), g)
        lathe('meridian_ring', [(R + 0.004, -0.006), (R + 0.012, -0.006), (R + 0.012, 0.006), (R + 0.004, 0.006)],
              [M['paint_gold']], parent=m, segs=96, closed=True, rot=(math.pi / 2, 0, 0))
    # the brass meridian half-ring and axis pins
    mer = group('stand_ring', (0, 0, 0), (0, 0, 0), g)
    pts = [(math.sin(t) * (R + 0.07), 0, math.cos(t) * (R + 0.07)) for t in
           [math.radians(d) for d in range(-10, 191, 20)]]
    tube('half_ring', pts, 0.028, M['brass'], parent=mer)
    for s in (-1, 1):
        lathe('pin', [(0, 0), (0.03, 0), (0.03, 0.09), (0, 0.09)], [M['brass']], parent=g,
              loc=(0, 0, s * (R - 0.01)), rot=(0 if s > 0 else math.pi, 0, 0), segs=16)
    box('cradle', (0.10, 0.10, 0.14), (0, 0, 0.66), M['brass'], 0.02)


MODELS = {
    'hard-hat': model_hard_hat, 'compass': model_compass, 'dumbbell': model_dumbbell,
    'milestone-marker': model_milestone_marker, 'podium': model_podium,
    'balance-scale': model_balance_scale, 'chalkboard': model_chalkboard, 'coaching-tree': model_coaching_tree,
    'seedling': model_seedling, 'cornerstone': model_cornerstone, 'file-cabinet': model_file_cabinet,
    'binoculars': model_binoculars, 'globe': model_globe,
}

if __name__ == '__main__':
    main(MODELS)
