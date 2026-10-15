/* FirstAid SASU3B — konfigurasi database Google Sheets.
   Satu-satunya tempat mengganti spreadsheet atau backend.
   Setelah diubah: unggah ulang config.js saja (tidak perlu build ulang index.html). */
window.FA_CONFIG = {
  // ID spreadsheet dB_checklist P3K (bagian URL di antara /d/ dan /edit)
  SHEET_ID: "1P246a1UMf6wGyA7MGHOk5qw20Lzd-SF5eEHprfbUlYs",

  // URL Web App Apps Script (Deploy → Web app), diakhiri /exec
  API_URL: "https://script.google.com/macros/s/AKfycbyC2SG1UQbrPr4oX3LitG6yae2WOX7aMJtUef_j7bndvy1_Bx6q3eB7oaGj9tBQzqIY5A/exec",

  // Nama tab yang dibaca aplikasi
  SHEETS: {
    CHECKLIST: "Checklist P3K",
    USER: "User",
    LOG: "Log",                   // judul isi: Riwayat Penggunaan
    APPROVALS: "Approvals",
    PURCHASE: "Purchase",
    FOTO: "Foto Kotak"            // Timestamp | Kotak | Bulan | URL foto | NIK
  },

  // Multi-tahun: tab tahun pertama = SHEETS.CHECKLIST ("Checklist P3K", judul TAHUN 2026);
  // tahun berikutnya otomatis dibuat backend bernama "Checklist P3K 2027", "Checklist P3K 2028", …
  TAHUN_AWAL: 2026,
  // Opsional: nama tab khusus per tahun, mis. { 2027: "Checklist 2027" }. Kosongkan bila mengikuti pola.
  SHEET_TAHUN: {},

  // Zona waktu tampilan jam aplikasi. Jam diambil dari server Google Sheets (UTC),
  // lalu ditampilkan pada zona ini. WIB = UTC+7 = 420 menit.
  TZ_OFFSET_MIN: 420,
  TZ_LABEL: "WIB",

  // gid tab tertentu (dipakai bila nama tab tidak bisa dirujuk langsung)
  GID: {
    CHECKLIST: null,   // null = tab dirujuk lewat nama di SHEETS
    LOG: null
  }
};
