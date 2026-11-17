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
- `apar-recap` Section C `AparExpiryRecap` (di bawah temuan, di atas kartu):
  kartu netral: ringkasan `Kedaluwarsa` (merah) / `Segera Habis ≤ 90 Hari`
  (amber) / `Aman` + daftar kode via `formatNoList` (`A, B, dan C`), lalu
  tabel `Kode APAR` | `Zona` | `Tgl Isi Ulang` | `Sisa Hari` | `Status`.
  Dihitung dari `expiredDate` unit (`hariMenujuKedaluwarsa`, negatif = lewat;
  tanggal tak-terurai = `–`). `print:break-before-page` (hal. 2 = rekap +
  kartu + tanda tangan).
- `apar-yearcard` Section D `AparYearCard` (paling bawah, posisi Section B
  Hydrant): kartu tahunan 12 bulan per unit, HANYA-BACA. Cip `Pilih APAR`
  (independen dari pilihan tabel) + pengalih tahun ±1 (tahun berjalan ±1,
  `daftarTahunKartu`; tombol mati di ujung) + `Cetak Kartu` (→ cetak laman,
  nonaktif bila belum ada unit). Grid `Bulan` | `Tanggal` | `Kondisi 7
  Komponen` (cip ✓/X/–; `NA` = X merah) | `Tindak Lanjut`; baris bertanda X
  merah + teks tindak lanjut merah. Kaki `Tgl Isi Ulang` (dari `expiredDate`)
  + legenda. Sel diturunkan dari rekam inspeksi via `petakanKartuTahunan`
  (lokal `kartuApar.ts`, tanpa impor berkas terhapus); tindak lanjut via
  `uraiCatatanApar`. Tampilan kartu tidak pernah membajak: `AparCards` tetap
  `Lihat Laporan` / `Mulai Inspeksi` / `Lanjutkan` → modal.
- `apar-reportview` potret terbit di dalam `AparInspectionModal` (cermin
  Hydrant): buka-ulang rekam terbit = baca-saja (`fieldset` nonaktif, badge
  `Terbit`, metadata + verifikasi 7 komponen + catatan + foto, tanpa
  `Hapus`); tombol utama `Edit` = batalkan terbit (`approvalStatus: 'DRAFT'`
  pada id tampil, ditunggu; label `Membatalkan…`) → kembali ke mode sunting.
  Alur: klik baris → modal → `Terbitkan` → potret terbit (modal tetap
  terbuka, mengikuti refetch) → `Edit` → formulir. Tanpa tombol mati.
- `apar-table` Section A 9 kolom disiplin Hydrant, kunci lebar `table-fixed` +
  `<colgroup>` 64/80/80/110/120/145/140/170/119 (total 1028px = Hydrant;
  sel membungkus, bukan meregang): No. (`NoUrut`, panah
  `print:hidden` + `stopPropagation`) | Kode APAR | Zona | Jenis / Ukuran
  (`{jenis} • {ukuran}`, `–` bila kosong) | Periode Expired
  (`formatIndonesianDate(expiredDate)`, `tabular-nums`, amber-600 semibold
  bila `hariMenujuKedaluwarsa ≤ 90`, `–` bila tak-terurai) | Verifikasi 7
  Komponen (chip rata-kiri, `BAIK` emerald / `TIDAK_BAIK`+`HILANG` merah) |
  Status Kelayakan (`TIDAK LAYAK` / `LAYAK` / `Berjalan` / `Belum Dimulai`)
  | Petugas & Tanggal | Keterangan (`KeteranganTeks` 3-baris, `–` bila kosong).
  Helper `detailKomponen` /
  `unitTidakLayak` / `tanggalTampil` diekspor dari `AparTable` dan dipakai
  `AparCards` supaya tabel dan kartu tidak bisa berbeda pendapat.
- `apar-cards` grid 3 kolom: header kode+zona / badge status, baris
  jenis•ukuran + tanggal expired (amber bila ≤ 90 hari, urutan sama seperti
  tabel), chip via helper
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
  presentasional. Urutan body: Foto dulu (3 slot Checklist/Berat/
  Dokumentasi Pengecekan, label ringkas tanpa wrap agar tombol Unggah Foto
  tetap di baris 2, `+N` untuk slot berfoto tambahan, slot Berat nonaktif
  untuk Powder) →
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
  + Section B + Section C (rekap, `break-before-page` → hal. 2) + Section D
  (kartu tahunan) + tanda tangan statis 3 kolom (`AparPrintSignatures`);
  `no-print` pada toolbar/stats/toggle kartu dan kontrol cip/tahun/cetak-kartu.
