/* =============================================================
   main.js —— MOLI 作品集交互总控
   动效机制均改编自 001/ 效果库：
   解码入场=typed-header(ScrambleText) / 大字扫光=gta6 /
   斜向卡片=diagonal-carousel / 节点连线=data-icons-float-nodes(DrawSVG) /
   滚动揭示=scroll-to-reveal(ScrollTrigger) / 平滑滚动=ScrollSmoother。

   双层策略（渐进增强）：
   - 加载到 GSAP：走 initGSAP() 的高端动效（html.gsap-on）；
   - 断网 / CDN 失败 / 开启"减少动态效果"：自动走原生动效，内容始终完整；
   - 无 JS：CSS 保证内容直接可读。
   ============================================================= */
(function () {
  'use strict';

  const docEl = document.documentElement;
  docEl.classList.remove('no-js');
  docEl.classList.add('js');

  // 用户偏好与设备能力
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(pointer: fine)').matches;
  const DESKTOP = () => window.matchMedia('(min-width: 768px)').matches;
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  // 测试/调试开关：URL 带 ?nosmooth 时不创建 ScrollSmoother（其余 GSAP 动效照常）
  const NO_SMOOTH = /nosmooth/.test(window.location.search);

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  // 通用：元素进入视口后执行一次（原生回退用）
  function onEnter(els, cb, opts) {
    const list = Array.isArray(els) ? els : [els];
    if (!('IntersectionObserver' in window)) { list.forEach((el, i) => cb(el, i)); return; }
    const ob = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { cb(e.target); ob.unobserve(e.target); }
      });
    }, Object.assign({ threshold: 0.18, rootMargin: '0px 0px -12% 0px' }, opts || {}));
    list.filter(Boolean).forEach((el) => ob.observe(el));
  }


  /* ---------- 导航：滚动加底、移动菜单、当前锚点高亮 ---------- */
  function initNav() {
    const nav = $('.nav');
    const toggle = $('#navToggle');
    const menu = $('#mobileMenu');
    if (!nav) return;

    // 深色电影感 Hero 占满首屏：导航在整段 Hero 内保持透明 + 浅色，
    // 直到接近 Hero 底部（即将进入浅色 About）才翻为浅色毛玻璃底 + 深色字。
    const heroEl = $('#hero');
    const navFlipY = () => {
      const h = heroEl ? heroEl.offsetHeight : 0;
      return h ? Math.max(h - 120, 80) : 40;
    };
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > navFlipY());
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    const menuLabel = (open) => (window.MOLI_I18N
      ? window.MOLI_I18N.t(open ? 'nav.toggleClose' : 'nav.toggleOpen')
      : (open ? '关闭菜单' : '打开菜单'));
    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      if (menu) { menu.classList.toggle('is-open', open); menu.setAttribute('aria-hidden', String(!open)); }
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', menuLabel(open));
      }
    }
    if (toggle && window.MOLI_I18N) {
      window.MOLI_I18N.onChange(() => {
        toggle.setAttribute('aria-label', menuLabel(toggle.getAttribute('aria-expanded') === 'true'));
      });
    }
    if (toggle) {
      toggle.addEventListener('click', () => {
        setMenu(toggle.getAttribute('aria-expanded') !== 'true');
      });
    }
    if (menu) $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    const links = $$('[data-nav]');
    const byId = {};
    links.forEach((l) => { byId[l.getAttribute('href').slice(1)] = l; });
    if ('IntersectionObserver' in window) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            links.forEach((l) => l.classList.remove('is-active'));
            if (byId[e.target.id]) byId[e.target.id].classList.add('is-active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main section[id], .site-tail section[id]').forEach((s) => spy.observe(s));
    }
  }


  /* ============ 原生回退方案（无 GSAP 时使用，与旧版一致） ============ */

  function injectSrOnly() {
    if (document.getElementById('sr-only-style')) return;
    const st = document.createElement('style');
    st.id = 'sr-only-style';
    st.textContent = '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}';
    document.head.appendChild(st);
  }

  function initDecode() {
    injectSrOnly();
    const targets = $$('[data-decode]');
    if (!targets.length) return;
    const GLYPHS = '01!<>-_/[]{}=+*#';
    if (REDUCED) return;
    targets.forEach((el, order) => {
      const final = el.textContent;
      el.textContent = '';
      const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = final;
      const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
      el.appendChild(sr); el.appendChild(vis);
      const chars = final.split('');
      const per = 38, delay = order === 0 ? 250 : 900;
      const t0 = performance.now() + delay;
      const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
      const esc = (c) => (c === ' ' ? '&nbsp;' : c);
      (function frame(now) {
        const elapsed = now - t0;
        if (elapsed < 0) { requestAnimationFrame(frame); return; }
        const revealed = Math.floor(elapsed / per);
        if (revealed >= chars.length) { vis.textContent = final; return; }
        let html = '';
        for (let i = 0; i < chars.length; i++) {
          if (i < revealed) html += esc(chars[i]);
          else if (i === revealed) html += '<span class="dc-active">' + esc(rnd()) + '</span>';
          else html += '<span class="dc">' + esc(rnd()) + '</span>';
        }
        vis.innerHTML = html;
        requestAnimationFrame(frame);
      })(t0);
      const finish = () => { vis.textContent = final; };
      setTimeout(finish, delay + chars.length * per + 1200);
      document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
    });
  }

  function initReveal() {
    const items = $$('[data-reveal]');
    if (REDUCED) { items.forEach((el) => el.classList.add('is-revealed')); return; }
    items.forEach((el) => {
      const sibs = $$('[data-reveal]', el.parentElement);
      const idx = sibs.indexOf(el);
      el.style.transitionDelay = Math.min(Math.max(idx, 0), 6) * 0.07 + 's';
      onEnter(el, (node) => node.classList.add('is-revealed'));
    });
    const revealInView = () => items.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.95) el.classList.add('is-revealed');
    });
    revealInView();
    window.addEventListener('load', () => { revealInView(); setTimeout(revealInView, 300); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(revealInView);
    setTimeout(() => items.forEach((el) => el.classList.add('is-revealed')), 1200);
  }

  /* ---------- 03 构建流水线：节点点亮 + 红色主轴随滚动描下（原生回退 / 减少动态） ---------- */
  function initBuildFlow() {
    const sec = document.getElementById('buildFlow');
    if (!sec) return;
    const fill = $('.build__spine-fill', sec);
    const steps = $$('.build__step', sec);
    const setFinal = () => { if (fill) fill.classList.add('is-on'); steps.forEach((s) => s.classList.add('is-on')); };
    if (REDUCED) { setFinal(); return; }
    steps.forEach((s) => onEnter(s, () => s.classList.add('is-on'), { threshold: 0.35 }));
    if (fill) {
      let ticking = false;
      const update = () => {
        ticking = false;
        const r = sec.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const start = vh * 0.82, end = vh * 0.42;
        const p = (start - r.top) / (r.height + (start - end));
        fill.style.transform = 'scaleY(' + Math.max(0, Math.min(1, p)) + ')';
      };
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      window.addEventListener('load', update);
      update();
    }
  }


  /* ---------- 经历时间线红色生长主轴（GSAP / 原生都用，滚动驱动） ---------- */
  function initTimeline() {
    const tl = $('.timeline');
    if (!tl) return;
    const bar = document.createElement('span');
    bar.className = 'timeline__progress';
    tl.prepend(bar);
    if (REDUCED) { bar.style.height = '100%'; return; }
    function update() {
      const r = tl.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.75 - r.top) / (r.height + vh * 0.25);
      bar.style.height = Math.max(0, Math.min(1, p)) * (r.height - 12) + 'px';
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }

  /* ---------- 04 PATH 横向时间线：构建圆润 SVG 路线几何（GSAP pin / 原生横滑共用） ---------- */
  // Catmull-Rom 转三次贝塞尔，保证轨迹圆润
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    let d = 'M' + round1(pts[0].x) + ' ' + round1(pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + round1(c1x) + ' ' + round1(c1y) + ' ' + round1(c2x) + ' ' + round1(c2y) + ' ' + round1(p2.x) + ' ' + round1(p2.y);
    }
    return d;
  }
  function round1(n) { return Math.round(n * 10) / 10; }

  function initHorizontalPath() {
    const sec = $('#path');
    if (!sec) return;
    const stage = $('#hPath'), track = $('#hPathTrack'), route = $('#hPathRoute');
    if (!stage || !track || !route) return;
    const prog = $('.hpath__route-prog', route);
    // 仅桌面 + 有 GSAP + 非减少动态时启用 pin；其余（含全部移动端）走原生横向滑动、不绘制 SVG 路线
    const native = !(HAS_GSAP && !REDUCED && DESKTOP());
    sec.classList.toggle('is-native', native);
    if (native) { route.style.display = 'none'; return; }

    function build() {
      const H = Math.max(1, stage.clientHeight);
      const W = Math.max(track.scrollWidth, stage.clientWidth);
      route.setAttribute('width', W);
      route.setAttribute('height', H);
      route.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const tr = track.getBoundingClientRect();
      const pts = [];
      const milestones = $$('.hpanel:not(.hpanel--intro)', track);
      if (!milestones.length) return;
      // 大蜿蜒：奇数点沉到图片下方留白，偶数点钻进图片底部（路线置底，被图块遮住更有神秘感）
      const bottomOf = (p) => { const m = $('.hpanel__media', p).getBoundingClientRect(); return m.bottom - tr.top; };
      const UP = 46, DOWN = 24; // 上下幅度（更大波浪）
      const lineY = (i) => bottomOf(milestones[i]) + (i % 2 ? DOWN : -UP);
      const intro = $('.hpanel--intro', track);
      // 起点：从首张图左缘内侧自然引出，避免在视口边缘生硬出现
      const first = milestones[0].querySelector('.hpanel__media').getBoundingClientRect();
      const startX = (intro ? intro.getBoundingClientRect().right - tr.left : first.left - tr.left) + 8;
      pts.push({ x: startX, y: lineY(0) });
      milestones.forEach((p, i) => {
        const mr = $('.hpanel__media', p).getBoundingClientRect();
        pts.push({ x: mr.left - tr.left + mr.width / 2, y: lineY(i) });
      });
      // 终点：越过最后一张图向右延伸一段，圆润收尾
      const last = milestones[milestones.length - 1].getBoundingClientRect();
      pts.push({ x: last.right - tr.left + 110, y: lineY(milestones.length - 1) });
      prog.setAttribute('d', smoothPath(pts));
    }
    build();
    let rt;
    const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 160); };
    window.addEventListener('resize', rebuild, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build).catch(() => {});
    window.addEventListener('load', () => setTimeout(build, 320));
  }

  /* ---------- 05 SOCIALS 链式展开手风琴（单开 / 键盘 / Esc / 点外关闭；GSAP 入场） ---------- */
  function initSocialsAccordion() {
    const acc = $('#socialAcc');
    if (!acc) return;
    const items = $$('.acc__item', acc);
    const setOpen = (it, open) => {
      it.classList.toggle('is-active', open);
      it.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    const closeAll = (except) => items.forEach((it) => { if (it !== except) setOpen(it, false); });
    items.forEach((it) => {
      it.addEventListener('click', (e) => {
        if (e.target.closest('.acc__close')) { setOpen(it, false); return; }
        if (e.target.closest('.acc__go')) return; // 链接正常跳转
        if (it.classList.contains('is-active')) { setOpen(it, false); return; }
        closeAll(it); setOpen(it, true);
      });
      it.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.click(); }
      });
    });
    document.addEventListener('click', (e) => { if (!acc.contains(e.target)) closeAll(null); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(null); });

    // 入场：有 GSAP 时 stagger 浮入，否则默认可见
    if (HAS_GSAP && !REDUCED) {
      try {
        const gsap = window.gsap, ST = window.ScrollTrigger;
        gsap.set(items, { y: 46, opacity: 0 });
        ST.create({
          trigger: acc, start: 'top 80%', once: true,
          onEnter: () => gsap.to(items, { y: 0, opacity: 1, duration: 0.8, stagger: 0.09, ease: 'power3.out' })
        });
      } catch (e) { items.forEach((it) => { it.style.opacity = ''; it.style.transform = ''; }); }
    }
  }

  /* ---------- 05 HONORS 3D 堆叠牌堆（改编自 3d-card-slidergsap；无 GSAP/减少动态时静态铺开） ---------- */
  function initHonors() {
    const deck = $('#hDeck');
    if (!deck) return;
    const stage = deck.closest('.honors__stage');
    const cards = $$('.hcard', deck);
    const n = cards.length;
    if (!n) return;
    const cur = $('#honCur'), total = $('#honTotal'), dotsWrap = $('#honDots');
    if (total) total.textContent = String(n).padStart(2, '0');
    if (!(HAS_GSAP && !REDUCED)) { stage.classList.add('is-static'); return; }
    const gsap = window.gsap;
    stage.classList.add('is-deck');

    const dots = [];
    if (dotsWrap) cards.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', window.MOLI_I18N
        ? window.MOLI_I18N.t('honors.dot').replace('{n}', String(i + 1))
        : '查看第 ' + (i + 1) + ' 张荣誉');
      b.addEventListener('click', (e) => { e.stopPropagation(); goTo(i); });
      dotsWrap.appendChild(b); dots.push(b);
    });
    if (dotsWrap && window.MOLI_I18N) {
      window.MOLI_I18N.onChange(() => $$('button', dotsWrap).forEach((d, i) => {
        d.setAttribute('aria-label', window.MOLI_I18N.t('honors.dot').replace('{n}', String(i + 1)));
      }));
    }

    let order = cards.map((_, i) => (i + 1) % n); // 队尾为最前一张；初始最前为 01，向右切换数字递增
    let busy = false, falling = null;   // falling：后退时正在下坠的旧前卡，落定前不参与重排
    const frontIndex = () => order[n - 1];

    function layout() {
      order.forEach((cardIdx, pos) => {
        const card = cards[cardIdx];
        if (card === falling) return;
        const depth = n - 1 - pos, isFront = depth === 0;
        card.classList.toggle('is-front', isFront);
        card.style.zIndex = String(pos + 1);
        gsap.to(card, {
          xPercent: -50, yPercent: -50, y: depth * 18, z: -depth * 70,
          scale: 1 - depth * 0.05, rotateX: depth * 2,
          opacity: depth > 3 ? 0.35 : 1, duration: 0.7, ease: 'power3.out', overwrite: 'auto'
        });
        const body = $('.hcard__body', card);
        if (body) gsap.to(body, { y: isFront ? 0 : 26, opacity: isFront ? 1 : 0, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
      });
      const f = frontIndex();
      if (cur) cur.textContent = String(f + 1).padStart(2, '0');
      dots.forEach((d, i) => d.classList.toggle('is-active', i === f));
    }
    gsap.set(cards, { xPercent: -50, yPercent: -50 });
    layout();

    // 前进（数字 +1）：下一张自上方落入牌堆顶
    function goForward() {
      if (busy) return; busy = true;
      order.push(order.shift());
      const rising = cards[order[n - 1]];
      gsap.set(rising, { y: -380, rotateX: 55, opacity: 0, zIndex: n + 5 });
      layout();
      setTimeout(() => { busy = false; }, 700);
    }
    // 后退（数字 -1）：立即重排露出后一张，旧前卡向下甩出后归位到牌堆最深层
    function goBack() {
      if (busy) return; busy = true;
      const moving = cards[order[n - 1]], body = $('.hcard__body', moving);
      order.unshift(order.pop());
      falling = moving;
      gsap.set(moving, { zIndex: n + 6 });
      if (body) gsap.to(body, { y: 60, opacity: 0, duration: 0.35, ease: 'power2.in' });
      layout();
      gsap.to(moving, {
        y: '+=170%', rotateX: -55, opacity: 0, duration: 0.7, ease: 'power3.in',
        onComplete: () => {
          falling = null;
          gsap.set(moving, { y: 0, rotateX: 0, opacity: 1 });
          layout();
          setTimeout(() => { busy = false; }, 520);
        }
      });
    }
    function goTo(i) {
      if (busy) return;
      let guard = 0;
      while (frontIndex() !== i && guard++ < n) order.push(order.shift());
      layout();
    }

    const prevBtn = $('#honPrev'), nextBtn = $('#honNext');
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goForward(); });
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goBack(); });
    deck.addEventListener('click', goForward);
  }

  /* ---------- 大字扫光（滚动进度写入 --gy，GSAP/原生都用） ---------- */
  function initStatements() {
    const texts = $$('[data-statement]');
    if (!texts.length || REDUCED) { texts.forEach((t) => t.style.setProperty('--gy', '50%')); return; }
    let ticking = false;
    function update() {
      const vh = window.innerHeight;
      texts.forEach((t) => {
        const r = t.getBoundingClientRect();
        const p = (vh * 0.5 - r.top) / (r.height + vh * 0.5);
        t.style.setProperty('--gy', (Math.max(0, Math.min(1, p)) * 100).toFixed(1) + '%');
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }


  /* ---------- 作品斜向卡片队列（GSAP 时补间切换，否则即时） ---------- */
  function initWorks() {
    const deck = $('#worksDeck');
    if (!deck) return;
    const cards = $$('.work-card', deck);
    const details = $$('.work-detail');
    const dots = $$('.works__dot');
    const prev = $('#workPrev');
    const next = $('#workNext');
    const total = cards.length;
    let active = 0;
    deck.setAttribute('tabindex', '0');
    deck.setAttribute('role', 'listbox');
    const deckLabel = () => deck.setAttribute('aria-label', window.MOLI_I18N
      ? window.MOLI_I18N.t('works.deckAria')
      : '项目卡片，可用左右方向键切换');
    deckLabel();
    if (window.MOLI_I18N) window.MOLI_I18N.onChange(deckLabel);

    if (HAS_GSAP) { // 先建立 GSAP 变换基线（替代 CSS 的 translate(-50%,-50%)）
      window.gsap.set(cards, { xPercent: -50, yPercent: -50, x: 0, y: 0, rotation: 0, scale: 1 });
    }

    function layout() {
      const desktop = DESKTOP();
      cards.forEach((card, i) => {
        card.classList.toggle('is-active', i === active);
        card.setAttribute('aria-selected', String(i === active));
        const d = i - active, ad = Math.abs(d);
        if (!desktop) {
          if (HAS_GSAP) window.gsap.set(card, { clearProps: 'transform,opacity' });
          else { card.style.transform = ''; card.style.zIndex = ''; }
          return;
        }
        const x = d * 104, y = d * 32, rot = d * 6;
        const scale = d === 0 ? 1 : (ad === 1 ? 0.78 : ad === 2 ? 0.66 : 0.56);
        const op = ad > 2 ? 0.5 : 1;
        card.style.zIndex = String(total - ad);
        if (HAS_GSAP) {
          window.gsap.to(card, { x, y, rotation: rot, scale, opacity: op, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
        } else {
          card.style.opacity = String(op);
          card.style.transform =
            'translate(calc(-50% + ' + x + 'px), calc(-50% + ' + y + 'px)) rotate(' + rot + 'deg) scale(' + scale + ')';
        }
      });
    }

    function animateDetail() {
      const art = $('.work-detail:not([hidden])');
      if (art && HAS_GSAP) {
        window.gsap.fromTo(art.children,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out', overwrite: true });
      }
    }

    function setActive(n) {
      active = (n + total) % total;
      details.forEach((d, i) => {
        d.hidden = i !== active;
        if (i === active) { d.style.animation = 'none'; void d.offsetWidth; d.style.animation = ''; }
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === active);
        dot.setAttribute('aria-selected', String(i === active));
      });
      layout();
      animateDetail();
    }

    cards.forEach((c) => c.addEventListener('click', () => setActive(Number(c.dataset.work))));
    dots.forEach((d) => d.addEventListener('click', () => setActive(Number(d.dataset.goto))));
    if (prev) prev.addEventListener('click', () => setActive(active - 1));
    if (next) next.addEventListener('click', () => setActive(active + 1));
    deck.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); setActive(active + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(active - 1); }
    });
    window.addEventListener('resize', layout, { passive: true });
    setActive(0);
  }


  /* =============================================================
     GSAP 高端动效层
     ============================================================= */
  function initGSAP() {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    // 只注册实际存在的插件，单个缺失不影响其它
    [window.ScrollToPlugin, window.ScrollSmoother, window.SplitText,
     window.ScrambleTextPlugin, window.DrawSVGPlugin].forEach((p) => { if (p) gsap.registerPlugin(p); });
    gsap.registerPlugin(ST);
    docEl.classList.add('gsap-on');

    let smoother = null;
    try {
      if (window.ScrollSmoother && FINE && DESKTOP() && !NO_SMOOTH) {
        smoother = window.ScrollSmoother.create({
          wrapper: '#smooth-wrapper', content: '#smooth-content',
          smooth: 1.1, effects: true, normalizeScroll: true, smoothTouch: 0
        });
      }
    } catch (e) { smoother = null; }

    /* ---- 锚点定位：默认走红色幕布转场（盖住的瞬间跳转再揭开）；减少动态时退回丝滑滚动 ---- */
    let wipeEl = null, wipeBusy = false;
    function ensureWipe() {
      if (wipeEl) return wipeEl;
      wipeEl = document.createElement('div');
      wipeEl.className = 'wipe'; wipeEl.setAttribute('aria-hidden', 'true');
      wipeEl.innerHTML = '<span class="wipe__brand">MOLI<i>.</i></span>';
      document.body.appendChild(wipeEl);
      return wipeEl;
    }
    function instantTo(target) {
      if (smoother) { try { smoother.scrollTo(target, false, 'top 72px'); return; } catch (e) {} }
      const y = target.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo(0, Math.max(0, y));
    }
    function warpTo(target) {
      const w = ensureWipe(), brand = w.querySelector('.wipe__brand');
      wipeBusy = true;
      gsap.timeline({ onComplete: () => { wipeBusy = false; } })
        .set(w, { yPercent: -101 })
        .to(w, { yPercent: 0, duration: 0.42, ease: 'power3.in' })
        .to(brand, { opacity: 1, scale: 1.05, duration: 0.3, ease: 'power2.out' }, '-=0.16')
        .add(() => instantTo(target))
        .to(brand, { opacity: 0, scale: 0.95, duration: 0.2 }, '+=0.05')
        .to(w, { yPercent: 101, duration: 0.5, ease: 'power3.inOut' })
        .set(w, { yPercent: -101 });
    }
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = $(href);
        if (!target) return;
        e.preventDefault();
        if (!REDUCED && !wipeBusy) warpTo(target);
        else if (smoother) smoother.scrollTo(target, true, 'top 72px');
        else if (window.ScrollToPlugin) gsap.to(window, { scrollTo: { y: target, offsetY: 72 }, duration: 0.85, ease: 'power3.inOut' });
        else target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    /* ---- Hero 开场时间线 ---- */
    function heroIntro() {
      const GLYPHS = '01!<>-_/[]{}=+*#';
      const meta = $('.hero__meta');
      const nameEl = $('.hero__name-text');
      const roleEl = $('.hero__role');
      const tagline = $('.hero__tagline');
      const cta = $('.hero__cta');
      const scroll = $('.hero__scroll');
      const roleText = roleEl ? roleEl.textContent : '';

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      gsap.set('.hero__name', { perspective: 600 });
      if (meta) gsap.set(meta, { opacity: 0, y: 18 });
      let nameChars = null;
      if (nameEl && window.SplitText) {
        const ns = new window.SplitText(nameEl, { type: 'chars', charsClass: 'split-char' });
        nameChars = ns.chars;
        gsap.set(nameChars, { yPercent: 120, opacity: 0, rotateX: -55, transformOrigin: '50% 100%' });
      } else if (nameEl) { gsap.set(nameEl, { opacity: 0 }); }
      if (roleEl) gsap.set(roleEl, { opacity: 0 });
      if (tagline) gsap.set(tagline, { opacity: 0, y: 20 });
      if (cta) gsap.set(cta, { opacity: 0, y: 24 });
      if (scroll) gsap.set(scroll, { opacity: 0 });

      if (meta) tl.to(meta, { opacity: 1, y: 0, duration: 0.7 }, 0.15);
      if (nameChars) tl.to(nameChars, { yPercent: 0, opacity: 1, rotateX: 0, duration: 0.9, stagger: 0.07 }, 0.3);
      else if (nameEl) tl.to(nameEl, { opacity: 1, duration: 0.7 }, 0.3);
      if (roleEl) {
        roleEl.textContent = '';
        if (window.ScrambleTextPlugin) {
          // 单个补间同时完成淡入与解码，结束态一定是不透明 + 完整文字；onComplete 兜底确保文字不丢
          tl.to(roleEl, {
            opacity: 1, scrambleText: { text: roleText, chars: GLYPHS, speed: 0.5 }, duration: 1.15,
            onComplete: () => { roleEl.textContent = roleText; }
          }, '-=0.45');
        } else { roleEl.textContent = roleText; tl.to(roleEl, { opacity: 1, duration: 0.5 }, '-=0.4'); }
      }
      if (tagline) tl.to(tagline, { opacity: 1, y: 0, duration: 0.7 }, '-=0.65');
      if (cta) tl.to(cta, { opacity: 1, y: 0, duration: 0.7 }, '-=0.55');
      if (scroll) tl.to(scroll, { opacity: 1, duration: 0.8 }, '-=0.2');

      // 兜底：3.2s 后无论时间线是否走完，都保证 Hero 内容可见、身份行不丢字
      setTimeout(() => {
        gsap.to([meta, nameEl, roleEl, tagline, cta, scroll].filter(Boolean),
          { opacity: 1, y: 0, yPercent: 0, rotateX: 0, duration: 0.4, clearProps: 'transform' });
        if (nameChars) gsap.set(nameChars, { opacity: 1, yPercent: 0, rotateX: 0 });
        if (roleEl && !roleEl.textContent.trim()) roleEl.textContent = roleText;
      }, 3200);
    }

    /* ---- 大标题：SplitText 逐字 3D 翻转 + 去模糊弹入（行遮罩防止溢出） ---- */
    function headingsReveal() {
      if (!window.SplitText) return;
      gsap.utils.toArray('.section__title, .contact__title').forEach((h) => {
        const split = new window.SplitText(h, {
          type: 'lines,chars', mask: 'lines', linesClass: 'split-line', charsClass: 'split-char tc'
        });
        gsap.from(split.chars, {
          yPercent: 118, rotateX: -60, rotateZ: () => gsap.utils.random(-4, 4),
          transformPerspective: 700, filter: 'blur(10px)', duration: 0.9,
          stagger: { each: 0.03, from: 'start' }, ease: 'power4.out',
          scrollTrigger: { trigger: h, start: 'top 85%', once: true },
          onComplete: () => gsap.set(split.chars, { clearProps: 'filter,rotateZ,rotateX' })
        });
      });
    }

    /* ---- 宣言大字：字距收拢 + 轻微视差（不破坏渐变扫光） ---- */
    function statementsReveal() {
      gsap.utils.toArray('.statement__text').forEach((t) => {
        gsap.from(t, {
          opacity: 0.12, letterSpacing: '0.16em', duration: 1.2, ease: 'power2.out',
          scrollTrigger: { trigger: t.closest('.statement'), start: 'top 78%', once: true }
        });
        gsap.fromTo(t, { yPercent: -6 }, {
          yPercent: 6, ease: 'none',
          scrollTrigger: { trigger: t.closest('.statement'), start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }

    /* ---- 通用滚动揭示（排除已被专门处理的 Hero / 标题 / 时间线条目） ---- */
    function genericReveal() {
      const items = gsap.utils.toArray('[data-reveal]').filter((el) => {
        if (el.closest('.hero')) return false;
        if (el.classList.contains('section__title') || el.classList.contains('contact__title')) return false;
        if (el.closest('.timeline__item')) return false;
        return true;
      });
      gsap.set(items, { opacity: 0, y: 30 });
      ST.batch(items, {
        start: 'top 88%', once: true,
        onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out', overwrite: true })
      });
      return items;
    }

    /* ---- 时间线条目滑入 ---- */
    /* ---- 04 PATH：pin 住整屏，纵向滚动驱动轨道横向平移 + 粗红路线 DrawSVG 描线 ---- */
    function horizontalPath() {
      const sec = $('#path');
      if (!sec || sec.classList.contains('is-native')) return;
      const stage = $('#hPath');
      const track = $('#hPathTrack');
      const prog = $('.hpath__route-prog');
      const bar = $('.hpath__bar i');
      if (!stage || !track) return;
      const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage, pin: true, scrub: 1,
          start: 'top top', end: () => '+=' + distance(),
          invalidateOnRefresh: true
        }
      });
      tl.to(track, { x: () => -distance(), ease: 'none' }, 0);
      if (prog && window.DrawSVGPlugin) {
        gsap.set(prog, { drawSVG: 0 });
        tl.to(prog, { drawSVG: '100%', ease: 'none' }, 0);
      }
      if (bar) tl.fromTo(bar, { width: '0%' }, { width: '100%', ease: 'none' }, 0);
    }

    /* ---- About 数字滚动计数（∞ 与 + 号保留） ---- */
    function countUp() {
      gsap.utils.toArray('.about__num').forEach((el) => {
        const textNode = Array.from(el.childNodes).find((n) => n.nodeType === 3 && /\d/.test(n.textContent));
        if (!textNode) return;
        const raw = textNode.textContent;
        const mm = raw.match(/\d+/);
        if (!mm) return;
        const end = parseInt(mm[0], 10), pad = mm[0].length;
        const state = { v: 0 };
        textNode.textContent = raw.replace(/\d+/, String(0).padStart(pad, '0'));
        ST.create({
          trigger: el, start: 'top 92%', once: true,
          onEnter: () => gsap.to(state, {
            v: end, duration: 1.2, ease: 'power2.out',
            onUpdate: () => { textNode.textContent = raw.replace(/\d+/, String(Math.round(state.v)).padStart(pad, '0')); }
          })
        });
      });
    }

    /* ---- 03 构建流水线：红色主轴随滚动描下 + 节点依次点亮填红 ---- */
    function skillsAnimate() {
      const sec = document.getElementById('buildFlow');
      if (!sec) return;
      const fill = $('.build__spine-fill', sec);
      const steps = gsap.utils.toArray('.build__step', sec);
      if (fill) {
        gsap.set(fill, { scaleY: 0, transformOrigin: 'top' });
        gsap.to(fill, {
          scaleY: 1, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top 80%', end: 'bottom 55%', scrub: true }
        });
      }
      steps.forEach((st) => {
        const node = $('.build__node', st);
        ST.create({
          trigger: st, start: 'top 82%', once: true,
          onEnter: () => {
            st.classList.add('is-on');
            if (node) gsap.fromTo(node, { scale: 0.4, opacity: 0.4 },
              { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)',
                onComplete: () => gsap.set(node, { clearProps: 'transform,opacity' }) });
          }
        });
      });
    }

    /* ---- Hero 名字轻微视差 ---- */
    function parallax() {
      const name = $('.hero__name');
      if (name) gsap.to(name, {
        yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    /* ---- 背景视频：Ken Burns 呼吸缩放 + 滚动视差（scale 与 yPercent 互补，不与 CSS 动画冲突） ---- */
    function videoParallax() {
      const vids = gsap.utils.toArray('.bg-video');
      vids.forEach((v) => {
        gsap.set(v, { scale: 1.02 });
        gsap.to(v, { scale: 1.12, duration: 16, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        const host = v.closest('section, .site-tail') || v.parentElement;
        gsap.fromTo(v, { yPercent: -5 }, {
          yPercent: 5, ease: 'none',
          scrollTrigger: { trigger: host, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }

    /* ---- Hero 鼠标多层视差：背景反向、名字/文案正向，制造纵深（仅精细指针） ---- */
    function heroPointer() {
      if (!FINE) return;
      const hero = $('.hero');
      if (!hero) return;
      const bg = $('.hero__bg'), name = $('.hero__name'), sub = $('.hero__role');
      const move = (el, x, y, d) => { if (el) gsap.to(el, { x, y, duration: d, ease: 'power3.out', overwrite: 'auto' }); };
      hero.addEventListener('mousemove', (e) => {
        const r = hero.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width - 0.5;
        const cy = (e.clientY - r.top) / r.height - 0.5;
        move(bg, -cx * 16, -cy * 16, 0.9);
        move(name, cx * 26, cy * 18, 0.5);
        move(sub, cx * 12, cy * 10, 0.5);
      });
      hero.addEventListener('mouseleave', () => {
        [bg, name, sub].forEach((el) => move(el, 0, 0, 1));
      });
    }

    /* ---- 导航红色滑动指示器：按位置自算当前栏目（不依赖 IO 时序），悬停临时跟随 ---- */
    function navIndicator() {
      const wrap = $('#navLinks');
      if (!wrap) return;
      const ind = document.createElement('span');
      ind.className = 'nav__ind'; ind.setAttribute('aria-hidden', 'true');
      wrap.appendChild(ind);
      const links = $$('[data-nav]', wrap);
      const byHref = {};
      links.forEach((l) => { byHref[l.getAttribute('href').slice(1)] = l; });
      const secs = $$('main section[id], .site-tail section[id]');
      const place = (el) => {
        if (!el) { gsap.to(ind, { opacity: 0, duration: 0.25, overwrite: 'auto' }); return; }
        gsap.to(ind, { x: el.offsetLeft, width: el.offsetWidth, opacity: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      };
      let hovered = null;
      const current = () => {
        if (window.pageYOffset < window.innerHeight * 0.45) return null; // 顶部 Hero 不亮
        const line = window.innerHeight * 0.42;
        let found = null;
        secs.forEach((s) => { const r = s.getBoundingClientRect(); if (r.top <= line && r.bottom > line) found = s.id; });
        return found;
      };
      const sync = () => {
        if (!DESKTOP()) return;
        if (hovered) { place(hovered); return; }
        const id = current();
        links.forEach((l) => l.classList.toggle('is-active', !!id && l === byHref[id]));
        place(id ? byHref[id] : null);
      };
      window.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
      window.addEventListener('resize', sync, { passive: true });
      links.forEach((l) => {
        l.addEventListener('mouseenter', () => { if (DESKTOP()) { hovered = l; place(l); } });
        l.addEventListener('mouseleave', () => { hovered = null; sync(); });
      });
      setTimeout(sync, 300);
      setTimeout(sync, 1200);
    }

    /* ---- 作品卡 3D 倾斜 + 红色追光（仅当前卡 / 桌面精细指针） ---- */
    function workTilt() {
      if (!FINE) return;
      const deck = $('#worksDeck');
      if (!deck) return;
      const cards = gsap.utils.toArray('.work-card', deck);
      deck.addEventListener('pointermove', (e) => {
        if (!DESKTOP()) return;
        const c = $('.work-card.is-active', deck);
        if (!c) return;
        const r = c.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty('--cx', ((nx + 0.5) * 100).toFixed(1) + '%');
        c.style.setProperty('--cy', ((ny + 0.5) * 100).toFixed(1) + '%');
        gsap.to(c, { rotationY: nx * 15, rotationX: -ny * 13, transformPerspective: 750, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      });
      const reset = () => gsap.to(cards, { rotationX: 0, rotationY: 0, duration: 0.6, ease: 'power3.out' });
      deck.addEventListener('pointerleave', reset);
      deck.addEventListener('click', () => gsap.to(cards, { rotationX: 0, rotationY: 0, duration: 0.3 }));
    }

    /* ---- 页脚巨型 MOLI：随滚动从描边被红色逐字填充 ---- */
    function footerFill() {
      const big = $('.footer__big');
      if (!big) return;
      const proxy = { p: 0 };
      big.style.setProperty('--fw', '0%');
      gsap.to(proxy, {
        p: 100, ease: 'none',
        // 页脚是最后一个元素：到底时其底边正好贴视口底（bottom bottom），
        // 用这个可达终点保证滚到最底时 MOLI 100% 填满（end 小于 100% 会永远填不满）
        scrollTrigger: { trigger: '.footer', start: 'top 88%', end: 'bottom bottom', scrub: true },
        onUpdate: () => big.style.setProperty('--fw', proxy.p.toFixed(1) + '%')
      });
    }

    /* ---- 主按钮磁吸微交互（仅精细指针） ---- */
    function magnetic() {
      if (!FINE) return;
      gsap.utils.toArray('.btn--primary').forEach((btn) => {
        btn.classList.add('is-magnetic');
        btn.addEventListener('mousemove', (e) => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.28, duration: 0.4, ease: 'power3.out' });
        });
        btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }));
      });
    }

    // 各子模块独立容错
    [heroIntro, headingsReveal, statementsReveal, genericReveal, horizontalPath,
     countUp, skillsAnimate, parallax, videoParallax, heroPointer, navIndicator,
     workTilt, footerFill, magnetic].forEach((fn) => {
      try { fn(); } catch (err) { console.warn('[MOLI] gsap module skipped:', fn.name, err); }
    });

    // 字体与图片加载后重算触发点；兜底显示首屏已可见的揭示元素，绝不永久隐藏
    window.addEventListener('load', () => {
      setTimeout(() => {
        ST.refresh();
        gsap.utils.toArray('[data-reveal]').forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight * 0.95) gsap.set(el, { opacity: 1, y: 0 });
        });
      }, 300);
    });
    // 深链兼容：pin 区块会改变文档高度，最终 refresh 后若带 hash 再校正一次落点
    setTimeout(() => {
      ST.refresh();
      const h = location.hash;
      if (h && h.length > 1) {
        const t = $(h);
        if (t) {
          try {
            if (smoother) smoother.scrollTo(t, false, 'top top');
            else window.scrollTo(0, t.getBoundingClientRect().top + window.pageYOffset);
          } catch (e) {}
        }
      }
    }, 1000);
  }


  /* ---------- 背景视频：自动播放、离屏暂停省电、减少动态时定格首帧 ---------- */
  function initVideoBackgrounds() {
    const vids = $$('.bg-video');
    if (!vids.length) return;

    if (REDUCED) {
      // 尊重系统设置：不播放，停在 poster 首帧
      vids.forEach((v) => { v.removeAttribute('autoplay'); try { v.pause(); } catch (e) {} });
      return;
    }

    // 无 GSAP 时用 CSS Ken Burns；有 GSAP 时交给 videoParallax()，避免 transform 冲突
    if (!HAS_GSAP) vids.forEach((v) => { const layer = v.closest('.bg-layer'); if (layer) layer.classList.add('is-live'); });

    const play = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };

    vids.forEach((v) => {
      v.addEventListener('loadeddata', () => { v.playbackRate = 0.75; }, { once: true });
      play(v); // 静音 + playsinline，桌面/移动端都允许自动播放
    });

    // 进入视口前一点预加载并播放，离开暂停以省电省流（适配移动端）
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const v = e.target;
          if (e.isIntersecting) { v.preload = 'auto'; play(v); }
          else { try { v.pause(); } catch (err) {} }
        });
      }, { threshold: 0.01, rootMargin: '200px 0px' });
      vids.forEach((v) => io.observe(v));
    }
  }

  /* ---------- 顶部滚动进度条：GSAP scrub，无 GSAP 时原生监听 ---------- */
  function initScrollProgress() {
    const bar = $('#scrollProgress');
    if (!bar) return;
    if (REDUCED) { bar.style.display = 'none'; return; }
    if (HAS_GSAP && window.ScrollTrigger) {
      gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
      });
    } else {
      const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        bar.style.transform = 'scaleX(' + p + ')';
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update, { passive: true });
    }
  }

  /* ---------- 深色区指针聚光灯（仅桌面精细指针，触摸端 CSS 已关闭） ---------- */
  function initSpotlight() {
    if (!FINE) return;
    $$('.spot-target').forEach((zone) => {
      let raf = null;
      zone.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = zone.getBoundingClientRect();
          zone.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
          zone.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
          zone.classList.add('has-spot');
          raf = null;
        });
      });
      zone.addEventListener('pointerleave', () => zone.classList.remove('has-spot'));
    });
  }

  /* ---------- 开场幕布：纯 CSS/计时，不依赖 GSAP；减少动态立即收起 ---------- */
  function initIntro() {
    const intro = $('#intro');
    if (!intro) return;
    const dismiss = () => { docEl.classList.add('intro-off'); intro.classList.add('is-done'); };
    if (REDUCED) { dismiss(); return; }
    requestAnimationFrame(() => intro.classList.add('is-run'));
    setTimeout(() => docEl.classList.add('intro-off'), 1150);
    setTimeout(dismiss, 2100);
    window.addEventListener('load', () => setTimeout(dismiss, 1500)); // 兜底，绝不卡住页面
  }

  /* ---------- 回到顶部：滚过一屏后浮现（GSAP 下点击丝滑，否则原生锚点） ---------- */
  function initToTop() {
    const btn = $('#toTop');
    if (!btn) return;
    const onScroll = () => btn.classList.toggle('is-show', window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /* ---------- 按钮点击涟漪（从点击点扩散，仅精细/非减少动态） ---------- */
  function initRipple() {
    if (REDUCED) return;
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest && e.target.closest('.btn');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.left = (e.clientX - r.left - 6) + 'px';
      dot.style.top = (e.clientY - r.top - 6) + 'px';
      btn.appendChild(dot);
      requestAnimationFrame(() => dot.classList.add('is-go'));
      dot.addEventListener('animationend', () => dot.remove());
      setTimeout(() => dot.remove(), 700);
    });
  }

  /* ---------- 一键复制邮箱（含 textarea 兜底） ---------- */
  function initCopyEmail() {
    $$('.contact-copy').forEach((btn) => {
      const restoreLabel = () => { btn.textContent = window.MOLI_I18N ? window.MOLI_I18N.t('contact.copy') : '复制邮箱'; };
      const flash = () => {
        btn.classList.add('is-copied');
        btn.textContent = window.MOLI_I18N ? window.MOLI_I18N.t('contact.copied') : '已复制 ✓';
        setTimeout(() => { btn.classList.remove('is-copied'); restoreLabel(); }, 1600);
      };
      btn.addEventListener('click', () => {
        const text = btn.dataset.email || '';
        const fallback = () => {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (err) {}
          ta.remove(); flash();
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(flash).catch(fallback);
        } else fallback();
      });
    });
  }

  /* ---------- 区块标签红色短线：进入视口生长 ---------- */
  function initLabelRules() {
    const labels = $$('.section__label');
    if (!labels.length) return;
    if (REDUCED) { labels.forEach((l) => l.classList.add('is-in')); return; }
    onEnter(labels, (l) => l.classList.add('is-in'), { threshold: 0.4 });
  }

  /* ---------- 区块幽灵大序号：注入 + GSAP 滚动视差 ---------- */
  function initGhostIndexes() {
    const map = [['#about', '01', true], ['#works', '02', false], ['#skills', '03', true], ['#path', '04', true], ['#honors', '05', false], ['#socials', '06', false], ['#contact', '07', true]];
    map.forEach(([sel, num, clip]) => {
      const sec = $(sel);
      if (!sec) return;
      sec.classList.add('has-ghost');
      if (clip) sec.classList.add('has-ghost--clip');
      const g = document.createElement('span');
      g.className = 'ghost-index';
      g.setAttribute('aria-hidden', 'true');
      g.textContent = num;
      sec.appendChild(g);
    });
    if (HAS_GSAP && !REDUCED) {
      // 延迟到 load，确保 ScrollSmoother/插件已在 initGSAP 中就绪
      window.addEventListener('load', () => {
        setTimeout(() => {
          try {
            window.gsap.utils.toArray('.ghost-index').forEach((g) => {
              window.gsap.fromTo(g, { yPercent: 16 }, {
                yPercent: -16, ease: 'none',
                scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
              });
            });
          } catch (e) {}
        }, 350);
      });
    }
  }

  /* ---------- 宣言带「微粒场」（机制改编自 CodePen Shape Wave / donotfold，黑白红重写） ----------
     一片几乎不可见的微粒点阵：指针靠近时平滑绽放（少量转红），点击 / 进入视口时
     从触发点扩散一圈环形波、波峰经过的微粒依次亮起；小标题区域做矩形挖空保证可读。
     纯 canvas、不依赖 GSAP；仅在视口内运行 rAF，离开/切后台自动暂停；减少动态时不生成。 */
  function initShapeFields() {
    if (REDUCED) return;
    const sections = $$('.statement');
    if (!sections.length || !document.createElement('canvas').getContext) return;

    const GAP = 36;                 // 网格间距
    const REST = 0.12;              // 静止缩放
    const RADIUS_VMIN = 24;         // 指针影响半径（占区块短边比例）
    const SPEED_IN = 0.45, SPEED_OUT = 0.6;
    const MIN_BLOOM = 1.1, MAX_BLOOM = 2.6;
    const WAVE_SPEED = 950, WAVE_WIDTH = 150;
    const RED = '#FF312E';

    const dFactor = (s) => (s <= 0 ? 1 : 1 - Math.pow(0.05, 1 / (60 * s)));
    const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    const rnd = (a, b) => Math.random() * (b - a) + a;
    const FIN = 0.42, FOUT = 1;    // 静止 / 绽放不透明度

    function createField(section) {
      const dark = section.classList.contains('statement--dark');
      const INK = dark ? '255,255,250' : '0,1,3';           // 主微粒色（暗底暖白 / 亮底近黑）
      const canvas = document.createElement('canvas');
      canvas.className = 'shape-field';
      canvas.setAttribute('aria-hidden', 'true');
      section.prepend(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) { canvas.remove(); return; }

      let W = 0, H = 0, shapes = [], waves = [], maskRects = [];
      let pointer = null, activity = 0, overrideUntil = 0, frameN = 0;
      let raf = null, running = false, welcomed = false;

      function build() {
        W = section.clientWidth; H = section.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const cols = Math.max(1, Math.ceil(W / GAP) + 1);
        const rows = Math.max(1, Math.ceil(H / GAP) + 1);
        const offX = (W - (cols - 1) * GAP) / 2;
        const offY = (H - (rows - 1) * GAP) / 2;
        shapes = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const roll = Math.random();
            shapes.push({
              x: offX + c * GAP, y: offY + r * GAP,
              base: GAP * 0.17, scale: REST, maxScale: rnd(MIN_BLOOM, MAX_BLOOM),
              ang: rnd(0, Math.PI * 2), hovered: false,
              red: Math.random() < 0.24,
              kind: roll < 0.8 ? 'dot' : (roll < 0.9 ? 'ring' : 'plus')
            });
          }
        }
      }

      // 小标题（mono 副标）做挖空，避免微粒压字
      function updateMasks() {
        const sr = section.getBoundingClientRect();
        maskRects = $$('[data-shape-mask], .statement__sub', section).map((el) => {
          const r = el.getBoundingClientRect();
          return { l: r.left - sr.left, t: r.top - sr.top, rr: r.right - sr.left, b: r.bottom - sr.top };
        });
      }

      function addWave(x, y) {
        waves.push({ x, y, t: performance.now() });
        overrideUntil = performance.now() + (Math.hypot(W, H) / WAVE_SPEED) * 1000;
      }

      function drawShape(s, radius, alpha) {
        const isRed = s.red;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = isRed ? RED : `rgba(${INK},1)`;
        ctx.strokeStyle = isRed ? RED : `rgba(${INK},1)`;
        ctx.save();
        ctx.translate(s.x, s.y); ctx.rotate(s.ang);
        if (s.kind === 'dot') {
          ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
        } else if (s.kind === 'ring') {
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.lineWidth = 1.6; const l = radius * 1.3;
          ctx.beginPath();
          ctx.moveTo(-l, 0); ctx.lineTo(l, 0); ctx.moveTo(0, -l); ctx.lineTo(0, l);
          ctx.stroke();
        }
        ctx.restore();
      }

      function frame(now) {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);
        activity *= 0.93;
        const radius = Math.min(W, H) * (RADIUS_VMIN / 100);
        const maxD = Math.hypot(W, H);
        waves = waves.filter((w) => ((now - w.t) / 1000) * WAVE_SPEED < maxD + WAVE_WIDTH);
        frameN++; if (frameN % 12 === 0) updateMasks();
        const maskedOff = now < overrideUntil;
        const pad = GAP / 2;

        for (let i = 0; i < shapes.length; i++) {
          const s = shapes[i];
          let masked = false;
          if (!maskedOff) {
            for (let k = 0; k < maskRects.length; k++) {
              const m = maskRects[k];
              if (s.x >= m.l - pad && s.x <= m.rr + pad && s.y >= m.t - pad && s.y <= m.b + pad) { masked = true; break; }
            }
          }
          if (masked) {
            s.scale += (0 - s.scale) * dFactor(SPEED_OUT);
            if (s.scale < 0.004) s.scale = 0;
            continue;
          }

          let pInf = 0;
          if (pointer && activity > 0.001) {
            const d = Math.hypot(s.x - pointer.x, s.y - pointer.y);
            pInf = smooth(1 - d / radius) * activity;
            if (pInf > 0.05 && !s.hovered) { s.hovered = true; s.ang = rnd(0, Math.PI * 2); s.maxScale = rnd(MIN_BLOOM, MAX_BLOOM); }
            else if (pInf <= 0.05) s.hovered = false;
          } else s.hovered = false;

          let wInf = 0;
          for (let j = 0; j < waves.length; j++) {
            const w = waves[j];
            const wr = ((now - w.t) / 1000) * WAVE_SPEED;
            const wd = Math.hypot(s.x - w.x, s.y - w.y);
            const t = 1 - Math.abs(wd - wr) / WAVE_WIDTH;
            if (t > 0) wInf = Math.max(wInf, Math.sin(Math.PI * t));
          }

          const target = REST + Math.max(pInf, wInf) * (s.maxScale - REST);
          s.scale += (target - s.scale) * dFactor(target > s.scale ? SPEED_IN : SPEED_OUT);
          if (s.scale < REST * 0.18) continue;

          const bloom = (s.scale - REST) / (1.4 - REST);
          const alpha = FIN + Math.max(0, Math.min(1, bloom)) * (FOUT - FIN);
          drawShape(s, s.base * s.scale, alpha);
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(frame);
      }

      function start() { if (running) return; running = true; raf = requestAnimationFrame(frame); }
      function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

      // 指针（相对区块坐标；canvas 不接收事件，监听在 section 上，兼容 ScrollSmoother 变换）
      section.addEventListener('pointermove', (e) => {
        if (!FINE) return;
        const r = section.getBoundingClientRect();
        pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
        activity = 1;
      }, { passive: true });
      section.addEventListener('pointerleave', () => { pointer = null; });
      section.addEventListener('pointerdown', (e) => {
        const r = section.getBoundingClientRect();
        addWave(e.clientX - r.left, e.clientY - r.top);
        start();
      }, { passive: true });

      let rT;
      const rebuild = () => { clearTimeout(rT); rT = setTimeout(build, 180); };
      window.addEventListener('resize', rebuild);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else startIfVisible(); });

      // 视口内才跑；第一次进入时从中心放一束「迎宾波」
      let visIO = null;
      function startIfVisible() {
        const r = section.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) start();
      }
      build(); updateMasks();
      visIO = new IntersectionObserver((es) => {
        es.forEach((en) => {
          if (en.isIntersecting) {
            start();
            if (!welcomed && en.intersectionRatio > 0.35) {
              welcomed = true;
              setTimeout(() => addWave(W / 2, H / 2), 220);
            }
          } else stop();
        });
      }, { threshold: [0, 0.35] });
      visIO.observe(section);
    }

    sections.forEach(createField);
  }

  /* ---------- 自定义跟随光标（仅桌面精细指针需要 GSAP；改编自 personal-page，只取光标这一项） ---------- */
  function initCursor() {
    if (!FINE || !window.gsap) return;
    const cur = $('.cursor');
    if (!cur) return;
    const gsap = window.gsap;
    document.documentElement.classList.add('cursor-on');
    gsap.set(cur, {
      xPercent: -50, yPercent: -50, force3D: true,
      x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 0, opacity: 0
    });
    let shown = false, grown = false;
    window.addEventListener('mousemove', (e) => {
      gsap.to(cur, { x: e.clientX, y: e.clientY, duration: 0.42, ease: 'power3.out', overwrite: 'auto' });
      if (!shown) { shown = true; gsap.to(cur, { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }); }
    }, { passive: true });
    document.addEventListener('mouseleave', () => gsap.to(cur, { scale: 0, opacity: 0, duration: 0.15, overwrite: 'auto' }));
    document.addEventListener('mouseenter', () => { if (shown) gsap.to(cur, { scale: grown ? 2.4 : 1, opacity: 1, duration: 0.15, overwrite: 'auto' }); });
    // 悬停可交互元素时放大（事件委托，自动覆盖动态生成的圆点等）
    const hoverSel = 'a, button, [data-cursor="hover"], .work-card, .hcard, .acc__item, .hpanel__img, .honors__dots button, .to-top, .build__step';
    document.addEventListener('mouseover', (e) => {
      const hit = e.target.closest && e.target.closest(hoverSel);
      grown = !!hit;
      if (shown) gsap.to(cur, { scale: hit ? 2.4 : 1, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
    });
  }

  /* ---------- 图片灯箱：点击图片放大查看（Esc / 点遮罩 / 关闭按钮退出），占位块也可点开 ---------- */
  function initLightbox() {
    const lb = $('#lightbox');
    if (!lb) return;
    const img = $('.lightbox__img', lb), ph = $('.lightbox__ph', lb),
          cap = $('.lightbox__cap', lb), closeBtn = $('.lightbox__close', lb);
    let lastFocus = null;
    function open(src, caption) {
      lastFocus = document.activeElement;
      if (src) { img.src = src; img.hidden = false; ph.style.display = 'none'; }
      else { img.removeAttribute('src'); img.hidden = true; ph.style.display = ''; }
      cap.textContent = caption || '';
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('lb-open');
      if (closeBtn) closeBtn.focus();
      const stage = lb.querySelector('.lightbox__stage');
      if (window.gsap && !REDUCED && stage) {
        gsap.killTweensOf(stage);
        gsap.fromTo(stage, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.42, ease: 'power3.out' });
      }
    }
    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('lb-open');
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    }
    document.addEventListener('click', (e) => {
      const trig = e.target.closest && e.target.closest('.hpanel__img, [data-lightbox]');
      if (trig) {
        const inner = trig.querySelector('img');
        const src = trig.getAttribute('data-full') || (inner ? inner.currentSrc || inner.src : '');
        open(src || '', trig.dataset.caption || trig.getAttribute('aria-label') || '');
        return;
      }
      if (lb.classList.contains('is-open') && (e.target === lb || e.target.closest('.lightbox__close'))) close();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('is-open')) close(); });
  }

  /* ---------- 启动：公共模块 + 按能力选择动效层，各自容错 ---------- */
  function boot() {
    const run = (fn) => { try { fn(); } catch (e) { console.warn('[MOLI] module skipped:', fn.name, e); } };
    run(initNav);
    run(initWorks);
    run(initTimeline);
    run(initHorizontalPath);
    run(initSocialsAccordion);
    run(initHonors);
    run(initStatements);
    run(initIntro);
    run(initVideoBackgrounds);
    run(initScrollProgress);
    run(initSpotlight);
    run(initToTop);
    run(initRipple);
    run(initCopyEmail);
    run(initLabelRules);
    run(initGhostIndexes);
    run(initShapeFields);
    run(initCursor);
    run(initLightbox);

    if (HAS_GSAP && !REDUCED) {
      try { initGSAP(); }
      catch (e) {
        console.warn('[MOLI] GSAP layer failed, fallback to native:', e);
        run(initDecode); run(initReveal); run(initBuildFlow);
      }
    } else {
      run(initDecode);
      run(initReveal);
      run(initBuildFlow);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
