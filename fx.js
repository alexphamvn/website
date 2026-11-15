/* ============================================================
   fx.js — the moving parts shared by every page
   ============================================================
   Nothing in here needs editing to change your content.
   Each block is independent: delete a block (or its call at
   the bottom) and the rest keeps working.

     1. textures      film grain, pointer light, progress line
     2. nav           one line that slides between the links
     3. headings      words rise into place
     4. cards         tilt + foil sheen
     4b. curve        home page research-questions curve
     5. reveals       things come into focus when scrolled to
     6. numbers       ratings count up
     7. sky           home page night sky (WebGL shader)
     8. dots          teaching halftone / contact ripple (canvas)
     9. copy          "copy email" button
   ============================================================ */
(function () {
  'use strict';

  var doc = document, body = doc.body, root = doc.documentElement;
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  function el(tag, cls) { var e = doc.createElement(tag); if (cls) e.className = cls; e.setAttribute('aria-hidden', 'true'); return e; }
  function safe(name, fn) { try { fn(); } catch (err) { if (window.console) console.warn('[fx] ' + name + ' skipped:', err); } }

  /* shared pointer position, read by several blocks */
  var ptr = { x: innerWidth / 2, y: innerHeight * 0.3, seen: false };
  var ptrSubs = [], ptrQueued = false;
  addEventListener('pointermove', function (e) {
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.seen = true;
    if (ptrQueued) return;
    ptrQueued = true;
    requestAnimationFrame(function () { ptrQueued = false; for (var i = 0; i < ptrSubs.length; i++) ptrSubs[i](); });
  }, { passive: true });

  /* ---------- 1. textures ---------- */
  function textures() {
    body.appendChild(el('div', 'fx-grain'));
    body.appendChild(el('div', 'fx-progress'));
    if (body.classList.contains('research-page')) body.insertBefore(el('div', 'fx-grid'), body.firstChild);
    if (!FINE) return;
    var spot = el('div', 'fx-spot');
    body.insertBefore(spot, body.firstChild);
    var grid = $('.fx-grid');
    ptrSubs.push(function () {
      spot.style.setProperty('--mx', ptr.x + 'px'); spot.style.setProperty('--my', ptr.y + 'px');
      if (grid) { grid.style.setProperty('--mx', ptr.x + 'px'); grid.style.setProperty('--my', ptr.y + 'px'); }
    });
  }

  /* ---------- 2. nav ----------
     A single line rests under the current page. Point at another
     link and it slides there; leave and it slides back. After a
     click it starts under the tab you came from and slides to the
     new one, so it never appears out of nowhere.                 */
  function nav() {
    var bar = $('nav.topnav'); if (!bar) return;
    var links = $$('a:not(.brand)', bar), active = $('a.active', bar);
    if (!active) return;
    var ink = el('span', 'nav-ink'); bar.appendChild(ink);
    function place(a, slide) {
      var r = a.getBoundingClientRect(), n = bar.getBoundingClientRect();
      if (!slide) ink.style.transition = 'none';
      ink.style.width = r.width + 'px';
      ink.style.transform = 'translate(' + (r.left - n.left) + 'px,' + (r.bottom - n.top) + 'px)';
      if (!slide) { void ink.offsetWidth; ink.style.transition = ''; }
    }
    var from = -1;
    try { from = parseInt(sessionStorage.getItem('nav-from'), 10); sessionStorage.removeItem('nav-from'); } catch (e) {}
    if (!REDUCE && from >= 0 && links[from] && links[from] !== active) {
      place(links[from], false);
      requestAnimationFrame(function () { requestAnimationFrame(function () { place(active, true); }); });
    } else place(active, false);
    ink.style.opacity = 1;

    $$('a', bar).forEach(function (a) {
      a.addEventListener('click', function () {
        try { sessionStorage.setItem('nav-from', links.indexOf(active)); } catch (e) {}
      });
    });
    if (FINE) {
      links.forEach(function (a) { a.addEventListener('pointerenter', function () { place(a, true); }); });
      bar.addEventListener('pointerleave', function () { place(active, true); });
    }
    var settle = function () { place(active, false); };
    addEventListener('resize', settle);
    addEventListener('pageshow', function (e) { if (e.persisted) settle(); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { setTimeout(settle, 700); });
  }

  /* ---------- 3. headings ---------- */
  function headings() {
    $$('.section-title').forEach(function (h) {
      var words = h.textContent.replace(/\s+/g, ' ').trim().split(' ');
      h.setAttribute('aria-label', words.join(' '));   /* screen readers get the plain sentence */
      h.textContent = '';
      words.forEach(function (word, i) {
        var mask = doc.createElement('span'); mask.className = 'wd'; mask.setAttribute('aria-hidden', 'true');
        var inner = doc.createElement('span'); inner.className = 'wi'; inner.textContent = word;
        inner.style.setProperty('--w', i);
        mask.appendChild(inner); h.appendChild(mask);
        if (i < words.length - 1) h.appendChild(doc.createTextNode(' '));
      });
    });
  }

  /* ---------- 4. cards ---------- */
  function cards() {
    if (!FINE) return;
    $$('.foil, [data-tilt]').forEach(function (card) {
      var max = parseFloat(card.getAttribute('data-tilt')) || 0;
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = clamp((e.clientX - r.left) / r.width, 0, 1), py = clamp((e.clientY - r.top) / r.height, 0, 1);
        card.style.setProperty('--px', px.toFixed(3)); card.style.setProperty('--py', py.toFixed(3));
        if (max && !REDUCE) {
          card.classList.add('is-tilting');
          card.style.setProperty('--rx', ((0.5 - py) * max).toFixed(2) + 'deg');
          card.style.setProperty('--ry', ((px - 0.5) * max).toFixed(2) + 'deg');
        }
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- 4b. curve (home page research questions) ----------
     Draws an S-curve sized to the text (a technology's life cycle,
     emergence to dominance) between the two questions.
     A marker rides the curve — it follows the pointer while the
     pointer is over the figure, and the page scroll otherwise.
     The question the marker has reached is the one in focus.      */
  function curve() {
    var box = $('.rq-curve'); if (!box) return;
    var qa = $('.rq-a', box), qb = $('.rq-b', box), svg = $('.rq-line', box), probe = $('.rq-probe', box);
    if (!qa || !qb || !svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    var defs = doc.createElementNS(NS, 'defs'), grad = doc.createElementNS(NS, 'linearGradient');
    grad.setAttribute('id', 'rq-grad'); grad.setAttribute('gradientUnits', 'userSpaceOnUse');
    [['0', '#4f46e5'], ['0.42', '#7c3aed'], ['0.62', '#ff6b35'], ['1', '#f59e0b']].forEach(function (st) {
      var stop = doc.createElementNS(NS, 'stop'); stop.setAttribute('offset', st[0]); stop.setAttribute('stop-color', st[1]); grad.appendChild(stop);
    });
    defs.appendChild(grad); svg.appendChild(defs);
    var track = doc.createElementNS(NS, 'path'), glow = doc.createElementNS(NS, 'path');
    track.setAttribute('class', 'rq-track'); glow.setAttribute('class', 'rq-glow');
    svg.appendChild(track); svg.appendChild(glow);

    var W = 0, H = 0, total = 0, pts = [], u = 0, uTarget = 0, lit = 0, raf = 0, seen = false, hover = false, hoverX = 0;

    function build() {
      W = box.clientWidth; H = box.clientHeight; if (!W || !H) return;
      var aBottom = qa.offsetTop + qa.offsetHeight, bTop = qb.offsetTop;
      var sideBySide = qa.offsetLeft + qa.offsetWidth <= qb.offsetLeft + 4;
      var yB = sideBySide ? 10 : aBottom + 26;          /* the high plateau (dominance) */
      var yA = sideBySide ? H - 10 : bTop - 26;         /* the low start (emergence)    */
      var x0 = 2, x1 = W - 2, mid = (yA + yB) / 2, k = (yA - yB) * 0.3;
      var d = 'M' + x0 + ',' + yA +
        ' C' + W * 0.40 + ',' + yA + ' ' + W * 0.47 + ',' + (mid + k) + ' ' + W * 0.5 + ',' + mid +
        ' C' + W * 0.53 + ',' + (mid - k) + ' ' + W * 0.60 + ',' + yB + ' ' + x1 + ',' + yB;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      track.setAttribute('d', d); glow.setAttribute('d', d);
      grad.setAttribute('x1', 0); grad.setAttribute('x2', W); grad.setAttribute('y1', 0); grad.setAttribute('y2', 0);
      box.style.setProperty('--ya', yA + 'px'); box.style.setProperty('--yb', yB + 'px');
      total = glow.getTotalLength();
      glow.style.strokeDasharray = total + ' ' + total;
      /* sample points along the curve for the marker to sit on */
      pts = [];
      for (var i = 0; i <= 320; i++) {
        var len = total * i / 320, p = glow.getPointAtLength(len);
        pts.push({ len: len, x: p.x, y: p.y });
      }
      box.classList.add('is-live');
      paint();
    }
    function at(v) { return pts[Math.round(clamp(v, 0, 1) * (pts.length - 1))]; }
    function paint() {
      if (!pts.length) return;
      var p = at(u);
      if (probe) probe.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      glow.style.strokeDashoffset = (total - lit).toFixed(1);
      if (!REDUCE) box.setAttribute('data-stage', u < 0.5 ? 'a' : 'b');
    }
    function aim() {
      if (hover) uTarget = clamp((hoverX - 24) / Math.max(1, W - 48), 0, 1);
      else {
        /* how far a line just below mid-screen has travelled down through the figure */
        var r = box.getBoundingClientRect(), p = (innerHeight * 0.55 - r.top) / Math.max(1, r.height);
        uTarget = clamp((p - 0.15) / 0.6, 0, 1);
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function tick() {
      raf = 0;
      if (!pts.length) return;
      var litTarget = seen ? at(uTarget).len : 0;
      u += (uTarget - u) * 0.12;
      lit += (litTarget - lit) * 0.12;
      paint();
      if (Math.abs(uTarget - u) > 0.0015 || Math.abs(litTarget - lit) > 0.6) raf = requestAnimationFrame(tick);
    }

    build();
    if ('ResizeObserver' in window) new ResizeObserver(build).observe(box); else addEventListener('resize', build);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(build);

    if (REDUCE) { u = 0.5; lit = total; if (probe) probe.style.display = 'none'; box.classList.add('is-seen'); paint(); return; }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) { seen = true; box.classList.add('is-seen'); aim(); } }, { threshold: 0.15 }).observe(box);
    } else { seen = true; box.classList.add('is-seen'); }
    addEventListener('scroll', aim, { passive: true });
    box.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      hover = true; hoverX = e.clientX - box.getBoundingClientRect().left; aim();
    });
    box.addEventListener('pointerleave', function () { hover = false; aim(); });
    aim();
  }

  /* ---------- 5. reveals ---------- */
  function reveals() {
    var items = $$('.pub, .teaching-row, .testimonials, .section-subtitle, .cv-embed, .contact-card');
    if (!items.length) return;
    if (REDUCE || !('IntersectionObserver' in window)) { items.forEach(function (n) { n.classList.add('in'); }); return; }
    items.forEach(function (n) { n.setAttribute('data-reveal', ''); });
    var io = new IntersectionObserver(function (entries) {
      var shown = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      shown.forEach(function (e, i) {
        e.target.style.setProperty('--d', Math.min(i * 0.07, 0.6) + 's');
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    /* wait one frame so the hidden state is painted first */
    requestAnimationFrame(function () { items.forEach(function (n) { io.observe(n); }); });
  }

  /* ---------- 6. numbers ---------- */
  function numbers() {
    var nums = $$('.rating'); if (!nums.length || REDUCE || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var node = e.target, text = node.textContent.trim(), end = parseFloat(text);
        if (isNaN(end)) return;
        var places = (text.split('.')[1] || '').length, t0 = performance.now(), dur = 1400;
        (function tick(now) {
          var k = clamp((now - t0) / dur, 0, 1), eased = 1 - Math.pow(1 - k, 4);
          node.textContent = (end * eased).toFixed(places);
          if (k < 1) requestAnimationFrame(tick); else node.textContent = text;
        })(t0);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- 7. sky (home page) ----------
     One fragment shader paints the nebula, three layers of
     twinkling stars and the occasional shooting star. If WebGL
     is not available, plain canvas stars are drawn instead.   */
  var SKY_FRAG = [
    'precision highp float;',
    'uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll; uniform float uWide;',
    'float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }',
    'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
    '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }',
    'float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);',
    '  for(int i=0;i<4;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }',
    'float stars(vec2 uv, float scale, float seed, float t){',
    '  vec2 g=uv*scale, id=floor(g), f=fract(g)-.5;',
    '  float n=hash(id+seed); if(n<.86) return 0.;',
    '  vec2 off=(vec2(hash(id+seed+7.1),hash(id+seed+3.7))-.5)*.7;',
    '  float big=pow(hash(id+seed+1.3),8.);',
    '  float size=max(mix(.016,.06,big), 1.15*scale/uRes.y);',
    '  float tw=.55+.45*sin(t*(.6+2.6*hash(id+seed+9.2))+n*40.);',
    '  float d=length(f-off);',
    '  return smoothstep(size,0.,d)*tw + big*.35*smoothstep(size*5.,0.,d)*tw; }',
    'void main(){',
    '  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y; vec2 m=uMouse-.5; float t=uTime;',
    '  vec2 p=uv*1.35+vec2(0.,uScroll*.18)+m*.06;',
    '  vec2 q=vec2(fbm(p+t*.020), fbm(p+vec2(5.2,1.3)-t*.016));',
    '  vec2 r=vec2(fbm(p+2.4*q+vec2(1.7,9.2)+t*.012), fbm(p+2.4*q+vec2(8.3,2.8)-t*.010));',
    '  float f=fbm(p+2.2*r);',
    '  float cloud=smoothstep(.26,.74,f);',
    '  vec3 indigo=vec3(.31,.27,.90), violet=vec3(.49,.23,.93), ember=vec3(1.,.42,.21), ice=vec3(.63,.75,1.);',
    '  vec3 neb=mix(indigo,violet,smoothstep(.25,.75,q.x));',
    '  neb=mix(neb,ember,smoothstep(.52,.86,r.y)*.75);',
    '  neb+=ice*pow(cloud,4.)*.30;',
    '  neb*=pow(cloud,1.4)*1.25;',
    '  float xn=gl_FragCoord.x/uRes.x;',
    '  float keep=mix(.42, mix(1.,.32,smoothstep(.30,.62,xn)), uWide);',   /* quieter behind the text */
    '  vec3 col=neb*keep;',
    '  float s=stars(uv+m*.015+vec2(0.,uScroll*.04),16.,1.,t)',
    '         +stars(uv+m*.030+vec2(0.,uScroll*.08),30.,2.,t)*.8',
    '         +stars(uv+m*.050+vec2(0.,uScroll*.14),52.,3.,t)*.55;',
    '  col+=mix(vec3(.96,.97,1.),ice,hash(floor(uv*30.)))*s*(1.-cloud*.5);',
    '  float seg=floor(t/6.5), ph=fract(t/6.5)*6.5/.85;',
    '  if(ph<1.){',
    '    vec2 dir=normalize(vec2(-.86,-.5));',
    '    vec2 head=vec2(mix(-.3,.9,hash(vec2(seg,1.))), mix(.15,.48,hash(vec2(seg,2.))))+dir*ph*1.1;',
    '    vec2 pa=uv-head; float along=dot(pa,-dir); float perp=length(pa+dir*along);',
    '    col+=vec3(.9,.94,1.)*step(0.,along)*smoothstep(.32,0.,along)*smoothstep(.0035,0.,perp)*sin(ph*3.14159);',
    '  }',
    '  col*=1.-.35*dot(uv,uv);',
    '  col+=(hash(gl_FragCoord.xy+fract(t))-.5)/255.*1.5;',
    '  gl_FragColor=vec4(max(col,0.),1.);',
    '}'
  ].join('\n');

  function sky() {
    var canvas = doc.getElementById('starfield'); if (!canvas) return;
    var gl = null;
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' }); } catch (e) {}
    if (!gl) return skyFallback(canvas);

    function shader(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var prog = gl.createProgram();
    try {
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }'));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, SKY_FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) {
      /* swap in a fresh canvas: one that has a WebGL context cannot give a 2D one */
      var fresh = canvas.cloneNode(false); canvas.parentNode.replaceChild(fresh, canvas);
      return skyFallback(fresh);
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uTime', 'uMouse', 'uScroll', 'uWide'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    var mx = 0.5, my = 0.5, t0 = performance.now(), frame = 0;
    function size() {
      var scale = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (w * h * scale * scale > 2600000) scale = Math.sqrt(2600000 / (w * h));   /* cap the work on huge screens */
      canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uWide, w > 720 ? 1 : 0);
    }
    function draw(now) {
      mx += (ptr.x / innerWidth - mx) * 0.04; my += ((1 - ptr.y / innerHeight) - my) * 0.04;
      gl.uniform1f(U.uTime, (now - t0) / 1000);
      gl.uniform2f(U.uMouse, mx, my);
      gl.uniform1f(U.uScroll, (window.scrollY || 0) / Math.max(1, innerHeight));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) {
      if (++frame % 2 === 0) draw(now);          /* 30 frames a second is plenty for a sky */
      requestAnimationFrame(loop);
    }
    addEventListener('resize', function () { size(); if (REDUCE) draw(performance.now()); });
    size();
    if (REDUCE) { draw(t0 + 4000); addEventListener('scroll', function () { draw(t0 + 4000); }, { passive: true }); }
    else requestAnimationFrame(loop);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); });
  }

  /* plain twinkling stars, for browsers without WebGL */
  function skyFallback(canvas) {
    var ctx = canvas.getContext('2d'); if (!ctx) return;
    var stars = [], W = 0, H = 0;
    function build() {
      W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; stars = [];
      for (var i = 0, n = Math.floor(W * H / 1800); i < n; i++) stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() < 0.92 ? Math.random() * 1.1 + 0.3 : Math.random() * 1.6 + 1.2,
        base: Math.random() * 0.6 + 0.35, tw: Math.random() * 6.28, ts: Math.random() * 0.035 + 0.008,
        blue: Math.random() < 0.25
      });
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(function (s) {
        s.tw += s.ts;
        var a = s.base * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.tw)));
        ctx.beginPath();
        ctx.fillStyle = (s.blue ? 'rgba(160,190,255,' : 'rgba(245,246,248,') + a.toFixed(3) + ')';
        ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
      });
      if (!REDUCE) requestAnimationFrame(frame);
    }
    addEventListener('resize', build); build(); frame();
  }

  /* ---------- 8. dots (teaching + contact) ----------
     A field of dots whose size is the picture: a slow halftone
     tide on the teaching page, rings spreading from the card on
     the contact page. Dots swell where the pointer is.         */
  function dots() {
    var mode = body.classList.contains('teaching-page') ? 'halftone' : body.classList.contains('contact-page') ? 'ripple' : '';
    if (!mode) return;
    var canvas = el('canvas', 'fx-dots'); body.insertBefore(canvas, body.firstChild);
    var ctx = canvas.getContext('2d'); if (!ctx) return;
    var W, H, gap, lens = 0, t0 = performance.now(), frame = 0, card = $('.contact-card');
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight; gap = W < 720 ? 20 : 24;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(now) {
      var t = (now - t0) / 1000, warm = [], ox = W / 2, oy = H / 2, maxR = gap * 0.46;
      lens += ((ptr.seen ? 1 : 0) - lens) * 0.06;
      if (card) { var cr = card.getBoundingClientRect(); ox = cr.left + cr.width / 2; oy = cr.top + cr.height / 2; }
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      for (var y = gap / 2; y < H + gap; y += gap) {
        for (var x = gap / 2; x < W + gap; x += gap) {
          var v, hot = false;
          var dxp = x - ptr.x, dyp = y - ptr.y, near = Math.exp(-(dxp * dxp + dyp * dyp) / 26000) * lens;
          if (mode === 'halftone') {
            var u = x / W, w = y / H;
            var a = Math.max(0, 1 - Math.hypot(u - 1, w * 0.9) / 0.6), b = Math.max(0, 1 - Math.hypot(u, (w - 1) * 0.9) / 0.5);
            var tide = 0.62 + 0.38 * Math.sin(u * 5.2 - w * 3.6 + t * 0.45);
            v = 0.06 + (a * a + b * b) * tide * 1.1 + near * 0.45;
            hot = b > a;
          } else {
            var d = Math.hypot(x - ox, y - oy), rings = 0;
            for (var k = 0; k < 3; k++) { var rr = (t * 70 + k * 300) % 900, q = (d - rr) / 42; rings += Math.exp(-q * q); }
            v = 0.07 + rings * Math.max(0, 1 - d / 900) * 0.7 + near * 0.6;
            hot = near > 0.25;
          }
          var r = maxR * clamp(v, 0, 1);
          if (r < 0.35) continue;
          if (hot) { warm.push(x, y, r); continue; }
          ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832);
        }
      }
      ctx.fillStyle = mode === 'halftone' ? 'rgba(99,91,255,0.55)' : 'rgba(140,165,255,0.4)';
      ctx.fill();
      ctx.beginPath();
      for (var i = 0; i < warm.length; i += 3) { ctx.moveTo(warm[i] + warm[i + 2], warm[i + 1]); ctx.arc(warm[i], warm[i + 1], warm[i + 2], 0, 6.2832); }
      ctx.fillStyle = 'rgba(255,107,53,0.5)';
      ctx.fill();
    }
    function loop(now) { if (++frame % 2 === 0) draw(now); requestAnimationFrame(loop); }
    addEventListener('resize', function () { size(); if (REDUCE) draw(t0 + 3000); });
    size();
    if (REDUCE) draw(t0 + 3000); else requestAnimationFrame(loop);
  }

  /* ---------- 9. copy ---------- */
  function copy() {
    $$('[data-copy]').forEach(function (btn) {
      var label = btn.textContent;
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy'), done = function (ok) {
          btn.textContent = ok ? 'Copied' : text;
          setTimeout(function () { btn.textContent = label; }, 1800);
        };
        try { navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); }); }
        catch (e) { done(false); }
      });
    });
  }

  function start() {
    safe('textures', textures); safe('nav', nav); safe('headings', headings); safe('cards', cards); safe('curve', curve);
    safe('reveals', reveals); safe('numbers', numbers); safe('sky', sky); safe('dots', dots);
    safe('copy', copy);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
