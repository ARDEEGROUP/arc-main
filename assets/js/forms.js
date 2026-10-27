/* ARC forms: enquiry tabs, validation, Google Sheet post, WhatsApp hand-off, Meta Pixel lead event */
(function(){
  "use strict";
  var U = window.ARC_UTIL, $$ = U.$$;
  var CFG = window.ARC_CONFIG || {};
  var tracking = {};
  try { tracking = JSON.parse(sessionStorage.getItem('arc_tracking') || '{}'); } catch (e) {}

  /* tabs (enquire page) */
  var tabs = $$('.tab');
  function showTab(name){
    if (!document.getElementById('p-' + name)) return;
    tabs.forEach(function(t){ var on = t.getAttribute('data-tab') === name; t.setAttribute('aria-selected', on); document.getElementById('p-' + t.getAttribute('data-tab')).hidden = !on; });
  }
  tabs.forEach(function(t){ t.addEventListener('click', function(){ showTab(t.getAttribute('data-tab')); }); });

  /* prefill from links: /enquire/?tab=membership&plan=...&event=... */
  try {
    var qs = new URLSearchParams(location.search);
    if (qs.get('tab') && tabs.length) showTab(qs.get('tab'));
    if (qs.get('plan') && document.getElementById('q-plan')) document.getElementById('q-plan').value = qs.get('plan');
    if (qs.get('event') && document.getElementById('t-event')) document.getElementById('t-event').value = qs.get('event');
  } catch (x) {}

  var labels = {membership: 'Membership', tournaments: 'Tournament', events: 'Event', corporate: 'Corporate', coaching: 'Coaching'};
  function cleanMobile(v){ return (v || '').replace(/[^\d]/g, '').replace(/^(91|0)(?=\d{10}$)/, ''); }
  $$('form[data-form]').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var type = form.getAttribute('data-form'), err = form.querySelector('.err-msg');
      $$('.field', form).forEach(function(f){ f.classList.remove('invalid'); });
      err.hidden = true;
      var problems = [];
      $$('[required]', form).forEach(function(el){
        var bad = el.type === 'checkbox' ? !el.checked : !el.value.trim();
        if (bad) { problems.push(el); var f = el.closest('.field'); if (f) f.classList.add('invalid'); }
      });
      var mob = form.querySelector('[name="mobile"]');
      if (mob && mob.value && cleanMobile(mob.value).length !== 10) { problems.push(mob); mob.closest('.field').classList.add('invalid'); }
      var em = form.querySelector('[name="email"]');
      if (em && em.value && !/^\S+@\S+\.\S+$/.test(em.value)) { problems.push(em); em.closest('.field').classList.add('invalid'); }
      if (problems.length) {
        var p = problems[0];
        err.textContent = p.type === 'checkbox' ? 'Please tick the consent box so we can contact you.'
          : (p.name === 'mobile' && p.value) ? 'Please enter a 10-digit mobile number.'
          : (p.name === 'email' && p.value) ? 'Please check the email address.'
          : 'Please fill in the highlighted fields.';
        err.hidden = false; p.focus(); return;
      }
      var pg = document.querySelector('.page');
      var data = {type: labels[type], submittedAt: new Date().toISOString(), page: location.href.split('#')[0] + '#' + (pg ? pg.getAttribute('data-page') : '')};
      Object.keys(tracking).forEach(function(k){ data[k] = tracking[k]; });
      new FormData(form).forEach(function(v, k){
        if (k === 'consent') { data.consent = 'Yes'; return; }
        if (!v) return;
        data[k] = data[k] ? data[k] + ', ' + v : v;
      });
      data.mobile = '+91 ' + cleanMobile(data.mobile);
      if (CFG.sheetEndpoint) { try { fetch(CFG.sheetEndpoint, {method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(data)}); } catch (x) {} }
      try { if (window.fbq) fbq('track', 'Lead', {content_name: labels[type]}); } catch (x) {}
      var skip = ['type','submittedAt','page','consent','utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'];
      var lines = Object.keys(data).filter(function(k){ return skip.indexOf(k) < 0 && data[k]; }).map(function(k){
        return '• ' + k.replace(/([A-Z])/g, ' $1').replace(/^./, function(c){ return c.toUpperCase(); }) + ': ' + data[k];
      });
      var msg = "Hi ARC, I've just sent a " + labels[type].toLowerCase() + " enquiry from your website.\n" + lines.join('\n');
      var wa = 'https://wa.me/' + (CFG.whatsapp && CFG.whatsapp[type]) + '?text=' + encodeURIComponent(msg);
      var first = (data.name || '').trim().split(' ')[0];
      var dark = form.closest('.formcard').classList.contains('dark');
      var done = document.createElement('div');
      done.className = 'done'; done.setAttribute('role', 'status'); done.tabIndex = -1;
      done.innerHTML = '<span class="eyebrow">Thank you</span><h3 class="disp"></h3><p></p><div class="btns"><a class="btn ' + (dark ? 'btn-cream' : 'btn-forest') + '" target="_blank" rel="noopener">Send on WhatsApp</a><button class="btn btn-line" type="button">New enquiry</button></div>';
      done.querySelector('h3').textContent = (first ? first + ", w" : "W") + "e'll be in touch";
      done.querySelector('p').textContent = 'Tap below to send your details to our team on WhatsApp, so we can reply in the same chat.';
      done.querySelector('a').href = wa;
      done.querySelector('button').addEventListener('click', function(){ done.remove(); form.reset(); form.hidden = false; });
      form.hidden = true; form.parentNode.insertBefore(done, form.nextSibling); done.focus();
    });
  });
})();
