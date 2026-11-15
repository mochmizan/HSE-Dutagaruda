# Inspeksi APAR

Halaman gaya Hydrant (aksen `#f2994a`): cangkang bersama
`features/inspeksi/InspectionPageShell.tsx` + `KONFIG_APAR` (`inspectionConfig.ts`:
remah, judul, deskripsi `7 komponen`, `Tambah Zona & Unit`, `apar-monthly`,
ikon ShieldCheck). Seluruh hook di `AparPage.tsx`; anak-anak presentasional
tanpa hook. Slot shell: poros bawaan (`Bulan Ini` + MonthSwitcher), statistik
(2 `KartuStatistik` `grid-cols-2`), saring `FilterBar` (tab `Semua Unit` /
`Sedang Berjalan (On Progress)` / `Selesai Diperiksa`, zona, cari, ViewToggle
bersama), isi (`EmptyUnits` | `AparTable` | `AparCards`), tambahan Section B,
kepala cetak + tanda tangan statis 3 kolom, modals.

## Sub-features

- `apar-open` membuka modal inspeksi 7 komponen dari klik baris. Select
  komponen: `BAIK` / `TIDAK BAIK` / `HILANG` (nilai API `BAIK` /
  `TIDAK_BAIK` / `NA`; `NA` tampil sebagai `HILANG` merah). Komentar per
  komponen SELALU dirender — nonaktif abu-abu saat `BAIK`, dapat diisi saat
  `TIDAK BAIK` / `HILANG`.
- `apar-table` Section A 7 kolom bentuk Hydrant: No. (`NoUrut`, panah
  `print:hidden` + `stopPropagation`) | Kode APAR | Zona | Verifikasi 7
  Komponen (chip rata-kiri, `BAIK` emerald / `TIDAK_BAIK`+`HILANG` merah) |
  Status Kelayakan (`TIDAK LAYAK` / `LAYAK` / `Berjalan` / `Belum Dimulai`)
  | Petugas & Tanggal | Keterangan (`KeteranganTeks` 3-baris, `–` bila kosong).
  Split 55/45 Verifikasi/Keterangan sama seperti Hydrant; tanpa kolom
  Jenis/Ukuran/Expired — ekstra domain (jenis powder, berat CO2, expired)
  tinggal di modal, bukan tabel. Helper `detailKomponen` /
  `unitTidakLayak` / `tanggalTampil` diekspor dari `AparTable` dan dipakai
  `AparCards` supaya tabel dan kartu tidak bisa berbeda pendapat.
- `apar-cards` grid 3 kolom: header kode+zona / badge status, chip via helper
  tabel, footer tanggal + `Lihat Laporan` (selesai, netral) atau
  `Mulai Inspeksi`/`Lanjutkan` (solid `#2f80ed`).
- `apar-publish` (terbit = sifat REKAM TERPERSISTENSI, bukan state lokal):
  kolom `apar_inspections.approval_status`
  (`DRAFT|DIAJUKAN|DIKETAHUI|DISETUJUI`). `Terbitkan` menulis `DIAJUKAN` —
  ditunggu sebelum potret berubah, jadi terbit yang gagal tak menyisakan
  potret palsu. Buka-ulang rekam terbit = potret baca-saja (`fieldset`
  nonaktif, tombol unggah/hapus foto hilang, badge `Terbit`); tombol utama
  berganti `Edit` = BATALKAN TERBIT (`useBatalkanTerbitApar`: satu medan
  `approvalStatus: 'DRAFT'` pada id tampil, ditunggu; label `Membatalkan…`
  selama proses). `petakanUnitApar` memetakan `DRAFT` → `SEDANG_BERJALAN`,
  selainnya → `SELESAI`. Tanpa `Simpan Draft`: draf hanya hidup di form
  (unggah foto sebelum terbit membuat jangkar rekam `DRAFT` otomatis).
- `apar-modal` dipecah seperti Hydrant: `AparInspectionModal` (SEMUA
  `useState`+`useEffect`) + `AparInspectionShell` (backdrop+panel+form,
  `fixed inset-0 z-50`, `target===currentTarget` tutup, `body.overflow`
  lock, window Esc) + Header/Body/Photos/Checklist/Outcome/Footer
  presentasional. Urutan body: Foto dulu (3 slot Kartu/Berat/Pengecekan,
  `+N` untuk slot berfoto tambahan, slot Berat nonaktif untuk Powder) →
  grid checklist `grid-cols-2` → Outcome (status auto + override manual +
  `Catatan Temuan Tambahan` + `Tindak Lanjut` opsional, susun/urai notes)
  → Footer (kiri `Hapus unit` / `Kosongkan bulan ini`, kanan `Terbitkan` ↔
  `Edit`). `ConfirmModal` portal `z-[60]` escape-only. Deep-link dasbor
  (`suntingRefId` kategori `apar`) membuka modal rekam bulan itu.
