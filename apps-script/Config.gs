/**
 * FirstAid SASU3B — KONFIGURASI BACKEND (Config.gs)
 * Satu-satunya tempat mengubah pengaturan backend. Code.gs tidak perlu disentuh.
 * Setelah mengubah berkas ini: Deploy → Manage deployments → edit → Version: New version → Deploy.
 */
var P3K = {
  // Spreadsheet dB_checklist P3K. Kosongkan ('') bila skrip terikat langsung ke spreadsheet
  // (Extensions → Apps Script); isi ID bila skrip berdiri sendiri.
  SPREADSHEET_ID: '1P246a1UMf6wGyA7MGHOk5qw20Lzd-SF5eEHprfbUlYs',

  // URL Web App deployment aktif (sama dengan API_URL di config.js aplikasi) — sebagai catatan & uji.
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbziSDmsMJ9PoJNM_r-LTE9Qk3JOaKyj5Ud6dEuifFmNKXLObs1tVPNxztzvZJ5t00xP0Q/exec',

  // Nama tab
  SHEET_CHECKLIST: 'Checklist P3K',   // tahun awal; tahun berikutnya "Checklist P3K 2027", dst.
  SHEET_USER: 'User',                 // No | Username (NIK) | Password | Nama | Role
  SHEET_LOG: 'Log',                   // Timestamp | User | Action | Details
  SHEET_FOTO: 'Foto Kotak',           // Timestamp | Kotak | Bulan | URL foto | NIK
  SHEET_APPROVAL: 'Approvals',        // pengajuan update stok untuk ditinjau Admin & Approver
  // Tab pengajuan PERMINTAAN STOK (dari Daftar belanja). Dicari lewat gid lebih dulu, lalu lewat nama.
  // gid = angka setelah "#gid=" di URL tab tersebut. 0 = pakai nama tab di bawah (dibuat otomatis).
  // Catatan: gid 1115197996 ternyata tab "Checklist P3K", jadi tidak dipakai.
  GID_PERMINTAAN: 0,
  SHEET_PERMINTAAN: 'Permintaan',

  // Folder Google Drive penyimpan foto kotak (dibuat otomatis bila belum ada)
  FOLDER_FOTO: 'Foto Kotak P3K',

  // Masa berlaku token login (jam)
  SESI_JAM: 8,

  // Trigger harian: jam berapa backend memastikan tab tahun berjalan / tahun depan tersedia
  JAM_TRIGGER: 1,
  // Mulai bulan ke berapa tab tahun berikutnya disiapkan (12 = Desember)
  BULAN_SIAPKAN_TAHUN_DEPAN: 12,

  // Tombol "+ tahun" di aplikasi (Admin & Approver) boleh membuat tab s.d. tahun berjalan + nilai ini
  TAHUN_MAKS_DEPAN: 5,

  // Peran yang boleh meninjau pengajuan (kolom Role tab User, tidak peka huruf besar/kecil)
  PERAN_APPROVER: ['Admin', 'Approver'],

  VERSI: 'v7.8-2026-10'
};

var BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
