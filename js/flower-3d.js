/**
 * 3D Z-Buffered ASCII Blooming Rose & Peony Bouquet Engine
 * Inspired by crimson Hanfu embroidery, red Chinese lanterns & tranquil lakeside reflections.
 */
(function () {
  const RAMP = " .'`,-:;~=+*#%@";
  const RAMP_LEN = RAMP.length;

  const EXTRA_CHARS = [
    "", ".", "*", "+", "'", "~", "=", "-", ":", "(", ")", "|", "♥", "✿", "^", "#", "@", "%", "o", ";"
  ];
  const CH_AUTO = 0;
  const CH_DOT = 1, CH_STAR = 2, CH_PLUS = 3, CH_QUOTE = 4;
  const CH_TILDE = 5, CH_EQ = 6, CH_DASH = 7, CH_COLON = 8;
  const CH_LPAR = 9, CH_RPAR = 10, CH_PIPE = 11, CH_HEART = 12, CH_FLOWER = 13;
  const CH_CARET = 14, CH_HASH = 15, CH_AT = 16, CH_PCT = 17, CH_O = 18, CH_SEMI = 19;

  function clamp(v, lo = 0, hi = 1) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function smoothstep(e0, e1, x) {
    const t = clamp((x - e0) / (e1 - e0 || 1));
    return t * t * (3 - 2 * t);
  }

  /**
   * Build 3D point cloud for the blooming rose & ivory-gold peony bouquet.
   * Stride = 14 floats:
   *   [x0, y0, z0,  x1, y1, z1,  nx, ny, nz,  r, g, b,  delay, emissive]
   */
  function buildBouquetGeometry() {
    const pts = [];
    const GOLDEN_ANGLE = 2.399963229728653;

    function pushPoint(x0, y0, z0, x1, y1, z1, nx, ny, nz, r, g, b, delay, em) {
      const len = Math.hypot(nx, ny, nz) || 1;
      pts.push(x0, y0, z0, x1, y1, z1, nx / len, ny / len, nz / len, r, g, b, delay, em);
    }

    function addRose(cx, cy, cz, scale, tiltX, tiltZ, petalCount, cIn, cMid, cEdge, uSteps, vSteps) {
      const ctx = Math.cos(tiltX), stx = Math.sin(tiltX);
      const ctz = Math.cos(tiltZ), stz = Math.sin(tiltZ);

      function orient(lx, ly, lz) {
        const y1 = ly * ctx - lz * stx;
        const z1 = ly * stx + lz * ctx;
        const x2 = lx * ctz - y1 * stz;
        const y2 = lx * stz + y1 * ctz;
        return [cx + x2 * scale, cy + y2 * scale, cz + z1 * scale];
      }

      function orientN(nx, ny, nz) {
        const y1 = ny * ctx - nz * stx;
        const z1 = ny * stx + nz * ctx;
        const x2 = nx * ctz - y1 * stz;
        const y2 = nx * stz + y1 * ctz;
        return [x2, y2, z1];
      }

      for (let k = 0; k < petalCount; k++) {
        const layer = k / Math.max(1, petalCount - 1);
        const phi = k * GOLDEN_ANGLE;
        const cp = Math.cos(phi), sp = Math.sin(phi);

        const pW = 0.18 + 0.27 * layer;
        const pH = 0.30 + 0.36 * layer;
        const rBase = 0.04 + 0.24 * Math.pow(layer, 1.12);
        const angBud = 0.12 + 0.34 * layer;
        const angOpen = 0.25 + 1.20 * Math.pow(layer, 0.90);
        const delay = 0.42 * (1 - layer); // outer petals unfurl gracefully first

        for (let iv = 0; iv <= vSteps; iv++) {
          const v = iv / vSteps;
          const widthEnv = Math.sin(Math.pow(v, 0.64) * Math.PI);
          const halfW = pW * (0.24 + 0.76 * widthEnv);
          const effU = Math.max(2, Math.round(uSteps * (0.45 + 0.55 * widthEnv)));

          for (let iu = -effU; iu <= effU; iu++) {
            const u = iu / effU;
            const cup = -0.10 * (1 - u * u) * Math.sin(v * Math.PI * 0.86);
            const recBud = 0.03 * Math.pow(Math.max(0, v - 0.65), 2);
            const recOpen = (0.15 + 0.17 * layer) * Math.pow(Math.max(0, v - 0.46) / 0.54, 2.1);

            const r0 = rBase * 0.70 + v * pH * Math.sin(angBud) + cup + recBud;
            const y0 = -0.06 * layer + v * pH * Math.cos(angBud);
            const lx0 = r0 * cp - (u * halfW * 0.76) * sp;
            const lz0 = r0 * sp + (u * halfW * 0.76) * cp;

            const r1 = rBase + v * pH * Math.sin(angOpen) + cup + recOpen;
            const y1 = -0.11 * layer + v * pH * Math.cos(angOpen) - 0.08 * recOpen;
            const lx1 = r1 * cp - (u * halfW) * sp;
            const lz1 = r1 * sp + (u * halfW) * cp;

            const lnx = cp * Math.cos(angOpen * 0.62) - (u * 0.48) * sp;
            const lnz = sp * Math.cos(angOpen * 0.62) + (u * 0.48) * cp;
            const lny = 0.46 + 0.48 * v;

            const [px0, py0, pz0] = orient(lx0, y0, lz0);
            const [px1, py1, pz1] = orient(lx1, y1, lz1);
            const [nx, ny, nz] = orientN(lnx, lny, lnz);

            let cr, cg, cb;
            if (v < 0.54) {
              const tc = v / 0.54;
              cr = cIn[0] + (cMid[0] - cIn[0]) * tc;
              cg = cIn[1] + (cMid[1] - cIn[1]) * tc;
              cb = cIn[2] + (cMid[2] - cIn[2]) * tc;
            } else {
              const tc = (v - 0.54) / 0.46;
              cr = cMid[0] + (cEdge[0] - cMid[0]) * tc;
              cg = cMid[1] + (cEdge[1] - cMid[1]) * tc;
              cb = cMid[2] + (cEdge[2] - cMid[2]) * tc;
            }

            const lipHighlight = (v > 0.84 || Math.abs(u) > 0.85) ? 1.15 : 1.0;
            const em = 0.16 + 0.18 * v + 0.10 * (1 - layer);
            pushPoint(
              px0, py0, pz0,
              px1, py1, pz1,
              nx, ny, nz,
              Math.min(1, cr * lipHighlight),
              Math.min(1, cg * lipHighlight),
              Math.min(1, cb * lipHighlight),
              delay,
              em
            );
          }
        }
      }
    }

    // 1. Hero Central Crimson Rose (dense velvety spiral petals)
    addRose(
      0, 0.62, 0.12, 1.04, 0.30, 0, 26,
      [0.44, 0.02, 0.08], [0.96, 0.10, 0.22], [1.0, 0.56, 0.66],
      6, 11
    );

    // 2. Six Companion Roses & Embroidered Ivory-Gold Peonies (matching her Hanfu)
    const companions = [
      [[0.46, 0.03, 0.10], [0.96, 0.14, 0.28], [1.0, 0.58, 0.68]], // Crimson
      [[0.84, 0.56, 0.50], [0.98, 0.86, 0.78], [1.0, 0.98, 0.90]], // Ivory-Gold Peony
      [[0.64, 0.08, 0.26], [0.98, 0.32, 0.52], [1.0, 0.76, 0.86]], // Rose Blush
      [[0.46, 0.02, 0.09], [0.94, 0.12, 0.24], [1.0, 0.54, 0.62]], // Crimson
      [[0.82, 0.54, 0.48], [0.98, 0.86, 0.76], [1.0, 0.98, 0.88]], // Ivory-Gold Peony
      [[0.66, 0.10, 0.28], [0.98, 0.36, 0.56], [1.0, 0.78, 0.88]], // Rose Blush
    ];
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.24;
      const rx = Math.cos(ang) * 0.72;
      const rz = Math.sin(ang) * 0.72;
      const ry = 0.30 + 0.06 * Math.sin(i * 2.1);
      const tiltX = Math.sin(ang) * 0.56;
      const tiltZ = -Math.cos(ang) * 0.56;
      const [cIn, cMid, cEdge] = companions[i];
      addRose(rx, ry, rz, 0.56, tiltX, tiltZ, 16, cIn, cMid, cEdge, 4, 8);
    }

    // 3. Delicate Baby's Breath / Golden Pearl Buds nestled between blooms
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.08;
      const rad = 0.54 + 0.26 * (i % 2);
      const bx = Math.cos(a) * rad;
      const bz = Math.sin(a) * rad;
      const by = 0.52 + 0.12 * Math.sin(i * 1.7);
      for (let j = 0; j < 7; j++) {
        const ga = (j / 7) * Math.PI * 2;
        const ox = Math.cos(ga) * 0.05;
        const oy = Math.sin(ga) * 0.04;
        const oz = Math.sin(ga * 2) * 0.04;
        pushPoint(
          bx * 0.85 + ox, by - 0.05 + oy, bz * 0.85 + oz,
          bx + ox, by + oy, bz + oz,
          ox, 0.9, oz,
          1.0, 0.95, 0.78,
          0.35, 0.68
        );
      }
    }

    // 4. Lush Emerald Rose Leaves around outer rim
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + 0.14;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let iv = 0; iv <= 10; iv++) {
        const v = iv / 10;
        const hw = 0.24 * Math.sin(v * Math.PI);
        for (let iu = -3; iu <= 3; iu++) {
          const u = iu / 3;
          const r = 0.64 + v * 0.68;
          const y = 0.12 - 0.18 * v + 0.09 * Math.sin(v * Math.PI);
          const x = r * ca - (u * hw) * sa;
          const z = r * sa + (u * hw) * ca;
          const vein = Math.abs(u) < 0.18 ? 1.18 : 0.92 + 0.08 * Math.sin(v * 14);
          pushPoint(
            x * 0.86, y + 0.05, z * 0.86,
            x, y, z,
            ca * 0.35, 0.88, sa * 0.35,
            Math.min(1, (0.12 + 0.18 * v) * vein),
            Math.min(1, (0.52 + 0.36 * v) * vein),
            Math.min(1, (0.18 + 0.14 * v) * vein),
            0.0,
            0.16
          );
        }
      }
    }

    // 5. Luxury Pleated Crimson-Gold Bouquet Wrapping Cone (clearly reads as a hand-tied bouquet!)
    {
      const ySteps = 26;
      const aSteps = 72;
      for (let iy = 0; iy <= ySteps; iy++) {
        const v = iy / ySteps; // 0 = bottom flared skirt (-1.02) -> 1 = upper collar (+0.20)
        const y = -1.02 + v * 1.22;
        // Hourglass bouquet wrap: wide top cradling flowers -> cinched waist at v=0.45 -> flared bottom skirt
        const waist = Math.abs(v - 0.44);
        const rBase = v > 0.44
          ? 0.26 + Math.pow((v - 0.44) / 0.56, 1.15) * 0.86
          : 0.26 + Math.pow((0.44 - v) / 0.44, 1.15) * 0.28;
        const isGoldTrim = v > 0.93 || v < 0.06;
        const isRibbonBand = Math.abs(v - 0.44) < 0.065;

        for (let ia = 0; ia < aSteps; ia++) {
          const a = (ia / aSteps) * Math.PI * 2;
          const pleat = Math.sin(a * 9) * (0.02 + 0.05 * waist);
          const r = (isRibbonBand ? rBase * 1.12 : rBase) + pleat;
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r;

          let cr, cg, cb, em;
          if (isRibbonBand || isGoldTrim) {
            cr = 1.0; cg = 0.80; cb = 0.28; em = 0.52;
          } else {
            // Champagne-blush inner glow + deep crimson silk pleats
            const foldLight = 0.82 + 0.18 * Math.cos(a * 9);
            cr = (0.76 + 0.16 * v) * foldLight;
            cg = (0.14 + 0.12 * v) * foldLight;
            cb = (0.24 + 0.14 * v) * foldLight;
            em = 0.18 + 0.10 * v;
          }
          pushPoint(x, y, z, x, y, z, Math.cos(a), 0.15, Math.sin(a), cr, cg, cb, 0, em);
        }
      }
    }

    // 6. Bold Golden Silk Bow Loops + Flowing Tails around Waist
    for (const side of [-1, 1]) {
      for (let s = 0; s <= 28; s++) {
        const tb = (s / 28) * Math.PI * 2;
        for (let w = -2; w <= 2; w++) {
          const bx = side * (0.26 + 0.24 * Math.cos(tb));
          const by = -0.48 + 0.16 * Math.sin(tb) + w * 0.018;
          const bz = 0.30 + 0.06 * Math.cos(tb * 2) + Math.abs(w) * 0.01;
          pushPoint(bx, by, bz, bx, by, bz, bx, by + 0.4, 1.0, 1.0, 0.85, 0.32, 0, 0.62);
        }
      }
      for (let s = 0; s <= 20; s++) {
        const v = s / 20;
        for (let w = -2; w <= 2; w++) {
          const tx = side * (0.12 + 0.30 * v + 0.05 * Math.sin(v * 6.5)) + w * 0.018;
          const ty = -0.54 - 0.54 * v;
          const tz = 0.28 + 0.08 * v;
          pushPoint(tx, ty, tz, tx, ty, tz, 0, 0.2, 1.0, 1.0, 0.78, 0.26, 0, 0.58);
        }
      }
    }

    return {
      data: new Float32Array(pts),
      count: pts.length / 14,
      stride: 14,
    };
  }

  // Share geometry across instances
  const SHARED_BOUQUET = buildBouquetGeometry();

  class Flower3DEngine {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.cols = options.cols || 98;
      this.rows = options.rows || 48;
      this.cellW = options.cellW || 8;
      this.cellH = options.cellH || 11;
      this.charAspect = this.cellH / this.cellW;
      this.cw = this.cols * this.cellW;
      this.ch = this.rows * this.cellH;
      this.horizon = Math.floor(this.rows * 0.62);
      this.centerCol = this.cols * 0.50;
      this.centerRow = this.rows * 0.50;
      this.camZ = 4.9;
      this.fov = Math.min(this.cols * 0.56, this.rows * 1.05);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = this.cw * dpr;
      canvas.height = this.ch * dpr;
      this.ctx.scale(dpr, dpr);
      this.ctx.font = `bold ${this.cellH}px Consolas, 'Cascadia Mono', 'Courier New', monospace`;
      this.ctx.textBaseline = "top";

      const n = this.cols * this.rows;
      this.bufR = new Float32Array(n);
      this.bufG = new Float32Array(n);
      this.bufB = new Float32Array(n);
      this.bufChar = new Uint8Array(n);
      this.zBuf = new Float32Array(n);
      this.mask = new Uint8Array(n);

      this.dragYaw = 0;
      this.dragPitch = 0;
      this.bloomTime = 0;
      this.burstPetals = [];

      this._initAssets();
      this._bindPointer();
    }

    _initAssets() {
      let seed = 20261124;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      // Stars
      this.stars = [];
      for (let i = 0; i < 60; i++) {
        this.stars.push({
          c: Math.floor(rand() * this.cols),
          r: Math.floor(rand() * (this.horizon - 2)),
          phase: rand() * Math.PI * 2,
          speed: 1.2 + rand() * 2.6,
          bright: 0.4 + rand() * 0.6,
        });
      }

      // Floating Red Chinese Lanterns (inspired by her photo)
      this.lanterns = [];
      for (let i = 0; i < 10; i++) {
        this.lanterns.push({
          x: 6 + rand() * (this.cols - 12),
          y: rand() * (this.horizon + 2),
          speed: 0.35 + rand() * 0.55,
          swayAmp: 1.0 + rand() * 1.8,
          swayFreq: 0.35 + rand() * 0.55,
          phase: rand() * Math.PI * 2,
          size: rand() > 0.48 ? 2 : 1,
        });
      }

      // Drifting Rose Petals & Hearts
      this.petals = [];
      for (let i = 0; i < 24; i++) {
        this.petals.push({
          x: rand() * this.cols,
          y: rand() * this.rows,
          vx: -1.6 + rand() * 3.4,
          vy: 1.0 + rand() * 2.4,
          phase: rand() * Math.PI * 2,
          kind: rand() > 0.72 ? "heart" : rand() > 0.4 ? "flower" : "petal",
        });
      }

      // Distant Mountain & Lakeside Pavilion Silhouette (inspired by Ban Rak Thai in her photo!)
      this.hillMap = new Float32Array(this.cols * this.horizon);
      for (let c = 0; c < this.cols; c++) {
        const u = c / this.cols;
        const mtnH =
          2.2 +
          3.8 * Math.exp(-Math.pow((u - 0.18) / 0.16, 2)) +
          3.0 * Math.exp(-Math.pow((u - 0.84) / 0.18, 2)) +
          1.2 * Math.sin(u * 14.0);
        const hInt = Math.max(1, Math.min(this.horizon - 3, Math.round(mtnH)));
        for (let k = 1; k <= hInt; k++) {
          const r = this.horizon - k;
          const isRidge = k === hInt;
          this.hillMap[r * this.cols + c] = isRidge ? 0.85 : 0.42;
        }
      }
      // Tiny warm lakeside village lights along the horizon
      this.villageLights = [];
      for (let i = 0; i < 14; i++) {
        const vc = i < 7 ? Math.floor(4 + rand() * (this.cols * 0.25)) : Math.floor(this.cols * 0.72 + rand() * (this.cols * 0.24));
        this.villageLights.push({ c: vc, r: this.horizon - 1, phase: rand() * 6.28 });
      }
    }

    _bindPointer() {
      let dragging = false, lx = 0, ly = 0;
      this.canvas.addEventListener("pointerdown", (e) => {
        dragging = true;
        lx = e.clientX;
        ly = e.clientY;
        this.canvas.setPointerCapture(e.pointerId);
      });
      this.canvas.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        this.dragYaw += (e.clientX - lx) * 0.012;
        this.dragPitch = clamp(this.dragPitch + (e.clientY - ly) * 0.008, -0.45, 0.55);
        lx = e.clientX;
        ly = e.clientY;
      });
      const end = () => { dragging = false; };
      this.canvas.addEventListener("pointerup", end);
      this.canvas.addEventListener("pointercancel", end);
    }

    resetView() {
      this.dragYaw = 0;
      this.dragPitch = 0;
    }

    triggerBloomShower() {
      this.bloomTime = 0;
      for (let i = 0; i < 36; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 4 + Math.random() * 14;
        this.burstPetals.push({
          x: this.centerCol + (Math.random() - 0.5) * 14,
          y: this.centerRow - 4 + (Math.random() - 0.5) * 10,
          vx: Math.cos(ang) * spd * 1.35,
          vy: Math.sin(ang) * spd * 0.75 - 5.5,
          life: 1.0,
          decay: 0.28 + Math.random() * 0.25,
          isHeart: Math.random() > 0.55,
        });
      }
    }

    _addGlow(cx, cy, radY, gr, gg, gb, strength, sharp = 4.0) {
      const radX = radY * this.charAspect;
      const r0 = Math.max(0, Math.floor(cy - radY));
      const r1 = Math.min(this.rows - 1, Math.ceil(cy + radY));
      const c0 = Math.max(0, Math.floor(cx - radX));
      const c1 = Math.min(this.cols - 1, Math.ceil(cx + radX));
      const invRY2 = 1 / (radY * radY);
      const invRX2 = 1 / (radX * radX);
      for (let r = r0; r <= r1; r++) {
        const dy2 = (r - cy) * (r - cy) * invRY2;
        const off = r * this.cols;
        for (let c = c0; c <= c1; c++) {
          const d2 = dy2 + (c - cx) * (c - cx) * invRX2;
          if (d2 < 1.0) {
            const f = Math.exp(-d2 * sharp) * (1 - d2) * strength;
            const idx = off + c;
            this.bufR[idx] += gr * f;
            this.bufG[idx] += gg * f;
            this.bufB[idx] += gb * f;
          }
        }
      }
    }

    render(t, dt, showLanterns = true) {
      this.bloomTime += dt;
      const COLS = this.cols;
      const ROWS = this.rows;
      const HORIZON = this.horizon;

      this.bufR.fill(0);
      this.bufG.fill(0);
      this.bufB.fill(0);
      this.bufChar.fill(CH_AUTO);
      this.zBuf.fill(-1e9);
      this.mask.fill(0);

      // 1. Stars
      for (let i = 0; i < this.stars.length; i++) {
        const s = this.stars[i];
        const idx = s.r * COLS + s.c;
        if (this.hillMap[idx] > 0) continue;
        const tw = 0.42 + 0.58 * Math.sin(t * s.speed + s.phase);
        const br = s.bright * tw * 0.88;
        this.bufR[idx] = br * 1.0;
        this.bufG[idx] = br * 0.88;
        this.bufB[idx] = br * 0.72;
        this.bufChar[idx] = br > 0.65 ? CH_STAR : br > 0.38 ? CH_PLUS : CH_DOT;
      }

      // 2. Glowing Full Moon (top-right)
      const moonC = COLS * 0.82;
      const moonR = ROWS * 0.14;
      const moonRadY = ROWS * 0.082;
      this._addGlow(moonC, moonR, moonRadY * 2.1, 0.50, 0.42, 0.25, 0.50, 4.2);
      for (let r = 0; r < HORIZON; r++) {
        const dy = (r - moonR) / moonRadY;
        if (Math.abs(dy) > 1.05) continue;
        for (let c = 0; c < COLS; c++) {
          const dx = (c - moonC) / (moonRadY * this.charAspect);
          const d2 = dx * dx + dy * dy;
          if (d2 <= 1.0) {
            const idx = r * COLS + c;
            const rim = Math.sqrt(Math.max(0, 1 - d2));
            const crater = 0.87 + 0.13 * Math.sin(dx * 5 + dy * 3) * Math.cos(dx * 3 - dy * 5);
            const lum = (0.62 + 0.38 * Math.pow(rim, 0.5)) * crater;
            this.bufR[idx] = 1.0 * lum;
            this.bufG[idx] = 0.94 * lum;
            this.bufB[idx] = 0.76 * lum;
            this.bufChar[idx] = CH_AUTO;
          }
        }
      }

      // 3. Floating Red Chinese Lanterns (โคมแดง)
      if (showLanterns) {
        for (let i = 0; i < this.lanterns.length; i++) {
          const L = this.lanterns[i];
          const spanH = HORIZON + 2;
          const ly = ((L.y - t * L.speed) % spanH + spanH) % spanH - 1;
          const lx = L.x + Math.sin(t * L.swayFreq + L.phase) * L.swayAmp;
          if (ly < 0 || ly >= HORIZON - 0.5) continue;
          const fl = 0.86 + 0.14 * Math.sin(t * 6.0 + L.phase);
          const r0 = Math.round(ly), c0 = Math.round(lx);

          if (L.size === 2) {
            this._addGlow(lx, ly, 2.2, 0.98, 0.22, 0.16, 0.38 * fl, 4.2);
            for (let dc = -1; dc <= 1; dc++) {
              const cc = c0 + dc;
              if (cc >= 0 && cc < COLS && r0 >= 0 && r0 < HORIZON) {
                const idx = r0 * COLS + cc;
                const core = dc === 0;
                this.bufR[idx] = (core ? 1.0 : 0.92) * fl;
                this.bufG[idx] = (core ? 0.62 : 0.18) * fl;
                this.bufB[idx] = (core ? 0.22 : 0.14) * fl;
                this.bufChar[idx] = core ? CH_AT : (dc < 0 ? CH_LPAR : CH_RPAR);
              }
            }
            if (r0 + 1 < HORIZON && c0 >= 0 && c0 < COLS) {
              const idx = (r0 + 1) * COLS + c0;
              this.bufR[idx] = 0.96 * fl;
              this.bufG[idx] = 0.74 * fl;
              this.bufB[idx] = 0.24 * fl;
              this.bufChar[idx] = CH_PIPE;
            }
          } else if (r0 >= 0 && r0 < HORIZON && c0 >= 0 && c0 < COLS) {
            this._addGlow(lx, ly, 1.4, 0.92, 0.25, 0.18, 0.26 * fl, 4.5);
            const idx = r0 * COLS + c0;
            this.bufR[idx] = 0.98 * fl;
            this.bufG[idx] = 0.34 * fl;
            this.bufB[idx] = 0.20 * fl;
            this.bufChar[idx] = CH_O;
          }
        }
      }

      // 4. Mountain & Lakeside Village Silhouette
      for (let r = 0; r < HORIZON; r++) {
        const off = r * COLS;
        for (let c = 0; c < COLS; c++) {
          const hv = this.hillMap[off + c];
          if (hv > 0) {
            const idx = off + c;
            const ridge = hv > 0.7;
            this.bufR[idx] = ridge ? 0.24 : 0.12;
            this.bufG[idx] = ridge ? 0.14 : 0.08;
            this.bufB[idx] = ridge ? 0.22 : 0.14;
            this.bufChar[idx] = ridge ? CH_COLON : CH_DOT;
          }
        }
      }
      for (let i = 0; i < this.villageLights.length; i++) {
        const v = this.villageLights[i];
        const tw = 0.65 + 0.35 * Math.sin(t * 2.5 + v.phase);
        const idx = v.r * COLS + v.c;
        this.bufR[idx] = 1.0 * tw;
        this.bufG[idx] = 0.68 * tw;
        this.bufB[idx] = 0.26 * tw;
        this.bufChar[idx] = CH_PLUS;
      }

      // 5. Lakeside Water Ripples & Crimson-Gold Reflections
      for (let r = HORIZON; r < ROWS; r++) {
        const q = (r - HORIZON + 0.4) / (ROWS - HORIZON);
        const wz = 1.0 / (q + 0.08);
        const off = r * COLS;
        for (let c = 0; c < COLS; c++) {
          const idx = off + c;
          const wx = (c - this.centerCol) * 0.14;
          const w1 = Math.sin(wx * 1.4 + wz * 2.1 - t * 2.1);
          const w2 = Math.sin(wx * 2.5 - wz * 2.9 - t * 1.4);
          const wave = 0.5 + 0.5 * (0.62 * w1 + 0.38 * w2);

          let cr = 0.014 + 0.024 * Math.pow(wave, 1.8) * (0.35 + 0.65 * q);
          let cg = 0.016 + 0.028 * Math.pow(wave, 1.8) * (0.35 + 0.65 * q);
          let cb = 0.038 + 0.062 * Math.pow(wave, 1.8) * (0.35 + 0.65 * q);

          // Moonlight reflection path
          const dMoon = Math.abs(c - moonC + Math.sin(wz * 1.8 - t * 2.5) * (1.2 + q * 2.2)) / (2.5 + q * 7.5);
          if (dMoon < 1.8) {
            const mr = Math.exp(-dMoon * dMoon * 2.2) * (0.35 + 0.65 * wave * wave) * (0.38 + 0.54 * (1 - q * 0.35));
            cr += 0.88 * mr;
            cg += 0.80 * mr;
            cb += 0.56 * mr;
          }

          // Crimson & Gold Bouquet Reflection
          const dCenter = Math.abs(c - this.centerCol + Math.sin(wz * 2.2 - t * 2.9) * 1.4) / (11.0 + q * 11.0);
          if (dCenter < 1.8) {
            const kr = Math.exp(-dCenter * dCenter * 2.0) * (0.38 + 0.62 * wave) * (1 - 0.35 * q);
            cr += 0.82 * kr;
            cg += 0.24 * kr;
            cb += 0.28 * kr;
            if (dCenter < 0.45) {
              cr += 0.25 * kr;
              cg += 0.28 * kr;
            }
          }

          this.bufR[idx] = cr;
          this.bufG[idx] = cg;
          this.bufB[idx] = cb;
          const lum = 0.299 * cr + 0.587 * cg + 0.114 * cb;
          this.bufChar[idx] = lum > 0.52 ? CH_EQ : lum > 0.24 ? CH_TILDE : lum > 0.10 ? CH_DASH : CH_DOT;
        }
      }

      // Soft crimson-gold romantic heartlight halo behind bouquet
      const heartPulse = 0.88 + 0.12 * Math.sin(t * 2.2);
      this._addGlow(this.centerCol, this.centerRow - 2.5, 13.5, 0.68, 0.16, 0.24, 0.34 * heartPulse, 3.6);

      // 6. 3D Z-Buffered Blooming Rose & Peony Bouquet
      const bloomMaster = Math.min(1.0, this.bloomTime / 3.4) + 0.035 * Math.sin(t * 1.4);
      const yaw = t * 0.50 + this.dragYaw;
      const pitch = 0.28 + this.dragPitch + 0.04 * Math.sin(t * 1.15);
      const roll = 0.035 * Math.sin(t * 0.95);
      const bobY = 0.055 * Math.sin(t * 1.8);

      const cyA = Math.cos(yaw), syA = Math.sin(yaw);
      const cpA = Math.cos(pitch), spA = Math.sin(pitch);
      const crA = Math.cos(roll), srA = Math.sin(roll);

      // Warm golden lantern key light + cool moonlight rim
      const lx1 = -0.52, ly1 = 0.68, lz1 = 0.52;
      const lx2 = 0.62, ly2 = 0.55, lz2 = 0.56;

      const data = SHARED_BOUQUET.data;
      const count = SHARED_BOUQUET.count;
      const stride = SHARED_BOUQUET.stride;

      for (let i = 0; i < count; i++) {
        const b = i * stride;
        const delay = data[b + 12];
        const bt = smoothstep(delay, Math.min(1.0, delay + 0.58), bloomMaster);

        const px = data[b] + (data[b + 3] - data[b]) * bt;
        const py = data[b + 1] + (data[b + 4] - data[b + 1]) * bt;
        const pz = data[b + 2] + (data[b + 5] - data[b + 2]) * bt;

        // Rotate Y -> X -> Z
        const x1 = px * cyA - pz * syA;
        const z1 = px * syA + pz * cyA;
        const y2 = py * cpA - z1 * spA;
        const z2 = py * spA + z1 * cpA;
        const x3 = x1 * crA - y2 * srA;
        const y3 = x1 * srA + y2 * crA + bobY;
        const z3 = z2;

        const dist = this.camZ - z3;
        if (dist <= 0.5) continue;
        const sc = this.fov / dist;
        const col = Math.round(this.centerCol + x3 * sc * this.charAspect);
        const row = Math.round(this.centerRow - y3 * sc);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue;

        const idx = row * COLS + col;
        if (z3 <= this.zBuf[idx]) continue;
        this.zBuf[idx] = z3;
        this.mask[idx] = 1;

        const nx = data[b + 6], ny = data[b + 7], nz = data[b + 8];
        const nx1 = nx * cyA - nz * syA;
        const nz1 = nx * syA + nz * cyA;
        const ny2 = ny * cpA - nz1 * spA;
        const nz2 = ny * spA + nz1 * cpA;
        const rnx = nx1 * crA - ny2 * srA;
        const rny = nx1 * srA + ny2 * crA;
        const rnz = nz2;

        const ar = data[b + 9], ag = data[b + 10], ab = data[b + 11];
        const em = data[b + 13];

        const diffWarm = Math.max(0.18, rnx * lx1 + rny * ly1 + rnz * lz1) * 0.92;
        const diffMoon = Math.max(0, rnx * lx2 + rny * ly2 + rnz * lz2) * 0.36;
        // Velvet rim sheen along petal edges
        const rim = Math.pow(1 - Math.abs(rnz), 2.1) * 0.36;
        // Specular highlight
        const hx = lx1, hy = ly1, hz = lz1 + 1.0;
        const hInv = 1 / Math.hypot(hx, hy, hz);
        const spec = Math.pow(Math.max(0, (rnx * hx + rny * hy + rnz * hz) * hInv), 12) * 0.38;

        this.bufR[idx] = ar * (0.24 + diffWarm * 1.12 + diffMoon * 0.65 + em * 0.72) + rim * 0.55 + spec * 0.95;
        this.bufG[idx] = ag * (0.22 + diffWarm * 0.92 + diffMoon * 0.75 + em * 0.68) + rim * 0.24 + spec * 0.72;
        this.bufB[idx] = ab * (0.24 + diffWarm * 0.72 + diffMoon * 0.92 + em * 0.65) + rim * 0.34 + spec * 0.52;
        this.bufChar[idx] = CH_AUTO;
      }

      // 7. Ambient Drifting Crimson Petals & Hearts
      for (let i = 0; i < this.petals.length; i++) {
        const p = this.petals[i];
        const px = Math.floor(((p.x + t * p.vx + Math.sin(t * 1.6 + p.phase) * 3.2) % COLS + COLS) % COLS);
        const py = Math.floor(((p.y + t * p.vy) % ROWS + ROWS) % ROWS);
        const idx = py * COLS + px;
        if (this.mask[idx]) continue;
        if (p.kind === "heart") {
          this.bufR[idx] = 1.0; this.bufG[idx] = 0.42; this.bufB[idx] = 0.62;
          this.bufChar[idx] = CH_HEART;
        } else if (p.kind === "flower") {
          this.bufR[idx] = 1.0; this.bufG[idx] = 0.72; this.bufB[idx] = 0.46;
          this.bufChar[idx] = CH_FLOWER;
        } else {
          this.bufR[idx] = 0.98; this.bufG[idx] = 0.28; this.bufB[idx] = 0.40;
          this.bufChar[idx] = CH_TILDE;
        }
      }

      // 8. Interactive Burst Shower Petals
      for (let i = this.burstPetals.length - 1; i >= 0; i--) {
        const bp = this.burstPetals[i];
        bp.x += bp.vx * dt;
        bp.y += bp.vy * dt;
        bp.vy += 9.5 * dt; // gentle gravity
        bp.vx *= 0.985;
        bp.life -= bp.decay * dt;
        if (bp.life <= 0) {
          this.burstPetals.splice(i, 1);
          continue;
        }
        const c = Math.round(bp.x), r = Math.round(bp.y);
        if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
          const idx = r * COLS + c;
          const a = Math.min(1, bp.life * 1.5);
          this.bufR[idx] = 1.0 * a;
          this.bufG[idx] = (bp.isHeart ? 0.45 : 0.78) * a;
          this.bufB[idx] = (bp.isHeart ? 0.64 : 0.36) * a;
          this.bufChar[idx] = bp.isHeart ? CH_HEART : CH_FLOWER;
        }
      }

      // 9. Paint Canvas
      const ctx = this.ctx;
      ctx.fillStyle = "#040207";
      ctx.fillRect(0, 0, this.cw, this.ch);

      for (let r = 0; r < ROWS; r++) {
        const py = r * this.cellH;
        const off = r * COLS;
        for (let c = 0; c < COLS; c++) {
          const idx = off + c;
          const rr = this.bufR[idx], gg = this.bufG[idx], bb = this.bufB[idx];
          const cr = rr >= 1 ? 255 : rr <= 0 ? 0 : (rr * 255) | 0;
          const cg = gg >= 1 ? 255 : gg <= 0 ? 0 : (gg * 255) | 0;
          const cb = bb >= 1 ? 255 : bb <= 0 ? 0 : (bb * 255) | 0;
          const maxC = cr > cg ? (cr > cb ? cr : cb) : (cg > cb ? cg : cb);
          if (maxC < 18) continue;

          const forced = this.bufChar[idx];
          let ch;
          if (forced !== CH_AUTO) {
            ch = EXTRA_CHARS[forced];
          } else {
            const lum = (0.299 * cr + 0.587 * cg + 0.114 * cb) / 255;
            const ri = Math.min(RAMP_LEN - 1, Math.max(1, Math.floor(Math.pow(lum, 0.74) * RAMP_LEN)));
            ch = RAMP[ri];
          }
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx.fillText(ch, c * this.cellW, py);
        }
      }
    }
  }

  window.Flower3DEngine = Flower3DEngine;
})();
