(function () {
  'use strict';

  var CATEGORY_META = {
    baseball: { label: '棒球', emoji: '⚾', order: 1 },
    f1: { label: 'F1', emoji: '🏎️', order: 2 },
    table_tennis: { label: '桌球', emoji: '🏓', order: 3 },
    volleyball: { label: '排球', emoji: '🏐', order: 4 },
    asiangames: { label: '名古屋亞運', emoji: '🥇', order: 5 },
    other: { label: '其他運動', emoji: '🏅', order: 6 },
  };
  var DEFAULT_ACTIVE_CATEGORIES = ['baseball', 'f1', 'table_tennis', 'volleyball', 'asiangames'];

  var state = {
    programs: [],
    activeCategories: new Set(DEFAULT_ACTIVE_CATEGORIES),
    scope: 'all', // all | upcoming | replay
    search: '',
  };

  // ---------- Theme ----------
  (function initTheme() {
    var root = document.documentElement;
    var toggle = document.getElementById('themeToggle');
    var theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(theme);
    toggle.addEventListener('click', function () {
      theme = theme === 'dark' ? 'light' : 'dark';
      applyTheme(theme);
    });
    function applyTheme(t) {
      root.setAttribute('data-theme', t);
      toggle.setAttribute('aria-label', '切換為' + (t === 'dark' ? '淺色' : '深色') + '模式');
      toggle.innerHTML =
        t === 'dark'
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  })();

  // ---------- Data loading ----------
  fetch('data/programs.json?_=' + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (doc) {
      state.programs = doc.programs || [];
      renderMeta(doc);
      buildCategoryChips();
      bindControls();
      render();
    })
    .catch(function (err) {
      document.getElementById('scheduleList').innerHTML =
        '<p class="empty-state">節目表資料載入失敗，請稍後重新整理頁面。</p>';
      console.error(err);
    });

  function renderMeta(doc) {
    var badge = document.getElementById('updatedBadge');
    if (doc.lastUpdated) {
      var d = new Date(doc.lastUpdated);
      badge.textContent = '更新於 ' + fmtDateTimeShort(d);
    }
    var cov = document.getElementById('coverageNote');
    var from = doc.lastFetchCoverage && doc.lastFetchCoverage.from;
    var to = doc.lastFetchCoverage && doc.lastFetchCoverage.to;
    var footer = document.getElementById('statsFooter');
    footer.textContent = '目前累積 ' + (doc.totalPrograms || doc.programs.length) + ' 筆節目紀錄。';
    cov.textContent =
      'Hami Video 官方通常只公開約前後一週的節目表；本站每日自動抓取並持續累積歷史紀錄' +
      (from && to ? '，目前資料庫涵蓋 ' + from + ' 至 ' + to + '（會隨每日執行持續往兩端擴展）。' : '。');
  }

  function fmtDateTimeShort(d) {
    return d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  }

  // ---------- Category chips ----------
  function buildCategoryChips() {
    var counts = {};
    state.programs.forEach(function (p) {
      p.categories.forEach(function (c) { counts[c] = (counts[c] || 0) + 1; });
    });
    var container = document.getElementById('categoryChips');
    var keys = Object.keys(CATEGORY_META).sort(function (a, b) { return CATEGORY_META[a].order - CATEGORY_META[b].order; });

    var allChip = document.createElement('button');
    allChip.className = 'chip';
    allChip.textContent = '全部分類';
    allChip.addEventListener('click', function () {
      if (state.activeCategories.size === keys.length) {
        state.activeCategories = new Set();
      } else {
        state.activeCategories = new Set(keys);
      }
      syncChipStates();
      render();
    });
    container.appendChild(allChip);

    keys.forEach(function (key) {
      var meta = CATEGORY_META[key];
      var chip = document.createElement('button');
      chip.className = 'chip';
      chip.dataset.cat = key;
      chip.style.setProperty('--chip-color', 'var(--cat-' + key + ')');
      chip.style.setProperty('--chip-bg', 'var(--cat-' + key + '-bg)');
      chip.innerHTML = meta.emoji + ' ' + meta.label + ' <span class="chip-count">' + (counts[key] || 0) + '</span>';
      chip.addEventListener('click', function () {
        if (state.activeCategories.has(key)) state.activeCategories.delete(key);
        else state.activeCategories.add(key);
        syncChipStates();
        render();
      });
      container.appendChild(chip);
    });
    syncChipStates();

    function syncChipStates() {
      Array.prototype.forEach.call(container.querySelectorAll('.chip[data-cat]'), function (el) {
        el.classList.toggle('is-active', state.activeCategories.has(el.dataset.cat));
      });
      allChip.classList.toggle('is-active', state.activeCategories.size === keys.length);
      allChip.textContent = state.activeCategories.size === keys.length ? '取消全選' : '全部分類';
    }
  }

  // ---------- Controls ----------
  function bindControls() {
    document.getElementById('searchInput').addEventListener('input', function (e) {
      state.search = e.target.value.trim().toLowerCase();
      render();
    });
    var seg = document.getElementById('scopeSegmented');
    Array.prototype.forEach.call(seg.querySelectorAll('.seg-btn'), function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(seg.querySelectorAll('.seg-btn'), function (b) {
          b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true');
        state.scope = btn.dataset.scope;
        render();
      });
    });
  }

  // ---------- Rendering ----------
  function render() {
    var now = Date.now() / 1000;
    var filtered = state.programs.filter(function (p) {
      if (!p.categories.some(function (c) { return state.activeCategories.has(c); })) return false;
      if (state.scope === 'upcoming' && p.startTime <= now) return false;
      if (state.scope === 'replay' && !(p.endTime < now && p.canPlay)) return false;
      if (state.search) {
        var hay = (p.title + ' ' + p.channelName).toLowerCase();
        if (hay.indexOf(state.search) === -1) return false;
      }
      return true;
    });

    var list = document.getElementById('scheduleList');
    var emptyState = document.getElementById('emptyState');
    list.innerHTML = '';

    if (!filtered.length) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    var groups = groupByDate(filtered);
    var todayKey = taipeiDateKey(new Date());

    groups.forEach(function (group) {
      var section = document.createElement('div');
      section.className = 'date-group';

      var heading = document.createElement('div');
      heading.className = 'date-heading' + (group.key === todayKey ? ' is-today' : '');
      heading.innerHTML =
        formatGroupDate(group.key) +
        ' <span class="weekday">' + group.weekday + '</span>' +
        (group.key === todayKey ? ' <span class="today-pill">今天</span>' : '');
      section.appendChild(heading);

      group.items.forEach(function (p) {
        section.appendChild(renderCard(p, now));
      });
      list.appendChild(section);
    });
  }

  function renderCard(p, now) {
    var card = document.createElement('article');
    card.className = 'program-card';

    // time
    var timeEl = document.createElement('div');
    timeEl.className = 'program-time';
    timeEl.innerHTML = fmtTime(p.startTime) + '<span class="end-time">– ' + fmtTime(p.endTime) + '</span>';
    card.appendChild(timeEl);

    // main
    var main = document.createElement('div');
    main.className = 'program-main';
    var title = document.createElement('div');
    title.className = 'program-title';
    title.textContent = p.title;
    main.appendChild(title);

    var meta = document.createElement('div');
    meta.className = 'program-meta';

    var status = statusOf(p, now);
    var statusBadge = document.createElement('span');
    statusBadge.className = 'status-badge status-' + status.cls;
    statusBadge.textContent = status.label;
    meta.appendChild(statusBadge);

    p.categories.forEach(function (c) {
      var meta_ = CATEGORY_META[c];
      var badge = document.createElement('span');
      badge.className = 'cat-badge';
      badge.style.setProperty('--badge-color', 'var(--cat-' + c + ')');
      badge.style.setProperty('--badge-bg', 'var(--cat-' + c + '-bg)');
      badge.textContent = meta_.emoji + ' ' + meta_.label;
      meta.appendChild(badge);
    });

    var channelPill = document.createElement('span');
    channelPill.className = 'channel-pill';
    channelPill.textContent = p.channelName;
    meta.appendChild(channelPill);

    main.appendChild(meta);
    card.appendChild(main);

    // actions
    var actions = document.createElement('div');
    actions.className = 'program-actions';

    var watchBtn = document.createElement('a');
    watchBtn.className = 'action-btn primary';
    watchBtn.href = 'https://hamivideo.hinet.net/channel/' + p.channelId + '.do';
    watchBtn.target = '_blank';
    watchBtn.rel = 'noopener';
    watchBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg>' +
      (status.cls === 'replay' ? '前往回看' : status.cls === 'live' ? '前往收看' : '前往頻道');
    actions.appendChild(watchBtn);

    var calBtn = document.createElement('button');
    calBtn.className = 'action-btn';
    calBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>加入行事曆';
    calBtn.addEventListener('click', function () { openCalendarMenu(calBtn, p); });
    actions.appendChild(calBtn);

    card.appendChild(actions);
    return card;
  }

  function statusOf(p, now) {
    if (now >= p.startTime && now <= p.endTime) return { cls: 'live', label: '● LIVE' };
    if (now > p.endTime) return p.canPlay ? { cls: 'replay', label: '可回看' } : { cls: 'replay', label: '已結束' };
    return { cls: 'upcoming', label: '即將開始' };
  }

  function fmtTime(epoch) {
    return new Date(epoch * 1000).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function taipeiDateKey(d) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }

  function groupByDate(programs) {
    var map = {};
    programs.forEach(function (p) {
      var key = taipeiDateKey(new Date(p.startTime * 1000));
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    var keys = Object.keys(map).sort();
    return keys.map(function (key) {
      var items = map[key].sort(function (a, b) { return a.startTime - b.startTime; });
      var d = new Date(key + 'T12:00:00+08:00');
      var weekday = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', weekday: 'long' }).format(d);
      return { key: key, items: items, weekday: weekday };
    });
  }

  function formatGroupDate(key) {
    var parts = key.split('-');
    return parts[1] + '/' + parts[2];
  }

  // ---------- Calendar export ----------
  var openMenu = null;
  function closeCalendarMenu() {
    if (openMenu) { openMenu.remove(); openMenu = null; }
    document.removeEventListener('click', onDocClick, true);
  }
  function onDocClick(e) {
    if (openMenu && !openMenu.contains(e.target)) closeCalendarMenu();
  }
  function openCalendarMenu(anchorEl, p) {
    closeCalendarMenu();
    var menu = document.createElement('div');
    menu.className = 'cal-menu';
    var googleOpt = document.createElement('button');
    googleOpt.className = 'cal-menu-item';
    googleOpt.textContent = '新增到 Google 日曆';
    googleOpt.addEventListener('click', function () {
      window.open(googleCalendarUrl(p), '_blank', 'noopener');
      showToast('已開啟 Google 日曆');
      closeCalendarMenu();
    });
    var icsOpt = document.createElement('button');
    icsOpt.className = 'cal-menu-item';
    icsOpt.textContent = '下載 .ics（Apple / Outlook 日曆）';
    icsOpt.addEventListener('click', function () {
      downloadICS(p);
      showToast('已下載行事曆檔案');
      closeCalendarMenu();
    });
    menu.appendChild(googleOpt);
    menu.appendChild(icsOpt);
    anchorEl.parentElement.style.position = 'relative';
    anchorEl.parentElement.appendChild(menu);
    openMenu = menu;
    setTimeout(function () { document.addEventListener('click', onDocClick, true); }, 0);
  }

  function truncate(s, n) { return s.length > n ? s.slice(0, n) + '…' : s; }

  function toICSDate(epoch) {
    return new Date(epoch * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  function googleCalendarUrl(p) {
    var params = new URLSearchParams({
      action: 'TEMPLATE',
      text: p.title,
      dates: toICSDate(p.startTime) + '/' + toICSDate(p.endTime),
      details: '頻道：' + p.channelName + '\n來源：Hami Video 賽事雷達\n' + 'https://hamivideo.hinet.net/channel/' + p.channelId + '.do',
      location: p.channelName,
    });
    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  function downloadICS(p) {
    var ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MatchRadar//HamiSportsSchedule//ZH-TW',
      'BEGIN:VEVENT',
      'UID:' + p.tsId + '@matchradar',
      'DTSTAMP:' + toICSDate(Date.now() / 1000),
      'DTSTART:' + toICSDate(p.startTime),
      'DTEND:' + toICSDate(p.endTime),
      'SUMMARY:' + icsEscape(p.title),
      'DESCRIPTION:' + icsEscape('頻道：' + p.channelName + ' | 來源：Hami Video 賽事雷達'),
      'LOCATION:' + icsEscape(p.channelName),
      'URL:https://hamivideo.hinet.net/channel/' + p.channelId + '.do',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = truncate(p.title.replace(/[\\/:*?"<>|]/g, ''), 40) + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function icsEscape(s) { return String(s).replace(/([,;])/g, '\\$1'); }

  function showToast(msg) {
    var toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2400);
  }
})();
