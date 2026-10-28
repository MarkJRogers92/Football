"""Render the Meshy championship trophy for Dynasty Lab.

With --keep-materials the model's own PBR textures are used as shipped (the v0.12.26
image-to-3d trophy has real base colour, metal, roughness and normal maps). Otherwise
the GLB is treated as one grey material and this script re-shades it: the baked texture is
multiplied into a gold metal response (keeping the lace and panel detail), and the
faces below the plinth line get a polished dark stone material. Renders a hero still
or a 360-degree turntable with a transparent background.

Usage:
  Blender --background --python tools/render-meshy-trophy.py -- --glb t.glb --still out.png
  Blender --background --python tools/render-meshy-trophy.py -- --glb t.glb --frames DIR --count 36 --size 320x480
  python3 tools/render-meshy-trophy.py -- --glb t.glb --keep-materials --engine CYCLES --frames DIR --count 96
  (the second form runs under the `bpy` pip module; --yaw turns the model so its front faces frame 0)
"""
import bpy, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default

GLB = arg('--glb')
STILL = arg('--still')
FRAME_DIR = arg('--frames')
SIZE = arg('--size', '320x480')
COUNT = int(arg('--count', '36'))
W, H = (int(v) for v in SIZE.lower().split('x'))
HEIGHT = float(arg('--height', '2.3'))
# local z (normalised -HEIGHT/2 .. HEIGHT/2) below which faces are plinth stone
PLINTH_Z = float(arg('--plinth-z', '-0.62'))
GOLD_TINT = [float(v) for v in arg('--gold', '1.0,0.74,0.30').split(',')]
KEEP_MATERIALS = '--keep-materials' in argv
ENGINE = arg('--engine')
YAW = math.radians(float(arg('--yaw', '0')))

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
engines = {item.identifier for item in scene.render.bl_rna.properties['engine'].enum_items}
if ENGINE == 'CYCLES':
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = int(arg('--samples', '96'))
    scene.cycles.use_denoising = True
else:
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in engines else 'BLENDER_EEVEE'
    scene.eevee.taa_render_samples = 128
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
try:
    scene.view_settings.look = 'AgX - Punchy'
except TypeError:
    pass
scene.view_settings.exposure = float(arg('--exposure', '0.55'))

bpy.ops.import_scene.gltf(filepath=GLB)
meshes = [o for o in scene.objects if o.type == 'MESH']
if not meshes:
    raise SystemExit('no meshes imported from %s' % GLB)
obj = meshes[0]

lo = Vector((min((obj.matrix_world @ v.co).x for v in obj.data.vertices),
             min((obj.matrix_world @ v.co).y for v in obj.data.vertices),
             min((obj.matrix_world @ v.co).z for v in obj.data.vertices)))
hi = Vector((max((obj.matrix_world @ v.co).x for v in obj.data.vertices),
             max((obj.matrix_world @ v.co).y for v in obj.data.vertices),
             max((obj.matrix_world @ v.co).z for v in obj.data.vertices)))
scale = HEIGHT / max(hi.z - lo.z, 1e-6)

root = bpy.data.objects.new('Trophy', None)
scene.collection.objects.link(root)
obj.parent = root
root.scale = (scale, scale, scale)
root.location = (-(lo.x + hi.x) * 0.5 * scale, -(lo.y + hi.y) * 0.5 * scale,
                 -lo.z * scale)

# --- materials -------------------------------------------------------------------
def reshade():
    src = obj.data.materials[0]
    base_tex = None
    if src and src.use_nodes:
        for node in src.node_tree.nodes:
            if node.type == 'TEX_IMAGE' and node.image:
                base_tex = node.image
                break

    gold = bpy.data.materials.new('TrophyGold')
    gold.use_nodes = True
    nt = gold.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Metallic'].default_value = 1.0
    bsdf.inputs['Roughness'].default_value = 0.26
    if base_tex:
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = base_tex
        tex.location = (-700, 200)
        mix = nt.nodes.new('ShaderNodeMixRGB')
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Fac'].default_value = 1.0
        mix.inputs['Color2'].default_value = (*GOLD_TINT, 1)
        mix.location = (-400, 200)
        nt.links.new(tex.outputs['Color'], mix.inputs['Color1'])
        nt.links.new(mix.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (*GOLD_TINT, 1)

    stone = bpy.data.materials.new('PlinthStone')
    stone.use_nodes = True
    sb = stone.node_tree.nodes['Principled BSDF']
    sb.inputs['Base Color'].default_value = (0.015, 0.016, 0.019, 1)
    sb.inputs['Metallic'].default_value = 0.35
    sb.inputs['Roughness'].default_value = 0.17

    obj.data.materials.clear()
    obj.data.materials.append(gold)
    obj.data.materials.append(stone)
    for poly in obj.data.polygons:
        centre = obj.matrix_world @ poly.center
        poly.material_index = 1 if (centre.z / scale) < PLINTH_Z else 0
        poly.use_smooth = True

if KEEP_MATERIALS:
    for poly in obj.data.polygons:
        poly.use_smooth = True
else:
    reshade()

# --- lights ----------------------------------------------------------------------
def area(name, location, energy, size_, color, target=(0, 0, HEIGHT * 0.52)):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.size = size_
    data.color = color
    o = bpy.data.objects.new(name, data)
    o.location = location
    scene.collection.objects.link(o)
    o.rotation_euler = (Vector(target) - Vector(location)).to_track_quat('-Z', 'Y').to_euler()
    return o

area('Key', (-2.4, -3.2, 3.2), 900, 2.6, (1.0, 0.90, 0.74))
area('Rim', (3.0, 2.2, 2.6), 1500, 2.2, (0.62, 0.80, 1.0))
area('Fill', (2.6, -2.6, 1.0), 140, 2.6, (1.0, 0.95, 0.9))
area('Top', (0, 0.4, 4.6), 320, 2.0, (1.0, 0.97, 0.9), target=(0, 0, HEIGHT * 0.7))

world = bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.03, 0.035, 0.045, 1)
bg.inputs['Strength'].default_value = 0.45

cam_data = bpy.data.cameras.new('Camera')
cam_data.lens = 80
cam = bpy.data.objects.new('Camera', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam.location = (0, -6.35, HEIGHT * 0.54)
cam.rotation_euler = (Vector((0, 0, HEIGHT * 0.50)) - cam.location).to_track_quat('-Z', 'Y').to_euler()

def render_to(path):
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

root.rotation_euler = (0, 0, YAW)
if STILL:
    scene.render.resolution_x, scene.render.resolution_y = 640, 960
    render_to(STILL)

if FRAME_DIR:
    scene.render.resolution_x, scene.render.resolution_y = W, H
    for i in range(COUNT):
        root.rotation_euler = (0, 0, YAW + math.tau * i / COUNT)
        render_to(os.path.join(FRAME_DIR, 'frame_%03d.png' % i))
    root.rotation_euler = (0, 0, YAW)
