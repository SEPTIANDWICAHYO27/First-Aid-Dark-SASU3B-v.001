/**
 * FirstAid SASU3B — backend Google Apps Script (Web App) untuk spreadsheet dB_checklist P3K.
 *
 * Aksi (POST, body JSON teks):
 *   auth       {nik, sandi}                         → {ok, token, nama, peran}
 *   checklist  {token, box_id, bulan, tahun, rows:[{item_id, nama, qty, exp_date}], foto, waktu}
 *              → menulis ke kolom "Update stok" & "Expired Date" BULAN tersebut di tab Checklist P3K,
 *                menyimpan foto ke Google Drive + baris baru di tab Foto Kotak + gambar di sel foto bulan itu,
 *                dan mencatat ke tab Log (Riwayat Penggunaan).
 * GET  ?action=waktu → {ok, epoch, tz}   ·   GET tanpa parameter → status backend.
 *
 * Pasang: Extensions → Apps Script pada spreadsheet → tempel berkas ini → Deploy → Manage deployments
 * → (edit deployment lama → Version: New version) atau New deployment → Web app,
 * Execute as: Me, Who has access: Anyone. Salin URL /exec ke config.js (API_URL).
 */

var P3K = {
  SHEET_CHECKLIST: 'Checklist P3K',
  SHEET_USER: 'User',
  SHEET_LOG: 'Log',
  SHEET_FOTO: 'Foto Kotak',
  FOLDER_FOTO: 'Foto Kotak P3K',   // folder Drive (dibuat otomatis bila belum ada)
  SESI_JAM: 8,                      // masa berlaku token
  VERSI: 'v7-2026-10'
};
var BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

/* ───────────────────────── Titik masuk ───────────────────────── */

function doGet(e) {
  var a = (e && e.parameter && e.parameter.action) || '';
  if (a === 'waktu') return P3K_json({ ok: true, epoch: Date.now(), tz: P3K_ss().getSpreadsheetTimeZone() });
  return P3K_json({ ok: true, app: 'FirstAid SASU3B', versi: P3K.VERSI });
}

function doPost(e) {
  var req;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return P3K_json({ ok: false, error: 'Format permintaan tidak valid.' }); }
  try {
    if (req.action === 'auth') return P3K_json(P3K_auth(req));
    if (req.action === 'checklist') return P3K_json(P3K_checklist(req));
    return P3K_json({ ok: false, error: 'Aksi tidak dikenal: ' + req.action });
  } catch (err) {
    return P3K_json({ ok: false, error: String(err && err.message || err) });
  }
}

/* ───────────────────────── Login & token ───────────────────────── */

function P3K_auth(req) {
  var u = P3K_cariUser(String(req.nik || '').trim());
  if (!u || String(req.sandi || '') !== u.pw) return { ok: false, error: 'NIK atau password salah.' };
  var exp = Date.now() + P3K.SESI_JAM * 3600000;
  return { ok: true, token: P3K_buatToken(u.nik, exp), nama: u.nama, peran: u.peran, berlaku_sampai: exp };
}

function P3K_cariUser(nik) {
  var sh = P3K_ss().getSheetByName(P3K.SHEET_USER);
  if (!sh || !nik) return null;
  var v = sh.getDataRange().getDisplayValues();
  for (var i = 0; i < v.length; i++) {
    // Kolom: No | Username (NIK) | Password | Nama | Role
    if (String(v[i][1]).trim() === nik)
      return { nik: nik, pw: String(v[i][2]).trim(), nama: String(v[i][3]).trim(), peran: String(v[i][4] || 'User').trim() };
  }
  return null;
}

function P3K_rahasia() {
  var p = PropertiesService.getScriptProperties(), s = p.getProperty('TOKEN_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('TOKEN_SECRET', s); }
  return s;
}
function P3K_tandaTangan(teks) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(teks, P3K_rahasia())).replace(/=+$/, '');
}
function P3K_buatToken(nik, exp) { var b = nik + '.' + exp; return b + '.' + P3K_tandaTangan(b); }
function P3K_cekToken(tok) {
  var p = String(tok || '').split('.');
  if (p.length !== 3) return null;
  if (P3K_tandaTangan(p[0] + '.' + p[1]) !== p[2]) return null;
  if (Date.now() > Number(p[1])) return null;
  return P3K_cariUser(p[0]);
}

/* ───────────────────────── Update stok bulanan ───────────────────────── */

