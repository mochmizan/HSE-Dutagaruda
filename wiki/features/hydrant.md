# Inspeksi Hydrant

Halaman pola master (aksen `#eb5757`): cangkang bersama
`features/inspeksi/InspectionPageShell.tsx` + konfigurasi per kategori
`inspectionConfig.ts` (`KONFIG_HYDRANT`: remah, judul, deskripsi `6 komponen`,
`Tambah Zona & Unit`, `hydrant-monthly`, ikon Flame) + status kosong bersama
`EmptyUnits.tsx` (varian Hydrant dua tombol, biru aksi `#2f80ed`): kop cetak +
kepala + 2 statistik + tabs + tabel/kartu + `HydrantFindings` + tanda tangan +
modal, klik baris membuka modal inspeksi 6 komponen, Section B
temuan foto di bawah, cetak A4 portrait (tabel + temuan + tanda tangan 3
kolom). Semua hook tetap di `HydrantPage` dengan urutan asli; shell
presentasional saja.

## Sub-features

- `hydrant-open` membuka modal inspeksi dari klik baris tabel.
- `hydrant-save` menyimpan 6 komponen + foto + catatan + override lewat
  `Terbitkan` (biru `#2f80ed`; sebelumnya tombol merah `Selesaikan &
  Terbitkan Laporan`, tombol `Simpan Sebagai Draft` dihapus Okt 17).
  Istilah select komponen: `STANDAR` / `TIDAK STANDAR` / `HILANG` (nilai
  API tetap `LAYAK` / `TIDAK_LAYAK` / `HILANG` — jangan samakan teks
  dengan nilai). Kontrak catatan (Okt 17, revisi terbit-reaksi): blok
  foto paling ATAS di form = SATU kartu selebar satu kolom (`grid
  grid-cols-2` berisi kartu itu saja): label + tombol unggah di baris
  atas, pratinjau foto BERTUMPUK di bawahnya (`w-full h-auto
  object-contain`, tanpa kotak rasio/`object-cover`), placeholder
  bergaris putus `Belum ada foto` saat kosong, tiap kartu komponen SELALU
  memuat kotak komentar — terkunci
  (`Komponen standar — tanpa catatan`) saat status `LAYAK`, bisa diisi
  saat `TIDAK STANDAR` / `HILANG` (termasuk `HILANG` sendirian),
  label catatan bebas jadi `Catatan Temuan
  Tambahan` diikuti textarea `Tindakan Rekomendasi / Tindak Lanjut
  (opsional)`; terbit menyatukan komentar komponen + tambahan + tindak
  lanjut ke satu `notes` sebagai baris berlabel (`Box Hydrant: …`,
  `Catatan: …`, `Tindak Lanjut: …` via `susunCatatan`), dibuka-ulang
  diurai balik (`uraiCatatan`). Kolom Catatan tabel merender gabungan itu
  sebagai daftar baris-per-baris (split `\n`), bukan kalimat berkuotasi.
- `hydrant-shell` (Okt 27): `HydrantPage` dirender lewat `InspectionPageShell`
  dengan `KONFIG_HYDRANT` (kepala: remah, judul, deskripsi `6 komponen`,
  `Tambah Zona & Unit`, ekspor `hydrant-monthly`, ikon Flame); Section A
  memakai `EmptyUnits` varian Hydrant (dua tombol, biru `#2f80ed`); slot
  shell = kop cetak → statistik → saring → isi (judul cetak A + tabel/kartu) →
  `HydrantFindings` → tanda tangan → modals. Tanpa perubahan perilaku.
