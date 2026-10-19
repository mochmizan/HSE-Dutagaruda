# Domain Feature Modules DOX — `src/features`

## Purpose

Domain-specific, self-contained feature slices for the HSE Inspection Platform: auth, location context, Calendar view, KPI overview squares, Inspection reports list and modals, and Navigation sidebar.

## Ownership

- `auth/`: `LoginScreen.tsx` (email+sandi, Notion-Kit, Indonesian K3 labels), `sesi.ts` (`useSesi`/`useMasuk`/`useKeluar` against Better Auth `/api/auth/*`; sign-in sets active organization). App.tsx guards: session pending → spinner, null → LoginScreen.
- `konteksLokasi.tsx`: `PenyediaLokasi` + `useKonteksLokasi` — active site (selected via `pilihLokasi`, default first by createdAt), company name, active project name (`namaProyek` = full nama organisasi aktif dari sesi), address, zone lists, zone name↔id lookups, full `daftarLokasi` for the sidebar. Replaces the deleted `CURRENT_SITE` mock.
- `calendar/`: `HseCalendar.tsx` (compact month grid, category chips, day selection, Indonesian date formatting). Dashboard shows calendar + `Detail Lokasi Aktif` panel (zones, hydrant/APAR units, P3K boxes of the active site); the old 4 KPI squares (`kpi/` deleted) are gone.
- `reports/`: `MonthlyReportsPanel.tsx`, `ReportDetailModal.tsx` (inspection list with loading state, inspection details). `NewReportModal` deleted (creation happens inside each inspection page).
- `navigation/`: `HseSidebar.tsx` (Notion-style collapsible sidebar, user name from session, logout button in footer). Header shows the full project name and opens an inline project switcher (`useDaftarProyek`/`usePindahProyek` against `/auth/organization/*` + `/api/projects`; add/rename/delete projects; each project owns fully separate locations). No direct category buttons: a `LOKASI` section (with `+` add row) lists every site; each row expands to the 4 categories and switches the active site on selection; rename/delete via right-click context menu (double-click rename removed); inline add via text box (no popup). Category rows carry count badges per site (hydrant/APAR units, P3K boxes; shown only when >0, patrol has none).
  - Bagian sidebar dipisah ke `SidebarProyek.tsx`, `SidebarLokasi.tsx`, `SidebarFilter.tsx`, `SidebarNavigasi.tsx`, `SidebarPengguna.tsx`, `MenuKonteks.tsx`, `TombolPerluas.tsx`, plus `aksiSidebar.ts` (factory aksi tulis murni, tanpa hook) dan `sidebarTypes.ts`. **Semua hook tetap di `HseSidebar`** dengan urutan asli. `TombolPerluas` dipakai 5 tempat (App, Hydrant, APAR, P3K, Patroli) dan diekspor ulang lewat `@/features/navigation`, jadi impor lama tetap sah.
- `pageChrome/`: komponen kepala halaman bersama. `PageHeader.tsx` (remah roti, ikon+judul, `Bulan Ini` → pengalih bulan → tombol tambah → `Unduh PDF` → `Cetak`), `FilterBar.tsx` (tab status + saringan zona + cari + pengalih tabel/kartu), `KartuStatistik.tsx` (satu kartu ringkas: netral/aksen/hijau/amber, dengan slot `isi` untuk bilah progres). **Hydrant dan APAR wajib memakai ini**; `HydrantToolbar`, `AparHeader`, `AparStats`, dan `AparFilterBar` sudah dihapus. Urutan aksi, teks tombol (`Tambah Zona & Unit`, `Unduh PDF`, `Cetak`), label tab (`Sedang Berjalan (On Progress)`), dan warna lencana per tab tidak boleh menyimpang lagi antar halaman — itulah drift yang membuat APAR berbeda dari Hydrant.
- `hydrant/`: `HydrantPage.tsx` (orkestrasi state + modal), `HydrantTable.tsx` (Section A, 7 kolom), `HydrantCards.tsx` (tampilan kartu), `HydrantFindings.tsx` (Section B), `HydrantInspectionModal.tsx`, `AddZoneHydrantModal.tsx`, `AddFindingModal.tsx` — **UI IS DONE / COMPLETE**. Includes interactive month switcher (`Bulan Ini` button sits to its LEFT, only shown off current month), print-ready table with view toggle, left-justified 6-component checklist chips, centered table cells, composable zone & non-sequential hydrant unit registration, PRD §2.2 Story C1 & §3.3 auto-status calculation, Section B photo findings, and A4 print layout. `Simpan Sebagai Draft` button removed (save happens only via publish); component selects display `STANDAR` / `TIDAK STANDAR` / `HILANG` while storing `LAYAK` / `TIDAK_LAYAK` / `HILANG`.
  - Modal dipecah: `HydrantInspectionShell.tsx` (backdrop + panel + `<form>`), `HydrantInspectionHeader.tsx`, `HydrantInspectionBody.tsx` (komposisi empat bagian), `HydrantInspectionPhotos.tsx`, `HydrantComponentChecklist.tsx`, `HydrantInspectionOutcome.tsx`, `HydrantInspectionFooter.tsx` (+ `HydrantDeleteConfirmation`), tipe di `HydrantInspectionModal.types.ts`, dan helper murni `catatanHidran.ts` / `drafHidran.ts` / `komponenHidran.ts` / `penangananHidran.ts`. **Semua 15 `useState` + 4 `useEffect` tetap di `HydrantInspectionModal`** dengan urutan asli; anak-anaknya presentasional tanpa hook. Esc + `body.overflow` ditangani di modal, bukan di shell.
  - `HydrantTable.tsx` also exports the shared derivations `detailKomponen`, `unitTidakLayak`, and `tanggalTampil`; `HydrantCards.tsx` consumes them so table and card views cannot disagree about a unit's status. Do not re-derive those inline.
