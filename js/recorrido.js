/* =============================================================================
   YOULIGHT — Recorrido por la luz

   Four rooms drawn in one-point perspective. Everything converges on a single
   vanishing point, which is what makes a stack of divs read as a space instead
   of a pile of glowing shapes.

   The composition is aspect-aware. A phone is tall and narrow, a monitor is
   short and wide: the same percentages that read as a corridor on a phone read
   as an empty letterbox on a desktop. So horizontal spread is compressed and
   every object is scaled from the smaller viewport edge, and the scenes are
   rebuilt when the window changes shape.

   Each scene also declares a photo path. The moment a real photograph exists at
   that path it loads and takes over the whole frame, and the drawn art steps
   aside. No code change needed to upgrade.
   ============================================================================= */
(function () {
  'use strict';

  var VP_X = 50;   // vanishing point, % across
  var VP_Y = 52;   // vanishing point, % down

  var scenes = { casa: casa, pasillo: pasillo, calle: calle, nave: nave };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var pinEl = document.getElementById('recorrido-pin');
    var escenas = document.getElementById('escenas');
    if (!pinEl || !escenas) return;

    var nodes = Array.prototype.slice.call(escenas.querySelectorAll('.escena'));
    nodes.forEach(function (node) {
      prepare(node);
      tryPhoto(node);
    });

    paint(pinEl, nodes);
    watchResize(pinEl, nodes);

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

  // A wide viewport needs its content pulled back toward the centre, otherwise
  // the objects drift to the edges and the middle of the frame reads as empty.
  function measure(pinEl) {
    var w = pinEl.clientWidth || window.innerWidth;
    var h = pinEl.clientHeight || window.innerHeight;
    var ratio = w / h;
    var wide = ratio > 1.15;
    return {
      w: w,
      h: h,
      wide: wide,
      low: Math.min(w, h) < 520,                  // phone: keep the blur count down
      S: Math.min(w, h) / 380,                    // object scale, 1 on a phone
      spread: wide ? Math.max(0.52, 1 / ratio) : 1 // horizontal compression
    };
  }

  function X(basePct, m) { return VP_X + (basePct - VP_X) * m.spread; }

  function el(cls, style) {
    var d = document.createElement('span');
    d.className = cls;
    if (style) d.setAttribute('style', style);
    return d;
  }

  function quad(cls, pts, style) {
    var poly = pts.map(function (p) { return p[0] + '% ' + p[1] + '%'; }).join(',');
    return el(cls, 'clip-path:polygon(' + poly + ');' + (style || ''));
  }

  function prepare(node) {
    var inner = document.createElement('div');
    inner.className = 'escena-inner';

    var arte = document.createElement('div');
    arte.className = 'escena-arte';

    var foto = document.createElement('div');
    foto.className = 'escena-foto';

    inner.appendChild(arte);
    inner.appendChild(foto);
    inner.appendChild(el('escena-vineta'));
    inner.appendChild(el('escena-scrim'));
    node.appendChild(inner);
  }

  function paint(pinEl, nodes) {
    var m = measure(pinEl);
    nodes.forEach(function (node) {
      var arte = node.querySelector('.escena-arte');
      var draw = scenes[node.dataset.escena];
      if (!arte || !draw) return;
      arte.textContent = '';
      draw(arte, m);
    });
  }

  function watchResize(pinEl, nodes) {
    var last = measure(pinEl);
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var next = measure(pinEl);
        // only repaint when the frame actually changed shape
        if (Math.abs(next.spread - last.spread) < 0.02 && Math.abs(next.S - last.S) < 0.05) return;
        last = next;
        paint(pinEl, nodes);
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, 260);
    }, { passive: true });
  }

  // Photos are only looked for once they exist. Add data-fotos-listas to
  // #escenas in index.html and every scene swaps to its photograph.
  function tryPhoto(node) {
    var src = node.dataset.foto;
    var enabled = node.parentElement && node.parentElement.hasAttribute('data-fotos-listas');
    if (!src || !enabled) return;
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
  function casa(root, m) {
    var S = m.S;
    var FLOOR = 70;

    root.appendChild(el('plano', [
      'background:',
      'radial-gradient(ellipse 90% 55% at 50% 76%, rgba(120,84,48,.18), transparent 70%),',
      'linear-gradient(180deg,#1A1511 0%,#151110 56%,#0D0B09 100%)'
    ].join('')));

    // back wall meets the floor
    root.appendChild(el('plano', [
      'top:' + FLOOR + '%;bottom:0;left:0;right:0;',
      'background:linear-gradient(180deg, rgba(214,147,80,.13), rgba(8,7,6,.6));'
    ].join('')));
    root.appendChild(el('plano', [
      'top:' + FLOOR + '%;left:0;right:0;height:1px;',
      'background:rgba(242,237,228,.10);'
    ].join('')));

    var pendants = [
      { x: X(30, m), drop: 26, size: 58 * S },
      { x: X(50, m), drop: 36, size: 74 * S },
      { x: X(70, m), drop: 30, size: 62 * S }
    ];

    // pools of light land on the floor first, everything else sits on top
    pendants.forEach(function (p) {
      root.appendChild(el('charco', [
        'left:' + p.x + '%;top:' + (FLOOR + 12) + '%;',
        'width:' + (p.size * 4.2) + 'px;height:' + (p.size * 1.05) + 'px;',
        'transform:translate(-50%,-50%);',
        'background:radial-gradient(ellipse at center, rgba(240,190,130,.32), transparent 70%);'
      ].join('')));
    });

    // rug
    root.appendChild(el('charco', [
      'left:' + X(50, m) + '%;top:' + (FLOOR + 17) + '%;',
      'width:' + (330 * S) + 'px;height:' + (74 * S) + 'px;',
      'transform:translate(-50%,-50%);filter:blur(2px);',
      'background:radial-gradient(ellipse at center, rgba(96,70,48,.55), rgba(60,44,30,.25) 62%, transparent 78%);'
    ].join('')));

    // --- furniture, silhouetted with a warm rim on the top edge ---
    var sofaW = 190 * S, sofaX = X(28, m);

    // sofa back
    root.appendChild(el('plano', [
      'left:' + sofaX + '%;top:' + (FLOOR - 5) + '%;',
      'width:' + sofaW + 'px;height:' + (30 * S) + 'px;',
      'transform:translateX(-50%);border-radius:' + (7 * S) + 'px;',
      'background:linear-gradient(180deg,#3A2E23,#241C15);',
      'box-shadow:inset 0 ' + (1.5 * S) + 'px 0 rgba(255,208,152,.30);'
    ].join('')));
    // sofa seat
    root.appendChild(el('plano', [
      'left:' + sofaX + '%;top:' + (FLOOR + 3) + '%;',
      'width:' + (sofaW * 1.06) + 'px;height:' + (26 * S) + 'px;',
      'transform:translateX(-50%);border-radius:' + (7 * S) + 'px;',
      'background:linear-gradient(180deg,#33291F,#1D1712);',
      'box-shadow:inset 0 ' + (1.5 * S) + 'px 0 rgba(255,208,152,.24);'
    ].join('')));
    // armrests
    [-1, 1].forEach(function (side) {
      root.appendChild(el('plano', [
        'left:calc(' + sofaX + '% + ' + (side * sofaW * 0.53) + 'px);top:' + (FLOOR - 1) + '%;',
        'width:' + (20 * S) + 'px;height:' + (32 * S) + 'px;',
        'transform:translateX(-50%);border-radius:' + (6 * S) + 'px;',
        'background:linear-gradient(180deg,#3A2E23,#221B14);',
        'box-shadow:inset 0 ' + (1.5 * S) + 'px 0 rgba(255,208,152,.28);'
      ].join('')));
    });

    // coffee table
    root.appendChild(el('plano', [
      'left:' + X(52, m) + '%;top:' + (FLOOR + 13) + '%;',
      'width:' + (120 * S) + 'px;height:' + (9 * S) + 'px;',
      'transform:translateX(-50%);border-radius:' + (3 * S) + 'px;',
      'background:linear-gradient(180deg,#4A3A2A,#2A2018);',
      'box-shadow:inset 0 ' + (1.2 * S) + 'px 0 rgba(255,214,164,.42);'
    ].join('')));
    [-0.36, 0.36].forEach(function (o) {
      root.appendChild(el('plano', [
        'left:calc(' + X(52, m) + '% + ' + (o * 120 * S) + 'px);top:' + (FLOOR + 15) + '%;',
        'width:' + (4 * S) + 'px;height:' + (16 * S) + 'px;',
        'transform:translateX(-50%);background:#241C15;'
      ].join('')));
    });

    // floor lamp on the right, a second warm source
    var lampX = X(80, m);
    root.appendChild(el('poste', [
      'left:' + lampX + '%;top:' + (FLOOR - 12) + '%;',
      'width:' + (3 * S) + 'px;height:' + (30 * S) + 'px;transform:translateX(-50%);'
    ].join('')));
    root.appendChild(el('plano', [
      'left:' + lampX + '%;top:' + (FLOOR - 22) + '%;',
      'width:' + (46 * S) + 'px;height:' + (34 * S) + 'px;',
      'transform:translateX(-50%);border-radius:' + (3 * S) + 'px;',
      'clip-path:polygon(20% 0,80% 0,100% 100%,0 100%);',
      'background:linear-gradient(180deg,#C9A170,#7A5D3C);'
    ].join('')));
    root.appendChild(el('haz', [
      'left:' + lampX + '%;top:' + (FLOOR - 14) + '%;',
      'width:' + (150 * S) + 'px;height:' + (150 * S) + 'px;',
      'transform:translate(-50%,-40%);border-radius:50%;',
      'background:radial-gradient(circle, rgba(255,206,150,.5), transparent 68%);'
    ].join('')));

    // --- pendants themselves ---
    pendants.forEach(function (p) {
      root.appendChild(el('plano', [
        'left:' + p.x + '%;top:0;width:1px;height:' + p.drop + '%;',
        'background:linear-gradient(180deg,transparent,rgba(242,237,228,.20));'
      ].join('')));

      root.appendChild(el('plano', [
        'left:' + p.x + '%;top:' + p.drop + '%;',
        'width:' + p.size + 'px;height:' + (p.size * 0.62) + 'px;',
        'transform:translateX(-50%);',
        'clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);',
        'background:linear-gradient(180deg,#3A2C1E,#241A12);border-radius:' + (3 * S) + 'px;'
      ].join('')));

      root.appendChild(el('luminaria', [
        'left:' + p.x + '%;top:calc(' + p.drop + '% + ' + (p.size * 0.62) + 'px);',
        'width:' + p.size + 'px;height:' + (4 * S) + 'px;transform:translate(-50%,-50%);',
        'background:linear-gradient(90deg,rgba(255,220,170,.3),#FFE2B4 25%,#FFE2B4 75%,rgba(255,220,170,.3));',
        'box-shadow:0 0 ' + (22 * S) + 'px ' + (5 * S) + 'px rgba(255,206,150,.65);'
      ].join('')));

      root.appendChild(el('haz', [
        'left:' + p.x + '%;top:calc(' + p.drop + '% + ' + (p.size * 0.62) + 'px);',
        'width:' + (p.size * 1.6) + 'px;height:' + (p.size * 1.6) + 'px;',
        'transform:translate(-50%,-45%);border-radius:50%;',
        'background:radial-gradient(circle, rgba(255,214,160,.8), rgba(244,190,130,.22) 46%, transparent 72%);'
      ].join('')));

      // the cone falls over the furniture, so the light feels like it lands
      root.appendChild(el('haz', [
        'left:' + p.x + '%;top:calc(' + p.drop + '% + ' + (p.size * 0.55) + 'px);',
        'width:' + (p.size * 3.8) + 'px;height:' + (FLOOR + 14 - p.drop) + '%;',
        'transform:translateX(-50%);',
        'clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);',
        'background:linear-gradient(180deg, rgba(255,205,145,.24), transparent 84%);'
      ].join('')));
    });

    // --- automatización: a wall panel with a live sensor indicator ---
    var panelX = X(90, m);
    root.appendChild(el('plano', [
      'left:' + panelX + '%;top:' + (FLOOR - 24) + '%;',
      'width:' + (26 * S) + 'px;height:' + (38 * S) + 'px;',
      'transform:translateX(-50%);border-radius:' + (4 * S) + 'px;',
      'background:linear-gradient(180deg,#2C2620,#1A1613);',
      'box-shadow:inset 0 0 0 1px rgba(242,237,228,.10);'
    ].join('')));
    root.appendChild(el('luminaria', [
      'left:' + panelX + '%;top:' + (FLOOR - 21) + '%;',
      'width:' + (12 * S) + 'px;height:' + (3 * S) + 'px;transform:translate(-50%,-50%);',
      'background:#E8B888;box-shadow:0 0 ' + (12 * S) + 'px ' + (3 * S) + 'px rgba(232,184,136,.7);'
    ].join('')));
    root.appendChild(el('luminaria', [
      'left:' + panelX + '%;top:' + (FLOOR - 16) + '%;',
      'width:' + (5 * S) + 'px;height:' + (5 * S) + 'px;transform:translate(-50%,-50%);',
      'background:#7FE0A8;box-shadow:0 0 ' + (10 * S) + 'px ' + (3 * S) + 'px rgba(127,224,168,.65);'
    ].join('')));
  }

  /* --------------------------------------------------------------------- */
  /* Scene 2: an open plan office, seen down the aisle between cubicles      */
  /* --------------------------------------------------------------------- */
  function pasillo(root, m) {
    var S = m.S;
    var half = 26 * m.spread;
    var L = VP_X - half, R = VP_X + half;
    var T = 34, B = 68;

    root.appendChild(el('plano', 'background:linear-gradient(180deg,#100E0D,#0C0A09);'));

    // shell of the room
    root.appendChild(quad('plano', [[0, 0], [100, 0], [R, T], [L, T]],
      'background:linear-gradient(180deg,#1C1917,#131110);'));
    root.appendChild(quad('plano', [[0, 0], [L, T], [L, B], [0, 100]],
      'background:linear-gradient(90deg,#0F0D0C,#1B1816);'));
    root.appendChild(quad('plano', [[100, 0], [R, T], [R, B], [100, 100]],
      'background:linear-gradient(270deg,#0F0D0C,#1B1816);'));
    root.appendChild(quad('plano', [[0, 100], [L, B], [R, B], [100, 100]],
      'background:linear-gradient(180deg,#1A1613,#0E0C0B);'));
    root.appendChild(el('plano', [
      'left:' + L + '%;top:' + T + '%;width:' + (R - L) + '%;height:' + (B - T) + '%;',
      'background:linear-gradient(180deg,#242019,#16130F);'
    ].join('')));

    // suspended ceiling grid, the tell that this is an office and not a hallway
    [0.16, 0.34, 0.5, 0.64, 0.76].forEach(function (t) {
      var s = shrink(t);
      var w = (towardVP(VP_X + 52 * m.spread, t) - VP_X) * 2;
      root.appendChild(el('plano', [
        'left:50%;top:' + ceilY(t, 0) + '%;',
        'width:' + w + '%;height:' + (0.35 * s) + '%;transform:translate(-50%,-50%);',
        'background:rgba(242,237,228,.09);'
      ].join('')));
    });

    // --- cubicles down both sides of the aisle ---
    var bays = [[0.02, 0.2], [0.22, 0.38], [0.4, 0.53], [0.55, 0.65]];
    var lateral = 30 * m.spread;

    bays.forEach(function (d, bi) {
      [-1, 1].forEach(function (side) {
        var x1 = towardVP(VP_X + side * lateral, d[0]);
        var x2 = towardVP(VP_X + side * lateral, d[1]);
        var f1 = floorY(d[0]), f2 = floorY(d[1]);
        var s1 = shrink(d[0]), s2 = shrink(d[1]);

        // partition panel: a low divider, not a full wall
        var p1 = f1 - 19 * s1, p2 = f2 - 19 * s2;
        root.appendChild(quad('plano', [[x1, p1], [x2, p2], [x2, f2], [x1, f1]],
          'background:linear-gradient(' + (side < 0 ? '90deg' : '270deg') + ',#1D1A17,#2A2622);' +
          'box-shadow:inset 0 0 0 1px rgba(242,237,228,.06);'));

        // the lit top rail of the divider
        root.appendChild(quad('plano', [[x1, p1], [x2, p2], [x2, p2 + 0.7 * s2], [x1, p1 + 0.9 * s1]],
          'background:rgba(255,226,180,.32);'));

        // desk surface, catching the light from above
        var dTop1 = f1 - 11 * s1, dTop2 = f2 - 11 * s2;
        var dx1 = x1 + (VP_X - x1) * 0.34, dx2 = x2 + (VP_X - x2) * 0.34;
        root.appendChild(quad('plano', [[dx1, dTop1], [dx2, dTop2], [x2, dTop2 + 1.1 * s2], [x1, dTop1 + 1.4 * s1]],
          'background:linear-gradient(180deg,#6B563E,#3B2F22);'));

        // monitor: a small cool rectangle glowing above the desk
        var mx = (dx1 + dx2) / 2 + (side < 0 ? 1.2 : -1.2) * s1;
        var my = (dTop1 + dTop2) / 2 - 6 * s1;
        root.appendChild(el('plano', [
          'left:' + mx + '%;top:' + my + '%;',
          'width:' + (5.2 * s1 * m.spread) + '%;height:' + (5.4 * s1) + '%;',
          'transform:translate(-50%,-50%);border-radius:' + (1.5 * S) + 'px;',
          'background:linear-gradient(180deg, rgba(198,222,240,.55), rgba(140,175,205,.30));',
          'box-shadow:0 0 ' + (16 * s1 * S) + 'px ' + (4 * s1 * S) + 'px rgba(180,210,235,.28);'
        ].join('')));

        // task light under the overhead shelf, the reason the desk is readable
        root.appendChild(el('charco', [
          'left:' + ((dx1 + dx2) / 2) + '%;top:' + ((dTop1 + dTop2) / 2) + '%;',
          'width:' + (13 * s1 * m.spread) + '%;height:' + (3.4 * s1) + '%;',
          'transform:translate(-50%,-50%);',
          'background:radial-gradient(ellipse at center, rgba(255,230,190,' + (0.34 * s1 + 0.06) + '), transparent 72%);'
        ].join('')));

        // chair back peeking over the divider
        if (bi < 3) {
          root.appendChild(el('plano', [
            'left:' + ((x1 + x2) / 2) + '%;top:' + (((p1 + p2) / 2) - 3.5 * s1) + '%;',
            'width:' + (4.6 * s1 * m.spread) + '%;height:' + (4.5 * s1) + '%;',
            'transform:translate(-50%,-50%);border-radius:' + (2.5 * S) + 'px;',
            'background:#15130F;'
          ].join('')));
        }
      });
    });

    // linear fixtures running the length of the aisle
    [0.04, 0.2, 0.36, 0.52, 0.68, 0.82].forEach(function (t) {
      var s = shrink(t);
      root.appendChild(el('luminaria', [
        'left:50%;top:' + ceilY(t, 0) + '%;',
        'width:' + (20 * s * m.spread) + '%;height:' + (1.5 * s) + '%;',
        'transform:translate(-50%,-50%);',
        'background:linear-gradient(90deg,rgba(255,244,228,.35),#FFF6E8 22%,#FFF6E8 78%,rgba(255,244,228,.35));',
        'box-shadow:0 0 ' + (34 * s * S) + 'px ' + (9 * s * S) + 'px rgba(255,232,200,' + (0.5 * s + 0.16) + ');'
      ].join('')));

      root.appendChild(el('charco', [
        'left:50%;top:' + floorY(t + 0.05) + '%;',
        'width:' + (24 * s * m.spread) + '%;height:' + (5 * s) + '%;',
        'transform:translate(-50%,-50%);',
        'background:radial-gradient(ellipse at center, rgba(255,232,198,' + (0.24 * s + 0.05) + '), transparent 70%);'
      ].join('')));
    });
  }

  /* --------------------------------------------------------------------- */
  /* Scene 3: the street outside                                            */
  /* --------------------------------------------------------------------- */
  function calle(root, m) {
    var S = m.S;
    var roadHalf = 6 * m.spread;
    var lampOffset = 40 * m.spread;

    root.appendChild(el('plano', [
      'background:',
      'radial-gradient(ellipse 70% 40% at 50% 52%, rgba(120,150,175,.20), transparent 72%),',
      'linear-gradient(180deg,#0C1116 0%,#0E1317 46%,#0A0C0E 100%)'
    ].join('')));

    root.appendChild(quad('plano', [
      [X(6, m), 100], [VP_X - roadHalf, VP_Y], [VP_X + roadHalf, VP_Y], [X(94, m), 100]
    ], 'background:linear-gradient(180deg,#171B1E,#0D1012);'));

    [0.06, 0.22, 0.38, 0.54, 0.7].forEach(function (t) {
      var s = shrink(t);
      root.appendChild(el('plano', [
        'left:50%;top:' + floorY(t) + '%;',
        'width:' + (1.6 * s * m.spread) + '%;height:' + (2.6 * s) + '%;',
        'transform:translate(-50%,-50%);border-radius:2px;',
        'background:rgba(216,222,226,' + (0.16 * s + 0.04) + ');'
      ].join('')));
    });

    [0.05, 0.26, 0.46, 0.64, 0.78].forEach(function (t) {
      [-1, 1].forEach(function (side) {
        var s = shrink(t);
        var x = towardVP(VP_X + side * lampOffset, t);
        var base = floorY(t);
        var h = 34 * s;
        var headY = base - h;
        var armW = 5.5 * s * m.spread;

        root.appendChild(el('poste', [
          'left:' + x + '%;top:' + headY + '%;',
          'width:' + (0.55 * s * m.spread) + '%;height:' + h + '%;transform:translateX(-50%);'
        ].join('')));

        root.appendChild(el('poste', [
          'left:' + (x + side * armW * 0.5) + '%;top:' + headY + '%;',
          'width:' + armW + '%;height:' + (0.45 * s) + '%;transform:translateX(-50%);'
        ].join('')));

        var lampX = x + side * armW;

        root.appendChild(el('luminaria', [
          'left:' + lampX + '%;top:' + (headY + 0.4 * s) + '%;',
          'width:' + (2.6 * s * m.spread) + '%;height:' + (0.9 * s) + '%;transform:translateX(-50%);',
          'background:linear-gradient(180deg,#FFFFFF,#BFD3E2);',
          'box-shadow:0 0 ' + (30 * s * S) + 'px ' + (8 * s * S) + 'px rgba(198,219,234,' + (0.55 * s + 0.14) + ');'
        ].join('')));

        root.appendChild(el('haz', [
          'left:' + lampX + '%;top:' + (headY + 1) + '%;',
          'width:' + (16 * s * m.spread) + '%;height:' + (base - headY) + '%;transform:translateX(-50%);',
          'clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);',
          'background:linear-gradient(180deg, rgba(206,226,240,' + (0.20 * s + 0.04) + '), transparent 82%);'
        ].join('')));

        root.appendChild(el('charco', [
          'left:' + lampX + '%;top:' + base + '%;',
          'width:' + (17 * s * m.spread) + '%;height:' + (3.6 * s) + '%;transform:translate(-50%,-50%);',
          'background:radial-gradient(ellipse at center, rgba(198,219,234,' + (0.24 * s + 0.05) + '), transparent 72%);'
        ].join('')));
      });
    });

    root.appendChild(el('charco', [
      'left:' + (VP_X - 9 * m.spread) + '%;top:' + (VP_Y - 4) + '%;',
      'width:' + (5 * m.spread) + '%;height:3%;',
      'transform:translate(-50%,-50%);border-radius:2px;filter:blur(4px);',
      'background:rgba(240,196,140,.5);'
    ].join('')));
  }

  /* --------------------------------------------------------------------- */
  /* Scene 4: a server aisle inside an industrial hall                      */
  /* --------------------------------------------------------------------- */
  function nave(root, m) {
    var S = m.S;
    var half = 30 * m.spread;
    var L = VP_X - half, R = VP_X + half;
    var T = 32, B = 68;

    root.appendChild(el('plano', 'background:linear-gradient(180deg,#111110,#0A0A09);'));

    root.appendChild(quad('plano', [[0, 0], [100, 0], [R, T], [L, T]],
      'background:linear-gradient(180deg,#181614,#0F0E0D);'));
    root.appendChild(quad('plano', [[0, 0], [L, T], [L, B], [0, 100]],
      'background:linear-gradient(90deg,#0C0C0B,#161514);'));
    root.appendChild(quad('plano', [[100, 0], [R, T], [R, B], [100, 100]],
      'background:linear-gradient(270deg,#0C0C0B,#161514);'));
    root.appendChild(quad('plano', [[0, 100], [L, B], [R, B], [100, 100]],
      'background:linear-gradient(180deg,#1B1917,#0D0C0B);'));
    root.appendChild(el('plano', [
      'left:' + L + '%;top:' + T + '%;width:' + (R - L) + '%;height:' + (B - T) + '%;',
      'background:linear-gradient(180deg,#1F1C19,#141210);'
    ].join('')));

    // roof trusses
    [0.12, 0.34, 0.56, 0.74].forEach(function (t) {
      var s = shrink(t);
      var w = (towardVP(VP_X + 48 * m.spread, t) - VP_X) * 2;
      root.appendChild(el('plano', [
        'left:50%;top:' + ceilY(t, 2) + '%;',
        'width:' + w + '%;height:' + (0.7 * s) + '%;transform:translate(-50%,-50%);',
        'background:linear-gradient(90deg,transparent,#2A2724 18%,#2A2724 82%,transparent);'
      ].join('')));
    });

    // painted aisle markings on the slab
    [-1, 1].forEach(function (side) {
      var near = VP_X + side * 26 * m.spread;
      var far = towardVP(near, 0.86);
      root.appendChild(quad('plano', [
        [near, floorY(0)], [far, floorY(0.86)], [far + side * 0.4, floorY(0.86)], [near + side * 1.6, floorY(0)]
      ], 'background:rgba(232,170,100,.16);'));
    });

    // roll up door on the far wall: the quickest way to say "nave", not "sótano"
    var doorW = (R - L) * 0.42;
    var doorX = VP_X - doorW / 2;
    var doorTop = T + (B - T) * 0.30;
    root.appendChild(el('plano', [
      'left:' + doorX + '%;top:' + doorTop + '%;',
      'width:' + doorW + '%;height:' + (B - doorTop) + '%;',
      'background:repeating-linear-gradient(180deg,#2A2723 0 3px,#1C1A17 3px 6px);',
      'box-shadow:inset 0 0 0 1px rgba(226,238,247,.10);'
    ].join('')));

    // overhead cable tray running the length of the hall
    [-1, 1].forEach(function (side) {
      var near = VP_X + side * 9 * m.spread;
      var far = towardVP(near, 0.88);
      root.appendChild(quad('plano', [
        [near, ceilY(0, 12)], [far, ceilY(0.88, 12)],
        [far, ceilY(0.88, 12) + 0.5], [near, ceilY(0, 12) + 1.6]
      ], 'background:rgba(226,238,247,.13);'));
    });
    // conduit drops feeding each rack row
    [0.14, 0.34, 0.52].forEach(function (t) {
      [-1, 1].forEach(function (side) {
        var s = shrink(t);
        var x = towardVP(VP_X + side * 30 * m.spread, t);
        root.appendChild(el('plano', [
          'left:' + x + '%;top:' + ceilY(t, 12) + '%;',
          'width:' + (0.4 * s * m.spread) + '%;height:' + (7 * s) + '%;',
          'transform:translateX(-50%);background:rgba(226,238,247,.11);'
        ].join('')));
      });
    });

    // server racks lining the aisle, drawn as solids receding in perspective
    var bays = [[0.03, 0.2], [0.22, 0.36], [0.38, 0.5], [0.52, 0.61], [0.63, 0.71]];

    bays.forEach(function (d, bi) {
      [-1, 1].forEach(function (side) {
        var lateral = 34 * m.spread;
        var x1 = towardVP(VP_X + side * lateral, d[0]);
        var x2 = towardVP(VP_X + side * lateral, d[1]);
        var f1 = floorY(d[0]), f2 = floorY(d[1]);
        var s = shrink(d[0]);
        var h1 = 30 * s, h2 = 30 * shrink(d[1]);
        var t1 = f1 - h1, t2 = f2 - h2;

        // cabinet body
        root.appendChild(quad('plano', [[x1, t1], [x2, t2], [x2, f2], [x1, f1]],
          'background:linear-gradient(' + (side < 0 ? '90deg' : '270deg') + ',#15161A,#23262C);' +
          'box-shadow:inset 0 0 0 1px rgba(226,238,247,.07);'));

        // plinth so the cabinet stands on the slab instead of floating
        root.appendChild(quad('plano', [
          [x1, f1 - 1.6 * s], [x2, f2 - 1.2 * s], [x2, f2], [x1, f1]
        ], 'background:#0D0E10;'));

        // ventilated front: many thin server units stacked up the cabinet
        var units = m.low ? 6 : 9;
        for (var u = 0; u < units; u++) {
          var uf = 0.08 + u * (0.86 / units);
          var uy1 = t1 + (f1 - t1) * uf, uy2 = t2 + (f2 - t2) * uf;
          root.appendChild(quad('plano', [
            [x1, uy1], [x2, uy2], [x2, uy2 + 0.5 * s], [x1, uy1 + 0.7 * s]
          ], 'background:rgba(226,238,247,.055);'));
        }

        // status LEDs, one strip per few units
        for (var r = 0; r < 4; r++) {
          var frac = 0.16 + r * 0.2;
          var lx = x1 + (x2 - x1) * 0.5;
          var ly = (t1 + (f1 - t1) * frac + t2 + (f2 - t2) * frac) / 2;
          var warm = (bi + r) % 3 === 0;
          root.appendChild(el('luminaria', [
            'left:' + lx + '%;top:' + ly + '%;',
            'width:' + (Math.abs(x2 - x1) * 0.5) + '%;height:' + (0.45 * s) + '%;',
            'transform:translate(-50%,-50%);',
            'background:' + (warm ? 'rgba(232,184,136,.85)' : 'rgba(140,220,190,.75)') + ';',
            'box-shadow:0 0 ' + (9 * s * S) + 'px ' + (2 * s * S) + 'px ' +
              (warm ? 'rgba(232,184,136,.55)' : 'rgba(140,220,190,.5)') + ';'
          ].join('')));
        }

        // the cold glow the racks throw onto the slab beside them
        if (!m.low) {
          root.appendChild(el('charco', [
            'left:' + ((x1 + x2) / 2) + '%;top:' + ((f1 + f2) / 2) + '%;',
            'width:' + (12 * s * m.spread) + '%;height:' + (3 * s) + '%;',
            'transform:translate(-50%,-50%);',
            'background:radial-gradient(ellipse at center, rgba(140,200,220,' + (0.16 * s + 0.04) + '), transparent 72%);'
          ].join('')));
        }
      });
    });

    // high bay fixtures over the aisle
    [0.1, 0.36, 0.6].forEach(function (t) {
      [-1, 0, 1].forEach(function (col) {
        var s = shrink(t);
        var x = towardVP(VP_X + col * 24 * m.spread, t);
        var y = ceilY(t, 6);
        var base = floorY(t);

        root.appendChild(el('luminaria', [
          'left:' + x + '%;top:' + y + '%;',
          'width:' + (5.5 * s * m.spread) + '%;height:' + (1.5 * s) + '%;transform:translate(-50%,-50%);',
          'background:linear-gradient(180deg,#FFFDF8,#D9E4EC);',
          'box-shadow:0 0 ' + (40 * s * S) + 'px ' + (11 * s * S) + 'px rgba(226,238,247,' + (0.5 * s + 0.14) + ');'
        ].join('')));

        root.appendChild(el('haz', [
          'left:' + x + '%;top:' + (y + 1) + '%;',
          'width:' + (24 * s * m.spread) + '%;height:' + (base - y) + '%;transform:translateX(-50%);',
          'clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);',
          'background:linear-gradient(180deg, rgba(226,238,247,' + (0.16 * s + 0.04) + '), transparent 84%);'
        ].join('')));

        root.appendChild(el('charco', [
          'left:' + x + '%;top:' + base + '%;',
          'width:' + (25 * s * m.spread) + '%;height:' + (5.5 * s) + '%;transform:translate(-50%,-50%);',
          'background:radial-gradient(ellipse at center, rgba(226,238,247,' + (0.18 * s + 0.05) + '), transparent 72%);'
        ].join('')));
      });
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

    function show(p) {
      var raw = Math.min(count - 0.0001, Math.max(0, p) * count);
      var index = Math.floor(raw);
      var local = raw - index;

      if (index !== current) {
        current = index;
        for (var i = 0; i < count; i++) {
          nodes[i].classList.toggle('is-active', i === index);
          captions[i].classList.toggle('is-active', i === index);
        }
      }

      gsap.set(inners[index], {
        scale: 1.02 + local * 0.14,
        yPercent: -local * 1.6,
        force3D: true
      });

      if (fill) fill.style.width = (Math.max(0, Math.min(1, p)) * 100).toFixed(1) + '%';
    }

    ScrollTrigger.create({
      trigger: pinEl,
      start: 'top top',
      end: '+=' + (isMobile ? 300 : 380) + '%',
      pin: true,
      // scrub:true tracks the scrollbar exactly. With a lag value a hard flick
      // outruns the tween and rooms get skipped, which is the bug this fixes.
      scrub: true,
      anticipatePin: 1,        // pin in place before a fast scroll overshoots it
      fastScrollEnd: true,     // settle immediately when a flick ends past the section
      invalidateOnRefresh: true,
      onUpdate: function (self) { show(self.progress); },
      onRefresh: function (self) { show(self.progress); }
    });

    show(0);
  }
})();
