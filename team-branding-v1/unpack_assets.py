#!/usr/bin/env python3
from pathlib import Path
import base64
import shutil
import zipfile

HERE = Path(__file__).resolve().parent
PARTS = HERE / "archive-parts"
OUT = HERE / "extracted"
ZIP_PATH = HERE / "Dynasty_Lab_Team_Branding_v1_GitHub_32.zip"

parts = sorted(PARTS.glob("part-*.b64"))
if not parts:
    raise SystemExit(f"No archive parts found in {PARTS}")

encoded = "".join(p.read_text(encoding="ascii").strip() for p in parts)
ZIP_PATH.write_bytes(base64.b64decode(encoded))

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)

with zipfile.ZipFile(ZIP_PATH, "r") as zf:
    zf.extractall(OUT)

print(f"Reconstructed {ZIP_PATH.name} from {len(parts)} parts")
print(f"Extracted assets to {OUT}")