- `apar/`: `AparPage.tsx` (orkestrasi state + modal), `AparTable.tsx` (Section A, 8 kolom + `daysToExpiry`/`getEffectiveDetails`), `AparCards.tsx` (tampilan kartu + `Buka Kartu`), `AparYearCard.tsx`, `AparInspectionModal.tsx`, `AddZoneAparModal.tsx`, `AparBadges.tsx` — **UI DONE (Epic D)**.
  - Modal dipecah: `AparInspectionShell.tsx`, `AparInspectionHeader.tsx`, `AparInspectionPhotos.tsx`, `AparComponentChecklist.tsx`, `AparInspectionOutcome.tsx`, `AparInspectionFooter.tsx` (+ `AparDeleteConfirm`), tipe di `AparInspectionTypes.ts`, helper murni di `AparInspectionFields.ts`. Sama seperti Hydrant: **semua hook tetap di `AparInspectionModal`** dengan urutan asli, anak-anaknya presentasional.
  - Combobox zona/unit kedua modal (Hydrant + APAR) memakai `@/components/ui/UnifiedCombobox` (prop `accent` + `tabularNums`); jangan menghidupkan kembali salinan inline. Halaman laporan inspeksi APAR: pengalih bulan, kartu statistik, tabel/kartu hasil 7 komponen, kartu tahunan 12 bulan, rekap kedaluwarsa, cetak laporan/kartu, pendaftaran zona & unit komposabel via modal. **Sinkronisasi satu arah (modal → tabel + kartu)**: `aparUnits` + `aparCards` diangkat ke `App.tsx` sebagai satu sumber data; kartu tahunan hanya-tampil (tanpa suntingan sel; baris bulan laporan hanya ditandai, merah + tindak lanjut teks saat `X`); klik baris tabel membuka modal inspeksi 7 komponen yang menulis draf + sel kartu bulan laporan sekaligus (`petakanKartuApar` + `resolveReportCell` dari `lib/aparSync.ts`, tampilan gabungan draf-menang); “Terbitkan” membuka `ReportDetailModal` (rekam hasil: badge, metadata, Verifikasi 7 Komponen, Catatan, Bukti Foto, tombol Edit membuka ulang modal inspeksi). Kategori selalu menampilkan satu kartu tahunan (default APAR 01; cip yang sama tidak pernah menutup kartu); urutan tampilan: **tabel Checklist Bulanan APAR (judul layar + cetak) → rekap kedaluwarsa → “Catatan :” (judul saja, diisi tulis tangan) + tanda tangan → cip Pilih APAR → kartu tahunan**; cetak 2 halaman (hal. 1 = tabel bulanan, hal. 2 = kedaluwarsa + Catatan + tanda tangan via `print:break-before-page` pada bagian kedaluwarsa); tabel/badges membaca tampilan gabungan (draf menang atas laporan tersimpan); dokumentasi foto berada di dalam modal inspeksi; rekap kedaluwarsa + tanda tangan gaya dokumen kertas (judul “Kadaluwarsa APAR” rata kiri, sel tengah bingkai hitam saat cetak, No. APAR format “1, 14, dan 15” via `formatNoList`, blok “Catatan :” tanpa isi/teks statis dengan area kosong tulis tangan saat cetak, tanda tangan 3 kolom ketik dengan garis bawah); tombol “Tambah APAR” tanpa plus (`#f2994a` solid + modal); tombol “Cetak Kartu” di samping judul baris “Pilih APAR” (nonaktif bila kartu belum terbuka), “Cetak Laporan” tetap di bilah atas; baris terbit (SELESAI) bertinta hijau + badge kelayakan gaya Hydrant (klik baris membuka modal inspeksi); entri sidebar “Peringatan Kadaluarsa APAR” dihapus — hitungan kedaluwarsa ≤90 hari tampil sebagai badge oranye pada “Inspeksi APAR” (`aparOpenCount` dari `App.tsx`).
