# FirstAid SASU3B — aplikasi stok kotak P3K

## 📲 Pasang sebagai aplikasi (Android, iPhone, komputer)

Bagikan link ini ke tim: **https://septiandwicahyo27.github.io/First-Aid-Dark-SASU3B-v.001/pasang.html**

| Perangkat | Cara pasang |
|---|---|
| **Android** (Chrome) | Buka link → ketuk **Pasang aplikasi** → **Instal**. Atau menu ⋮ → *Instal aplikasi*. |
| **iPhone / iPad** (Safari) | Buka link di **Safari** → tombol **Bagikan** → **Tambahkan ke Layar Utama** → **Tambah**. |
| **Windows / Mac** (Chrome / Edge) | Buka link → **Pasang aplikasi**, atau ikon pasang di bilah alamat. |

Setelah terpasang, ikon **FirstAid SASU3B** ada di layar utama: terbuka layar penuh tanpa bilah browser,
tetap bisa dibaca offline, dan pembaruan dari repo ini masuk otomatis (tanpa unduh ulang).
Tombol **Cara pasang aplikasi di HP** juga ada di layar login dan Profil.
Pintasan (tekan lama ikon di Android): *Stok opname*, *Dokumen permintaan*, *Daftar belanja*.

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

## Pembaruan v7.1 — update stok bulanan ke Google Sheets

Tombol **Simpan ke sheet · <Bulan> <Tahun>** di layar opname menulis ke tab `Checklist P3K`:
- **Update stok** & **Expired Date** pada kolom bulan berjalan (mis. Oktober = kolom AI & AJ),
  untuk seluruh 22 item kotak — item yang tidak diubah ikut dicatat sebagai stok bulan itu.
- Foto kotak → folder Drive "Foto Kotak P3K" (dibagikan via link), baris baru di tab `Foto Kotak`,
  gambar di sel "Foto Kotak P3K" bulan itu dan di kolom B.
- Catatan di tab `Log` (Riwayat Penggunaan).
Bulan & tahun diambil dari jam server Google Sheets, jadi otomatis pindah kolom setiap bulan.

### Memasang backend `apps-script/Code.gs`
1. Buka spreadsheet → **Extensions → Apps Script**.
2. Ganti isi `Code.gs` dengan berkas `apps-script/Code.gs` dari repo ini (fungsi lain milik Anda,
   mis. pengingat, boleh tetap di berkas terpisah — asal tidak ada `doGet`/`doPost` ganda).
3. Pilih fungsi `P3K_ujiSetup` → **Run** → izinkan akses. Lihat log: kolom bulan berjalan harus benar.
4. **Deploy → Manage deployments** → edit deployment yang ada → Version: *New version* → Deploy
   (URL tetap), atau **New deployment → Web app** (Execute as: *Me*, Who has access: *Anyone*).
5. Pastikan URL `/exec` sama dengan `API_URL` di `config.js`; bila berbeda, ganti lalu unggah `config.js`.
6. Uji: buka URL `/exec` di browser → harus tampil `{"ok":true,"app":"FirstAid SASU3B",...}`.

Kiriman yang tertahan di HP (antrean) otomatis terkirim setelah login ulang begitu backend aktif.
Januari: siapkan sheet Checklist tahun baru (judul "TAHUN 2027"); backend menolak menulis ke tahun yang salah.

## Pembaruan v7.2 — multi-tahun

**Aplikasi**: baris pilihan **Tahun** di Beranda, Kotak, Riwayat, dan Dokumen. Daftar tahun dibaca
otomatis dari spreadsheet (tahun awal s.d. tahun depan bila tab-nya sudah disiapkan).
- Tahun berjalan: bisa diisi opname seperti biasa.
- Tahun lalu: **arsip, hanya baca** — stok, foto per bulan, kepatuhan Jan–Des, dan dokumen PDF tetap bisa dilihat.
- Awal tahun baru: selama kolom Januari belum diisi, stok terakhir tahun lalu dipakai sebagai angka awal,
  lalu opname Januari menulisnya ke tab tahun baru.

**Backend (`apps-script/Code.gs`)**: tab tahun baru dibuat otomatis dengan menduplikat format
tab tahun sebelumnya (kotak, PIC, isi, ketentuan stok, format sel), mengganti judul "TAHUN", dan
mengosongkan data bulanan. Nama tab: `Checklist P3K 2027`, `Checklist P3K 2028`, …
Setelah menempel Code.gs, jalankan **sekali** fungsi `P3K_pasangTrigger` → trigger harian pukul 01.00:
memastikan tab tahun berjalan ada, dan sejak 1 Desember menyiapkan tab tahun berikutnya.
Tab juga dibuat otomatis saat opname pertama di tahun baru bila trigger belum terpasang.
Tahun lalu tidak bisa ditulis dari aplikasi (kecuali kiriman Desember yang tertunda hingga Januari).

## Pembaruan v7.3 — `apps-script/Config.gs`

Backend kini terdiri dari **dua berkas** di proyek Apps Script:
- `Config.gs` — semua pengaturan: ID spreadsheet, URL Web App aktif, nama tab, folder foto Drive,
  masa sesi, jam trigger harian, bulan mulai menyiapkan tab tahun depan.
- `Code.gs` — logika (tidak perlu diubah).

Di editor Apps Script: **+ → Script** → beri nama `Config` → tempel isi `apps-script/Config.gs`;
ganti isi `Code.gs` dengan `apps-script/Code.gs`. Lalu Deploy → Manage deployments → edit →
*New version* (URL tetap). Cek URL `/exec` → `"versi":"v7.3-2026-10"`.

## Pembaruan v7.4 — dokumen permintaan per kotak

Menu **Dokumen** kini menampilkan kartu untuk **setiap kotak P3K** (nomor, lokasi, PIC, jumlah barang
yang perlu diminta) dengan tombol **PDF** masing-masing. PDF per kotak memuat kop dengan nomor & lokasi
kotak, PIC kotak, kolom *Expired date*, catatan, dan tanda tangan. Tombol **Unduh semua kotak** membuat
satu PDF berisi dokumen tiap kotak yang perlu permintaan (setiap kotak mulai di halaman baru).
Ketuk kartu untuk membuka rincian kotak itu dan menyesuaikan jumlah sebelum mengunduh.

## Pembaruan v7.5 (aplikasi) & backend v7.4

- Aplikasi: saat menyimpan opname tanpa sesi server, aplikasi login ulang ke Apps Script otomatis lalu
  mengirim; alasan gagal ditampilkan. URL backend selalu dari `config.js`. Profil: status backend,
  jumlah antrean, tombol **Hubungkan ulang backend & kirim antrean**.
- Backend: selalu membaca spreadsheet `SPREADSHEET_ID` di `Config.gs`; pencocokan tab User lebih toleran
  (kolom dari judul, NIK angka saja, sandi angka). Buka URL `/exec` untuk melihat spreadsheet yang dibaca.
  Diagnosis login: isi NIK & sandi di fungsi `P3K_ujiLogin` → Run → lihat Execution log.
