/**
 * Main Application Controller for Flower-for-Love 3D ASCII Gift
 */
(function () {
  const STORAGE_KEY = "flower_for_love_custom_v3";

  function loadConfig() {
    const base = Object.assign(
      {
        recipientTitle: "แด่ ลำดวน สิงห์ใหญ่ ♥",
        headline: "ส่งช่อดอกไม้ใต้แสงโคมแดงให้ลำดวนนะ",
        message: "ถึงจะไม่ได้ยื่นให้ต่อหน้า แต่ตั้งใจเขียนโค้ดปั้นกุหลาบทุกกลีบให้ผลิบานเพื่อ ลำดวน สิงห์ใหญ่ คนเดียวเลยนะ ขอบคุณที่น่ารักและเป็นรอยยิ้มของเค้าในทุกๆ วัน ♥",
        senderName: "น๊อต — Thanapat Pisavong (NOT44353)",
        badgeText: "3D ASCII ROSE BOUQUET · FOR ลำดวน สิงห์ใหญ่",
        defaultMode: "duet",
        defaultAsciiBlend: 0.88,
        creator: {
          name: "Thanapat Pisavong",
          thaiName: "ธนภัทร พิศวงศ์",
          nickname: "น๊อต",
          handle: "NOT44353",
          role: "Full Stack Developer & Cloud Systems Engineer",
          avatarUrl: "https://not44353.vercel.app/profile2.jpg",
          portfolioUrl: "https://not44353.vercel.app/",
          githubUrl: "https://github.com/NOT44353",
          linkedinUrl: "https://www.linkedin.com/in/thanapat-pisavong-0a8a80367",
          facebookUrl: "https://www.facebook.com/thanaput.pisawong",
        },
      },
      window.GIFT_CONFIG || {}
    );
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") {
        Object.assign(base, saved);
      }
    } catch (_) {}
    return base;
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          recipientTitle: cfg.recipientTitle,
          headline: cfg.headline,
          message: cfg.message,
          senderName: cfg.senderName,
        })
      );
    } catch (_) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    const config = loadConfig();

    // DOM refs
    const bouquetDuetCanvas = document.getElementById("bouquetCanvas");
    const portraitCanvas = document.getElementById("portraitCanvas");
    const bouquetSoloCanvas = document.getElementById("bouquetSoloCanvas");
    const reelsCanvas = document.getElementById("reelsCanvas");

    const hudBouquet = document.getElementById("hudBouquet");
    const hudSolo = document.getElementById("hudSolo");
    const hudReels = document.getElementById("hudReels");

    const tabBtns = document.querySelectorAll(".tab-btn");
    const views = {
      duet: document.getElementById("view-duet"),
      bouquet: document.getElementById("view-bouquet"),
      reels: document.getElementById("view-reels"),
    };

    // Instantiate Engines
    const bouquetEngine = new window.Flower3DEngine(bouquetDuetCanvas, {
      cols: 96,
      rows: 50,
      cellW: 8,
      cellH: 11,
    });
    const soloEngine = new window.Flower3DEngine(bouquetSoloCanvas, {
      cols: 124,
      rows: 48,
      cellW: 8,
      cellH: 11,
    });
    const portraitEngine = new window.PortraitAsciiEngine(portraitCanvas, {
      cols: 96,
      rows: 76,
      cellW: 6.4,
      cellH: 9.0,
      asciiBlend: config.defaultAsciiBlend,
    });
    const reelsCompositor = new window.ReelsCompositor(reelsCanvas);

    // Load Portrait Photo (Data URI first for offline file:// safety, fallback to assets/girlfriend.jpg)
    const photoSrc =
      (window.PORTRAIT_ASSET && window.PORTRAIT_ASSET.dataUri) || "assets/girlfriend.jpg";
    portraitEngine.loadImageSource(photoSrc).catch((err) => {
      console.error("Failed to load portrait photo:", err);
    });

    // Apply Romantic Texts
    function syncLoveText() {
      document.getElementById("loveBadge").textContent = config.badgeText;
      document.getElementById("loveRecipient").textContent = config.recipientTitle;
      document.getElementById("loveHeadline").textContent = config.headline;
      document.getElementById("loveMessage").textContent = config.message;
      document.getElementById("loveSender").textContent = `— ${config.senderName}`;

      if (config.creator) {
        const c = config.creator;
        const nameEl = document.getElementById("creatorName");
        const roleEl = document.getElementById("creatorRole");
        const avatarEl = document.getElementById("creatorAvatar");
        if (nameEl) nameEl.textContent = `${c.name} (${c.thaiName} · ${c.nickname})`;
        if (roleEl) roleEl.textContent = `${c.role} · @${c.handle}`;
        if (avatarEl && c.avatarUrl) avatarEl.src = c.avatarUrl;
        const pLink = document.getElementById("linkPortfolio");
        const gLink = document.getElementById("linkGithub");
        const lLink = document.getElementById("linkLinkedin");
        const fLink = document.getElementById("linkFacebook");
        if (pLink && c.portfolioUrl) pLink.href = c.portfolioUrl;
        if (gLink && c.githubUrl) { gLink.href = c.githubUrl; gLink.textContent = `GitHub @${c.handle}`; }
        if (lLink && c.linkedinUrl) lLink.href = c.linkedinUrl;
        if (fLink && c.facebookUrl) fLink.href = c.facebookUrl;
      }
    }
    syncLoveText();

    // State
    let activeMode = views[config.defaultMode] ? config.defaultMode : "duet";
    let playing = true;
    let showLanterns = true;
    let speed = 1.0;
    let simTime = 0;
    let frameNum = 0;

    function switchMode(mode) {
      activeMode = mode;
      tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
      Object.entries(views).forEach(([key, el]) => {
        if (el) el.classList.toggle("active", key === mode);
      });
    }
    switchMode(activeMode);

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => switchMode(btn.dataset.mode));
    });

    // Interactive Controls
    const btnPlay = document.getElementById("btnPlay");
    btnPlay.addEventListener("click", () => {
      playing = !playing;
      btnPlay.textContent = playing ? "⏸ พักไว้ก่อน" : "▶ เล่นต่อ";
    });

    const btnLanterns = document.getElementById("btnLanterns");
    btnLanterns.addEventListener("click", () => {
      showLanterns = !showLanterns;
      btnLanterns.textContent = showLanterns ? "🏮 โคมแดง: เปิด" : "🏮 โคมแดง: ปิด";
    });

    const speedSlider = document.getElementById("speedSlider");
    const speedVal = document.getElementById("speedVal");
    speedSlider.addEventListener("input", () => {
      speed = parseFloat(speedSlider.value);
      speedVal.textContent = `${speed.toFixed(1)}x`;
    });

    const blendSlider = document.getElementById("blendSlider");
    const blendVal = document.getElementById("blendVal");
    blendSlider.value = Math.round(config.defaultAsciiBlend * 100);
    blendVal.textContent = `${blendSlider.value}%`;
    blendSlider.addEventListener("input", () => {
      const pct = parseInt(blendSlider.value, 10);
      blendVal.textContent = `${pct}%`;
      portraitEngine.setBlend(pct / 100);
    });

    document.getElementById("btnResetView").addEventListener("click", () => {
      bouquetEngine.resetView();
      soloEngine.resetView();
    });

    document.getElementById("btnReplayPortrait").addEventListener("click", () => {
      portraitEngine.replayReveal();
    });

    function triggerShower() {
      bouquetEngine.triggerBloomShower();
      soloEngine.triggerBloomShower();
      portraitEngine.replayReveal();
    }
    document.getElementById("btnSendFlowers").addEventListener("click", triggerShower);
    document.getElementById("btnHeaderShower").addEventListener("click", triggerShower);

    // Customize Modal
    const modal = document.getElementById("customModal");
    const inRecipient = document.getElementById("inRecipient");
    const inHeadline = document.getElementById("inHeadline");
    const inMessage = document.getElementById("inMessage");
    const inSender = document.getElementById("inSender");
    const inPhoto = document.getElementById("inPhoto");
    const photoStatus = document.getElementById("photoStatus");

    function openModal() {
      inRecipient.value = config.recipientTitle;
      inHeadline.value = config.headline;
      inMessage.value = config.message;
      inSender.value = config.senderName;
      modal.classList.add("open");
    }

    function closeModal() {
      modal.classList.remove("open");
    }

    document.getElementById("btnOpenCustomize").addEventListener("click", openModal);
    document.getElementById("btnCardCustomize").addEventListener("click", openModal);
    document.getElementById("btnCloseModal").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.getElementById("btnSaveCustom").addEventListener("click", () => {
      config.recipientTitle = inRecipient.value.trim() || config.recipientTitle;
      config.headline = inHeadline.value.trim() || config.headline;
      config.message = inMessage.value.trim() || config.message;
      config.senderName = inSender.value.trim() || config.senderName;
      saveConfig(config);
      syncLoveText();
      closeModal();
      triggerShower();
    });

    inPhoto.addEventListener("change", () => {
      const file = inPhoto.files && inPhoto.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          portraitEngine.loadImageSource(reader.result).then(() => {
            photoStatus.textContent = `เปลี่ยนเป็น ${file.name} แล้ว`;
          });
        }
      };
      reader.readAsDataURL(file);
    });

    // Reels Video Recorder (.webm)
    const btnRecord = document.getElementById("btnRecordReels");
    let mediaRecorder = null;
    let recChunks = [];
    let recTimer = null;

    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
      if (recTimer) {
        clearTimeout(recTimer);
        recTimer = null;
      }
    }

    btnRecord.addEventListener("click", () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        stopRecording();
        return;
      }
      if (typeof MediaRecorder === "undefined" || !reelsCanvas.captureStream) {
        alert("เบราว์เซอร์นี้ยังไม่รองรับการอัดคลิปจาก Canvas โดยตรงครับ");
        return;
      }
      // Replay bloom + reveal right at start of recording!
      bouquetEngine.triggerBloomShower();
      portraitEngine.replayReveal();

      recChunks = [];
      const stream = reelsCanvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      mediaRecorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        btnRecord.classList.remove("btn-recording");
        btnRecord.textContent = "⏺ อัดคลิป Reels (10 วินาที)";
        const blob = new Blob(recChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "flower-for-love-reels.webm";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      };
      mediaRecorder.start();
      btnRecord.classList.add("btn-recording");
      btnRecord.textContent = "⏹ กำลังอัดคลิป... (กดเพื่อหยุด)";
      recTimer = setTimeout(stopRecording, 10000);
    });

    // Main Render Loop
    let lastTs = performance.now();
    let fpsCount = 0;
    let fpsStart = lastTs;

    function tick(now) {
      const rawDt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const dt = playing ? rawDt * speed : 0;
      simTime += dt;
      if (playing) frameNum++;

      if (activeMode === "duet") {
        bouquetEngine.render(simTime, dt, showLanterns);
        portraitEngine.render(simTime, dt);
      } else if (activeMode === "bouquet") {
        soloEngine.render(simTime, dt, showLanterns);
      } else if (activeMode === "reels") {
        bouquetEngine.render(simTime, dt, showLanterns);
        portraitEngine.render(simTime, dt);
        reelsCompositor.render(simTime, bouquetDuetCanvas, portraitCanvas, config, frameNum);
      }

      fpsCount++;
      if (now - fpsStart >= 500) {
        const fps = Math.round((fpsCount * 1000) / (now - fpsStart));
        hudBouquet.textContent = `96×50 · ${fps} fps`;
        hudSolo.textContent = `124×48 · ${fps} fps`;
        const cyc = ((frameNum % 300) + 1).toString().padStart(3, "0");
        hudReels.textContent = `Frame ${cyc}/300 · ${fps} fps`;
        fpsCount = 0;
        fpsStart = now;
      }

      requestAnimationFrame(tick);
    }

    // Start immediately with a fresh bloom
    bouquetEngine.render(0, 0, true);
    requestAnimationFrame(tick);
  });
})();
