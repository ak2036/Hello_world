/* Hero Quest – shared reminder logic.
   Used by the page (index.html), the service worker (sw.js) and the
   optional GitHub Actions push sender (push/send-reminders.mjs). */
(function (g) {
  'use strict';
  const HERO_NAMES = {
    fury: 'Nick Fury', widow: 'Black Widow', hawkeye: 'Hawkeye', spidey: 'Spider-Man',
    panther: 'Black Panther', hulk: 'Hulk', strange: 'Doctor Strange', thor: 'Thor',
    marvel: 'Captain Marvel', ironman: 'Iron Man', cap: 'Captain America', sugaros: 'Sugaros',
  };
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const pad = n => String(n).padStart(2, '0');
  const parse = k => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const addDays = (k, n) => { const d = new Date(parse(k) + n * 86400000); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
  const niceDate = k => { const [, m, d] = k.split('-').map(Number); return `${d} ${MONTHS[m - 1]}`; };
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  /** Local date parts. With a time zone (server side) uses Intl; otherwise the device clock. */
  function localParts(date, tz) {
    if (!tz) return { key: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, day: date.getDay(), mins: date.getHours() * 60 + date.getMinutes() };
    const p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
      .formatToParts(date).forEach(x => { p[x.type] = x.value; });
    return { key: `${p.year}-${p.month}-${p.day}`, day: WD[p.weekday], mins: (+p.hour % 24) * 60 + (+p.minute) };
  }

  const fill = (text, ctx) => String(text || '')
    .replace(/\{n\}/g, ctx.name || 'Agent').replace(/\{d\}/g, ctx.d ?? '').replace(/\{date\}/g, ctx.date ?? '');

  /** If the stored prediction is in the past, roll it forward by the average cycle (server-side configs go stale). */
  function projectNext(next, avg, todayKey) {
    if (!next) return null;
    if (avg && diffDays(todayKey, next) < -10) { while (diffDays(todayKey, next) < 0) next = addDays(next, avg); }
    return next;
  }

  /**
   * Reminders that should fire now.
   * state: { name, reminders[], lastFired{id:dateKey}, done{sugar[],sleep[],cycle[]}, nextPeriod, avgCycle }
   * parts: from localParts(); grace: minutes after the set time we still fire (catch-up window).
   */
  function due(state, parts, grace) {
    const out = [];
    for (const r of state.reminders || []) {
      if (!r.on || !r.time || !(r.days || []).includes(parts.day)) continue;
      const [h, m] = r.time.split(':').map(Number), at = h * 60 + m;
      if (parts.mins < at || parts.mins - at > grace) continue;
      if ((state.lastFired || {})[r.id] === parts.key) continue;
      const ctx = { name: state.name };
      if (r.type === 'periodSoon') {
        const next = projectNext(state.nextPeriod, state.avgCycle, parts.key);
        if (!next) continue;
        const d = diffDays(parts.key, next);
        if (d !== Number(r.offset || 0)) continue;
        ctx.d = d; ctx.date = niceDate(next);
      }
      if (r.skip && ((state.done || {})[r.type] || []).includes(parts.key)) continue;
      out.push({ id: r.id, key: parts.key, hero: r.hero || 'fury', tab: r.tab || 'home',
        title: `${HERO_NAMES[r.hero] || 'Hero Quest'} · ${fill(r.title, ctx)}`, body: fill(r.body, ctx) });
    }
    return out;
  }

  g.HeroReminders = { due, localParts, fill, diffDays, HERO_NAMES };
})(typeof self !== 'undefined' ? self : globalThis);
