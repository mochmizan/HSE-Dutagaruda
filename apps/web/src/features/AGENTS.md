# Domain Feature Modules DOX — `src/features`

## Purpose

Domain-specific, self-contained feature slices for the HSE Inspection Platform: auth, location context, Calendar view, KPI overview squares, Inspection reports list and modals, and Navigation sidebar.

## Ownership

- `auth/`: `LoginScreen.tsx` (email+sandi, Notion-Kit, Indonesian K3 labels), `sesi.ts` (`useSesi`/`useMasuk`/`useKeluar` against Better Auth `/api/auth/*`; sign-in sets active organization). App.tsx guards: session pending → spinner, null → LoginScreen.
- `konteksLokasi.tsx`: `PenyediaLokasi` + `useKonteksLokasi` — active site (selected via `pilihLokasi`, default first by createdAt), company name, address, zone lists, zone name↔id lookups, full `daftarLokasi` for the sidebar. Replaces the deleted `CURRENT_SITE` mock.
- `calendar/`: `HseCalendar.tsx` (compact month grid, category chips, day selection, Indonesian date formatting). Dashboard shows calendar + `Detail Lokasi Aktif` panel (zones, hydrant/APAR units, P3K boxes of the active site); the old 4 KPI squares (`kpi/` deleted) are gone.
- `reports/`: `MonthlyReportsPanel.tsx`, `ReportDetailModal.tsx` (inspection list with loading state, inspection details). `NewReportModal` deleted (creation happens inside each inspection page).
- `navigation/`: `HseSidebar.tsx` (Notion-style collapsible sidebar, real site meta + user name from session, logout button in footer). No direct category buttons: a `LOKASI` section (with `+` add row) lists every site; each row expands to the 4 categories and switches the active site on selection; double-click the site name to rename inline (no popup); create/rename write to `/api/sites` via `useBuatLokasi`/`useUbahLokasi`. Category rows carry count badges per site (hydrant/APAR units, P3K boxes; shown only when >0, patrol has none).
- `hydrant/`: `HydrantPage.tsx`, `HydrantInspectionModal.tsx`, `AddZoneHydrantModal.tsx`, `AddFindingModal.tsx` — **UI IS DONE / COMPLETE**. Includes interactive month switcher, print-ready table with view toggle, left-justified 6-component checklist chips, centered table cells, composable zone & non-sequential hydrant unit registration, PRD §2.2 Story C1 & §3.3 auto-status calculation, Section B photo findings, and A4 print layout.
- `apar/`: `AparPage.tsx`, `AparYearCard.tsx`, `AparInspectionModal.tsx`, `AddZoneAparModal.tsx`, `AparBadges.tsx` — **UI DONE (Epic D)**. Halaman laporan inspeksi APAR: pengalih bulan, kartu statistik, tabel/kartu hasil 7 komponen, kartu tahunan 12 bulan, rekap kedaluwarsa, cetak laporan/kartu, pendaftaran zona & unit komposabel via modal. **Sinkronisasi satu arah (modal → tabel + kartu)**: `aparUnits` + `aparCards` diangkat ke `App.tsx` sebagai satu sumber data; kartu tahunan hanya-tampil (tanpa suntingan sel; baris bulan laporan hanya ditandai, merah + tindak lanjut teks saat `X`); klik baris tabel membuka modal inspeksi 7 komponen yang menulis draf + sel kartu bulan laporan sekaligus (`writeDraftToCard`, tampilan gabungan draf-menang via `resolveReportCell`); “Selesaikan & Terbitkan” membuka `ReportDetailModal` (rekam hasil: badge, metadata, Verifikasi 7 Komponen, Catatan, Bukti Foto, tombol Edit membuka ulang modal inspeksi). Kategori selalu menampilkan satu kartu tahunan (default APAR 01; cip yang sama tidak pernah menutup kartu); urutan tampilan: **tabel Checklist Bulanan APAR (judul layar + cetak) → rekap kedaluwarsa → “Catatan :” (judul saja, diisi tulis tangan) + tanda tangan → cip Pilih APAR → kartu tahunan**; cetak 2 halaman (hal. 1 = tabel bulanan, hal. 2 = kedaluwarsa + Catatan + tanda tangan via `print:break-before-page` pada bagian kedaluwarsa); tabel/badges membaca tampilan gabungan (draf menang atas laporan tersimpan); dokumentasi foto berada di dalam modal inspeksi; rekap kedaluwarsa + tanda tangan gaya dokumen kertas (judul “Kadaluwarsa APAR” rata kiri, sel tengah bingkai hitam saat cetak, No. APAR format “1, 14, dan 15” via `formatNoList`, blok “Catatan :” tanpa isi/teks statis dengan area kosong tulis tangan saat cetak, tanda tangan 3 kolom ketik dengan garis bawah); tombol “Tambah APAR” tanpa plus (`#f2994a` solid + modal); tombol “Cetak Kartu” di samping judul baris “Pilih APAR” (nonaktif bila kartu belum terbuka), “Cetak Laporan” tetap di bilah atas; baris terbit (SELESAI) bertinta hijau + badge kelayakan gaya Hydrant (klik baris membuka modal inspeksi); entri sidebar “Peringatan Kadaluarsa APAR” dihapus — hitungan kedaluwarsa ≤90 hari tampil sebagai badge oranye pada “Inspeksi APAR” (`aparOpenCount` dari `App.tsx`).
- `p3k/`: `P3kPage.tsx`, `P3kInspectionModal.tsx`, `types.ts` — **UI DONE (Epic E)**. Yearly grid only, like the paper form: 21 standard items × 12 months (one mark column per month: √ / × / KD red flags), TANGGAL INSPEKSI + PARAF rows, Catatan footnote, year switcher, editable Unit/Lokasi Kerja. Box is keyed by site name (one box per site). Empty start; month header click opens the input form (21 actual quantities + KD flags + tanggal/paraf, Esc/backdrop close, clear-month action). Print forces A4 landscape via injected `@page`. Accent `#27ae60`. Registered as `p3k` view in `App.tsx` + sidebar + KPI square.
- `patrol/`: `PatrolPage.tsx`, `AddPatrolFindingModal.tsx`, `types.ts` — **UI DONE (Epic F)**. Single photo feed, newest first, reuses the Hydrant Section B card grid (2-col, 4/5 photo, caption + date, hover-delete, print-clean). Paper header (LAPORAN KEGIATAN SAFETY PATROL + editable lokasi + latest date). Add form requires photo + caption, date defaults to today. Seeded with 8 captions from the paper form (19 Jun 2026, grey placeholders). Accent `#2f80ed`. Registered as `patrol` view in `App.tsx` + sidebar + KPI square.
- Inspection records and database models operate on a **per month change** cycle (`period: YYYY-MM`), with month-by-month state transitions.

