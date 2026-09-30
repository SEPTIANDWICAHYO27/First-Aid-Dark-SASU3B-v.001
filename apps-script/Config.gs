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
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbyC2SG1UQbrPr4oX3LitG6yae2WOX7aMJtUef_j7bndvy1_Bx6q3eB7oaGj9tBQzqIY5A/exec',

  // Nama tab
  SHEET_CHECKLIST: 'Checklist P3K',   // tahun awal; tahun berikutnya "Checklist P3K 2027", dst.
  SHEET_USER: 'User',                 // No | Username (NIK) | Password | Nama | Role
  SHEET_LOG: 'Log',                   // Timestamp | User | Action | Details
  SHEET_FOTO: 'Foto Kotak',           // Timestamp | Kotak | Bulan | URL foto | NIK

  // Folder Google Drive penyimpan foto kotak (dibuat otomatis bila belum ada)
  FOLDER_FOTO: 'Foto Kotak P3K',

  // Masa berlaku token login (jam)
  SESI_JAM: 8,

  // Trigger harian: jam berapa backend memastikan tab tahun berjalan / tahun depan tersedia
  JAM_TRIGGER: 1,
  // Mulai bulan ke berapa tab tahun berikutnya disiapkan (12 = Desember)
  BULAN_SIAPKAN_TAHUN_DEPAN: 12,

  VERSI: 'v7.4-2026-10'
};

var BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
