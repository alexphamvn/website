/* ============================================================
   research.js — the moving network in the middle of the
   research page
   ============================================================
   A ball of points joined by thin lines, turning in 3D, so the
   whole thing always reads as a circle. Most of the points sit on
   the surface of the ball and slide around on it; the rest move
   about inside. None of them can leave the ball, so the parts move
   but the round outline stays. The network is coloured in the
   site's blue (left) and orange (right). Every point is the same
   solid dot.

   Nearly all the points sparkle at once, each at its own level:
   some glow brightly, some faintly, and each one slowly swells and
   dims in its own time.

   Plain canvas, no libraries. It draws into
   <div id="research-figure"> on research.html.

   The numbers most worth changing are in SETTINGS just below.
   ============================================================ */
(function () {
  'use strict';

  var SETTINGS = {
    density: 180,        // number of points on a desktop-sized figure
    onSurface: 0.64,     // share of the points that sit on the surface of the ball (they draw the round outline)
    links: 3,            // each point is joined to this many of its nearest neighbours
    turnSpeed: 0.17,     // how fast the whole network turns (radians per second)
    drift: 0.18,         // how far each point swings from its place (share of the ball's radius)
    flow: 1.0,           // speed of that swinging (2 = twice as fast)
    dotSize: 2.3,        // radius of every point, in pixels
    /* left → right: three blues, then three oranges, so only a narrow band in the middle is in between */
    colors: ['#5a55f5', '#6f78ff', '#8ea5ff', '#ffb054', '#ff8a3d', '#ff6b35'],

    /* the sparkles */
    sparkleShare: 0.92,  // share of the points that sparkle (1 = all of them)
    sparkleSize: 26,     // radius of the strongest glow at its brightest, in pixels
    sparkleSpeed: 1.0    // how quickly each glow swells and dims (2 = twice as fast)
  };

  var host = document.getElementById('research-figure');
  if (!host) return;
  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  host.appendChild(canvas);

  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, RX = 0, RY = 0, grad = null, gx0 = 0, gx1 = 1;
  var nodes = [], edges = [];
  var tiltX = 0, tiltY = 0, aimX = 0, aimY = 0;
  var running = false, visible = true, t0 = performance.now();

  /* a small repeatable random-number generator, so the network has
     the same shape on every visit */
  var seed = 20261114;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  /* the colour at a point u (0 = far left … 1 = far right) of SETTINGS.colors, as "r,g,b" */
  var STOPS = SETTINGS.colors.map(function (c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; });
  function colorAt(u) {
    if (STOPS.length < 2) return STOPS[0].join(',');
    u = (u < 0 ? 0 : u > 1 ? 1 : u) * (STOPS.length - 1);
    var i = Math.min(STOPS.length - 2, Math.floor(u)), f = u - i, a = STOPS[i], b = STOPS[i + 1];
    return Math.round(a[0] + (b[0] - a[0]) * f) + ',' + Math.round(a[1] + (b[1] - a[1]) * f) + ',' + Math.round(a[2] + (b[2] - a[2]) * f);
  }

  /* one soft glow image per colour band, made once and then stamped at each sparkling point */
  var BANDS = 16, sprites = [];
  function makeSprites() {
    sprites = [];
    for (var k = 0; k < BANDS; k++) {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var x = c.getContext('2d'), rgb = colorAt((k + 0.5) / BANDS), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.18, 'rgba(' + rgb + ',1)');
      g.addColorStop(0.5, 'rgba(' + rgb + ',0.42)');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      sprites.push(c);
    }
  }
  makeSprites();

  /* ---------- build the network ---------- */
  function build() {
    seed = 20261114;
    var area = Math.max(1, W * H), n = Math.round(SETTINGS.density * Math.min(1.25, Math.max(0.55, area / 420000)));
    nodes = [];
    var onShell = Math.round(n * SETTINGS.onSurface);
    while (nodes.length < n) {
      var x, y, z, d, shell = nodes.length < onShell;
      if (shell) {
        /* spread evenly over the surface of the ball, then nudged so it is not too regular */
        var i0 = nodes.length, ring;
        y = 1 - 2 * (i0 + 0.5) / onShell; ring = Math.sqrt(1 - y * y);
        x = Math.cos(i0 * 2.399963) * ring + (rnd() - 0.5) * 0.24;
        z = Math.sin(i0 * 2.399963) * ring + (rnd() - 0.5) * 0.24;
        y += (rnd() - 0.5) * 0.24;
        d = Math.sqrt(x * x + y * y + z * z); x /= d; y /= d; z /= d;
      } else {
        /* scattered through the inside */
        x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; d = x * x + y * y + z * z;
        if (d > 0.62 || d < 0.004) continue;
      }
      nodes.push({
        bx: x, by: y, bz: z, shell: shell,
        /* each point swings on its own loop; neighbours start in step with
           each other, so the swing passes through the network like a wave */
        fa: 0.75 + rnd() * 0.5, fb: 0.65 + rnd() * 0.5, fc: 0.7 + rnd() * 0.5,
        pa: x * 2.6 + y * 1.4 + rnd() * 1.6, pb: y * 2.4 + z * 1.5 + rnd() * 1.6, pc: z * 2.6 + x * 1.3 + rnd() * 1.6,
        /* its sparkle: the level it reaches (0 = never sparkles), how fast, and where in its cycle it starts */
        amp: rnd() < SETTINGS.sparkleShare ? 0.1 + 0.9 * Math.pow(rnd(), 1.9) : 0,   /* many faint, a few bright */
        sw: 0.55 + rnd() * 0.9, sp: rnd() * 6.283,
        z: 0, sx: 0, sy: 0, far: 0
      });
    }
    /* join every point to its nearest neighbours (once — the lines never pop in or out) */
    edges = [];
    var seen = {};
    nodes.forEach(function (a, i) {
      var near = [];
      nodes.forEach(function (b, j) {
        if (i === j) return;
        var dx = a.bx - b.bx, dy = a.by - b.by, dz = a.bz - b.bz;
        near.push([dx * dx + dy * dy + dz * dz, j]);
      });
      near.sort(function (p, q) { return p[0] - q[0]; });
      for (var k = 0; k < SETTINGS.links && k < near.length; k++) {
        var j = near[k][1], key = i < j ? i + '-' + j : j + '-' + i;
        if (seen[key]) continue;
        seen[key] = 1;
        edges.push([i, j]);
      }
    });
  }

  function size() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    var rebuilt = Math.abs(w * h - W * H) > W * H * 0.25 || !nodes.length;
    W = w; H = h;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    RX = RY = Math.min(W, H) * 0.41;         /* a ball: as tall as it is wide */
    gx0 = W / 2 - RX * 1.05; gx1 = W / 2 + RX * 1.05;
    if (SETTINGS.colors.length < 2) grad = SETTINGS.colors[0];
    else {
      grad = ctx.createLinearGradient(gx0, 0, gx1, 0);
      SETTINGS.colors.forEach(function (c, i, all) { grad.addColorStop(i / (all.length - 1), c); });
    }
    if (rebuilt) build();
    if (!running) draw(performance.now());
  }

  var STEPS = 8;                                    /* lines are drawn in this many brightness steps */

  function draw(now) {
    var t = (now - t0) / 1000;
    if (REDUCE) t = 12;
    tiltX += (aimX - tiltX) * 0.04; tiltY += (aimY - tiltY) * 0.04;
    var ry = t * SETTINGS.turnSpeed + tiltX * 0.5, rx = 0.42 * Math.sin(t * 0.27) + tiltY * 0.35;
    var cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    var D = SETTINGS.drift, F = SETTINGS.flow, cam = 3.1, i, n, a, b;

    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var px = n.bx + D * Math.sin(t * F * n.fa + n.pa), py = n.by + D * Math.sin(t * F * n.fb + n.pb), pz = n.bz + D * Math.sin(t * F * n.fc + n.pc);
      /* keep the round shape: surface points are put back on the surface, inner points stay inside */
      var rad = Math.sqrt(px * px + py * py + pz * pz) || 1, fit = n.shell ? 1 / rad : rad > 0.86 ? 0.86 / rad : 1;
      px *= fit; py *= fit; pz *= fit;
      var x1 = px * cy + pz * sy, z1 = -px * sy + pz * cy;         /* turn around the upright axis */
      var y1 = py * cx - z1 * sx, z2 = py * sx + z1 * cx;          /* then tip forward / back */
      var k = cam / (cam - z2);                                     /* nearer = bigger */
      n.z = z2;
      n.sx = W / 2 + x1 * RX * k; n.sy = H / 2 + y1 * RY * k;
      var f = (Math.abs(z2) - 0.1) / 0.9;                           /* 0 around the rim of the ball … 1 at its front or back */
      n.far = f < 0 ? 0 : f > 1 ? 1 : f;
    }

    ctx.clearRect(0, 0, W, H);

    /* lines: brightest around the rim of the ball, fainter toward its front and back */
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1;
    ctx.strokeStyle = grad;
    for (var lvl = STEPS - 1; lvl >= 0; lvl--) {
      ctx.beginPath();
      for (i = 0; i < edges.length; i++) {
        a = nodes[edges[i][0]]; b = nodes[edges[i][1]];
        if (Math.min(STEPS - 1, Math.floor((a.far + b.far) / 2 * STEPS)) !== lvl) continue;
        ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy);
      }
      ctx.globalAlpha = 0.9 - 0.55 * (lvl + 0.5) / STEPS;
      ctx.stroke();
    }

    /* sparkles: many at once, each with its own strength, each swelling and dimming in its own time */
    ctx.globalCompositeOperation = 'lighter';
    var lit = [];
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      if (!n.amp) continue;
      var wave = 0.5 + 0.5 * Math.sin(t * SETTINGS.sparkleSpeed * n.sw + n.sp);
      var glow = n.amp * (0.25 + 0.75 * wave * wave);              /* never fully off, so the strengths stay different */
      var R = 5 + SETTINGS.sparkleSize * glow, u = (n.sx - gx0) / (gx1 - gx0);
      var band = Math.max(0, Math.min(BANDS - 1, Math.floor(u * BANDS)));
      ctx.globalAlpha = glow;
      ctx.drawImage(sprites[band], n.sx - R, n.sy - R, R * 2, R * 2);
      lit.push(n, glow);
    }

    /* points: every one the same solid dot, in the network's colours */
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      ctx.moveTo(n.sx + SETTINGS.dotSize, n.sy); ctx.arc(n.sx, n.sy, SETTINGS.dotSize, 0, 6.2832);
    }
    ctx.fill();
    /* a sparkling point gets a white-hot centre, brighter the stronger its glow */
    ctx.fillStyle = '#fff';
    for (i = 0; i < lit.length; i += 2) {
      ctx.globalAlpha = Math.min(1, lit[i + 1] * 1.15);
      ctx.beginPath(); ctx.arc(lit[i].sx, lit[i].sy, SETTINGS.dotSize * 0.62, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    if (!running) return;
    draw(now);
    requestAnimationFrame(loop);
  }
  function setRunning() {
    var want = visible && !document.hidden && !REDUCE;
    if (want && !running) { running = true; requestAnimationFrame(loop); }
    else if (!want) running = false;
  }

  /* the network leans a little toward the pointer */
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    aimX = (e.clientX / window.innerWidth - 0.5) * 2;
    aimY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  if ('ResizeObserver' in window) new ResizeObserver(size).observe(host);
  else window.addEventListener('resize', size);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; setRunning(); }).observe(host);
  }
  document.addEventListener('visibilitychange', setRunning);

  size();
  setRunning();
  host.classList.add('is-ready');
})();
