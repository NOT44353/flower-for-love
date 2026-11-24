/**
 * High-Definition True-Color ASCII Portrait Engine
 * Pre-renders the girlfriend's photo to an ultra-crisp offscreen ASCII canvas
 * and animates petal-swirl reveal, golden sparkles, drifting petals & photo blend at 60 FPS.
 */
(function () {
  const PORTRAIT_RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

  class PortraitAsciiEngine {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.cols = options.cols || 96;
      this.rows = options.rows || 72;
      this.cellW = options.cellW || 6.4;
      this.cellH = options.cellH || 9.0;
      this.cw = Math.round(this.cols * this.cellW);
      this.ch = Math.round(this.rows * this.cellH);
      this.asciiBlend = options.asciiBlend ?? 0.88; // 1 = pure ASCII, 0 = pure photo
      this.reveal = 0;
      this.ready = false;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;
      canvas.width = this.cw * dpr;
      canvas.height = this.ch * dpr;
      this.ctx.scale(dpr, dpr);

      // Offscreen pre-baked canvases (for locked 60 FPS animation)
      this.asciiCanvas = document.createElement("canvas");
      this.asciiCanvas.width = this.cw * dpr;
      this.asciiCanvas.height = this.ch * dpr;
      this.asciiCtx = this.asciiCanvas.getContext("2d", { alpha: false });
      this.asciiCtx.scale(dpr, dpr);

      this.photoCanvas = document.createElement("canvas");
      this.photoCanvas.width = this.cw * dpr;
      this.photoCanvas.height = this.ch * dpr;
      this.photoCtx = this.photoCanvas.getContext("2d", { alpha: false });
      this.photoCtx.scale(dpr, dpr);

      this.sparkles = [];
      this.petals = [];
      this._initOverlays();
    }

    _initOverlays() {
      let seed = 889911;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      // Delicate golden sparkles near crown, lantern & floral embroidery areas
      for (let i = 0; i < 22; i++) {
        this.sparkles.push({
          x: (0.12 + rand() * 0.76) * this.cw,
          y: (0.06 + rand() * 0.86) * this.ch,
          phase: rand() * Math.PI * 2,
          speed: 1.8 + rand() * 3.0,
        });
      }
      // Floating crimson rose petals & hearts drifting across portrait frame
      for (let i = 0; i < 18; i++) {
        this.petals.push({
          x: rand() * this.cw,
          y: rand() * this.ch,
          vx: -14 + rand() * 28,
          vy: 14 + rand() * 26,
          phase: rand() * Math.PI * 2,
          isHeart: rand() > 0.62,
        });
      }
    }

    loadImageSource(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this._bakePortrait(img);
          this.ready = true;
          this.reveal = 0;
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    }

    _bakePortrait(img) {
      const targetRatio = this.cw / this.ch;
      const srcRatio = img.width / img.height;

      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (srcRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) * 0.5;
      } else {
        sh = img.width / targetRatio;
        // Bias slightly upward to preserve her crown & face framing
        sy = Math.max(0, (img.height - sh) * 0.22);
      }

      // 1. Bake clean framed photo canvas
      const pCtx = this.photoCtx;
      pCtx.fillStyle = "#040207";
      pCtx.fillRect(0, 0, this.cw, this.ch);
      pCtx.drawImage(img, sx, sy, sw, sh, 0, 0, this.cw, this.ch);

      // Soft warm vignette over photo so it harmonizes with dark terminal aesthetic
      const vig = pCtx.createRadialGradient(
        this.cw * 0.52, this.ch * 0.44, this.cw * 0.28,
        this.cw * 0.5, this.ch * 0.5, this.cw * 0.78
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(6,2,10,0.62)");
      pCtx.fillStyle = vig;
      pCtx.fillRect(0, 0, this.cw, this.ch);

      // 2. Sample exact grid dimensions onto tiny canvas to extract pixels
      const sampler = document.createElement("canvas");
      sampler.width = this.cols;
      sampler.height = this.rows;
      const sCtx = sampler.getContext("2d", { willReadFrequently: true });
      sCtx.drawImage(img, sx, sy, sw, sh, 0, 0, this.cols, this.rows);
      const imgData = sCtx.getImageData(0, 0, this.cols, this.rows).data;

      // 3. Paint high-definition True-Color ASCII Portrait onto offscreen asciiCanvas
      const aCtx = this.asciiCtx;
      aCtx.fillStyle = "#040207";
      aCtx.fillRect(0, 0, this.cw, this.ch);
      aCtx.font = `bold ${Math.round(this.cellH + 0.5)}px Consolas, 'Cascadia Mono', 'Courier New', monospace`;
      aCtx.textBaseline = "top";

      const nRamp = PORTRAIT_RAMP.length;
      for (let r = 0; r < this.rows; r++) {
        const py = r * this.cellH;
        const vy = (r / (this.rows - 1)) * 2 - 1;
        for (let c = 0; c < this.cols; c++) {
          const i = (r * this.cols + c) * 4;
          let R = imgData[i];
          let G = imgData[i + 1];
          let B = imgData[i + 2];

          // Gentle vibrance + facial readability lift on dark terminal background
          const avg = (R + G + B) / 3;
          R = Math.min(255, Math.max(0, avg + (R - avg) * 1.18 + 6));
          G = Math.min(255, Math.max(0, avg + (G - avg) * 1.12 + 4));
          B = Math.min(255, Math.max(0, avg + (B - avg) * 1.10 + 2));

          // Soft oval vignette so her silhouette melts gracefully into the velvet dark frame
          const vx = (c / (this.cols - 1)) * 2 - 1;
          const dist2 = vx * vx * 0.92 + (vy + 0.04) * (vy + 0.04) * 0.85;
          const fade = dist2 > 0.72 ? Math.max(0.22, 1 - (dist2 - 0.72) * 0.85) : 1.0;

          const fR = Math.round(Math.pow(R / 255, 0.88) * 255 * fade);
          const fG = Math.round(Math.pow(G / 255, 0.88) * 255 * fade);
          const fB = Math.round(Math.pow(B / 255, 0.88) * 255 * fade);

          const lum = (0.299 * fR + 0.587 * fG + 0.114 * fB) / 255;
          if (lum < 0.04) continue;
          const ri = Math.min(nRamp - 1, Math.max(1, Math.floor(Math.pow(lum, 0.86) * nRamp)));

          aCtx.fillStyle = `rgb(${fR},${fG},${fB})`;
          aCtx.fillText(PORTRAIT_RAMP[ri], c * this.cellW, py);
        }
      }
    }

    replayReveal() {
      this.reveal = 0;
    }

    setBlend(val) {
      this.asciiBlend = Math.max(0, Math.min(1, val));
    }

    render(t, dt) {
      const ctx = this.ctx;
      ctx.fillStyle = "#040207";
      ctx.fillRect(0, 0, this.cw, this.ch);
      if (!this.ready) return;

      this.reveal = Math.min(1, this.reveal + dt * 0.48);
      const easeReveal = 1 - Math.pow(1 - this.reveal, 3);

      ctx.save();
      if (easeReveal < 0.999) {
        // Radial petal-bloom reveal clip expanding from her face outward
        const maxR = Math.hypot(this.cw, this.ch) * 0.75;
        ctx.beginPath();
        ctx.arc(this.cw * 0.52, this.ch * 0.42, maxR * easeReveal, 0, Math.PI * 2);
        ctx.clip();
      }

      // Blend Photo & High-Def True-Color ASCII smoothly
      if (this.asciiBlend < 0.995) {
        ctx.globalAlpha = 1;
        ctx.drawImage(this.photoCanvas, 0, 0, this.cw, this.ch);
      }
      if (this.asciiBlend > 0.005) {
        ctx.globalAlpha = this.asciiBlend;
        ctx.drawImage(this.asciiCanvas, 0, 0, this.cw, this.ch);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Golden reveal ring shimmer during transition
      if (easeReveal > 0.02 && easeReveal < 0.98) {
        const ringR = Math.hypot(this.cw, this.ch) * 0.75 * easeReveal;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 200, 120, ${(1 - easeReveal) * 0.75})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.cw * 0.52, this.ch * 0.42, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Subtle animated golden sparkles
      ctx.font = "bold 12px Consolas, monospace";
      ctx.textBaseline = "middle";
      for (let i = 0; i < this.sparkles.length; i++) {
        const s = this.sparkles[i];
        const pulse = Math.pow(0.5 + 0.5 * Math.sin(t * s.speed + s.phase), 4);
        if (pulse > 0.25) {
          ctx.fillStyle = `rgba(255, 224, 150, ${pulse * 0.9})`;
          ctx.fillText(pulse > 0.7 ? "✦" : "*", s.x, s.y);
        }
      }

      // Gently drifting ASCII rose petals & hearts
      ctx.font = "bold 13px Consolas, monospace";
      for (let i = 0; i < this.petals.length; i++) {
        const p = this.petals[i];
        const px = ((p.x + t * p.vx + Math.sin(t * 1.5 + p.phase) * 18) % this.cw + this.cw) % this.cw;
        const py = ((p.y + t * p.vy) % this.ch + this.ch) % this.ch;
        ctx.fillStyle = p.isHeart ? "rgba(255, 110, 152, 0.85)" : "rgba(255, 76, 102, 0.8)";
        ctx.fillText(p.isHeart ? "♥" : "✿", px, py);
      }

      // Decorative ASCII crimson-gold corner ornaments
      ctx.font = "bold 11px Consolas, monospace";
      ctx.fillStyle = "rgba(245, 193, 108, 0.55)";
      ctx.fillText("╔══ ✿", 8, 12);
      ctx.fillText("✿ ══╗", this.cw - 48, 12);
      ctx.fillText("╚══ ♥", 8, this.ch - 12);
      ctx.fillText("♥ ══╝", this.cw - 48, this.ch - 12);
    }
  }

  window.PortraitAsciiEngine = PortraitAsciiEngine;
})();
