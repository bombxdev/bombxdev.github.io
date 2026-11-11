// Windows 95 style taskbar for /ai/: Start menu, one button per window (click
// to jump to it, the one on screen looks pressed), and the tray with the
// language indicator (TH / EN, click to switch) and a clock.
(function () {
  'use strict';
  var I18N = window.I18N;
  var T = window.T || function (s) { return s; };
  var WINDOWS = [
    { id: 'trends', icon: '📈', label: 'Star Trends', title: 'GitHub Star Trends # Artificial Intelligence' },
    { id: 'notes', icon: '🤖', label: 'AI Notes', title: 'AI Notes' }
  ].filter(function (w) { return document.getElementById(w.id); });

  var bar = document.createElement('div');
  bar.className = 'taskbar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Taskbar');
  document.body.appendChild(bar);
  document.body.classList.add('has-taskbar');

  var open = null;   // 'start' | 'lang' | null
  function lang() { return I18N ? I18N.lang : 'th'; }

  function render() {
    var l = lang();
    bar.innerHTML =
      '<button type="button" class="tb-start' + (open === 'start' ? ' on' : '') + '" data-tb="start" aria-haspopup="menu" aria-expanded="' + (open === 'start') + '">' +
        '<span class="tb-logo" aria-hidden="true"></span>' + T('เริ่ม') + '</button>' +
      '<div class="tb-tasks">' + WINDOWS.map(function (w) {
        return '<button type="button" class="tb-task" data-win="' + w.id + '" title="' + w.title + '"><span aria-hidden="true">' + w.icon + '</span><span class="tb-tl">' + w.label + '</span></button>';
      }).join('') + '</div>' +
      '<div class="tb-tray">' +
        '<button type="button" class="tb-lang" data-tb="lang" aria-haspopup="menu" aria-expanded="' + (open === 'lang') + '" title="' + T('ภาษา: ไทย (คลิก หรือกดปุ่ม ` เพื่อเปลี่ยน)') + '">' + l.toUpperCase() + '</button>' +
        '<span class="tb-clock" aria-label="clock"></span>' +
      '</div>' +
      (open === 'start' ? startMenu() : '') +
      (open === 'lang' ? langMenu() : '');
    tick();
    markActive();
  }
  function langItems() {
    var l = lang();
    return '<li><button type="button" role="menuitemradio" aria-checked="' + (l === 'th') + '" data-lang="th"><span class="ck">' + (l === 'th' ? '✓' : '') + '</span><b class="code">TH</b> ภาษาไทย</button></li>' +
      '<li><button type="button" role="menuitemradio" aria-checked="' + (l === 'en') + '" data-lang="en"><span class="ck">' + (l === 'en' ? '✓' : '') + '</span><b class="code">EN</b> English</button></li>';
  }
  function startMenu() {
    return '<div class="tb-menu tb-startmenu" role="menu">' +
      '<div class="tb-banner" aria-hidden="true">AI&nbsp;Notes&nbsp;<b>95</b></div>' +
      '<ul>' + WINDOWS.map(function (w) {
        return '<li><button type="button" role="menuitem" data-win="' + w.id + '"><span class="ic">' + w.icon + '</span>' + w.title + '</button></li>';
      }).join('') +
      '<li class="sep" role="separator"></li>' +
      '<li class="hd">🌐 ' + (lang() === 'en' ? 'Language' : 'ภาษา / Language') + '</li>' + langItems() +
      '</ul></div>';
  }
  function langMenu() {
    return '<div class="tb-menu tb-langmenu" role="menu"><ul>' + langItems() + '</ul></div>';
  }

  function tick() {
    var el = bar.querySelector('.tb-clock');
    if (!el) return;
    var d = new Date();
    el.textContent = lang() === 'en'
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  setInterval(tick, 15000);

  // the window that fills most of the screen is the "active" one
  function markActive() {
    var best = null, bestH = 0, vh = window.innerHeight;
    WINDOWS.forEach(function (w) {
      var r = document.getElementById(w.id).getBoundingClientRect();
      var h = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (h > bestH) { bestH = h; best = w.id; }
    });
    Array.prototype.forEach.call(bar.querySelectorAll('.tb-task'), function (b) {
      var on = b.getAttribute('data-win') === best;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  var st;
  window.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(markActive, 60); }, { passive: true });
  window.addEventListener('resize', markActive);

  function setOpen(v) { open = v; render(); }
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var lg = b.getAttribute('data-lang'), win = b.getAttribute('data-win'), tb = b.getAttribute('data-tb');
    if (lg) {
      open = null;
      if (I18N) I18N.set(lg);
      render();
    } else if (win) {
      open = null;
      render();
      document.getElementById(win).scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tb) {
      setOpen(open === tb ? null : tb);
    }
  });
  // (a click inside the bar re-renders it, so its target may already be detached)
  document.addEventListener('click', function (e) { if (open && e.target.isConnected && !bar.contains(e.target)) setOpen(null); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(null); });
  if (I18N) I18N.on(render);
  render();
})();