- `apar-temuan` Section B + `AddFindingAparModal` cermin `HydrantFindings`:
  grid 2 kolom `PhotoCard`, form tambah wajib foto + caption.
- `apar-add-unit` mendaftarkan zona & unit via modal (`AddZoneAparModal`:
  combobox zona/unit, jenis Powder/CO2, ukuran, tahun, expired wajib untuk
  unit baru). Baris baru saat tab Selesai → pindah ke On Progress.
- `apar-delete` dua cakupan (sama seperti Hydrant): `Hapus unit` (selalu ada,
  unit + seluruh rekam + foto, tutup modal) dan `Kosongkan bulan ini` (bila
  ada rekam tampil: rekam + fotonya saja, unit kembali "Belum Dimulai").
  Keduanya lewat `ConfirmModal`; `Edit` non-destruktif. Hook membersihkan
  foto anak dulu (cegah 409).
- `apar-print`: kepala cetak (`AparPrintHeader`: logo + judul + lokasi +
  periode + tanggal cetak sistem) + `h2` Section A khusus-cetak + tabel penuh
  + Section B + tanda tangan statis 3 kolom (`AparPrintSignatures`);
  `no-print` pada toolbar/stats/toggle kartu.
- Aksen biru `#2f80ed` seragam untuk aksi utama (tambah, `Terbitkan`,
  kartu `Mulai`/`Lanjutkan`); aksen `#f2994a` untuk ikon judul + tombol
  `Tambah Temuan`. Tab aktif pil putih tipis seragam; badge jumlah tab
  berwarna per tab. Modal tanpa `Batal`.
- Pengalih `Tabel`/`Kartu` memakai shared `ViewToggle`; `NoUrut` untuk
  kolom No. dengan persistensi server (`apar_units.sort_order` via
  `useUrutkanUnit('apar')`).
- Foto unggahan nyata (`useUnggahFoto`/`useHapusFoto`): bukti inspeksi
  (`temuan: false`) dipisah dari temuan Section B (`temuan: true`) pada
  rekam jangkar bulan terpilih.

## How to get to it (user POV)

- Pilih `Inspeksi APAR` di sidebar.
- Klik baris tabel → modal 7 komponen → `Terbitkan`; rekam terbit baca-saja +
  badge `Terbit`, `Edit` membatalkan terbit.
- Tab filter + zona + cari + toggle Tabel/Kartu; panah No. menyusun ulang.
- Section B: `Tambah Temuan` (foto + deskripsi).
- Kepala halaman: `Bulan Ini` (bila bukan bulan berjalan) → pengalih bulan →
  `Tambah Zona & Unit` → `Unduh PDF` → `Cetak`.

## Driving it with HTTP + browser

Preconditions:

- Doctor hijau; login + set-active selesai.
- `GET /api/apar-units?limit=100` non-kosong; jika kosong, GAGAL + catat.

- **Buka daftar.** `curl.exe -s -b $J
  "http://localhost:8080/api/apar-units?limit=100" -o
  wiki/artifacts/<run-id>/apar/units.json`. Array unit APAR.
- **Buka inspeksi.** `curl.exe -s -b $J
  "http://localhost:8080/api/apar-inspections?limit=100" -o
  wiki/artifacts/<run-id>/apar/inspections.json`. Satu baris per unit +
  period.
- **Terbit browser.** Klik baris → modal 7 komponen → `Terbitkan` →
  baris pindah ke `Selesai Diperiksa`; buka-ulang = potret baca-saja +
  badge `Terbit`. `Edit` (= batalkan terbit) mengembalikan ke
  `Sedang Berjalan` + tombol `Lanjutkan`.
- **Bukti.** `units.json`, `inspections.json`, snapshot + `PROOF.md` di
  `wiki/artifacts/<run-id>/apar/`.

## Gotchas

- Kartu tahunan 12 bulan, rekap kedaluwarsa, tanda tangan ketik, dan
  `ReportDetailModal` DIHAPUS pada remake Nov 15 (kontrak 7-komponen Hydrant):
  tabel 7 kolom tanpa Jenis/Ukuran/Expired; file `AparYearCard.tsx`,
  `AparBadges.tsx`, `AparInspectionFields.ts` dibuang. Jangan membangun
  ulang tanpa perintah owner.
- Foto di dalam modal inspeksi (slot Kartu/Berat/Pengecekan per caption);
  Section B HANYA foto bertanda `temuan` pada rekam jangkar bulan terpilih.
- `NA` = HILANG: chip merah, dihitung tidak-layak, komentar wajib-diisi
  terbuka. Status akhir otomatis mengabaikan `NA` (lihat
  `computeAparOverallStatus`).
- Satu-satunya penulis `terbit` adalah efek `[isOpen, inspeksi?.id,
  inspeksi?.approvalStatus]` — jangan menulis `terbit` dari handler.
- `useDismiss`/portal `ConfirmModal` milik bersama; nested Esc tidak
  menutup dua lapis (capture + `stopPropagation`).
