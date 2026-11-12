"""Shared helpers for the Blender art scripts: modelling primitives, materials, the
walnut plinth, and a renderer matching the art pack (see tools/blender/README.md)."""
import argparse
import math
import os

import bpy  # must load before bmesh
import bmesh
from mathutils import Vector

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


def frame_and_light(yaw=35, pitch=24, fov=22, spin=False):
    """Normalise the model to a 2-unit box at the origin, then place lights and camera like render.html.

    With spin=True the model is centred on a vertical axis and framed for every angle of a full turn;
    rotate the returned empty about Z to turn it."""
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
    if spin:
        # the widest the model gets as it turns about its centre line, and its height
        rh = max(math.hypot(q.x - c.x, q.y - c.y) for q in pts)
        s = 2 / max(2 * rh, size.z)
        centre = link(D.objects.new('centre', None))
        centre.location = -c
        for o in roots:
            o.parent = centre
        rig = link(D.objects.new('rig', None))
        centre.parent = rig
        rig.scale = (s, s, s)
        radius = math.hypot(rh * s, size.z * s / 2)
    else:
        rig = D.objects.new('rig', None)
        link(rig)
        for o in roots:
            o.parent = rig
        s = 2 / max(size)
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
    return rig


def main(models, prefix=''):
    """Render each model to <png-dir>/<prefix><name>.png and assets/awards/<prefix><name>.webp."""
    ap = argparse.ArgumentParser()
    ap.add_argument('names', nargs='*', default=list(models))
    ap.add_argument('--samples', type=int, default=128)
    ap.add_argument('--size', type=int, default=512)
    ap.add_argument('--png-dir', default=os.path.join(ROOT, 'tools', 'blender', 'out'))
    ap.add_argument('--no-webp', action='store_true')
    a = ap.parse_args()
    os.makedirs(a.png_dir, exist_ok=True)
    for name in a.names:
        reset()
        M = build_materials()
        models[name](M)
        setup_render(a.samples, a.size)
        frame_and_light()
        png = os.path.join(a.png_dir, f'{prefix}{name}.png')
        bpy.context.scene.render.filepath = png
        bpy.ops.render.render(write_still=True)
        print('rendered', png, flush=True)
        if not a.no_webp:
            from PIL import Image
            im = Image.open(png).convert('RGBA').resize((256, 256), Image.LANCZOS)
            out = os.path.join(ROOT, 'assets', 'awards', f'{prefix}{name}.webp')
            im.save(out, 'WEBP', quality=82, method=6)
            print('wrote', out, flush=True)
