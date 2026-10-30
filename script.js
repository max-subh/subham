const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Semi-implicit Euler Spring Physics Primitive ──────────────────────────
const spring = (initial = 0, opts = {}) => {
  const stiffness = opts.stiffness ?? 180;
  const damping = opts.damping ?? 20;
  const mass = opts.mass ?? 1;
  const PRECISION = opts.precision ?? 0.001;
  let cur = initial;
  let vel = 0;
  let tgt = initial;
  return {
    set(t) { tgt = t; },
    jump(v) { cur = v; tgt = v; vel = 0; },
    step(dt) {
      const f = -stiffness * (cur - tgt);
      const dv = (f - damping * vel) / mass;
      vel += dv * dt;
      cur += vel * dt;
      if (Math.abs(vel) < PRECISION && Math.abs(cur - tgt) < PRECISION) {
        cur = tgt; vel = 0;
      }
      return cur;
    },
    get value() { return cur; },
  };
};

// ── Theme Switcher with Circular Reveal ───────────────────────────────────
(() => {
  const KEY = 'theme';
  const root = document.documentElement;
  const btn = document.querySelector('[data-theme-toggle]');
  const meta = document.querySelector('meta[name="theme-color"]');
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const COLOR = { light: '#f4f5ed', dark: '#0a0b09' };

  const current = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

  const apply = (t, persist) => {
    if (t === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    if (meta) meta.setAttribute('content', COLOR[t]);
    if (btn) btn.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    if (persist) {
      try { localStorage.setItem(KEY, t); } catch (_) { }
    }
  };

  apply(current(), false);

  if (btn) {
    btn.addEventListener('click', () => {
      const next = current() === 'light' ? 'dark' : 'light';
      const supported = typeof document.startViewTransition === 'function';
      if (!supported || reducedMotion()) {
        apply(next, true);
        return;
      }
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const endR = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );
      root.style.setProperty('--theme-clip-x', `${x}px`);
      root.style.setProperty('--theme-clip-y', `${y}px`);
      root.style.setProperty('--theme-clip-r', `${endR}px`);
      document.startViewTransition(() => apply(next, true));
    });
  }

  const onMqChange = (e) => {
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch (_) { }
    if (!stored) apply(e.matches ? 'light' : 'dark', false);
  };
  if (mq.addEventListener) mq.addEventListener('change', onMqChange);
  else if (mq.addListener) mq.addListener(onMqChange);
})();

// ── Realtime IST Clock ────────────────────────────────────────────────────
(() => {
  const els = document.querySelectorAll('[data-ist-clock]');
  if (!els.length) return;
  const fmt = (d) => {
    const ist = new Date(d.getTime() + (d.getTimezoneOffset() + 330) * 60000);
    const h = String(ist.getHours()).padStart(2, '0');
    const m = String(ist.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };
  const tick = () => {
    const t = fmt(new Date());
    els.forEach((el) => {
      const suffix = el.dataset.suffix ?? ' IST';
      el.innerHTML =
        `<span class="clock__br" aria-hidden="true">[</span>` +
        `<span class="clock__time" data-text="${t}">${t}</span>` +
        `<span class="clock__suffix">${suffix}</span>` +
        `<span class="clock__br" aria-hidden="true">]</span>`;
    });
  };
  tick();
  setInterval(tick, 30000);
})();

// ── Hero Subtitle Typewriter Engine (Auto-Typing Loop) ─────────────────────
(() => {
  const target = document.querySelector('[data-typed-hero]');
  if (!target) return;

  const roles = [
    'UG STUDENT', 
    'FULL-STACK DEVELOPER',
    'GRAPHICS DESIGNER',
    'CREATIVE BUILDER'
  ];

  let roleIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  const TYPE_SPEED = 90;
  const DELETE_SPEED = 45;
  const PAUSE_TIME = 1600;

  const tick = () => {
    const currentText = roles[roleIdx];

    if (isDeleting) {
      charIdx--;
      target.textContent = currentText.substring(0, charIdx);
    } else {
      charIdx++;
      target.textContent = currentText.substring(0, charIdx);
    }

    let delay = isDeleting ? DELETE_SPEED : TYPE_SPEED;

    if (!isDeleting && charIdx === currentText.length) {
      delay = PAUSE_TIME;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      roleIdx = (roleIdx + 1) % roles.length;
      delay = 350;
    }

    setTimeout(tick, delay);
  };

  tick();
})();

// ── Hero Meta & CTA Fade In ───────────────────────────────────────────────
(() => {
  const reduced = reducedMotion();
  document.querySelectorAll('[data-fade-in]').forEach((el) => {
    if (reduced) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }
    const delay = el.dataset.delay || '0s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 1s cubic-bezier(.2,.7,.2,1) ${delay}, transform 1s cubic-bezier(.2,.7,.2,1) ${delay}`;
    requestAnimationFrame(() => setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 120));
  });
})();