- `hydrant-terbit-state` — terbit = sifat REKAM TERPERSISTENSI, bukan state
  lokal modal: kolom `hydrant_inspections.approval_status`
  (`DRAFT|DIAJUKAN|DIKETAHUI|DISETUJUI`); baris terbit bila
  `approvalStatus !== 'DRAFT'`. Klik `Terbitkan` menulis `DIAJUKAN`; baris
  jangkar unggah foto (tanpa terbit) tetap `DRAFT`. Penanda `terbit` di modal
  hanya punya SATU penulis — efek `[isOpen, inspeksi?.id,
  inspeksi?.approvalStatus]` — jadi ia cerminan rekam, bukan dugaan lokal:
  penerbitan yang gagal tak menyisakan potret `Terbit` palsu, dan `Edit` yang
  gagal tak menyisakan form terbuka di atas rekam terbit. Karena itu tutup +
  buka-ulang modal unit terbit tetap baca-saja (`fieldset` dinonaktifkan;
  unggah/hapus foto disembunyikan; badge `Terbit` di header) — baris `DRAFT`
  tetap terbuka dalam modus sunting.
  Tombol utama berganti `Edit` yang berarti BATALKAN TERBIT:
  `useBatalkanTerbitHidran` menulis SATU medan (`approvalStatus: 'DRAFT'`) pada
  id yang sedang tampil — satu medan supaya cache lama tak menimpa kolom lain —
  dan menulis baris balasan server ke cache, sehingga baris keluar dari tab
  `Selesai Diperiksa`: `petakanUnitHidran` (`services/api/queries.ts`)
  memetakan `DRAFT` ke `SEDANG_BERJALAN` (tab On Progress, tombol kartu
  `Lanjutkan`) dan `!= DRAFT` ke `SELESAI`. Terbitkan ulang memakai id rekam
  yang sama. Kedua arah ditunggu: selama proses tombol berbunyi `Membatalkan…`
  / `Menerbitkan…` dan nonaktif, dan potret tidak berubah sebelum server
  menjawab; bila tulisan gagal, potret bertahan dan pesannya lewat alert
  mutasi. Saat mode terbit, kontrol unggah foto
  hilang dari kartu `Bukti Inspeksi`; modal tanpa `Batal`.
  Unggah foto tidak menunggu terbit: bila belum ada
  rekam bulan+unit, unggahan membuat baris inspeksi jangkar lalu menempel
  fotonya, dan baris jangkar itu tetap `DRAFT` (ikut terbaca sedang
  berjalan, bukan selesai).
- `hydrant-delete-scope` (Okt 18, revisi "double hapus"): satu tombol `Hapus`
  yang artinya bergeser menurut ada/tidaknya rekam bulan diganti DUA label
  tetap — baris tabel adalah UNIT, rekam inspeksi hanya anaknya per bulan,
  jadi hapus tidak menunggu batal-terbit. `Hapus unit` (selalu ada, termasuk
  saat terbit) menghapus unit + seluruh rekam + seluruh foto, lalu menutup
  modal; `Kosongkan bulan ini` (hanya bila ada rekam bulan tampil)
  menghapus rekam bulan itu + fotonya, unit tetap ada dan kembali
  "Belum Dimulai". Keduanya lewat `ConfirmModal` dengan tombol
  `Batal` + `Ya, hapus` — judul/pesan menyebut cakupannya
  (`Hapus Unit` / `Kosongkan Inspeksi Bulan Ini`). `Edit` tetap murni
  non-destruktif: hanya batalkan terbit, tak pernah menghapus. Zona yang
  kosong (tak ada unit tersisa) ikut dihapus oleh hook, bukan laman.
- `hydrant-foto-jenis` (Okt 18): kolom `photos.temuan` (boolean, default
  `false`; migrasi `0004_natural_franklin_richards.sql`) memisah dua
  dokumentasi pada satu rekam. Unggahan kartu `Bukti Inspeksi` menulis
  `temuan=false` dan TIDAK tampil di Section B; `Tambah Temuan` menulis
  `temuan=true` dan HANYA itu yang tampil di Section B (`findings =
  foto.filter(f => f.temuan)`). Daftar foto bukti di modal dibaca dari API
  (`useFotoInspeksi(inspeksiAktif)`, saring `!temuan`) — bukan state sesi —
  jadi foto tidak hilang saat modal ditutup atau halaman dimuat ulang.
