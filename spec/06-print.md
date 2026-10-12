# 06 — Print (Gotenberg 8, pixel-exact paper forms)

Browser print stays as draft. The backend owns exact output via Chromium
templates (API verified in ctx7 docs: A4 sizes, landscape flag, waits).

## Templates (one per form, server-side, shared header/footer partials)

1. `hydrant-monthly`: portrait A4 — checklist table + Section B photos +
   3-col signatures (Dibuat/Diketahui/Disetujui).
2. `apar-monthly`: portrait A4 p.1 table, p.2 expiry + Catatan + signatures.
3. `apar-card`: portrait A4 — yearly card alone.
4. `p3k-yearly`: **landscape** A4 — 21×12 grid + tanggal/paraf + footnote.
5. `patrol-report`: portrait A4 — header block + 2-col photo grid + captions.

## Template rules

- Inline critical CSS; embed WOFF2 (Inter/Noto Sans) via `@font-face` for
  Indonesian text. Logos as absolute server-side assets (never remote URLs).
- `waitForSelector` on a ready marker (e.g. `#pdf-ready`), not blind delays.
- Margins: 12mm portrait, 10mm landscape. `print-color-adjust: exact`.
- Photos fetched via short-lived presigned Garage URLs at render time.

## Proof step (before committing the pattern)

- 1-day spike: render the Hydrant form, diff against the paper scan.
- Soak: 50 PDFs, watch `docker stats` (Chromium spikes on concurrency).
- Then replicate the pattern for the other 4 templates.
