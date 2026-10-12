# 05 — Pages (recreate prototype UI, verified live Oct 2026)

Migrate `preview/` → `apps/web`, swap mocks for TanStack Query (§04), apply
the §02 fix list. Behavior below is the contract.

## Dashboard

- 3 panes: sidebar (nav + category filters + theme), center (breadcrumb, calendar,
  4 KPI squares), right feed (monthly reports, search, date filter).
- Calendar: compact month grid, per-day category chips, Indonesian dates.
- KPI squares open their pages (Hydrant/APAR/P3K/Patrol). APAR square carries
  the expiry badge. Fix accent drift (§02.1).
- Feed items open the record modal (badge, metadata, details, photos, Edit).

## Hydrant (accent `#eb5757`) — master pattern

- Order: month switcher + 4 stats + tabs + table/cards + Section B findings.
- Table: rows = units, 6-component chips (left), centered cells, row click =
  inspection modal (6 selects + photos + notes + override).
- Add: zone + non-sequential unit codes via modal.
- Section B: 2-col `PhotoCard` grid + Tambah form (photo required + caption).
- Print: A4 portrait, table + findings + 3-col signatures.

## APAR (accent `#f2994a`) — paper-document style

- Order: monthly checklist table → Kadaluwarsa (computed, `dan`-lists) →
  “Catatan :” heading (handwritten, no boxes) + signatures →
  unit chips 01–20 → yearly card (view-only).
- Row click = 7-component modal; publish opens the record view (Edit reopens).
- Yearly card: 12-month rows, report month highlighted, red tint + follow-up
  text on X, locked badge when Approved.
- Print: p.1 monthly table, p.2 expiry + Catatan + signatures; card alone.

## P3K (accent `#27ae60`) — yearly grid only

- 21 items × 12 months, one mark column per month: √ / × / KD(red).
- TANGGAL INSPEKSI + PARAF rows, Catatan footnote, year switcher,
  editable Unit/Lokasi Kerja. Empty start; month header click = input form
  (21 quantities + KD flags + tanggal/paraf, clear-month action).
- Print: A4 landscape.

## Patroli K3 (accent `#2f80ed`) — single photo feed

- Reuses Hydrant Section B grid. Newest first, caption only under photos.
- Paper header (LAPORAN KEGIATAN + lokasi + latest date). Add form: photo
  required + caption, date defaults today. Hover-delete.
- Print: A4 portrait, header + grid.

## Global rules

- Indonesian K3 labels only. `tabular-nums` on numbers/dates. `pressable`.
- Dark mode everywhere. Esc + backdrop closes every modal.
- Photos start as placeholders until upload API lands; then Garage URLs.
