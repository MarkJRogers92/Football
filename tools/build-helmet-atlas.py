#!/usr/bin/env python3
"""Builds assets/team-helmets-meshy-atlas-128.png: one recolored helmet per team.

Input: a transparent side-profile helmet render (navy shell, gold trim) and team-colors.json.
Shell pixels take `primary`, trim pixels take `secondary`; neutrals (chrome, white strap,
specular highlights) keep their own shading. Layout matches team-logos-atlas-32.png:
row-major by team id, 12 columns x 10 rows. The team logo is overlaid in the DOM, not baked in.
Usage: python3 tools/build-helmet-atlas.py <helmet_side.png> [out.png]
"""
import json, sys, os
import numpy as np
from PIL import Image

CELL, COLS, ROWS = 128, 12, 10
root = os.path.join(os.path.dirname(__file__), '..')

def hex_rgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], float) / 255

def rgb_to_hsv(a):
    mx, mn = a.max(-1), a.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = d > 1e-6
    h = np.where(m & (mx == r), ((g - b) / np.where(m, d, 1)) % 6, h)
    h = np.where(m & (mx == g), (b - r) / np.where(m, d, 1) + 2, h)
    h = np.where(m & (mx == b), (r - g) / np.where(m, d, 1) + 4, h)
    return h * 60, np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0), mx

def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def lum(a): return a @ np.array([.2126, .7152, .0722])

def tint(rgb, w, base, ref, L):
    ratio = (np.maximum(L / ref, .4) ** .8)[..., None]
    dark = base * np.minimum(ratio, 1)
    light = base + (1 - base) * np.clip(ratio - 1, 0, 1.2) * .55
    out = np.where(ratio <= 1, dark, light)
    return rgb * (1 - w[..., None]) + np.clip(out, 0, 1) * w[..., None]

def recolor(src, primary, secondary, shell_ref, trim_ref):
    rgb = src[..., :3]; alpha = src[..., 3]
    h, s, v = rgb_to_hsv(rgb); L = lum(rgb)
    color = smooth(s, .28, .5) * smooth(v, .03, .09)
    w_shell = color * (smooth(h, 170, 205) * (1 - smooth(h, 270, 300)))
    w_trim = color * (smooth(h, 25, 38) * (1 - smooth(h, 65, 80)))
    out = tint(rgb, w_shell, primary, shell_ref, L)
    out = tint(out, w_trim, secondary, trim_ref, L)
    return np.dstack([out, alpha])

def main():
    src_path = sys.argv[1]; out_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(root, 'assets', 'team-helmets-meshy-atlas-128.png')
    img = Image.open(src_path).convert('RGBA'); img = img.crop(img.getchannel('A').getbbox())
    side = max(img.size); canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, side - img.height)); img = canvas
    src = np.asarray(img, float) / 255
    h, s, v = rgb_to_hsv(src[..., :3]); L = lum(src[..., :3]); a = src[..., 3] > .5
    color = a & (s > .4) & (v > .2)
    shell = color & (h > 200) & (h < 260); trim = color & (h > 35) & (h < 70)
    shell_ref, trim_ref = np.median(L[shell]), np.median(L[trim])
    teams = sorted(json.load(open(os.path.join(root, 'team-colors.json'))), key=lambda t: t['id'])
    assert [t['id'] for t in teams] == list(range(1, 121)), 'team-colors.json must hold ids 1-120'
    atlas = Image.new('RGBA', (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    for t in teams:
        out = recolor(src, hex_rgb(t['primary']), hex_rgb(t['secondary']), shell_ref, trim_ref)
        tile = Image.fromarray((out * 255).astype(np.uint8), 'RGBA').resize((CELL, CELL), Image.LANCZOS)
        i = t['id'] - 1; atlas.paste(tile, ((i % COLS) * CELL, (i // COLS) * CELL))
    # 256-colour palette keeps the 120-helmet atlas near 0.5 MB with no visible banding at UI sizes.
    atlas = atlas.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG)
    atlas.save(out_path, optimize=True)
    print(f'wrote {out_path} {atlas.size} ({os.path.getsize(out_path) // 1024} KB)')

if __name__ == '__main__': main()
