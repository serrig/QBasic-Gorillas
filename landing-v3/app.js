/* QBasic Gorillas landing: interactions, theme toggle, scroll fallbacks & copy */
(function () {
  'use strict';

  const STORAGE_KEY = 'qbg-color-scheme';
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Dark / Light Theme Toggle */
  const metaScheme = document.querySelector('meta[name="color-scheme"]');
  const themeBtn = document.getElementById('theme-toggle');
  const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function getStoredScheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }
  function setStoredScheme(val) {
    try {
      if (val) localStorage.setItem(STORAGE_KEY, val);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  function getEffectiveScheme() {
    const stored = getStoredScheme();
    if (stored === 'light' || stored === 'dark') return stored;
    return systemDarkQuery.matches ? 'dark' : 'light';
  }
  function applySchemeMeta() {
    if (!metaScheme) return;
    metaScheme.content = getStoredScheme() ?? 'light dark';
  }

  themeBtn?.addEventListener('click', (e) => {
    const current = getEffectiveScheme();
    const target = current === 'dark' ? 'light' : 'dark';
    const systemCurrent = systemDarkQuery.matches ? 'dark' : 'light';
    const nextStored = target === systemCurrent ? null : target;

    const commit = () => {
      setStoredScheme(nextStored);
      applySchemeMeta();
    };

    if (!document.startViewTransition || reducedMotion()) {
      commit();
      return;
    }

    const rect = themeBtn.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;
    const maxR = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(commit);
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxR}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 480,
          easing: 'cubic-bezier(0.2, 0.75, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    }).catch(() => {});
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) applySchemeMeta();
  });

  /* Statement Word Highlight */
  const statementEl = document.querySelector('[data-words]');
  if (statementEl) {
    const highlights = new Set(['ángulo.', 'velocidad.', 'viento.', 'Lanza.', 'agujero.']);
    const words = statementEl.textContent.trim().split(/\s+/);
    statementEl.style.setProperty('--n', String(words.length));
    statementEl.innerHTML = words
      .map((w, i) => `<span class="w${highlights.has(w) ? ' hl' : ''}" style="--i:${i}">${w}</span>`)
      .join(' ');
  }

  /* Scroll Fallbacks (progress bar & sticky header) */
  if (!CSS.supports('animation-timeline: scroll()')) {
    const progressEl = document.querySelector('.scroll-progress');
    const headerEl = document.querySelector('.site-header');
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      if (progressEl) progressEl.style.transform = `scaleX(${pct})`;
      if (headerEl) headerEl.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Hero & Lab Canvases + Motion Toggle */
  const heroCtrl = window.QBG?.initHero?.();
  window.QBG?.initLab?.();

  const motionBtn = document.getElementById('motion-toggle');
  const motionLabel = motionBtn?.querySelector('.frame-btn-label');

  function setMotionState(isPaused) {
    document.documentElement.dataset.motion = isPaused ? 'paused' : 'playing';
    if (motionBtn) motionBtn.dataset.state = isPaused ? 'paused' : 'playing';
    if (motionLabel) motionLabel.textContent = isPaused ? 'Reanudar animaciones' : 'Pausar animaciones';
    heroCtrl?.setPaused(isPaused);
  }

  if (reducedMotion()) {
    setMotionState(true);
  }

  motionBtn?.addEventListener('click', () => {
    const isPaused = motionBtn.dataset.state === 'paused';
    setMotionState(!isPaused);
  });

  /* Interactive Keycaps */
  const keyMap = new Map();
  document.querySelectorAll('.key[data-key]').forEach((el) => {
    keyMap.set(el.dataset.key, el);
    el.addEventListener('pointerdown', () => el.classList.add('is-down'));
    el.addEventListener('pointerup', () => el.classList.remove('is-down'));
    el.addEventListener('pointerleave', () => el.classList.remove('is-down'));
  });
  window.addEventListener('keydown', (e) => {
    const el = keyMap.get(e.key);
    if (el) el.classList.add('is-down');
  });
  window.addEventListener('keyup', (e) => {
    const el = keyMap.get(e.key);
    if (el) el.classList.remove('is-down');
  });

  /* Range Sliders CSS Progress Sync */
  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    const sync = () => {
      slider.style.setProperty('--attr-min', slider.min || '0');
      slider.style.setProperty('--attr-max', slider.max || '100');
      slider.style.setProperty('--control-value', slider.value);
    };
    sync();
    slider.addEventListener('input', sync);
  });

  /* 8-Bit Audio Pills */
  const eqEl = document.querySelector('.eq');
  let eqTimer = null;
  document.querySelectorAll('.pill[data-sound]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sound = btn.dataset.sound;
      const ms = window.QBG?.audio?.play(sound) || 300;
      document.querySelectorAll('.pill.is-active').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      eqEl?.classList.add('is-playing');
      clearTimeout(eqTimer);
      eqTimer = setTimeout(() => {
        btn.classList.remove('is-active');
        eqEl?.classList.remove('is-playing');
      }, Math.max(250, ms));
    });
  });

  /* CRT Filter Toggle */
  const crtToggle = document.getElementById('crt-toggle');
  const crtViz = document.getElementById('crt-viz');
  crtToggle?.addEventListener('change', () => {
    crtViz?.classList.toggle('is-on', crtToggle.checked);
  });

  /* Copy Button (Invoker Commands + Fallback) */
  const copyTimers = new WeakMap();
  let lastCopyMessage = '';

  function legacyCopy(text) {
    const field = Object.assign(document.createElement('textarea'), { value: text });
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
    document.body.append(field);
    field.select();
    try { return document.execCommand('copy'); } finally { field.remove(); }
  }

  function reportCopy(button, ok) {
    const tip = button.nextElementSibling;
    clearTimeout(copyTimers.get(button));
    button.removeAttribute('data-copied');
    button.removeAttribute('data-failed');
    let message = ok ? 'Copiado' : 'Error al copiar';
    if (message === lastCopyMessage) message += '\u00A0';
    lastCopyMessage = message;
    if (tip) tip.textContent = '';
    void button.offsetWidth;
    button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
    if (tip) requestAnimationFrame(() => { tip.textContent = message; });
    copyTimers.set(button, setTimeout(() => {
      button.removeAttribute('data-copied');
      button.removeAttribute('data-failed');
      if (tip) tip.textContent = '';
    }, 2000));
  }

  async function handleCopy(button, target) {
    if (!button || !target) return;
    const text = target.matches('input, textarea') ? target.value : target.innerText.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      reportCopy(button, true);
    } catch {
      reportCopy(button, legacyCopy(text));
    }
  }

  if ('CommandEvent' in window) {
    document.addEventListener('command', (e) => {
      if (e.command === '--copy') handleCopy(e.source, e.target);
    }, true);
  } else {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button[command="--copy"]');
      if (!btn) return;
      const target = document.getElementById(btn.getAttribute('commandfor'));
      if (target) handleCopy(btn, target);
    });
  }

  /* Mobile Menu Auto-Close */
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      try { mobileMenu.hidePopover(); } catch {}
    });
  });
})();
