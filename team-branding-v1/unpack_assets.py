#!/usr/bin/env python3
from pathlib import Path
import base64

HERE = Path(__file__).resolve().parent
PARTS = HERE / "atlas-parts"
OUT = HERE / "team-logos-atlas-32.png"

parts = sorted(PARTS.glob("part-*.b64"))
if len(parts) != 4:
    raise SystemExit(f"Expected 4 atlas parts in {PARTS}, found {len(parts)}")

encoded = "".join(p.read_text(encoding="ascii").strip() for p in parts)
OUT.write_bytes(base64.b64decode(encoded))

# Expected atlas: 12 columns x 10 rows x 32 px = 384 x 320.
# Team IDs are row-major: ID 1 is cell (0,0), ID 120 is cell (11,9).
print(f"Reconstructed {OUT} from {len(parts)} parts ({OUT.stat().st_size} bytes)")
print("Atlas layout: 384x320, 12 columns x 10 rows, 32px cells, row-major by teamId.")