function P3K_checklist(req) {
  var user = P3K_cekToken(req.token);
  if (!user) return { ok: false, error: 'Sesi server berakhir — masuk ulang di aplikasi.' };

  var ss = P3K_ss(), tz = ss.getSpreadsheetTimeZone(), now = new Date();
  var bulan = parseInt(req.bulan, 10);
  if (!(bulan >= 1 && bulan <= 12)) bulan = Number(Utilities.formatDate(now, tz, 'M'));
  var boxId = String(req.box_id || '').trim();
  if (!/^\d{3,}$/.test(boxId)) return { ok: false, error: 'Nomor kotak tidak valid.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = ss.getSheetByName(P3K.SHEET_CHECKLIST);
    if (!sh) return { ok: false, error: 'Tab "' + P3K.SHEET_CHECKLIST + '" tidak ditemukan.' };
    var values = sh.getDataRange().getDisplayValues();

    var tahunSheet = P3K_tahunSheet(values);
    var tahun = parseInt(req.tahun, 10) || Number(Utilities.formatDate(now, tz, 'yyyy'));
    if (tahunSheet && tahun !== tahunSheet)
      return { ok: false, error: 'Sheet Checklist berisi data tahun ' + tahunSheet + ', sedangkan kiriman untuk ' + tahun +
        '. Siapkan sheet tahun ' + tahun + ' terlebih dahulu.' };

    var rencana = P3K_rencanaTulis(values, boxId, bulan, req.rows || []);
    if (rencana.error) return { ok: false, error: rencana.error };

    rencana.tulis.forEach(function (t) {
      var sel = sh.getRange(t.baris, t.kolom);
      if (t.jenis === 'exp') {
        var p = String(t.nilai).split('-');     // yyyy-mm-dd dari input tanggal
        sel.setValue(new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))).setNumberFormat('dd/mm/yyyy');
      } else {
        sel.setValue(t.nilai);
      }
    });

    var fotoUrl = '';
    if (req.foto && /^data:image\//.test(req.foto)) {
      fotoUrl = P3K_simpanFoto(req.foto, boxId, bulan, tahun, user, now);
      P3K_tempelFotoDiSel(sh, rencana.barisKotak, rencana.kolomFoto, fotoUrl);
    }

    var nItem = rencana.tulis.filter(function (t) { return t.jenis === 'qty'; }).length;
    var nExp = rencana.tulis.filter(function (t) { return t.jenis === 'exp'; }).length;
    P3K_log(user.nik + ' · ' + user.nama, 'Update stok',
      'Kotak ' + boxId + ' · ' + BULAN_ID[bulan - 1] + ' ' + tahun + ' · ' + nItem + ' jumlah stok, ' + nExp +
      ' expired date' + (fotoUrl ? ' + foto' : '') + (rencana.tidakDikenal.length ? ' · item tak dikenal: ' + rencana.tidakDikenal.join(', ') : ''));
    SpreadsheetApp.flush();

    return { ok: true, item_ditulis: nItem, exp_ditulis: nExp, foto: !!fotoUrl, foto_url: fotoUrl,
      bulan: bulan, tahun: tahun, kolom_stok: P3K_hurufKolom(rencana.kolomQty), tidak_dikenal: rencana.tidakDikenal };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Inti penulisan — murni (tanpa SpreadsheetApp) supaya bisa diuji.
 * values: getDisplayValues() tab Checklist P3K. Mengembalikan daftar sel {baris, kolom, jenis, nilai} (1-based).
 * Tata letak: kolom C = "Nomor Kotak / Lokasi" (baris pertama tiap blok kotak), E = Isi Kotak,
 * mulai kolom G tiap bulan berisi (Foto Kotak P3K | Update stok | Expired Date) — atau format lama (Update stok | Expired Date).
 */
function P3K_rencanaTulis(values, boxId, bulan, rows) {
  var tiga = false;
  for (var r = 0; r < Math.min(values.length, 6); r++)
    for (var c = 6; c < values[r].length; c++)
      if (/foto/i.test(String(values[r][c]))) tiga = true;
  var lebar = tiga ? 3 : 2;
  var kolomDasar = 7 + (bulan - 1) * lebar;                  // kolom G = 7
  var kolomFoto = tiga ? kolomDasar : 0;
  var kolomQty = kolomDasar + (tiga ? 1 : 0);
  var kolomExp = kolomQty + 1;

  // Cari blok kotak: sel kolom C yang diawali nomor kotak, sampai kotak berikutnya.
  var mulai = -1, akhir = values.length;
  for (var i = 0; i < values.length; i++) {
    var sel = String(values[i][2] || '').trim();
    if (!sel) continue;
    var no = (sel.match(/^\d{3,}/) || [''])[0];
    if (mulai < 0 && no === boxId) { mulai = i; continue; }
    if (mulai >= 0 && no) { akhir = i; break; }
  }
  if (mulai < 0) return { error: 'Kotak ' + boxId + ' tidak ditemukan di kolom "Nomor Kotak / Lokasi".' };

  var petaBaris = {};
  for (var j = mulai; j < akhir; j++) {
    var isi = String(values[j][4] || '').trim();
    if (!isi) continue;
    petaBaris[P3K_idItem(isi)] = j + 1;
    petaBaris['n:' + isi.toLowerCase().replace(/\s+/g, ' ')] = j + 1;
  }

  var tulis = [], tidakDikenal = [];
  rows.forEach(function (it) {
    var baris = petaBaris[String(it.item_id || '')] || petaBaris[P3K_idItem(it.nama || '')] ||
      petaBaris['n:' + String(it.nama || '').trim().toLowerCase().replace(/\s+/g, ' ')];
    if (!baris) { tidakDikenal.push(it.nama || it.item_id); return; }
    if (it.qty !== null && it.qty !== undefined && it.qty !== '' && isFinite(Number(it.qty)))
      tulis.push({ baris: baris, kolom: kolomQty, jenis: 'qty', nilai: Number(it.qty) });
    if (it.exp_date && /^\d{4}-\d{2}-\d{2}$/.test(String(it.exp_date)))
      tulis.push({ baris: baris, kolom: kolomExp, jenis: 'exp', nilai: String(it.exp_date) });
  });
  return { tulis: tulis, tidakDikenal: tidakDikenal, barisKotak: mulai + 1,
    kolomFoto: kolomFoto, kolomQty: kolomQty, kolomExp: kolomExp };
}

