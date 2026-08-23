/* =============================================================================
   YOULIGHT — Recorrido por la luz

   Four rooms drawn in one-point perspective. Everything converges on a single
   vanishing point at (50%, 52%), which is what makes a flat stack of divs read
   as a space instead of a pile of glowing shapes.

   Each scene also declares a photo path. The moment a real photograph exists at
   that path it loads and takes over the whole frame, and the drawn art steps
   aside. No code change needed to upgrade.
   ============================================================================= */
(function () {
  'use strict';

  var VP_X = 50;   // vanishing point, % across
  var VP_Y = 52;   // vanishing point, % down

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var section = document.querySelector('.recorrido');
    var pinEl = document.getElementById('recorrido-pin');
    var escenas = document.getElementById('escenas');
    if (!section || !pinEl || !escenas) return;

    var nodes = Array.prototype.slice.call(escenas.querySelectorAll('.escena'));
    nodes.forEach(function (node) {
      buildScene(node);
      tryPhoto(node);
    });

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !window.gsap || !window.ScrollTrigger) {
      pinEl.classList.add('es-estatico');
      nodes.forEach(function (n) { n.classList.add('is-active'); });
      document.querySelectorAll('.recorrido-caption').forEach(function (c) { c.classList.add('is-active'); });
      return;
    }

    drive(pinEl, nodes);
  }

  /* --------------------------------------------------------------------- */
  /* Perspective helpers                                                    */
  /* --------------------------------------------------------------------- */

  // depth t: 0 = right in front of the viewer, 1 = at the vanishing point
  function shrink(t) { return 1 - 0.82 * t; }
  function towardVP(edgePct, t) { return edgePct + (VP_X - edgePct) * t; }
  function floorY(t) { return VP_Y + (100 - VP_Y) * (1 - t); }
  function ceilY(t, nearCeil) { return nearCeil + (VP_Y - nearCeil) * t; }

  function el(cls, style) {
    var d = document.createElement('span');
    d.className = cls;
    if (style) d.setAttribute('style', style);
    return d;
  }

  function buildScene(node) {
    var kind = node.dataset.escena;
    var inner = document.createElement('div');
    inner.className = 'escena-inner';

    var arte = document.createElement('div');
    arte.className = 'escena-arte';

    if (kind === 'casa')    casa(arte);
    if (kind === 'pasillo') pasillo(arte);
    if (kind === 'calle')   calle(arte);
    if (kind === 'nave')    nave(arte);

    var foto = document.createElement('div');
    foto.className = 'escena-foto';

    inner.appendChild(arte);
    inner.appendChild(foto);
    inner.appendChild(el('escena-vineta'));
    inner.appendChild(el('escena-scrim'));
    node.appendChild(inner);
  }

  function tryPhoto(node) {
    var src = node.dataset.foto;
    if (!src) return;
    var probe = new Image();
    probe.onload = function () {
      var layer = node.querySelector('.escena-foto');
      if (layer) layer.style.backgroundImage = 'url("' + src + '")';
      node.classList.add('has-foto');
    };
    probe.src = src;
  }

  /* --------------------------------------------------------------------- */
  /* Scene 1: a living room at night                                        */
  /* --------------------------------------------------------------------- */
  function casa(root) {
    root.appendChild(el('plano', [
      'background:',
      'radial-gradient(ellipse 90% 55% at 50% 78%, rgba(120,84,48,.20), transparent 70%),',
      'linear-gradient(180deg,#191410 0%,#14100D 58%,#0D0B09 100%)'
    ].join('')));

    // floor line and the warm wash that sits on it
    root.appendChild(el('plano', [
      'top:70%;bottom:0;left:0;right:0;',
      'background:linear-gradient(180deg, rgba(214,147,80,.10), rgba(8,7,6,.55));'
    ].join('')));

    // three pendants, hung at different heights so the row has rhythm
    var pendants = [
      { x: 27, drop: 30, size: 60 },
      { x: 50, drop: 42, size: 78 },
      { x: 73, drop: 34, size: 64 }
    ];

    pendants.forEach(function (p) {
      // cord
      root.appendChild(el('plano', [
        'left:' + p.x + '%;top:0;width:1px;height:' + p.drop + '%;',
        'background:linear-gradient(180deg,transparent,rgba(242,237,228,.20));'
      ].join('')));

      // shade: a cone, wide at the bottom
      root.appendChild(el('plano', [
        'left:' + p.x + '%;top:' + p.drop + '%;',
        'width:' + p.size + 'px;height:' + (p.size * 0.62) + 'px;',
        'transform:translateX(-50%);',
        'clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);',
        'background:linear-gradient(180deg,#3A2C1E,#241A12);',
        'border-radius:3px;'
      ].join('')));

      // the glowing lip of the shade
      root.appendChild(el('luminaria', [
        'left:' + p.x + '%;top:calc(' + p.drop + '% + ' + (p.size * 0.62) + 'px);',
        'width:' + p.size + 'px;height:4px;transform:translate(-50%,-50%);',
        'background:linear-gradient(90deg,rgba(255,220,170,.3),#FFE2B4 25%,#FFE2B4 75%,rgba(255,220,170,.3));',
        'box-shadow:0 0 22px 5px rgba(255,206,150,.65);'
      ].join('')));

      // bulb glow just under the shade
      root.appendChild(el('haz', [
        'left:' + p.x + '%;top:calc(' + p.drop + '% + ' + (p.size * 0.62) + 'px);',
        'width:' + (p.size * 1.5) + 'px;height:' + (p.size * 1.5) + 'px;',
        'transform:translate(-50%,-45%);border-radius:50%;',
        'background:radial-gradient(circle, rgba(255,214,160,.85), rgba(244,190,130,.25) 45%, transparent 72%);'
      ].join('')));

      // light cone falling toward the floor
      root.appendChild(el('haz', [
        'left:' + p.x + '%;top:calc(' + p.drop + '% + ' + (p.size * 0.55) + 'px);',
        'width:' + (p.size * 3.4) + 'px;height:34%;transform:translateX(-50%);',
        'clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);',
        'background:linear-gradient(180deg, rgba(255,205,145,.26), transparent 82%);'
      ].join('')));

      // pool on the floor
      root.appendChild(el('charco', [
        'left:' + p.x + '%;top:76%;',
        'width:' + (p.size * 3.6) + 'px;height:' + (p.size * 0.85) + 'px;',
        'transform:translate(-50%,-50%);',
        'background:radial-gradient(ellipse at center, rgba(240,190,130,.34), transparent 70%);'
      ].join('')));
    });
  }

  /* --------------------------------------------------------------------- */
  /* Scene 2: a corridor, receding                                          */
  /* --------------------------------------------------------------------- */
  function pasillo(root) {
    root.appendChild(el('plano', 'background:linear-gradient(180deg,#100E0D,#0C0A09);'));

    var L = 38, R = 62, T = 38, B = 64;  // the far opening

    // ceiling
    root.appendChild(el('plano', [
      'clip-path:polygon(0 0,100% 0,' + R + '% ' + T + '%,' + L + '% ' + T + '%);',
      'background:linear-gradient(180deg,#1C1917,#131110);'
    ].join('')));
    // left wall
    root.appendChild(el('plano', [
      'clip-path:polygon(0 0,' + L + '% ' + T + '%,' + L + '% ' + B + '%,0 100%);',
      'background:linear-gradient(90deg,#0F0D0C,#1A1715);'
    ].join('')));
    // right wall
    root.appendChild(el('plano', [
      'clip-path:polygon(100% 0,' + R + '% ' + T + '%,' + R + '% ' + B + '%,100% 100%);',
      'background:linear-gradient(270deg,#0F0D0C,#1A1715);'
    ].join('')));
    // floor
    root.appendChild(el('plano', [
      'clip-path:polygon(0 100%,' + L + '% ' + B + '%,' + R + '% ' + B + '%,100% 100%);',
      'background:linear-gradient(180deg,#1A1613,#0E0C0B);'
    ].join('')));
    // far wall
    root.appendChild(el('plano', [
      'left:' + L + '%;top:' + T + '%;width:' + (R - L) + '%;height:' + (B - T) + '%;',
      'background:linear-gradient(180deg,#221E1A,#16130F);'
    ].join('')));

    // recessed fixtures marching down the ceiling
    [0.04, 0.2, 0.36, 0.52, 0.68, 0.82].forEach(function (t) {
      var s = shrink(t);
      var w = 26 * s;
      var y = ceilY(t, 0);

      root.appendChild(el('luminaria', [
        'left:50%;top:' + y + '%;',
        'width:' + w + '%;height:' + (1.5 * s) + '%;',
        'transform:translate(-50%,-50%);',
        'background:linear-gradient(90deg,rgba(255,244,228,.35),#FFF6E8 22%,#FFF6E8 78%,rgba(255,244,228,.35));',
        'box-shadow:0 0 ' + (34 * s) + 'px ' + (9 * s) + 'px rgba(255,232,200,' + (0.5 * s + 0.16) + ');'
      ].join('')));

      // the light it throws onto the floor below
      root.appendChild(el('charco', [
        'left:50%;top:' + floorY(t + 0.05) + '%;',
        'width:' + (30 * s) + '%;height:' + (5 * s) + '%;',
        'transform:translate(-50%,-50%);',
        'background:radial-gradient(ellipse at center, rgba(255,232,198,' + (0.24 * s + 0.05) + '), transparent 70%);'
      ].join('')));
    });

    // LED strips running the length of both walls, close to the ceiling
    ['left:0;', 'right:0;'].forEach(function (side, i) {
      var isLeft = i === 0;
      root.appendChild(el('haz', [
        isLeft
          ? 'clip-path:polygon(0 6%,' + L + '% ' + (T + 1) + '%,' + L + '% ' + (T + 4) + '%,0 16%);'
          : 'clip-path:polygon(100% 6%,' + R + '% ' + (T + 1) + '%,' + R + '% ' + (T + 4) + '%,100% 16%);',
        'inset:0;',
        'background:linear-gradient(' + (isLeft ? '90deg' : '270deg') + ', rgba(255,236,208,.34), rgba(255,236,208,.06));'
      ].join('')));
    });
  }

  /* --------------------------------------------------------------------- */
  /* Scene 3: the street outside                                            */
  /* --------------------------------------------------------------------- */
  function calle(root) {
    // night sky, cooler than the interiors
    root.appendChild(el('plano', [
      'background:',
      'radial-gradient(ellipse 70% 40% at 50% 52%, rgba(120,150,175,.20), transparent 72%),',
      'linear-gradient(180deg,#0C1116 0%,#0E1317 46%,#0A0C0E 100%)'
    ].join('')));

    // road
    root.appendChild(el('plano', [
      'clip-path:polygon(6% 100%,44% ' + VP_Y + '%,56% ' + VP_Y + '%,94% 100%);',
      'background:linear-gradient(180deg,#171B1E,#0D1012);'
    ].join('')));

    // centre line, dashes shrinking toward the horizon
    [0.06, 0.22, 0.38, 0.54, 0.7].forEach(function (t) {
      var s = shrink(t);
      root.appendChild(el('plano', [
        'left:50%;top:' + floorY(t) + '%;',
        'width:' + (1.6 * s) + '%;height:' + (2.6 * s) + '%;',
        'transform:translate(-50%,-50%);border-radius:2px;',
        'background:rgba(216,222,226,' + (0.16 * s + 0.04) + ');'
      ].join('')));
    });

    // lamp posts down both sides
    [0.05, 0.26, 0.46, 0.64, 0.78].forEach(function (t) {
      [-1, 1].forEach(function (side) {
        var s = shrink(t);
        var x = towardVP(VP_X + side * 40, t);
        var base = floorY(t);
        var h = 34 * s;             // pole height, % of frame
        var headY = base - h;
        var armW = 5.5 * s;

        // pole
        root.appendChild(el('poste', [
          'left:' + x + '%;top:' + headY + '%;',
          'width:' + (0.55 * s) + '%;height:' + h + '%;',
          'transform:translateX(-50%);'
        ].join('')));

        // arm reaching over the road
        root.appendChild(el('poste', [
          'left:' + (x + side * armW * 0.5) + '%;top:' + headY + '%;',
          'width:' + armW + '%;height:' + (0.45 * s) + '%;',
          'transform:translateX(-50%);'
        ].join('')));

        var lampX = x + side * armW;

        // lamp head
        root.appendChild(el('luminaria', [
          'left:' + lampX + '%;top:' + (headY + 0.4 * s) + '%;',
          'width:' + (2.6 * s) + '%;height:' + (0.9 * s) + '%;',
          'transform:translateX(-50%);',
          'background:linear-gradient(180deg,#FFFFFF,#BFD3E2);',
          'box-shadow:0 0 ' + (30 * s) + 'px ' + (8 * s) + 'px rgba(198,219,234,' + (0.55 * s + 0.14) + ');'
        ].join('')));

        // cone of light down to the road
        root.appendChild(el('haz', [
          'left:' + lampX + '%;top:' + (headY + 1) + '%;',
          'width:' + (16 * s) + '%;height:' + (base - headY) + '%;',
          'transform:translateX(-50%);',
          'clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);',
          'background:linear-gradient(180deg, rgba(206,226,240,' + (0.20 * s + 0.04) + '), transparent 82%);'
        ].join('')));

        // pool where it lands
        root.appendChild(el('charco', [
          'left:' + lampX + '%;top:' + base + '%;',
          'width:' + (17 * s) + '%;height:' + (3.6 * s) + '%;',
          'transform:translate(-50%,-50%);',
          'background:radial-gradient(ellipse at center, rgba(198,219,234,' + (0.24 * s + 0.05) + '), transparent 72%);'
        ].join('')));
      });
    });

    // one warm window in the distance, so the street still belongs to this brand
    root.appendChild(el('charco', [
      'left:' + (VP_X - 9) + '%;top:' + (VP_Y - 4) + '%;width:5%;height:3%;',
      'transform:translate(-50%,-50%);border-radius:2px;filter:blur(4px);',
      'background:rgba(240,196,140,.5);'
    ].join('')));
  }

  /* --------------------------------------------------------------------- */
  /* Scene 4: an industrial hall                                            */
  /* --------------------------------------------------------------------- */
  function nave(root) {
    root.appendChild(el('plano', 'background:linear-gradient(180deg,#121110,#0B0A09);'));

    var L = 30, R = 70, T = 34, B = 66;

    // ceiling, walls, floor of the hall
    root.appendChild(el('plano', [
      'clip-path:polygon(0 0,100% 0,' + R + '% ' + T + '%,' + L + '% ' + T + '%);',
      'background:linear-gradient(180deg,#181614,#0F0E0D);'
    ].join('')));
    root.appendChild(el('plano', [
      'clip-path:polygon(0 0,' + L + '% ' + T + '%,' + L + '% ' + B + '%,0 100%);',
      'background:linear-gradient(90deg,#0D0C0B,#171513);'
    ].join('')));
    root.appendChild(el('plano', [
      'clip-path:polygon(100% 0,' + R + '% ' + T + '%,' + R + '% ' + B + '%,100% 100%);',
      'background:linear-gradient(270deg,#0D0C0B,#171513);'
    ].join('')));
    root.appendChild(el('plano', [
      'clip-path:polygon(0 100%,' + L + '% ' + B + '%,' + R + '% ' + B + '%,100% 100%);',
      'background:linear-gradient(180deg,#1B1917,#0D0C0B);'
    ].join('')));
    root.appendChild(el('plano', [
      'left:' + L + '%;top:' + T + '%;width:' + (R - L) + '%;height:' + (B - T) + '%;',
      'background:linear-gradient(180deg,#1F1C19,#141210);'
    ].join('')));

    // roof trusses
    [0.12, 0.34, 0.56, 0.74].forEach(function (t) {
      var s = shrink(t);
      var y = ceilY(t, 2);
      var half = towardVP(VP_X + 48, t) - VP_X;
      root.appendChild(el('plano', [
        'left:50%;top:' + y + '%;',
        'width:' + (half * 2) + '%;height:' + (0.7 * s) + '%;',
        'transform:translate(-50%,-50%);',
        'background:linear-gradient(90deg,transparent,#2A2724 18%,#2A2724 82%,transparent);'
      ].join('')));
    });

    // high bay fixtures, three across and three deep
    [0.1, 0.36, 0.6].forEach(function (t) {
      [-1, 0, 1].forEach(function (col) {
        var s = shrink(t);
        var x = towardVP(VP_X + col * 26, t);
        var y = ceilY(t, 6);
        var base = floorY(t);

        // the fixture
        root.appendChild(el('luminaria', [
          'left:' + x + '%;top:' + y + '%;',
          'width:' + (5.5 * s) + '%;height:' + (1.5 * s) + '%;',
          'transform:translate(-50%,-50%);',
          'background:linear-gradient(180deg,#FFFDF8,#D9E4EC);',
          'box-shadow:0 0 ' + (40 * s) + 'px ' + (11 * s) + 'px rgba(226,238,247,' + (0.5 * s + 0.14) + ');'
        ].join('')));

        // wide cone down to the slab
        root.appendChild(el('haz', [
          'left:' + x + '%;top:' + (y + 1) + '%;',
          'width:' + (26 * s) + '%;height:' + (base - y) + '%;',
          'transform:translateX(-50%);',
          'clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);',
          'background:linear-gradient(180deg, rgba(226,238,247,' + (0.17 * s + 0.04) + '), transparent 84%);'
        ].join('')));

        // pool on the slab
        root.appendChild(el('charco', [
          'left:' + x + '%;top:' + base + '%;',
          'width:' + (27 * s) + '%;height:' + (5.5 * s) + '%;',
          'transform:translate(-50%,-50%);',
          'background:radial-gradient(ellipse at center, rgba(226,238,247,' + (0.20 * s + 0.05) + '), transparent 72%);'
        ].join('')));
      });
    });

    // two amber reflectors aimed at the side walls, the warm note in a cool room
    [[L + 3, 0.3], [R - 3, 0.3]].forEach(function (pair) {
      root.appendChild(el('charco', [
        'left:' + pair[0] + '%;top:46%;width:16%;height:26%;',
        'transform:translate(-50%,-50%);',
        'background:radial-gradient(ellipse at center, rgba(232,170,100,.22), transparent 72%);'
      ].join('')));
    });
  }

  /* --------------------------------------------------------------------- */
  /* Scroll choreography                                                    */
  /* --------------------------------------------------------------------- */
  function drive(pinEl, nodes) {
    gsap.registerPlugin(ScrollTrigger);

    var captions = Array.prototype.slice.call(document.querySelectorAll('.recorrido-caption'));
    var fill = document.getElementById('recorrido-fill');
    var inners = nodes.map(function (n) { return n.querySelector('.escena-inner'); });
    var count = nodes.length;
    var isMobile = window.innerWidth < 768;
    var current = -1;

    nodes[0].classList.add('is-active');

    ScrollTrigger.create({
      trigger: pinEl,
      start: 'top top',
      end: '+=' + (isMobile ? 300 : 380) + '%',
      pin: true,
      scrub: 0.6,
      onUpdate: function (self) {
        var p = self.progress;
        var raw = p * count;
        var index = Math.min(count - 1, Math.floor(raw));
        var local = raw - index;               // 0..1 within the current room

        if (index !== current) {
          current = index;
          nodes.forEach(function (n, i) { n.classList.toggle('is-active', i === index); });
          captions.forEach(function (c, i) { c.classList.toggle('is-active', i === index); });
        }

        // a slow dolly forward inside whichever room we are standing in
        gsap.set(inners[index], {
          scale: 1.02 + local * 0.14,
          yPercent: -local * 1.6,
          force3D: true
        });

        if (fill) fill.style.width = (p * 100).toFixed(1) + '%';
      }
    });
  }
})();
