# Peta Proyek

Kartu `Peta Lokasi Proyek` di dasbor: denah lantai / site plan yang diunggah
pengguna, ditampilkan tepat di bawah `HseCalendar`. Banyak gambar boleh
diunggah per proyek; satu di antaranya dicatat server sebagai acuan tampilan
(`dipilih`). Cakupannya **proyek aktif, bukan lokasi** — semua site di proyek
itu memakai denah yang sama, berbeda dari halaman kategori yang selalu
disaring per `siteId`.

## Sub-features

- `peta-lihat` menampilkan peta terpilih selebar kartu (`max-h-[340px]
  object-contain`) di atas baris keterangan: nama, ukuran berkas
  (`842 KB` / `1,4 MB`), dan tanggal unggah `d MMMM yyyy` (Indonesia),
  semuanya `tabular-nums`.
- `peta-unggah` menerima banyak berkas sekaligus lewat `FileFotoButton`
  (`label="Unggah Peta"`, `variant="utama"`, `multiple`, `onFiles`).
  Berkas diunggah **berurutan** dengan `await unggah.mutateAsync({ file })`:
  server memberi nomor `urutan` per peta, jadi unggahan paralel bisa
  bertabrakan. Galat ditangani hook (`window.alert` Indonesia) — UI tidak
  menambah alert kedua, dan loop berhenti pada berkas yang gagal.
- `peta-pilih` = strip thumbnail (`PetaPemilih.tsx`) di bawah gambar, hanya
  dirender bila ada lebih dari satu peta. Klik thumbnail memanggil
  `usePilihPeta().mutate(id)`; server mencabut pilihan sebelumnya, jadi tidak
  ada logika "satu terpilih" di klien.
- `peta-ganti-nama` membuka input inline di baris keterangan (`Ganti Nama`,
  ikon `Pencil`): Enter menyimpan, Esc membatalkan, blur menutup. Nama kosong
  atau tidak berubah tidak dikirim.
- `peta-hapus` membuka `ConfirmModal` (`Hapus peta?`, aksen `#eb5757`,
  `confirmLabel` `Hapus`) lalu `useHapusPeta().mutate(id)`.
- `peta-lightbox` membuka penampil layar penuh saat gambar diklik
  (`PetaLightbox.tsx`, `z-[60]`, `role="dialog"`, `aria-modal`): tutup lewat
  Esc (`useDismiss`), klik backdrop (`closeOnBackdrop`), atau tombol X; ada
  tombol `Perbesar`/`Perkecil`.

## How to get to it (user POV)

- Masuk → dasbor → kartu `Peta Lokasi Proyek` di bawah kalender.
- `Unggah Peta` (biru `#2f80ed`) di kepala kartu, atau tombol yang sama di
  blok status kosong saat belum ada denah.
- Klik gambar → lightbox; `Perbesar` / `Perkecil`; Esc atau klik latar untuk
  menutup.
- `Ganti Nama` → ketik → Enter (Esc batal).
- `Hapus` → konfirmasi `Hapus`.

## Driving it with HTTP + browser

Preconditions: login + set-active selesai (lihat `../SKILL.md`), dan API
sudah memuat rute `/api/project-maps`.

- `GET /api/project-maps` → `{ items: ApiPeta[] }` (`id`, `nama`, `mime`,
  `bytes`, `urutan`, `dipilih`, `createdAt`).
- `POST /api/project-maps` multipart (`file`, `nama?`) — JPEG/PNG/WebP.
- `PUT /api/project-maps/:id/dipilih` menandai acuan tampilan.
- `PATCH /api/project-maps/:id` `{ nama }`; `DELETE /api/project-maps/:id`.
- Berkas: `GET /api/project-maps/:id/berkas` → 302 presigned (`livePetaUrl`).

Semua mutasi menyegarkan prefiks cache `['peta']` saat settle.

## Gotchas

- Tanpa gambar → blok bergaris putus + ajakan unggah; jangan asert elemen
  `img` pada proyek baru.
- Batas unggahan 10 MB per berkas (JPEG/PNG/WebP). Pesan galat datang dari
  hook; jangan menambah `window.alert` kedua di komponen.
- Unggahan PERTAMA otomatis terpilih di server — UI tidak memilih sendiri.
  Bila data lama tidak punya `dipilih` sama sekali, kartu menampilkan
  `peta.find(p => p.dipilih) ?? peta[0]` supaya tidak kosong padahal ada
  berkas.
- Menghapus peta yang sedang terpilih menaikkan peta berikutnya menjadi
  terpilih (perilaku server). Jangan simpan id terpilih di state klien —
  sumber kebenaran hanya kolom `dipilih`.
- Presigned URL denah hanya resolve di dalam network Docker; dari host perlu
  rute proxy Caddy (sama seperti foto inspeksi), jadi "gambar kosong" di
  pratinjau host bukan bukti unggahan gagal.
- Picker hanya muncul saat `peta.length > 1`; jangan asert strip thumbnail
  pada proyek berpeta tunggal.
