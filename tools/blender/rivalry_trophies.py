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
import argparse
import math
import os
import sys

import bpy  # must load before bmesh
import bmesh
from mathutils import Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D = bpy.data
TAU = math.tau


# ---------------------------------------------------------------- scene utils
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def link(ob, parent=None):
    bpy.context.scene.collection.objects.link(ob)
    if parent is not None:
        ob.parent = parent
    return ob


def group(name, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    e = D.objects.new(name, None)
    e.location = loc
    e.rotation_euler = rot
    return link(e, parent)


def finish(name, bm, mats, parent=None, loc=(0, 0, 0), rot=(0, 0, 0),
           sharp=35, bevel=0.0, segs=3):
    me = D.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
    if sharp:
        me.set_sharp_from_angle(angle=math.radians(sharp))
    ob = D.objects.new(name, me)
    ob.location = loc
    ob.rotation_euler = rot
    link(ob, parent)
    if bevel:
        b = ob.modifiers.new('bevel', 'BEVEL')
        b.width = bevel
        b.segments = segs
        b.limit_method = 'ANGLE'
        b.harden_normals = True
    return ob


def box(name, size, loc, mat, bevel=0.02, parent=None, rot=(0, 0, 0), taper=None):
    """Box centred at loc; taper=(sx, sy) scales the top face."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
        if taper and v.co.z > 0:
            v.co.x *= taper[0]
            v.co.y *= taper[1]
    return finish(name, bm, [mat], parent, loc, rot, sharp=30, bevel=bevel)


def catmull(pts, n=4):
    """Smooth an open polyline, keeping its end points."""
    out = []
    P = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = (Vector(P[i - 1]), Vector(P[i]), Vector(P[i + 1]), Vector(P[i + 2]))
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                                    + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)))
    out.append(tuple(pts[-1]))
    return out


def resample(pts, step):
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        a, b = Vector(a), Vector(b)
        n = max(1, int(math.ceil((b - a).length / step)))
        for k in range(1, n + 1):
            out.append(tuple(a.lerp(b, k / n)))
    return out


def lathe(name, prof, mats, segs=64, parent=None, loc=(0, 0, 0), rot=(0, 0, 0),
          matfn=None, closed=False, sharp=40):
    """Revolve (r, z) points about Z. Walk the profile with the solid on the left."""
    bm = bmesh.new()
    rings = []
    for r, z in prof:
        if r < 1e-6:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(TAU * i / segs), r * math.sin(TAU * i / segs), z))
                          for i in range(segs)])
    pairs = list(zip(rings, rings[1:]))
    if closed:
        pairs.append((rings[-1], rings[0]))
    for a, b in pairs:
        for i in range(segs):
            j = (i + 1) % segs
            if len(a) == 1 and len(b) == 1:
                continue
            if len(a) == 1:
                vs = (a[0], b[j], b[i])
            elif len(b) == 1:
                vs = (a[i], a[j], b[0])
            else:
                vs = (a[i], a[j], b[j], b[i])
            f = bm.faces.new(vs)
            if matfn:
                f.material_index = matfn(f.calc_center_median())
    return finish(name, bm, mats, parent, loc, rot, sharp=sharp)


def band(name, prof_r, z0, z1, mat, out=0.02, parent=None, segs=64):
    """A hoop hugging a lathed body whose radius at z is prof_r(z)."""
    r0, r1 = prof_r(z0), prof_r(z1)
    p = [(r0 - 0.01, z0), (r0 + out * 0.8, z0), (r0 + out, z0 + 0.008),
         (r1 + out, z1 - 0.008), (r1 + out * 0.8, z1), (r1 - 0.01, z1)]
    return lathe(name, p, [mat], segs, parent, sharp=60)


def slab(name, poly, thick, mats, parent=None, loc=(0, 0, 0), rot=(0, 0, 0),
         cuts_x=(), cuts_z=(), shape=None, matfn=None, bevel=0.01):
    """Extrude a CCW (x, z) polygon along Y, centred on y=0."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, -thick / 2, z)) for x, z in poly]
    f = bm.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    moved = [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=moved, vec=(0, thick, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for x in cuts_x:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                               plane_co=(x, 0, 0), plane_no=(1, 0, 0))
    for z in cuts_z:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                               plane_co=(0, 0, z), plane_no=(0, 0, 1))
    if shape:
        for v in bm.verts:
            shape(v.co)
    if matfn:
        for f in bm.faces:
            f.material_index = matfn(f.calc_center_median())
    return finish(name, bm, mats, parent, loc, rot, sharp=30, bevel=bevel, segs=2)


def tube(name, pts, radius, mat, parent=None):
    cu = D.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 6
    cu.use_fill_caps = True
    sp = cu.splines.new('NURBS')
    sp.points.add(len(pts) - 1)
    for p, co in zip(sp.points, pts):
        p.co = (*co, 1.0)
    sp.order_u = 3
    sp.use_endpoint_u = True
    sp.resolution_u = 24
    sp.use_smooth = True
    cu.materials.append(mat)
    return link(D.objects.new(name, cu), parent)


def sphere(name, r, loc, mat, parent=None, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=r)
    for v in bm.verts:
        v.co.x *= scale[0]
        v.co.y *= scale[1]
        v.co.z *= scale[2]
    return finish(name, bm, [mat], parent, loc, sharp=0)


def star(name, r_out, r_in, thick, mat, parent=None, loc=(0, 0, 0), rot=(0, 0, 0)):
    pts = []
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5
        r = r_out if i % 2 == 0 else r_in
        pts.append((r * math.cos(a), r * math.sin(a)))
    return slab(name, pts, thick, [mat], parent, loc, rot, bevel=0.006)


# ------------------------------------------------------------------ materials
def _n(nt, kind, **kw):
    n = nt.nodes.new(kind)
    for k, v in kw.items():
        setattr(n, k, v)
    return n


def material(name, dark, light, rough=(0.45, 0.6), metal=0.0, pattern='noise', scale=6.0,
             detail=4.0, distortion=0.0, ao=0.45, bump=0.15, staves=0, coat=0.0, band_dir='X'):
    m = D.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    L = nt.links
    bsdf = nt.nodes['Principled BSDF']
    tc = _n(nt, 'ShaderNodeTexCoord')
    if pattern == 'wood':
        tex = _n(nt, 'ShaderNodeTexWave', wave_type='BANDS', bands_direction=band_dir)
        tex.inputs['Scale'].default_value = scale
        tex.inputs['Distortion'].default_value = distortion or 6.0
        tex.inputs['Detail'].default_value = detail
        tex.inputs['Detail Scale'].default_value = 1.5
    else:
        tex = _n(nt, 'ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = scale
        tex.inputs['Detail'].default_value = detail
    L.new(tc.outputs['Object'], tex.inputs['Vector'])
    ramp = _n(nt, 'ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*dark, 1)
    ramp.color_ramp.elements[1].color = (*light, 1)
    if pattern == 'noise':
        ramp.color_ramp.elements[0].position = 0.3
        ramp.color_ramp.elements[1].position = 0.7
    L.new(tex.outputs['Fac'], ramp.inputs['Fac'])
    color = ramp.outputs['Color']
    height = tex.outputs['Fac']
    if staves:
        sep = _n(nt, 'ShaderNodeSeparateXYZ')
        L.new(tc.outputs['Object'], sep.inputs[0])
        at = _n(nt, 'ShaderNodeMath', operation='ARCTAN2')
        L.new(sep.outputs['Y'], at.inputs[0])
        L.new(sep.outputs['X'], at.inputs[1])
        mul = _n(nt, 'ShaderNodeMath', operation='MULTIPLY')
        mul.inputs[1].default_value = staves / TAU
        L.new(at.outputs[0], mul.inputs[0])
        fr = _n(nt, 'ShaderNodeMath', operation='FRACT')
        L.new(mul.outputs[0], fr.inputs[0])
        sub = _n(nt, 'ShaderNodeMath', operation='SUBTRACT')
        sub.inputs[1].default_value = 0.5
        L.new(fr.outputs[0], sub.inputs[0])
        ab = _n(nt, 'ShaderNodeMath', operation='ABSOLUTE')
        L.new(sub.outputs[0], ab.inputs[0])
        seam = _n(nt, 'ShaderNodeMapRange', interpolation_type='SMOOTHSTEP')
        seam.inputs['From Min'].default_value = 0.44
        seam.inputs['From Max'].default_value = 0.5
        L.new(ab.outputs[0], seam.inputs['Value'])
        dim = _n(nt, 'ShaderNodeMapRange')
        dim.inputs['To Min'].default_value = 1.0
        dim.inputs['To Max'].default_value = 0.35
        L.new(seam.outputs[0], dim.inputs['Value'])
        sc = _n(nt, 'ShaderNodeVectorMath', operation='SCALE')
        L.new(color, sc.inputs[0])
        L.new(dim.outputs[0], sc.inputs['Scale'])
        color = sc.outputs['Vector']
        h2 = _n(nt, 'ShaderNodeMath', operation='SUBTRACT')
        L.new(height, h2.inputs[0])
        L.new(seam.outputs[0], h2.inputs[1])
        height = h2.outputs[0]
    if ao:
        aon = _n(nt, 'ShaderNodeAmbientOcclusion', samples=8)
        aon.inputs['Distance'].default_value = 0.15
        mr = _n(nt, 'ShaderNodeMapRange')
        mr.inputs['To Min'].default_value = 1.0 - ao
        L.new(aon.outputs['AO'], mr.inputs['Value'])
        sc = _n(nt, 'ShaderNodeVectorMath', operation='SCALE')
        L.new(color, sc.inputs[0])
        L.new(mr.outputs[0], sc.inputs['Scale'])
        color = sc.outputs['Vector']
    L.new(color, bsdf.inputs['Base Color'])
    rr = _n(nt, 'ShaderNodeMapRange')
    rr.inputs['To Min'].default_value = rough[0]
    rr.inputs['To Max'].default_value = rough[1]
    L.new(tex.outputs['Fac'], rr.inputs['Value'])
    L.new(rr.outputs[0], bsdf.inputs['Roughness'])
    bsdf.inputs['Metallic'].default_value = metal
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = 0.15
    if bump:
        bp = _n(nt, 'ShaderNodeBump')
        bp.inputs['Strength'].default_value = bump
        bp.inputs['Distance'].default_value = 0.02
        L.new(height, bp.inputs['Height'])
        L.new(bp.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def build_materials():
    return {
        'walnut': material('walnut', (0.05, 0.016, 0.006), (0.105, 0.038, 0.013), (0.3, 0.45),
                           pattern='wood', scale=2.2, distortion=9.0, detail=8.0, bump=0.02, coat=0.45),
        'hickory': material('hickory', (0.26, 0.12, 0.045), (0.46, 0.24, 0.10), (0.45, 0.6),
                            pattern='wood', scale=14.0, distortion=2.0, bump=0.03, band_dir='X'),
        'oak': material('oak', (0.085, 0.036, 0.012), (0.17, 0.08, 0.03), (0.45, 0.65),
                        pattern='wood', scale=2.5, distortion=10.0, detail=8.0, staves=18, bump=0.25,
                        band_dir='X'),
        'oak_lid': material('oak_lid', (0.16, 0.07, 0.025), (0.36, 0.17, 0.06), (0.5, 0.7),
                            pattern='wood', scale=4.0, bump=0.1, band_dir='Y'),
        'brass': material('brass', (0.42, 0.24, 0.06), (0.85, 0.58, 0.22), (0.18, 0.38), metal=1.0,
                          scale=4.0, ao=0.55, bump=0.05),
        'plate': material('plate', (0.6, 0.42, 0.14), (0.82, 0.6, 0.25), (0.22, 0.3), metal=1.0,
                          scale=8.0, ao=0.2, bump=0.0),
        'bronze': material('bronze', (0.30, 0.15, 0.05), (0.70, 0.42, 0.17), (0.25, 0.45), metal=1.0,
                           scale=5.0, ao=0.6, bump=0.08),
        'iron': material('iron', (0.035, 0.035, 0.04), (0.11, 0.105, 0.105), (0.45, 0.7), metal=0.85,
                         scale=7.0, ao=0.5, bump=0.12),
        'steel': material('steel', (0.45, 0.46, 0.48), (0.75, 0.76, 0.78), (0.15, 0.3), metal=1.0,
                          scale=10.0, ao=0.3, bump=0.02),
        'navy': material('navy', (0.012, 0.025, 0.09), (0.025, 0.05, 0.16), (0.35, 0.5),
                         scale=6.0, ao=0.4, bump=0.03, coat=0.3),
        'glaze_brown': material('glaze_brown', (0.07, 0.025, 0.008), (0.20, 0.08, 0.025), (0.12, 0.25),
                                scale=3.0, ao=0.4, bump=0.02, coat=0.8),
        'glaze_cream': material('glaze_cream', (0.55, 0.42, 0.24), (0.80, 0.68, 0.45), (0.15, 0.3),
                                scale=3.0, ao=0.4, bump=0.02, coat=0.8),
        'cork': material('cork', (0.25, 0.14, 0.06), (0.45, 0.28, 0.13), (0.8, 0.95), scale=40.0,
                         bump=0.4),
        'turf': material('turf', (0.012, 0.05, 0.01), (0.04, 0.16, 0.025), (0.7, 0.9), scale=60.0,
                         detail=8.0, bump=0.6),
    }


# --------------------------------------------------------------------- plinth
def plinth(M, w=1.7, d=1.25):
    box('plinth_lo', (w, d, 0.26), (0, 0, 0.13), M['walnut'], 0.035)
    box('plinth_hi', (w * 0.84, d * 0.82, 0.18), (0, 0, 0.35), M['walnut'], 0.03)
    box('plate', (w * 0.4, 0.025, 0.12), (0, -d / 2 - 0.004, 0.13), M['plate'], 0.008)
    return 0.44


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


# --------------------------------------------------------------------- render
def setup_render(samples, size):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = size
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'AgX'
    try:
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError:
        pass
    sc.view_settings.exposure = 0.15
    w = D.worlds.new('world')
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Generated'], sep.inputs[0])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    cr.elements[0].position, cr.elements[0].color = 0.0, (0.03, 0.03, 0.04, 1)
    cr.elements[1].position, cr.elements[1].color = 1.0, (0.30, 0.34, 0.42, 1)
    e = cr.elements.new(0.5)
    e.color = (0.10, 0.09, 0.08, 1)
    e = cr.elements.new(0.56)
    e.color = (0.85, 0.80, 0.72, 1)
    e = cr.elements.new(0.66)
    e.color = (0.45, 0.45, 0.48, 1)
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = -1
    nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
    nt.links.new(mr.outputs[0], ramp.inputs['Fac'])
    bg = nt.nodes['Background']
    bg.inputs['Strength'].default_value = 0.9
    nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])


def add_light(name, loc, energy, color, size):
    li = D.lights.new(name, 'AREA')
    li.energy = energy
    li.color = color
    li.size = size
    ob = link(D.objects.new(name, li))
    ob.location = loc
    ob.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()


def frame_and_light(yaw=35, pitch=24, fov=22):
    """Normalise the model to a 2-unit box at the origin, then place lights and camera like render.html."""
    sc = bpy.context.scene
    dg = bpy.context.evaluated_depsgraph_get()
    roots = [o for o in sc.objects if o.parent is None and o.type in {'MESH', 'CURVE', 'EMPTY'}]
    pts = []
    for o in sc.objects:
        if o.type in {'MESH', 'CURVE'}:
            ev = o.evaluated_get(dg)
            me = ev.to_mesh()  # exact vertices: bound_box is loose for curves and rotated parts
            pts += [ev.matrix_world @ v.co for v in me.vertices]
            ev.to_mesh_clear()
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    c, size = (lo + hi) / 2, hi - lo
    s = 2 / max(size)
    rig = D.objects.new('rig', None)
    link(rig)
    for o in roots:
        o.parent = rig
    rig.scale = (s, s, s)
    rig.location = -c * s
    radius = (size * s).length / 2
    y, p = math.radians(yaw), math.radians(pitch)
    d = Vector((math.cos(p) * math.sin(y), -math.cos(p) * math.cos(y), math.sin(p)))
    cam_d = D.cameras.new('cam')
    cam_d.angle = math.radians(fov)
    cam = link(D.objects.new('cam', cam_d))
    cam.location = d * (radius / math.sin(math.radians(fov) / 2) * 0.92)
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    add_light('key', (3.6, -4.8, 6.0), 1400, (1.0, 0.91, 0.78), 3.5)
    add_light('rim', (-4.8, 3.6, 3.6), 900, (0.75, 0.83, 1.0), 3.0)
    add_light('fill', (-3.0, -5.5, 1.2), 300, (1.0, 0.95, 0.9), 4.0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('names', nargs='*', default=list(MODELS))
    ap.add_argument('--samples', type=int, default=96)
    ap.add_argument('--size', type=int, default=512)
    ap.add_argument('--png-dir', default=os.path.join(ROOT, 'tools', 'blender', 'out'))
    ap.add_argument('--no-webp', action='store_true')
    a = ap.parse_args()
    os.makedirs(a.png_dir, exist_ok=True)
    for name in a.names:
        reset()
        M = build_materials()
        MODELS[name](M)
        setup_render(a.samples, a.size)
        frame_and_light()
        png = os.path.join(a.png_dir, f'rivalry-{name}.png')
        bpy.context.scene.render.filepath = png
        bpy.ops.render.render(write_still=True)
        print('rendered', png, flush=True)
        if not a.no_webp:
            from PIL import Image
            im = Image.open(png).convert('RGBA').resize((256, 256), Image.LANCZOS)
            out = os.path.join(ROOT, 'assets', 'awards', f'rivalry-{name}.webp')
            im.save(out, 'WEBP', quality=82, method=6)
            print('wrote', out, flush=True)


if __name__ == '__main__':
    main()
