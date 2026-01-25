// script.js

/* =========================================================
   0) BOOTSTRAP (year, scroll progress, motion flags)
   ========================================================= */
(() => {
  "use strict";

  const motionReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches;

  // Year in footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Scroll progress bar (created dynamically, no HTML changes needed)
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  // Inject styles for progress bar (keeps your CSS file cleaner)
  const style = document.createElement("style");
  style.textContent = `
    .scroll-progress{
      position:fixed; top:0; left:0; height:2px; width:0;
      background: linear-gradient(90deg, rgba(186,104,255,.15), rgba(186,104,255,.95), rgba(140,170,255,.75));
      box-shadow: 0 0 18px rgba(186,104,255,.45);
      z-index: 200;
      pointer-events:none;
      transition: width .1s linear;
    }`;
  document.head.appendChild(style);

  const updateProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const p = max > 0 ? (window.scrollY / max) : 0;
    progress.style.width = `${Math.min(1, Math.max(0, p)) * 100}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* =========================================================
     1) MOBILE NAV (hamburger + scrim + close on click/ESC)
     ========================================================= */
  const nav = document.getElementById("siteNav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("primaryNav");
  const navScrim = document.getElementById("navScrim");

  const openNav = () => {
    document.body.classList.add("nav-open");
    navToggle?.setAttribute("aria-expanded", "true");
    navToggle?.setAttribute("aria-label", "Close menu");
  };

  const closeNav = () => {
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open menu");
  };

  navToggle?.addEventListener("click", () => {
    const isOpen = document.body.classList.contains("nav-open");
    isOpen ? closeNav() : openNav();
  });

  navScrim?.addEventListener("click", closeNav);

  navLinks?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      // Close menu after navigation on mobile
      closeNav();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  // Navbar "scrolled" state
  const onScrollNav = () => {
    nav?.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* =========================================================
     2) NAV ACTIVE LINK (IntersectionObserver)
     ========================================================= */
  const sections = document.querySelectorAll("section[id], footer[id]");
  const navAnchors = document.querySelectorAll(".nav-links a");

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        navAnchors.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );

  sections.forEach((section) => navObserver.observe(section));

  /* =========================================================
     3) BACKGROUND PARALLAX (dot grid uses CSS vars)
     ========================================================= */
  let bgTargetX = 0, bgTargetY = 0;
  let bgX = 0, bgY = 0;

  const setBgTarget = (x, y) => {
    bgTargetX = x;
    bgTargetY = y;
  };

  const bgLoop = () => {
    bgX += (bgTargetX - bgX) * 0.08;
    bgY += (bgTargetY - bgY) * 0.08;
    document.documentElement.style.setProperty("--bg-x", `${bgX}px`);
    document.documentElement.style.setProperty("--bg-y", `${bgY}px`);
    requestAnimationFrame(bgLoop);
  };
  requestAnimationFrame(bgLoop);

  document.addEventListener("mousemove", (e) => {
    // Small offset only (keeps it subtle)
    const dx = (e.clientX - window.innerWidth / 2) * -0.02;
    const dy = (e.clientY - window.innerHeight / 2) * -0.02;
    setBgTarget(dx, dy);
  });

  /* =========================================================
     4) CUSTOM CURSOR (Neon trail) - desktop only
     ========================================================= */
  if (!isCoarse) {
    const cursorCanvas = document.getElementById("neon-trail");
    const ctx = cursorCanvas?.getContext("2d");

    if (cursorCanvas && ctx) {
      let w = 0, h = 0;
      const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const cursor = { x: mouse.x, y: mouse.y };

      const points = [];
      const MAX_POINTS = 28;
      const pulses = [];
      const EASING = 0.8;

      let hue = 270;
      let isHover = false;

      const resizeCanvas = () => {
        w = cursorCanvas.width = window.innerWidth;
        h = cursorCanvas.height = window.innerHeight;
      };

      window.addEventListener("resize", resizeCanvas, { passive: true });
      resizeCanvas();

      document.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        hue = (hue + 0.4) % 360;
      });

      document.addEventListener("mousedown", () => {
        pulses.push({ x: cursor.x, y: cursor.y, r: 0, alpha: 1 });
      });

      document.querySelectorAll("a, button, input").forEach((el) => {
        el.addEventListener("mouseenter", () => (isHover = true));
        el.addEventListener("mouseleave", () => (isHover = false));
      });

      const renderCursor = () => {
        ctx.clearRect(0, 0, w, h);

        cursor.x += (mouse.x - cursor.x) * EASING;
        cursor.y += (mouse.y - cursor.y) * EASING;

        points.push({ x: cursor.x, y: cursor.y });
        if (points.length > MAX_POINTS) points.shift();

        // Trail
        for (let i = 1; i < points.length; i++) {
          const a = i / points.length;

          ctx.beginPath();
          ctx.moveTo(points[i - 1].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);

          ctx.strokeStyle = `hsla(${hue},90%,70%,${a * 0.6})`;
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";

          ctx.shadowBlur = 16;
          ctx.shadowColor = `hsla(${hue},100%,75%,1)`;
          ctx.stroke();
        }

        // Pulse rings
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i];
          p.r += 3.5;
          p.alpha -= 0.03;

          if (p.alpha <= 0) {
            pulses.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue},100%,80%,${p.alpha})`;
          ctx.lineWidth = 2;

          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsla(${hue},100%,75%,1)`;
          ctx.stroke();
        }

        // Cursor dot + ring
        const outerRadius = isHover ? 18 : 13;

        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, outerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},100%,70%,1)`;
        ctx.shadowBlur = 22;
        ctx.shadowColor = `hsla(${hue},100%,75%,1)`;
        ctx.fill();

        requestAnimationFrame(renderCursor);
      };

      renderCursor();
    }
  }

  /* =========================================================
     5) SCROLL REVEAL
     ========================================================= */
  const reveals = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("active")),
    { threshold: 0.15 }
  );
  reveals.forEach((section) => revealObserver.observe(section));

  /* =========================================================
     6) NAV SVG GRADIENT (Anime.js)
     ========================================================= */
  if (window.anime) {
    window.anime({
      targets: "#navLight",
      x1: ["-160", "360"],
      x2: ["0", "520"],
      easing: "linear",
      duration: 4000,
      loop: true,
    });
  }

  /* =========================================================
     7) HERO SVG DRAW (Anime.js)
     ========================================================= */
  let heroPlaying = false;

  function playHeroFatma() {
    if (!window.anime || heroPlaying) return;
    heroPlaying = true;

    const lines = document.querySelectorAll(".line-hero");
    lines.forEach((line) => {
      if (typeof line.getTotalLength === "function") {
        const len = line.getTotalLength();
        line.style.strokeDasharray = String(len);
        line.style.strokeDashoffset = String(len);
      }
      line.style.opacity = "0.4";
    });

    window.anime({
      targets: ".line-hero",
      strokeDashoffset: [window.anime.setDashoffset, 0],
      duration: 1600,
      easing: "easeInOutSine",
      delay: window.anime.stagger(140),
      complete: () => {
        lines.forEach((line) => (line.style.opacity = "1"));
        const logo = document.querySelector(".fatma-logo-hero");
        if (logo) logo.style.filter = "drop-shadow(0 0 12px rgba(186,104,255,0.6))";
        heroPlaying = false;
      },
    });
  }

  /* =========================================================
     9) ABOUT CANVAS (Night Bloom)
     ========================================================= */
  function applySoftLimit(value, delta, min, max) {
    const ZONE = 0.06;
    const MIN_K = 0.08;

    if (delta < 0 && value <= min + ZONE) {
      const k = (value - min) / ZONE;
      return delta * Math.max(MIN_K, k);
    }

    if (delta > 0 && value >= max - ZONE) {
      const k = (max - value) / ZONE;
      return delta * Math.max(MIN_K, k);
    }

    return delta;
  }

  (() => {
    const card = document.getElementById("nbCard");
    const canvas = document.getElementById("nbCanvas");
    if (!card || !canvas) return;

    const hint = card.querySelector(".nb-hint");
    if (hint) {
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;
      hint.textContent = isCoarse ? "DRAG TO GROW" : "SCROLL TO GROW";
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let t = 0;

    let growth = 0;
    let target = 0;
    let interacted = false;

    let edgeShake = 0;
    let edgeTarget = 0;

    const MAX_TULIPS = 19;
    const MAX_GRASS = 220;
    const STAR_COUNT = 110;

    const MIN_GROWTH = 0.22;
    const INITIAL_TARGET = 0.40;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, k) => a + (b - a) * k;
    const smooth = (x) => x * x * (3 - 2 * x);

    const stars = [];
    const grass = [];
    const tulips = [];

    const motionOK = !motionReduced;

    function triggerEdgeShake() { edgeTarget = 1; }

    function resize() {
      const r = card.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initScene() {
      stars.length = 0;
      grass.length = 0;
      tulips.length = 0;

      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random() * 0.56,
          r: 0.35 + Math.random() * 1.6,
          sp: 0.4 + Math.random() * 1.2,
          ph: Math.random() * Math.PI * 2
        });
      }

      for (let i = 0; i < MAX_GRASS; i++) {
        grass.push({
          x: Math.random(),
          h: 0.04 + Math.random() * 0.07,
          bend: (Math.random() - 0.5) * 0.6,
          ph: Math.random() * Math.PI * 2
        });
      }

      for (let i = 0; i < MAX_TULIPS; i++) {
        const x = 0.08 + Math.random() * 0.84;
        const appearAt = 0.08 + (i / MAX_TULIPS) * 0.86;
        const size = 0.7 + Math.random() * 0.8;

        const hue = 265 + Math.random() * 35;
        const sat = 55 + Math.random() * 12;
        const light = 70 + Math.random() * 8;

        tulips.push({ x, appearAt, size, hue, sat, light, ph: Math.random() * Math.PI * 2 });
      }
    }

    function setActive() {
      if (!interacted) {
        interacted = true;
        card.classList.add("is-active");
      }
    }

    function drawBackground() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#070812");
      g.addColorStop(0.55, "#0b1330");
      g.addColorStop(1, "#06110f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      if (motionOK) {
        const yBase = H * 0.22;
        const amp = H * 0.03;
        const wave = (x) => yBase + Math.sin(x * 0.012 + t * 0.01) * amp;

        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.moveTo(0, wave(0));
        for (let x = 0; x <= W; x += 10) ctx.lineTo(x, wave(x));
        ctx.lineTo(W, H * 0.42);
        ctx.lineTo(0, H * 0.42);
        ctx.closePath();

        const ag = ctx.createLinearGradient(0, H * 0.18, 0, H * 0.42);
        ag.addColorStop(0, "rgba(120,255,210,0.00)");
        ag.addColorStop(0.4, "rgba(140,170,255,0.30)");
        ag.addColorStop(1, "rgba(120,255,210,0.00)");

        ctx.fillStyle = ag;
        ctx.fill();
        ctx.restore();
      }

      const hg = ctx.createRadialGradient(W * 0.5, H * 0.92, 10, W * 0.5, H * 0.92, W * 0.9);
      hg.addColorStop(0, "rgba(160,140,255,0.16)");
      hg.addColorStop(0.45, "rgba(80,220,180,0.08)");
      hg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStars() {
      for (const s of stars) {
        const tw = motionOK ? (0.35 + 0.35 * Math.sin(s.ph + t * 0.02 * s.sp)) : 0.55;
        ctx.fillStyle = `rgba(255,255,255,${tw})`;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawMoon() {
      const mx = W * 0.73;
      const my = H * 0.20;

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = "rgba(210,190,255,0.7)";
      ctx.shadowBlur = 26;
      ctx.fillStyle = "#efeaff";
      ctx.beginPath();
      ctx.arc(mx, my, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(mx + 12, my - 2, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    }

    function drawGround() {
      const groundY = H * 0.78;

      const gg = ctx.createLinearGradient(0, groundY - 40, 0, H);
      gg.addColorStop(0, "rgba(25,60,45,0.20)");
      gg.addColorStop(0.35, "rgba(16,40,30,0.75)");
      gg.addColorStop(1, "rgba(8,20,16,0.95)");
      ctx.fillStyle = gg;
      ctx.fillRect(0, groundY - 40, W, H - (groundY - 40));

      ctx.strokeStyle = "rgba(170,150,255,0.16)";
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      return groundY;
    }

    function drawGrass(groundY) {
      const gProg = smooth(growth);

      for (const b of grass) {
        const x = b.x * W;
        const maxH = b.h * H * (0.25 + 0.95 * gProg);
        const sway = motionOK ? Math.sin(b.ph + t * 0.03) * (6 + 8 * gProg) : 6;

        ctx.strokeStyle = "rgba(120, 210, 160, 0.28)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(x, groundY + 2);

        const cx = x + sway * (0.6 + b.bend);
        const cy = groundY - maxH * 0.55;
        const tx = x + sway * (0.9 + b.bend);
        const ty = groundY - maxH;

        ctx.quadraticCurveTo(cx, cy, tx, ty);
        ctx.stroke();
      }
    }

    function drawTulip(groundY, tulip) {
      const p = clamp((growth - tulip.appearAt) / 0.18, 0, 1);
      if (p <= 0) return;

      const e = smooth(p);
      const x = tulip.x * W;

      const stemLen = (H * 0.22) * tulip.size * (0.2 + 0.8 * e);
      const sway = motionOK ? Math.sin(tulip.ph + t * 0.025) * (6 + 10 * e) : 6;

      const stemTopX = x + sway;
      const stemTopY = groundY - stemLen;

      ctx.strokeStyle = "rgba(92, 200, 140, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.quadraticCurveTo(x + sway * 0.35, groundY - stemLen * 0.55, stemTopX, stemTopY);
      ctx.stroke();

      ctx.fillStyle = "rgba(95, 210, 150, 0.55)";
      const leafScale = 0.9 + 0.6 * e;

      ctx.beginPath();
      ctx.ellipse(x - 10, groundY - stemLen * 0.38, 10 * leafScale, 22 * leafScale, -0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x + 12, groundY - stemLen * 0.46, 10 * leafScale, 22 * leafScale, 0.7, 0, Math.PI * 2);
      ctx.fill();

      const bud = (H * 0.038) * tulip.size * (0.2 + 0.9 * e);
      const hue = tulip.hue, sat = tulip.sat, light = tulip.light;

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = `hsla(${hue}, ${sat}%, ${light}%, 0.55)`;
      ctx.shadowBlur = 18;

      const petal = `hsla(${hue}, ${sat}%, ${light}%, 0.95)`;
      const petal2 = `hsla(${hue + 8}, ${sat}%, ${light - 6}%, 0.95)`;

      ctx.fillStyle = petal;
      ctx.beginPath();
      ctx.moveTo(stemTopX, stemTopY - bud);
      ctx.bezierCurveTo(stemTopX - bud * 1.1, stemTopY - bud * 0.5, stemTopX - bud * 0.9, stemTopY + bud * 0.7, stemTopX, stemTopY + bud * 0.9);
      ctx.bezierCurveTo(stemTopX + bud * 0.9, stemTopY + bud * 0.7, stemTopX + bud * 1.1, stemTopY - bud * 0.5, stemTopX, stemTopY - bud);
      ctx.fill();

      ctx.globalAlpha = 0.55;
      ctx.shadowBlur = 0;
      ctx.fillStyle = petal2;
      ctx.beginPath();
      ctx.moveTo(stemTopX, stemTopY - bud * 0.78);
      ctx.bezierCurveTo(stemTopX - bud * 0.6, stemTopY - bud * 0.35, stemTopX - bud * 0.5, stemTopY + bud * 0.45, stemTopX, stemTopY + bud * 0.62);
      ctx.bezierCurveTo(stemTopX + bud * 0.5, stemTopY + bud * 0.45, stemTopX + bud * 0.6, stemTopY - bud * 0.35, stemTopX, stemTopY - bud * 0.78);
      ctx.fill();

      ctx.restore();
    }

    function drawAll() {
      edgeShake = lerp(edgeShake, edgeTarget, 0.18);
      edgeTarget *= 0.82;

      const shake = Math.sin(t * 0.6) * 0.8 * edgeShake;
      ctx.save();
      ctx.translate(0, shake);

      growth = lerp(growth, target, 0.085);

      ctx.clearRect(0, 0, W, H);
      drawBackground();
      drawStars();

      if (growth > 0.06) drawMoon();

      const groundY = drawGround();
      drawGrass(groundY);

      for (const tulip of tulips) drawTulip(groundY, tulip);

      ctx.restore();
    }

    function onWheel(e) {
      e.preventDefault();
      setActive();

      let d = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 80);
      d = -d * 0.0018;

      const softened = applySoftLimit(target, d, MIN_GROWTH, 1);

      if (softened !== d && Math.abs(d) > 0.002) triggerEdgeShake();
      target = clamp(target + softened, MIN_GROWTH, 1);
    }

    let drag = null;

    function onPointerDown(e) {
      setActive();
      drag = { y: e.clientY, start: target };
      card.setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e) {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);

      if (!drag) return;

      let d = (-(e.clientY - drag.y)) * 0.0022;
      const softened = applySoftLimit(target, d, MIN_GROWTH, 1);

      if (softened !== d && Math.abs(d) > 0.002) triggerEdgeShake();
      target = clamp(drag.start + softened, MIN_GROWTH, 1);
    }

    function onPointerUp() { drag = null; }

    function onKeyDown(e) {
      setActive();
      if (e.key === "ArrowUp" || e.key === "PageUp") target = clamp(target + 0.05, MIN_GROWTH, 1);
      if (e.key === "ArrowDown" || e.key === "PageDown") target = clamp(target - 0.05, MIN_GROWTH, 1);
      if (e.key === "Home") target = MIN_GROWTH;
      if (e.key === "End") target = 1;
    }

    function loop() {
      t += 1;
      drawAll();
      requestAnimationFrame(loop);
    }

    resize();
    initScene();

    target = INITIAL_TARGET;
    growth = INITIAL_TARGET;

    window.addEventListener("resize", () => resize(), { passive: true });

    card.addEventListener("wheel", onWheel, { passive: false });
    card.addEventListener("pointerdown", onPointerDown);
    card.addEventListener("pointermove", onPointerMove);
    card.addEventListener("pointerup", onPointerUp);
    card.addEventListener("pointercancel", onPointerUp);
    card.addEventListener("keydown", onKeyDown);

    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "40%");

    loop();
  })();

  /* =========================================================
     10) SKILLS FX (tilt vars + sparkles + filter + starfield)
     ========================================================= */
  (() => {
    const cards = [...document.querySelectorAll(".skill-card")];
    const search = document.getElementById("skillSearch");
    const clearBtn = document.getElementById("clearSearch");
    const empty = document.getElementById("skillsEmpty");
    const chips = [...document.querySelectorAll(".chip")];

    const glowMap = {
      csharp: "rgba(168,85,247,.75)",
      c: "rgba(192,132,252,.72)",
      cplusplus: "rgba(124,58,237,.70)",
      java: "rgba(168,85,247,.70)",
      python: "rgba(192,132,252,.78)",
      sql: "rgba(124,58,237,.62)",
      html: "rgba(168,85,247,.72)",
      css: "rgba(192,132,252,.68)",
      js: "rgba(168,85,247,.74)",
      node: "rgba(124,58,237,.70)",
      react: "rgba(192,132,252,.76)",
      docker: "rgba(168,85,247,.70)",
      linux: "rgba(192,132,252,.70)",
      git: "rgba(168,85,247,.70)",
      github: "rgba(124,58,237,.70)",
      vscode: "rgba(192,132,252,.70)",
      visualstudio: "rgba(168,85,247,.70)"
    };

    for (const c of cards) {
      const level = Number(c.dataset.level || 80);
      const clamped = Math.max(40, Math.min(100, level));
      c.style.setProperty("--level", `${clamped}%`);

      const skill = (c.dataset.skill || "").toLowerCase();
      if (glowMap[skill]) c.style.setProperty("--glow", glowMap[skill]);

      // Default shine center
      c.style.setProperty("--mx", "50%");
      c.style.setProperty("--my", "50%");
    }

    function setCardVars(card, e) {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;

      card.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
      card.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);

      // Disable heavy tilt on touch / reduced motion
      if (isCoarse || motionReduced) return;

      const rotY = (x - 0.5) * 14;
      const rotX = (0.5 - y) * 14;
      card.style.setProperty("--ry", `${rotY.toFixed(2)}deg`);
      card.style.setProperty("--rx", `${rotX.toFixed(2)}deg`);

      const tx = (x - 0.5) * 10;
      const ty = (y - 0.5) * 10;
      card.style.setProperty("--tx", `${tx.toFixed(2)}px`);
      card.style.setProperty("--ty", `${ty.toFixed(2)}px`);
    }

    let lastSparkle = 0;
    function spawnSparkle(card, e) {
      if (motionReduced) return;

      const now = performance.now();
      if (now - lastSparkle < 28) return;
      lastSparkle = now;

      const r = card.getBoundingClientRect();
      const s = document.createElement("span");
      s.className = "sparkle";

      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;

      const dx = (Math.random() * 40 - 20).toFixed(0) + "px";
      const dy = (Math.random() * 40 - 22).toFixed(0) + "px";
      s.style.setProperty("--dx", dx);
      s.style.setProperty("--dy", dy);

      card.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }

    for (const card of cards) {
      card.addEventListener("mousemove", (e) => {
        setCardVars(card, e);
        spawnSparkle(card, e);
      });

      card.addEventListener("mouseleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--tx", "0px");
        card.style.setProperty("--ty", "0px");
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "50%");
      });

      card.addEventListener("click", () => {
        if (motionReduced) return;
        card.animate(
          [
            { filter: "saturate(1.0)", transform: getComputedStyle(card).transform },
            { filter: "saturate(1.3)", transform: "translateY(-10px) scale(1.05)" },
            { filter: "saturate(1.05)", transform: getComputedStyle(card).transform }
          ],
          { duration: 360, easing: "cubic-bezier(.2,.9,.2,1)" }
        );
      });
    }

    // Filtering
    let activeFilter = "all";
    function applyFilter() {
      const q = (search?.value || "").trim().toLowerCase();
      let visible = 0;

      for (const card of cards) {
        const group = card.dataset.group || "";
        const name = (card.querySelector("span")?.textContent || "").toLowerCase();
        const key = (card.dataset.skill || "").toLowerCase();

        const byChip = activeFilter === "all" ? true : group === activeFilter;
        const bySearch = !q ? true : (name.includes(q) || key.includes(q));

        const show = byChip && bySearch;
        card.style.display = show ? "" : "none";
        if (show) visible++;
      }

      if (empty) empty.hidden = visible !== 0;
    }

    chips.forEach((ch) => {
      ch.addEventListener("click", () => {
        chips.forEach((x) => x.classList.remove("is-active"));
        ch.classList.add("is-active");
        activeFilter = ch.dataset.filter || "all";
        applyFilter();
      });
    });

    search?.addEventListener("input", applyFilter);
    clearBtn?.addEventListener("click", () => {
      if (!search) return;
      search.value = "";
      search.focus();
      applyFilter();
    });

    applyFilter();

    // Starfield canvas inside Skills
    const fxCanvas = document.getElementById("skillsFx");
    const fxCtx = fxCanvas?.getContext("2d", { alpha: true });
    if (!fxCanvas || !fxCtx) return;

    let W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);
    const stars = [];
    // --- device detection (robust)
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const isNarrow = window.matchMedia("(max-width: 820px)").matches; // mobile/tablet width
    const isTouch =
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      ("ontouchstart" in window);

    // Desktop only: non-touch + not coarse + wide screen
    const isDesktop = !isTouch && !isCoarse && !isNarrow;

    const STAR_COUNT = isDesktop ? 200 : 80; // desktop ↑, mobile same/low

    const LINK_DIST = 120;
    let fxMouse = { x: -9999, y: -9999 };

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function resizeFx() {
      const r = fxCanvas.getBoundingClientRect();
      W = Math.floor(r.width);
      H = Math.floor(r.height);

      fxCanvas.width = Math.floor(W * DPR);
      fxCanvas.height = Math.floor(H * DPR);
      fxCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

      if (!stars.length) {
        for (let i = 0; i < STAR_COUNT; i++) {
          stars.push({
            x: rand(0, W),
            y: rand(0, H),
            vx: rand(-0.18, 0.18),
            vy: rand(-0.14, 0.14),
            r: rand(0.8, 1.8),
            a: rand(0.18, 0.65)
          });
        }
      }
    }

    function drawFx() {
      fxCtx.clearRect(0, 0, W, H);

      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;

        if (s.x < -20) s.x = W + 20;
        if (s.x > W + 20) s.x = -20;
        if (s.y < -20) s.y = H + 20;
        if (s.y > H + 20) s.y = -20;

        if (!motionReduced) {
          const dx = fxMouse.x - s.x;
          const dy = fxMouse.y - s.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 160) {
            s.x -= dx * 0.0006;
            s.y -= dy * 0.0006;
          }
        }

        fxCtx.beginPath();
        fxCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        fxCtx.fillStyle = `rgba(192,132,252,${s.a})`;
        fxCtx.fill();
      }

      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i], b = stars[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * 0.18;
            fxCtx.strokeStyle = `rgba(168,85,247,${alpha})`;
            fxCtx.lineWidth = 1;
            fxCtx.beginPath();
            fxCtx.moveTo(a.x, a.y);
            fxCtx.lineTo(b.x, b.y);
            fxCtx.stroke();
          }
        }
      }

      requestAnimationFrame(drawFx);
    }

    const skillsSection = document.getElementById("skills");
    skillsSection?.addEventListener("mousemove", (e) => {
      const r = skillsSection.getBoundingClientRect();
      fxMouse.x = e.clientX - r.left;
      fxMouse.y = e.clientY - r.top;
    });
    skillsSection?.addEventListener("mouseleave", () => {
      fxMouse.x = -9999; fxMouse.y = -9999;
    });

    window.addEventListener("resize", resizeFx, { passive: true });
    resizeFx();
    requestAnimationFrame(drawFx);
  })();

  /* =========================================================
     11) FOOTER COPY TOAST
     ========================================================= */
  const toast = document.getElementById("copyToast");
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;

    const text = btn.getAttribute("data-copy");
    try {
      await navigator.clipboard.writeText(text);
      toast?.classList.add("show");
      setTimeout(() => toast?.classList.remove("show"), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text || "";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast?.classList.add("show");
      setTimeout(() => toast?.classList.remove("show"), 1200);
    }
  });

  /* =========================================================
     12) BACK TO TOP
     ========================================================= */
  (() => {
    const btn = document.getElementById("toTop");
    if (!btn) return;

    const toggle = () => btn.classList.toggle("show", window.scrollY > 450);
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  })();

  /* =========================================================
     13) DOM READY: hero animations
     ========================================================= */
  document.addEventListener("DOMContentLoaded", () => {
    const heroSVG = document.querySelector(".fatma-logo-hero");
    if (heroSVG) {
      const heroObserver = new IntersectionObserver(
        (entries) => entries.forEach((entry) => entry.isIntersecting && playHeroFatma()),
        { threshold: 0.6 }
      );
      heroObserver.observe(heroSVG);
      playHeroFatma();
    }
  });

})();

