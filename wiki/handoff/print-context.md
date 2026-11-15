# Handoff: APAR / P3K / Patrol Printable HTML Templates

Target reader: external model yang membangun 3 template cetak tanpa membaca repo.
Bahasa: campuran ID+EN. Kode: English. Template = pure function `payload → HTML string`.

## 1. Stack fact (Gotenberg 8 + Chromium, server-side)

- `POST /api/export/:category/:refId` → bangun HTML string → `renderPdf(html, {landscape})`
  → `POST {GOTENBERG_URL}/forms/chromium/convert/html` → PDF disimpan di Garage
  `pdf/<companyId>/<jobId>.pdf`, `GET /api/pdf-jobs/:id` beri `downloadUrl` (presigned 60 dtk).
- Konvensi template (`apps/api/src/pdf/templates.ts`, pola sudah terbukti di 6 fungsi):
  inline CSS saja (satu `<style>` di `<head>`, tanpa file/link eksternal);
  font Inter 400/700 di-embed sebagai `@font-face` data-URL WOFF2 dari
  `apps/api/src/pdf/fonts.ts` (`INTER_400_B64`, `INTER_700_B64`); SEMUA aset data-URL,
  tidak ada URL remote (Gotenberg `failOnResourceLoadingFailed=true`).
- Setiap HTML diakhiri `<div id="pdf-ready" data-status="ready"></div>`.
  `apps/api/src/pdf/render.ts`: `waitForSelector=#pdf-ready` +
  `waitForExpression=Array.from(document.images).every(i => i.complete)` +
  `waitDelay=150ms`. Foto `<img src>` boleh async; ekspresi di atas yang menunggu.
- Orientasi: portrait A4 MediaBox ≈ 595×842 pt (margin 12mm), landscape ≈ 842×595 pt
  (margin 10mm). Class util tersedia: `.num` (tabular-nums), `.grid`, `.chip.ok/.bad/.idle`,
  `.badge.layak/.tidak/.catatan`, `.photo`+`.fcap`, `.sign` (3 kolom
  Dibuat/Supervisor/Site Manager), `.page-break`, `.catatan-manual`. Pakai ulang, jangan bikin sistem baru.
- Style reference — fungsi terkecil, tiru polanya persis (helpers `shell/head/metaRow/signatures/chunkCells/esc` sudah ada):

```ts
export function patrolReport(data: PatrolReportData): string {
  const cells = data.findings
    .map(
      (f) => `<td>
  <div class="photo">${f.src ? `<img src="${esc(f.src)}" alt="Foto temuan">` : "FOTO TEMUAN<br>TIDAK TERSEDIA"}</div>
  <p class="fcap">${esc(f.caption)}<br><span class="date num">${esc(formatIndonesianDate(data.patrolDate))}</span></p>
</td>`,
    )
    .join("");
  const grid =
    data.findings.length === 0
      ? `<p class="empty">Tidak ada temuan pada laporan ini.</p>`
      : `<table class="fgrid">${chunkCells(cells, 2)}</table>`;
  return shell({
    title: `Laporan Safety Patrol ${data.patrolDate}`,
    body: `${head("LAPORAN KEGIATAN", "SAFETY PATROL", [
      metaRow("Lokasi", esc(data.siteName)),
      metaRow("Tanggal", `<span class="num">${esc(formatIndonesianDate(data.patrolDate))}</span>`),
    ])}
${grid}
${signatures()}
<p class="foot num">Dokumen dihasilkan sistem – ${esc(formatIndonesianDate(new Date()))} · ${data.findings.length} temuan foto</p>`,
  });
}
```

## 2. Data contracts (`apps/api/src/routes/exports.ts`, loader → interface di `templates.ts`)

Route: `POST /api/export/:category/:refId` (`category` enum:
`hydrant-monthly|hydrant-laporan|apar-monthly|apar-card|p3k-yearly|patrol-report`).
Monthly = refId hanya jangkar: ambil SATU inspeksi → kunci (siteId + period) → render
SEMUA inspeksi site+period itu, urut `sort_order, kode`. Card/yearly = refId jangkar
satu unit/box → render tahun penuh. Semua foto di-presign paralel
`presignedGet(s3Key, 60, "internal")`, `objectExists` dulu → `src: string|null`.
`notes`: kolom teks nullable, teruskan `string|null`, render `esc(notes ?? "–")`.

- **apar-monthly** (`loadAparMonthly`): anchor → `{period, siteId, siteName}`.
  Rows (per unit): `kode, zoneName, jenis|null, components{7: safetyPin, corong, segel,
  tekanan, tabung, selang, katupTuas ∈ BAIK|TIDAK_BAIK|NA}, overallStatus ∈
  LAYAK|LAYAK_DENGAN_CATATAN|TIDAK_LAYAK, notes|null`.
  `expiring[]`: 10 unit site urut `expiredDate` naik: `{kode, jenis|null, ukuran|null, expiredDate}`.