// ── Magnetic Buttons ──────────────────────────────────────────────────────
(() => {
  if (window.matchMedia('(pointer: coarse)').matches || reducedMotion()) return;
  const targets = [...document.querySelectorAll('[data-magnetic]')].map((el) => ({
    el,
    range: Number(el.dataset.range || 80),
    strength: Number(el.dataset.strength || 0.35),
  }));
  if (!targets.length) return;
  const onMove = (e) => {
    targets.forEach(({ el, range, strength }) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < range + Math.max(r.width, r.height) / 2) {
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      } else {
        el.style.transform = 'translate(0,0)';
      }
    });
  };
  const reset = () => targets.forEach(({ el }) => { el.style.transform = 'translate(0,0)'; });
  window.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseleave', reset);
})();

// ── Reveal on Scroll ──────────────────────────────────────────────────────
(() => {
  const els = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));
})();

// ── Scramble Decoders ─────────────────────────────────────────────────────
(() => {
  const els = document.querySelectorAll('[data-scramble]');
  if (!els.length || reducedMotion()) return;
  const GLYPHS = '#<>/[]{}=+*x10_';
  const DURATION = 900;
  const run = (el) => {
    const final = el.textContent;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / DURATION);
      const settled = Math.floor(p * final.length);
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const ch = final[i];
        out += i < settled || !/[a-z0-9]/i.test(ch)
          ? ch
          : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        run(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
})();

// ── Horizontal Work Rail Scroll ───────────────────────────────────────────
(() => {
  const rail = document.querySelector('[data-work-rail]');
  const track = document.querySelector('[data-work-track]');
  if (!rail || !track) return;

  let enabled = window.innerWidth > 760;
  let maxX = 0;
  const measure = () => { maxX = Math.max(0, track.scrollWidth - window.innerWidth); };
  const apply = () => {
    if (!enabled) {
      track.style.transform = '';
      return;
    }
    const r = rail.getBoundingClientRect();
    const total = rail.offsetHeight - window.innerHeight;
    if (total <= 0 || maxX <= 0) {
      track.style.transform = '';
      return;
    }
    const p = Math.min(1, Math.max(0, -r.top / total));
    track.style.transform = `translate3d(${-p * maxX}px, 0, 0)`;
  };
  measure();

  let raf;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(apply);
  };
  const onResize = () => {
    enabled = window.innerWidth > 760;
    measure();
    apply();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  apply();
})();

// ── Flow Field Generative Hero Canvas (Video Style Active Reaction) ────────
(() => {
  const canvas = document.querySelector('[data-hero-canvas]');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0, h = 0;
  const resize = () => {
    const r = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const COUNT = 160;
  const parts = [];
  const spawn = (p) => {
    p.x = Math.random() * w;
    p.y = Math.random() * h;
    p.px = p.x;
    p.py = p.y;
    p.sp = 18 + Math.random() * 26;
    p.isYellow = Math.random() < 0.45;
    p.a = 0.2 + Math.random() * 0.5;
    p.life = 3 + Math.random() * 6;
  };

  for (let i = 0; i < COUNT; i++) {
    const p = {};
    spawn(p);
    p.life *= Math.random();
    parts.push(p);
  }

  let mx = -9999, my = -9999;
  let targetMx = -9999, targetMy = -9999;

  window.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    if (e.clientY >= r.top && e.clientY <= r.bottom) {
      targetMx = e.clientX - r.left;
      targetMy = e.clientY - r.top;
    } else {
      targetMx = -9999;
      targetMy = -9999;
    }
  }, { passive: true });

  const field = (x, y, t) =>
    Math.sin(x * 0.0016 + t * 0.2) * 1.6 +
    Math.cos(y * 0.002 - t * 0.16) * 1.3;

  const step = (dt, t) => {
    mx += (targetMx - mx) * 0.18;
    my += (targetMy - my) * 0.18;

    parts.forEach((p) => {
      const a = field(p.x, p.y, t);
      let vx = Math.cos(a) * p.sp;
      let vy = Math.sin(a) * p.sp;

      const dx = p.x - mx;
      const dy = p.y - my;
      const dist = Math.hypot(dx, dy);
      const RADIUS = 190;

      if (dist < RADIUS && dist > 0.1) {
        const force = (1 - dist / RADIUS) * 220;
        vx += (dx / dist) * force - (dy / dist) * (force * 0.8);
        vy += (dy / dist) * force + (dx / dist) * (force * 0.8);
      }

      p.px = p.x;
      p.py = p.y;
      p.x += vx * dt;
      p.y += vy * dt;
      p.life -= dt;

      if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
        spawn(p);
        return;
      }

      ctx.strokeStyle = p.isYellow
        ? `rgba(255, 230, 0, ${p.a})`
        : `rgba(237, 240, 227, ${p.a * 0.4})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });
  };

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    step(dt, now * 0.001);
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
  window.addEventListener('resize', resize);
})();

// ── SVG Generated Art ─────────────────────────────────────────────────────
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  const mesh = document.querySelector('[data-mesh-art]');
  if (mesh) {
    const s = svg('svg', { width: '200', height: '180', viewBox: '0 0 200 180', 'aria-hidden': 'true' });
    const g = svg('g', { stroke: 'var(--ink-mute)', 'stroke-width': '.6', fill: 'none' });
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const x = 14 + c * 28 + (r % 2 === 0 ? 0 : 14);
        const y = 14 + r * 28;
        const cir = svg('circle', { cx: x, cy: y, r: '1.4', fill: 'var(--ink-soft)', stroke: 'none' });
        g.appendChild(cir);
        if (c < 6) g.appendChild(svg('line', { x1: x, y1: y, x2: x + 28, y2: y }));
        if (r < 5 && c < 7) g.appendChild(svg('line', { x1: x, y1: y, x2: x + (r % 2 === 0 ? 14 : -14), y2: y + 28 }));
      }
    }
    s.appendChild(g);
    mesh.appendChild(s);
  }

  const grid = document.querySelector('[data-grid-art]');
  if (grid) {
    const s = svg('svg', { width: '200', height: '160', viewBox: '0 0 200 160', 'aria-hidden': 'true' });
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 8; c++) {
        s.appendChild(svg('rect', { x: 4 + c * 24, y: 4 + r * 24, width: '20', height: '20', fill: 'none', stroke: 'var(--line-strong)' }));
      }
    }
    s.appendChild(svg('rect', { x: 4 + 3 * 24, y: 4 + 2 * 24, width: '20', height: '20', fill: 'var(--accent)', opacity: '.5' }));
    s.appendChild(svg('rect', { x: 4 + 5 * 24, y: 4 + 1 * 24, width: '20', height: '20', fill: 'var(--ink)' }));
    grid.appendChild(s);
  }

  const ga = document.querySelector('[data-graph-art]');
  if (ga) {
    const nodes = [
      { x: 30, y: 60, r: 5 }, { x: 70, y: 35, r: 4 },
      { x: 110, y: 80, r: 9, hub: true, label: 'c++' },
      { x: 160, y: 40, r: 5 }, { x: 200, y: 95, r: 6 },
      { x: 60, y: 130, r: 5 }, { x: 130, y: 160, r: 8, hub: true, label: 'dsa' },
      { x: 195, y: 145, r: 5 }, { x: 30, y: 175, r: 4 }, { x: 220, y: 195, r: 4 },
    ];
    const edges = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 4], [2, 5], [5, 6], [6, 7], [4, 7], [0, 8], [6, 8], [4, 9], [7, 9], [6, 9]];
    const s = svg('svg', { viewBox: '0 0 250 220', width: '100%', 'aria-hidden': 'true' });
    edges.forEach(([a, b]) => {
      const na = nodes[a], nb = nodes[b];
      const hub = na.hub || nb.hub;
      s.appendChild(svg('line', {
        x1: na.x, y1: na.y, x2: nb.x, y2: nb.y,
        stroke: 'var(--ink-mute)',
        'stroke-opacity': hub ? '.55' : '.22',
        'stroke-width': '1',
      }));
    });
    nodes.forEach((n) => {
      const g = svg('g', {});
      g.appendChild(svg('circle', {
        cx: n.x, cy: n.y, r: n.r,
        fill: n.hub ? 'var(--accent)' : 'var(--bg-elev)',
        stroke: n.hub ? 'var(--accent)' : 'var(--ink-mute)',
        'stroke-width': '1',
      }));
      if (n.label) {
        const t = svg('text', {
          x: n.x, y: n.y + n.r + 14,
          'text-anchor': 'middle',
          'font-family': 'var(--font-mono)',
          'font-size': '8',
          fill: 'var(--ink-mute)',
          'letter-spacing': '.12em',
        });
        t.textContent = n.label.toUpperCase();
        g.appendChild(t);
      }
      s.appendChild(g);
    });
    ga.appendChild(s);
  }
})();

// ── Interactive Education / Skills / Milestones Tab Controller ────────────
(() => {
  const tabButtons = document.querySelectorAll('.edu-tab-btn');
  const tabPanes = document.querySelectorAll('.edu-tab-pane');
  if (!tabButtons.length || !tabPanes.length) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetSelector = btn.dataset.tabTarget;
      const targetPane = document.querySelector(targetSelector);
      if (!targetPane) return;

      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      targetPane.classList.add('active');

      if ('vibrate' in navigator) {
        try { navigator.vibrate(8); } catch (_) { }
      }
    });
  });
})();

// ── Case Study Data ────────────────────────────────────────────────────────
const CASES = {
  portfolio: {
    tag: 'Personal Website · 2026',
    title: 'Personal Portfolio & Editorial Interface',
    lede: 'An editorial dark aesthetic portfolio with spring-driven cursor, flow-field hero particles, dynamic themes, and modal case study overlays.',
    problem: [
      'Standard template portfolios often look static and lack personality. I wanted to design an experience that demonstrates my interest in computer science, software design patterns, and fluid animations using vanilla code.',
    ],
    approach: [
      'Engineered semi-implicit Euler spring physics to calculate 3D card tilt and hover parallax.',
      'Constructed custom particle physics with real-time vector field math and mouse repulsion on HTML5 Canvas.',
      'Implemented View Transitions API for seamless circular clip-path theme shifts.',
      'Ensured semantic accessibility and complete fallback support for reduced motion preferences.',
    ],
    stack: ['HTML5', 'Modern CSS', 'Vanilla JavaScript', 'Vercel'],
    live: 'https://subh-4uq2.vercel.app/',
  },
  birthday: {
    tag: 'Web Experience · 2026',
    title: 'Celebration Web Experience',
    lede: 'A personal interactive celebration page featuring dynamic countdowns, heartfelt reveals, photo albums, and confetti animations.',
    problem: [
      'Creating an expressive, memorable digital greeting page that feels personal, smooth on mobile devices, and fast across all network conditions.',
    ],
    approach: [
      'Componentized interactive modules using React and TypeScript.',
      'Added smooth entry states, countdown timers, and particle confetti physics.',
      'Optimized media delivery and deployed with global edge caching on Vercel.',
    ],
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Vercel'],
    live: 'https://happy-birthdaytripti.vercel.app/',
  },
  github: {
    tag: 'Open Source · GitHub',
    title: 'Algorithms & Utilities Repositories',
    lede: 'Structured code repositories covering core data structures, algorithms practice in C/C++, object-oriented simulations in Java, and Python tools.',
    problem: [
      'Reinforcing computer science principles through hands-on implementation and structured Git version control.',
    ],
    approach: [
      'Documented daily code exercises covering arrays, pointers, linked lists, and trees.',
      'Practiced modular class architecture and collection implementations in Java.',
      'Authored utility automation scripts in Python.',
    ],
    stack: ['C', 'C++', 'Java', 'Python', 'Git'],
    live: 'https://github.com/max-subh',
  },
  roadmap: {
    tag: 'Learning Map · 2026',
    title: 'Data Structures & Algorithms Blueprint',
    lede: 'Focusing on core algorithmic discipline, time/space complexity analysis, and writing robust problem-solving programs.',
    problem: [
      'Frameworks come and go, but strong knowledge of memory, pointers, and algorithmic structures remains foundational for any high-performing software engineer.',
    ],
    approach: [
      'Daily implementation of core data structures from scratch in C++ and Java.',
      'Complexity analysis with focus on O(n) space and time benchmarks.',
      'Solving algorithmic problems consistently to sharpen debugging skills.',
    ],
    stack: ['Data Structures', 'Algorithms', 'C++', 'Java', 'Problem Solving'],
  },
};
const CASE_ORDER = ['portfolio', 'birthday', 'github'];

// ── Case Study Modal System ───────────────────────────────────────────────
(() => {
  const mount = document.querySelector('[data-case-mount]');
  if (!mount) return;
  let activeId = null;
  let lastTrigger = null;

  const closeModal = () => {
    activeId = null;
    mount.innerHTML = '';
    document.body.style.overflow = '';
    window.removeEventListener('keydown', onKey);
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    lastTrigger = null;
  };

  const onKey = (e) => {
    if (!activeId) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (CASE_ORDER.includes(activeId)) {
      const idx = CASE_ORDER.indexOf(activeId);
      if (e.key === 'ArrowRight') open(CASE_ORDER[(idx + 1) % CASE_ORDER.length]);
      if (e.key === 'ArrowLeft') open(CASE_ORDER[(idx - 1 + CASE_ORDER.length) % CASE_ORDER.length]);
    }
  };

  const render = (id) => {
    const c = CASES[id];
    if (!c) return '';
    const isWork = CASE_ORDER.includes(id);
    const idx = isWork ? CASE_ORDER.indexOf(id) : -1;
    const nextId = isWork ? CASE_ORDER[(idx + 1) % CASE_ORDER.length] : null;
    const problem = c.problem.map((p) => `<p>${p}</p>`).join('');
    const approach = c.approach.map((a) => `<li>${a}</li>`).join('');
    const chips = c.stack.map((s) => `<span>${s}</span>`).join('');
    const liveBtn = c.live ? `
      <a class="case__live" href="${c.live}" target="_blank" rel="noreferrer">
        Visit project
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 11L11 1M11 1H4M11 1V8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>` : '';
    const nextBtn = isWork && nextId ? `
      <button class="case__next-cta" data-open-case="${nextId}">
        Next project · ${CASES[nextId].title}
        <svg width="13" height="11" viewBox="0 0 14 12" fill="none"><path d="M1 6H13M13 6L8 1M13 6L8 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>` : '';

    return `
      <div class="case-overlay" data-overlay role="dialog" aria-modal="true">
        <article class="case" data-case tabindex="-1">
          <header class="case__head">
            <button class="case__close" data-close aria-label="Close case study">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M11 1L1 11M1 1L11 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
              <span>Close</span>
            </button>
            <span class="case__count">${isWork ? `${String(idx + 1).padStart(2, '0')} / ${String(CASE_ORDER.length).padStart(2, '0')}` : 'Overview'}</span>
          </header>
          <div class="case__scroll">
            <section class="case__hero">
              <div class="case__meta">${c.tag}</div>
              <h1 class="case__title">${c.title}</h1>
              <p class="case__lede">${c.lede}</p>
            </section>
            <section class="case__split">
              <span class="case__num">01 / Concept</span>
              <div class="case__copy">${problem}</div>
            </section>
            <section class="case__split">
              <span class="case__num">02 / Implementation</span>
              <ul class="case__list">${approach}</ul>
            </section>
            <section class="case__split">
              <span class="case__num">03 / Technologies</span>
              <div class="case__chips">${chips}</div>
            </section>
            <footer class="case__foot">${liveBtn}${nextBtn}</footer>
          </div>
        </article>
      </div>`;
  };

  const open = (id) => {
    if (!CASES[id]) return;
    const isFirstOpen = !activeId;
    activeId = id;
    mount.innerHTML = render(id);
    document.body.style.overflow = 'hidden';
    if (isFirstOpen) window.addEventListener('keydown', onKey);

    const overlay = mount.querySelector('[data-overlay]');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    mount.querySelector('[data-close]').addEventListener('click', closeModal);
    mount.querySelectorAll('[data-open-case]').forEach((b) => {
      b.addEventListener('click', () => open(b.dataset.openCase));
    });
  };

  document.querySelectorAll('[data-open-case]').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      lastTrigger = b;
      open(b.dataset.openCase);
    });
  });
})();