## Local Contracts

- Indonesian language only for all user-facing labels, table headers, and badges.
- All date displays must use Indonesian locale (`d MMMM yyyy`).
- All numeric counters and date numbers must use `tabular-nums` class.
- Interactive cards and buttons must use `pressable` or `pressable-subtle` classes for Emil Kowalski tactile feedback.
- Data comes from `@/services/api/queries` hooks; pages hold no mock state. Hydrant/APAR pages map API rows via `petakanUnitHidran`/`petakanUnitApar`/`petakanKartuApar`; P3K grid via `features/p3k/petaApi.ts`; patrol feed via `petakanTemuanPatroli`.
- Every page shows only the active location: Hydrant/APAR filter units + inspections by `lokasi.siteId`, P3K picks the box with matching `siteId`, patrol filters reports by `siteId` (dashboard feed + KPI stay global). Sites are per-company rows (`companyId` on `sites`), so each location's data is isolated in the DB.
- Reports are final on save: no approval bar anywhere. Modals save via
  `useSimpanInspeksi*` on every submit and `ReportDetailModal` shows Edit for
  API-sourced reports (ids not starting with `rep-`); `FileFotoButton`
  has no approval-disable prop (only `nonaktif` for unit-specific slots).
- Photo uploads in inspection modals are real: `useUnggahFoto`/
  `useHapusFoto` against `/api/uploads` + `/api/photos/:id` (Hydrant: one
  “Bukti inspeksi” slot; APAR: Kartu/Penimbangan CO2/Pengecekan slots keyed
  by caption). Session photo lists live in page state (`fotoHidran`,
  `fotoApar`) because the API has no list-photos endpoint. Patrol findings
  stay placeholders (bare `s3Key`, no photo rows). Month-record deletion
  (“Hapus” on Hydrant & APAR, “Hapus Bulan Ini” on P3K) mirrors the P3K flow:
  confirm step (`ConfirmModal`) →
  `useHapusInspeksiHidran`/`useHapusInspeksiApar` clean the record's child
  photos first (API answers 409 while photos remain), then delete the
  record and invalidate inspections + umpan.
- “Unduh PDF” (`UnduhPdfButton`) on Hydrant/APAR/P3K/Patrol calls
  `POST /api/export/:category/:refId` → `GET /api/pdf-jobs/:id` and opens
  the presigned download URL. Browser “Cetak” stays as the draft path.
  Presigned URLs only resolve inside the Docker network (see services DOX).
- Hydrant Table Alignment: "Verifikasi 6 Komponen" must be left-justified (`justify-start`), while all other table cells are centered (`text-center`, `align-middle`).
- Category chip colors must conform to PRD §2.2 Story G1:
  - Hydrant: Red (`#eb5757`)
  - APAR: Orange (`#f2994a`)
  - P3K: Green (`#27ae60`)
  - Safety Patrol: Blue (`#2f80ed`)

## Work Guidance

- Keep UI logic decoupled from low-level network calls.
- Every feature folder must provide a clean `index.ts` barrel.
- Modals must support keyboard escape (`Esc`) and backdrop dismissal.
- Page edits update the matching `wiki/features/*.md` map file in the same
  task (labels, entry points, gotchas) and prove via `wiki/SKILL.md`.

## Verification

- `cd apps/web && bun run build` (root: `bun run --filter @viaannn/web build` equivalent; package name is `preview`)
- Login round-trip: dev server 5173 (Vite proxy → Caddy 8080) with seeded user `pengawas@contoh.id`.
- Approval lifecycle + photo upload + PDF export proven via the klien.ts
  request paths (worker I, Oct 13); no desktop browser is attached to the
  runner, so UI-click evidence is the request sequence the components issue.

## Child DOX Index

*Leaf boundary. Direct children are component files; no nested DOX required.*
