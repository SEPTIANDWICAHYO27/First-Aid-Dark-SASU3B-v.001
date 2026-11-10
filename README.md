# FASTER P3K — aplikasi stok kotak P3K

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

## Pembaruan v7.6 — Approval untuk Admin & Approver

- Menu **Approval** di Beranda hanya muncul untuk peran **Admin** dan **Approver** (kolom Role tab `User`),
  dan hanya saat ada pengajuan update stok yang **menunggu tinjauan**. Peran *User* tidak pernah melihatnya.
- Setiap kali PIC menekan **Simpan ke sheet**, stok tetap langsung ditulis ke Checklist seperti biasa, lalu
  backend mencatat pengajuan di tab baru **`Approvals`** (dibuat otomatis): ID, waktu, kotak, bulan, pengaju,
  rincian perubahan (lama → baru), foto, status *Menunggu*.
- Admin & Approver meninjau: **Setujui**, **Tolak** (alasan wajib — tanda bagi PIC untuk mengirim koreksi),
  atau **Batalkan** keputusan. Peran dicek ulang di server. Keputusan tercatat di tab `Approvals` dan `Log`.
- Pengajuan yang menunggu juga muncul di **Notifikasi** Admin & Approver.
- Layar *Update kadaluwarsa* kini benar-benar mengirim ke sheet (sebelumnya hanya pemberitahuan).
- Data contoh approval (APV-0912 dst.) dihapus.

Unggah ulang: `index.html`, `sw.js`. Backend: ganti `apps-script/Code.gs` **dan** `apps-script/Config.gs`
(ada `SHEET_APPROVAL` & `PERAN_APPROVER` baru) → Deploy → Manage deployments → edit → *New version*.
Cek URL `/exec` → `"versi":"v7.6-2026-10"`.

### v7.6.1 — backend lebih tahan galat
- `/exec` kini menampilkan `versi_kode`, status tab `Approvals`, dan peringatan bila Config.gs belum ada
  atau masih ada berkas backend versi lama di proyek.
- Fungsi diagnosis **`P3K_ujiApproval`** (Run di editor → Execution log): cek Config, spreadsheet, akun
  Admin/Approver, tab Checklist, dan tab Approvals.
- Aksi `approvals` (khusus Admin & Approver) untuk membaca pengajuan langsung dari server.
- Tanpa `Array.fill` (aman untuk runtime lama).

**Galat "Fungsi skrip tidak ditemukan: doGet"** = deployment memakai versi tanpa `doGet`
(Code.gs belum disimpan, isi Code.gs tertukar dengan Config.gs, atau deployment tidak dibuat ulang
sebagai *New version*). Pastikan berkas `Code.gs` diawali `FirstAid SASU3B — backend` dan berisi
`function doGet`, simpan, lalu Deploy → Manage deployments → Edit → **Version: New version** → Deploy.


### Berkas backend di folder utama (v7.7)
`Code-v7.7.gs` dan `Config-v7.7.gs` = salinan persis `apps-script/Code.gs` dan `apps-script/Config.gs`.
Salin keduanya ke editor Apps Script (Code.gs dan Config.gs). **Jangan hapus `config.js`** — itu pengaturan
aplikasi (ID spreadsheet & URL backend) yang dibaca HP, berbeda dengan `Config.gs` milik Apps Script.


## Pembaruan v7.7 — Approval permintaan stok
- **Daftar belanja → "Ajukan permintaan stok ke Approver"**: barang yang belum ditandai dibeli dikirim sebagai
  permintaan (ID `PRM-…`) ke tab permintaan stok — tab dengan **gid 1115197996** (`GID_PERMINTAAN` di Config.gs dan
  `GID.PERMINTAAN` di config.js). Judul kolom dibuat otomatis bila tab kosong:
  ID | Waktu | NIK Pemohon | Nama Pemohon | Kotak | Barang | Rincian | Jumlah | Catatan | Status | NIK Penyetuju | Nama Penyetuju | Waktu Putusan | Alasan.
  Bila gid tidak ditemukan, dibuat tab bernama `Permintaan`.
- **Menu Approval** (Admin & Approver) kini berisi update stok **dan** permintaan stok; muncul bila ada yang menunggu.
- **PDF permintaan** memuat kotak status (Disetujui/Ditolak/Menunggu) serta nama & tanggal penyetuju di kolom
  tanda tangan "Diperiksa oleh". Unduh dari kartu Approval atau dari "Permintaan stok saya" di Daftar belanja.