/** Sama persis dengan id item di aplikasi. */
function P3K_idItem(nama) { return String(nama).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14); }

function P3K_tahunSheet(values) {
  for (var r = 0; r < Math.min(values.length, 4); r++) {
    var m = /tahun\s+(\d{4})/i.exec(values[r].join(' '));
    if (m) return Number(m[1]);
  }
  return 0;
}

/* ───────────────────────── Foto ───────────────────────── */

function P3K_simpanFoto(dataUrl, boxId, bulan, tahun, user, now) {
  var m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return '';
  var ext = m[1].split('/')[1].replace('jpeg', 'jpg');
  var nama = 'Kotak-' + boxId + '_' + tahun + '-' + ('0' + bulan).slice(-2) + '_' +
    Utilities.formatDate(now, P3K_ss().getSpreadsheetTimeZone(), 'yyyyMMdd-HHmmss') + '.' + ext;
  var file = P3K_folderFoto().createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], nama));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000';

  var sh = P3K_ss().getSheetByName(P3K.SHEET_FOTO) || P3K_ss().insertSheet(P3K.SHEET_FOTO);
  // Timestamp | Kotak | Bulan | URL foto | NIK  (format yang dibaca aplikasi)
  sh.appendRow([now, boxId, bulan, url, user.nik]);
  return url;
}

function P3K_folderFoto() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('FOTO_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var it = DriveApp.getFoldersByName(P3K.FOLDER_FOTO);
  var f = it.hasNext() ? it.next() : DriveApp.createFolder(P3K.FOLDER_FOTO);
  p.setProperty('FOTO_FOLDER_ID', f.getId());
  return f;
}

/** Gambar di sel foto bulan itu + kolom B "Tampilan Update Foto Kotak P3K". Gagal di sini tidak membatalkan kiriman. */
function P3K_tempelFotoDiSel(sh, baris, kolomFoto, url) {
  if (!url) return;
  try {
    if (kolomFoto) {
      var img = SpreadsheetApp.newCellImage().setSourceUrl(url).setAltTextTitle('Foto kotak P3K').build();
      sh.getRange(baris, kolomFoto).setValue(img);
    }
  } catch (e) {
    if (kolomFoto) sh.getRange(baris, kolomFoto).setFormula('=IMAGE("' + url + '")');
  }
  try { sh.getRange(baris, 2).setFormula('=IMAGE("' + url + '")'); } catch (e) {}
}

/* ───────────────────────── Util ───────────────────────── */

function P3K_log(user, aksi, detail) {
  var sh = P3K_ss().getSheetByName(P3K.SHEET_LOG);
  if (sh) sh.appendRow([new Date(), user, aksi, detail]);   // Timestamp | User | Action | Details
}
function P3K_ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function P3K_json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function P3K_hurufKolom(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

/** Jalankan sekali dari editor untuk memberi izin Drive/Sheets dan mengecek kolom bulan berjalan. */
function P3K_ujiSetup() {
  var sh = P3K_ss().getSheetByName(P3K.SHEET_CHECKLIST);
  var v = sh.getDataRange().getDisplayValues();
  var bln = Number(Utilities.formatDate(new Date(), P3K_ss().getSpreadsheetTimeZone(), 'M'));
  var r = P3K_rencanaTulis(v, '459', bln, []);
  P3K_folderFoto();
  Logger.log('Tahun sheet: %s · Kolom Update stok %s: %s · Expired: %s · Foto: %s',
    P3K_tahunSheet(v), BULAN_ID[bln - 1], P3K_hurufKolom(r.kolomQty), P3K_hurufKolom(r.kolomExp), P3K_hurufKolom(r.kolomFoto));
}
