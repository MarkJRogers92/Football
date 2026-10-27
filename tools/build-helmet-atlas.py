#!/usr/bin/env python3
"""Builds assets/team-helmets-meshy-atlas-128.webp: one recolored helmet per team.

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
MIN_TRIM_AREA = 500  # px at source scale; below this a gold region is crackle, not facemask
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
    ratio = (np.maximum(L / ref, .5) ** .7)[..., None]
    dark = base * np.minimum(ratio, 1)
    light = base + (1 - base) * np.clip(ratio - 1, 0, 1.2) * .4
    out = np.where(ratio <= 1, dark, light)
    return rgb * (1 - w[..., None]) + np.clip(out, 0, 1) * w[..., None]

def components(mask):
    """8-connected component labels and sizes for a boolean mask (no scipy dependency)."""
    labels = np.zeros(mask.shape, int); sizes = [0]; H, W = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if labels[y0, x0]: continue
        n = len(sizes); stack = [(y0, x0)]; labels[y0, x0] = n; count = 0
        while stack:
            y, x = stack.pop(); count += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not labels[yy, xx]:
                        labels[yy, xx] = n; stack.append((yy, xx))
        sizes.append(count)
    return labels, np.array(sizes)

def prepare(src):
    """Team-independent work: scrub brand marks, then split shell/trim weights."""
    rgb = src[..., :3].copy(); h, s, v = rgb_to_hsv(rgb)
    # The generated model carries a small red brand mark on the facemask bumper; turn it neutral.
    red = ((h < 18) | (h > 340)) & (s > .35) & (v > .25)
    rgb[red] = np.repeat(lum(rgb[red])[:, None], 3, 1) * 1.05
    h, s, v = rgb_to_hsv(rgb)
    color = smooth(s, .28, .5) * smooth(v, .03, .09)
    w_shell = color * (smooth(h, 170, 205) * (1 - smooth(h, 270, 300)))
    w_trim = color * (smooth(h, 25, 38) * (1 - smooth(h, 65, 80)))
    # Trim is the facemask and a few large strips. Small gold fragments are texture crackle on the shell.
    labels, sizes = components(w_trim > .3)
    small = (sizes[labels] < MIN_TRIM_AREA) & (labels > 0)
    w_shell = np.where(small, np.maximum(w_shell, color), w_shell); w_trim = np.where(small, 0, w_trim)
    return np.dstack([rgb, src[..., 3]]), w_shell, w_trim

def recolor(src, w_shell, w_trim, primary, secondary, shell_ref, trim_ref):
    rgb = src[..., :3]; alpha = src[..., 3]; L = lum(rgb)
    out = tint(rgb, w_shell, primary, shell_ref, L)
    out = tint(out, w_trim, secondary, trim_ref, L)
    return np.dstack([out, alpha])

def main():
    src_path = sys.argv[1]; out_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(root, 'assets', 'team-helmets-meshy-atlas-128.webp')
    img = Image.open(src_path).convert('RGBA'); img = img.crop(img.getchannel('A').getbbox())
    side = max(img.size); canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, side - img.height)); img = canvas
    src, w_shell, w_trim = prepare(np.asarray(img, float) / 255)
    L = lum(src[..., :3]); lit = (src[..., 3] > .5) & (rgb_to_hsv(src[..., :3])[2] > .2)  # references exclude deep shadow
    shell_ref = np.median(L[lit & (w_shell > .8)]); trim_ref = np.median(L[lit & (w_trim > .8)])
    teams = sorted(json.load(open(os.path.join(root, 'team-colors.json'))), key=lambda t: t['id'])
    assert [t['id'] for t in teams] == list(range(1, 121)), 'team-colors.json must hold ids 1-120'
    atlas = Image.new('RGBA', (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    for t in teams:
        out = recolor(src, w_shell, w_trim, hex_rgb(t['primary']), hex_rgb(t['secondary']), shell_ref, trim_ref)
        tile = Image.fromarray((out * 255).astype(np.uint8), 'RGBA').resize((CELL, CELL), Image.LANCZOS)
        i = t['id'] - 1; atlas.paste(tile, ((i % COLS) * CELL, (i // COLS) * CELL))
    # Lossy WebP keeps smooth gradients (a 256-colour PNG posterizes 120 hues) at a fraction of PNG size.
    atlas.save(out_path, 'WEBP', quality=90, method=6)
    print(f'wrote {out_path} {atlas.size} ({os.path.getsize(out_path) // 1024} KB)')

if __name__ == '__main__': main()
