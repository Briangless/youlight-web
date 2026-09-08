(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    setupHeader();
    setupHeaderTheme();
    setupMobileNav();
    setupTonePicker();
    setupHeroTilt();
    setupAnchorScroll();

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      heroEntrance();
      scrollReveals();
    }
  }

  function setupHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // The header floats over both dark and paper sections, so it needs to know
  // which one is currently behind it and flip [data-bg] to match — otherwise
  // white nav text disappears the moment a light section scrolls underneath.
  function setupHeaderTheme() {
    var header = document.getElementById('site-header');
    var sections = Array.prototype.slice.call(document.querySelectorAll('main > section[data-theme]'));
    if (!header || !sections.length || !('IntersectionObserver' in window)) return;

    var headerH = header.offsetHeight || 72;
    var apply = function (theme) {
      if (theme === 'light') header.dataset.bg = 'light';
      else delete header.dataset.bg;
    };

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) apply(entry.target.dataset.theme);
        });
      },
      { rootMargin: '-' + headerH + 'px 0px -70% 0px', threshold: 0 }
    );

    sections.forEach(function (s) { observer.observe(s); });
  }

  // Tilts the hero's light panel toward the cursor, like it's a physical
  // object catching the light — a real 3D read without needing a 3D asset.
  // Desktop-only (fine pointer + hover) and off under reduced motion.
  function setupHeroTilt() {
    var stage = document.getElementById('hero-stage');
    var panel = stage && stage.querySelector('.light-panel');
    if (!stage || !panel) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var current = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var raf = null;

    function tick() {
      current.x += (target.x - current.x) * 0.12;
      current.y += (target.y - current.y) * 0.12;
      panel.style.transform = 'rotateX(' + current.y.toFixed(2) + 'deg) rotateY(' + current.x.toFixed(2) + 'deg)';
      if (Math.abs(target.x - current.x) > 0.02 || Math.abs(target.y - current.y) > 0.02) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    var kick = function () { if (!raf) raf = requestAnimationFrame(tick); };

    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      target.x = px * 14;
      target.y = -py * 11;
      kick();
    });

    stage.addEventListener('pointerleave', function () {
      target.x = 0; target.y = 0;
      kick();
    });
  }

  function setupMobileNav() {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('mobile-nav');
    if (!toggle || !nav) return;

    var header = document.getElementById('site-header');

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (header) header.classList.toggle('is-nav-open', open);
      nav.inert = !open; // keep collapsed links out of tab order / AT
    };

    var close = function () { setOpen(false); };

    setOpen(false);

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
  }

  // The two chips in the hero are real controls: picking one re-tones the lamp.
  function setupTonePicker() {
    var stage = document.getElementById('hero-stage');
    if (!stage) return;
    var chips = Array.prototype.slice.call(stage.querySelectorAll('.float-chip'));
    if (!chips.length) return;

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var tone = chip.dataset.tone;
        stage.dataset.tone = tone;
        chips.forEach(function (c) {
          c.setAttribute('aria-pressed', String(c.dataset.tone === tone));
        });
      });
    });
  }

  function setupAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function heroEntrance() {
    var lines = document.querySelectorAll('.hero-title .line');
    lines.forEach(function (line) {
      var text = line.textContent;
      line.innerHTML = '<span>' + text + '</span>';
    });

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    var tl = gsap.timeline({ delay: 0.15, defaults: { ease: 'power3.out' } });
    tl.set('.hero-title .line > span', { yPercent: 110, opacity: 0 })
      .set('.tagline-word', { opacity: 0, y: 10, filter: 'blur(6px)' })
      .set('.hero-sub, .hero-actions', { opacity: 0, y: 18 })
      .set('.hero-stage', { opacity: 0, y: 24 })
      .to('.hero-title .line > span', { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.12 })
      .to('.hero-stage', { opacity: 1, y: 0, duration: 1.1 }, '-=0.8')
      .to('.tagline-word', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.08 }, '-=0.9')
      .to('.hero-sub', { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
      .to('.hero-actions', { opacity: 1, y: 0, duration: 0.6 }, '-=0.35');
  }

  function scrollReveals() {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    var generic = gsap.utils.toArray('[data-reveal]').filter(function (el) {
      return !el.closest('.hero') && !el.classList.contains('fila-producto');
    });

    generic.forEach(function (el) {
      gsap.from(el, {
        opacity: 0,
        y: 28,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
      });
    });

    // Product rows enter one after another, like the list is being read out
    var rows = gsap.utils.toArray('.fila-producto');
    if (rows.length) {
      gsap.set(rows, { opacity: 0, y: 22 });
      ScrollTrigger.batch(rows, {
        start: 'top 90%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, stagger: 0.09, ease: 'power3.out' });
        }
      });
    }
  }
})();