- `p3k/`: `P3kPage.tsx`, `P3kInspectionModal.tsx`, `types.ts` — **UI DONE (Epic E)**. Halaman dipecah: `P3kHeader.tsx` (judul + pengalih tahun + Unduh PDF/Cetak), `P3kKepala.tsx` (kop kertas), `P3kStatistik.tsx` (3 kartu ringkas), `P3kTabel.tsx` (grid 21 × 12 + TANGGAL INSPEKSI/PARAF + KETERANGAN). Semua query/mutation hook tetap di `P3kPage`. Yearly grid only, like the paper form: 21 standard items × 12 months (one mark column per month: √ / × / KD red flags), TANGGAL INSPEKSI + PARAF rows, Catatan footnote, year switcher, editable Unit/Lokasi Kerja. Box is keyed by site name (one box per site). Empty start; month header click opens the input form (21 actual quantities + KD flags + tanggal/paraf, Esc/backdrop close, clear-month action). Print forces A4 landscape via injected `@page`. Accent `#27ae60`. Registered as `p3k` view in `App.tsx` + sidebar + KPI square.
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
  Hydrant rows additionally persist `approvalStatus` (see the published-state
  contract below) — a read-only flag on the row, not an approval workflow.
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
- Hydrant Table Alignment: "Verifikasi 6 Komponen" must be left-justified (`justify-start`), while all other table cells are centered (`text-center`, `align-middle`). Column budget: `Lokasi & Zona` is narrow (`min-w-[120px]` — real zone names are short) and the freed width goes to `Verifikasi 6 Komponen` (`min-w-[354px]`), so the six chips wrap in two rows instead of three. Do not re-widen the location column without re-checking the chip rows.
- Category chip colors must conform to PRD §2.2 Story G1:
  - Hydrant: Red (`#eb5757`)
  - APAR: Orange (`#f2994a`)
  - P3K: Green (`#27ae60`)
  - Safety Patrol: Blue (`#2f80ed`)
- All 4 inspection modals close on backdrop click (target === currentTarget) and `Esc`; the APAR inner panel uses `stopPropagation` against its root-level `onClick={onClose}`.
- Action buttons use blue `#2f80ed` across ALL 4 category pages (not the page accent): add buttons (`Tambah Zona & Unit`, `Tambah APAR`, `Tambah Temuan`, patrol `Tambah Foto`), modal primary `Terbitkan`, hydrant empty-state CTAs (`+ Tambah Unit Baru`, `Tampilkan Semua Unit`), card `Mulai Inspeksi`/`Lanjutkan`, month-switcher select + chevron text. Hydrant and APAR both render the action row through `features/pageChrome/PageHeader`, so the Hydrant wording wins: the add button reads `Tambah Zona & Unit` on both pages (APAR's old `Tambah APAR` is gone), and the print button reads `Cetak` on both (APAR's old `Cetak Laporan` is gone). Filter tabs use thin white pills on the active tab (`bg-white text-[var(--primary)]` + shadow, all three tabs identical, with `dark:bg-[var(--bg-hover)]` so the pill stays visible in dark mode); `Semua Unit` (red) and `Selesai Diperiksa` (green) keep their colors. Tab count badges keep their per-tab colors whether the tab is active or not (Sedang Berjalan amber-500/15, Selesai emerald-500/15; Semua Unit neutral) — never turn white/neutral on active. Modals have no `Batal` (X and Esc close instead); `Hapus` sits next to `Terbitkan`.
- Table/Kartu view toggles come from the shared `ViewToggle` (`ui/Switchers.tsx`,
  re-exported via `components/ui`): segmented control matching the filter-tab
  language — white active pill with `dark:bg-[var(--bg-hover)]` for dark mode,
  `pressable`, `aria-pressed`, icon + `hidden sm:inline` label. Hydrant and APAR
  both consume it; do not reintroduce inline toggle copies (removed Okt 17).
  `ViewMode` (`'TABLE' | 'CARDS'`) is also exported there.
