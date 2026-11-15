# 06 — Print (Gotenberg 8, pixel-exact paper forms)

Browser print stays as draft. The backend owns exact output via Chromium
templates (API verified in ctx7 docs: A4 sizes, landscape flag, waits).

## Templates (one per form, server-side, shared header/footer partials)

1. `hydrant-monthly`: portrait A4 — paper CHECKLIST BULANAN HYDRANT (kop
   banner JPM Dukuh Atas, judul + subjudul site uppercase, Periode/Tanggal
   baris, Section A No|Zona|Kode|Dokumentasi Pemeriksaan|Dokumentasi
   Checklist|Status Penggunaan dengan foto bukti per baris, Section B foto
   temuan 2 kolom + caption). Tanpa blok tanda tangan (tidak ada di kertas).
2. `hydrant-laporan`: **landscape** A4 — paper LAPORAN PEMERIKSAAN HYDRANT
   (kop teks 3 kolom dutagaruda/piranti prima + judul + ITJ, meta
   Tahun|Bulan + Lokasi `ITJ <SITE>` + legenda ✓/X/-, tabel 17 kolom No |
   Kode | 6 grup × Standar/Dibawah Standar | Tanggal Pemeriksaan
   (dd-Mmm-yy dari createdAt rekam) | Petugas Pemeriksa (`Pengawas K3`,
   belum ada kolom pemeriksa di rekam) | Keterangan). Tanda: LAYAK ✓ di
   Standar; TIDAK_LAYAK X di Dibawah Standar; HILANG - di Dibawah Standar.
   Landscape dipilih karena 17 kolom tak muat portrait; satu-satunya template
   hydrant yang landscape.
3. `apar-monthly`: portrait A4 p.1 table, p.2 expiry + Catatan + signatures.
4. `apar-card`: portrait A4 — yearly card alone.
5. `p3k-yearly`: **landscape** A4 — 21×12 grid + tanggal/paraf + footnote.
6. `patrol-report`: portrait A4 — header block + 2-col photo grid + captions.

## Template rules

- Inline critical CSS; embed WOFF2 (Inter/Noto Sans) via `@font-face` for
  Indonesian text. Logos as absolute server-side assets (never remote URLs).
- `waitForSelector` on a ready marker (e.g. `#pdf-ready`), not blind delays.
- Margins: 12mm portrait, 10mm landscape. `print-color-adjust: exact`.
- Photos fetched via short-lived presigned Garage URLs at render time.

## Proof step (before committing the pattern)

- 1-day spike: render the Hydrant form, diff against the paper scan.
- Soak: 50 PDFs, watch `docker stats` (Chromium spikes on concurrency).
- Then replicate the pattern for the other 5 templates.
