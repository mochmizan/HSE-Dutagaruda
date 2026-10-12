# Domain Logic & Utilities DOX — `src/lib`

## Purpose

Contains pure domain calculations, catalog definitions, and helper utilities: status calculation algorithms (PRD §3.3), the 21 standard P3K items catalog (PRD §3.2), and Indonesian date utilities.

## Ownership

- `statusCalculator.ts`:
  - `computeHydrantOverallStatus`: Auto-computation using critical vs non-critical component status.
  - `computeAparOverallStatus`: Auto-computation using critical vs non-critical component status.
  - `computeP3kBoxStatus`: Restock and overall status determination.
- `aparSync.ts`: mapping helpers between the APAR monthly table and the per-unit yearly card (modal → table + card) — `YEAR_TO_DRAFT`/`DRAFT_TO_YEAR`, `yearCellToDraft`, `draftToYearCell`, `countChecked`, `deriveUnitFromYearCell`, `resolveReportCell`, `emptyYearCell`/`emptyYearGrid`/`cloneYearGrid`, `AparCardStore`.
- `p3kItems.ts`: `STANDARD_P3K_ITEMS` array defining the 21 standard items, standard quantities, and Indonesian units.
- `dates.ts`: `formatIndonesianDate`, `formatIndonesianMonthYear`, `toPeriodKey`, `toPeriodIso`.
- `index.ts`: Barrel export.

## Local Contracts

- Hydrant status calculation: If any of the 6 components is `TIDAK_LAYAK` or `HILANG`, overall status evaluates to `TIDAK_LAYAK`. Only if all 6 are `LAYAK` does it evaluate to `LAYAK`.
- Critical components for APAR: `tekanan`, `tabung`, `selang`, `katupTuas`. Failing any critical component yields `TIDAK_LAYAK`.
- All date formatters must use Indonesian locale (`date-fns/locale/id`).
- All functions must remain pure without side effects.

## Work Guidance

- Never alter status computation rules without referencing PRD §3.3.
- Never modify the 21 standard P3K items without referencing PRD §3.2 table.

## Verification

- `cd preview && bun run build`

## Child DOX Index

*Leaf boundary. Direct children are utility functions; no nested DOX required.*
