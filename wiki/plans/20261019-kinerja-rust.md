# Rencana: refactor + kecepatan + sumber daya (Rust di jalur PDF)

Tanggal: 2026-10-19. Status: menunggu persetujuan sebelum eksekusi.

## 1. Putusan ringkas

Tiga hal yang benar-benar membebani produk, terukur:

1. Tidak ada kompresi di jalur kirim. Setiap kunjungan dingin mengirim 421 KB mentah
   padahal 117 KB setelah gzip. Buang 240 KB per kunjungan, satu baris Caddy.
2. Ekspor PDF memblokir request dan memakan 371 MiB RAM + 2,46 GB image Chromium
   untuk pekerjaan yang bisa selesai 7x lebih cepat tanpa browser.
3. Root `bun run build` tidak pernah membangun aplikasi web. Ini akar dari semua
   laporan "sudah build tapi halaman lama".

Sisanya adalah utang yang murah dibereskan dan satu bug kehilangan data.

## 2. Baseline terukur

Semua angka di bawah diukur sesi ini pada stack hidup.

| Jalur | Angka | n | Catatan |
|---|---|---|---|
| Muat awal web (mentah) | 421 KB | 1 | `index` 252 KB + `id` 110 KB + CSS 68 KB |
| Muat awal web (gzip) | 117 KB | 1 | dihitung lokal dari berkas yang sama |
| Dikirim di kabel | 421 KB | 1 | `Content-Encoding` kosong, `transferSize` = `decodedBodySize` |
| Ekspor APAR bulanan | 536 ms | 3 | 527 / 536 / 559 |
| Ekspor kartu APAR | 544 ms | 3 | 541 / 544 / 555 |
| Ekspor Hydrant bulanan | 1186 ms | 3 | 1089 / 1186 / 2238 (run pertama dingin) |
| Lantai Gotenberg, tanpa delay | **328 ms** | 5 | 215 / 246 / 328 / 336 / 354. Probe pertama saya salah: memakai `waitDelay=300ms` yang tidak ada di produksi. |
| Lantai Gotenberg, 150ms (produksi) | **477 ms** | 5 | 384 / 472 / 477 / 484 / 495 |
| Gotenberg, tabel 40 baris, 150ms | 441 ms | 5 | 410 / 434 / 441 / 493 / 500. Ukuran dokumen hampir tidak berpengaruh. |
| Typst, dokumen 4 halaman A4 | **74 ms** | 9 | 69 / 71 / 73 / 74 / 76 / 77 / 79 / 86, termasuk spawn proses |
| API baca biasa | 5 sampai 14 ms | 9 per endpoint | tercepat `/api/pdf-jobs` 4,6 ms, terlama `/api/zones` 13,1 ms |
| Build web | 25,3 s | 1 | dari 9,1 s root build, sisanya `tsc -b` |
| RAM Gotenberg | 371 MiB | 1 | 14 proses, 872 MB RSS dijumlah, 7 Chromium |
| Image Gotenberg | 2,46 GB | 1 | |
| Image API | 678 MB | 1 | 302 MB di antaranya `node_modules` dev |
| Sampah `/tmp` Gotenberg | 286 MB | 1 | empat direktori yatim sejak 13 Okt |
| Build cache Docker | 4,4 GB | 1 | bisa direbut kembali |
| `pdf_jobs` | 1000 baris | 1 | 966 selesai, 33 gagal, 1 menggantung, 34 tanpa objek |

## 2b. Tech stack

Kolom "Sesudah" adalah usulan. Yang tidak berubah saya tulis tetap, karena tidak
ada angka yang menunjuk ke sana.

