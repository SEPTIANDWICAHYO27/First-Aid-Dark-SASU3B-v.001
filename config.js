/* FirstAid SASU3B — konfigurasi database Google Sheets.
   Satu-satunya tempat mengganti spreadsheet atau backend.
   Setelah diubah: unggah ulang config.js saja (tidak perlu build ulang index.html). */
window.FA_CONFIG = {
  // ID spreadsheet dB_checklist P3K (bagian URL di antara /d/ dan /edit)
  SHEET_ID: "1P246a1UMf6wGyA7MGHOk5qw20Lzd-SF5eEHprfbUlYs",

  // URL Web App Apps Script (Deploy → Web app), diakhiri /exec
  API_URL: "https://script.google.com/macros/s/AKfycbziSDmsMJ9PoJNM_r-LTE9Qk3JOaKyj5Ud6dEuifFmNKXLObs1tVPNxztzvZJ5t00xP0Q/exec",

  // Nama tab yang dibaca aplikasi
  SHEETS: {
    CHECKLIST: "Checklist P3K",
    USER: "User",
    LOG: "Log",                   // judul isi: Riwayat Penggunaan
    APPROVALS: "Approvals",
    PURCHASE: "Purchase",
    FOTO: "Foto Kotak"
  },

  // gid tab tertentu (dipakai bila nama tab tidak bisa dirujuk langsung)
  GID: {
    CHECKLIST: null,   // null = tab dirujuk lewat nama di SHEETS
    LOG: null
  }
};