// ── Copy Email ────────────────────────────────────────────────────────────
(() => {
  const btn = document.querySelector('[data-copy-email]');
  if (!btn) return;
  const email = 'subhamshit136@gmail.com';
  const orig = btn.textContent;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      btn.textContent = '✓ Copied';
    } catch (_) {
      btn.textContent = 'subhamshit136@gmail.com';
    }
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
})();

// ── Scrub Rail Progress Tracker ───────────────────────────────────────────
(() => {
  const root = document.querySelector('[data-scrub]');
  if (!root) return;
  const track = root.querySelector('[data-scrub-track]');
  const fill = root.querySelector('[data-scrub-fill]');
  const pip = root.querySelector('[data-scrub-pip]');
  const readout = root.querySelector('[data-scrub-readout]');
  const topBtn = root.querySelector('[data-scrub-top]');

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const p = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    const pct = Math.round(p * 100);
    if (fill) fill.style.height = `${(p * 100).toFixed(2)}%`;
    if (pip) pip.style.top = `${(p * 100).toFixed(2)}%`;
    if (readout) readout.textContent = `${pct}%`;
    if (track) track.setAttribute('aria-valuenow', String(pct));
    root.classList.toggle('is-visible', window.scrollY > 240);
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();

  const jumpTo = (clientY) => {
    const r = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: ratio * scrollable,
      behavior: reducedMotion() ? 'auto' : 'smooth',
    });
  };

  if (track) track.addEventListener('click', (e) => jumpTo(e.clientY));
  if (topBtn) {
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
  }
})();

