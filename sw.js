/* FASTER P3K — service worker
   Halaman aplikasi network-first (update langsung terasa), aset cache-first, data Google Sheets network-first dengan fallback cache
   supaya aplikasi tetap terbaca di area plant tanpa sinyal. */
const SHELL = 'fa-sasu3b-shell-v57';
const DATA = 'fa-sasu3b-data-v6';
try { importScripts('./notif.js'); } catch (e) {}
const META = 'fa-sasu3b-meta';   // catatan notifikasi (dipakai notif.js) — jangan dihapus saat activate
const SHELL_FILES = [
  './', './index.html', './pasang.html', './manifest.webmanifest', './config.js', './pdfdoc.js', './notif.js',
  './apple-touch-icon.png', './favicon-32.png',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => Promise.allSettled(SHELL_FILES.map(f => c.add(new Request(f, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== SHELL && k !== DATA && k !== META).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  // Jam server (select now()) tidak boleh dilayani dari cache — biarkan lewat langsung.
  if (req.url.includes('docs.google.com') && /now\(\)|now%28%29/i.test(decodeURIComponent(req.url) + req.url)) return;

  // Foto Google Drive: biarkan cache HTTP browser yang menangani.
  if (req.url.includes('drive.google.com') || req.url.includes('googleusercontent.com')) return;

  // Data dari Apps Script / Google Sheets (gviz): network-first, jatuh ke cache saat offline.
  if (req.url.includes('script.google.com') || req.url.includes('docs.google.com') || req.url.includes('/api/')) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(DATA).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Halaman aplikasi (index.html / navigasi) & config.js: network-first dengan batas 4 detik,
  // supaya versi baru dari GitHub langsung terpakai; offline / sinyal lemah → salinan cache.
  const u = new URL(req.url);
  const halaman = req.mode === 'navigate' || /\/(index\.html|config\.js|sw\.js)?$/.test(u.pathname);
  if (halaman && u.origin === self.location.origin) {
    e.respondWith(new Promise(selesai => {
      let beres = false;
      const dariCache = () => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || caches.match('./index.html'));
      const jeda = setTimeout(() => dariCache().then(hit => { if (hit && !beres) { beres = true; selesai(hit); } }), 4000);
      fetch(new Request(req, { cache: 'no-cache' })).then(res => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put(req, copy));
        }
        if (!beres) { beres = true; clearTimeout(jeda); selesai(res); }
      }).catch(() => dariCache().then(hit => { if (!beres) { beres = true; clearTimeout(jeda); selesai(hit || Response.error()); } }));
    }));
    return;
  }

  // Aset lain (ikon, font, pdfdoc.js…): cache-first, isi cache saat pertama diakses.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

// Sinkronisasi tertunda: stok opname yang diisi offline dikirim saat online kembali.
self.addEventListener('sync', e => {
  if (e.tag === 'kirim-opname') {
    e.waitUntil(self.registration.showNotification('FASTER P3K', {
      body: 'Stok opname offline berhasil dikirim ke Google Sheets.',
      icon: './icon-192.png'
    }));
  }
});

// Notifikasi: pemeriksaan pengajuan di latar (Android, aplikasi terpasang) — Periodic Background Sync.
self.addEventListener('periodicsync', e => {
  if (e.tag === 'fa-cek' && self.FANotif) e.waitUntil(self.FANotif.periksaLatar(self.registration));
});

// Ketuk notifikasi → buka / fokuskan aplikasi pada layar terkait.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const buka = (e.notification.data && e.notification.data.buka) || '';
  const url = new URL('./' + (buka ? '?buka=' + encodeURIComponent(buka) : ''), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.startsWith(self.registration.scope) && 'focus' in c) {
        c.postMessage({ fa: 'buka', buka });
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
