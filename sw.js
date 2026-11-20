// Ratio by Konta & Cie: офлайн-режим. Приложение берем из сети, если она ответила за 1,5 с, иначе из кэша.
const C = 'ratio-v8';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const put = (r, res) => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); } return res; };
const timeout = (p, ms) => new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout')), ms); p.then(v => { clearTimeout(t); ok(v); }, e => { clearTimeout(t); no(e); }); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const lib = /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|telegram\.org/.test(u.host);
  if (u.origin !== location.origin && !lib) return; // котировки и сервер: только сеть
  if (lib) {
    e.respondWith(caches.match(r).then(m => { const net = fetch(r).then(res => put(r, res)); if (m) { net.catch(() => {}); return m; } return net; }));
    return;
  }
  const net = fetch(r).then(res => put(r.mode === 'navigate' ? './index.html' : r, res));
  if (r.mode === 'navigate') { e.respondWith(timeout(net, 1500).catch(() => caches.match('./index.html').then(m => m || net))); return; }
  e.respondWith(timeout(net, 2500).catch(() => caches.match(r).then(m => m || net)));
});
