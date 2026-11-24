"""
3D ASCII Blooming Rose Bouquet & True-Color Portrait Gift
=========================================================
Author: Thanapat Pisavong (ธนภัทร พิศวงศ์ / น๊อต / NOT44353)
Portfolio: https://not44353.vercel.app/  |  GitHub: https://github.com/NOT44353

Runs directly in Windows Terminal / PowerShell / VS Code Terminal
with 24-bit ANSI True Color — no numpy required (uses Python stdlib + Pillow).

Usage:
    python flower_ascii.py                  # Default: 3D Bouquet + Portrait side-by-side
    python flower_ascii.py --mode bouquet   # Full-width 3D Blooming Rose Bouquet
    python flower_ascii.py --mode portrait  # High-detail Animated ASCII Portrait
    python flower_ascii.py --fps 24 --name "ถึงคนเก่งของเค้า"
"""

from __future__ import annotations

import argparse
import ctypes
import math
import os
import random
import shutil
import sys
import time
from pathlib import Path

try:
    from PIL import Image, ImageEnhance, ImageOps
except ImportError:
    Image = None  # type: ignore

ROOT = Path(__file__).resolve().parent
DEFAULT_PHOTO = ROOT / "assets" / "girlfriend.jpg"
RAMP = " .'`,-:;~=+*#%@"
RAMP_PORTRAIT = " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"


def enable_windows_ansi() -> None:
    """Enable 24-bit ANSI color & UTF-8 output on Windows console."""
    if os.name == "nt":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
        try:
            kernel32 = ctypes.windll.kernel32
            handle = kernel32.GetStdHandle(-11)  # STD_OUTPUT_HANDLE
            mode = ctypes.c_uint32()
            if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
                kernel32.SetConsoleMode(handle, mode.value | 0x0004)
        except Exception:
            pass


def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return lo if v < lo else (hi if v > hi else v)


def smoothstep(edge0: float, edge1: float, x: float) -> float:
    t = clamp((x - edge0) / (edge1 - edge0) if edge1 != edge0 else 1.0)
    return t * t * (3.0 - 2.0 * t)


