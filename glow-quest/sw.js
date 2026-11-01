/* Hero Quest service worker: offline cache, reminder notifications, push. */
importScripts('reminders-core.js');

const CACHE = 'hero-quest-v1';
const STATE_URL = new URL('__reminder-state', self.registration.scope).href;
const SHELL = ['./', './index.html', './reminders-core.js', './manifest.webmanifest', './icons/icon-192.png', './vendor/jspdf.umd.min.js'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Network first so updates show up immediately; cache as an offline fallback.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin || req.url === STATE_URL) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

async function readState() {
  const r = await (await caches.open(CACHE)).match(STATE_URL);
  return r ? r.json() : null;
}
async function writeState(s) {
  await (await caches.open(CACHE)).put(STATE_URL, new Response(JSON.stringify(s), { headers: { 'content-type': 'application/json' } }));
}
function show(n) {
  return self.registration.showNotification(n.title, {
    body: n.body, tag: `hq-${n.id}-${n.key || ''}`, renotify: false,
    icon: `icons/hero-${n.hero}.png`, badge: 'icons/badge-96.png',
    data: { tab: n.tab }, vibrate: [120, 60, 120],
  });
}

// Fire any reminders that are due (used by periodic background sync, where the browser supports it).
async function runDue() {
  const st = await readState();
  if (!st || !st.enabled) return;
  const parts = HeroReminders.localParts(new Date());
  const list = HeroReminders.due(st, parts, 180);
  st.lastFired = st.lastFired || {};
  for (const n of list) { await show(n); st.lastFired[n.id] = parts.key; }
  if (list.length) await writeState(st);
}
self.addEventListener('periodicsync', e => { if (e.tag === 'hero-reminders') e.waitUntil(runDue()); });
self.addEventListener('message', e => { if (e.data === 'check-reminders') e.waitUntil(runDue()); });

// Real push from the optional GitHub Actions sender.
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let d = {};
    try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
    const st = await readState();
    if (st && d.id) { st.lastFired = st.lastFired || {}; st.lastFired[d.id] = HeroReminders.localParts(new Date()).key; await writeState(st); }
    await show({ id: d.id || 'push', key: d.key, title: d.title || 'Hero Quest', body: d.body || 'New transmission from HQ ⚡', hero: d.hero || 'fury', tab: d.tab || 'home' });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const tab = (e.notification.data && e.notification.data.tab) || 'home';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = all.find(w => w.url.startsWith(self.registration.scope));
    if (c) { c.postMessage({ type: 'open-tab', tab }); return c.focus(); }
    return self.clients.openWindow(new URL('./?tab=' + encodeURIComponent(tab), self.registration.scope).href);
  })());
});
