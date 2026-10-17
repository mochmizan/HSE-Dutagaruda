# Inspeksi APAR

Halaman gaya dokumen kertas (aksen `#f2994a`): tabel checklist bulanan 7
komponen → rekap `Kadaluwarsa APAR` → heading `Catatan :` (tulis tangan,
tanpa kotak) + tanda tangan → cip Pilih APAR → kartu tahunan 12 bulan
(hanya-tampil). Cetak 2 halaman (hal. 1 tabel bulanan, hal. 2 kedaluwarsa +
Catatan + tanda tangan).

## Sub-features

- `apar-open` membuka modal inspeksi 7 komponen dari klik baris.
- `apar-publish` menerbitkan via `Selesaikan & Terbitkan` → record view
  (badge, metadata, Verifikasi 7 Komponen, Catatan, Bukti Foto).
- `apar-yearcard` menandai baris bulan laporan; merah + teks tindak lanjut
  saat `X`.
- `apar-expiry` menghitung rekap kedaluwarsa (No. format `1, 14, dan 15`).
- `apar-add-unit` mendaftarkan zona + unit via modal (find-or-create zona).
- `apar-print` mengunduh PDF / mencetak kartu via `Cetak Kartu`.
- `apar-delete-month` menghapus rekam bulan ini via tombol `Hapus Bulan
  Ini` di modal + konfirmasi (foto bulan itu ikut terhapus dulu).

## How to get to it (user POV)

- Pilih `Inspeksi APAR` di sidebar.
- Klik baris tabel checklist → modal 7 komponen.
- `Selesaikan & Terbitkan` → record view; `Edit` membuka ulang modal.
- Cip `01–20` memilih kartu tahunan (satu kartu selalu tampil).
- Tombol `Tambah APAR`, `Cetak Kartu`, `Unduh PDF`.

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
- **Terbit browser.** Klik baris → modal 7 komponen → `Selesaikan &
  Terbitkan` → record view memuat badge + metadata + Verifikasi 7
  Komponen + Catatan + Bukti Foto. `Edit` membuka ulang modal inspeksi.
- **Kartu tahunan.** Baris bulan laporan ditandai; sel `X` merah + teks
  tindak lanjut. Tidak ada status terkunci — semua rekam selalu bisa
  disunting dan dihapus.
- **Kedaluwarsa.** Rekap `Kadaluwarsa APAR` terhitung dari inspeksi
  tersimpan (jangan pernah dari state kartu lokal).
- **Bukti.** `units.json`, `inspections.json`, snapshot record view +
  `PROOF.md` di `wiki/artifacts/<run-id>/apar/`.

## Gotchas

- Kartu tahunan hanya-tampil: tidak ada suntingan sel; sinkronisasi satu
  arah modal → tabel + kartu (draf menang atas laporan terbit).
- Report sintetis pasca-simpan tanpa id API (prefix `rep-`) → tombol Edit
  menutup by design; tidak ada bar status di tampilan itu.
- Foto di dalam modal inspeksi (slot Kartu/Penimbangan CO2/Pengecekan per
  caption), BUKAN Section B halaman.
- CSS `.apar-toolbar-label` tidak terpakai (residu) — jangan pakai sebagai
  selector.
