# Alur persetujuan

Satu alur untuk SEMUA kategori (`hydrant|apar|p3k|patrol`): Draft →
Diajukan → Diketahui → Disetujui, plus `kembalikan` ke DRAFT dari status
apa pun di luar DRAFT. Identity-guarded: pengaju tidak bisa menyetujui
karyanya sendiri; role-gating ditunda (keputusan owner). Bar hidup di dalam
modal inspeksi (per record), modal bulan P3K, dan Patroli untuk laporan
terbaru.

## Sub-features

- `approval-submit` mengajukan DRAFT → DIAJUKAN (`Ajukan`).
- `approval-acknowledge` mengetahui DIAJUKAN → DIKETAHUI (user kedua).
- `approval-approve` menyetujui DIKETAHUI → DISETUJUI (user kedua).
- `approval-return` mengembalikan ke DRAFT dari DIAJUKAN/DIKETAHUI/DISETUJUI
  (`Kembalikan`).
- `approval-lock` mengunci simpan + Edit saat status di luar DRAFT.

## How to get to it (user POV)

- Buka record apa pun (modal Hydrant/APAR, form bulan P3K, laporan patrol
  terbaru) → `ApprovalBar` di dalam modal/halaman.
- Tombol `Ajukan` (DRAFT) → status `Diajukan`; user KEDUA menekan ketahui/setujui → `Diketahui` → `Disetujui`.
- `Kembalikan` (dengan alasan) → DRAFT untuk diperbaiki.

## Driving it with HTTP + browser

Preconditions:

- Doctor hijau; DUA login (pengawas mengajukan, approver
  `budi.approver@contoh.id` menyetujui) — masing-masing cookie jar
  sendiri + set-active sendiri.
- Satu `refId` DRAFT milik pengawas pada kategori yang diuji. JANGAN pakai
  record review perusahaan — buat fixture `uji-` dan hapus setelah run.

- **Ajukan.** `POST /api/approvals/<cat>/<refId>/approval
  {"action":"ajukan"}` sebagai pengawas → status `DIAJUKAN`.
- **Aturan pengaju.** `setujui` oleh pengaju yang sama → 403. (Uji 403
  HANYA di DIKETAHUI — di status lain 400 transisi menyala DULUAN dan
  menutupi 403.)
- **Ketahui + setujui.** Sebagai approver: `{"action":"ketahui"}` →
  `DIKETAHUI`, lalu `{"action":"setujui"}` → `DISETUJUI`. Baca ulang
  record = status bertahan (tampilan kedua).
- **Transisi liar.** Aksi keluar urutan (mis. `setujui` dari DRAFT) → 400,
  BUKAN 403. Aksi tak dikenal → 400 (Zod).
- **Kunci browser.** Pada record DISETUJUI: tombol simpan mati + notice
  `Laporan terkunci — menunggu persetujuan`; `Kembalikan` membuka kunci
  kembali ke DRAFT.
- **Bukti.** Transcript status per langkah + snapshot bar terkunci +
  `PROOF.md` (kategori + refId fixture) di
  `wiki/artifacts/<run-id>/persetujuan/`. Hapus fixture `uji-` setelahnya
  (foto dulu bila ada, baru parent).

## Gotchas

- Pemetaan pesan terkunci di web `gagal()` mengunci substring API `proses
  persetujuan` — ganti redaksi `editLocked()` merusaknya.
- Rantai penuh butuh DUA user; satu user tidak bisa membuktikan
  ketahui/setujui (403 submitter rule).
- Patrol: sertakan `patrolDate` yang valid di body langkah approval bila
  endpoint memvalidasinya (lihat pola `check.ts`).
