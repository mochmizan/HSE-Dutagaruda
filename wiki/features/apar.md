# Inspeksi APAR

Halaman gaya dokumen kertas (aksen `#f2994a`): cangkang bersama
`features/inspeksi/InspectionPageShell.tsx` + `KONFIG_APAR` (`inspectionConfig.ts`:
remah, judul, deskripsi `7 komponen`, `Tambah Zona & Unit`, `apar-monthly`,
ikon ShieldCheck) + status kosong bersama `EmptyUnits.tsx` (varian APAR tombol
tunggal tanpa tambah): seluruh isi APAR (kop bulanan, checklist, rekap,
tanda tangan, cip unit, kartu tahunan) menempati SATU slot `isi` supaya grup
cetak `apar-report-print` + `apar-card-print` tetap utuh — urutan: tabel hasil
pemeriksaan fisik unit APAR 7 komponen → rekap `B. Rekap Kadaluwarsa APAR` →
`Catatan :` (tulis tangan, HANYA saat cetak) + tanda tangan → cip Pilih APAR →
kartu tahunan 12 bulan (hanya-tampil). Cetak 2 halaman (hal. 1 tabel bulanan,
hal. 2 kedaluwarsa + Catatan + tanda tangan).

Kepadatan teks disamakan dengan Hydrant (Okt 27): judul `A. Hasil Pemeriksaan
Fisik Unit APAR` hanya dirender saat cetak, paragraf instruksi
(`Klik baris untuk melihat detail…`), subjudul rekap
(`Dihitung otomatis dari tanggal kedaluwarsa…`), dan label `Catatan :` di layar
dihapus. Label baris cip dipendekkan jadi `Pilih APAR`. Tidak ada perubahan
perilaku.

## Sub-features

- `apar-open` membuka modal inspeksi 7 komponen dari klik baris. Istilah
  select komponen: `STANDAR` / `TIDAK STANDAR` / `HILANG` (nilai API tetap
  `BAIK` / `TIDAK_BAIK` / `NA`; opsi ketiga tampil `HILANG` namun direkam
  `NA` — status akhir mengabaikan `NA`).
- `apar-publish` (Okt 18: terbit = sifat REKAM TERPERSISTENSI, bukan state
  lokal): kolom `apar_inspections.approval_status`
  (`DRAFT|DIAJUKAN|DIKETAHUI|DISETUJUI`, migrasi
  `0004_natural_franklin_richards.sql`; rekam lama di-backfill `DIAJUKAN`
  karena UI lama menampilkan setiap rekam tersimpan sebagai selesai).
  `Simpan Draft` menulis `DRAFT` (baris tetap `SEDANG_BERJALAN`, popup
  buka-ulang tetap sunting); `Terbitkan` menulis `DIAJUKAN` — ditunggu
  sebelum popup ditutup + record view dibuka, jadi terbit yang gagal tak
  menyisakan potret palsu. Buka-ulang rekam terbit = potret baca-saja
  (`fieldset` nonaktif, tombol unggah slot nonaktif, badge `Terbit`,
  `Simpan Draft` hilang); tombol utama berganti `Edit` = BATALKAN TERBIT
  (`useBatalkanTerbitApar`: satu medan `approvalStatus: 'DRAFT'` pada id
  tampil, ditunggu; label `Membatalkan…` selama proses). `petakanUnitApar`
  memetakan `DRAFT` → `SEDANG_BERJALAN`, selainnya → `SELESAI`.
  Catatan: PATCH satu-medan tidak menghitung ulang status akhir
  (`sentuhPenilaian`, `routes/inspections.ts`) — `Edit` tak menggeser nilai
  `overallStatus`/`overallOverridden` yang tersimpan. Terverifikasi live
  Okt 18 pada APAR dengan fixture override; hidran berbagi pola yang sama.
- `apar-yearcard` menandai baris bulan laporan; merah + teks tindak lanjut
  saat `X` — teks tindak lanjut kartu diambil dari `notes` gabungan,
  bukan dari field `tindakLanjut` (field itu belum terkirim ke API).
- `apar-expiry` menghitung rekap kedaluwarsa dari `expiredDate` unit
  terdaftar (No. format `1, 14, dan 15`), BUKAN dari inspeksi tersimpan.
- `apar-add-unit` mendaftarkan zona + unit via modal (find-or-create zona).
- `apar-print` mengunduh PDF / mencetak kartu via `Cetak Kartu`.
- `apar-delete-month` → diganti model dua cakupan (Okt 18, sama seperti
  hidran): `Hapus unit` (selalu ada, termasuk saat terbit: unit + seluruh
  rekam + foto, tutup modal) dan `Kosongkan bulan ini` (bila ada rekam
  bulan tampil: rekam + fotonya saja, unit kembali "Belum Dimulai").
  Keduanya lewat `ConfirmModal` (`Batal` + `Ya, hapus`);
  `Edit` tetap non-destruktif (hanya batalkan terbit). Zona yang kosong
  (tak ada unit tersisa) ikut dihapus oleh hook, bukan laman.