- `hydrant-add-unit` mendaftarkan zona + kode unit non-sekuensial via modal.
- `hydrant-finding` menambah temuan Section B (foto wajib + caption).
- `hydrant-print` (Nov 16, tanpa Gotenberg): `UnduhPdfButton` membuka
  pratinjau prosedural (`?cetak=hydrant&bulan=` + `autoprint=1`,
  cetak/simpan via dialog browser); PDF server
  (`POST /api/export/hydrant-monthly/:refId` → polling
  `GET /api/pdf-jobs/:id`) kini generator PDF 1.4 murni
  (`apps/api/src/pdf/render.ts`, tanpa container). Isi kertas: checklist foto per baris (kolom Dokumentasi
  Pemeriksaan = bukti pertama, Dokumentasi Checklist = temuan pertama/bukti
  kedua) + Section B temuan; ejaan status "Layak digunakan …" (baku).
- `hydrant-laporan` (Nov 15): printable kedua, kategori ekspor
  `hydrant-laporan` (**landscape** A4, satu-satunya hydrant landscape):
  tombol `Unduh Laporan` di atas tabel Section A (di luar PageHeader supaya
  urutan Unduh PDF → Cetak kepala tidak berubah) → `POST
  /api/export/hydrant-laporan/:refId` → polling pdfJobs yang sama. Tanda
  komponen ✓/X/-, tanggal `dd-Mmm-yy` dari createdAt rekam, petugas
  `Pengawas K3` (rekam belum punya kolom pemeriksa — sama dengan tabel
  layar), lokasi `ITJ <SITE>`. Kop kiri/kanan teks (tidak ada aset logo
  dutagaruda/ITJ terpisah di repo; banner gabungan hanya dipakai kertas 1).
- `hydrant-print-preview` (Nov 15): rute pratinjau `?cetak=hydrant&bulan=YYYY-MM`
  (view `hydrant-cetak`, hard-reloadable) merender kedua kertas lewat komponen
  yang SAMA (`HydrantPrintKertas` + `selaluTampil`, tanda tangan ikut) dari
  query live yang sama dengan laman; tombol `Pratinjau Cetak` di atas tabel
  Section A membuka tab baru, tombol `Cetak / Simpan PDF` memanggil
  `window.print()`; kertas terang (putih/hitam) walau mode gelap.
- `hydrant-print-browser` (Nov 15): `Cetak` merender KEDUA kertas berurutan
  via `HydrantPrintKertas` (`HydrantPrintChrome.tsx`, `hidden print:block`,
  jeda halaman; kertas 2 lewat `@page` landscape bernama) dari data live
  yang sama (unit + inspeksi + foto site+period; bukti per rekam diambil
  via `ambilFotoInspeksi`). Pembungkus `.hyd-print-area` adalah anak pertama
  cangkang sehingga aturan `@media print` menyembunyikan semua saudara
  (krom + tabel layar) saat mencetak — tanpa menyentuh berkas laman/tabel
  lain.
- `hydrant-delete-month` → diganti `hydrant-delete-scope` (Okt 18, di atas):
  tidak ada lagi satu tombol `Hapus` yang berganti arti; hapus rekam bulan
  = `Kosongkan bulan ini`, hapus baris = `Hapus unit` (tersedia juga saat
  terbit). Kartu statistik memakai gradien (emerald pada kartu Selesai).
- Tabel utama memakai garis grid penuh (border tiap sel via arbitrary
  variant `[&_th]:border … [&_td]:border …` pada `<table>`, token
  `--border`, `border-collapse` menggabung jadi garis tunggal) — Okt 18,
  sama di tabel utama APAR.
- Kunci lebar tabel (Nov 15): tabel memakai table-fixed + colgroup 7 kolom
  (64/96/120/224/140/200/184px, total 1028px, sama dengan APAR); div isi sel
  Verifikasi dibatasi max-w-[224px] sehingga chip membungkus bukan melar;
  Keterangan sudah capped 3 baris via KeteranganTeks, tanpa max-w tambahan.

## How to get to it (user POV)

- Pilih `Inspeksi Hydrant` di sidebar.
- Klik satu baris tabel unit → modal `Formulir Pemeriksaan`.
- Tombol tambah unit/zona di atas tabel (find-or-create zona duplikat).
- Form `Tambah` Section B di bawah tabel (grid `PhotoCard` 2 kolom).
- Hapus di modal inspeksi: `Hapus unit` (selalu ada, termasuk saat terbit)
  dan `Kosongkan bulan ini` (bila ada rekam bulan tampil) — keduanya
  `Ya, hapus` setelah konfirmasi; laporan final saat simpan, tanpa alur
  persetujuan.
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
- **Terbit browser.** Di modal, ubah satu select komponen + kotak
  komentarnya + catatan, lalu `Terbitkan` (tombol simpan draf dan
  `Batal` sudah tidak ada). Buka ulang modal: nilai tersimpan
  (tampilan kedua). Foto: slot `Bukti inspeksi` mengunggah ke
  `/api/uploads` dan bertahan di daftar foto sesi.
