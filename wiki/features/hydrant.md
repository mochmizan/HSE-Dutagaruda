# Inspeksi Hydrant

Halaman pola master (aksen `#eb5757`): pengalih bulan + 4 statistik + tabs +
tabel/kartu unit, klik baris membuka modal inspeksi 6 komponen, Section B
temuan foto di bawah, cetak A4 portrait (tabel + temuan + tanda tangan 3
kolom).

## Sub-features

- `hydrant-open` membuka modal inspeksi dari klik baris tabel.
- `hydrant-save` menyimpan draf 6 komponen + foto + catatan + override.
- `hydrant-add-unit` mendaftarkan zona + kode unit non-sekuensial via modal.
- `hydrant-finding` menambah temuan Section B (foto wajib + caption).
- `hydrant-print` mengunduh PDF A4 via `POST /api/export/hydrant/:refId`.
- `hydrant-delete-month` menghapus permanen rekam bulan ini (beserta foto)
  via tombol `Hapus` di modal + langkah konfirmasi `ConfirmModal`.

## How to get to it (user POV)

- Pilih `Inspeksi Hydrant` di sidebar.
- Klik satu baris tabel unit → modal `Formulir Pemeriksaan`.
- Tombol tambah unit/zona di atas tabel (find-or-create zona duplikat).
- Form `Tambah` Section B di bawah tabel (grid `PhotoCard` 2 kolom).
- Tombol `Hapus` di modal inspeksi (berapa pun statusnya —
  laporan final saat simpan, tanpa alur persetujuan).
- Tombol `Unduh PDF` di halaman/modal.

## Driving it with HTTP + browser

Preconditions:

- Doctor hijau; login + set-active selesai (lihat `../SKILL.md`).
- Bulan verifikasi `BULAN=2026-10` (ganti ke bulan berjalan nyata).
- Setidaknya satu unit hidran ada (`GET /api/hydrant-units?limit=100`
  non-kosong); jika kosong, run GAGAL dan catat di Gotchas — jangan
  memalsukan unit agar lolos.

- **Buka daftar.** Ambil unit. `curl.exe -s -b $J
  "http://localhost:8080/api/hydrant-units?limit=100" -o
  wiki/artifacts/<run-id>/hydrant/units.json`. Body halaman
  `{items:[...]}` (`kode`, `zona`/`zoneId`, `companyId` =
  `seed-perusahaan-1`).
- **Buka inspeksi.** Ambil daftar inspeksi. `curl.exe -s -b $J
  "http://localhost:8080/api/hydrant-inspections?limit=100" -o
  wiki/artifacts/<run-id>/hydrant/inspections.json`. Tiap baris mengikat
  satu unit + satu `period` (`YYYY-MM`).
- **Konfirmasi umpan.** `curl.exe -s -b $J
  "http://localhost:8080/api/inspections?month=2026-10"`. Kunci `hydrant`
  ada (bukan `hidran` — crash kelas ini pernah lolos gate yang hanya
  cek status).
- **Modal browser.** Di halaman `Inspeksi Hydrant`, klik baris pertama
  (find+click dalam SATU evaluate). Teks body memuat `Formulir
  Pemeriksaan`. Tutup via `Esc`.
- **Draf browser.** Di modal, ubah satu select komponen + catat. Simpan.
  Buka ulang modal: nilai tersimpan (tampilan kedua). Foto: slot `Bukti
  inspeksi` mengunggah ke `/api/uploads` dan bertahan di daftar foto sesi.
- **Bukti.** Simpan `units.json`, `inspections.json`, snapshot teks-body
  modal terbuka, dan `PROOF.md` (ID fitur `hydrant-open`, entry yang
  dipakai) di `wiki/artifacts/<run-id>/hydrant/`.

## Gotchas

- Bulan default halaman = bulan berjalan nyata (pernah hardcode September —
  jangan asert nama bulan statis).
- Klik baris mati pada baris completed tanpa fallback modal = regresi
  (pernah terjadi; fallback ke modal wajib ada).
- Duplikat bulan: `POST` inspeksi dua kali untuk unit+period sama → 409 +
  notice Indonesia, bukan 500.
- Hapus foto DULU (`DELETE /api/photos/:id`) sebelum hapus inspeksi —
  children guards memblokir hapus parent-first.
- Presigned URL foto hanya resolve di dalam network Docker; dari host,
  tukar origin ke `caddy:80` seperti pola `fetchBytes` di `check.ts`.
