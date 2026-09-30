# FirstAid SASU3B — PWA

Isi folder ini diunggah apa adanya ke root repository GitHub.

1. github.com → New repository → nama mis. `firstaid-sasu3b` → Public → Create.
2. Add file → Upload files → seret SEMUA berkas folder ini → Commit changes.
3. Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save.
4. Tunggu 1–2 menit, buka `https://<username>.github.io/firstaid-sasu3b/`.
5. Pasang di HP:
   - Android (Chrome): menu ⋮ → Install app / Tambahkan ke layar utama.
   - iPhone (Safari): tombol Bagikan → Add to Home Screen.

Mengganti spreadsheet / Apps Script: edit `config.js` saja, lalu unggah ulang berkas itu.
Setiap `index.html` diperbarui: unggah juga `sw.js` (versi cache sudah dinaikkan) agar HP mengambil versi baru.

## Pembaruan v7 (Oktober 2026)

- **Jam realtime**: jam & tanggal aplikasi (status bar, Beranda, login, periode opname, dokumen)
  diambil dari server Google Sheets lewat fungsi `now()` pada spreadsheet yang sama, lalu
  berdetak tiap detik dalam WIB. Dikalibrasi ulang tiap 5 menit dan setiap aplikasi dibuka lagi.
  Bila offline, koreksi terakhir tetap dipakai; bila belum pernah tersambung, jam perangkat dipakai
  dan status bar menandainya "Jam perangkat".
- **Foto kotak per bulan**: dibaca dari tab `Foto Kotak` (Timestamp | Kotak | Bulan | URL | NIK).
  Beranda menampilkan galeri 9 kotak per bulan (tombol ‹ › untuk bulan lain); layar Kotak
  menampilkan foto bulan terpilih + strip Jan–Des. Foto Drive harus dibagikan
  "Siapa saja yang memiliki link" agar tampil.
- **Menu Dokumen**: tab baru di navigasi bawah. Daftar permintaan disusun otomatis dari stok
  kurang / kedaluwarsa, jumlah bisa disesuaikan, lalu **Unduh PDF** (dibuat di perangkat oleh
  `pdfdoc.js`, tanpa library luar, tetap jalan offline).
- Pembacaan sheet `Checklist P3K` kini mengenali tata letak 3 kolom per bulan
  (Foto Kotak P3K | Update stok | Expired Date).

Berkas yang harus diunggah ulang: `index.html`, `sw.js`, `config.js`, `pdfdoc.js` (baru).