// ── Velocity-Stretching Ring Cursor ───────────────────────────────────────
(() => {
  if (window.matchMedia('(pointer: coarse)').matches || reducedMotion()) return;
  const dot = document.querySelector('[data-cursor-dot]');
  const ring = document.querySelector('[data-cursor-ring]');
  const label = document.querySelector('[data-cursor-label]');
  if (!dot || !ring || !label) return;

  const LABEL_MAP = [
    { sel: '[data-scrub-top]', label: 'Top' },
    { sel: '[data-copy-email]', label: 'Copy' },
    { sel: '.case__close, [data-close]', label: 'Close' },
    { sel: '[data-open-case]', label: 'View' },
    { sel: 'a[target="_blank"]', label: 'Visit' },
    { sel: '.nav__link, a[href^="#"]', label: 'Jump' },
    { sel: '.work-card', label: 'Open' },
    { sel: '.cta--primary', label: 'Explore' },
    { sel: '.cta', label: 'Open' },
    { sel: 'button', label: 'Click' },
    { sel: 'a', label: 'Open' },
  ];

  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let dx = tx, dy = ty, rx = tx, ry = ty, lastX = tx, lastY = ty;
  let smoothSpeed = 0, smoothAngle = 0, activated = false, currentHit = null;

  const lerp = (a, b, n) => (1 - n) * a + n * b;

  const matchTarget = (el) => {
    if (!el || !el.closest) return null;
    for (const entry of LABEL_MAP) {
      const hit = el.closest(entry.sel);
      if (hit) return { hit, label: entry.label };
    }
    return null;
  };

  const applyHover = (found) => {
    if (found && found.hit === currentHit) return;
    currentHit = found ? found.hit : null;
    if (found) {
      label.textContent = found.label;
      ring.classList.add('is-hover');
      dot.classList.add('is-hover');
    } else {
      ring.classList.remove('is-hover');
      dot.classList.remove('is-hover');
    }
  };

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!activated) {
      activated = true;
      document.documentElement.classList.add('is-cursor-active');
    }
    applyHover(matchTarget(e.target));
  }, { passive: true });

  window.addEventListener('mousedown', () => {
    ring.classList.remove('is-click');
    void ring.offsetWidth;
    ring.classList.add('is-click');
    setTimeout(() => ring.classList.remove('is-click'), 600);
  });

  const tick = () => {
    dx = lerp(dx, tx, 0.55);
    dy = lerp(dy, ty, 0.55);
    rx = lerp(rx, tx, 0.18);
    ry = lerp(ry, ty, 0.18);

    const vx = tx - lastX, vy = ty - lastY;
    lastX = tx; lastY = ty;
    const speed = Math.min(Math.hypot(vx, vy), 80);
    smoothSpeed = lerp(smoothSpeed, speed, 0.18);
    if (smoothSpeed > 2) {
      smoothAngle = lerp(smoothAngle, Math.atan2(vy, vx) * 180 / Math.PI, 0.22);
    }

    const isHover = currentHit !== null;
    const stretch = isHover ? 1 : 1 + Math.min(smoothSpeed / 220, 0.32);
    const squash = isHover ? 1 : 1 / stretch;
    const angle = isHover ? 0 : smoothAngle;

    dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(${stretch}, ${squash})`;

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

// ── Physics Layer: 3D Spring Tilt & Parallax ──────────────────────────────
(() => {
  if (window.matchMedia('(pointer: coarse)').matches || reducedMotion()) return;

  const consumers = [];
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    for (const fn of consumers) fn(dt);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Work card & Edu card 3D tilt
  document.querySelectorAll('.work-card, .edu-card').forEach((card) => {
    const rxS = spring(0, { stiffness: 140, damping: 18 });
    const ryS = spring(0, { stiffness: 140, damping: 18 });
    const tzS = spring(0, { stiffness: 200, damping: 22 });
    const liftS = spring(0, { stiffness: 220, damping: 24 });

    card.classList.add('js-physics');
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    card.addEventListener('mouseenter', () => {
      liftS.set(-6);
      tzS.set(10);
    });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ryS.set((px - 0.5) * 12);
      rxS.set(-(py - 0.5) * 12);
    });
    card.addEventListener('mouseleave', () => {
      rxS.set(0); ryS.set(0); tzS.set(0); liftS.set(0);
    });

    consumers.push((dt) => {
      const a = rxS.step(dt);
      const b = ryS.step(dt);
      const tz = tzS.step(dt);
      const lift = liftS.step(dt);
      card.style.transform = `perspective(1100px) translate3d(0, ${lift.toFixed(2)}px, 0) rotateX(${a.toFixed(2)}deg) rotateY(${b.toFixed(2)}deg) translateZ(${tz.toFixed(2)}px)`;
    });
  });
})();

// ── Card Cursor Spotlight ─────────────────────────────────────────────────
(() => {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.work-card, .exp-card, .edu-card, .ai-feature').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
})();

// ── Persistent Projects with Temporary Admin Button ──────────────────────
(() => {
  const SECRET_KEY = 'subham24';
  const urlParams = new URLSearchParams(window.location.search);

  const showAdminButton = urlParams.get('admin') === SECRET_KEY;

  const trigger = document.getElementById('admin-trigger');
  const modal = document.getElementById('admin-modal');
  const openBtn = document.getElementById('admin-open-btn');
  const closeBtn = document.getElementById('admin-close-btn');
  const form = document.getElementById('admin-project-form');
  const track = document.querySelector('[data-work-track]');

  if (showAdminButton && trigger) {
    trigger.style.display = 'block';
  } else if (trigger) {
    trigger.style.display = 'none';
  }

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => { modal.style.display = 'grid'; });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  }

  const createCardElement = (proj, num) => {
    const article = document.createElement('article');
    article.className = 'work-card js-physics';
    article.innerHTML = `
      <div class="work-card__hit">
        <div class="work-card__head">
          <span>Project</span>
          <span class="work-card__num">${String(num).padStart(2, '0')}</span>
        </div>
        <div class="work-card__art" data-mesh-art></div>
        <div class="work-card__body">
          <h3 class="work-card__title">${proj.title}</h3>
          <p class="work-card__blurb">${proj.desc}</p>
          <div class="work-card__tags">
            ${proj.tags.map(t => `<span>${t.trim()}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="work-card__foot">
        ${proj.live ? `<a class="work-card__action work-card__action--primary" href="${proj.live}" target="_blank" rel="noreferrer">Visit Live ↗</a>` : ''}
        ${proj.github ? `<a class="work-card__action" href="${proj.github}" target="_blank" rel="noreferrer">GitHub ↗</a>` : ''}
      </div>
    `;
    return article;
  };

  const loadCustomProjects = () => {
    if (!track) return;
    const saved = JSON.parse(localStorage.getItem('custom_projects') || '[]');
    saved.forEach((proj, idx) => {
      const card = createCardElement(proj, idx + 4);
      track.appendChild(card);
    });
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const tagsInput = document.getElementById('proj-tags').value;
      const newProj = {
        title: document.getElementById('proj-title').value,
        desc: document.getElementById('proj-desc').value,
        tags: tagsInput ? tagsInput.split(',') : ['Web'],
        live: document.getElementById('proj-live').value,
        github: document.getElementById('proj-github').value,
      };

      const existing = JSON.parse(localStorage.getItem('custom_projects') || '[]');
      existing.push(newProj);
      localStorage.setItem('custom_projects', JSON.stringify(existing));

      if (track) {
        const card = createCardElement(newProj, existing.length + 3);
        track.appendChild(card);
      }

      form.reset();
      modal.style.display = 'none';

      if (trigger) trigger.style.display = 'none';
      window.history.replaceState({}, document.title, window.location.pathname);

      alert('Project save ho gaya! Add karne ka button ab hat chuka hai.');
    });
  }

  loadCustomProjects();
})();