- Unggah ulang: `index.html`, `sw.js` (v20), `config.js`, `pdfdoc.js`. Backend: `Code-v7.7.gs` + `Config-v7.7.gs`
  → Apps Script → *New version*. Cek `/exec` → `"versi_kode":"v7.7-2026-10"` dan `tab_permintaan`.

## v7.7.1 — notifikasi "Pengajuan Approval TIDAK tercatat"
- Bila stok tersimpan tetapi server tidak memberi nomor pengajuan, aplikasi kini memeriksa URL di `config.js` dan menyebut penyebabnya: deployment belum *New version*, atau ada berkas `.gs` lama di proyek yang menimpa fungsi baru.
- Backend: `/exec` kini menampilkan `approval_aktif` (true/false) dan `peringatan` bila `P3K_checklist()`/`doPost()` tertimpa berkas lama.

## v7.7.2 — tab permintaan stok
- gid 1115197996 ternyata tab **Checklist P3K**, jadi `GID_PERMINTAAN` dikosongkan (0 / null). Permintaan stok kini ditulis ke tab **"Permintaan"** yang dibuat otomatis saat permintaan pertama.
- Pengaman: backend tidak pernah menulis permintaan ke tab Checklist/User/Log/Foto/Approvals atau tab berisi data lain, walau gid salah. `/exec` menampilkan `peringatan_permintaan` bila gid menunjuk tab yang salah.

## v7.8 — kartu dashboard dari Update stok terbaru
- Empat kartu Beranda (Total baris stok, Kedaluwarsa, Di bawah ketentuan stok, Kotak lengkap) dihitung dari Update stok terbaru tiap item — bulan terakhir yang terisi, termasuk kiriman yang baru disimpan — dan diperbarui otomatis setelah simpan.
- Kedaluwarsa = sudah lewat + < 7 hari. Di bawah ketentuan = stok < ketentuan (termasuk kosong). Kotak lengkap = semua item terisi, stok cukup, tidak kedaluwarsa / < 7 hari.
- Kartu dapat diketuk: Kedaluwarsa & Di bawah ketentuan → Daftar belanja; Total & Kotak lengkap → menu Kotak.

## v7.9 — Notifikasi HP
- Aktifkan di **Profil → Notifikasi HP → Aktifkan notifikasi** (per perangkat; izinkan notifikasi saat diminta).
- Isi notifikasi: pengajuan baru menunggu persetujuan (Admin & Approver) · hasil disetujui/ditolak + alasan (PIC pengaju) · stok kedaluwarsa, < 7 hari, di bawah ketentuan (sekali sehari, lagi bila bertambah) · pengingat checklist bulanan (H-2, tanggal 1, lalu tiap 3 hari selama belum lengkap).
- Diperiksa saat aplikasi dibuka, kembali ke depan, dan tiap 5 menit selama berjalan. Android + aplikasi terpasang: pengajuan juga diperiksa di latar beberapa jam sekali (Periodic Background Sync). iPhone: pasang ke Layar Utama dulu (iOS 16.4+).
- Ketuk notifikasi → aplikasi membuka layar terkait (Approval, Daftar belanja, atau Opname). Logika ada di `notif.js` (dipakai juga oleh `sw.js`).

## Pembaruan v8.0 — Dashboard terstruktur

Menu **Beranda** menjadi **Dashboard** dengan 7 bagian bernomor:
1. **Ringkasan kesiapan** — skor % item aman (dari item yang sudah tercatat), bar komposisi
   Aman / Perhatian / Kritis / Belum diisi, serta kartu Kedaluwarsa, Di bawah ketentuan, Kotak lengkap, Total baris.
2. **Checklist bulan berjalan** — progres update stok & foto per kotak (x/9).
3. **Status per kotak** — tabel 9 kotak: lokasi, PIC, bar kondisi, status, ✓ stok & ✓ foto bulan ini; ketuk → detail kotak.
4. **Perlu tindakan** — item kedaluwarsa, kosong, < 7 hari, kurang, lengkap dengan tindakan (ganti / isi ulang / tambah n).
5. **Kedaluwarsa mendatang** — timeline 12 bulan + 5 item terdekat (90 hari).
6. **Pengadaan & persetujuan** — daftar belanja, kotak perlu dokumen PDF, approval.
7. **Dokumentasi foto** — galeri foto kotak per bulan; tombol Riwayat, Notifikasi, Sinkron.

## Pembaruan v8.1 — Tema terang "Light Emerald Luxury"