- `apar-printview` pratinjau demo-faithful `AparPrintPreview` (deep-link
  `?cetak=apar&bulan=YYYY-MM`, tombol `Pratinjau Cetak` di Section A cermin
  Hydrant): markup + CSS `#print-template-styles` demo EXACT (paginasi 5+6
  baris, thead hanya hal. 1, blok Kadaluwarsa prosedural + Catatan + tanda
  tangan 3 kolom di hal. tabel terakhir ala `4-page`); data live: units →
  rows, `expiredDate` ISO → Indonesia multiline, foto caption `Kartu APAR` /
  `Penimbangan CO2` (landscape) / `Pengecekan fisik` (+ekstra) per rekam
  bulan, tanggal = `createdAt` terbaru, catatan = gabungan notes unik.
  Kolom `Handsign / Penandatangan` di pratinjau (Checklist Bulanan:
  Dibuat/Diketahui/Disetujui + jabatan; Kartu Tahunan: Nama Pemeriksa +
  Paraf): penanda kosong dihilangkan per kolom oleh
  `renderDynamicSignTable`, seluruh blok tanda tangan hilang bila semua
  kosong.
  GAP: logo kop kiri JPM (pakai banner bersama kanan saja), nama penandatangan
  (jabatan fallback demo), foto/unit tanpa rekam bulan = sel kosong.
- apar-kertas-pdf: `aparMonthly()` di `apps/api/src/pdf/templates.ts`
  mengikuti kertas bulanan milik owner (kop banner JPM + kotak judul tengah
  `CHECKLIST BULANAN APAR` + tabel checklist tata-letak tetap tinta hitam +
  ringkasan `Kadaluwarsa APAR` No/Periode/Total/No APAR yang dikelompokkan
  prosedural per tanggal kedaluwarsa dengan gabung Indonesia
  `formatDaftarKode`, hal. 2 = kedaluwarsa + `Catatan :` bergaris +
  tanda tangan 3 kolom, potret 2 halaman). Data hanya dari muatan loader
  `loadAparMonthly` (nama penandatangan + foto per unit tidak ada di payload
  sehingga tidak dirender — bukan diada-ada).
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
- Klik baris tabel → modal 7 komponen → `Terbitkan` → potret terbit baca-saja +
  badge `Terbit`; `Edit` membatalkan terbit → kembali ke formulir.
- Tab filter + zona + cari + toggle Tabel/Kartu; panah No. menyusun ulang.
- Section B: `Tambah Temuan` (foto + deskripsi).
- Section C: rekap kedaluwarsa dari `expiredDate` unit (merah/amber/aman).
- Section D: kartu tahunan 12 bulan — cip `Pilih APAR` + pengalih tahun ±1 +
  `Cetak Kartu`; hanya-baca, turunan rekam inspeksi.
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

- Kartu tahunan 12 bulan + rekap kedaluwarsa DIKEMBALIKAN Nov 15 dalam bahasa
  Hydrant (bukan hijack tampilan kartu): Section C `AparExpiryRecap` +
  Section D `AparYearCard` di slot `tambahan` (temuan → rekap → kartu);
  pemetaan lokal `kartuApar.ts` (`petakanKartuTahunan`, `formatNoList`,
  `hariMenujuKedaluwarsa`); tanpa `AparBadges.tsx` / `AparInspectionFields.ts`
  / `ReportDetailModal` — potret terbit tetap di dalam modal inspeksi.
- Foto di dalam modal inspeksi (slot Checklist/Berat/Dokumentasi
  Pengecekan per caption);
  Section B HANYA foto bertanda `temuan` pada rekam jangkar bulan terpilih.
- `NA` = HILANG: chip merah, dihitung tidak-layak, komentar wajib-diisi
  terbuka. Status akhir otomatis mengabaikan `NA` (lihat
  `computeAparOverallStatus`).
- Satu-satunya penulis `terbit` adalah efek `[isOpen, inspeksi?.id,
  inspeksi?.approvalStatus]` — jangan menulis `terbit` dari handler.
- `useDismiss`/portal `ConfirmModal` milik bersama; nested Esc tidak
  menutup dua lapis (capture + `stopPropagation`).
