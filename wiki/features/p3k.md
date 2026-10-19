# Inspeksi P3K

Grid tahunan saja seperti formulir kertas (aksen `#27ae60`): 21 item × 12
bulan, satu kolom tanda per bulan (√ / × / KD merah), baris `TANGGAL
INSPEKSI` + `PARAF`, footnote Catatan, year switcher, Unit/Lokasi Kerja
editable. Klik header bulan = form input (21 kuantitas + flag KD +
tanggal/paraf, aksi hapus-bulan). Cetak A4 landscape satu halaman.

## Sub-features

- `p3k-open` membuka form input dari klik header bulan.
- `p3k-save` menyimpan upsert 21 item + tanggal/paraf. Simpan-ulang
  lewat UI aman: simpan kedua lewat PATCH (tanpa 409). TETAPI POST
  langsung dobel ke `POST /api/p3k-inspections` untuk box+bulan sama
  tetap 409 (`duplicateMonth`) — upsert hanya di jalur UI. Tombol modal
  kini `Terbitkan` (biru `#2f80ed`, sebelumnya `Simpan` hijau);
  `Hapus Bulan Ini` pindah ke kanan berdampingan; tombol `Batal`
  dihapus (terverifikasi live Okt 17: footer `Hapus Bulan Ini` +
  `Terbitkan` saja).
- `p3k-clear` menghapus satu bulan penuh via aksi hapus-bulan.
- `p3k-print` mengunduh PDF landscape via `POST /api/export/p3k-yearly/
  :refId` (kategori `p3k-yearly`, bukan `p3k`) → polling
  `GET /api/pdf-jobs/:id` hingga `done` + `downloadUrl`. Ada juga
  `Cetak` hijau (window.print, A4 landscape via `@page`).

## How to get to it (user POV)

- Pilih `Inspeksi P3K` di sidebar.
- Klik header bulan pada grid tahunan → form input bulan itu.
- Year switcher pindah tahun; Unit/Lokasi Kerja disunting langsung.
- Tombol `Unduh PDF` (draft muat satu halaman landscape).

## Driving it with HTTP + browser

Preconditions:

- Doctor hijau; login + set-active selesai.
- Box P3K dikunci per nama site (satu box per site); kolom
  `inspection_date` + `paraf` real (migrasi 0001) — input tanggal/paraf
  yang hilang diam-diam = regresi.

- **Buka daftar.** `curl.exe -s -b $J
  "http://localhost:8080/api/p3k-inspections?limit=100" -o
  wiki/artifacts/<run-id>/p3k/inspections.json`. Baris memuat tanggal +
  paraf tersimpan.
- **Simpan-ulang (upsert).** Simpan bulan yang sama dua kali via UI:
  tidak 409 (simpan kedua jadi PATCH), nilai kedua menang. Jangan
  ajukan dobel via POST API untuk bukti "tanpa 409" — POST langsung
  tetap 409.
- **Form browser.** Klik header bulan → form 21 kuantitas + flag KD +
  tanggal/paraf muncul. Isi tanggal + paraf, simpan, buka ulang: nilai
  bertahan ( silent-drop check).
- **Bukti.** `inspections.json`, snapshot form terisi + `PROOF.md` di
  `wiki/artifacts/<run-id>/p3k/`.

## Gotchas

- Asert body-text, BUKAN `[role=dialog]` — modal P3K tidak punya role itu.
- Grid mulai kosong (empty start) itu normal; isi hanya dari input bulan.
- Cetak memaksa A4 landscape via `@page` injeksi — verifikasi orientasi
  di PDF, bukan di layar.
- Box key = nama site; site ganda = box ganda. Jangan asert satu box
  global.