| Lapis | Sekarang | Sesudah | Alasan |
|---|---|---|---|
| Web UI | Vite 8, React 19, TS 6, Tailwind v4 | **tetap** | tidak ada angka yang menunjuk ke sini |
| Server state | TanStack Query v5 | **tetap** | cache dan invalidasi sudah benar |
| API | Hono 4.11 di Bun 1.4, image 678 MB, sumber di-bind-mount | **Hono di Bun, image produksi multi-stage tanpa devDeps** | 678 MB jadi sekitar 150 MB |
| Auth | Better Auth 1.4 + plugin organization, sesi DB | **tetap** | hash scrypt terbukti portabel |
| DB | Postgres 17, Drizzle 0.44, postgres-js | **tetap, tambah indeks** | 4 indeks FK hilang |
| Storage | Garage 2.3 S3 | **tetap** | batas presigned yang membuat foto bisa diambil luar |
| PDF | Gotenberg 8, Chromium, 2,46 GB, 371 MiB, lantai 558 ms | **Rust: `axum` 0.8.9 + `typst` 0.15.1 + `typst-pdf`** | 74 ms, tanpa browser, hapus 2,4 GB |
| Proxy | Caddy 2.11.7 | **tetap, tambah `encode zstd gzip`** | 421 KB jadi 117 KB |
| Tooling | Bun | **tetap** | hanya build dan dev |

Versi Rust di atas dibaca dari crates.io sesi ini, bukan dari ingatan.

## 3. Keputusan Rust

Kamu bilang Rust lebih disukai dan tidak masalah mengganti stack. Saya pakai Rust
di satu tempat saja, dan menolak di tempat lain. Alasannya angka, bukan selera.

**Rust ya, untuk PDF, tapi bukan karena kecepatan.** Setelah probe saya
dikoreksi, lantai Gotenberg tanpa delay adalah 328 ms, bukan 558 ms. Ekspor APAR
536 ms jadi sekitar 150 ms, jadi hematnya sekitar 386 ms, bukan 7x. Yang tetap
benar adalah biaya diamnya: 371 MiB RAM, 2,46 GB image, dan 286 MB `/tmp` yatim
untuk pekerjaan yang tidak butuh browser. Kecepatan adalah bonus, bukan alasan.

Alasan sebenarnya adalah kontrol format. Kamu bilang formatnya akan kamu setir
sendiri lewat saya untuk klien. Itu mengubah kriterianya: yang diukur bukan
milidetik, tapi berapa lama satu perubahan layout bisa kamu lihat. Typst
mengalahkan HTML di situ, karena tabel, satuan mm, dan pengulangan header
dinyatakan langsung, bukan lewat emulasi CSS paged media. Ia juga punya
`typst watch` dan tinymist, jadi iterasi layout bisa dilihat langsung.

Tapi ada satu syarat yang tidak bisa saya tawar. Format yang kamu setir harus
dinyatakan sebagai data, bukan sebagai kode. Kalau setiap permintaan klien
berarti saya mengedit berkas Typst, kita hanya memindahkan pekerjaan. Jadi
kontraknya: satu skema dokumen, satu mesin render, dan format adalah parameter.

**Rust tidak, untuk API.** API sekarang 5 sampai 14 ms. Limiternya bukan Node,
melainkan round trip Postgres dan pembacaan sesi tiga kali per request. Rewrite ke
Axum akan memberi 2 sampai 4 ms pada endpoint yang sudah di bawah ambang persepsi,
dengan biaya menulis ulang 21 route, Better Auth, dan seluruh lapisan tipe yang
sekarang dijaga `hc<AppType>`. Itu kerja besar yang tidak dibayar. Perbaikan API
yang sebenarnya adalah indeks, cookie cache, dan menghapus satu query, dan itu
murah di TypeScript.

Kalau kamu tetap mau API ditulis ulang ke Rust, itu keputusanmu dan saya kerjakan.
Tapi default saya, dan rekomendasi saya, adalah Rust hanya di jalur PDF.

Bukti kelayakan yang saya periksa sendiri sebelum mengusulkan ini:

- Hash kata sandi tersimpan memakai scrypt N=16384, r=16, p=1, dkLen=64, garam
  sebagai string hex. Saya buktikan cocok dengan `node:crypto` pada akun demo.
  Artinya Rust bisa memverifikasi hash lama apa adanya tanpa memaksa reset.
- Cookie sesi 79 karakter, dua segmen, `HttpOnly`, `SameSite=Lax`, umur 7 hari.
  Formatnya bisa dibaca Rust, tapi karena API tetap TypeScript, ini hanya relevan
  bila kamu memilih rewrite penuh.