def build_rose_bouquet_points() -> list[tuple[float, ...]]:
    """Build 3D parametric point cloud for a blooming crimson rose & ivory peony bouquet.

    Each tuple stores:
      (x0, y0, z0, x1, y1, z1, nx, ny, nz, r, g, b, delay, emissive)
    where (x0,y0,z0) is closed-bud state and (x1,y1,z1) is full-bloom state.
    """
    pts: list[tuple[float, ...]] = []
    golden_angle = 2.399963229728653  # 137.508 deg phyllotaxis

    def add_rose(
        cx: float,
        cy: float,
        cz: float,
        scale: float,
        tilt_x: float,
        tilt_z: float,
        petal_count: int,
        col_inner: tuple[float, float, float],
        col_mid: tuple[float, float, float],
        col_edge: tuple[float, float, float],
        u_steps: int,
        v_steps: int,
    ) -> None:
        ctx, stx = math.cos(tilt_x), math.sin(tilt_x)
        ctz, stz = math.cos(tilt_z), math.sin(tilt_z)

        def orient(lx: float, ly: float, lz: float) -> tuple[float, float, float]:
            # Tilt around X then Z, then translate
            y1 = ly * ctx - lz * stx
            z1 = ly * stx + lz * ctx
            x2 = lx * ctz - y1 * stz
            y2 = lx * stz + y1 * ctz
            return (cx + x2 * scale, cy + y2 * scale, cz + z1 * scale)

        def orient_n(nx: float, ny: float, nz: float) -> tuple[float, float, float]:
            y1 = ny * ctx - nz * stx
            z1 = ny * stx + nz * ctx
            x2 = nx * ctz - y1 * stz
            y2 = nx * stz + y1 * ctz
            ln = math.sqrt(x2 * x2 + y2 * y2 + z1 * z1) or 1.0
            return (x2 / ln, y2 / ln, z1 / ln)

        for k in range(petal_count):
            layer = k / max(1, petal_count - 1)  # 0 = tight center, 1 = outer petals
            phi = k * golden_angle
            cp, sp = math.cos(phi), math.sin(phi)

            p_w = (0.17 + 0.25 * layer)
            p_h = (0.28 + 0.34 * layer)
            r_base = 0.04 + 0.22 * (layer ** 1.15)
            # Closed bud vs full bloom petal flare angles
            ang_bud = 0.12 + 0.34 * layer
            ang_open = 0.24 + 1.18 * (layer ** 0.92)
            delay = 0.45 * (1.0 - layer)  # outer petals unfurl slightly ahead of inner bud

            for iv in range(v_steps + 1):
                v = iv / v_steps
                width_env = math.sin((v ** 0.65) * math.pi)
                half_w = p_w * (0.25 + 0.75 * width_env)
                eff_u = max(2, int(round(u_steps * (0.45 + 0.55 * width_env))))
                for iu in range(-eff_u, eff_u + 1):
                    u = iu / eff_u
                    # Cupping inward + romantic lip recurve at upper petal tip
                    cup = -0.09 * (1.0 - u * u) * math.sin(v * math.pi * 0.85)
                    recurve_bud = 0.03 * (max(0.0, v - 0.65) ** 2)
                    recurve_open = (0.14 + 0.16 * layer) * (max(0.0, v - 0.48) / 0.52) ** 2.1

                    # Bud position in local petal coordinates
                    r0 = r_base * 0.72 + v * p_h * math.sin(ang_bud) + cup + recurve_bud
                    y0 = -0.06 * layer + v * p_h * math.cos(ang_bud)
                    lx0 = r0 * cp - (u * half_w * 0.78) * sp
                    lz0 = r0 * sp + (u * half_w * 0.78) * cp

                    # Open bloom position
                    r1 = r_base + v * p_h * math.sin(ang_open) + cup + recurve_open
                    y1 = -0.10 * layer + v * p_h * math.cos(ang_open) - 0.08 * recurve_open
                    lx1 = r1 * cp - (u * half_w) * sp
                    lz1 = r1 * sp + (u * half_w) * cp

                    # Approximate petal surface normal
                    lnx = cp * math.cos(ang_open * 0.65) - (u * 0.45) * sp
                    lnz = sp * math.cos(ang_open * 0.65) + (u * 0.45) * cp
                    lny = 0.48 + 0.45 * v

                    px0, py0, pz0 = orient(lx0, y0, lz0)
                    px1, py1, pz1 = orient(lx1, y1, lz1)
                    nx, ny, nz = orient_n(lnx, lny, lnz)

                    # Velvet shading gradient: dark base -> rich mid -> glowing curled lip
                    if v < 0.55:
                        t_c = v / 0.55
                        cr = col_inner[0] + (col_mid[0] - col_inner[0]) * t_c
                        cg = col_inner[1] + (col_mid[1] - col_inner[1]) * t_c
                        cb = col_inner[2] + (col_mid[2] - col_inner[2]) * t_c
                    else:
                        t_c = (v - 0.55) / 0.45
                        cr = col_mid[0] + (col_edge[0] - col_mid[0]) * t_c
                        cg = col_mid[1] + (col_edge[1] - col_mid[1]) * t_c
                        cb = col_mid[2] + (col_edge[2] - col_mid[2]) * t_c

                    edge_boost = 1.14 if (v > 0.84 or abs(u) > 0.85) else 1.0
                    em = 0.16 + 0.16 * v + 0.10 * (1.0 - layer)
                    pts.append((
                        px0, py0, pz0,
                        px1, py1, pz1,
                        nx, ny, nz,
                        min(1.0, cr * edge_boost),
                        min(1.0, cg * edge_boost),
                        min(1.0, cb * edge_boost),
                        delay,
                        em,
                    ))

    # 1. Hero Central Crimson Hanfu Rose
    add_rose(
        0.0, 0.54, 0.06, 1.02, 0.24, 0.0, 22,
        (0.45, 0.02, 0.08), (0.94, 0.10, 0.22), (1.0, 0.52, 0.62),
        u_steps=3, v_steps=6,
    )

    # 2. Six Companion Roses & Embroidered Ivory-Gold Peonies around the bouquet crown
    ring_specs = [
        (0, (0.48, 0.03, 0.10), (0.95, 0.14, 0.28), (1.0, 0.56, 0.66)),  # Crimson
        (1, (0.82, 0.52, 0.52), (0.98, 0.84, 0.78), (1.0, 0.96, 0.88)),  # Ivory-Gold Peony
        (2, (0.62, 0.08, 0.24), (0.96, 0.30, 0.50), (1.0, 0.72, 0.82)),  # Rose Blush
        (3, (0.46, 0.02, 0.09), (0.92, 0.12, 0.24), (1.0, 0.52, 0.60)),  # Crimson
        (4, (0.80, 0.50, 0.48), (0.98, 0.85, 0.76), (1.0, 0.97, 0.88)),  # Ivory-Gold Peony
        (5, (0.66, 0.10, 0.26), (0.98, 0.34, 0.54), (1.0, 0.76, 0.86)),  # Rose Blush
    ]
    for idx, c_in, c_mid, c_ed in ring_specs:
        ang = idx * (math.tau / 6.0) + 0.26
        rx = math.cos(ang) * 0.72
        rz = math.sin(ang) * 0.72
        ry = 0.24 + 0.06 * math.sin(idx * 2.1)
        # Tilt flower outward away from bouquet axis
        tx = math.sin(ang) * 0.58
        tz = -math.cos(ang) * 0.58
        add_rose(rx, ry, rz, 0.56, tx, tz, 14, c_in, c_mid, c_ed, u_steps=2, v_steps=5)

    # 3. Lush Emerald Rose Leaves around outer rim
    for i in range(10):
        ang = i * (math.tau / 10.0) + 0.15
        ca, sa = math.cos(ang), math.sin(ang)
        for iv in range(8):
            v = iv / 7.0
            hw = 0.22 * math.sin(v * math.pi)
            for iu in range(-2, 3):
                u = iu / 2.0
                r = 0.68 + v * 0.68
                y = 0.06 - 0.18 * v + 0.08 * math.sin(v * math.pi)
                x = r * ca - (u * hw) * sa
                z = r * sa + (u * hw) * ca
                vein = 1.12 if abs(u) < 0.2 else 0.94
                pts.append((
                    x * 0.88, y + 0.06, z * 0.88,
                    x, y, z,
                    ca * 0.4, 0.85, sa * 0.4,
                    min(1.0, (0.12 + 0.16 * v) * vein),
                    min(1.0, (0.48 + 0.34 * v) * vein),
                    min(1.0, (0.18 + 0.14 * v) * vein),
                    0.0,
                    0.12,
                ))

    # 4. Pleated Crimson-Gold Bouquet Wrapping Cone + Golden Ribbon Waist
    for iy in range(18):
        v = iy / 17.0
        y = -1.00 + v * 1.18
        waist = abs(v - 0.44)
        if v > 0.44:
            r_base = 0.25 + (((v - 0.44) / 0.56) ** 1.15) * 0.84
        else:
            r_base = 0.25 + (((0.44 - v) / 0.44) ** 1.15) * 0.26
        is_gold = v > 0.92 or v < 0.07 or abs(v - 0.44) < 0.07
        for ia in range(44):
            a = ia * (math.tau / 44.0)
            pleat = math.sin(a * 9.0) * (0.02 + 0.045 * waist)
            r = (r_base * 1.12 if abs(v - 0.44) < 0.07 else r_base) + pleat
            x = math.cos(a) * r
            z = math.sin(a) * r
            if is_gold:
                r_c, g_c, b_c, em = 1.0, 0.80, 0.28, 0.52
            else:
                fl = 0.82 + 0.18 * math.cos(a * 9.0)
                r_c, g_c, b_c, em = (0.76 + 0.14 * v) * fl, (0.14 + 0.10 * v) * fl, (0.24 + 0.12 * v) * fl, 0.20
            pts.append((x, y, z, x, y, z, math.cos(a), 0.15, math.sin(a), r_c, g_c, b_c, 0.0, em))

    # Golden Bow Loops (front of ribbon wrap)
    for side in (-1.0, 1.0):
        for s in range(18):
            t_b = (s / 17.0) * math.tau
            bx = side * (0.24 + 0.22 * math.cos(t_b))
            by = -0.48 + 0.15 * math.sin(t_b)
            bz = 0.29 + 0.05 * math.cos(t_b * 2.0)
            pts.append((bx, by, bz, bx, by, bz, bx, by + 0.4, 1.0, 1.0, 0.84, 0.30, 0.0, 0.58))
        # Ribbon tail
        for s in range(14):
            v = s / 13.0
            tx = side * (0.12 + 0.28 * v + 0.04 * math.sin(v * 6.0))
            ty = -0.52 - 0.50 * v
            tz = 0.27 + 0.07 * v
            pts.append((tx, ty, tz, tx, ty, tz, 0.0, 0.2, 1.0, 1.0, 0.76, 0.24, 0.0, 0.54))

    return pts


