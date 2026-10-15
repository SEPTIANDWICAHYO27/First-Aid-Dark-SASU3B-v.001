/* FirstAid SASU3B — notifikasi HP (dipakai index.html dan sw.js).
   Notifikasi lokal lewat service worker: tidak butuh server push.
   - Aplikasi memeriksa tiap kali data ditarik (buka, kembali ke aplikasi, tiap 5 menit).
   - Android (aplikasi terpasang, Chrome): service worker juga memeriksa pengajuan secara
     berkala di latar (Periodic Background Sync, ± beberapa jam sekali, diatur browser).
   Catatan "sudah dikirim" disimpan di Cache Storage agar aplikasi & service worker tidak dobel. */
(function (root) {
  var CACHE = 'fa-sasu3b-meta', KEY = './__notif.json';
  var BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  function baca() {
    if (!root.caches) return Promise.resolve({});
    return caches.open(CACHE).then(function (c) { return c.match(KEY); })
      .then(function (r) { return r ? r.json() : {}; }).catch(function () { return {}; });
  }
  function tulis(o) {
    if (!root.caches) return Promise.resolve();
    return caches.open(CACHE).then(function (c) {
      return c.put(KEY, new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } }));
    }).catch(function () {});
  }
  function bolehTampil() {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  }
  function tampil(reg, n) {
    var opsi = { body: n.body, icon: './icon-192.png', badge: './favicon-32.png', tag: n.tag,
      renotify: true, data: { buka: n.buka || '' } };
    if (reg && reg.showNotification) return reg.showNotification(n.title, opsi);
    try { new Notification(n.title, opsi); } catch (e) {}
    return Promise.resolve();
  }
  function hariKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function daftar(a, n) {
    return a.slice(0, n).join(' · ') + (a.length > n ? ' · +' + (a.length - n) + ' lagi' : '');
  }

  /** ctx = {nik, peran, approvals:[{id,status,nikPengaju,namaPengaju,ringkasan,kotak,jenis,penyetuju,alasan}],
             stok:{lewat,kritis,kurang,kotak:[…]}, checklist:{belum:[kotak…], bulan(0-11), tahun, tanggal, akhirBulan},
             sekarang: Date}  → daftar notifikasi baru; yang sudah dikirim dicatat. */
  function nilai(ctx, mem) {
    var out = [], sent = mem.sent || (mem.sent = {}), now = ctx.sekarang || new Date(), t = now.getTime();
    var approver = /^(admin|approver)$/i.test(String(ctx.peran || '').trim());
    var nik = String(ctx.nik || '').replace(/\D/g, '');
    var A = ctx.approvals || [];
    var awal = !mem.awal || mem.awal[nik] === undefined;      // pertama kali aktif: jangan banjiri keputusan lama
    mem.awal = mem.awal || {};

    // 1) Admin & Approver: pengajuan baru yang menunggu
    if (approver) {
      var baru = A.filter(function (a) { return !a.status && !sent['m:' + a.id]; });
      baru.forEach(function (a) { sent['m:' + a.id] = t; });
      if (baru.length === 1) {
        var a = baru[0];
        out.push({ tag: 'apv-' + a.id, buka: 'approval', title: (a.jenis || 'Pengajuan') + ' menunggu persetujuan',
          body: (a.ringkasan || a.id) + (a.namaPengaju ? ' — oleh ' + a.namaPengaju : '') + ' (' + a.id + ')' });
      } else if (baru.length > 1) {
        out.push({ tag: 'apv-banyak', buka: 'approval', title: baru.length + ' pengajuan menunggu persetujuan',
          body: daftar(baru.map(function (a) { return a.id + (a.kotak ? ' · kotak ' + a.kotak : ''); }), 3) });
      }
    }
    // 2) PIC: hasil persetujuan pengajuan miliknya
    if (nik) {
      A.filter(function (a) { return a.status && a.nikPengaju === nik && !sent['p:' + a.id + ':' + a.status]; })
        .forEach(function (a) {
          sent['p:' + a.id + ':' + a.status] = t;
          if (awal) return;
          out.push({ tag: 'hasil-' + a.id, buka: 'approval',
            title: a.id + (a.status === 'ok' ? ' disetujui' : ' ditolak'),
            body: (a.ringkasan || a.jenis || '') + (a.penyetuju ? ' · oleh ' + a.penyetuju : '') +
              (a.status === 'no' && a.alasan ? ' · Alasan: ' + a.alasan : '') +
              (a.status === 'no' ? ' — kirim koreksi dari aplikasi.' : '') });
        });
    }
    mem.awal[nik] = 1;

    // 3) Kedaluwarsa & stok kurang — sekali sehari, dan lagi bila jumlahnya bertambah
    var s = ctx.stok;
    if (s && (s.lewat || s.kritis || s.kurang)) {
      var kunci = 'stok:' + hariKey(now), sidik = s.lewat + '/' + s.kritis + '/' + s.kurang;
      if (sent[kunci] !== sidik) {
        var naik = !sent[kunci] || sidik.split('/').some(function (v, i) { return +v > +(String(sent[kunci]).split('/')[i] || 0); });
        sent[kunci] = sidik;
        if (naik) {
          var b = [];
          if (s.lewat) b.push(s.lewat + ' item kedaluwarsa');
          if (s.kritis) b.push(s.kritis + ' item kedaluwarsa < 7 hari');
          if (s.kurang) b.push(s.kurang + ' item di bawah ketentuan stok');
          out.push({ tag: 'stok', buka: 'restock', title: 'Stok P3K perlu perhatian',
            body: b.join(' · ') + (s.kotak && s.kotak.length ? ' — kotak ' + daftar(s.kotak, 5) : '') });
        }
      }
    }

    // 4) Pengingat checklist bulanan: H-2 (lusa tanggal 1), hari H (tanggal 1), lalu tiap 3 hari selama belum lengkap
    var c = ctx.checklist;
    if (c && c.belum) {
      var tg = c.tanggal, akhir = c.akhirBulan, hari = 'cek:' + hariKey(now);
      if (tg === akhir - 1 && !sent[hari]) {
        sent[hari] = t;
        var bl = BULAN[(c.bulan + 1) % 12];
        out.push({ tag: 'checklist', buka: 'opname', title: 'Lusa tanggal 1 — checklist ' + bl,
          body: 'Siapkan update stok & foto kotak ' + (c.kotakSaya && c.kotakSaya.length ? daftar(c.kotakSaya, 5) : 'P3K') + ' untuk bulan ' + bl + '.' });
      } else if (c.belum.length && (tg === 1 || (tg > 1 && (tg - 1) % 3 === 0)) && !sent[hari]) {
        sent[hari] = t;
        out.push({ tag: 'checklist', buka: 'opname',
          title: (tg === 1 ? 'Hari ini tanggal 1 · ' : '') + 'Checklist ' + BULAN[c.bulan] + ' belum lengkap',
          body: c.belum.length + ' kotak belum update stok/foto: ' + daftar(c.belum, 6) });
      }
    }

    // bersihkan catatan lama (> 120 hari)
    Object.keys(sent).forEach(function (k) { if (typeof sent[k] === 'number' && t - sent[k] > 120 * 864e5) delete sent[k]; });
    return out;
  }

  /** Jalankan pemeriksaan & tampilkan notifikasi baru. */
  function periksa(ctx, reg) {
    if (!bolehTampil()) return Promise.resolve([]);
    return baca().then(function (mem) {
      if (mem.mati) return [];
      var n = nilai(ctx, mem);
      return tulis(mem).then(function () {
        return Promise.all(n.map(function (x) { return tampil(reg, x); })).then(function () { return n; });
      });
    });
  }

  /* ---- Pemeriksaan di service worker (latar): hanya tab Approvals & Permintaan ---- */
  function csv(t) {
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < t.length; i++) {
      var ch = t[i];
      if (q) { if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (ch !== '\r') cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  function urai(teks, prm) {
    var g = csv(teks || ''); if (!g.length) return [];
    var h = g[0].map(function (x) { return String(x).trim().toLowerCase(); });
    var k = function (n) { return h.indexOf(n.toLowerCase()); };
    var iId = k('ID'), iSt = k('Status');
    if (iId < 0 || iSt < 0) return [];
    if (prm && k('Nama Pemohon') < 0) return [];
    var ambil = function (r, n) { var i = k(n); return i >= 0 ? String(r[i] || '').trim() : ''; };
    return g.slice(1).filter(function (r) { return (prm ? /^PRM-/i : /^APV-/i).test(String(r[iId] || '').trim()); }).map(function (r) {
      var st = String(r[iSt] || '').toLowerCase();
      return { id: String(r[iId]).trim(), jenis: prm ? 'Permintaan stok' : (ambil(r, 'Jenis') || 'Update stok'),
        kotak: ambil(r, 'Kotak'), ringkasan: prm ? 'Permintaan stok' + (ambil(r, 'Kotak') ? ' · kotak ' + ambil(r, 'Kotak') : '') : ambil(r, 'Ringkasan'),
        nikPengaju: ambil(r, prm ? 'NIK Pemohon' : 'NIK Pengaju').replace(/\D/g, ''),
        namaPengaju: ambil(r, prm ? 'Nama Pemohon' : 'Nama Pengaju'),
        status: st.indexOf('setuju') >= 0 ? 'ok' : st.indexOf('tolak') >= 0 ? 'no' : null,
        penyetuju: ambil(r, 'Nama Penyetuju'), alasan: ambil(r, 'Alasan') };
    });
  }
  /** Dipanggil sw.js pada periodicsync. Profil (nik, peran, url tab) disimpan aplikasi lewat simpanProfil(). */
  function periksaLatar(reg) {
    return baca().then(function (mem) {
      var p = mem.profil;
      if (!p || !p.urlApv || mem.mati) return [];
      var ambil = function (u) { return u ? fetch(u + '&_=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).catch(function () { return ''; }) : Promise.resolve(''); };
      return Promise.all([ambil(p.urlApv), ambil(p.urlPrm)]).then(function (t) {
        return periksa({ nik: p.nik, peran: p.peran, approvals: urai(t[0], false).concat(urai(t[1], true)), sekarang: new Date() }, reg);
      });
    });
  }
  function simpanProfil(p) { return baca().then(function (mem) { mem.profil = p; return tulis(mem); }); }
  function setAktif(on) { return baca().then(function (mem) { mem.mati = !on; return tulis(mem); }); }

  root.FANotif = { periksa: periksa, periksaLatar: periksaLatar, simpanProfil: simpanProfil, setAktif: setAktif,
    nilai: nilai, urai: urai, tampil: tampil };
})(typeof self !== 'undefined' ? self : this);