Latar aplikasi: gradasi abu-abu terang (#f5f7f8 → #edf1f2) ke emerald lembut (#e2f1ea → #cdeedf)
dengan pendaran emerald halus di kanan atas dan sentuhan emas di kiri bawah.
Kartu putih semi-transparan, teks abu-gelap, aksen emerald (#1f9d77 / #127a5c), emas (#a07a2c),
status bar & navigasi bawah berefek kaca. Layar pembuka & warna tema (manifest) ikut terang.

## Pembaruan v8.2 — Tema "Grey & Maroon Pro"

Latar: gradasi abu-abu terang (#f6f6f7 → #eeeef0) ke maroon muda (#f1e5e7 → #e8d0d5) dengan pendaran
maroon halus di kanan atas. Aksen utama maroon (#8c2f3c, tautan #7a1f2e), sentuhan emas (#a07a2c),
teks abu-gelap hangat. Warna status tetap: hijau = aman, kuning = perhatian, merah = kritis.

## Pembaruan v8.3 — kembali ke Beranda lama (tema gelap)

Atas permintaan, tampilan dikembalikan ke kondisi sebelum v8.0: Beranda lama dengan tema gelap
(index.html & manifest dari commit ed1932d). Dashboard 7 bagian (v8.0) dan tema terang (v8.1, v8.2)
dicabut; ikon kaca bening & notifikasi v7.9 tetap. Riwayat versi tersebut tetap ada di git.

## Pembaruan v8.4 — periode tahun & tab sheet tahun berikutnya

- **Aplikasi:** baris **Tahun** kini membaca daftar tab tahun dari backend (`?action=tahun`), dengan
  cadangan pemeriksaan tab s.d. 5 tahun ke depan. **Admin & Approver** melihat tombol **"+ 2028"** (tahun
  setelah tab terakhir): ketuk → konfirmasi → tab `Checklist P3K 2028` dibuat di Google Sheets dan tahunnya
  langsung bisa dipilih. Batas: tahun berjalan + 5.
- **Backend (Code.gs v7.8):** aksi `tahun_baru` {token, tahun} khusus Admin & Approver. Format tab
  (kotak, PIC, isi, ketentuan stok) disalin dari tahun terakhir, kolom bulanan dikosongkan; tahun di
  antaranya ikut dibuat berurutan; dicatat di Log. `Config.gs`: `TAHUN_MAKS_DEPAN: 5`.
  Dari editor: `P3K_tambahTahunBerikutnya()`.
  **Wajib:** tempel `Code.gs` & `Config.gs` terbaru → Deploy → Manage deployments → Edit → New version.

## Pembaruan v8.5 — menu Periode tahun di Profil

- **Profil → Periode tahun data**: daftar semua tab tahun (mis. 2027, 2026) dengan status
  *Tahun berjalan · opname bisa diisi*, *Arsip · hanya baca*, atau *Tahun depan · disiapkan*, beserta nama tab sheet-nya.
  Ketuk tahun untuk memilih; pilihan berlaku untuk Beranda, Kotak, Riwayat, dan Dokumen.
- Saat melihat tahun lain, muncul tombol **Kembali ke tahun berjalan**.
- **Admin & Approver**: tombol **+ Tambah tahun berikutnya di Google Sheets** (memakai aksi `tahun_baru` yang sudah ada).
- Berkas yang diubah: `index.html`, `sw.js` (cache v35). Backend tidak berubah.

## Pembaruan v8.6 — opsi tahun berbentuk enum (dropdown)

- Baris **Tahun** di Beranda, Kotak, Riwayat, Dokumen, dan Profil kini berupa **dropdown** berisi
  daftar tahun beserta statusnya (mis. `2026 — Tahun berjalan`, `2027 — Tahun depan · disiapkan`, `2025 — Arsip · hanya baca`).
- Admin & Approver: opsi terakhir **+ Tambah tahun 2028 (buat tab sheet)** membuat tab tahun berikutnya.
- Berkas yang diubah: `index.html`, `sw.js` (cache v36).

## Pembaruan v8.7 — dropdown tahun ringkas

- Dropdown **Tahun** hanya berisi angka tahun (mis. `2027`, `2026`), tanpa teks status di samping.
- Tombol **+ Tambah tahun** (Admin & Approver) dipindah keluar dropdown, ada di Profil → Periode tahun data.
- Berkas yang diubah: `index.html`, `sw.js` (cache v37).

## Pembaruan v8.8 — nama aplikasi FASTER P3K

- Nama aplikasi menjadi **FASTER P3K** di layar login, judul tab, nama ikon di layar utama (manifest),
  notifikasi HP, halaman `pasang.html`, dan dokumen PDF.
- `id` manifest tidak diubah, jadi aplikasi yang sudah terpasang ikut diperbarui (tidak perlu pasang ulang;
  nama di bawah ikon bisa baru berganti setelah beberapa waktu atau setelah dipasang ulang).
- Backend (`Code.gs`) tidak perlu diubah.
- Berkas yang diubah: `index.html`, `manifest.webmanifest`, `pasang.html`, `pdfdoc.js`, `notif.js`, `config.js`, `sw.js` (cache v38).

## Pembaruan v8.9 — latar kaca transparan abu-abu

- Latar aplikasi: foto plant dengan lapisan gradasi **abu-abu** (terang di atas → gelap di bawah), termasuk layar login.
- Kartu, panel, status bar, navigasi bawah, dan dropdown menjadi **kaca abu-abu tembus pandang** (efek blur / frosted glass).
- Warna tema bilah status HP (`theme-color`) & layar pembuka (manifest) diubah ke abu-abu `#3a3f47`.
- Berkas yang diubah: `index.html`, `manifest.webmanifest`, `sw.js` (cache v39). Backend tidak berubah.

## Pembaruan v9.0 — latar abu-abu gelap

- Latar aplikasi & layar login: **abu-abu gelap** (`#25282d` → `#1a1c20`), foto plant hanya samar di belakang.
- Panel tetap berefek kaca, kini dengan nada abu-abu gelap; status bar & navigasi bawah lebih pekat.
- `theme-color` & warna layar pembuka (manifest): `#25282d`.
- Berkas yang diubah: `index.html`, `manifest.webmanifest`, `sw.js` (cache v40).

## Pembaruan v9.1 — latar abu-abu

- Latar aplikasi & layar login: **abu-abu** (`#60656d` → `#3e4248`), foto plant samar di belakang; panel tetap berefek kaca.
- Teks keterangan yang redup dibuat lebih terang agar tetap terbaca di latar abu-abu.
- `theme-color` & warna layar pembuka (manifest): `#4e5259`.
- Berkas yang diubah: `index.html`, `manifest.webmanifest`, `sw.js` (cache v41).

## Pembaruan v9.2 — tema terang Ice Blue

| Peran | Warna |
|---|---|
| Latar utama | `#F0F4F8` (Ice Blue Tint) |
| Kartu / permukaan | `#FFFFFF` |
| Teks utama | `#1E293B` · teks sekunder `#64748B` |
| Aksen | `#0284C7` (Sky Blue) |
| Garis / pembatas | `#E2E8F0` |

- Warna status disesuaikan agar kontras di latar terang: hijau `#059669`, kuning `#D97706`, merah `#E11D48`, emas `#B45309`.
- `theme-color` & layar pembuka: `#F0F4F8`; bilah status iPhone `default` (ikon gelap).
- Berkas yang diubah: `index.html`, `manifest.webmanifest`, `sw.js` (cache v42). Backend tidak berubah.

## Pembaruan v9.3 — aksen LightSlateGray

- Warna aksen diganti dari Sky Blue `#0284C7` ke **LightSlateGray `#778899`** (tombol, pilihan aktif, tautan, grafik).
- Warna lain tetap: latar `#F0F4F8`, kartu `#FFFFFF`, teks `#1E293B`, garis `#E2E8F0`.
- Berkas yang diubah: `index.html`, `sw.js` (cache v43).

## Pembaruan v9.4 — aksen MidnightBlue

- Warna aksen diganti ke **MidnightBlue `#191970`** (tombol, pilihan aktif, tautan, grafik).
- Warna lain tetap: latar `#F0F4F8`, kartu `#FFFFFF`, teks `#1E293B`, garis `#E2E8F0`.
- Berkas yang diubah: `index.html`, `sw.js` (cache v44).

## Pembaruan v9.5 — menu Tahun mengikuti database Google Sheets

- Pilihan **Tahun** kini diambil dari tab yang benar-benar ada di spreadsheet:
  `Checklist P3K 2026`, `Checklist P3K 2027`, `Checklist P3K 2028`, … (urut seperti di Google Sheets).
- Setiap tahun membaca tab dengan nama **persis** dari database (sebelumnya tahun 2026 mencari tab `Checklist P3K`).
- Sumber daftar: backend `?action=tahun` (nama tab asli). Bila backend tidak menjawab, aplikasi memeriksa tab
  `Checklist P3K <tahun>` langsung dan hanya menampilkan tab yang judulnya cocok "TAHUN yyyy".
- Tab tahun baru di Google Sheets otomatis muncul di menu (dicek saat dibuka & tiap 5 menit); daftar terakhir
  disimpan di perangkat sehingga menu langsung lengkap saat aplikasi dibuka.
- Berkas yang diubah: `index.html`, `config.js` (keterangan), `sw.js` (cache v45). Backend tidak perlu diubah.
