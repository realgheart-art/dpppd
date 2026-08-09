# Sistem Pemantauan Dialog Prestasi PPD — JPN Kedah
### Panduan Deploy (GitHub Pages + Google Apps Script + Google Sheets)

Sistem pemantauan Dialog Prestasi mingguan bagi 10 PPD Kedah — pelaksanaan, isu,
tindak susul, maklum balas, penyelarasan perkara luar kawalan KPPD, dan penjanaan laporan PDF (LAMPIRAN A).

---

## Seni bina

```
GitHub Pages (frontend PWA)  →  GAS Web App (JSON API)  →  Google Sheets (pangkalan data)
```

Frontend ada **dua mod**, dikawal di blok `CONFIG` (atas `<script>` dalam `index.html`):

```js
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/XXXX/exec",  // URL GAS
  DEMO_MODE: true,   // true = data terbenam (pratonton) · false = data sebenar dari GAS
};
```

- `DEMO_MODE: true` → jalan atas data dummy terbenam (tiada backend perlu — untuk pratonton).
- `DEMO_MODE: false` → login & semua baca/tulis melalui GAS ke Google Sheets sebenar.

---

## Fail dalam pakej

| Fail | Fungsi |
|---|---|
| `index.html` | Frontend penuh (single-file PWA) — login, borang, dashboard, penyelarasan, PDF. |
| `Code.gs` | Backend Google Apps Script (JSON API, login SHA-256, reminder emel). |
| `Dummy_Dialog_Prestasi_JPN_Kedah.xlsx` | Struktur & data contoh — asas untuk Google Sheets. |
| `manifest.json`, `sw.js`, `.nojekyll` | Sokongan PWA + elak isu build Jekyll di GitHub Pages. |

---

## LANGKAH 1 — Sediakan Google Sheets

1. Muat naik `Dummy_Dialog_Prestasi_JPN_Kedah.xlsx` ke Google Drive → **Buka dengan Google Sheets** → **File > Save as Google Sheets**.
2. Pastikan 8 tab wujud dengan nama tepat: `PPD`, `Kategori`, `Config`, `Users`, `Dialog`, `Isu`, `TindakSusul`, `MaklumBalas`. (Tab `README` & `Ringkasan_Pematuhan` boleh dibuang — hanya rujukan.)
3. **Tab `Users`** — tambah satu lajur **`PasswordHash`** dan isi hash SHA-256 bagi kata laluan setiap pengguna (lihat Langkah 2 untuk cara jana). Buang sebarang lajur kata laluan teks biasa.
4. **Tab `PPD` & `Users`** — kemaskini **emel sebenar** setiap PPD (untuk reminder automatik).
5. Salin **Spreadsheet ID** dari URL: `docs.google.com/spreadsheets/d/`**`ID_INI`**`/edit`.

---

## LANGKAH 2 — Pasang backend GAS

1. Dalam Google Sheets: **Extensions → Apps Script**.
2. Padam kod contoh, tampal keseluruhan `Code.gs`.
3. Isi baris atas: `const SS_ID = "ID_SPREADSHEET_ANDA";`
4. (Jana hash kata laluan) Tambah fungsi ini, jalankan sekali dengan kata laluan pilihan, salin output dari **View > Logs**, letak dalam lajur `PasswordHash`:
   ```js
   function janaHash(){ Logger.log(sha256("katalaluan_anda")); }
   ```
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Klik **Deploy**, benarkan kebenaran (authorize), salin **Web app URL** (berakhir `/exec`).

> **Kemaskini kod kemudian:** **Manage Deployments → Edit (pensel) → Version: New version → Deploy.**
> **JANGAN** buat "New deployment" — URL akan berubah dan frontend terputus.

---

## LANGKAH 3 — Sambung frontend ke GAS

Dalam `index.html`, edit blok `CONFIG`:

```js
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/XXXX/exec",  // ← tampal Web app URL
  DEMO_MODE: false,                                          // ← tukar ke false
};
```