def load_portrait_cells(
    photo_path: Path,
    cols: int,
    rows: int,
) -> list[list[tuple[str, int, int, int]]]:
    """Convert girlfriend.jpg into a crisp enhanced True-Color ASCII cell matrix."""
    if Image is None or not photo_path.exists():
        return [[(" ", 0, 0, 0) for _ in range(cols)] for _ in range(rows)]

    with Image.open(photo_path) as img:
        img = ImageOps.exif_transpose(img).convert("RGB")
        # Gentle enhancement so facial features, gold crown, and crimson Hanfu shine in terminal
        img = ImageEnhance.Contrast(img).enhance(1.16)
        img = ImageEnhance.Color(img).enhance(1.14)
        img = ImageEnhance.Brightness(img).enhance(1.06)

        # Preserve aspect ratio (terminal char cells are ~2x taller than wide)
        char_aspect = 1.95
        target_ratio = cols / (rows * char_aspect)
        src_w, src_h = img.size
        src_ratio = src_w / src_h

        if src_ratio > target_ratio:
            new_w = int(src_h * target_ratio)
            left = (src_w - new_w) // 2
            img = img.crop((left, 0, left + new_w, src_h))
        else:
            new_h = int(src_w / target_ratio)
            # Bias slightly upward to keep her crown & face framed beautifully
            top = max(0, int((src_h - new_h) * 0.22))
            img = img.crop((0, top, src_w, min(src_h, top + new_h)))

        img = img.resize((cols, rows), Image.Resampling.LANCZOS)
        pixels = img.load()

    grid: list[list[tuple[str, int, int, int]]] = []
    n_ramp = len(RAMP_PORTRAIT)
    for r in range(rows):
        row_cells: list[tuple[str, int, int, int]] = []
        for c in range(cols):
            R, G, B = pixels[c, r]
            # Slight gamma lift for clear ASCII readability on black terminal
            lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255.0
            idx = min(n_ramp - 1, max(1, int((lum ** 0.85) * n_ramp)))
            # Soft rounded vignette along edges
            vx = (c / max(1, cols - 1)) * 2.0 - 1.0
            vy = (r / max(1, rows - 1)) * 2.0 - 1.0
            edge = max(0.0, (vx * vx + vy * vy) - 1.15)
            fade = max(0.28, 1.0 - edge * 0.55)
            row_cells.append((
                RAMP_PORTRAIT[idx],
                int(R * fade),
                int(G * fade),
                int(B * fade),
            ))
        grid.append(row_cells)
    return grid