// ── Feature 5: Web Audio API Procedural UI Sound Engine ───────────────────
(() => {
  let audioCtx = null;
  let soundEnabled = localStorage.getItem('sound_enabled') === 'true';

  const soundBtn = document.querySelector('[data-sound-toggle]');
  const iconOn = soundBtn?.querySelector('.sound-icon-on');
  const iconOff = soundBtn?.querySelector('.sound-icon-off');

  const updateIcons = () => {
    if (!iconOn || !iconOff) return;
    iconOn.style.display = soundEnabled ? 'block' : 'none';
    iconOff.style.display = soundEnabled ? 'none' : 'block';
  };
  updateIcons();

  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playTone = (freq, type, duration, gainLevel) => {
    if (!soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainLevel, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) { }
  };

  const playClick = () => playTone(800, 'sine', 0.04, 0.03);
  const playHover = () => playTone(300, 'triangle', 0.03, 0.008);
  const playTheme = () => playTone(520, 'sine', 0.08, 0.04);

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      initAudio();
      soundEnabled = !soundEnabled;
      localStorage.setItem('sound_enabled', String(soundEnabled));
      updateIcons();
      if (soundEnabled) playClick();
    });
  }

  window.addEventListener('pointerdown', (e) => {
    if (!audioCtx) initAudio();
    if (e.target.closest('a, button, [data-open-case], .edu-tab-btn')) {
      playClick();
    }
  });

  document.querySelectorAll('a, button, .work-card, .exp-card, .edu-card, .edu-tab-btn').forEach((el) => {
    el.addEventListener('pointerenter', () => {
      if (audioCtx) playHover();
    });
  });

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', playTheme);
})();