## 3b. Format sebagai data, bukan sebagai kode

Ini inti permintaanmu. Kamu mau menyetir format untuk tiap klien. Kalau tiap
permintaan berarti saya mengedit template, itu tidak scalable dan kamu bergantung
pada saya untuk hal sepele.

Kontraknya tiga lapis:

1. **Data.** API mengirim dokumen terstruktur, bukan HTML. `{ kop, meta, tabel,
   blokFoto, tandaTangan, catatanKaki }`. Bentuk ini sudah ada di
   `exports.ts` sebagai `HydrantMonthlyData` dan kawan-kawan, tinggal dijadikan
   satu tipe `Dokumen` bersama.
2. **Profil format.** Berkas konfigurasi per klien, bukan kode. Isinya: ukuran
   kertas, margin, orientasi, font, ukuran font, warna aksen, kolom mana tampil
   dan urutannya, lebar kolom, header berulang, label, dan kop. Satu berkas per
   klien, misalnya `format/klien-abc.json`.
3. **Mesin render.** Satu berkas Typst yang membaca data plus profil dan
   menghasilkan PDF. Tidak ada satu baris pun khusus klien di dalamnya.

Yang bisa kamu ubah tanpa menyentuh kode: kop dan logo, urutan dan keberadaan
kolom, lebar kolom, margin dan ukuran kertas, font dan ukuran, label, footer,
blok tanda tangan, dan jumlah foto per baris. Yang tetap butuh saya: struktur
baru yang belum pernah ada, misalnya tabel bersarang atau halaman landscape di
tengah dokumen.

Untuk melihat hasilnya, saya siapkan satu perintah yang merender PDF contoh
dengan profil mana pun. Kamu bilang "geser kolom Catatan ke kiri, kecilkan font
jadi 7pt", saya ubah profil, kamu lihat PDF-nya. Itu loop yang kamu minta.

Batas jujurnya: saya belum membuktikan bahwa profil JSON bisa menampung semua
variasi yang klien minta. Itu harus diuji dengan 2 atau 3 contoh nyata sebelum
saya janjikan. Kalau ternyata tidak muat, kita tambah satu lapis, bukan bongkar
ulang.

## 3c. Stack lain yang saya pertimbangkan

Saya cari dan bandingkan, bukan hanya mengandalkan ingatan.

| Opsi | Kontrol format | Berat | Kecepatan | Putusan |
|---|---|---|---|---|
| Gotenberg 8 (sekarang) | CSS, sudah dikuasai | 2,46 GB, 371 MiB | 441 ms untuk 40 baris | tetap sampai migrasi selesai |
| **Typst** | bahasa layout sendiri, mm dan grid langsung | 21 MB biner, 0 MiB diam | 74 ms | **dipilih** |
| WeasyPrint | CSS paged media, tanpa JS | image Python besar | lebih lambat dari Chromium | tolak, CSS-nya tertinggal dari Chrome |
| PrinceXML | CSS paged media terbaik | komersial, lisensi mahal | cepat | tolak, biaya lisensi untuk kebutuhan internal |
| pdf-lib / PDFKit / pdfmake | koordinat manual | kecil | cepat | tolak, menggambar tabel manual itu kerja tanpa akhir |
| react-pdf | komponen React, sudah familiar | kecil | cepat | tolak, kontrol layout lebih lemah dari Typst untuk formulir kertas |
| LaTeX | kontrol total | 1 GB+ | sedang | tolak, kurva belajar dan sintaksisnya paling kejam |

Yang membuat Typst menang bukan kecepatan, tapi bahwa satuan dan grid adalah
konsep kelas satu. Untuk formulir kertas yang harus presisi, itu mengurangi
tebak-tebakan. Ia juga punya `typst watch` dan tinymist untuk pratinjau langsung,
yang persis dibutuhkan loop "kamu setir, saya ubah".

Catatan penting soal P3K. Formatnya landscape 21 kolom, dan itu justru kasus
terbaik untuk Typst karena lebar kolom bisa dinyatakan dalam pecahan halaman,
bukan ditebak lewat CSS.