- **Bukti.** Simpan `units.json`, `inspections.json`, snapshot teks-body
  modal terbuka, dan `PROOF.md` (ID fitur `hydrant-open`, entry yang
  dipakai) di `wiki/artifacts/<run-id>/hydrant/`.

## Gotchas

- Kartu statistik tinggal 2 (Total + Selesai Diperiksa; kartu Progress dan
  Kemajuan dihapus total Okt 17): kartu Total polos (border + teks
  berwarna saja), kartu Selesai Diperiksa bergradien emerald halus —
  jangan asert keduanya tanpa gradien. Emoji ikon kartu UTF-8 langsung —
  pernah rusak jadi mojibake (penulis non-UTF-8); sapu karakter asal ð bila muncul lagi.
- Mojibake double-encode (`â€¢` `â€œ` `â€“`) pernah lolos ke tabel
  Verifikasi 6 Komponen (chip `Hose Rackâ€¢`, catatan, dash). Sapu tiga
  inilah bila muncul lagi — tulis karakter UTF-8 langsung (• “ ” –).
- Kotak □ di sel Catatan = karakter kontrol U+009D yang menyusup di sumber
  JSX tepat sesudah map baris catatan (HydrantPage L855, Okt 18) — disapu
  habis (satu-satunya di kedua halaman); sel kini hanya merender baris
  `split('\n')`. Jangan tempel teks dari luar ke JSX tanpa sapu kontrol
  (`sapu-kontrol.js` di `%TEMP%\opencode` untuk audit).
- Aksen biru `#2f80ed` seragam lintas kategori untuk aksi utama (tidak
  mengikuti aksen halaman): `Tambah Zona & Unit`, `Tambah Temuan`, `+ Tambah Unit
  Baru` + `Tampilkan Semua Unit` (kosong), `Lanjutkan`/`Mulai Inspeksi`
  kartu, select + chevron pengalih bulan, `Terbitkan`, `Edit`. Tab
  aktif memakai pil putih tipis (`bg-white text-[var(--primary)]`,
  ketiga tab seragam, plus `dark:bg-[var(--bg-hover)]` — pil putih polos
  menenggelamkan teks pada mode gelap); badge jumlah tab TIDAK berubah
  warna saat tab
  aktif (`Sedang Berjalan` tetap amber-500/15, `Selesai Diperiksa`
  tetap emerald-500/15, `Semua Unit` netral) — jangan pernah putihkan
  badge; `Semua Unit` tetap merah `#eb5757`, `Selesai Diperiksa` tetap
  hijau. Pengalih `Tabel`/`Kartu` pakai komponen shared `ViewToggle`
  (`ui/Switchers.tsx`) — pil putih aktif seragam + varian dark, tanpa
  salinan inline per halaman (APAR sama).
- Bulan default halaman = bulan berjalan nyata (pernah hardcode September —
  jangan asert nama bulan statis).
- Subjudul modal inspeksi masih hardcode `Periode: September 2026` (tidak
  ikut bulan aktif halaman) — jangan asert teks `September` di modal;
  observasi produk dicatat Okt 17 (perbaikannya di luar lingkup wiki).
- Klik baris mati pada baris completed tanpa fallback modal = regresi
  (pernah terjadi; fallback ke modal wajib ada).
- Duplikat bulan: `POST` inspeksi dua kali untuk unit+period sama → 409 +
  notice Indonesia, bukan 500.
- Hapus foto DULU (`DELETE /api/photos/:id`) sebelum hapus inspeksi —
  children guards memblokir hapus parent-first.
- Presigned URL foto hanya resolve di dalam network Docker; dari host,
  tukar origin ke `caddy:80` seperti pola `fetchBytes` di `check.ts`.
