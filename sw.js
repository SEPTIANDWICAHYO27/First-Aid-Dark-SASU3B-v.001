/* FirstAid SASU3B — service worker
   App shell cache-first, data Google Sheets network-first dengan fallback cache
   supaya aplikasi tetap terbaca di area plant tanpa sinyal. */
const SHELL = 'fa-sasu3b-shell-v14';
const DATA = 'fa-sasu3b-data-v6';
const SHELL_FILES = [
  './', './index.html', './pasang.html', './manifest.webmanifest', './config.js', './pdfdoc.js',
  './apple-touch-icon.png', './favicon-32.png',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => Promise.allSettled(SHELL_FILES.map(f => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k)))
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

  // App shell & aset: cache-first, isi cache saat pertama diakses.
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
    e.waitUntil(self.registration.showNotification('FirstAid SASU3B', {
      body: 'Stok opname offline berhasil dikirim ke Google Sheets.',
      icon: './icon-192.png'
    }));
  }
});