- Hydrant modal published state is a property of the persisted row, not local
  modal state: `hydrant_inspections.approval_status` (`DRAFT | DIAJUKAN |
  DIKETAHUI | DISETUJUI`, DB default `DRAFT`), and a row is read-only when
  `approvalStatus !== 'DRAFT'`. The modal's `terbit` flag has exactly ONE
  writer — the effect on `[isOpen, inspeksi?.id, inspeksi?.approvalStatus]` —
  so it is a mirror of the row and the screen can never claim a state the record
  does not have: a failed publish leaves no phantom `Terbit` portrait, a failed
  `Edit` leaves no editable form over a published row. Both transitions are
  awaited writes; while one is in flight the button reads `Menerbitkan…` /
  `Membatalkan…` and is disabled, and the portrait does not change. Read-only =
  disabled fieldset, photo upload/delete hidden, `Terbit` header badge; the
  primary button becomes `Edit`, which is batalkan terbit: `useBatalkanTerbitHidran`
  PATCHes one field (`approvalStatus: 'DRAFT'`) for the id the portrait shows
  (a single field so a stale cache cannot overwrite other columns) and writes
  the returned row into the query cache. The row then leaves "Selesai Diperiksa"
  — `petakanUnitHidran` (in `services/api/queries.ts`) maps `DRAFT` to
  `SEDANG_BERJALAN` (On Progress tab, card button `Lanjutkan`) and anything else
  to `SELESAI` — until it is published again with the same inspection id. A
  failed write keeps the portrait and reports through the mutation alert.
  `Hapus`
  is hidden only in this terbit mode. Photo upload does NOT wait for publish:
  without a saved row, uploading implicitly creates the anchor inspection row
  first, and that row stays `DRAFT`, so it also reads as on-progress rather
  than finished.
- Inspection modal notes contract (Hydrant 6 components + APAR 7 components): each
  component card ALWAYS shows its comment textbox — disabled (gray,
  `Komponen standar — tanpa catatan`) when the status is the passing one
  (`LAYAK` hydrant / `BAIK` APAR), editable when `TIDAK STANDAR` or
  `HILANG`. The photo/dokumentasi block sits FIRST in the form body, above
  the component grid: a grid of cards. APAR = three slots
  (Kartu/Berat/Pengecekan, `+N` badge for extra photos, delete on the shown
  photo), each card = slot label + hint + upload button on top with the preview
  image below it, full column width and natural height (`w-full h-auto
  object-contain`, no aspect box, no crop). Hydrant = ONE card, one column wide
  (inside `grid
  grid-cols-2`): label row (`Bukti Inspeksi` + hint + `FileFotoButton`) on top,
  uploaded photos stacked BELOW it in the same card, each `w-full h-auto
  object-contain` (no aspect box, no `object-cover`), with a dashed `Belum ada
  foto` placeholder when there are none. The free-notes label is
  `Catatan Temuan Tambahan` and sits before an optional `Tindakan Rekomendasi / Tindak
  Lanjut (opsional)` textarea. On publish, per-component comments + tambahan serialize
  into one `notes` field as labeled lines (hydrant `susunCatatan`/`uraiCatatan` with
  `LABEL_KOMPONEN`; APAR `susunCatatanApar`/`uraiCatatanApar`; APAR keeps its separate
  `tindakLanjut` draft field). Parsing on modal reopen splits those lines back into the
  per-component inputs. The Hydrant table's Catatan column renders the combined notes as
  a line-per-block list (split `\n`), not a quoted sentence. P3K/Patrol have no
  component comments (P3K is a 21-item quantity grid; Patrol has no status inputs).

## Work Guidance

- Keep UI logic decoupled from low-level network calls.
- Every feature folder must provide a clean `index.ts` barrel.
- Modals must support keyboard escape (`Esc`) and backdrop dismissal; the
  panel itself must not dismiss (guard `e.target === e.currentTarget` or
  `stopPropagation` on the panel).
- Page edits update the matching `wiki/features/*.md` map file in the same
  task (labels, entry points, gotchas) and prove via `wiki/SKILL.md`.

## Verification

- `cd apps/web && bun run build` (root `bun run build` now builds web too: shared → api → `@viaannn/web`; the package was renamed from `preview`)
- Login round-trip: dev server 5173 (Vite proxy → Caddy 8080) with seeded user `pengawas@contoh.id`.
- Approval lifecycle + photo upload + PDF export proven via the klien.ts
  request paths (worker I, Oct 13); no desktop browser is attached to the
  runner, so UI-click evidence is the request sequence the components issue.

## Child DOX Index

*Leaf boundary. Direct children are component files; no nested DOX required.*