// ── Feature 2: Realtime GitHub Telemetry API Fetcher ───────────────────────
(() => {
  const USERNAME = 'max-subh';
  const repoCountEl = document.getElementById('gh-repos');
  const followersEl = document.getElementById('gh-followers');
  const latestEl = document.getElementById('gh-latest');
  const statusEl = document.getElementById('gh-status');

  if (!repoCountEl) return;

  async function fetchGitHubStats() {
    try {
      const userRes = await fetch(`https://api.github.com/users/${USERNAME}`);
      if (!userRes.ok) throw new Error('API Rate limit or not found');
      const userData = await userRes.json();

      repoCountEl.textContent = userData.public_repos || '0';
      followersEl.textContent = userData.followers || '0';

      const reposRes = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=1`);
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        if (reposData.length > 0) {
          latestEl.innerHTML = `Latest commit: <a href="${reposData[0].html_url}" target="_blank" style="color: var(--accent); text-decoration: underline;">${reposData[0].name}</a>`;
        }
      }

      if (statusEl) {
        statusEl.textContent = 'ONLINE';
        statusEl.style.color = 'var(--accent)';
      }
    } catch (_) {
      if (statusEl) statusEl.textContent = 'CACHED';
      repoCountEl.textContent = '3+';
      followersEl.textContent = 'Active';
      latestEl.textContent = 'Repositories available on GitHub profile';
    }
  }

  fetchGitHubStats();
})();

// ── Smooth Velocity-Based Haptic Scroll Ticks ──────────────────────────────
(() => {
  if (!('vibrate' in navigator)) return;

  let lastY = window.scrollY;
  let accumulated = 0;
  let isTicking = false;
  let lastVibeTime = 0;

  const DISTANCE_THRESHOLD = 180;
  const MIN_INTERVAL_MS = 60;
  const PULSE_DURATION = 4;

  const smoothTick = () => {
    const currentY = window.scrollY;
    const delta = Math.abs(currentY - lastY);
    lastY = currentY;
    accumulated += delta;

    const now = performance.now();
    if (accumulated >= DISTANCE_THRESHOLD) {
      if (now - lastVibeTime >= MIN_INTERVAL_MS) {
        try {
          navigator.vibrate(PULSE_DURATION);
          lastVibeTime = now;
        } catch (_) { }
      }
      accumulated = 0;
    }

    isTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      requestAnimationFrame(smoothTick);
      isTicking = true;
    }
  }, { passive: true });

  const sectionSnapObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        try {
          navigator.vibrate([6, 30, 4]);
        } catch (_) { }
      }
    });
  }, { threshold: 0.35 });

  document.querySelectorAll('section, .work-card').forEach((el) => {
    sectionSnapObserver.observe(el);
  });
})();