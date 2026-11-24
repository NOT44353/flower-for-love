"""Regenerates js/portrait-data.js from assets/girlfriend.jpg.

Run this script whenever you replace assets/girlfriend.jpg with a new photo:
    python scripts/update_photo.py
"""

from __future__ import annotations

import base64
import io
import json
from pathlib import Path
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent.parent
PHOTO_PATH = ROOT / "assets" / "girlfriend.jpg"
OUTPUT_JS = ROOT / "js" / "portrait-data.js"


def build_portrait_data(photo_path: Path = PHOTO_PATH, out_path: Path = OUTPUT_JS) -> None:
    if not photo_path.exists():
        raise FileNotFoundError(f"Photo not found: {photo_path}")

    with Image.open(photo_path) as img:
        img = ImageOps.exif_transpose(img).convert("RGB")
        orig_w, orig_h = img.size

        # Keep high quality display copy (max 900px) so index.html works offline via file:// without CORS errors
        display_img = img.copy()
        display_img.thumbnail((900, 900), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        display_img.save(buf, format="JPEG", quality=88, optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        data_uri = f"data:image/jpeg;base64,{b64}"

        disp_w, disp_h = display_img.size

    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "width": disp_w,
        "height": disp_h,
        "originalWidth": orig_w,
        "originalHeight": orig_h,
        "dataUri": data_uri,
    }
    js_content = (
        "// Auto-generated from assets/girlfriend.jpg by scripts/update_photo.py\n"
        "// Embedded as a data URI so index.html works even when opened directly via file://\n"
        f"window.PORTRAIT_ASSET = {json.dumps(payload)};\n"
    )
    out_path.write_text(js_content, encoding="utf-8")
    print(f"Generated {out_path.relative_to(ROOT)} ({disp_w}x{disp_h}, {len(js_content):,} bytes)")


if __name__ == "__main__":
    build_portrait_data()
