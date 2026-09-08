(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    setupHeader();
    setupMobileNav();
    setupTonePicker();
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
