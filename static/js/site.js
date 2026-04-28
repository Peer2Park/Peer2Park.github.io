/* =====================================================================
   Peer2Park — interactive site script (Signal Mesh)
   ===================================================================== */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(hover: none)").matches;

  /* -------------------------------------------------------------------
     Videos — autoplay fallback handling
     ------------------------------------------------------------------- */
  function setupVideos() {
    document.querySelectorAll("video").forEach((video) => {
      const panel = video.closest(".video-panel");
      const fallback = panel?.querySelector("[data-video-fallback]");

      const showFallback = (message) => {
        if (!fallback) return;
        fallback.hidden = false;
        fallback.textContent = message;
      };

      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");

      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {
          video.controls = true;
          showFallback("Autoplay was blocked. Use the controls to start playback.");
        });
      }

      video.addEventListener("error", () => {
        video.controls = true;
        showFallback("This browser couldn't decode the embedded video.");
      });

      video.addEventListener("loadeddata", () => {
        if (fallback) fallback.hidden = true;
      });
    });
  }

  /* -------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------- */
  function setupRevealAnimations() {
    const elements = document.querySelectorAll(".od-reveal");
    if (!elements.length) return;

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /* -------------------------------------------------------------------
     Contact form redirect wiring (FormSubmit)
     ------------------------------------------------------------------- */
  function setupContactForms() {
    const params = new URLSearchParams(window.location.search);

    document.querySelectorAll("[data-contact-form]").forEach((form) => {
      const nextInput = form.querySelector('input[name="_next"]');
      const urlInput = form.querySelector('input[name="_url"]');
      const status = form.closest(".od-form-shell")?.querySelector("[data-form-status]") || null;

      if (window.location.protocol !== "file:") {
        const redirectUrl = new URL(window.location.href);
        redirectUrl.searchParams.set("submitted", "1");
        redirectUrl.hash = "contact-form";

        if (nextInput) nextInput.value = redirectUrl.toString();
        if (urlInput) urlInput.value = window.location.href.split("#")[0];
      }

      if (params.get("submitted") === "1" && status) {
        status.hidden = false;
        form.scrollIntoView({ block: "start" });
      }
    });
  }

  /* -------------------------------------------------------------------
     Sticky navbar — scrolled state
     ------------------------------------------------------------------- */
  function setupShellBar() {
    const bar = document.querySelector(".shell-bar");
    if (!bar) return;

    const onScroll = () => {
      bar.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* -------------------------------------------------------------------
     Magnetic cursor
     ------------------------------------------------------------------- */
  function setupCursor() {
    if (isCoarsePointer || prefersReducedMotion) return;

    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    const ring = document.createElement("div");
    ring.className = "cursor-ring";

    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    window.addEventListener("mousemove", (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    document.addEventListener("mousedown", () => ring.classList.add("is-active"));
    document.addEventListener("mouseup", () => ring.classList.remove("is-active"));

    document.querySelectorAll("a, button, .od-card, .od-step, .od-tech-item, .od-counter, .od-stat, .od-btn").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-active"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-active"));
    });

    // Smooth ring follow
    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* -------------------------------------------------------------------
     Hex-grid canvas — the hero background
     ------------------------------------------------------------------- */
  function setupHexCanvas() {
    const canvas = document.querySelector("[data-hex-canvas]");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    let width = 0;
    let height = 0;
    let hexes = [];
    let pulses = [];
    let mouseX = -9999;
    let mouseY = -9999;
    let lastPulseAt = 0;
    let visible = true;

    const HEX_SIZE = 34;            // circumradius
    const HEX_H = Math.sqrt(3) * HEX_SIZE; // vertical distance between rows
    const HEX_W = 2 * HEX_SIZE;
    const ROW_SPACING = HEX_H;
    const COL_SPACING = 1.5 * HEX_SIZE;

    const COLORS = [
      [95, 227, 255],   // cyan
      [157, 123, 255],  // violet
      [255, 61, 168],   // magenta
      [125, 255, 151],  // lime
      [255, 181, 71],   // amber
    ];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildGrid();
    }

    function rebuildGrid() {
      hexes = [];
      const cols = Math.ceil(width / COL_SPACING) + 2;
      const rows = Math.ceil(height / ROW_SPACING) + 2;
      for (let col = -1; col < cols; col++) {
        for (let row = -1; row < rows; row++) {
          const x = col * COL_SPACING;
          const y = row * ROW_SPACING + (col % 2 ? ROW_SPACING / 2 : 0);
          hexes.push({ x, y, brightness: 0, base: 0.028 + Math.random() * 0.018 });
        }
      }
    }

    function drawHex(x, y, size, fill, stroke, strokeAlpha) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.globalAlpha = strokeAlpha;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    function spawnPulse(forceX, forceY) {
      const x = forceX ?? Math.random() * width;
      const y = forceY ?? Math.random() * height;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      pulses.push({
        x,
        y,
        r: 0,
        maxR: 140 + Math.random() * 80,
        color,
        life: 1,
      });
    }

    function render(t) {
      if (!visible) {
        requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      // Draw base hex grid
      const radius = 220;
      for (const h of hexes) {
        let brightness = h.base;

        // Mouse proximity
        const dx = h.x - mouseX;
        const dy = h.y - mouseY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < radius) {
          brightness += (1 - d / radius) * 0.32;
        }

        // Pulse proximity (heats cells inside pulse ring)
        for (const p of pulses) {
          const pdx = h.x - p.x;
          const pdy = h.y - p.y;
          const pd = Math.sqrt(pdx * pdx + pdy * pdy);
          const ringWidth = 28;
          if (Math.abs(pd - p.r) < ringWidth) {
            const intensity = (1 - Math.abs(pd - p.r) / ringWidth) * p.life * 0.85;
            brightness += intensity;
            h._tint = p.color;
          }
        }

        const tint = h._tint || [95, 227, 255];
        const alpha = Math.min(brightness, 0.9);
        const [r, g, b] = tint;
        drawHex(
          h.x,
          h.y,
          HEX_SIZE * 0.88,
          alpha > 0.04 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : null,
          `rgba(${r}, ${g}, ${b}, ${Math.min(alpha * 1.6, 0.9)})`,
          Math.min(alpha * 2.2, 0.5)
        );
        h._tint = null;
      }

      // Draw + advance pulses
      pulses = pulses.filter((p) => {
        p.r += 1.8;
        p.life = 1 - p.r / p.maxR;

        const [r, g, b] = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${p.life * 0.28})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Core dot
        if (p.r < 18) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
          ctx.shadowBlur = 18;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        return p.life > 0;
      });

      // Ambient pulse spawning
      if (t - lastPulseAt > 1200 + Math.random() * 1200) {
        spawnPulse();
        lastPulseAt = t;
      }

      requestAnimationFrame(render);
    }

    window.addEventListener("resize", resize);
    window.addEventListener(
      "mousemove",
      (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      },
      { passive: true }
    );
    window.addEventListener(
      "mouseleave",
      () => {
        mouseX = -9999;
        mouseY = -9999;
      },
      { passive: true }
    );

    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      spawnPulse(e.clientX - rect.left, e.clientY - rect.top);
    });

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visible = entry.isIntersecting;
          });
        },
        { threshold: 0 }
      );
      io.observe(canvas);
    }

    resize();
    // Seed a few pulses so it feels alive immediately
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnPulse(), 200 + i * 420);
    }
    requestAnimationFrame(render);
  }

  /* -------------------------------------------------------------------
     Hero headline — word swap
     ------------------------------------------------------------------- */
  function setupWordSwap() {
    const swap = document.querySelector("[data-word-swap]");
    if (!swap) return;
    const spans = Array.from(swap.querySelectorAll("span"));
    if (!spans.length) return;

    // Size the container to fit the widest word
    const measure = document.createElement("span");
    measure.style.cssText = "visibility:hidden;position:absolute;white-space:nowrap;";
    measure.className = swap.className;
    document.body.appendChild(measure);
    let maxW = 0;
    spans.forEach((s) => {
      measure.textContent = s.textContent;
      measure.style.font = getComputedStyle(spans[0]).font;
      maxW = Math.max(maxW, measure.getBoundingClientRect().width);
    });
    measure.remove();
    swap.style.width = `${Math.ceil(maxW) + 4}px`;
    swap.style.display = "inline-block";
    swap.style.minHeight = "1em";

    let i = 0;
    spans[0].classList.add("is-active");

    if (prefersReducedMotion) return;

    setInterval(() => {
      spans[i].classList.remove("is-active");
      spans[i].classList.add("is-exit");
      const next = (i + 1) % spans.length;
      setTimeout(() => {
        spans[i].classList.remove("is-exit");
        i = next;
        spans[i].classList.add("is-active");
      }, 420);
    }, 2600);
  }

  /* -------------------------------------------------------------------
     Terminal — illustrative signal flow
     ------------------------------------------------------------------- */
  function setupTerminal() {
    const body = document.querySelector("[data-terminal-body]");
    if (!body) return;

    const streets = [
      "Campus Ave",
      "Main St",
      "Bruin Walk",
      "Westwood Blvd",
      "Sunset Dr",
      "Hilgard Pl",
      "Tiverton Ave",
      "Gayley Ave",
      "Kinross Alley",
      "Le Conte Rd",
      "Charles E Young",
      "Broxton Ct",
      "Weyburn Ave",
    ];

    const tags = [
      { tag: "CAPTURE", klass: "detect", msg: () => `Passing camera view sampled near ${pick(streets)}` },
      { tag: "DETECT", klass: "detect", msg: () => `Opening candidate scored ${(0.88 + Math.random() * 0.1).toFixed(2)} confidence` },
      { tag: "GROUP", klass: "share", msg: () => `Grouped into H3 cell ${rollingH3()} and checked for duplicates` },
      { tag: "SURFACE", klass: "fresh", msg: () => `Freshest candidate moved to the top of the nearby queue` },
      { tag: "EXPIRE", klass: "decay", msg: () => `Older candidate dropped after freshness window elapsed` },
      { tag: "CONFIRM", klass: "park", msg: () => `Nearby driver action strengthened the signal ranking` },
    ];

    const seeds = [
      { tag: "BOOT", klass: "detect", msg: "Example session started — on-device model ready" },
      { tag: "MODEL", klass: "detect", msg: "Structured output configured: location, time, confidence, state" },
      { tag: "QUEUE", klass: "share", msg: "Freshness ranking active for nearby candidates" },
    ];

    function pick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function rollingH3() {
      const hex = "0123456789abcdef";
      let s = "88";
      for (let i = 0; i < 6; i++) s += hex[Math.floor(Math.random() * 16)];
      return s;
    }

    let sequence = 1;

    function addLine(entry) {
      const line = document.createElement("div");
      line.className = "od-terminal-line";
      const msg = typeof entry.msg === "function" ? entry.msg() : entry.msg;
      const step = `ex-${String(sequence).padStart(3, "0")}`;
      sequence++;
      line.innerHTML = `<span class="t-time">${step}</span><span class="t-tag ${entry.klass}">${entry.tag}</span><span class="t-msg">${msg}</span>`;
      body.appendChild(line);

      // Trim so it stays inside the panel
      const max = 14;
      while (body.children.length > max) {
        body.firstChild.remove();
      }
    }

    // Seed
    seeds.forEach((e, idx) => setTimeout(() => addLine(e), idx * 140));

    // Stream
    setInterval(() => {
      addLine(pick(tags));
    }, 1400);
  }

  /* -------------------------------------------------------------------
     Counters — animate when in view
     ------------------------------------------------------------------- */
  function setupCounters() {
    const nodes = document.querySelectorAll("[data-counter]");
    if (!nodes.length) return;

    const animate = (el) => {
      const target = parseFloat(el.dataset.counter);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const duration = parseInt(el.dataset.duration || "1400", 10);
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const start = performance.now();

      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const value = target * eased;
        el.textContent = prefix + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      nodes.forEach(animate);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animate(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    nodes.forEach((n) => io.observe(n));
  }

  /* -------------------------------------------------------------------
     Manifesto lines reveal
     ------------------------------------------------------------------- */
  function setupManifestoLines() {
    const lines = document.querySelectorAll("[data-manifesto-line]");
    if (!lines.length) return;

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      lines.forEach((l) => l.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );
    lines.forEach((l) => io.observe(l));
  }

  /* -------------------------------------------------------------------
     Interactive freshness timeline
     ------------------------------------------------------------------- */
  function setupFreshnessTimeline() {
    const timeline = document.querySelector("[data-timeline]");
    if (!timeline) return;
    const events = Array.from(timeline.querySelectorAll(".od-tl-event"));
    const btn = document.querySelector("[data-timeline-play]");
    const elapsedEl = document.querySelector("[data-timeline-elapsed]");

    let playing = false;
    let playIdx = 0;
    let elapsedSec = 0;
    let elapsedTimer = null;
    let stepTimer = null;

    function reset() {
      events.forEach((e) => e.classList.remove("is-active", "is-passed"));
      timeline.style.setProperty("--timeline-progress", "0%");
      elapsedSec = 0;
      if (elapsedEl) elapsedEl.innerHTML = `Elapsed <strong>0s</strong>`;
    }

    function setProgress(idx) {
      const pct = ((idx + 1) / events.length) * 100;
      timeline.style.setProperty("--timeline-progress", `${pct}%`);
    }

    function step() {
      if (!playing) return;
      if (playIdx > 0) events[playIdx - 1].classList.replace("is-active", "is-passed");
      if (playIdx >= events.length) {
        stop();
        return;
      }
      events[playIdx].classList.add("is-active");
      setProgress(playIdx);
      playIdx++;
      stepTimer = setTimeout(step, 1400);
    }

    function play() {
      reset();
      playing = true;
      playIdx = 0;
      if (btn) btn.textContent = "■ Replaying example";
      elapsedTimer = setInterval(() => {
        elapsedSec++;
        if (elapsedEl) elapsedEl.innerHTML = `Elapsed <strong>${elapsedSec}s</strong>`;
      }, 1000);
      step();
    }

    function stop() {
      playing = false;
      if (stepTimer) clearTimeout(stepTimer);
      if (elapsedTimer) clearInterval(elapsedTimer);
      if (btn) btn.innerHTML = `<svg viewBox="0 0 12 12"><polygon points="2,1 11,6 2,11"/></svg> Replay example`;
    }

    if (btn) {
      btn.addEventListener("click", () => {
        if (playing) {
          stop();
          reset();
        } else {
          play();
        }
      });
    }

    // Auto-play once when scrolled into view
    if ("IntersectionObserver" in window && !prefersReducedMotion) {
      let fired = false;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !fired) {
              fired = true;
              play();
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.35 }
      );
      io.observe(timeline);
    } else {
      events.forEach((e) => e.classList.add("is-passed"));
      timeline.style.setProperty("--timeline-progress", "100%");
    }
  }

  /* -------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------- */
  function boot() {
    setupVideos();
    setupRevealAnimations();
    setupContactForms();
    setupShellBar();
    setupCursor();
    setupHexCanvas();
    setupWordSwap();
    setupTerminal();
    setupCounters();
    setupManifestoLines();
    setupFreshnessTimeline();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
