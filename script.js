/* Fuzely — approved responsive marketing site
   Behavior: sticky header, mobile nav, FAQ accordions, hero product-demo loops.
   Ported 1:1 from the approved prototype. No layout/styling decisions live here. */
(function () {
  'use strict';

  /* ================= Config + analytics/event hooks ================= */
  // Config is loaded by config.js BEFORE this file. Guarded so a missing
  // config.js never throws. track() is a NO-OP today: analytics.enabled is
  // false, so it returns before doing anything — zero network, zero console
  // noise in normal use. A provider forward gets implemented where noted.
  var CONFIG = window.FUZELY_CONFIG || {};
  function track(event, props) {
    if (!CONFIG.analytics || !CONFIG.analytics.enabled) return;
    /* future: forward { event: event, props: props } to the analytics provider */
  }

  /* ================= Sticky header (desktop) ================= */
  var header = document.querySelector('[data-ref="header"]');
  var headerInner = document.querySelector('[data-ref="headerInner"]');
  var scrolled = null;
  window.addEventListener('scroll', function () {
    var s = window.scrollY > 20;
    if (s === scrolled) return;
    scrolled = s;
    if (headerInner) { headerInner.style.paddingTop = s ? '11px' : '18px'; headerInner.style.paddingBottom = s ? '11px' : '18px'; }
    if (header) {
      header.style.boxShadow = s ? '0 1px 0 oklch(0.9 0.004 255),0 10px 26px -14px rgba(20,30,60,.28)' : '0 1px 0 oklch(0.93 0.004 255)';
      header.style.background = s ? 'rgba(255,255,255,.86)' : '#fff';
    }
  }, { passive: true });

  /* ================= Mobile nav ================= */
  var menuPanel = document.querySelector('.menu-panel');
  var menuBtn = document.querySelector('[data-act="menu-toggle"]');
  if (menuBtn && menuPanel) {
    menuBtn.addEventListener('click', function () { menuPanel.classList.toggle('open'); });
  }
  document.querySelectorAll('[data-act="menu-close"]').forEach(function (a) {
    a.addEventListener('click', function () { if (menuPanel) menuPanel.classList.remove('open'); });
  });

  /* ================= FAQ accordions (desktop + mobile) ================= */
  document.querySelectorAll('[data-act="faq-toggle"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      if (!item) return;
      var wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(function (el) { el.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* =====================================================================
     Desktop hero animation — five-state cause-and-effect loop
     type prompt -> click Generate -> analyze checklist -> concepts -> select -> launch-ready
     ===================================================================== */
  var heroRoot = document.querySelector('[data-ref="heroRoot"]');
  var heroStart = performance.now();
  var curKey = null;

  function applyGenBtn(bs) {
    var P = heroRoot; if (!P) return;
    var btn = P.querySelector('[data-anim=genbtn]'); if (!btn) return;
    var label = btn.querySelector('[data-anim=genlabel]');
    var spin = btn.querySelector('[data-anim=genspin]');
    var check = btn.querySelector('[data-anim=gencheck]');
    var ico = btn.querySelector('[data-anim=genico]');
    var set = function (l, o) {
      if (label && label.textContent !== l) label.textContent = l;
      btn.style.opacity = o.hide ? '0' : '1';
      btn.style.transform = o.press ? 'scale(.94)' : 'scale(1)';
      btn.style.background = o.bg; btn.style.color = o.fg;
      btn.style.borderColor = o.bd || 'transparent';
      btn.style.boxShadow = o.sh || 'none';
      if (spin) spin.style.display = o.spin ? 'inline-block' : 'none';
      if (check) check.style.display = o.check ? 'inline-flex' : 'none';
      if (ico) ico.style.display = o.ico ? 'inline-flex' : 'none';
    };
    var accent = 'oklch(0.5 0.17 288)';
    if (bs === 'disabled') set('Generate concepts', { bg: 'oklch(0.93 0.005 260)', fg: 'oklch(0.62 0.01 260)', ico: true });
    else if (bs === 'ready') set('Generate concepts', { bg: 'var(--accent)', fg: '#fff', ico: true, sh: '0 6px 16px -6px oklch(0.5 0.17 288/.55)' });
    else if (bs === 'pressed') set('Generate concepts', { bg: 'var(--accent)', fg: '#fff', ico: true, press: true, sh: '0 2px 8px -4px oklch(0.5 0.17 288/.6)' });
    else if (bs === 'analyzing') set('Analyzing page\u2026', { bg: '#fff', fg: accent, bd: 'oklch(0.88 0.03 288)', spin: true });
    else if (bs === 'done') set('Page analyzed', { bg: 'oklch(0.96 0.03 150)', fg: 'oklch(0.42 0.11 150)', check: true });
    else if (bs === 'generating') set('Generating concepts\u2026', { bg: '#fff', fg: accent, bd: 'oklch(0.88 0.03 288)', spin: true });
    else set('Generating concepts\u2026', { hide: true, bg: '#fff', fg: accent });
  }

  function heroPos(key) {
    var P = heroRoot; if (!P) return null;
    var pr = P.getBoundingClientRect();
    var rel = function (el, fx, fy, dx, dy) {
      var r = el.getBoundingClientRect();
      return { x: r.left - pr.left + r.width * fx + (dx || 0), y: r.top - pr.top + r.height * fy + (dy || 0) };
    };
    var btn = P.querySelector('[data-anim=genbtn]');
    var card = P.querySelector('[data-card="0"]');
    if (key === 'start' && btn) { var p = rel(btn, 0.5, 0.5, 110, 90); p.snap = true; return p; }
    if (key === 'btn' && btn) return rel(btn, 0.6, 0.62);
    if (key === 'park' && btn) return rel(btn, 0.5, 0.5, 26, 46);
    if (key === 'card' && card) return rel(card, 0.55, 0.62);
    if (key === 'cardpark' && card) return rel(card, 0.55, 0.62, 30, 54);
    return null;
  }

  function tickCursor(t) {
    var P = heroRoot; if (!P) return;
    var cur = P.querySelector('[data-anim=cursor]'); if (!cur) return;
    var key;
    if (t < 4000) key = 'start';
    else if (t < 5250) key = 'btn';
    else if (t < 11750) key = 'park';
    else if (t < 13350) key = 'card';
    else key = 'cardpark';
    var pos = heroPos(key);
    if (pos) {
      var tf = 'translate(' + Math.round(pos.x - 4) + 'px,' + Math.round(pos.y - 2) + 'px)';
      if (key !== curKey && pos.snap) {
        cur.style.transition = 'opacity .45s ease';
        cur.style.transform = tf;
        void cur.offsetWidth;
        cur.style.transition = 'transform .95s cubic-bezier(.3,.65,.25,1),opacity .45s ease';
      } else {
        cur.style.transform = tf;
      }
      curKey = key;
    }
    cur.style.opacity = (t >= 4000 && t < 13500) ? '1' : '0';

    var ring = P.querySelector('[data-anim=ring]');
    if (ring) {
      var st = 'off';
      var clicks = [4950, 12750];
      for (var i = 0; i < clicks.length; i++) {
        if (t >= clicks[i] - 100 && t < clicks[i] + 40) st = 'prime';
        else if (t >= clicks[i] + 40 && t < clicks[i] + 620) st = 'burst';
      }
      if (st === 'prime') { ring.style.transition = 'none'; ring.style.opacity = '0.85'; ring.style.transform = 'scale(.35)'; }
      else if (st === 'burst') { ring.style.transition = 'transform .5s ease,opacity .5s ease'; ring.style.opacity = '0'; ring.style.transform = 'scale(1.3)'; }
      else { ring.style.transition = 'none'; ring.style.opacity = '0'; ring.style.transform = 'scale(.35)'; }
    }
  }

  function tickHero() {
    var P = heroRoot;
    if (!P || !P.offsetParent) return; /* skip while hidden on mobile */
    var LOOP = 19500;
    var t = (performance.now() - heroStart) % LOOP;
    var prompt = 'Add a countdown timer with email signup between the hero and the next section.';
    var q = function (s) { return P.querySelector(s); };

    P.style.transition = 'opacity .5s ease';
    P.style.opacity = t > 18400 ? '0' : (t < 300 ? String(Math.max(0.05, t / 300)) : '1');

    var n;
    if (t < 350) n = 0;
    else if (t < 3700) n = Math.floor(((t - 350) / 3350) * prompt.length);
    else n = prompt.length;
    var typed = q('[data-anim=typed]');
    if (typed) { var s = prompt.slice(0, n); if (typed.textContent !== s) typed.textContent = s; }

    var caret = q('[data-anim=caret]');
    if (caret) { var typing = t >= 350 && t < 4200; caret.style.opacity = typing ? (Math.floor(t / 530) % 2 ? '0.15' : '1') : '0'; }

    var bs;
    if (t < 3700) bs = 'disabled';
    else if (t < 4950) bs = 'ready';
    else if (t < 5120) bs = 'pressed';
    else if (t < 9100) bs = 'analyzing';
    else if (t < 9900) bs = 'done';
    else if (t < 11650) bs = 'generating';
    else bs = 'hidden';
    applyGenBtn(bs);

    var helper = q('[data-anim=helper]');
    if (helper) helper.style.opacity = (t >= 11650 && t < 13500) ? '1' : '0';

    var windows = { analyze: [5250, 9900], concepts: [9900, 13900], launch: [13900, LOOP] };
    Object.keys(windows).forEach(function (k) {
      var el = q('[data-stage=' + k + ']'); if (!el) return;
      var w = windows[k];
      if (t >= w[0] && t < w[1]) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }
      else if (t < w[0]) { el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; }
      else { el.style.opacity = '0'; el.style.transform = 'translateY(-16px)'; }
    });

    P.querySelectorAll('[data-row]').forEach(function (row, i) {
      var activeAt = 5500 + i * 540, doneAt = activeAt + 540;
      var st;
      if (t < 5250 || t >= 9900) st = 'idle';
      else if (t >= doneAt) st = 'done';
      else if (t >= activeAt) st = 'active';
      else st = 'idle';
      row.style.transition = 'opacity .4s ease';
      row.style.opacity = (st === 'idle' && t >= 5250 && t < 9900) ? '0.5' : '1';
      var idle = row.querySelector('[data-idle]'), spin = row.querySelector('[data-spin]'), done = row.querySelector('[data-done]'), val = row.querySelector('[data-val]');
      if (idle) idle.style.opacity = st === 'idle' ? '1' : '0';
      if (spin) spin.style.opacity = st === 'active' ? '1' : '0';
      if (done) done.style.opacity = st === 'done' ? '1' : '0';
      if (val) val.style.opacity = st === 'done' ? '1' : '0';
    });

    var showAt = [10250, 10750, 11250];
    var selOn = t >= 12900 && t < 13900;
    for (var i = 0; i < 3; i++) {
      var c = q('[data-card="' + i + '"]'); if (!c) continue;
      var vis = t >= showAt[i] && t < 13900;
      var tr = vis ? 'translateY(0)' : (t < showAt[i] ? 'translateY(16px)' : 'translateY(-10px)');
      var op = vis ? '1' : '0';
      if (i === 0 && t >= 12750 && t < 12920) tr = 'translateY(0) scale(.965)';
      if (i > 0 && selOn) op = '0.45';
      c.style.opacity = op; c.style.transform = tr;
    }
    var sel = q('[data-anim=select]');
    if (sel) {
      sel.style.borderColor = selOn ? 'oklch(0.6 0.16 288)' : 'oklch(0.91 0.006 260)';
      sel.style.background = selOn ? 'oklch(0.98 0.02 288)' : '#fff';
      sel.style.boxShadow = selOn ? '0 0 0 2.5px oklch(0.55 0.17 288/.25),0 12px 26px -12px oklch(0.5 0.17 288/.5)' : 'none';
    }
    var selchk = q('[data-anim=selectcheck]');
    if (selchk) selchk.style.opacity = selOn ? '1' : '0';

    var split = t >= 14300;
    var sA = q('[data-anim=splitA]'), sB = q('[data-anim=splitB]');
    if (sA) sA.style.width = split ? '50%' : '100%';
    if (sB) sB.style.width = split ? '50%' : '0%';

    var step = 0;
    if (t >= 5120) step = 1;
    if (t >= 9900) step = 2;
    if (t >= 13900) step = 3;
    P.querySelectorAll('[data-step]').forEach(function (el, i) {
      var dot = el.querySelector('[data-dot]');
      if (i === step) { el.style.color = 'oklch(0.5 0.17 288)'; if (dot) dot.style.background = 'oklch(0.55 0.17 288)'; }
      else if (i < step) { el.style.color = 'oklch(0.45 0.012 260)'; if (dot) dot.style.background = 'oklch(0.6 0.15 150)'; }
      else { el.style.color = 'oklch(0.68 0.01 260)'; if (dot) dot.style.background = 'oklch(0.88 0.006 260)'; }
    });

    tickCursor(t);
  }

  /* =====================================================================
     Mobile hero animation — same story, vertical tap-driven treatment
     ===================================================================== */
  var heroRootM = document.querySelector('[data-ref="heroRootM"]');
  var heroStartM = performance.now();

  function applyGenBtnM(bs) {
    var P = heroRootM; if (!P) return;
    var btn = P.querySelector('[data-anim=genbtn]'); if (!btn) return;
    var label = btn.querySelector('[data-anim=genlabel]');
    var spin = btn.querySelector('[data-anim=genspin]');
    var check = btn.querySelector('[data-anim=gencheck]');
    var ico = btn.querySelector('[data-anim=genico]');
    var set = function (l, o) {
      if (label && label.textContent !== l) label.textContent = l;
      btn.style.transform = o.press ? 'scale(.97)' : 'scale(1)';
      btn.style.background = o.bg; btn.style.color = o.fg;
      btn.style.borderColor = o.bd || 'transparent';
      btn.style.boxShadow = o.sh || 'none';
      if (spin) spin.style.display = o.spin ? 'inline-block' : 'none';
      if (check) check.style.display = o.check ? 'inline-flex' : 'none';
      if (ico) ico.style.display = o.ico ? 'inline-flex' : 'none';
    };
    var accent = 'oklch(0.5 0.17 288)';
    if (bs === 'disabled') set('Generate concepts', { bg: 'oklch(0.93 0.005 260)', fg: 'oklch(0.62 0.01 260)', ico: true });
    else if (bs === 'ready') set('Generate concepts', { bg: 'var(--accent)', fg: '#fff', ico: true, sh: '0 6px 16px -6px oklch(0.5 0.17 288/.55)' });
    else if (bs === 'pressed') set('Generate concepts', { bg: 'var(--accent)', fg: '#fff', ico: true, press: true, sh: '0 2px 8px -4px oklch(0.5 0.17 288/.6)' });
    else if (bs === 'analyzing') set('Analyzing page\u2026', { bg: '#fff', fg: accent, bd: 'oklch(0.88 0.03 288)', spin: true });
    else if (bs === 'done') set('Page analyzed', { bg: 'oklch(0.96 0.03 150)', fg: 'oklch(0.42 0.11 150)', check: true });
    else if (bs === 'generating') set('Generating concepts\u2026', { bg: '#fff', fg: accent, bd: 'oklch(0.88 0.03 288)', spin: true });
    else set('Tap a concept to continue', { bg: 'oklch(0.97 0.006 262)', fg: 'oklch(0.5 0.13 288)', bd: 'oklch(0.93 0.01 275)' });
  }

  function tickTapM(t) {
    var P = heroRootM; if (!P) return;
    var tap = P.querySelector('[data-anim=tap]'); if (!tap) return;
    var pr = P.getBoundingClientRect();
    var center = function (el) { var r = el.getBoundingClientRect(); return { x: r.left - pr.left + r.width / 2, y: r.top - pr.top + r.height / 2 }; };
    var clicks = [
      { at: 4200, el: P.querySelector('[data-anim=genbtn]') },
      { at: 11200, el: P.querySelector('[data-card="0"]') }
    ];
    var st = 'off', pos = null;
    for (var i = 0; i < clicks.length; i++) {
      var c = clicks[i];
      if (!c.el) continue;
      if (t >= c.at - 100 && t < c.at + 60) { st = 'prime'; pos = center(c.el); }
      else if (t >= c.at + 60 && t < c.at + 700) { st = 'burst'; pos = center(c.el); }
    }
    if (pos) { tap.style.left = pos.x + 'px'; tap.style.top = pos.y + 'px'; }
    if (st === 'prime') { tap.style.transition = 'none'; tap.style.opacity = '0.9'; tap.style.transform = 'scale(.45)'; }
    else if (st === 'burst') { tap.style.transition = 'transform .55s ease,opacity .55s ease'; tap.style.opacity = '0'; tap.style.transform = 'scale(1.25)'; }
    else { tap.style.transition = 'none'; tap.style.opacity = '0'; tap.style.transform = 'scale(.45)'; }
  }

  function tickHeroM() {
    var P = heroRootM;
    if (!P || !P.offsetParent) return; /* skip while hidden on desktop */
    var LOOP = 17000;
    var t = (performance.now() - heroStartM) % LOOP;
    var prompt = 'Add a countdown timer with email signup below the hero.';
    var q = function (s) { return P.querySelector(s); };

    P.style.transition = 'opacity .5s ease';
    P.style.opacity = t > 16000 ? '0' : (t < 300 ? String(Math.max(0.05, t / 300)) : '1');

    var n;
    if (t < 350) n = 0;
    else if (t < 3000) n = Math.floor(((t - 350) / 2650) * prompt.length);
    else n = prompt.length;
    var typed = q('[data-anim=typed]');
    if (typed) { var s = prompt.slice(0, n); if (typed.textContent !== s) typed.textContent = s; }
    var caret = q('[data-anim=caret]');
    if (caret) { var typing = t >= 350 && t < 3500; caret.style.opacity = typing ? (Math.floor(t / 530) % 2 ? '0.15' : '1') : '0'; }

    var bs;
    if (t < 3000) bs = 'disabled';
    else if (t < 4200) bs = 'ready';
    else if (t < 4370) bs = 'pressed';
    else if (t < 8200) bs = 'analyzing';
    else if (t < 8900) bs = 'done';
    else if (t < 11200) bs = 'generating';
    else bs = 'generating2';
    applyGenBtnM(bs);

    var windows = { analyze: [4500, 8900], concepts: [8900, 12400], launch: [12400, LOOP] };
    Object.keys(windows).forEach(function (k) {
      var el = q('[data-stage=' + k + ']'); if (!el) return;
      var w = windows[k];
      if (t >= w[0] && t < w[1]) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }
      else if (t < w[0]) { el.style.opacity = '0'; el.style.transform = 'translateY(14px)'; }
      else { el.style.opacity = '0'; el.style.transform = 'translateY(-14px)'; }
    });

    P.querySelectorAll('[data-row]').forEach(function (row, i) {
      var activeAt = 4800 + i * 640, doneAt = activeAt + 640;
      var st;
      if (t < 4500 || t >= 8900) st = 'idle';
      else if (t >= doneAt) st = 'done';
      else if (t >= activeAt) st = 'active';
      else st = 'idle';
      row.style.transition = 'opacity .4s ease';
      row.style.opacity = (st === 'idle' && t >= 4500 && t < 8900) ? '0.5' : '1';
      var idle = row.querySelector('[data-idle]'), spin = row.querySelector('[data-spin]'), done = row.querySelector('[data-done]'), val = row.querySelector('[data-val]');
      if (idle) idle.style.opacity = st === 'idle' ? '1' : '0';
      if (spin) spin.style.opacity = st === 'active' ? '1' : '0';
      if (done) done.style.opacity = st === 'done' ? '1' : '0';
      if (val) val.style.opacity = st === 'done' ? '1' : '0';
    });

    var showAt = [9200, 9700, 10200];
    var selOn = t >= 11380 && t < 12400;
    for (var i = 0; i < 3; i++) {
      var c = q('[data-card="' + i + '"]'); if (!c) continue;
      var vis = t >= showAt[i] && t < 12400;
      var tr = vis ? 'translateY(0)' : (t < showAt[i] ? 'translateY(14px)' : 'translateY(-10px)');
      var op = vis ? '1' : '0';
      if (i === 0 && t >= 11200 && t < 11400) tr = 'translateY(0) scale(.97)';
      if (i > 0 && selOn) op = '0.45';
      c.style.opacity = op; c.style.transform = tr;
    }
    var sel = q('[data-anim=select]');
    if (sel) {
      sel.style.borderColor = selOn ? 'oklch(0.6 0.16 288)' : 'oklch(0.91 0.006 260)';
      sel.style.background = selOn ? 'oklch(0.98 0.02 288)' : '#fff';
      sel.style.boxShadow = selOn ? '0 0 0 2.5px oklch(0.55 0.17 288/.25),0 10px 22px -10px oklch(0.5 0.17 288/.5)' : 'none';
    }
    var selchk = q('[data-anim=selectcheck]');
    if (selchk) selchk.style.opacity = selOn ? '1' : '0';

    var split = t >= 12800;
    var sA = q('[data-anim=splitA]'), sB = q('[data-anim=splitB]');
    if (sA) sA.style.width = split ? '50%' : '100%';
    if (sB) sB.style.width = split ? '50%' : '0%';

    var step = 0;
    if (t >= 4370) step = 1;
    if (t >= 8900) step = 2;
    if (t >= 12400) step = 3;
    var labels = ['describe your test', 'analyzing your page', 'pick a concept', 'launch-ready'];
    var ph = q('[data-anim=phaselabel]');
    if (ph && ph.textContent !== labels[step]) ph.textContent = labels[step];
    P.querySelectorAll('[data-dot]').forEach(function (el, i) {
      if (i === step) el.style.background = 'oklch(0.55 0.17 288)';
      else if (i < step) el.style.background = 'oklch(0.6 0.15 150)';
      else el.style.background = 'oklch(0.88 0.006 260)';
    });

    tickTapM(t);
  }

  setInterval(function () { tickHero(); tickHeroM(); }, 90);
  tickHero(); tickHeroM();

  /* ================= Page-load + primary-CTA tracking (no-op today) ========= */
  track('page_view', { path: location.pathname });
  // Primary CTAs are in-page anchors (#beta / #beta-m) — "Join the Beta" in the
  // header/hero and elsewhere. Bound here so index.html needs no markup change.
  document.querySelectorAll('a[href="#beta"], a[href="#beta-m"]').forEach(function (a) {
    a.addEventListener('click', function () { track('cta_click', { target: a.getAttribute('href') }); });
  });

  /* ================= Beta waitlist form (honest placeholder) ================ */
  // Two identical copies (desktop #beta, mobile #beta-m), each marked
  // [data-beta-form]. Behavior is identical for both. With no configured
  // endpoint we NEVER show a success state — see docs/beta-form.md.
  (function betaForms() {
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var ERROR_COLOR = 'oklch(0.62 0.2 25)';   // red — applied ONLY after a submit attempt
    var FIELDS = ['name', 'email', 'company', 'website', 'role', 'interest', 'notes'];

    document.querySelectorAll('form[data-beta-form]').forEach(function (form) {
      var msg = form.querySelector('[data-beta-msg]');
      var nameEl = form.querySelector('[name="name"]');
      var emailEl = form.querySelector('[name="email"]');
      // Capture each field's original inline border color so validation can
      // restore it EXACTLY (never clears the border, which lives inline).
      [nameEl, emailEl].forEach(function (el) { if (el) el.__origBorderColor = el.style.borderColor; });

      function setBorder(el, bad) {
        if (!el) return;
        el.style.borderColor = bad ? ERROR_COLOR : el.__origBorderColor;
      }
      function showMsg(text, isError) {
        if (!msg) return;
        msg.textContent = text;
        msg.style.color = isError ? 'oklch(0.55 0.2 25)' : 'oklch(0.42 0.012 260)';
        msg.hidden = false;
      }
      function hideMsg() { if (msg) { msg.hidden = true; msg.textContent = ''; } }

      // Restore the border as soon as the user edits name/email after an error.
      form.addEventListener('input', function (e) {
        var t = e.target;
        if (t && (t.name === 'name' || t.name === 'email')) setBorder(t, false);
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        hideMsg();
        var name = nameEl ? nameEl.value.trim() : '';
        var email = emailEl ? emailEl.value.trim() : '';
        var nameOk = name.length > 0;
        var emailOk = EMAIL_RE.test(email);
        setBorder(nameEl, !nameOk);
        setBorder(emailEl, !emailOk);
        track('beta_submit', { valid: nameOk && emailOk });

        if (!nameOk || !emailOk) {
          showMsg(
            (!nameOk && !emailOk) ? 'Please enter your name and a valid email.'
              : !nameOk ? 'Please enter your name.'
              : 'Please enter a valid email address.',
            true
          );
          return;
        }

        var payload = {};
        FIELDS.forEach(function (k) {
          var el = form.querySelector('[name="' + k + '"]');
          if (el) payload[k] = (el.value || '').trim();
        });
        // Honeypot (hidden field bots fill) + request context for the API.
        var hp = form.querySelector('[data-hp]');
        payload.honeypot = hp ? (hp.value || '') : '';
        payload.page_url = location.href;
        payload.user_agent = navigator.userAgent;

        var endpoint = CONFIG.betaEndpoint;
        if (!endpoint) {
          // Honest: nothing was captured. Do NOT imply the user joined the list.
          console.log('[Fuzely] Beta application (endpoint not configured — not submitted):', payload);
          showMsg('Beta applications aren’t connected yet — check back soon.', false);
          return;
        }

        // Real submit → genuine success/error. Disable the button in flight to
        // prevent duplicate rapid submits; re-enable on completion.
        var btn = form.querySelector('button');
        if (btn) btn.disabled = true;
        showMsg('Submitting…', false);
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (btn) btn.disabled = false;
            if (!res.ok || !data || data.ok !== true) {
              showMsg((data && data.error) ? data.error : 'Something went wrong. Please try again.', true);
              return;
            }
            form.reset();
            showMsg(data.duplicate
              ? 'You’re already on the list — we’ll be in touch.'
              : 'You’re on the list — we’ll be in touch.', false);
          });
        }).catch(function () {
          if (btn) btn.disabled = false;
          showMsg('Something went wrong. Please try again.', true);
        });
      });
    });
  })();
})();
