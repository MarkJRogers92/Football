#!/usr/bin/env python3
from pathlib import Path
import base64
import hashlib
import struct

HERE = Path(__file__).resolve().parent
OUT = HERE / "team-logos-atlas-32.png"

# These text chunks were byte-verified against the approved local atlas before
# this handoff was finalized. Keep the order exact.
PARTS = [
    HERE / "atlas-parts-v4" / "part-00.b64",       # chars     0- 1000
    HERE / "atlas-parts-v4" / "part-01.b64",       # chars  1000- 2000
    HERE / "atlas-parts-v4" / "part-02.b64",       # chars  2000- 3000
    HERE / "atlas-parts-v4" / "part-03.b64",       # chars  3000- 4000
    HERE / "atlas-parts-v3" / "part-00-1.b64",     # chars  4000- 8000
    HERE / "atlas-parts-v2" / "part-01.b64",       # chars  8000-16000
    HERE / "atlas-parts-v2" / "part-02.b64",       # chars 16000-24000
    HERE / "atlas-parts-v2" / "part-03.b64",       # chars 24000-32000
    HERE / "atlas-parts" / "part-02.b64",          # chars 32000-48000
    HERE / "atlas-parts" / "part-03.b64",          # chars 48000-61560
]

EXPECTED_B64_CHARS = 61560
EXPECTED_BYTES = 46169
EXPECTED_SHA256 = "b109832743538910bc1bbdbcc029821e48bc8a56ac4978249fbc2ce8804ce48f"
EXPECTED_WIDTH = 384
EXPECTED_HEIGHT = 320
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

missing = [str(p) for p in PARTS if not p.is_file()]
if missing:
    raise SystemExit("Missing atlas chunk(s):\n  " + "\n  ".join(missing))

encoded = "".join(p.read_text(encoding="ascii").strip() for p in PARTS)
if len(encoded) != EXPECTED_B64_CHARS:
    raise SystemExit(
        f"Atlas transport length mismatch: got {len(encoded)}, expected {EXPECTED_B64_CHARS}"
    )

try:
    payload = base64.b64decode(encoded, validate=True)
except Exception as exc:
    raise SystemExit(f"Atlas base64 decode failed: {exc}") from exc

if len(payload) != EXPECTED_BYTES:
    raise SystemExit(
        f"Atlas byte-size mismatch: got {len(payload)}, expected {EXPECTED_BYTES}"
    )

sha256 = hashlib.sha256(payload).hexdigest()
if sha256 != EXPECTED_SHA256:
    raise SystemExit(
        "Atlas SHA-256 mismatch:\n"
        f"  got      {sha256}\n"
        f"  expected {EXPECTED_SHA256}"
    )

if payload[:8] != PNG_SIGNATURE or payload[12:16] != b"IHDR":
    raise SystemExit("Decoded payload is not the expected PNG/IHDR layout")

width, height = struct.unpack(">II", payload[16:24])
if (width, height) != (EXPECTED_WIDTH, EXPECTED_HEIGHT):
    raise SystemExit(
        f"Atlas dimensions mismatch: got {width}x{height}, "
        f"expected {EXPECTED_WIDTH}x{EXPECTED_HEIGHT}"
    )

OUT.write_bytes(payload)

print(f"Reconstructed verified atlas: {OUT}")
print(f"SHA-256: {sha256}")
print(f"Dimensions: {width}x{height}")
print("Layout: 12 columns x 10 rows, 32px cells, row-major by numeric teamId (1-120).")