/* =========================================================
   Footer Mobile: keep pills INSIDE the "Let's build..." card (bottom)
   ========================================================= */
(() => {
  const mini = document.querySelector(".footer-mini");
  const cardInner = document.querySelector(".footer-card-inner");
  if (!mini || !cardInner) return;

  // Remember original position to restore on desktop if needed
  const originalParent = mini.parentElement;
  const originalNext = mini.nextElementSibling;

  const mq = window.matchMedia("(max-width: 600px)");

  function apply() {
    if (mq.matches) {
      // Ensure pills live inside the card, at the bottom
      cardInner.appendChild(mini);
    } else {
      // Restore original position
      if (originalParent) {
        if (originalNext && originalNext.parentElement === originalParent) {
          originalParent.insertBefore(mini, originalNext);
        } else {
          originalParent.appendChild(mini);
        }
      }
    }
  }

  apply();
  mq.addEventListener("change", apply);
})();


/* =========================================================
   UX Animations Pack (non-breaking additions)
   Paste at the very bottom of script.js
   ========================================================= */

(() => {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  /* ------------------------------
     1) Navbar progress (bottom bar)
  ------------------------------ */
  const nav = document.querySelector(".nav");
  if (nav) {
    let bar = nav.querySelector(".nav-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "nav-progress";
      bar.setAttribute("aria-hidden", "true");
      nav.appendChild(bar);
    }

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollH = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
      const p = scrollH > 0 ? (scrollTop / scrollH) * 100 : 0;

      nav.style.setProperty("--p", `${p}%`);
      nav.classList.toggle("is-scrolled", scrollTop > 8);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (reduceMotion) return;

  /* ------------------------------
     2) Stagger reveal for key elements
  ------------------------------ */
  const revealTargets = [
    ...document.querySelectorAll(".about-text > *"),

    // ✅ exclude avoid: copy toast
    ...document.querySelectorAll(".footer-brand > *:not(.copy-toast)"),

    ...document.querySelectorAll(".footer-card"),
    ...document.querySelectorAll(".footer-actions .footer-btn"),
    ...document.querySelectorAll(".footer-mini .mini-pill"),
  ].filter(Boolean);

  const copyToastEl = document.getElementById("copyToast");
  if (copyToastEl) {
    copyToastEl.classList.remove("fx-reveal", "is-in");
    copyToastEl.style.removeProperty("--d");
  }

  // Add reveal class + stagger delay
  revealTargets.forEach((el, i) => {
    el.classList.add("fx-reveal");
    el.style.setProperty("--d", `${Math.min(i * 60, 520)}ms`);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.14 }
  );

  /* =========================================================
   Projects: Flip-up + blur resolve + sheen (dedicated)
   ========================================================= */
  (() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const section = document.getElementById("projects");
    const cards = [...document.querySelectorAll("#projects .project-card")];
    if (!section || !cards.length) return;

    // Prevent the generic section reveal from hiding the whole projects area
    section.classList.remove("reveal");

    // Set base state + stagger delay
    cards.forEach((card, i) => {
      card.classList.add("proj-reveal");
      card.style.setProperty("--pd", `${Math.min(i * 90, 720)}ms`); // stagger speed here
    });

    // Reduced motion: just show instantly
    if (reduceMotion) {
      cards.forEach((c) => c.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    cards.forEach((c) => io.observe(c));
  })();


  revealTargets.forEach((el) => io.observe(el));

  /* ------------------------------
     3) Magnetic + ripple for buttons/links (desktop only)
     - Doesn't fight your existing hover transforms.
  ------------------------------ */
  const isDesktopPointer = matchMedia("(pointer: fine) and (hover: hover)").matches;

  const magnetize = (el) => {
    // Wrap content in .mag-inner (non-breaking)
    if (!el.querySelector(":scope > .mag-inner")) {
      const wrap = document.createElement("span");
      wrap.className = "mag-inner";
      while (el.firstChild) wrap.appendChild(el.firstChild);
      el.appendChild(wrap);
    }
    el.classList.add("ripple");
  };

  const magneticTargets = [
    ...document.querySelectorAll(".footer-btn"),
    ...document.querySelectorAll("#skills .chip"), // SADECE skills chip'leri
  ];

  magneticTargets.forEach(magnetize);

  if (isDesktopPointer) {
    magneticTargets.forEach((el) => {
      const inner = el.querySelector(":scope > .mag-inner");
      if (!inner) return;

      el.addEventListener("mousemove", (ev) => {
        const r = el.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5;
        const y = (ev.clientY - r.top) / r.height - 0.5;

        // Small, tasteful drift
        inner.style.setProperty("--mx", `${(x * 8).toFixed(2)}px`);
        inner.style.setProperty("--my", `${(y * 8).toFixed(2)}px`);
      });

      el.addEventListener("mouseleave", () => {
        inner.style.setProperty("--mx", `0px`);
        inner.style.setProperty("--my", `0px`);
      });
    });
  }

  // Ripple on click/tap
  document.addEventListener("click", (ev) => {
    const target = ev.target.closest(".ripple");
    if (!target) return;

    const r = target.getBoundingClientRect();
    const rx = ((ev.clientX - r.left) / r.width) * 100;
    const ry = ((ev.clientY - r.top) / r.height) * 100;

    target.style.setProperty("--rx", `${rx}%`);
    target.style.setProperty("--ry", `${ry}%`);
    target.classList.remove("is-rippling");
    void target.offsetWidth; // restart animation
    target.classList.add("is-rippling");

    setTimeout(() => target.classList.remove("is-rippling"), 560);
  });

})();

/* =========================================================
   Background dot parallax (desktop only)
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const finePointer = window.matchMedia?.("(pointer: fine) and (hover: hover)")?.matches;
  if (reduceMotion || !finePointer) return;

  let tx = 0, ty = 0, x = 0, y = 0;

  window.addEventListener("mousemove", (e) => {
    const nx = (e.clientX / window.innerWidth) - 0.5;  // -0.5..0.5
    const ny = (e.clientY / window.innerHeight) - 0.5;
    tx = nx * 18;  // intensity
    ty = ny * 18;
  }, { passive: true });

  function loop() {
    x += (tx - x) * 0.08;
    y += (ty - y) * 0.08;
    document.body.style.setProperty("--bg-x", `${x.toFixed(2)}px`);
    document.body.style.setProperty("--bg-y", `${y.toFixed(2)}px`);
    requestAnimationFrame(loop);
  }
  loop();
})();

/* =========================================================
   HERO VISUAL — Soft Dreamy FX (REPLACE previous HERO JS block)
   ========================================================= */
(() => {
  const heroVisual = document.querySelector(".hero-visual");
  if (!heroVisual) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const isDesktopPointer = window.matchMedia?.("(pointer: fine) and (hover: hover)")?.matches;

  // Inject layers without touching HTML
  let bokeh = heroVisual.querySelector(".hero-bokeh");
  if (!bokeh) {
    bokeh = document.createElement("div");
    bokeh.className = "hero-bokeh";
    bokeh.setAttribute("aria-hidden", "true");
    heroVisual.appendChild(bokeh);
  }

  let spot = heroVisual.querySelector(".hero-spotlight");
  if (!spot) {
    spot = document.createElement("div");
    spot.className = "hero-spotlight";
    spot.setAttribute("aria-hidden", "true");
    heroVisual.appendChild(spot);
  }

  if (reduceMotion) return;

  // Cursor spotlight (desktop only)
  if (isDesktopPointer) {
    heroVisual.addEventListener("mousemove", (e) => {
      const r = heroVisual.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      heroVisual.style.setProperty("--hx", `${x.toFixed(1)}%`);
      heroVisual.style.setProperty("--hy", `${y.toFixed(1)}%`);
      heroVisual.classList.add("is-hot");
    });

    heroVisual.addEventListener("mouseleave", () => {
      heroVisual.classList.remove("is-hot");
      heroVisual.style.setProperty("--hx", "50%");
      heroVisual.style.setProperty("--hy", "40%");
    });
  }

  // Subtle scroll parallax (sets CSS var only => doesn't fight hover)
  const img = heroVisual.querySelector(".hero-img");
  if (!img) return;

  const onScroll = () => {
    const r = heroVisual.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    const t = ((r.top + r.height * 0.3) - vh * 0.3) / (vh * 0.3);
    const clamped = Math.max(-1, Math.min(0.3, t));

    const px = clamped * 6; // dreamy = softer (increase to 10 if you want more)
    img.style.setProperty("--py", `${px.toFixed(1)}px`);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

(() => {
  const hero = document.querySelector(".hero-visual");
  if (!hero) return;

  hero.addEventListener("mousemove", (e) => {
    const r = hero.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    hero.style.setProperty("--hx", `${x}%`);
    hero.style.setProperty("--hy", `${y}%`);
  });

  hero.addEventListener("mouseleave", () => {
    hero.style.setProperty("--hx", "50%");
    hero.style.setProperty("--hy", "45%");
  });
})();

(() => {
  const input = document.getElementById("skillSearch");
  if (!input) return;

  const original = input.getAttribute("placeholder") || "Search skills..";
  const mq = window.matchMedia("(max-width: 600px)");

  const apply = () => {
    input.setAttribute("placeholder", mq.matches ? " Search skills.." : original);
  };

  apply();
  mq.addEventListener("change", apply);
})();

