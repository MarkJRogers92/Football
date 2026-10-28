"""Pack rendered trophy turntable frames into the title-screen sprite sheet.

Frames are laid out row-major (frame 0 top-left), matching the reel/sheet stepping in polish.css.

Usage:
  python3 tools/build-trophy-sheet.py FRAME_DIR assets/trophy-turn-v3.webp --cols 12 --quality 82
"""
import argparse, glob, os
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('frames')
ap.add_argument('out')
ap.add_argument('--cols', type=int, default=12)
ap.add_argument('--quality', type=int, default=82)
a = ap.parse_args()

paths = sorted(glob.glob(os.path.join(a.frames, 'frame_*.png')))
if not paths:
    raise SystemExit('no frames in %s' % a.frames)
first = Image.open(paths[0])
w, h = first.size
rows = -(-len(paths) // a.cols)
if len(paths) != rows * a.cols:
    raise SystemExit('%d frames do not fill %d columns' % (len(paths), a.cols))
sheet = Image.new('RGBA', (w * a.cols, h * rows), (0, 0, 0, 0))
for i, p in enumerate(paths):
    sheet.paste(Image.open(p).convert('RGBA'), ((i % a.cols) * w, (i // a.cols) * h))
sheet.save(a.out, 'WEBP', quality=a.quality, alpha_quality=90, method=6)
print('%s: %d frames, %dx%d, %d KB' % (a.out, len(paths), sheet.width, sheet.height, os.path.getsize(a.out) // 1024))
