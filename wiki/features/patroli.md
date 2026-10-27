# Patroli K3

Feed foto per bulan (aksen `#2f80ed`), terbaru dulu, memakai ulang grid kartu
Section B Hydrant (2 kolom, foto 4/5, caption + tanggal, hover-delete,
print-clean). Kepala halaman lewat cangkang bersama
`features/inspeksi/InspectionPageShell.tsx` + `KONFIG_PATROLI` (remah
`Patroli K3`, `patrol-report`, ikon Camera): poros bulan
(`MonthSwitcher` + tombol `Bulan Ini`, sama seperti Hydrant — umpan
disaring ke bulan terpilih, bawaan bulan berjalan), tombol `Tambah Foto`
berikon kamera via `ikonTambah`, tombol `Cetak` netral. Statistik 2 kartu
`KartuStatistik` (`grid-cols-2`, `Total Foto Terdaftar` + `Foto Bulan Ini`;
sebelumnya 3 kartu buatan sendiri) + kop kertas + feed + modal menempati
slot shell. Header kertas `LAPORAN KEGIATAN SAFETY PATROL` + lokasi
editable + tanggal terkini. Form tambah: foto wajib + caption, tanggal
default hari ini. Cetak A4 portrait (header + grid).

## Sub-features

- `patrol-list` menampilkan feed terbaru-dulu dengan caption + tanggal,
  disaring ke bulan terpilih (poros `MonthSwitcher`; bawaan bulan
  berjalan). Foto di luar bulan itu tidak tampil sampai bulannya dipilih —
  ini perubahan perilaku Okt 27 agar krom kanan atas sama dengan Hydrant.
- `patrol-add` menambah temuan (foto wajib + caption). Tombol modal kini
  `Terbitkan` (biru, sebelumnya `Simpan Foto`); tombol `Batal` dihapus.
- `patrol-delete` menghapus via hover-delete langsung; TANPA dialog
  konfirmasi (terverifikasi live: kartu hilang seketika, tanpa
  `window.confirm`) — hati-hati saat mengendarai di atas data review.
- `patrol-print` mengunduh PDF via `POST /api/export/patrol-report/:refId`
  (bukan `/patrol/`); ada juga `Cetak` (window.print) di header.
- `patrol-shell` (Okt 27): `PatrolPage` dirender lewat
  `InspectionPageShell` dengan `KONFIG_PATROLI`; tombol kembali `onBack`
  dihapus (Hydrant/APAR juga tidak memakainya); judul shell baru
  `Laporan Patroli K3`. Tanpa perubahan perilaku.

## How to get to it (user POV)

- Pilih `Patroli K3` di sidebar.
- Form tambah (foto + caption + tanggal) di atas feed.
- Hover kartu → hapus; klik item feed → modal detail (badge, metadata,
  foto, Edit).

## Driving it with HTTP + browser

Preconditions:

- Doctor hijau; login + set-active selesai.
- Form tambah mengunggah foto ASLI (`POST
  /:id/findings/photo`, multipart; JPEG/PNG/WebP maks 8 MB). Baris lama
  `draft/` masih tampil placeholder abu-abu.

- **Buka daftar.** `curl.exe -s -b $J
  "http://localhost:8080/api/safety-patrol-reports" -o
  wiki/artifacts/<run-id>/patroli/reports.json`. Urutan terbaru dulu.
- **Buka temuan.** `curl.exe -s -b $J
  "http://localhost:8080/api/safety-patrol-reports/<id>/findings" -o
  wiki/artifacts/<run-id>/patroli/findings.json`. Tiap temuan punya
  caption + tanggal.
- **Tambah-hapus (mutasi).** Tambah via form dengan caption prefix `uji-`
  (foto asli ikut terunggah), verifikasi muncul di feed,
  lalu hapus via `DELETE
  /api/safety-patrol-reports/<id>/findings/<fid>`; baca ulang feed =
  hilang. Fixture `uji-` tidak boleh tersisa.
- **Resolve foto.** `GET /api/safety-patrol-reports/findings/<fid>/photo`
  → 302 ke presign Garage (60 dtk).
- **Browser.** Tambah via form (foto wajib divalidasi kosong), hover kartu
  → hapus bekerja, tanggal default = hari ini.
- **Bukti.** `reports.json`, `findings.json`, snapshot feed + `PROOF.md`
  di `wiki/artifacts/<run-id>/patroli/`.

## Gotchas

- Caption saja di bawah foto (tanpa metadata ramai) itu by design.