- **apar-card** (`loadAparCard`): anchor satu inspeksi → unit+tahun (`tahun` kolom atau tahun period).
  `months[12]`: `{7 komponen + overallStatus}`, slot kosong = `{overallStatus:""}` (render `·`).
  Header: `kode, siteName, zoneName, tahun, jenis|null, ukuran|null, expiredDate`.
- **p3k-yearly** (`loadP3kYearly`): anchor → `(boxId, period)` → tahun = 4 digit period.
  Semua inspeksi box itu difilter tahun tsb; item dari `p3k_inspection_items`
  `{itemName, standardQty, status ∈ STANDAR|DIBAWAH_STANDAR|KADALUARSA}` dipetakan ke
  slot bulan (12, null bila kosong). `items[]` HANYA item yang ada datanya
  (`STANDARD_P3K_ITEMS` di `packages/shared/src/p3kCatalog.ts` = 21 item baku
  Permenkes 48/2016 beserta `standardQty` default). `inspectionDate` = period jangkar
  (`YYYY-MM-DD`), blank bila null.
- **patrol-report** (`loadPatrolReport`): anchor → `{patrolDate, siteName}`.
  `findings[]` dari `safety_patrol_findings` urut `createdAt`: `{src: presigned-internal|null,
  caption (= description)}`. Foto disimpan `foto/<companyId>/<findingId>.<ext>` + sha256.
- Referensi pola foto: monthly hydrant memisah `photos.temuan=false` (kolom bukti per baris)
  vs `temuan=true` (Section B saja). Untuk APAR/P3K/Patrol tidak ada pemisah ini —
  semua foto temuan tampil.

## 3. Baseline kini → target kertas (`spec/06-print.md`)

- `hydrant-monthly` (portrait): tabel checklist + foto per baris + Section B temuan + tanda tangan. DONE.
- `hydrant-laporan` (landscape): grid 6 komponen (✓/X/−), tanggal singkat `18-Sep-26`, petugas `Pengawas K3`. DONE.
- Keduanya adalah referensi visual: kop banner data-URL, judul tengah, meta Periode/Tanggal.
- `apar-monthly` kini: tabel 7 komponen (chip ✓/✗/•) + badge status + catatan; p.2 expiry + blok `Catatan :`
  bergaris + signatures (`.page-break` eksplisit). Target kertas: 2 halaman, tabel komponen p.1,
  expiry + Catatan + signatures p.2. Pertahankan struktur halaman ini; rapikan agar mirip kertas.
- `apar-card` kini: kartu tahunan 12-bulan (✓/✗/–) + signatures. Target: kartu tahunan portrait per unit.
  Pertahankan; samakan kop/gaya dengan kertas bila scan tersedia.
- `p3k-yearly` kini (landscape): grid 21×12 (✓ standar / ✗ di bawah / K kedaluwarsa) + baris
  `TANGGAL INSPEKSI` + `PARAF PETUGAS` + footnote legenda. Target: landscape + TANGGAL/PARAF.
  Struktur sudah benar; poleshi grid/kop.
- `patrol-report` kini: header + grid foto 2 kolom + caption + signatures. Target: portrait header + grid.
  Struktur sudah benar; poleshi.
- Scan kertas APAR/P3K/Patrol BELUM dipasok owner (baru Hydrant, Nov 2026) — kerjakan dari
  template kini + aturan spec di atas.

## 4. Constraints (jangan dilanggar)

- Label Indonesia (K3), angka/tanggal class `.num` (tabular-nums), `esc()` semua string pengguna.
- Nol URL eksternal: font HANYA dari `fonts.ts`, logo HANYA data-URL (contoh `logos.ts` hydrant).
- Foto HANYA via string presigned `src` dari payload (jangan fetch/db di template — fungsi pure).
- Jangan ubah nama kategori export / route shape: gate
  `docker compose … exec -T -e CHECK_BASE=http://caddy:80 api bun run src/check.ts` (72/72) bergantung padanya.
- Margins 12mm portrait / 10mm landscape, `print-color-adjust: exact`, A4 via `@page` + flags render.

## 5. Deliverable

Untuk tiap kategori (APAR monthly+card, P3K yearly, Patrol report): SATU pure function
`(payload-ts → HTML string)` gaya `patrolReport` di atas, ditaruh di `templates.ts`
memakai `shell/head/metaRow/signatures/chip/overallBadge/chunkCells/esc` yang ada.
Payload TS = interface `*Data` yang sudah ada (jangan ubah shape tanpa alasan).
Output: HTML lengkap siap `renderPdf` (berakhir `#pdf-ready`), lolos build `bun run build`.
