# Peta fitur verifikasi viaannn

Sumber acuan untuk memverifikasi perilaku user-facing aplikasi inspeksi K3
(Hydrant, APAR, P3K, Patroli K3, alur persetujuan). Baca indeks ini sebelum
menjalankan aplikasi, lalu pakai file fitur yang cocok sebagai resep.
Induk skill: [`../SKILL.md`](../SKILL.md).

## Prasyarat dasar

- Stack hidup via `docker compose up -d` di `infra/`; `bun
  wiki/helpers/verify-doctor.mjs` hijau (exit 0).
- Verifikasi menarget `http://localhost:8080` (Caddy: UI + API satu origin).
  URL Tailnet (`https://desktop-6srl494.tail2e9cdf.ts.net`) hanya untuk
  review perusahaan — jangan dipakai untuk run verifikasi.
- Login sesuai [`../SKILL.md`](../SKILL.md) (masuk → set-active
  `seed-perusahaan-1` → request). Tanpa set-active semua request 401.
- SATU instans dalam satu waktu: volume compose + port 8080/5433/5173
  dipakai bersama. Jangan jalankan dua stack; run kedua menunggu atau
  memakai ulang instans yang ada. Jangan pernah mengendarai instans yang
  tidak dimulai/diketahui run ini tanpa konfirmasi koordinator.
- Jangan `docker compose down` — stack adalah instans review perusahaan.

## Konvensi mengemudi

- Setiap resep mulai dari kondisi dasar kecuali prasyaratnya menyebut lain.
- Lajur HTTP: `curl.exe` + cookie jar (lihat SKILL). Lajur browser: tool
  browser koordinator, label literal dari SKILL.
- Perlakukan setiap perintah harfiah. Jangan ubah nama berkuotasi dan flag.
- Setelah mutasi, baca ulang dari tampilan kedua (endpoint daftar / umpan /
  modal dibuka ulang). Jangan hapus artefak bukti saat cleanup.
- Periode bulan format `YYYY-MM`; pakai bulan berjalan nyata, bukan contoh
  statis.

## Bukti dan pelaporan

- Tangkap aksi DAN status hasilnya, bukan hanya layar akhir.
- Bukti HTTP: perintah, status, body mentah (`*.json`) + baca-ulang kedua.
- Bukti browser: snapshot ARIA/teks-body + screenshot dengan identitas
  aplikasi terlihat (header `PT DUTAGARUDA PIRANTI PRIMA`).
- Catat ID fitur dan entry point yang dipakai di setiap artefak
  (`PROOF.md`).
- Jalur buntu dilaporkan dengan perintah yang dicoba + prasyarat yang tak
  terpenuhi. Jangan klaim entri yang dilewati sebagai terverifikasi lewat
  jalur lain.

## Kontrak entri fitur

Setiap file fitur diawali judul H1 + satu paragraf perilaku user-visible,
lalu tepat empat H2 berurutan:

1. `Sub-features` — ID pendek + satu baris per perilaku.
2. `How to get to it (user POV)` — semua entry point pengguna.
3. `Driving it with HTTP + browser` — diawali `Preconditions:`, bullet
   berlabel memasangkan aksi pengguna dengan perintah persis + hasil
   teramati.
4. `Gotchas` — jebakan yang bisa membuang atau membatalkan run verifikasi.

Jauhkan detail implementasi dari peta. Namai hanya jalur pengguna, handle
stabil, state yang dibutuhkan, perintah, dan bukti teramati.

## Fitur

- [Inspeksi Hydrant](./hydrant.md) — pola master: tabel unit, modal 6
  komponen, Section B temuan foto, cetak A4.
- [Inspeksi APAR](./apar.md) — checklist bulanan 7 komponen, kartu tahunan,
  rekap kedaluwarsa, cetak 2 halaman.
- [Inspeksi P3K](./p3k.md) — grid tahunan 21 item × 12 bulan, tanggal +
  paraf, cetak landscape.
- [Patroli K3](./patroli.md) — feed foto tunggal, terbaru dulu, tambah
  temuan + hapus hover.
- [Alur persetujuan](./persetujuan.md) — Draft → Diajukan → Diketahui →
  Disetujui + Kembalikan, lintas semua kategori.