## 3d. Biaya sebenarnya, setelah probe saya dikoreksi

Probe pertama saya memakai `waitDelay=300ms` yang tidak ada di produksi. Setelah
dikoreksi, lantai Gotenberg tanpa delay 328 ms, dengan 150ms produksi 477 ms, dan
dokumen 40 baris 441 ms. Artinya ukuran dokumen hampir tidak berpengaruh; yang
mahal adalah menghidupkan Chromium.

Jadi klaim yang benar:

- Ekspor APAR 536 ms turun ke sekitar 150 ms. Hemat sekitar 386 ms.
- Ekspor Hydrant 1186 ms turun ke sekitar 150 ms. Hemat sekitar 1 detik, karena
  sebagian besar waktunya foto, dan itu diperbaiki terpisah.
- PDF Hydrant sekarang 4,3 MB untuk satu halaman karena foto 3,7 MB ikut masuk.
  Setelah filter `temuan` diperbaiki, ukurannya turun drastis tanpa menyentuh
  mesin render.
- 371 MiB RAM diam, 2,46 GB image, 286 MB `/tmp` yatim, hilang seluruhnya.

Kecepatan bukan alasan utama. Kontrol format dan biaya diam yang jadi alasan.

## 4. Fase

Setiap fase punya predikat lulus sendiri dan diverifikasi sebelum fase berikutnya.
Urutannya dari risiko terendah dan hasil terbesar.

### Fase 0, pin perilaku dan template yang belum final

Tujuan: bisa membuktikan perubahan tanpa merusak perilaku, dan menutup dulu
kebohongan di PDF yang sekarang.

Template PDF belum final. Saya ambil lima PDF dari jalur hidup, bukan dari spike,
dan ini yang rusak:

- **Section B memuat foto bukti, bukan temuan.** `hydrant-monthly.pdf` hidup
  menampilkan caption `Bukti inspeksi` dan `bukti-inspeksi` di bawah judul
  "Catatan Hasil Temuan". Itu foto `temuan=false`. Penyebabnya bukan template,
  tapi `apps/api/src/routes/exports.ts:93`: query tidak memfilter `temuan`, jadi
  ketiga foto satu rekam masuk. Akibatnya PDF Hydrant yang hidup **4,3 MB untuk
  satu halaman**, karena satu foto 3,7 MB ikut tercetak.
- **Lokasi tercetak "Lokasi Fasilitas Utama".** `siteName` di PDF adalah
  `Utama`, bukan "Central Warehouse Logistics". Kop surat salah.
- **P3K kehilangan baris TANGGAL INSPEKSI dan PARAF.** `spec/06-print.md` baris
  12 mewajibkannya, dan bentuk kertasnya punya baris itu. Spike punya, template
  hidup tidak. Grep `templates.ts` untuk `TANGGAL INSPEKSI` nol hasil.
- **APAR bulanan tidak 2 halaman.** `spec/06-print.md` baris 10 minta halaman 1
  tabel, halaman 2 kedaluwarsa + Catatan + tanda tangan. Hasil hidup 1 halaman,
  dan blok "Catatan :" kosong untuk tulis tangan tidak ada.
- **P3K dan Patroli belum pernah lewat jalur hidup.** Tidak ada fixture, jadi
  tidak pernah dibuktikan. Patroli hidup hanya punya 0 temuan.
- **Patroli 2 halaman dengan halaman 2 kosong** di spike lama.

Golden file Fase 0 karenanya tidak boleh diambil dari kondisi sekarang. Urutannya:
perbaiki lima cacat di atas lebih dulu di template yang ada, baru bekukan golden.
Kalau tidak, kita membekukan yang salah.

- `scripts/bench/` berisi tiga probe yang sudah saya tulis sesi ini, dirapikan.
- Golden file lima PDF, diambil setelah cacat di atas ditutup.
- `check.ts` 65 cek sebagai gate wajib.

Lulus bila: lima cacat tertutup dan dibuktikan dengan PDF baru, tiga probe jalan
dari repo, golden tersimpan.

### Fase 0b, keputusan yang hanya kamu bisa jawab

Ini bukan pertanyaan teknis, jadi saya tidak bisa menyimpulkan sendiri:

1. Foto di Section B kertas, hanya temuan, atau temuan plus bukti dalam dua blok
   terpisah?
2. APAR bulanan tetap 1 halaman atau 2 halaman sesuai spec?
3. P3K perlu baris TANGGAL INSPEKSI dan PARAF di PDF, atau cukup di layar?
4. Nama lokasi di kop: nama situs, atau "Lokasi Fasilitas Utama" memang disengaja?

Sampai empat ini dijawab, Fase 3 tidak boleh mulai, karena yang dibandingkan
belum jelas.

### Fase 1, kemenangan gratis tanpa ganti stack

- `encode zstd gzip` di blok `:80` Caddy. Ini satu baris dan memberi 240 KB per
  kunjungan dingin, juga mengecilkan JSON API.
- Perbaiki root build supaya membangun web, dan ganti nama paket `preview` menjadi
  `@viaannn/web`. Ini menghapus akar stale bundle.
- Hapus aset mati. Lima `finding-*.png` 714 KB tanpa rujukan, `icons.svg`,
  `hero.png`, `react.svg`, `vite.svg`. Hapus juga dua komponen tanpa pemakai
  `StatCard` dan `PageHeader`, atau pakai keduanya. Jangan simpan dua-duanya.
- `handle /findings/*` dengan cache panjang, sekarang jatuh ke `no-cache`.
- Gotenberg, `--chromium-idle-shutdown-timeout=60s`. Turun dari 371 MiB ke sekitar
  35 MiB saat diam. Bersihkan 286 MB `/tmp` yatim dengan recreate sekali.
- Pin `caddy:latest` ke 2.11.7, hapus publikasi port Postgres 5433.
- Perbaiki `doctor.mjs` cek port 5173 yang selalu lulus.
- Tambah batas memori untuk gotenberg dan postgres.

Lulus bila: probe muat awal menunjukkan transfer di bawah 130 KB, `docker stats`
Gotenberg di bawah 60 MiB saat diam, root build menghasilkan hash baru di `dist`.

### Fase 2, kebenaran yang juga kecepatan

Temuan explorer yang paling serius bukan kecepatan, tapi kehilangan data diam.

- Semua endpoint daftar dipotong di 100 baris dan `nextCursor` tidak pernah dibaca.
  Unit ke-101 tidak terlihat, tanpa error. Ini bug produksi. Perbaiki dengan
  `siteId` dan `period` di query, lalu paging atau batas eksplisit dengan banner.
- Filter bulan di klien padahal server bisa melakukannya. Pindahkan ke `where`.
- Patroli memanggil satu request per laporan untuk findings. Satu join.
- `petakanKartuApar` menghitung 12 bulan untuk semua unit padahal hanya satu yang
  dibaca, dan berjalan setiap ketikan. Bungkus `useMemo`, hitung untuk unit aktif.
- `HydrantPage` tidak memoisasi filter dan hitungan yang halaman APAR sudah
  memoisasi. Tiga baris.
- Hapus pre-check duplikat bulan yang sudah dijamin unique index, petakan `23505`.

Lulus bila: `check.ts` tetap 65/65, probe API tidak naik, dan uji 120 unit
menampilkan 120 baris.

### Fase 3, layanan PDF Rust menggantikan Gotenberg

Ini fase utama, dan satu-satunya perubahan stack.

- Crate `apps/pdf` dengan Axum, menerima JSON terstruktur, bukan HTML. Lima
  template ditulis sebagai template Typst, bukan string HTML.
- Font Inter disematkan sebagai berkas di crate, bukan base64 64 KB di setiap
  request. Typst menyematkan font ke PDF, terbukti dua `/FontFile` pada probe.
- Gambar diambil langsung dari Garage lewat presigned internal, tanpa melewati
  Chromium.
- API memanggil crate ini lewat HTTP internal, atau sebagai `cdylib` bila lebih
  sederhana. Pilih setelah spike, bukan sekarang.
- `pdf_jobs` akhirnya berperilaku seperti namanya. POST mengembalikan 202 dengan
  status `queued`, render jalan di latar, klien yang sudah punya loop polling
  dipakai. Batasi render bersamaan.
