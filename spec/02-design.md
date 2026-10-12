# 02 — Design system (consolidated, from live UI review Oct 2026)

Source of truth: prototype `preview/` + `DESIGN.md` (Notion-Kit). Reviewed live:
dashboard + Hydrant + APAR + P3K + Patrol, light and dark mode.

## Tokens (keep 1:1)

- Surfaces: canvas `#ffffff` / `#191919`, sidebar `#f9f8f7` / `#202020`,
  modal `#ffffff` / `#252525`. Alpha hairline borders, no heavy shadows.
- Ink: `#2c2c2b` primary, never pure black. Muted + secondary per theme.
- Radii: buttons/inputs/nav 4px, cards 6px, modals 8px, pills full.
- Type: system sans everywhere; `tabular-nums` on ALL numbers/dates;
  Indonesian K3 labels only; en-dashes (–), curly quotes (“…”).
- Motion: `active:scale-[0.96]`, `cubic-bezier(0.2, 0, 0, 1)`, 150ms press.
  `pressable` on buttons, `pressable-subtle` on rows/cards.
- Modals: Esc + backdrop close, always. Dark vars, no hardcoded colors.

## Category accents (LOCKED — fix the drift below)

- Hydrant `#eb5757` · APAR `#f2994a` · P3K `#27ae60` · Patrol `#2f80ed`

## Shared components (build once, reuse on all pages)

`PageHeader` (back + title + actions) · `StatCard` (big tabular value + label) ·
`CategoryBadge` · `MonthSwitcher` / `YearSwitcher` · `PhotoCard` (4/5 frame,
caption, hover-delete, print-clean) · `EmptyState` · `ConfirmModal` ·
form inputs (one style, accent focus ring per page).

## Fix list (prototype drift → new-app rule)

1. KPI squares use `#0f7b6c`/`#0b6e99`; pages use `#27ae60`/`#2f80ed`.
   → Use the LOCKED accents everywhere.
2. Add buttons differ per page (labels, solid vs outline).
   → Primary = solid page accent (“Tambah …”); secondary = outline ghost.
3. Print buttons differ (“Cetak / PDF”, “Cetak Laporan”, “Cetak”).
   → One “Cetak” per scope (APAR keeps Laporan + Kartu).
4. Hydrant subtitle cites “(PRD §2.2 Epic C)”. → No dev refs in UI copy.
5. Stats cards differ per page. → One `StatCard`, same shape.
6. Approval workflow (Ajukan/Ketahui/Setujui) ships on ALL inspection pages
   (owner decision). Same component, same states, same locks everywhere.
7. Photo placeholders (grey boxes) on all pages. → Real Garage photos in v1.
8. Print: portrait everywhere, P3K landscape. → Same in Gotenberg templates.
9. Sidebar badge only on APAR (expiry). → Keep; revisit when alerts backend lands.
