/**
 * TikTok / IG Reels 9:16 Composite Canvas Renderer
 * Top half: Live 3D ASCII Blooming Rose Bouquet + Her True-Color ASCII Portrait + Romantic Overlay
 * Bottom half: Auto-scrolling syntax-highlighted flower_ascii.py editor (matching the reference reel!)
 */
(function () {
  const CODE_LINES = [
    "# flower_ascii.py — 3D Z-Buffer Rose Bouquet & Portrait",
    "# Crafted with ♥ by Thanapat Pisavong (NOT44353)",
    "def project(p, cam_z=4.9, fov=51.0):",
    '    """Project 3D rose petal points (x, y, z) -> terminal cell."""',
    "    dist = cam_z - p.z",
    "    scale = fov / dist",
    "    col = CX + p.x * scale * CHAR_ASPECT",
    "    row = CY - p.y * scale",
    "    return col, row, p.z",
    "",
    "def rose_petal(layer, phi, u, v, bloom):",
    '    """Golden-angle spiral phyllotaxis with velvet lip recurve."""',
    "    ang = mix(0.12 + 0.34 * layer, 0.25 + 1.20 * layer, bloom)",
    "    cup = -0.10 * (1.0 - u * u) * sin(v * PI * 0.86)",
    "    recurve = 0.28 * pow(max(0.0, v - 0.46) / 0.54, 2.1)",
    "    r = r_base + v * p_h * sin(ang) + cup + recurve",
    "    y = -0.11 * layer + v * p_h * cos(ang)",
    "    return (r * cos(phi), y, r * sin(phi))",
    "",
    "def render_bouquet(t, zbuf, frame):",
    '    """Z-buffer 3D blooming roses + golden lantern lighting."""',
    "    bloom = smoothstep(0.0, 3.4, t)",
    "    yaw = t * 0.50",
    "    for pt in BOUQUET_POINTS:",
    "        x, y, z = rotate_yxz(lerp(pt.bud, pt.open, bloom), yaw)",
    "        c, r, depth = project(x, y, z)",
    "        if depth > zbuf[r, c]:",
    "            zbuf[r, c] = depth",
    "            ndl = max(0.18, dot(pt.normal, LANTERN_LIGHT))",
    "            rim = pow(1.0 - abs(pt.nz), 2.1) * 0.36",
    "            frame[r, c] = shade_velvet(pt.color, ndl, rim)",
    "",
    "def render_portrait_ascii(photo, reveal_t):",
    '    """True-color ASCII art of her portrait with petal reveal."""',
    "    img = enhance_vibrance(load_image('assets/girlfriend.jpg'))",
    "    for r, c in grid_cells(img):",
    "        R, G, B = img.pixel(c, r)",
    "        lum = 0.299 * R + 0.587 * G + 0.114 * B",
    "        glyph = RAMP[int(pow(lum, 0.86) * len(RAMP))]",
    "        emit_ansi_truecolor(r, c, glyph, R, G, B)",
    "",
    "def lantern_sky_and_lake(buf, t):",
    '    """Red Chinese lanterns + moonlit lakeside reflection."""',
    "    for lantern in RED_LANTERNS:",
    "        ly = (lantern.y - t * lantern.speed) % HORIZON",
    "        add_glow(buf, lantern.x, ly, (0.98, 0.22, 0.16))",
    "    water_reflections(buf, t, MOON_POS, BOUQUET_POS)",
    "",
    "# For ลำดวน สิงห์ใหญ่ — my favorite person in the whole world ♥",
    "if __name__ == '__main__':",
    "    send_flowers_with_love(mode='combo', fps=60)",
  ];

  // Minimal Python syntax tokenizer for crisp editor colors
  function tokenizePython(line) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) return [{ text: line, color: "#6c7a89" }];
    if (trimmed.startsWith('"""')) return [{ text: line, color: "#e5c07b" }];

    const tokens = [];
    const regex = /(\b(?:def|return|for|in|if|else|and|or|not|max|min|int|len|pow)\b|'[^']*'|"[^"]*"|\b\d+(?:\.\d+)?\b|[A-Z_]{3,}|[()[\],:=*+-/]+)/g;
    let lastIndex = 0;
    let m;
    while ((m = regex.exec(line)) !== null) {
      if (m.index > lastIndex) {
        tokens.push({ text: line.slice(lastIndex, m.index), color: "#d8dee9" });
      }
      const val = m[0];
      let color = "#d8dee9";
      if (/^(def|return|for|in|if|else|and|or|not)$/.test(val)) color = "#ff79c6";
      else if (/^(max|min|int|len|pow)$/.test(val)) color = "#8be9fd";
      else if (/^['"]/.test(val)) color = "#f1fa8c";
      else if (/^\d/.test(val)) color = "#bd93f9";
      else if (/^[A-Z_]{3,}$/.test(val)) color = "#ffb86c";
      else color = "#9fb3c8";
      tokens.push({ text: val, color });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) {
      tokens.push({ text: line.slice(lastIndex), color: "#d8dee9" });
    }
    return tokens;
  }

  const TOKENIZED_CODE = CODE_LINES.map(tokenizePython);

  class ReelsCompositor {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      // Crisp 9:16 Reels resolution (720 x 1280)
      this.w = 720;
      this.h = 1280;
      canvas.width = this.w;
      canvas.height = this.h;
    }

    render(t, bouquetCanvas, portraitCanvas, config, frameNum) {
      const ctx = this.ctx;
      const W = this.w;
      const H = this.h;
      const splitY = 790; // Top 62% ASCII stage, Bottom 38% Python code panel

      // 1. Background
      ctx.fillStyle = "#040207";
      ctx.fillRect(0, 0, W, H);

      // 2. Top Visual Stage: Split Bouquet (Left 56%) + Portrait ASCII (Right 44%)
      const stagePad = 14;
      const topH = splitY - 82;
      const leftW = Math.round((W - stagePad * 3) * 0.56);
      const rightW = W - stagePad * 3 - leftW;

      // Draw 3D Bouquet Canvas (aspect-fit / cover neatly)
      ctx.save();
      this._roundRect(ctx, stagePad, 16, leftW, topH, 14);
      ctx.clip();
      ctx.fillStyle = "#040207";
      ctx.fillRect(stagePad, 16, leftW, topH);
      this._drawCover(ctx, bouquetCanvas, stagePad, 16, leftW, topH);
      ctx.restore();

      // Draw Portrait ASCII Canvas
      const rightX = stagePad * 2 + leftW;
      ctx.save();
      this._roundRect(ctx, rightX, 16, rightW, topH, 14);
      ctx.clip();
      ctx.fillStyle = "#040207";
      ctx.fillRect(rightX, 16, rightW, topH);
      this._drawCover(ctx, portraitCanvas, rightX, 16, rightW, topH);
      ctx.restore();

      // Subtle glowing crimson-gold borders around both stages
      ctx.strokeStyle = "rgba(245, 193, 108, 0.32)";
      ctx.lineWidth = 1.5;
      this._roundRect(ctx, stagePad, 16, leftW, topH, 14);
      ctx.stroke();
      this._roundRect(ctx, rightX, 16, rightW, topH, 14);
      ctx.stroke();

      // Romantic Caption Bar directly under ASCII stages
      const capY = 16 + topH + 14;
      ctx.fillStyle = "rgba(255, 240, 232, 0.96)";
      ctx.font = "bold 24px system-ui, 'Segoe UI', 'Sarabun', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🌹 ${config.headline}`, W / 2, capY + 14);

      ctx.fillStyle = "rgba(245, 193, 108, 0.88)";
      ctx.font = "600 15px system-ui, 'Segoe UI', 'Sarabun', sans-serif";
      ctx.fillText(`${config.recipientTitle} · ${config.senderName}`, W / 2, capY + 42);
      ctx.textAlign = "left";

      // 3. Bottom Scrolling Python Code Window (matches reference video!)
      const edX = 14;
      const edY = splitY + 6;
      const edW = W - 28;
      const edH = H - edY - 16;

      // Editor frame
      ctx.save();
      this._roundRect(ctx, edX, edY, edW, edH, 14);
      ctx.fillStyle = "#0c0a12";
      ctx.fill();
      ctx.strokeStyle = "rgba(245, 193, 108, 0.24)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.clip();

      // Editor title bar
      const barH = 34;
      ctx.fillStyle = "#17121f";
      ctx.fillRect(edX, edY, edW, barH);
      ctx.fillStyle = "#ff5f56"; ctx.beginPath(); ctx.arc(edX + 18, edY + 17, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffbd2e"; ctx.beginPath(); ctx.arc(edX + 34, edY + 17, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#27c93f"; ctx.beginPath(); ctx.arc(edX + 50, edY + 17, 5, 0, Math.PI * 2); ctx.fill();

      ctx.font = "600 13px Consolas, monospace";
      ctx.fillStyle = "#e6d8e0";
      ctx.textBaseline = "middle";
      ctx.fillText("flower_ascii.py", edX + 70, edY + 17);
      ctx.fillStyle = "#8d7d8a";
      ctx.textAlign = "right";
      ctx.fillText("Python 3.11", edX + edW - 14, edY + 17);
      ctx.textAlign = "left";

      // Auto-scrolling code area
      const codeTop = edY + barH + 8;
      const statusH = 30;
      const codeH = edH - barH - statusH - 12;
      const lineH = 22;

      ctx.save();
      ctx.beginPath();
      ctx.rect(edX, codeTop, edW, codeH);
      ctx.clip();

      const totalScrollH = TOKENIZED_CODE.length * lineH;
      const scrollY = (t * 28) % totalScrollH;
      ctx.font = "13px Consolas, 'Courier New', monospace";
      ctx.textBaseline = "top";

      const visibleLines = Math.ceil(codeH / lineH) + 2;
      const startLine = Math.floor(scrollY / lineH);
      const offsetY = -(scrollY % lineH);

      for (let i = 0; i < visibleLines; i++) {
        const idx = (startLine + i) % TOKENIZED_CODE.length;
        const y = codeTop + offsetY + i * lineH;
        // Line number
        ctx.fillStyle = "#524658";
        ctx.fillText(String(idx + 1).padStart(3, " "), edX + 12, y);

        let x = edX + 52;
        const toks = TOKENIZED_CODE[idx];
        for (let k = 0; k < toks.length; k++) {
          ctx.fillStyle = toks[k].color;
          ctx.fillText(toks[k].text, x, y);
          x += ctx.measureText(toks[k].text).width;
        }
      }
      ctx.restore();

      // Editor bottom status bar (Frame 001/300 like the video!)
      const stY = edY + edH - statusH;
      ctx.fillStyle = "#17121f";
      ctx.fillRect(edX, stY, edW, statusH);
      ctx.fillStyle = "#f5c16c";
      ctx.font = "bold 12px Consolas, monospace";
      ctx.textBaseline = "middle";
      const cycleFrame = ((frameNum % 300) + 1).toString().padStart(3, "0");
      ctx.fillText(`▶ RUN   Frame ${cycleFrame}/300`, edX + 14, stY + statusH / 2);

      ctx.fillStyle = "#ff8fa3";
      ctx.textAlign = "right";
      const authorTag = (config.creator && config.creator.handle)
        ? `by ${config.creator.name} (@${config.creator.handle}) ♥`
        : "by Thanapat Pisavong (@NOT44353) ♥";
      ctx.fillText(authorTag, edX + edW - 14, stY + statusH / 2);
      ctx.textAlign = "left";
      ctx.restore();
    }

    _drawCover(ctx, src, dx, dy, dw, dh) {
      const srcR = src.width / src.height;
      const dstR = dw / dh;
      let sx = 0, sy = 0, sw = src.width, sh = src.height;
      if (srcR > dstR) {
        sw = src.height * dstR;
        sx = (src.width - sw) * 0.5;
      } else {
        sh = src.width / dstR;
        sy = (src.height - sh) * 0.5;
      }
      ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  window.ReelsCompositor = ReelsCompositor;
})();
