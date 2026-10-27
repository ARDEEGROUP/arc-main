/* ARC membership: countdown, plan calculator, "Find your Circle" quiz, apply-form prefill */
(function(){
  "use strict";
  var U = window.ARC_UTIL, $$ = U.$$, reduced = U.reduced, fmtINR = U.fmtINR;
  var CFG = window.ARC_CONFIG || {};

  /* countdown */
  var opens = new Date(CFG.circleOpens || '2026-11-01T00:00:00+05:30').getTime();
  var cd = document.getElementById('countdown');
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function tick(){
    var d = opens - Date.now();
    if (d <= 0) { cd.innerHTML = '<span class="cd-live">The ARC Circle is now open.</span>'; return; }
    document.getElementById('cdD').textContent = pad(Math.floor(d / 86400000));
    document.getElementById('cdH').textContent = pad(Math.floor(d / 3600000) % 24);
    document.getElementById('cdM').textContent = pad(Math.floor(d / 60000) % 60);
    document.getElementById('cdS').textContent = pad(Math.floor(d / 1000) % 60);
    setTimeout(tick, 1000);
  }
  if (cd) tick();

  /* calculator */
  var PLANS = {
    p12: {name: 'Prime · 12 months', plan: 'Prime 12 months', price: 50000, credits: 750, cap: 'Limited to 40', term: 'Credits last 12 months', per: ''},
    p6:  {name: 'Prime · 6 months', plan: 'Prime 6 months', price: 27500, credits: 400, cap: 'Limited to 40', term: 'Credits last 6 months', per: ''},
    pm:  {name: 'Prime Monthly', plan: 'Prime Monthly', price: 15000, credits: 200, cap: 'Limited to 100', term: 'Credits last 30 days', per: ' a month'},
    s12: {name: 'Signature · 12 months', plan: 'Signature 12 months', price: 100000, credits: 1600, cap: 'Limited to 25', term: 'Credits last 12 months', per: ''},
    s6:  {name: 'Signature · 6 months', plan: 'Signature 6 months', price: 60000, credits: 930, cap: 'Limited to 25', term: 'Credits last 6 months', per: ''},
    r12: {name: 'Reserve · 12 months', plan: 'Reserve 12 months', price: 200000, credits: 3400, cap: 'Limited to 10', term: 'Credits last 12 months · plus a free off-peak session daily', per: ''}
  };
  var calcReady = false;
  function setCalc(key){
    var p = PLANS[key]; if (!p) return;
    var get = p.credits * 100, extra = get - p.price, pct = Math.round(extra / p.price * 100);
    document.getElementById('calcPay').textContent = fmtINR(p.price);
    document.getElementById('calcPayNote').textContent = 'plus 18% GST' + p.per;
    document.getElementById('calcGet').textContent = fmtINR(get);
    document.getElementById('calcCredits').textContent = p.credits.toLocaleString('en-IN') + ' Credits' + p.per;
    document.getElementById('calcBarPay').style.setProperty('--w', (p.price / get * 100).toFixed(1) + '%');
    document.getElementById('calcPk').textContent = Math.floor(p.credits / 10);
    document.getElementById('calcPadel').textContent = Math.floor(p.credits / 18);
    document.getElementById('calcDome').textContent = Math.floor(p.credits / 20);
    document.getElementById('calcName').textContent = p.name;
    document.getElementById('calcCap').textContent = p.cap;
    document.getElementById('calcTerm').textContent = p.term;
    document.getElementById('calcExtraPct').textContent = '+' + pct + '%';
    document.getElementById('calcExtra').textContent = fmtINR(extra) + p.per;
    var g = document.getElementById('calcGauge'); g.setAttribute('data-value', pct); U.drawGauge(g, pct, !reduced && calcReady); calcReady = true;
    document.getElementById('calcApply').setAttribute('data-plan', p.plan);
    $$('.seg-pick button').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-plan') === key); });
  }
  $$('.seg-pick button').forEach(function(b){ b.addEventListener('click', function(){ setCalc(b.getAttribute('data-plan')); }); });
  setCalc('p12');

  /* apply buttons pre-select the plan in the form */
  $$('.reserve-btn').forEach(function(a){
    a.addEventListener('click', function(){
      var plan = a.getAttribute('data-plan');
      if (plan) document.getElementById('m-plan').value = plan;
      setTimeout(function(){ try { document.getElementById('m-name').focus({preventScroll: true}); } catch (x) {} }, 600);
    });
  });
  try { var qp = new URLSearchParams(location.search).get('plan'); if (qp) document.getElementById('m-plan').value = qp; } catch (x) {}

  /* quiz */
  var qAns = [], qSteps = $$('.qstep'), qDots = $$('#qDots i');
  function qShow(i){
    qSteps.forEach(function(s, k){ s.classList.toggle('on', k === i); });
    document.getElementById('qRes').classList.toggle('on', i === 3);
    qDots.forEach(function(d, k){ d.className = k < i ? 'done' : (k === i ? 'on' : ''); });
    document.getElementById('qStepLbl').textContent = i < 3 ? 'Question ' + (i + 1) + ' of 3' : 'Your match';
  }
  function qResult(){
    var perWeek = qAns[0], perGame = qAns[1], months = qAns[2];
    var perMonth = perWeek * perGame * 52 / 12, need = Math.round(perMonth * months / 10) * 10, key, note = '';
    if (months === 1) { key = 'pm'; if (perMonth > 200) note = ' That\'s more than 200 Credits a month, so a 12-month plan would give you more for your money.'; }
    else if (months === 6) { key = need <= 400 ? 'p6' : 's6'; if (need > 930) note = ' You\'d likely top up along the way, or get the most value from Reserve for a year.'; }
    else { key = need <= 750 ? 'p12' : need <= 1600 ? 's12' : 'r12'; }
    var p = PLANS[key], freq = perWeek === 1 ? 'about once a week' : perWeek === 2.5 ? '2 to 3 times a week' : '4 or more times a week';
    var when = perGame === 7 ? 'during the day' : perGame === 14 ? 'in the evenings' : 'at all hours';
    document.getElementById('qPlan').innerHTML = p.name.replace(' · ', ' <span class="it" style="font-size:.5em">') + (p.name.indexOf(' · ') > -1 ? '</span>' : '');
    document.getElementById('qWhy').innerHTML = 'Playing ' + freq + ' ' + when + ' uses roughly <b>' + need.toLocaleString('en-IN') + ' Credits</b>' + (months === 1 ? ' a month' : ' over ' + months + ' months') + '. ' + p.name + ' gives you <b>' + p.credits.toLocaleString('en-IN') + ' Credits</b> (' + fmtINR(p.credits * 100) + ' to spend) for <b>' + fmtINR(p.price) + '</b>' + p.per + ', plus GST.' + note;
    var ap = document.getElementById('qApply'); ap.setAttribute('data-plan', p.plan); ap.firstChild.nodeValue = 'Apply for ' + p.name.split(' · ')[0];
    document.getElementById('qCalc').setAttribute('data-key', key);
    qShow(3);
  }
  qSteps.forEach(function(step, i){
    $$('.qopt', step).forEach(function(b){
      b.addEventListener('click', function(){ qAns[i] = parseFloat(b.getAttribute('data-v')); if (i < 2) qShow(i + 1); else qResult(); });
    });
  });
  document.getElementById('qRestart').addEventListener('click', function(){ qAns = []; qShow(0); });
  document.getElementById('qCalc').addEventListener('click', function(){
    setCalc(this.getAttribute('data-key'));
    var c = document.getElementById('calc'); if (c) c.scrollIntoView({behavior: reduced ? 'auto' : 'smooth'});
  });
})();
