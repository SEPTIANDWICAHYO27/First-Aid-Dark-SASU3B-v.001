/* FirstAid SASU3B — pembuat PDF "Dokumen Permintaan Stok P3K".
   Tanpa library luar: PDF ditulis langsung (font standar Helvetica, WinAnsi),
   jadi tetap bisa dibuat saat offline di area plant.
   API: window.FAPdf.permintaan(data) → Promise<Blob> */
(function (root) {
  'use strict';

  /* Lebar glyph Helvetica / Helvetica-Bold (per 1000 unit), kode 32–255 WinAnsi. */
  var W = {"Helvetica":[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500],"Helvetica-Bold":[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556]};

  /* Unicode → WinAnsi (cp1252) untuk karakter di luar Latin-1. */
  var CP = {0x20AC:0x80,0x201A:0x82,0x0192:0x83,0x201E:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,
    0x02C6:0x88,0x2030:0x89,0x0160:0x8A,0x2039:0x8B,0x0152:0x8C,0x017D:0x8E,0x2018:0x91,0x2019:0x92,
    0x201C:0x93,0x201D:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x02DC:0x98,0x2122:0x99,0x0161:0x9A,
    0x203A:0x9B,0x0153:0x9C,0x017E:0x9E,0x0178:0x9F,0x2192:0xBB,0x2212:0x2D};

  function ansi(s) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ');
    var o = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 32 && c <= 126) o += s[i];
      else if (c >= 128 && c <= 255) o += String.fromCharCode(c);   // Latin-1 / sudah WinAnsi
      else if (CP[c]) o += String.fromCharCode(CP[c]);
      else o += '?';
    }
    return o;
  }
  function lebar(s, size, bold) {
    var t = W[bold ? 'Helvetica-Bold' : 'Helvetica'], w = 0;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i) - 32; w += (c >= 0 && t[c]) || 556; }
    return w * size / 1000;
  }
  /* Pecah teks (sudah WinAnsi) menjadi baris yang muat di lebar maks. */
  function bungkus(s, maks, size, bold) {
    var kata = s.split(' '), baris = [], cur = '';
    for (var i = 0; i < kata.length; i++) {
      var k = kata[i], coba = cur ? cur + ' ' + k : k;
      if (lebar(coba, size, bold) <= maks) { cur = coba; continue; }
      if (cur) baris.push(cur);
      while (lebar(k, size, bold) > maks && k.length > 1) {   // kata tunggal terlalu panjang
        var j = k.length; while (j > 1 && lebar(k.slice(0, j), size, bold) > maks) j--;
        baris.push(k.slice(0, j)); k = k.slice(j);
      }
      cur = k;
    }
    if (cur || !baris.length) baris.push(cur);
    return baris;
  }
  function esc(s) { return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function rgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(function (v) { return v.toFixed(3); }).join(' ');
  }
  function f(n) { return (Math.round(n * 100) / 100).toString(); }

  /* ---------- Penulis PDF minimal ---------- */
  var PW = 595.28, PH = 841.89;
  function Dok() { this.hal = []; this.baru(); this.img = null; }
  Dok.prototype.baru = function () { this.cur = []; this.hal.push(this.cur); };
  Dok.prototype.teks = function (x, y, s, o) {
    o = o || {}; var size = o.size || 9, bold = !!o.bold, t = ansi(s);
    if (o.align === 'right') x -= lebar(t, size, bold);
    else if (o.align === 'center') x -= lebar(t, size, bold) / 2;
    this.cur.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + f(size) + ' Tf ' + rgb(o.color || '#1d1f20') + ' rg ' +
      f(x) + ' ' + f(PH - y) + ' Td (' + esc(t) + ') Tj ET');
  };
  Dok.prototype.kotak = function (x, y, w, h, o) {
    o = o || {}; var s = 'q ';
    if (o.fill) s += rgb(o.fill) + ' rg ';
    if (o.stroke) s += rgb(o.stroke) + ' RG ' + f(o.lw || 0.6) + ' w ';
    s += f(x) + ' ' + f(PH - y - h) + ' ' + f(w) + ' ' + f(h) + ' re ' + (o.fill && o.stroke ? 'B' : o.fill ? 'f' : 'S') + ' Q';
    this.cur.push(s);
  };
  Dok.prototype.garis = function (x1, y1, x2, y2, o) {
    o = o || {};
    this.cur.push('q ' + rgb(o.color || '#1d1f20') + ' RG ' + f(o.lw || 0.6) + ' w ' + (o.dash ? '[2 2] 0 d ' : '') +
      f(x1) + ' ' + f(PH - y1) + ' m ' + f(x2) + ' ' + f(PH - y2) + ' l S Q');
  };
  Dok.prototype.gambar = function (x, y, w, h) {
    if (!this.img) return;
    this.cur.push('q ' + f(w) + ' 0 0 ' + f(h) + ' ' + f(x) + ' ' + f(PH - y - h) + ' cm /Im1 Do Q');
  };
  Dok.prototype.blob = function (judul) {
    var parts = [], pos = 0, off = [];
    function tulis(s) { var b = typeof s === 'string' ? bytes(s) : s; parts.push(b); pos += b.length; }
    function bytes(s) { var u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; }
    var n = this.hal.length, img = this.img;
    // nomor objek: 1 katalog, 2 pages, 3 F1, 4 F2, 5 info, 6 gambar, lalu (page, content) per halaman
    var firstPage = 7;
    var kids = []; for (var i = 0; i < n; i++) kids.push((firstPage + i * 2) + ' 0 R');
    tulis('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    function obj(no, isi) { off[no] = pos; tulis(no + ' 0 obj\n'); tulis(isi); tulis('\nendobj\n'); }
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>');
    obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    obj(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    obj(5, '<< /Title (' + esc(ansi(judul || 'Dokumen')) + ') /Producer (FirstAid SASU3B) /Creator (FirstAid SASU3B) >>');
    off[6] = pos;
    if (img) {
      tulis('6 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + img.w + ' /Height ' + img.h +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + img.data.length + ' >>\nstream\n');
      tulis(img.data); tulis('\nendstream\nendobj\n');
    } else tulis('6 0 obj\nnull\nendobj\n');
    for (var p = 0; p < n; p++) {
      var pno = firstPage + p * 2, cno = pno + 1, isi = this.hal[p].join('\n');
      obj(pno, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Contents ' + cno + ' 0 R ' +
        '/Resources << /Font << /F1 3 0 R /F2 4 0 R >>' + (img ? ' /XObject << /Im1 6 0 R >>' : '') + ' >> >>');
      obj(cno, '<< /Length ' + isi.length + ' >>\nstream\n' + isi + '\nendstream');
    }
    var total = firstPage + n * 2, xref = pos;
    var x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var k = 1; k < total; k++) x += String(off[k]).padStart(10, '0') + ' 00000 n \n';
    tulis(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R /Info 5 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(parts, { type: 'application/pdf' });
  };

  /* Logo PNG → JPEG (latar putih) agar bisa ditanam dengan DCTDecode. */
  function muatLogo(url) {
    return new Promise(function (ok) {
      if (!url || typeof document === 'undefined') return ok(null);
      var im = new Image();
      im.onload = function () {
        try {
          var s = 160, c = document.createElement('canvas'); c.width = s; c.height = s;
          var g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s); g.drawImage(im, 0, 0, s, s);
          var b64 = c.toDataURL('image/jpeg', 0.9).split(',')[1], bin = atob(b64), u = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          ok({ w: s, h: s, data: u });
        } catch (e) { ok(null); }
      };
      im.onerror = function () { ok(null); };
      im.src = url;
      setTimeout(function () { ok(null); }, 4000);
    });
  }

  /* ---------- Tata letak dokumen permintaan ---------- */
  var NAVY = '#1d2d3d', MUT = '#5d5d60', GARIS = '#b7b7ba', ZEBRA = '#f2f4f7', MERAH = '#b3263e';
  var M = 40, LB = PW - 2 * M;

  /** Menulis satu dokumen permintaan ke doc; dokumen berikutnya dimulai di halaman baru.
      d.kotak terisi → dokumen per kotak (lokasi, PIC, kolom expired); kosong → gabungan (kolom kotak). */
  function tulisDokumen(doc, d, logo, pertama) {
      if (!pertama) doc.baru();
      var y, perKotak = !!d.kotak;

      function kepala(lanjutan) {
        y = M;
        if (logo) doc.gambar(M, y - 4, 44, 44);
        var tx = logo ? M + 54 : M;
        doc.teks(tx, y + 10, 'DOKUMEN PERMINTAAN STOK P3K', { size: 14, bold: true, color: NAVY });
        doc.teks(tx, y + 24, d.unit || 'SR Asam Sulfat & Utilitas 3B', { size: 9, color: MUT });
        if (perKotak) doc.teks(tx, y + 36, 'KOTAK ' + d.kotak + ' · ' + (d.lokasi || ''), { size: 9, bold: true, color: MERAH });
        else doc.teks(tx, y + 35, 'Aplikasi FirstAid SASU3B · Manajemen & inventaris stok P3K', { size: 8, color: MUT });
        doc.teks(PW - M, y + 10, 'No. ' + d.nomor, { size: 9, bold: true, align: 'right', color: NAVY });
        doc.teks(PW - M, y + 24, d.tanggal, { size: 9, align: 'right', color: MUT });
        if (lanjutan) doc.teks(PW - M, y + 35, '(lanjutan)', { size: 8, align: 'right', color: MUT });
        y += 48;
        doc.garis(M, y, PW - M, y, { color: NAVY, lw: 1.6 });
        doc.garis(M, y + 2.5, PW - M, y + 2.5, { color: NAVY, lw: 0.4 });
        y += 14;
      }
      kepala(false);

      /* Blok informasi dua kolom */
      var info = perKotak ? [
        ['Nomor dokumen', d.nomor], ['Tanggal dibuat', d.tanggal + ', ' + d.jam],
        ['Kotak / lokasi', d.kotak + ' · ' + (d.lokasi || '-')], ['PIC kotak', d.pic || '-'],
        ['Pemohon', d.pemohon], ['NIK / Peran', d.nik + ' / ' + d.peran],
        ['Periode data stok', d.periode], ['Sumber data', d.sumber]
      ] : [
        ['Nomor dokumen', d.nomor], ['Tanggal dibuat', d.tanggal + ', ' + d.jam],
        ['Pemohon', d.pemohon], ['NIK / Peran', d.nik + ' / ' + d.peran],
        ['Lingkup kotak', d.lingkup], ['Periode data stok', d.periode],
        ['Sumber data', d.sumber], ['Jumlah jenis barang', String(d.rows.length) + ' jenis']
      ];
      var kolW = LB / 2, bx = M, by = y;
      doc.kotak(M, y, LB, 4 * 16 + 8, { fill: '#f7f8fa', stroke: GARIS, lw: 0.5 });
      info.forEach(function (it, i) {
        var cx = bx + (i % 2) * kolW + 8, cy = by + 14 + Math.floor(i / 2) * 16;
        doc.teks(cx, cy, it[0], { size: 7.5, color: MUT });
        var v = bungkus(ansi(it[1]), kolW - 102, 8.5, true)[0];
        doc.teks(cx + 92, cy, v, { size: 8.5, bold: true });
      });
      y += 4 * 16 + 8 + 14;

      doc.teks(M, y, 'Dengan ini kami mengajukan permintaan pengadaan / penggantian isi kotak P3K' +
        (perKotak ? ' nomor ' + d.kotak : '') + ' sebagai berikut:', { size: 9 });
      y += 10;

      /* Tabel barang */
      var kol = [
        { k: 'no', t: 'No', w: 22, a: 'center' },
        { k: 'nama', t: 'Nama barang', w: 150 },
        perKotak ? { k: 'exp', t: 'Expired date', w: 92 } : { k: 'kotak', t: 'Kotak', w: 92 },
        { k: 'stok', t: 'Stok', w: 36, a: 'center' },
        { k: 'ketentuan', t: 'Ketentuan', w: 50, a: 'center' },
        { k: 'diminta', t: 'Diminta', w: 46, a: 'center', b: true },
        { k: 'satuan', t: 'Satuan', w: 42, a: 'center' },
        { k: 'alasan', t: 'Keterangan', w: 0 }
      ];
      var sisa = LB; kol.forEach(function (c) { sisa -= c.w; }); kol[kol.length - 1].w = sisa;

      function kepalaTabel() {
        var hx = M;
        doc.kotak(M, y, LB, 18, { fill: NAVY });
        kol.forEach(function (c) {
          var tx = c.a === 'center' ? hx + c.w / 2 : hx + 4;
          doc.teks(tx, y + 12, c.t.toUpperCase(), { size: 7, bold: true, color: '#ffffff', align: c.a === 'center' ? 'center' : 'left' });
          hx += c.w;
        });
        y += 18;
      }
      kepalaTabel();

      var BAWAH = PH - M - 30, total = 0;
      d.rows.forEach(function (r, i) {
        var nilai = { no: String(i + 1), nama: r.nama, kotak: r.kotak, exp: r.exp || '-', stok: String(r.stok), ketentuan: String(r.ketentuan),
          diminta: String(r.diminta), satuan: r.satuan || 'pcs', alasan: r.alasan };
        total += Number(r.diminta) || 0;
        var baris = {}, maxL = 1;
        kol.forEach(function (c) {
          baris[c.k] = bungkus(ansi(nilai[c.k]), c.w - 8, 8, !!c.b);
          if (baris[c.k].length > maxL) maxL = baris[c.k].length;
        });
        var h = 8 + maxL * 10;
        if (y + h > BAWAH) { doc.baru(); kepala(true); kepalaTabel(); }
        if (i % 2) doc.kotak(M, y, LB, h, { fill: ZEBRA });
        var cx = M;
        kol.forEach(function (c) {
          baris[c.k].forEach(function (ln, j) {
            var tx = c.a === 'center' ? cx + c.w / 2 : cx + 4;
            doc.teks(tx, y + 12 + j * 10, ln, { size: 8, bold: !!c.b, align: c.a === 'center' ? 'center' : 'left',
              color: c.k === 'alasan' && /kedaluwarsa|kosong/i.test(nilai.alasan) ? MERAH : '#1d1f20' });
          });
          cx += c.w;
        });
        doc.garis(M, y + h, PW - M, y + h, { color: GARIS, lw: 0.4 });
        y += h;
      });
      if (!d.rows.length) {
        doc.teks(PW / 2, y + 16, 'Tidak ada barang yang perlu diminta untuk lingkup ini.', { size: 9, align: 'center', color: MUT });
        y += 26;
      }
      /* Baris total */
      if (y + 20 > BAWAH) { doc.baru(); kepala(true); }
      doc.kotak(M, y, LB, 18, { fill: '#e7ebf0' });
      doc.teks(M + 8, y + 12, 'TOTAL BARANG DIMINTA', { size: 8, bold: true, color: NAVY });
      var xDim = M; for (var q = 0; q < 5; q++) xDim += kol[q].w;
      doc.teks(xDim + kol[5].w / 2, y + 12, String(total), { size: 9, bold: true, align: 'center', color: NAVY });
      y += 34;

      /* Catatan */
      var cat = bungkus(ansi(d.catatan || '-'), LB - 16, 8.5, false);
      var hCat = 22 + cat.length * 11;
      if (y + hCat + 120 > PH - M - 20) { doc.baru(); kepala(true); }
      doc.teks(M, y, 'Catatan', { size: 8, bold: true, color: NAVY });
      y += 5;
      doc.kotak(M, y, LB, hCat - 8, { stroke: GARIS, lw: 0.5 });
      cat.forEach(function (ln, i) { doc.teks(M + 8, y + 14 + i * 11, ln, { size: 8.5 }); });
      y += hCat + 8;

      /* Tanda tangan */
      var ttd = [['Diajukan oleh,', d.pemohon, 'NIK ' + d.nik], ['Diperiksa oleh,', '', 'Approver'], ['Disetujui oleh,', '', 'Atasan / Superintendent']];
      var tw = LB / 3;
      doc.teks(PW - M, y, d.tanggal, { size: 8.5, align: 'right', color: MUT });
      y += 14;
      ttd.forEach(function (t, i) {
        var cx = M + i * tw + tw / 2;
        doc.teks(cx, y, t[0], { size: 8.5, align: 'center' });
        doc.garis(cx - tw / 2 + 16, y + 58, cx + tw / 2 - 16, y + 58, { lw: 0.6 });
        if (t[1]) doc.teks(cx, y + 54, t[1], { size: 8.5, bold: true, align: 'center' });
        doc.teks(cx, y + 69, t[2], { size: 7.5, align: 'center', color: MUT });
      });

  }

  /** Kaki semua halaman: sumber + nomor halaman. */
  function kaki(doc, dibuat) {
    var n = doc.hal.length;
    doc.hal.forEach(function (pg, i) {
      doc.cur = pg;
      doc.garis(M, PH - M + 6, PW - M, PH - M + 6, { color: GARIS, lw: 0.4 });
      doc.teks(M, PH - M + 17, 'Dibuat otomatis oleh FirstAid SASU3B · ' + dibuat, { size: 7, color: MUT });
      doc.teks(PW - M, PH - M + 17, 'Halaman ' + (i + 1) + ' / ' + n, { size: 7, color: MUT, align: 'right' });
    });
  }

  /** Satu dokumen (per kotak atau gabungan). */
  function permintaan(d) {
    return muatLogo(d.logoUrl).then(function (logo) {
      var doc = new Dok(); doc.img = logo;
      tulisDokumen(doc, d, logo, true);
      kaki(doc, d.dibuat);
      return doc.blob('Dokumen Permintaan Stok P3K ' + d.nomor);
    });
  }

  /** Beberapa dokumen dalam satu PDF — satu dokumen per kotak, masing-masing mulai di halaman baru. */
  function permintaanBanyak(list) {
    if (!list || !list.length) return Promise.reject(new Error('tidak ada dokumen'));
    return muatLogo(list[0].logoUrl).then(function (logo) {
      var doc = new Dok(); doc.img = logo;
      list.forEach(function (d, i) { tulisDokumen(doc, d, logo, i === 0); });
      kaki(doc, list[0].dibuat);
      return doc.blob('Dokumen Permintaan Stok P3K per kotak');
    });
  }

  root.FAPdf = { permintaan: permintaan, permintaanBanyak: permintaanBanyak, _ansi: ansi, _bungkus: bungkus };
})(typeof window !== 'undefined' ? window : globalThis);
