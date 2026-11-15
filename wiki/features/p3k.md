# Inspeksi P3K

Grid tahunan saja seperti formulir kertas (aksen `#27ae60`): 21 item × 12
bulan, satu kolom tanda per bulan (√ / × / KD merah), baris `TANGGAL
INSPEKSI` + `PARAF`, footnote Catatan, year switcher, Unit/Lokasi Kerja
editable. Kepala halaman lewat cangkang bersama
`features/inspeksi/InspectionPageShell.tsx` + `KONFIG_P3K` (remah
`Inspeksi P3K`, `p3k-yearly`, ikon BriefcaseMedical): poros tahun via slot
`poros` (`YearSwitcher` berpil seperti `MonthSwitcher` + tombol `Tahun Ini`
saat bukan tahun berjalan), tanpa tombol tambah, tombol `Cetak` netral
(sebelumnya hijau — kini seragam keempat halaman). Statistik 2 kartu
`KartuStatistik` (`grid-cols-2`, bentuk + ukuran angka sama dengan Hydrant:
`Sel Di Bawah Standar` + `Selesai Diperiksa`; sebelumnya 3 kartu buatan
sendiri di `grid-cols-3`). Saring sebaris gaya `FilterBar` di posisi yang
sama (tab `Semua Item` / `Kurang` / `Kadaluarsa` + hitungan per tab + kotak
cari, tanpa salinan komponen — JSX inline di `P3kPage`, menyaring baris
item; status baris = tanda terburuk setahun: KD > kurang > baik). Grid +
kop + Catatan + modal menempati slot shell; `P3kHeader.tsx` dihapus
(satu-satunya pemakai sudah pindah). Klik header bulan = form input bulan
itu. Cetak A4 landscape satu halaman.

Grid dibangun di atas disiplin tabel Hydrant: kolom `No.` angka posisi
(mono + tabular, tanpa panah — urutan katalog tetap), kolom `ITEM` rata
kiri (nama + sub `Standar: N unit`), sel tengah, sel bulan terisi bertinta
(emerald seperti baris selesai Hydrant; merah untuk ×/KD), kolom
`KETERANGAN` via `KeteranganTeks` bersama. Judul seksi cetak `A. Hasil
Pemeriksaan Kotak P3K` (`print-only`, posisi badan Section A Hydrant).
Urutan kolom, jumlah sel, dan teks baris sama seperti sebelumnya.

Modal dipecah seperti Hydrant: `P3kInspectionModal.tsx` memegang SEMUA state
+ efek (isi awal `[isOpen, initial]`, cermin-terbit `[isOpen, rekam?.id]`,
Esc + kunci scroll badan) dengan urutan asli; anak-anak presentasional
tanpa hook: `P3kInspectionShell.tsx` (backdrop `fixed inset-0 z-50`,
tutup bila `target === currentTarget`, panel `emil-modal` + `<form>`),
`P3kInspectionHeader.tsx` (cip ikon + `Formulir Pemeriksaan: <Bulan Tahun>`
+ lencana `Terbit` + ringkasan + X), `P3kInspectionBody.tsx` (masukan 21
kuantitas + flag KD → hasil: cip `LENGKAP`/`PERLU ISI ULANG` + hitungan +
tanggal/paraf; tanpa blok foto — P3K tidak punya foto per domain; tanpa
catatan per komponen), `P3kInspectionFooter.tsx` (kiri `Hapus Bulan Ini`,
kanan satu primer `Terbitkan` ↔ `Edit`) + `P3kDeleteConfirmation`
(`ConfirmModal` portal `z-[60]`, escape-only). Potret terbit mencerminkan
rekam tersimpan (ada rekam = terbit = fieldset terkunci); `Edit` membuka
kunci lokal — rekam P3K tidak membawa `approval_status` seperti Hydrant,
jadi batal-terbit tak menulis apa pun ke server sampai Terbitkan menyimpan
ulang. Terbitkan yang gagal tak menyisakan potret Terbit palsu (modal tetap
terbuka dalam modus sunting; hook sudah mengingatkan via alert Indonesia).

Kop kertas + tanda tangan lewat slot cangkang yang sama seperti Hydrant:
`P3kPrintChrome.tsx` (`P3kPrintHeader` logo + `LEMBAR LAPORAN PEMERIKSAAN
KOTAK P3K GEDUNG` + lokasi/periode/unit/lokasi kerja/tanggal cetak,
`P3kPrintSignatures` 3 kolom) mengisi `kepalaCetak`/`tandaTangan`;
`P3kKepala.tsx` tinggal kop layar interaktif (`print:hidden`). Cetak tetap
memaksa A4 landscape via injeksi `@page`.

## Sub-features

- `p3k-open` membuka form input dari klik header bulan.
- `p3k-save` menyimpan upsert 21 item + tanggal/paraf. Simpan-ulang
  lewat UI aman: simpan kedua lewat PATCH (tanpa 409). TETAPI POST
  langsung dobel ke `POST /api/p3k-inspections` untuk box+bulan sama
  tetap 409 (`duplicateMonth`) — upsert hanya di jalur UI. Tombol modal
  `Terbitkan` (biru `#2f80ed`); `Hapus Bulan Ini` di kiri berdampingan;
  tombol `Batal` tidak ada. Tanpa kotak terdaftar, simpan mengingatkan
  (alert Indonesia) dan tidak menulis apa pun.
- `p3k-clear` menghapus satu bulan penuh via aksi hapus-bulan (konfirmasi
  dulu, lalu modal menutup).
- `p3k-print` mengunduh PDF landscape via `POST /api/export/p3k-yearly/
  :refId` (kategori `p3k-yearly`, bukan `p3k`) → polling
  `GET /api/pdf-jobs/:id` hingga `done` + `downloadUrl`. Ada juga
  `Cetak` (window.print, A4 landscape via `@page`).
- `p3k-shell`: `P3kPage` dirender lewat `InspectionPageShell`
  dengan `KONFIG_P3K`; tombol kembali `onBack` dihapus (Hydrant/APAR juga
  tidak memakainya — navigasi lewat sidebar); judul shell baru
  `Laporan Inspeksi P3K`. Tanpa perubahan perilaku.
- `p3k-saring` (Nov 15): tab status + cari item di slot `saring`
  (posisi bilah saring Hydrant). Tanpa komponen saring baru — JSX inline
  di laman memakai bahasa visual pil yang sama.

## How to get to it (user POV)

- Pilih `Inspeksi P3K` di sidebar.
- Klik header bulan pada grid tahunan → form input bulan itu (isi →
  `Terbitkan`; buka ulang bulan terisi → potret baca-saja + `Edit`).
- Tab `Kurang`/`Kadaluarsa` atau kata kunci menyaring baris item.
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
  bertahan ( silent-drop check); potret baca-saja + tombol `Edit`.
- **Bukti.** `inspections.json`, snapshot form terisi + `PROOF.md` di
  `wiki/artifacts/<run-id>/p3k/`.

## Gotchas

- Asert body-text, BUKAN `[role=dialog]` — modal P3K tidak punya role itu.
- Grid mulai kosong (empty start) itu normal; isi hanya dari input bulan.
- Cetak memaksa A4 landscape via `@page` injeksi — verifikasi orientasi
  di PDF, bukan di layar.
- Box key = nama site; site ganda = box ganda. Jangan asert satu box
  global.
- Potret terbit P3K = keberadaan rekam (tanpa `approval_status`):
  bulan terisi selalu terbuka baca-saja; sunting via `Edit`.
