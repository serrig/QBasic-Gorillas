/* QBasic Gorillas landing: EGA Canvas Engine (Hero CPU-vs-CPU demo & Sandbox Lab) */
(function () {
  'use strict';

  const EGA_COLORS = ['#00AAAA', '#AA0000', '#AAAAAA', '#008888', '#880000', '#666666'];
  const WINDOW_LIT = '#FFFF55';
  const WINDOW_UNLIT = '#334155';
  const GRAVITY_SCALE = 15;
  const WIND_SCALE = 8;
  const VELOCITY_SCALE = 2.6;

  function makeCity(w, h) {
    const count = 9;
    const baseW = Math.floor(w / count);
    const buildings = [];
    let x = 0;

    for (let i = 0; i < count; i++) {
      const bw = i === count - 1 ? w - x : baseW;
      const pct = 0.28 + Math.random() * 0.36;
      const bh = Math.floor(h * pct);
      const by = h - bh;
      const color = EGA_COLORS[Math.floor(Math.random() * EGA_COLORS.length)];
      const cols = Math.max(2, Math.floor((bw - 12) / 14));
      const rows = Math.max(3, Math.floor((bh - 20) / 20));
      const windows = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) row.push(Math.random() < 0.65);
        windows.push(row);
      }
      buildings.push({ x, y: by, width: bw, height: bh, color, windows });
      x += bw;
    }

    const p1Idx = 1;
    const p2Idx = count - 2;
    const b1 = buildings[p1Idx];
    const b2 = buildings[p2Idx];
    // Keep gorillas reasonably clear of tallest middle towers
    const g1 = { player: 1, x: Math.floor(b1.x + b1.width / 2), y: b1.y, isHit: false, arm: 'idle' };
    const g2 = { player: 2, x: Math.floor(b2.x + b2.width / 2), y: b2.y, isHit: false, arm: 'idle' };
    return { buildings, g1, g2 };
  }

  function bakeBuildings(buildings, w, h) {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d');
    for (const b of buildings) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(b.x, b.y, b.width, 3);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.width - 1, b.height - 1);

      const rows = b.windows.length;
      const cols = b.windows[0].length;
      const padX = (b.width - cols * 14 + 6) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = b.windows[r][c] ? WINDOW_LIT : WINDOW_UNLIT;
          ctx.fillRect(b.x + padX + c * 14, b.y + 12 + r * 20, 7, 11);
        }
      }
    }
    return off;
  }

  function carveCrater(offscreen, x, y, radius) {
    const ctx = offscreen.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function isBuildingHit(offscreenCtx, x, y, w, h) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= w || iy < 0 || iy >= h) return false;
    const alpha = offscreenCtx.getImageData(ix, iy, 1, 1).data[3];
    return alpha > 20;
  }

  function drawSky(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#000077');
    grad.addColorStop(0.55, '#0000AA');
    grad.addColorStop(1, '#000044');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#FFFFFF';
    for (let s = 0; s < 36; s++) {
      const sx = (s * 197 + 43) % w;
      const sy = (s * 131 + 17) % Math.floor(h * 0.45);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }

  function drawSun(ctx, sun, frame) {
    ctx.save();
    ctx.translate(sun.x, sun.y);
    ctx.strokeStyle = '#FFFF55';
    ctx.lineWidth = 2.5;
    const offset = (frame * 0.008) % (Math.PI * 2);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12 + offset;
      const r1 = 30;
      const r2 = 39 + (i % 2 === 0 ? 4 : 0);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }

    ctx.fillStyle = '#FFFF55';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (sun.expression === 'shocked') {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-12, -7); ctx.lineTo(-5, 0);
      ctx.moveTo(-5, -7); ctx.lineTo(-12, 0);
      ctx.moveTo(5, -7); ctx.lineTo(12, 0);
      ctx.moveTo(12, -7); ctx.lineTo(5, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-9, 12); ctx.lineTo(-4, 8); ctx.lineTo(0, 12); ctx.lineTo(4, 8); ctx.lineTo(9, 12);
      ctx.stroke();
    } else if (sun.expression === 'surprised') {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-8, -4, 3.5, 0, Math.PI * 2);
      ctx.arc(8, -4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 10, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#000';
      if (sun.blinking) {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-11, -3); ctx.lineTo(-5, -3);
        ctx.moveTo(5, -3); ctx.lineTo(11, -3);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(-8, -4, 2.8, 0, Math.PI * 2);
        ctx.arc(8, -4, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 3, 12, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGorilla(ctx, g, frame, isTurn, victory) {
    if (g.isHit) return;
    ctx.save();
    ctx.translate(g.x, g.y);

    const isP1 = g.player === 1;
    const dir = isP1 ? 1 : -1;
    const breath = Math.sin(frame * 0.08) * 1.1;
    const fur = isP1 ? '#8B4513' : '#475569';
    const chest = isP1 ? '#D2B48C' : '#94A3B8';
    const face = '#E2B184';

    if (isTurn && !victory) {
      ctx.strokeStyle = isP1 ? '#38BDF8' : '#F472B6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    let arm = g.arm;
    if (victory) arm = Math.floor(frame / 10) % 2 === 0 ? 'up_left' : 'up_right';

    ctx.fillStyle = fur;
    ctx.fillRect(-10, -6, 7, 6);
    ctx.fillRect(3, -6, 7, 6);
    ctx.fillRect(-12, -22 + breath, 24, 18);

    ctx.fillStyle = chest;
    ctx.fillRect(-7, -20 + breath, 14, 12);

    ctx.fillStyle = fur;
    ctx.fillRect(-9, -32 + breath, 18, 12);

    ctx.fillStyle = face;
    ctx.fillRect(-6, -29 + breath, 12, 8);

    ctx.fillStyle = '#000';
    const eyeOff = dir * 1.5;
    ctx.fillRect(-4 + eyeOff, -28 + breath, 2, 2);
    ctx.fillRect(2 + eyeOff, -28 + breath, 2, 2);
    ctx.fillRect(-2 + eyeOff, -24 + breath, 4, 1.5);

    ctx.fillStyle = face;
    ctx.fillRect(-11, -30 + breath, 2.5, 4);
    ctx.fillRect(8.5, -30 + breath, 2.5, 4);

    ctx.fillStyle = isP1 ? '#00AAAA' : '#AA0000';
    ctx.fillRect(-9, -33 + breath, 18, 3);

    ctx.fillStyle = fur;
    if (arm === 'up_right') {
      ctx.fillRect(-16, -21 + breath, 5, 14);
      ctx.fillRect(11, -34 + breath, 5, 16);
      ctx.fillRect(12, -37 + breath, 6, 6);
    } else if (arm === 'up_left') {
      ctx.fillRect(11, -21 + breath, 5, 14);
      ctx.fillRect(-16, -34 + breath, 5, 16);
      ctx.fillRect(-18, -37 + breath, 6, 6);
    } else {
      ctx.fillRect(-16, -21 + breath, 5, 14);
      ctx.fillRect(11, -21 + breath, 5, 14);
    }

    ctx.restore();
  }

  function drawBanana(ctx, p) {
    ctx.save();
    for (let i = 0; i < p.trail.length; i++) {
      const pt = p.trail[i];
      ctx.fillStyle = `rgba(255, 255, 85, ${(i / p.trail.length) * 0.6})`;
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(0, 0, 7, -0.3, Math.PI * 0.9);
    ctx.quadraticCurveTo(0, 2, -6, 0);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#AA5500';
    ctx.stroke();
    ctx.fillStyle = '#654321';
    ctx.fillRect(4, -3, 2, 2);
    ctx.restore();
  }

  function spawnParticles(particles, x, y, count, colors) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 190;
      particles.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 40,
        life: 0.45 + Math.random() * 0.45,
        maxLife: 0.9,
        size: 2 + Math.random() * 4,
        color: colors[i % colors.length]
      });
    }
  }

  function solveBallistic(shooter, target, gravity, wind, offCtx, w, h) {
    const dir = shooter.player === 1 ? 1 : -1;
    const sx = shooter.x + dir * 14;
    const sy = shooter.y - 28;
    let best = { angle: 48, power: 58, dist: Infinity };

    for (let a = 25; a <= 78; a += 5) {
      for (let p = 30; p <= 95; p += 5) {
        const rad = (a * Math.PI) / 180;
        const spd = (p / 100) * 160 * VELOCITY_SCALE;
        let vx = Math.cos(rad) * spd * dir;
        let vy = -Math.sin(rad) * spd;
        let x = sx;
        let y = sy;
        const dt = 1 / 60;
        for (let step = 0; step < 360; step++) {
          vx += wind * WIND_SCALE * dt;
          vy += gravity * GRAVITY_SCALE * dt;
          x += vx * dt;
          y += vy * dt;
          if (x < 0 || x > w || y > h) break;
          const d = Math.hypot(x - target.x, y - (target.y - 16));
          if (d < best.dist) best = { angle: a, power: p, dist: d };
          if (d < 16) return { angle: a, power: p };
          if (step > 8 && isBuildingHit(offCtx, x, y, w, h)) break;
        }
      }
    }
    return { angle: best.angle, power: best.power };
  }

  /* Hero autonomous demo */
  function initHero() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const promptEl = document.getElementById('hud-prompt');
    const scoreEl = document.getElementById('hud-score');
    const w = canvas.width;
    const h = canvas.height;

    let city, offscreen, offCtx;
    let wind = 2;
    const gravity = 9.8;
    let turn = 1;
    let scores = [0, 0];
    let frame = 0;
    let shake = 0;
    let sun = { x: w / 2, y: 58, expression: 'normal', timer: 0, blinking: false };
    let projectile = null;
    let particles = [];
    let phase = 'aim'; // 'aim' | 'fly' | 'celebrate'
    let phaseTimer = 0;
    let planned = { angle: 45, power: 60 };
    let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resetRound() {
      city = makeCity(w, h);
      offscreen = bakeBuildings(city.buildings, w, h);
      offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      wind = Math.round((Math.random() - 0.5) * 10);
      turn = Math.random() < 0.5 ? 1 : 2;
      sun.expression = 'normal';
      projectile = null;
      particles = [];
      startAim();
    }

    function startAim() {
      phase = 'aim';
      phaseTimer = 0;
      const shooter = turn === 1 ? city.g1 : city.g2;
      const target = turn === 1 ? city.g2 : city.g1;
      const exact = solveBallistic(shooter, target, gravity, wind, offCtx, w, h);
      // Slight human-like scatter on first shots, accurate on 2nd+
      const jitter = Math.random() < 0.55 ? (Math.random() - 0.5) * 8 : 0;
      planned = {
        angle: Math.max(15, Math.min(82, Math.round(exact.angle + jitter))),
        power: Math.max(25, Math.min(98, Math.round(exact.power + jitter)))
      };
      if (promptEl) promptEl.dataset.side = turn === 1 ? 'left' : 'right';
    }

    function fire() {
      const shooter = turn === 1 ? city.g1 : city.g2;
      const dir = turn === 1 ? 1 : -1;
      const rad = (planned.angle * Math.PI) / 180;
      const spd = (planned.power / 100) * 160 * VELOCITY_SCALE;
      shooter.arm = turn === 1 ? 'up_right' : 'up_left';
      projectile = {
        shooter: turn,
        x: shooter.x + dir * 14,
        y: shooter.y - 28,
        vx: Math.cos(rad) * spd * dir,
        vy: -Math.sin(rad) * spd,
        rot: 0,
        spin: dir * 11,
        trail: [],
        age: 0
      };
      phase = 'fly';
      if (promptEl) promptEl.textContent = '';
    }

    function updatePrompt(t) {
      if (!promptEl) return;
      const line1 = `Ángulo: ${planned.angle}`;
      const line2 = `Fuerza: ${planned.power}`;
      if (t < 0.45) {
        const chars = Math.min(line1.length, Math.floor((t / 0.4) * line1.length));
        promptEl.innerHTML = `${line1.slice(0, chars)}<span class="caret"></span>`;
      } else {
        const chars = Math.min(line2.length, Math.floor(((t - 0.45) / 0.4) * line2.length));
        promptEl.innerHTML = `${line1}\n${line2.slice(0, chars)}<span class="caret"></span>`;
      }
    }

    function step(dt) {
      frame++;
      if (frame % 180 < 8) sun.blinking = true;
      else sun.blinking = false;
      if (sun.timer > 0) {
        sun.timer -= dt;
        if (sun.timer <= 0) sun.expression = 'normal';
      }

      if (phase === 'aim') {
        phaseTimer += dt;
        updatePrompt(phaseTimer);
        if (phaseTimer >= 1.15) fire();
      } else if (phase === 'fly' && projectile) {
        const p = projectile;
        p.age += dt;
        p.vx += wind * WIND_SCALE * dt;
        p.vy += gravity * GRAVITY_SCALE * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 22) p.trail.shift();

        // Sun check
        const sunDist = Math.hypot(p.x - sun.x, p.y - sun.y);
        if (sunDist < 28) {
          sun.expression = 'shocked';
          sun.timer = 1.6;
        } else if (sunDist < 68 && sun.expression === 'normal') {
          sun.expression = 'surprised';
          sun.timer = 0.7;
        }

        // Gorilla hit check
        const targets = p.age > 0.15 ? [city.g1, city.g2] : [turn === 1 ? city.g2 : city.g1];
        for (const g of targets) {
          if (!g.isHit && Math.abs(p.x - g.x) < 18 && p.y >= g.y - 34 && p.y <= g.y + 4) {
            g.isHit = true;
            const winner = g.player === 1 ? 2 : 1;
            scores[winner - 1]++;
            if (scoreEl) scoreEl.textContent = `${scores[0]}>Puntos<${scores[1]}`;
            shake = 14;
            spawnParticles(particles, g.x, g.y - 16, 38, ['#FFFF55', '#FF8C00', '#FF5555', '#FFFFFF']);
            projectile = null;
            phase = 'celebrate';
            phaseTimer = 0;
            return;
          }
        }

        // Building hit check
        if (p.age > 0.08 && isBuildingHit(offCtx, p.x, p.y, w, h)) {
          carveCrater(offscreen, p.x, p.y, 18);
          shake = 6;
          spawnParticles(particles, p.x, p.y, 20, ['#FFFF55', '#AAAAAA', '#FF5555']);
          projectile = null;
          city.g1.arm = 'idle';
          city.g2.arm = 'idle';
          turn = turn === 1 ? 2 : 1;
          startAim();
          return;
        }

        // Out of bounds
        if (p.x < -30 || p.x > w + 30 || p.y > h + 30) {
          projectile = null;
          city.g1.arm = 'idle';
          city.g2.arm = 'idle';
          turn = turn === 1 ? 2 : 1;
          startAim();
        }
      } else if (phase === 'celebrate') {
        phaseTimer += dt;
        if (phaseTimer >= 2.2) resetRound();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.vy += 220 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) particles.splice(i, 1);
      }
    }

    function draw() {
      ctx.save();
      if (shake > 0.4) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake *= 0.88;
      } else {
        shake = 0;
      }

      drawSky(ctx, w, h);
      drawSun(ctx, sun, frame);
      ctx.drawImage(offscreen, 0, 0);
      drawGorilla(ctx, city.g1, frame, turn === 1 && phase === 'aim', phase === 'celebrate');
      drawGorilla(ctx, city.g2, frame, turn === 2 && phase === 'aim', phase === 'celebrate');
      if (projectile) drawBanana(ctx, projectile);

      for (const pt of particles) {
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      }
      ctx.globalAlpha = 1;

      // Wind arrow at bottom
      ctx.fillStyle = '#FF5555';
      ctx.strokeStyle = '#FF5555';
      ctx.lineWidth = 2;
      const wy = h - 14;
      const len = wind * 5;
      if (Math.abs(wind) > 0) {
        ctx.beginPath();
        ctx.moveTo(w / 2 - len, wy);
        ctx.lineTo(w / 2 + len, wy);
        const dir = wind > 0 ? 1 : -1;
        ctx.lineTo(w / 2 + len - dir * 6, wy - 4);
        ctx.moveTo(w / 2 + len, wy);
        ctx.lineTo(w / 2 + len - dir * 6, wy + 4);
        ctx.stroke();
      }
      ctx.restore();
    }

    resetRound();
    draw();

    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused) step(dt);
      draw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    return {
      setPaused(v) { paused = v; }
    };
  }

  /* Interactive sandbox lab */
  function initLab() {
    const canvas = document.getElementById('lab-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const frameWrap = canvas.closest('.lab-frame');
    const windEl = document.getElementById('lab-wind');
    const angleInput = document.getElementById('lab-angle');
    const angleOut = document.getElementById('lab-angle-out');
    const powerInput = document.getElementById('lab-power');
    const powerOut = document.getElementById('lab-power-out');
    const previewToggle = document.getElementById('lab-preview');
    const soundToggle = document.getElementById('lab-sound');
    const statusEl = document.getElementById('lab-status');
    const shotsEl = document.getElementById('lab-shots');
    const hitsEl = document.getElementById('lab-hits');
    const form = document.getElementById('lab-form');
    const resetBtn = document.getElementById('lab-reset');

    let gravity = 9.8;
    let wind = 0;
    let city, offscreen, offCtx;
    let sun = { x: w / 2, y: 56, expression: 'normal', timer: 0, blinking: false };
    let projectile = null;
    let particles = [];
    let frame = 0;
    let shake = 0;
    let shots = 0;
    let hits = 0;
    let dragging = false;

    function playSound(name) {
      if (soundToggle && soundToggle.checked && window.QBG?.audio) {
        window.QBG.audio.play(name);
      }
    }

    function bump(el) {
      if (!el) return;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }

    function updateWindLabel() {
      if (!windEl) return;
      if (wind === 0) windEl.textContent = 'Sin viento';
      else if (wind > 0) windEl.textContent = `Viento → ${wind}`;
      else windEl.textContent = `← ${Math.abs(wind)} Viento`;
    }

    function buildCity() {
      city = makeCity(w, h);
      offscreen = bakeBuildings(city.buildings, w, h);
      offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      wind = Math.round((Math.random() - 0.5) * 10);
      updateWindLabel();
      sun.expression = 'normal';
      projectile = null;
      particles = [];
    }

    function getAngle() { return Number(angleInput?.value ?? 45); }
    function getPower() { return Number(powerInput?.value ?? 60); }

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg;
    }

    function throwBanana() {
      if (projectile) return;
      const angle = getAngle();
      const power = getPower();
      const rad = (angle * Math.PI) / 180;
      const spd = (power / 100) * 160 * VELOCITY_SCALE;

      city.g1.arm = 'up_right';
      projectile = {
        shooter: 1,
        x: city.g1.x + 14,
        y: city.g1.y - 28,
        vx: Math.cos(rad) * spd,
        vy: -Math.sin(rad) * spd,
        rot: 0,
        spin: 11,
        trail: [],
        age: 0
      };
      shots++;
      if (shotsEl) { shotsEl.textContent = String(shots); bump(shotsEl); }
      playSound('throw');
      setStatus(`Lanzado a ${angle}° con fuerza ${power}…`);
    }

    function computePreview() {
      const pts = [];
      const rad = (getAngle() * Math.PI) / 180;
      const spd = (getPower() / 100) * 160 * VELOCITY_SCALE;
      let vx = Math.cos(rad) * spd;
      let vy = -Math.sin(rad) * spd;
      let x = city.g1.x + 14;
      let y = city.g1.y - 28;
      const dt = 1 / 60;
      for (let i = 0; i < 160; i++) {
        if (i % 3 === 0) pts.push({ x, y });
        vx += wind * WIND_SCALE * dt;
        vy += gravity * GRAVITY_SCALE * dt;
        x += vx * dt;
        y += vy * dt;
        if (x < 0 || x > w || y > h) break;
        if (i > 6 && isBuildingHit(offCtx, x, y, w, h)) break;
      }
      return pts;
    }

    function step(dt) {
      frame++;
      sun.blinking = frame % 180 < 8;
      if (sun.timer > 0) {
        sun.timer -= dt;
        if (sun.timer <= 0) sun.expression = 'normal';
      }

      if (projectile) {
        const p = projectile;
        p.age += dt;
        p.vx += wind * WIND_SCALE * dt;
        p.vy += gravity * GRAVITY_SCALE * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 25) p.trail.shift();

        const sunDist = Math.hypot(p.x - sun.x, p.y - sun.y);
        if (sunDist < 28 && sun.expression !== 'shocked') {
          sun.expression = 'shocked';
          sun.timer = 1.6;
          playSound('sun');
        } else if (sunDist < 68 && sun.expression === 'normal') {
          sun.expression = 'surprised';
          sun.timer = 0.7;
          playSound('sun');
        }

        // Target gorilla hit
        if (!city.g2.isHit && Math.abs(p.x - city.g2.x) < 18 && p.y >= city.g2.y - 34 && p.y <= city.g2.y + 4) {
          city.g2.isHit = true;
          hits++;
          if (hitsEl) { hitsEl.textContent = String(hits); bump(hitsEl); }
          shake = 14;
          spawnParticles(particles, city.g2.x, city.g2.y - 16, 40, ['#FFFF55', '#FF8C00', '#FF5555', '#FFFFFF']);
          projectile = null;
          city.g1.arm = 'idle';
          playSound('gorilla');
          setTimeout(() => playSound('victory'), 450);
          setStatus('¡Impacto directo! Pulsa «Nueva ciudad» o vuelve a lanzar.');
          setTimeout(() => {
            if (city.g2.isHit) { buildCity(); }
          }, 1800);
          return;
        }

        // Self hit
        if (p.age > 0.25 && Math.abs(p.x - city.g1.x) < 16 && p.y >= city.g1.y - 34 && p.y <= city.g1.y + 4) {
          shake = 10;
          spawnParticles(particles, city.g1.x, city.g1.y - 16, 25, ['#FFFF55', '#FF5555']);
          projectile = null;
          city.g1.arm = 'idle';
          playSound('gorilla');
          setStatus('¡Fuego amigo! Cuidado con el viento en contra.');
          return;
        }

        if (p.age > 0.08 && isBuildingHit(offCtx, p.x, p.y, w, h)) {
          carveCrater(offscreen, p.x, p.y, 20);
          shake = 6;
          spawnParticles(particles, p.x, p.y, 22, ['#FFFF55', '#AAAAAA', '#FF5555']);
          projectile = null;
          city.g1.arm = 'idle';
          playSound('building');
          setStatus('Cráter abierto en el edificio. ¡Vuelve a intentarlo!');
          return;
        }

        if (p.x < -30 || p.x > w + 30 || p.y > h + 30) {
          projectile = null;
          city.g1.arm = 'idle';
          setStatus('Se perdió en el horizonte. Ajusta ángulo o fuerza.');
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.vy += 220 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) particles.splice(i, 1);
      }
    }

    function draw() {
      ctx.save();
      if (shake > 0.4) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake *= 0.88;
      } else {
        shake = 0;
      }

      drawSky(ctx, w, h);
      drawSun(ctx, sun, frame);
      ctx.drawImage(offscreen, 0, 0);

      // Trajectory preview
      if (!projectile && previewToggle?.checked) {
        const pts = computePreview();
        if (pts.length > 1) {
          ctx.save();
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = 'rgba(255, 255, 85, 0.65)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Aim vector arrow
      if (!projectile) {
        const sx = city.g1.x + 14;
        const sy = city.g1.y - 28;
        const rad = (getAngle() * Math.PI) / 180;
        const len = Math.min(62, 18 + getPower() * 0.42);
        const ax = sx + Math.cos(rad) * len;
        const ay = sy - Math.sin(rad) * len;
        ctx.save();
        ctx.strokeStyle = '#38BDF8';
        ctx.fillStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        const ha = Math.atan2(ay - sy, ax - sx);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 8 * Math.cos(ha - Math.PI / 6), ay - 8 * Math.sin(ha - Math.PI / 6));
        ctx.lineTo(ax - 8 * Math.cos(ha + Math.PI / 6), ay - 8 * Math.sin(ha + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      drawGorilla(ctx, city.g1, frame, !projectile, false);
      drawGorilla(ctx, city.g2, frame, false, false);
      if (projectile) drawBanana(ctx, projectile);

      for (const pt of particles) {
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Slingshot drag aiming on canvas
    function canvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * w,
        y: ((e.clientY - rect.top) / rect.height) * h
      };
    }

    function updateFromPointer(pos) {
      const sx = city.g1.x + 14;
      const sy = city.g1.y - 28;
      // Slingshot: dragging backwards or forwards both feel natural; pull away from target or aim towards target
      let dx = pos.x - sx;
      let dy = sy - pos.y;
      if (dx < -12) { dx = -dx; dy = -dy; } // pull-back slingshot
      const dist = Math.hypot(dx, dy);
      const angle = Math.max(-30, Math.min(90, Math.round((Math.atan2(dy, Math.max(4, dx)) * 180) / Math.PI)));
      const power = Math.max(1, Math.min(100, Math.round((dist / 160) * 100)));

      if (angleInput) {
        angleInput.value = String(angle);
        angleInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (powerInput) {
        powerInput.value = String(power);
        powerInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (projectile) return;
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('is-grab');
      frameWrap?.classList.add('has-dragged');
      updateFromPointer(canvasCoords(e));
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      updateFromPointer(canvasCoords(e));
    });
    canvas.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      canvas.classList.remove('is-grab');
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
      throwBanana();
    });
    canvas.addEventListener('pointercancel', () => {
      dragging = false;
      canvas.classList.remove('is-grab');
    });

    // Form bindings
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      throwBanana();
    });
    form?.addEventListener('change', (e) => {
      const radio = e.target.closest('input[name="gravity"]');
      if (radio) {
        gravity = Number(radio.value) || 9.8;
        const label = radio.parentElement?.querySelector('b')?.textContent || 'Planeta';
        setStatus(`Gravedad cambiada a ${label} (${gravity} m/s²).`);
      }
    });
    resetBtn?.addEventListener('click', () => {
      buildCity();
      setStatus('Ciudad nueva generada.');
    });

    angleInput?.addEventListener('input', () => {
      if (angleOut) angleOut.textContent = `${angleInput.value}°`;
      angleInput.setAttribute('aria-valuetext', `${angleInput.value} grados`);
    });
    powerInput?.addEventListener('input', () => {
      if (powerOut) powerOut.textContent = powerInput.value;
    });

    buildCity();
    draw();

    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      draw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  window.QBG = window.QBG || {};
  window.QBG.initHero = initHero;
  window.QBG.initLab = initLab;
})();