- Hapus container Gotenberg, image 2,46 GB, dan seluruh dependensi Chromium.

Lulus bila: lima PDF baru dibandingkan dengan golden Fase 0, A4 portrait dan
landscape benar, p50 ekspor di bawah 150 ms, dan tidak ada container Chromium lagi.

### Fase 4, perbaikan API tanpa rewrite

- Empat indeks FK yang hilang, `photos(hydrant_inspection_id)`,
  `photos(apar_inspection_id)`, `safety_patrol_findings(report_id)`,
  `p3k_inspection_items(inspection_id)`. Sekarang semuanya seq scan.
- Indeks `(company_id, period)` dan `(company_id, expired_date)`.
- Hapus query organisasi ketiga di `requireSession`, FK sudah menjaminnya.
- `cookieCache` 300 detik supaya sesi tidak dibaca dari DB tiap request.
- Proyeksi kolom eksplisit, berhenti `select()` semua kolom.
- Opsi pool eksplisit dan `statement_timeout`.
- Presign foto paralel, buang `HeadObject` yang berlebihan.

Lulus bila: probe API membaik atau sama pada setiap endpoint, `check.ts` 65/65.

### Fase 5, dekomposisi halaman

- `HydrantPage` 1139 baris dan `AparPage` 1090 baris dipecah jadi berkas sekitar
  200 baris, sesuai peta explorer. Tabel, kartu, toolbar, Section B, cetak,
  ringkasan jadi berkas sendiri.
- Primitif bersama yang sekarang terduplikasi, `MonthSwitcher`, `FilterTabs`,
  `ComponentChips`, `StatusBadge`, `useHapusCakupan`, shell tabel.
- Modal di-`lazy()` karena tidak dirender sampai diklik.
- `HseCalendar` mengelompokkan laporan sekali, bukan `parseISO` 42 kali.

Lulus bila: build hijau, tidak ada berkas di atas 220 baris, paritas visual
dibuktikan di browser pada kedua halaman, dan tidak ada baris terduplikasi yang
hanya dipindah.

### Fase 6, gerbang produksi

- Satu workflow CI, build, `check.ts`, probe. Sekarang tidak ada CI sama sekali.
- Tidak ada satu pun unit test di repo. Tambah untuk kalkulator status, tanggal,
  dan pemetaan sel, karena itu logika yang paling mudah salah dan paling murah
  diuji.
- Hapus 1000 baris `pdf_jobs` lama dan 34 objek tanpa berkas, plus retensi.
- Perbaiki `wiki/SKILL.md` yang menyuruh restart Caddy padahal tidak perlu.

## 5. Yang saya tolak

- Menulis ulang API ke Rust. Angka di bagian 3.
- Mengganti Garage. 28 MB diam, 99,8 MB image, dan batas presigned-nya yang
  membuat foto bisa diambil dari luar. Diganti bind mount berarti kehilangan itu.
- Virtualisasi tabel. Data nyata 4 unit. Itu belum masalah.
- Mengganti Vite atau React. Tidak ada angka yang menunjuk ke sana.

## 6. Risiko

- Typst harus meniru lima formulir kertas persis. Ini risiko terbesar dan alasan
  golden file dibuat lebih dulu. Bila paritas tidak tercapai pada satu template,
  template itu tetap di Gotenberg dan sisanya pindah. Migrasi per template, bukan
  semuanya sekaligus.
- `encode` di Caddy mengubah byte di kabel. Verifikasi dengan probe yang membaca
  `Content-Encoding`, bukan dengan mata.
- Fase 3 menyentuh jalur ekspor yang dipakai. Golden diff adalah gerbangnya.

## 7. Yang saya butuhkan darimu

1. API ikut ditulis ulang ke Rust, atau tetap TypeScript dan Rust hanya di jalur
   PDF. Default saya yang kedua.
2. Empat pertanyaan template di Fase 0b. Ini yang menentukan bentuk golden file.

Fase 1 dan 2 tidak bergantung pada dua hal itu, jadi saya bisa mulai dari sana
begitu kamu bilang jalan.
