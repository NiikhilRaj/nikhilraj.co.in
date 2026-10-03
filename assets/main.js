(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // theme
  const themeBtn = $('#theme');
  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  themeBtn?.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // header border on scroll
  const top = $('#top');
  const onScroll = () => top?.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // reveal on scroll + count up numbers
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const fmt = (v) => v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const start = performance.now();
    const dur = 1100;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(target * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('in'));
  }

  // active nav link
  const navLinks = $$('.nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.removeAttribute('aria-current'));
        map.get(e.target.id)?.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) so.observe(s); });
  }

  // copy email
  const copyBtn = $('#copy-mail');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.email);
      copyBtn.textContent = 'Copied';
    } catch (e) {
      copyBtn.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1600);
  });

  // quick navigation palette
  const onHome = location.pathname === '/' || location.pathname.endsWith('/index.html');
  const home = (hash) => (onHome ? hash : '/' + hash);
  const items = [
    ['Work', home('#work'), 'section'],
    ['Experience', home('#experience'), 'section'],
    ['Community', home('#community'), 'section'],
    ['Toolbox', home('#stack'), 'section'],
    ['Contact', home('#contact'), 'section'],
    ['Plan Sync case study', '/projects/plan-sync.html', 'page'],
    ['Plan Sync on Play Store', 'https://play.google.com/store/apps/details?id=in.co.cardlink.plansync', 'link'],
    ['GitHub', 'https://github.com/NiikhilRaj', 'link'],
    ['LinkedIn', 'https://linkedin.com/in/nikhilraj16', 'link'],
    ['Email me', 'mailto:nikhilraj13733@gmail.com', 'link'],
    ['Download resume (PDF)', '/assets/Nikhil_Raj_Resume.pdf', 'link'],
    ['Toggle dark mode', '#theme', 'action'],
  ];
  const pal = $('#palette');
  const input = $('#palette-input');
  const list = $('#palette-list');
  let active = 0;
  let shown = items;
  let lastFocus = null;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    shown = items.filter(([label]) => label.toLowerCase().includes(q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.replaceChildren(...(shown.length
      ? shown.map(([label, href, kind], i) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = href;
          a.dataset.i = i;
          if (i === active) a.className = 'active';
          const l = document.createElement('span');
          l.textContent = label;
          const k = document.createElement('span');
          k.textContent = kind;
          a.append(l, k);
          li.append(a);
          return li;
        })
      : [Object.assign(document.createElement('li'), { className: 'empty', textContent: 'Nothing matches that.' })]));
  };
  const open = () => {
    if (!pal) return;
    lastFocus = document.activeElement;
    pal.classList.add('open');
    input.value = '';
    active = 0;
    render();
    input.focus();
  };
  const close = () => {
    pal?.classList.remove('open');
    lastFocus?.focus?.();
  };
  const go = (i) => {
    const item = shown[i];
    if (!item) return;
    close();
    if (item[2] === 'action') { themeBtn?.click(); return; }
    if (item[1].startsWith('http') || item[1].endsWith('.pdf')) window.open(item[1], '_blank', 'noopener');
    else location.href = item[1];
  };

  $('#open-palette')?.addEventListener('click', open);
  pal?.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-i]');
    if (a) { e.preventDefault(); go(+a.dataset.i); return; }
    if (e.target === pal) close();
  });
  input?.addEventListener('input', () => { active = 0; render(); });
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(1, shown.length); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(1, shown.length); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); go(active); }
  });
  addEventListener('keydown', (e) => {
    const typing = /input|textarea|select/i.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
      e.preventDefault();
      pal?.classList.contains('open') ? close() : open();
    } else if (e.key === 'Escape' && pal?.classList.contains('open')) {
      close();
    }
  });
})();