def render_frame_ansi(
    t: float,
    mode: str,
    width: int,
    height: int,
    bouquet_pts: list[tuple[float, ...]],
    portrait_grid: list[list[tuple[str, int, int, int]]] | None,
    portrait_offset_x: int,
    stars: list[tuple[int, int, float, float]],
    petals: list[tuple[float, float, float, float, float]],
    lanterns: list[tuple[float, float, float, float]],
    title_text: str,
) -> str:
    """Render one complete frame into an optimized 24-bit ANSI terminal string."""
    scene_h = height - 2  # reserve bottom status/love banner
    bouquet_w = portrait_offset_x - 2 if mode == "combo" else width
    horizon = int(scene_h * 0.64)

    # Buffers for full frame
    buf_ch = [" "] * (width * scene_h)
    buf_r = [0] * (width * scene_h)
    buf_g = [0] * (width * scene_h)
    buf_b = [0] * (width * scene_h)

    if mode in ("bouquet", "combo"):
        bw = bouquet_w
        cx = bw * 0.50
        cy = scene_h * 0.52
        fov = min(bw * 0.42, scene_h * 0.86)
        cam_z = 4.6
        char_aspect = 1.92
        zbuf = [-1e9] * (bw * scene_h)

        # 1. Stars
        for sc, sr, phase, spd in stars:
            if sc < bw and sr < horizon:
                tw = 0.4 + 0.6 * math.sin(t * spd + phase)
                idx = sr * width + sc
                buf_ch[idx] = "*" if tw > 0.78 else ("+" if tw > 0.55 else ".")
                buf_r[idx] = int(255 * tw)
                buf_g[idx] = int(225 * tw)
                buf_b[idx] = int(175 * tw)

        # 2. Full Moon (top-right of bouquet stage)
        moon_c = bw * 0.82
        moon_r = max(3.0, scene_h * 0.16)
        m_rad = max(2.2, scene_h * 0.10)
        for r in range(max(0, int(moon_r - m_rad - 1)), min(horizon, int(moon_r + m_rad + 2))):
            dy = (r - moon_r) / m_rad
            for c in range(max(0, int(moon_c - m_rad * char_aspect - 1)), min(bw, int(moon_c + m_rad * char_aspect + 2))):
                dx = (c - moon_c) / (m_rad * char_aspect)
                d2 = dx * dx + dy * dy
                if d2 <= 1.0:
                    rim = math.sqrt(max(0.0, 1.0 - d2))
                    lum = 0.55 + 0.45 * (rim ** 0.5)
                    idx = r * width + c
                    buf_ch[idx] = RAMP[min(len(RAMP) - 1, int(lum * len(RAMP)))]
                    buf_r[idx] = int(255 * lum)
                    buf_g[idx] = int(238 * lum)
                    buf_b[idx] = int(195 * lum)

        # 3. Floating Red Chinese Lanterns (inspired by her Hanfu photo!)
        for lx0, ly0, lspd, lph in lanterns:
            ly = (ly0 - t * lspd) % (horizon + 2) - 1.0
            lx = lx0 * bw + math.sin(t * 0.7 + lph) * 2.0
            r0, c0 = int(round(ly)), int(round(lx))
            if 0 <= r0 < horizon and 1 <= c0 < bw - 1:
                glow = 0.85 + 0.15 * math.sin(t * 5.5 + lph)
                for dc, ch, mult in ((-1, "(", 0.78), (0, "@", 1.0), (1, ")", 0.78)):
                    idx = r0 * width + (c0 + dc)
                    buf_ch[idx] = ch
                    buf_r[idx] = int(255 * glow * mult)
                    buf_g[idx] = int((145 if dc == 0 else 58) * glow * mult)
                    buf_b[idx] = int((45 if dc == 0 else 28) * glow * mult)
                if r0 + 1 < horizon:
                    idx = (r0 + 1) * width + c0
                    buf_ch[idx] = "|"
                    buf_r[idx], buf_g[idx], buf_b[idx] = 240, 185, 70

        # 4. Calm Lakeside Water Ripples & Reflections
        for r in range(horizon, scene_h):
            q = (r - horizon + 0.5) / max(1, scene_h - horizon)
            wz = 1.0 / (q + 0.1)
            row_off = r * width
            for c in range(bw):
                wave = 0.5 + 0.5 * math.sin((c - cx) * 0.16 + wz * 2.0 - t * 2.4)
                # Warm crimson-gold reflection under bouquet + moonlight reflection
                d_center = abs(c - cx) / (bw * 0.24 + q * 8.0)
                k_ref = math.exp(-d_center * d_center * 2.2) * (0.35 + 0.65 * wave) * (1.0 - 0.35 * q)
                d_moon = abs(c - moon_c) / (2.5 + q * 6.0)
                m_ref = math.exp(-d_moon * d_moon * 2.4) * (0.3 + 0.7 * wave)
                cr = 0.04 + 0.72 * k_ref + 0.55 * m_ref
                cg = 0.03 + 0.24 * k_ref + 0.50 * m_ref
                cb = 0.09 + 0.22 * k_ref + 0.38 * m_ref
                lum = 0.299 * cr + 0.587 * cg + 0.114 * cb
                if lum > 0.10:
                    idx = row_off + c
                    buf_ch[idx] = "=" if lum > 0.52 else ("~" if lum > 0.28 else "-")
                    buf_r[idx] = min(255, int(cr * 255))
                    buf_g[idx] = min(255, int(cg * 255))
                    buf_b[idx] = min(255, int(cb * 255))

        # 5. 3D Z-Buffered Blooming Rose Bouquet
        # Smooth bloom progression over first 4 seconds, then gentle breathing pulse
        bloom_master = min(1.0, t / 3.8) + 0.04 * math.sin(t * 1.4)
        yaw = t * 0.58
        pitch = 0.30 + 0.05 * math.sin(t * 1.1)
        bob = 0.05 * math.sin(t * 1.9)
        cy_a, sy_a = math.cos(yaw), math.sin(yaw)
        cp_a, sp_a = math.cos(pitch), math.sin(pitch)
        lx_l, ly_l, lz_l = -0.45, 0.72, 0.53  # warm sunset/lantern key light

        for pt in bouquet_pts:
            x0, y0, z0, x1, y1, z1, nx, ny, nz, ar, ag, ab, delay, em = pt
            b_t = smoothstep(delay, min(1.0, delay + 0.55), bloom_master)
            px = x0 + (x1 - x0) * b_t
            py = y0 + (y1 - y0) * b_t
            pz = z0 + (z1 - z0) * b_t

            # Rotate Y then X
            rx1 = px * cy_a - pz * sy_a
            rz1 = px * sy_a + pz * cy_a
            ry2 = py * cp_a - rz1 * sp_a + bob
            rz2 = py * sp_a + rz1 * cp_a

            dist = cam_z - rz2
            if dist <= 0.5:
                continue
            sc = fov / dist
            col = int(round(cx + rx1 * sc * char_aspect))
            row = int(round(cy - ry2 * sc))
            if 0 <= col < bw and 0 <= row < scene_h:
                zidx = row * bw + col
                if rz2 > zbuf[zidx]:
                    zbuf[zidx] = rz2
                    # Rotate normal
                    rnx = nx * cy_a - nz * sy_a
                    rnz1 = nx * sy_a + nz * cy_a
                    rny = ny * cp_a - rnz1 * sp_a
                    rnz = ny * sp_a + rnz1 * cp_a

                    ndl = max(0.0, rnx * lx_l + rny * ly_l + rnz * lz_l)
                    rim = (1.0 - abs(rnz)) ** 2 * 0.35
                    light = 0.26 + 0.78 * ndl + em * 0.55
                    cr = min(1.0, ar * light + rim * 0.65)
                    cg = min(1.0, ag * light + rim * 0.30)
                    cb = min(1.0, ab * light + rim * 0.35)
                    lum = 0.299 * cr + 0.587 * cg + 0.114 * cb
                    idx = row * width + col
                    buf_ch[idx] = RAMP[min(len(RAMP) - 1, max(1, int((lum ** 0.75) * len(RAMP))))]
                    buf_r[idx] = int(cr * 255)
                    buf_g[idx] = int(cg * 255)
                    buf_b[idx] = int(cb * 255)

    # 6. Girlfriend True-Color ASCII Portrait (with petal-reveal entrance!)
    if mode in ("portrait", "combo") and portrait_grid is not None:
        p_rows = len(portrait_grid)
        p_cols = len(portrait_grid[0]) if p_rows else 0
        start_x = portrait_offset_x if mode == "combo" else max(0, (width - p_cols) // 2)
        start_y = max(0, (scene_h - p_rows) // 2)
        reveal = min(1.0, max(0.0, (t - 0.35) / 2.2))

        # Divider line in combo mode
        if mode == "combo" and start_x - 1 >= 0:
            for r in range(scene_h):
                idx = r * width + (start_x - 1)
                buf_ch[idx] = "│"
                buf_r[idx], buf_g[idx], buf_b[idx] = 140, 52, 68

        p_cx = p_cols * 0.5
        p_cy = p_rows * 0.45
        max_dist = math.hypot(p_cx, p_cy) or 1.0
        for r in range(p_rows):
            tr = start_y + r
            if tr >= scene_h:
                break
            row_data = portrait_grid[r]
            row_off = tr * width
            for c in range(p_cols):
                tc = start_x + c
                if tc >= width:
                    break
                d_norm = math.hypot(c - p_cx, r - p_cy) / max_dist
                if d_norm <= reveal * 1.15:
                    ch, R, G, B = row_data[c]
                    idx = row_off + tc
                    # Shimmering edge during reveal wave
                    if abs(d_norm - reveal) < 0.06 and reveal < 0.99:
                        buf_ch[idx] = "*"
                        buf_r[idx], buf_g[idx], buf_b[idx] = 255, 200, 110
                    else:
                        buf_ch[idx] = ch
                        buf_r[idx], buf_g[idx], buf_b[idx] = R, G, B

    # 7. Drifting Crimson Rose Petals & Hearts across the entire frame
    for px0, py0, vx, vy, ph in petals:
        px = int((px0 * width + t * vx + math.sin(t * 1.7 + ph) * 3.5) % width)
        py = int((py0 * scene_h + t * vy) % scene_h)
        idx = py * width + px
        is_heart = ph > 4.9
        buf_ch[idx] = "♥" if is_heart else ("✿" if ph > 3.6 else "~")
        if is_heart:
            buf_r[idx], buf_g[idx], buf_b[idx] = 255, 95, 135
        else:
            buf_r[idx], buf_g[idx], buf_b[idx] = 255, 120, 145

    # Assemble ANSI frame efficiently (emit color escape only when RGB changes)
    out: list[str] = ["\x1b[H"]
    last_rgb = (-1, -1, -1)
    for r in range(scene_h):
        row_off = r * width
        line: list[str] = []
        for c in range(width):
            idx = row_off + c
            ch = buf_ch[idx]
            if ch == " ":
                line.append(" ")
            else:
                rgb = (buf_r[idx], buf_g[idx], buf_b[idx])
                if rgb != last_rgb:
                    line.append(f"\x1b[38;2;{rgb[0]};{rgb[1]};{rgb[2]}m")
                    last_rgb = rgb
                line.append(ch)
        out.append("".join(line))
        out.append("\x1b[0m\n")
        last_rgb = (-1, -1, -1)

    # Romantic bottom banner
    banner = f" 🌹 {title_text}  ·  โหมด: {mode}  ·  กด Ctrl+C เพื่อออก "
    pad = max(0, (width - len(banner)) // 2)
    out.append(f"\x1b[38;2;255;205;120m{' ' * pad}{banner}\x1b[0m")
    return "".join(out)


def main() -> None:
    parser = argparse.ArgumentParser(description="3D ASCII Rose Bouquet & Portrait Gift")
    parser.add_argument("--mode", choices=["combo", "bouquet", "portrait"], default="combo")
    parser.add_argument("--photo", type=Path, default=DEFAULT_PHOTO)
    parser.add_argument("--fps", type=float, default=20.0)
    parser.add_argument("--frames", type=int, default=0, help="Stop after N frames (0 = loop forever)")
    parser.add_argument("--name", type=str, default="ดอกไม้ช่อนี้ให้ ลำดวน สิงห์ใหญ่ นะ ♥ — by น๊อต (Thanapat Pisavong · NOT44353)")
    parser.add_argument("--snapshot", action="store_true", help="Render one test frame and exit cleanly")
    args = parser.parse_args()

    enable_windows_ansi()
    term = shutil.get_terminal_size((116, 36))
    width = max(60, min(160, term.columns - 1))
    height = max(24, min(48, term.lines - 1))
    scene_h = height - 2

    bouquet_pts = build_rose_bouquet_points()

    portrait_grid = None
    portrait_offset_x = width
    if args.mode == "combo":
        p_cols = max(28, int(width * 0.44))
        portrait_offset_x = width - p_cols
        portrait_grid = load_portrait_cells(args.photo, p_cols, scene_h)
    elif args.mode == "portrait":
        p_cols = min(width - 2, int(scene_h * 1.75))
        portrait_grid = load_portrait_cells(args.photo, p_cols, scene_h)

    rng = random.Random(20261124)
    stars = [(rng.randrange(width), rng.randrange(max(1, int(scene_h * 0.62))), rng.uniform(0, 6.28), rng.uniform(1.4, 3.2)) for _ in range(48)]
    petals = [(rng.random(), rng.random(), rng.uniform(-1.6, 1.8), rng.uniform(1.2, 3.0), rng.uniform(0, 6.28)) for _ in range(22)]
    lanterns = [(rng.uniform(0.08, 0.90), rng.uniform(0.0, scene_h * 0.6), rng.uniform(0.4, 0.9), rng.uniform(0, 6.28)) for _ in range(7)]

    if args.snapshot:
        frame = render_frame_ansi(
            3.6, args.mode, width, height, bouquet_pts, portrait_grid,
            portrait_offset_x, stars, petals, lanterns, args.name,
        )
        print(f"Snapshot OK | mode={args.mode} | grid={width}x{height} | points={len(bouquet_pts)} | ansi_bytes={len(frame)}")
        return

    sys.stdout.write("\x1b[2J\x1b[?25l")
    sys.stdout.flush()
    t0 = time.perf_counter()
    frame_idx = 0
    dt_target = 1.0 / max(1.0, args.fps)

    try:
        while True:
            t_start = time.perf_counter()
            t = t_start - t0
            frame = render_frame_ansi(
                t, args.mode, width, height, bouquet_pts, portrait_grid,
                portrait_offset_x, stars, petals, lanterns, args.name,
            )
            sys.stdout.write(frame)
            sys.stdout.flush()
            frame_idx += 1
            if args.frames > 0 and frame_idx >= args.frames:
                break
            sleep_s = dt_target - (time.perf_counter() - t_start)
            if sleep_s > 0:
                time.sleep(sleep_s)
    except KeyboardInterrupt:
        pass
    finally:
        sys.stdout.write("\x1b[0m\x1b[?25h\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
