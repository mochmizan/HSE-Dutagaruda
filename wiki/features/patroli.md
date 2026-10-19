# Patroli K3

Feed foto tunggal (aksen `#2f80ed`), terbaru dulu, memakai ulang grid kartu
Section B Hydrant (2 kolom, foto 4/5, caption + tanggal, hover-delete,
print-clean). Header kertas `LAPORAN KEGIATAN SAFETY PATROL` + lokasi
editable + tanggal terkini. Form tambah: foto wajib + caption, tanggal
default hari ini. Cetak A4 portrait (header + grid).

## Sub-features

- `patrol-list` menampilkan feed terbaru-dulu dengan caption + tanggal.
- `patrol-add` menambah temuan (foto wajib + caption). Tombol modal kini
  `Terbitkan` (biru, sebelumnya `Simpan Foto`); tombol `Batal` dihapus.
- `patrol-delete` menghapus via hover-delete langsung; TANPA dialog
  konfirmasi (terverifikasi live: kartu hilang seketika, tanpa
  `window.confirm`) — hati-hati saat mengendarai di atas data review.
- `patrol-print` mengunduh PDF via `POST /api/export/patrol-report/:refId`
  (bukan `/patrol/`); ada juga `Cetak` (window.print) di header.

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