- `apar-shell` (Okt 27): `AparPage` dirender lewat `InspectionPageShell`
  yang sama dengan `KONFIG_APAR`; seluruh isi (kop bulanan, hasil pemeriksaan
  fisik unit APAR, rekap `B. Rekap Kadaluwarsa APAR`, `Catatan :` + tanda tangan, cip Pilih APAR `01–20`, kartu
  tahunan `AparYearCard`) menempati SATU slot `isi` supaya grup cetak
  `apar-report-print` + `apar-card-print` (2 halaman) tetap utuh; status kosong
  memakai `EmptyUnits` varian APAR (tombol tunggal `Tampilkan Semua Unit`,
  biru `#2f80ed`, tanpa tombol tambah — sama seperti sebelum shell); footer
  modal tetap `Simpan Draft | Hapus | Terbitkan`; primer biru `#2f80ed`;
  aksen terkunci `#f2994a`. Tanpa perubahan perilaku.
- Aksen biru `#2f80ed` seragam lintas kategori untuk aksi utama (tidak
  mengikuti aksen APAR `#f2994a`): `Tambah APAR`, select + chevron
  pengalih bulan, `Terbitkan`, tombol `Tampilkan Semua Unit` saat kosong.
  Tab aktif pil putih tipis seragam (`bg-white text-[var(--primary)]` +
  `dark:bg-[var(--bg-hover)]` untuk mode gelap), badge jumlah tab selalu
  netral; `Semua Unit` tetap merah, `Selesai Diperiksa` tetap hijau.
  Modal footer: `Simpan Draft` (hanya pra-terbit) + selalu `Hapus unit` /
  `Kosongkan bulan ini` + `Terbitkan` pra-terbit / `Edit` saat terbit
  (tanpa tombol `Batal`).
- Tabel utama memakai garis grid penuh (border tiap sel via arbitrary
  variant `[&_th]:border … [&_td]:border …` pada `<table>`, token
  `--border`, `border-collapse` menggabung jadi garis tunggal) — Okt 18.
  Rekap kedaluwarsa APAR sudah bergaris sejak awal (`border-r` per sel,
  print-aware).
- Pengalih `Tabel`/`Kartu` memakai komponen shared `ViewToggle`
  (`ui/Switchers.tsx`): pil putih aktif seragam dengan tab filter, plus
  `dark:bg-[var(--bg-hover)]` agar tetap kontras di mode gelap — tidak
  ada lagi salinan inline per halaman (Hydrant sama).

## How to get to it (user POV)

- Pilih `Inspeksi APAR` di sidebar.
- Klik baris tabel checklist → modal 7 komponen.
- `Terbitkan` → record view; `Edit` membuka ulang modal.
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
- **Terbit browser.** Klik baris → modal 7 komponen → `Terbitkan` →
  record view memuat badge + metadata + Verifikasi 7
  Komponen + Catatan + Bukti Foto. `Edit` membuka ulang modal inspeksi.
- **Kartu tahunan.** Baris bulan laporan ditandai; sel `X` merah + teks
  tindak lanjut. Rekam terbit terkunci (potret baca-saja + badge `Terbit`);
  sunting lewat `Edit` (= batalkan terbit), hapus lewat `Hapus unit` /
  `Kosongkan bulan ini` yang tetap tampil saat terbit.
- **Kedaluwarsa.** Rekap `B. Rekap Kadaluwarsa APAR` terhitung dari `expiredDate`
  unit terdaftar (unit tanpa satu pun inspeksi ikut muncul di rekap;
  terverifikasi live Okt 17) — jangan asert "dari inspeksi tersimpan".
- **Bukti.** `units.json`, `inspections.json`, snapshot record view +
  `PROOF.md` di `wiki/artifacts/<run-id>/apar/`.

## Gotchas

- Kartu tahunan hanya-tampil: tidak ada suntingan sel; sinkronisasi satu
  arah modal → tabel + kartu (draf menang atas laporan terbit).
- Report sintetis pasca-simpan tanpa id API (prefix `rep-`) → tombol Edit
  menutup by design; tidak ada bar status di tampilan itu.
- Foto di dalam modal inspeksi (slot Kartu/Penimbangan CO2/Pengecekan per
  caption), BUKAN Section B halaman. Grid DUA KOLOM dengan pratinjau
  lebar penuh kolom (`w-full aspect-[4/3]`): label + tombol unggah di
  atas kartu, foto terbaru tiap slot tampil besar, `+N` untuk slot ber-
  foto tambahan; placeholder dashed saat kosong (`Simpan dulu untuk
  unggah` saat belum ada rekam).
- CSS `.apar-toolbar-label` tidak terpakai (residu) — jangan pakai sebagai
  selector.
