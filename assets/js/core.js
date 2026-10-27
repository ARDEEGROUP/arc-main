/* ARC core: mobile menu, nav, reveal, gauges, counters, book-court modal, passport, hidden ace */
(function(){
  "use strict";
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function svgEl(tag, attrs){ var e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  window.ARC_UTIL = {$$: $$, reduced: reduced, fmtINR: function(n){ return '₹' + Math.round(n).toLocaleString('en-IN'); }};

  /* mobile menu */
  var menu = document.getElementById('mobileMenu'), burger = document.getElementById('burger');
  function closeMenu(){ menu.classList.remove('open'); burger.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); }
  burger.addEventListener('click', function(){
    var open = menu.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  /* nav shadow */
  var nav = document.getElementById('nav');
  function onScroll(){ nav.classList.toggle('solid', (window.scrollY || 0) > 40); }
  window.addEventListener('scroll', onScroll, {passive: true}); onScroll();

  /* reveal */
  var io = ('IntersectionObserver' in window && !reduced) ? new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } });
  }, {threshold: 0.08, rootMargin: '0px 0px -5% 0px'}) : null;
  if (io) $$('.reveal').forEach(function(el){
    if (el.getBoundingClientRect().top > window.innerHeight * 0.95) { el.classList.add('pre'); io.observe(el); }
  });

  /* segmented gauges */
  function drawGauge(el, value, animate){
    var N = 26, cx = 150, cy = 150, r1 = 104, r2 = 132;
    var svg = el.querySelector('svg');
    if (!svg) { svg = svgEl('svg', {viewBox: '0 0 300 170', 'aria-hidden': 'true'}); el.insertBefore(svg, el.firstChild); }
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var lit = Math.round(Math.max(0, Math.min(100, value)) / 100 * N);
    var hot = el.getAttribute('data-hot') === '1';
    for (var i = 0; i < N; i++) {
      var a = Math.PI - (i + 0.5) * (Math.PI / N);
      var x1 = cx + r1 * Math.cos(a), y1 = cy - r1 * Math.sin(a), x2 = cx + r2 * Math.cos(a), y2 = cy - r2 * Math.sin(a);
      var cls = i < lit ? ((hot && i >= lit - 3) ? 'seg-hot' : 'seg-on') : 'seg-off';
      var ln = svgEl('line', {x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), 'stroke-width': 9, 'stroke-linecap': 'round', 'class': animate ? 'seg-off' : cls});
      ln.setAttribute('data-cls', cls);
      if (animate) ln.style.transitionDelay = (i * 22) + 'ms';
      svg.appendChild(ln);
    }
    if (animate) requestAnimationFrame(function(){ requestAnimationFrame(function(){ $$('line', svg).forEach(function(l){ l.setAttribute('class', l.getAttribute('data-cls')); }); }); });
  }
  window.ARC_UTIL.drawGauge = drawGauge;
  $$('.gauge').forEach(function(g){ drawGauge(g, parseFloat(g.getAttribute('data-value')) || 0); });

  /* counters */
  if ('IntersectionObserver' in window && !reduced) {
    var co = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return; co.unobserve(en.target);
        var el = en.target, target = parseInt(el.getAttribute('data-count'), 10), t0 = null;
        function step(ts){ if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1100), v = Math.round(target * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString('en-IN'); if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    }, {threshold: .6});
    $$('[data-count]').forEach(function(el){ co.observe(el); });
  }

  /* book-a-court modal */
  var locBackdrop = document.getElementById('locModalBackdrop');
  function openLoc(){ locBackdrop.classList.add('open'); document.body.style.overflow = 'hidden'; document.getElementById('locModalClose').focus(); }
  function closeLoc(){ locBackdrop.classList.remove('open'); document.body.style.overflow = ''; }
  $$('.book-court-btn').forEach(function(b){ b.addEventListener('click', openLoc); });
  document.getElementById('locModalClose').addEventListener('click', closeLoc);
  locBackdrop.addEventListener('click', function(e){ if (e.target === locBackdrop) closeLoc(); });
  $$('.loc-opt').forEach(function(a){ a.addEventListener('click', closeLoc); });

  /* tracking params (UTM / fbclid) kept for form submissions */
  try {
    var q = new URLSearchParams(location.search), tr = {};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'].forEach(function(k){ if (q.get(k)) tr[k] = q.get(k); });
    if (Object.keys(tr).length) sessionStorage.setItem('arc_tracking', JSON.stringify(tr));
  } catch (e) {}

  /* club passport (stored in this browser only) */
  var STAMPS = ['home','gurugram','play','membership','wellness','events','locations','enquire'];
  var LABELS = {home:'The Club', gurugram:'Gurugram', play:'Play', membership:'The Circle', wellness:'Wellness', events:'Events', locations:'Locations', enquire:'Say hello'};
  var pass = {s: [], ace: false, full: false};
  try { var saved = JSON.parse(localStorage.getItem('arc_passport') || 'null'); if (saved && saved.s) pass = saved; } catch (x) {}
  function savePass(){ try { localStorage.setItem('arc_passport', JSON.stringify(pass)); } catch (x) {} }
  var passBtn = document.getElementById('passBtn'), passPanel = document.getElementById('passPanel'), passBg = document.getElementById('passBg');
  var toastEl = document.getElementById('toast'), toastTimer = null;
  function toast(html){
    document.getElementById('toastText').innerHTML = html;
    toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 2600);
  }
  function renderPass(pop){
    var n = pass.s.length, C = 125.66;
    document.getElementById('passRing').style.strokeDashoffset = (C * (1 - n / STAMPS.length)).toFixed(2);
    document.getElementById('passCount').textContent = n;
    passBtn.setAttribute('aria-label', 'Club passport, ' + n + ' of ' + STAMPS.length + ' stamps');
    $$('.stamp').forEach(function(el){ el.classList.toggle('got', pass.s.indexOf(el.getAttribute('data-stamp')) > -1); });
    document.getElementById('passMeterLbl').textContent = n + ' of ' + STAMPS.length + ' stamps' + (pass.ace ? ' · ace found' : '');
    var pct = Math.round(n / STAMPS.length * 100);
    document.getElementById('passMeterPct').textContent = pct + '%';
    document.getElementById('passMeter').style.width = pct + '%';
    document.getElementById('passBonus').classList.toggle('got', !!pass.ace);
    document.getElementById('passFull').classList.toggle('show', n === STAMPS.length);
    if (pop && !reduced) { passBtn.classList.remove('pop'); void passBtn.offsetWidth; passBtn.classList.add('pop'); }
  }
  function stamp(page){
    if (STAMPS.indexOf(page) < 0 || pass.s.indexOf(page) > -1) return;
    var quiet = pass.s.length === 0;
    pass.s.push(page); savePass();
    var n = pass.s.length;
    renderPass(!quiet);
    if (quiet) return;
    if (n === STAMPS.length && !pass.full) { pass.full = true; savePass(); toast('Full house!<small>You\'ve seen every corner of ARC</small>'); }
    else toast('Stamp collected · ' + LABELS[page] + '<small>' + n + ' of ' + STAMPS.length + ' in your club passport</small>');
  }
  function openPass(){ renderPass(false); passPanel.classList.add('open'); passBg.classList.add('open'); passBtn.setAttribute('aria-expanded', 'true'); }
  function closePass(){ passPanel.classList.remove('open'); passBg.classList.remove('open'); passBtn.setAttribute('aria-expanded', 'false'); }
  passBtn.addEventListener('click', function(){ passPanel.classList.contains('open') ? closePass() : openPass(); });
  passBg.addEventListener('click', closePass);
  passPanel.addEventListener('click', function(e){ if (e.target.closest('a')) closePass(); });
  document.getElementById('passReset').addEventListener('click', function(){ pass = {s: [], ace: false, full: false}; savePass(); var pg = document.querySelector('.page'); if (pg) stamp(pg.getAttribute('data-page')); renderPass(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') { closeLoc(); closeMenu(); closePass(); } });
  renderPass(false);
  var currentPage = document.querySelector('.page'); if (currentPage) stamp(currentPage.getAttribute('data-page'));

  /* hidden ace: the ball in the home hero */
  var ace = document.getElementById('aceBall');
  if (ace) {
    var burst = function(x, y){
      if (reduced) return;
      for (var i = 0; i < 10; i++) {
        var d = document.createElement('span'); d.className = 'burst';
        d.style.left = (x - 5) + 'px'; d.style.top = (y - 5) + 'px';
        d.style.background = ['#E3D9A0', '#B0512A', '#C9CC9E'][i % 3];
        document.body.appendChild(d);
        var a = i / 10 * Math.PI * 2, r = 40 + Math.random() * 40;
        d.animate([{transform: 'translate(0,0) scale(1)', opacity: 1}, {transform: 'translate(' + Math.cos(a) * r + 'px,' + Math.sin(a) * r + 'px) scale(.3)', opacity: 0}], {duration: 700, easing: 'cubic-bezier(.16,1,.3,1)'}).onfinish = (function(el){ return function(){ el.remove(); }; })(d);
      }
    };
    var hitAce = function(){
      var r = ace.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2);
      if (!pass.ace) { pass.ace = true; savePass(); renderPass(true); toast('Ace! You found the ball<small>Bonus stamp added to your passport</small>'); }
      else toast('Ace again<small>Nice hands</small>');
    };
    ace.addEventListener('click', hitAce);
    ace.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hitAce(); } });
  }
})();