Selepas ini: login mengesahkan pengguna melalui GAS, dan semua tindakan (hantar dialog,
kemaskini tindak susul, makluman, hantar ke Pengarah, maklum balas, panel admin)
menulis terus ke Google Sheets.

---

## LANGKAH 4 — Reminder emel automatik

Dalam Apps Script: **Triggers (jam) → Add Trigger**
- Function: `hantarPeringatanMingguan`
- Event source: **Time-driven** → **Week timer** → pilih hari (ikut `Config.HARI_TARIKH_AKHIR`, cth Khamis) → waktu pagi.

Reminder hanya dihantar kepada PPD yang **belum submit** minggu semasa (jika `Config.REMINDER_EMEL_AKTIF = Ya`).

---

## LANGKAH 5 — Hos di GitHub Pages

1. Buat repo (cth `dialog-prestasi-ppd`). Muat naik `index.html`, `manifest.json`, `sw.js`, `.nojekyll`.
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save.**
3. Tunggu ~1 minit; laman tersedia di `https://<username>.github.io/<repo>/`.
4. Bila kemaskini `sw.js`, naikkan versi cache (`dialog-prestasi-v1` → `v2`) supaya pengguna dapat versi terbaru.

---

## Peranan & log masuk

- **JPN Admin (S4PD)** — dashboard, status pematuhan, senarai isu, tindak susul, **Penyelarasan JPN**, maklum balas, panel admin.
- **PPD** — hantar laporan dialog (borang LAMPIRAN A), rekod & maklum balas, tindak susul, muat turun PDF.

Nama pengguna & peranan diurus dalam tab `Users`. (Dalam mod demo, chip log masuk pantas dipapar; ia auto-sembunyi bila `DEMO_MODE: false`.)

---

## Keperluan operasi yang dibina

1. **Diminitkan** — laporan LAMPIRAN A berstruktur sebagai minit rasmi.
2. **Setiap tindakan dimaklumkan kepada sektor/pegawai** — medan `StatusMakluman` (Belum/Telah); disahkan di Penyelarasan JPN / Senarai Isu.
3. **Perkara luar kawalan KPPD → penyelarasan JPN & Pengarah** — medan `KawalanKPPD`; dikumpulkan di Penyelarasan JPN, ditanda dalam nota PDF, dan laporan boleh ditanda **Dihantar kepada Pengarah** (PDF papar baris **s.k. Pengarah Pendidikan, JPN Kedah**).

---

## Uji selepas deploy (senarai semak)

- [ ] Login JPN Admin & PPD berjaya (kata laluan sebenar).
- [ ] PPD hantar borang → rekod muncul → PDF boleh dimuat turun.
- [ ] JPN nampak status pematuhan & senarai isu dikemaskini.
- [ ] Tanda makluman & tanda dihantar ke Pengarah tersimpan (semak Sheets).
- [ ] Panel admin: tambah/nyahaktif kategori & simpan tetapan berjaya.
- [ ] Reminder emel diuji (jalankan `hantarPeringatanMingguan` secara manual sekali).

---

## Endpoint API (rujukan)

**GET** `?action=...` → `init` (semua data), `bootstrap`, `dialog`, `isu`, `tindakSusul`, `maklumBalas`, `all`.
**POST** (body JSON, `Content-Type: text/plain`) `{action, payload}` →
`login`, `submitDialog`, `updateTindakSusul`, `markMakluman`, `markDihantarPengarah`,
`addFeedback`, `addKategori`, `toggleKategori`, `saveConfig`.

---

## Cadangan fasa seterusnya (bincang dulu)

- Peranan **Pengarah/Penyelaras JPN** berasingan (log masuk sendiri) untuk urus perkara luar kawalan KPPD.
- Eksport **PDF gabungan** semua PPD untuk mesyuarat pengurusan JPN.
- **Analitik trend** isu berulang merentasi minggu (early warning).
- Naik taraf **Supabase/PostgreSQL** bila volum data besar.
