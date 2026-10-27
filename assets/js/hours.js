/* ARC hours: live court status + peak / off-peak day timelines (Home, Gurugram, Play) */
(function(){
  "use strict";
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var SEASONS = {
    winter: {name: 'Winter', off: [6, 16], label: 'October to March'},
    summer: {name: 'Summer', off: [6, 17], label: 'April to September'}
  };
  function istNow(){
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', month: 'numeric', hourCycle: 'h23'}).formatToParts(new Date());
      var o = {}; parts.forEach(function(p){ o[p.type] = p.value; });
      return {h: parseInt(o.hour, 10) % 24, m: parseInt(o.minute, 10), month: parseInt(o.month, 10)};
    } catch (x) { var d = new Date(); return {h: d.getHours(), m: d.getMinutes(), month: d.getMonth() + 1}; }
  }
  function seasonFor(month){ return (month >= 4 && month <= 9) ? 'summer' : 'winter'; }
  function stateAt(season, h){ var s = SEASONS[season]; if (h >= 4 && h < 6) return 'down'; if (h >= s.off[0] && h < s.off[1]) return 'off'; return 'peak'; }
  function hourLabel(h){ h = h % 24; return (h === 0 ? 12 : h > 12 ? h - 12 : h) + (h < 12 ? 'am' : 'pm'); }
  function renderDaybar(el, season, now){
    var s = SEASONS[season];
    var segs = [[0, 4, 'peak'], [4, 6, 'down'], [6, s.off[1], 'off'], [s.off[1], 24, 'peak']];
    el.innerHTML = '';
    var track = document.createElement('div'); track.className = 'track';
    segs.forEach(function(g){ var d = document.createElement('span'); d.className = 'seg ' + g[2]; d.style.flex = '0 0 ' + ((g[1] - g[0]) / 24 * 100) + '%'; d.title = hourLabel(g[0]) + '–' + hourLabel(g[1]) + ' · ' + (g[2] === 'off' ? 'Off-peak' : g[2] === 'peak' ? 'Peak' : 'Club down time'); track.appendChild(d); });
    if (now && seasonFor(now.month) === season) { var mk = document.createElement('span'); mk.className = 'now'; mk.style.left = ((now.h + now.m / 60) / 24 * 100) + '%'; track.appendChild(mk); }
    var ticks = document.createElement('div'); ticks.className = 'ticks';
    ['12am', '4am', '6am', hourLabel(s.off[1]), '12am'].forEach(function(t){ var sp = document.createElement('span'); sp.textContent = t; ticks.appendChild(sp); });
    ticks.style.position = 'relative'; ticks.style.height = '16px'; ticks.style.display = 'block';
    var pos = [0, 4, 6, s.off[1], 24];
    $$('span', ticks).forEach(function(sp, i){ sp.style.position = 'absolute'; sp.style.left = (pos[i] / 24 * 100) + '%'; sp.style.transform = i === 0 ? 'none' : i === 4 ? 'translateX(-100%)' : 'translateX(-50%)'; });
    el.appendChild(track); el.appendChild(ticks);
  }
  function refresh(){
    var now = istNow(), season = seasonFor(now.month);
    $$('.daybar').forEach(function(el){ var s = el.getAttribute('data-season'); renderDaybar(el, s === 'auto' ? season : s, now); });
    $$('.season-now').forEach(function(el){ el.textContent = el.getAttribute('data-season') === season ? 'Now' : ''; el.style.cssText = el.textContent ? 'font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;padding:4px 10px;border-radius:100px;background:var(--terra);color:var(--cream)' : ''; });
    var st = stateAt(season, now.h);
    var stateEl = document.querySelector('.live-state'), nextEl = document.querySelector('.live-next'), clockEl = document.querySelector('.live-clock');
    if (stateEl) {
      stateEl.innerHTML = st === 'off' ? 'Off-peak <em>now</em>' : st === 'peak' ? 'Peak <em>hours</em>' : 'Down <em>time</em>';
      var s2 = SEASONS[season];
      nextEl.textContent = st === 'off' ? 'Peak from ' + hourLabel(s2.off[1]) + ' · ' + s2.name + ' hours' : st === 'peak' ? 'Courts open until 4am · Off-peak from 6am' : 'Courts reopen at 6am';
      clockEl.textContent = (now.h < 10 ? '0' : '') + now.h + ':' + (now.m < 10 ? '0' : '') + now.m + ' IST';
    }
  }
  refresh(); setInterval(refresh, 60000);
})();
