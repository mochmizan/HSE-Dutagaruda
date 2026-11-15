# Patroli K3

Feed foto per bulan (aksen `#2f80ed`), terbaru dulu, bahasa kartu yang sama
dengan Section B Hydrant (grid 2 kolom, kartu foto, hover-delete,
print-clean) plus baris kepala tanggal + lencana netral `Tersimpan` per
kartu. Kepala halaman lewat cangkang bersama
`features/inspeksi/InspectionPageShell.tsx` + `KONFIG_PATROLI` (remah
`Patroli K3`, `patrol-report`, ikon Camera): poros bulan bawaan shell
(`Bulan Ini` → `MonthSwitcher` posisi Hydrant — umpan disaring ke bulan
terpilih, bawaan bulan berjalan), tombol `Tambah Foto` berikon kamera via
`ikonTambah`, tombol `Cetak` netral. Statistik 2 kartu `KartuStatistik`
(`grid-cols-2`, `Total Foto Terdaftar` + `Foto Bulan Ini` + bilah progres di
kartu kedua) di `PatrolStats.tsx`, bentuk sama dengan `HydrantStats`.
Baris saring di posisi `FilterBar` (hitungan foto bulan + cari keterangan +
lokasi kerja, tanpa salinan filter). Kop kertas
`LAPORAN KEGIATAN SAFETY PATROL` + lokasi + tanggal terkini via slot
`kepalaCetak`, feed di `isi`, tanda tangan via `tandaTangan`, toolbar dan
statistik `no-print`. Form tambah: foto wajib + caption, tanggal default
hari ini, footer satu tombol `Terbitkan` (tanpa `Batal`; API patroli tidak
membawa status terbit, jadi Terbitkan = simpan, tanpa status kedua).
Hapus via `ConfirmModal` (portal `z-[60]`, escape-only), bukan hover
langsung.

## Sub-features

- `patrol-list` menampilkan feed terbaru-dulu dengan tanggal + caption,
  disaring ke bulan terpilih (poros `MonthSwitcher`; bawaan bulan
  berjalan). Saring caption tetap di dalam bulan terpilih. Foto di luar
  bulan itu tidak tampil sampai bulannya dipilih.
- `patrol-add` menambah temuan (foto wajib JPEG/PNG/WebP maks 8 MB +
  caption + tanggal default hari ini) lewat `AddPatrolFindingModal`
  (semua state di modal; `PatrolFindingShell` = backdrop `fixed inset-0
  z-50` + `body.overflow` lock + Esc; `PatrolFindingBody`
  presentasional). Tombol modal `Terbitkan` (biru); tidak ada `Batal`.
- `patrol-delete` meminta konfirmasi dulu (`ConfirmModal`
  `Hapus Foto Patroli` → `Ya, hapus`, aksen `#eb5757`); mutasi
  menginvalidasi `laporan-patroli` + `['umpan']` saat settle. Hati-hati
  saat mengendarai di atas data review.
- `patrol-print` mengunduh PDF via `POST /api/export/patrol-report/:refId`
  (bukan `/patrol/`); jangkar = laporan terbaru lokasi aktif. `Cetak`
  (window.print) di header: kop + grid feed + tanda tangan; umpan layar
  sembunyi saat cetak.
- `patrol-shell`: `PatrolPage` hanya orkestrasi (semua hook di sini, anak
  presentasional) dirender lewat `InspectionPageShell` dengan
  `KONFIG_PATROLI`. Judul shell `Laporan Patroli K3`.

## How to get to it (user POV)

- Pilih `Patroli K3` di sidebar.
- Poros bulan kanan atas (`Bulan Ini` + pengalih bulan); saring caption +
  lokasi kerja di bawahnya.
- Tambah via `Tambah Foto` (foto wajib divalidasi); hover kartu → tombol
  hapus → dialog konfirmasi; tanggal tiap kartu tampil di atas foto.

## Driving it with HTTP + browser

Preconditions:

- Doctor hijau; login + set-active selesai.
- Form tambah mengunggah foto ASLI (`POST
  /:id/findings/photo`, multipart; JPEG/PNG/WebP maks 8 MB).

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
  /api/safety-patrol-reports/findings/<fid>`; baca ulang feed =
  hilang. Fixture `uji-` tidak boleh tersisa.
- **Resolve foto.** `GET /api/safety-patrol-reports/findings/<fid>/photo`
  → 302 ke presign Garage (60 dtk).
- **Browser.** Tambah via form (foto wajib divalidasi kosong), hapus
  meminta konfirmasi dulu, tanggal default = hari ini.
- **Bukti.** `reports.json`, `findings.json`, snapshot feed + `PROOF.md`
  di `wiki/artifacts/<run-id>/patroli/`.

## Gotchas

- Caption di bawah foto (tanpa metadata ramai) itu by design; tanggal ada
  di baris kepala kartu + kop cetak.
- Lencana `Tersimpan` netral per kartu = rekam sudah tersimpan; bukan
  status terbit (API patroli tidak punya `approval_status`, tidak seperti
  Hydrant — tidak ada cerminan terbit, tidak ada badge `Terbit`).
- Lokasi kerja kosong = nama lokasi aktif; suntingan di baris saring
  dipakai untuk unggahan (`locationNote`) dan kop cetak.
