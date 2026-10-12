# Frontend Web Client DOX — `preview`

## Purpose

The `preview` directory contains the production-grade React + TypeScript + Vite web client for the HSE Inspection Digitization Platform. It delivers the responsive field inspector and staff interface with Notion-kit tokens, fixed 6-week calendar view, 4 core category KPI counters, dual-mode report panels, inspection modals, and Agentation visual feedback.

## Ownership

- Client-side application architecture (`src/App.tsx`, `src/main.tsx`).
- Domain-driven feature slicing under `src/features/`.
- Uniform API communication and mock adapters under `src/services/`.
- Domain, API, and UI state types under `src/types/`.
- Domain status logic and Indonesian formatting under `src/lib/`.
- Tailwind CSS v4 styling, design tokens (`DESIGN.md`), and global styles (`src/index.css`).

## Local Contracts

- All user-facing text, notifications, and labels must be in standard Indonesian K3 terms.
- Follow Emil Kowalski micro-interactions (`active:scale-[0.96]`, `cubic-bezier(0.2, 0, 0, 1)`, `150ms`).
- Follow Jakub Krehel craft guidelines (optical padding, `tabular-nums` on counts and dates, en-dashes `–`, View Transitions API circular reveal on theme switch with graceful fallbacks).
- The visual feedback toolbar (`Agentation`) must render in development mode pointing to `http://localhost:4747`.
- Components must consume data via `src/services/api` or typed props, never raw hardcoded mutations.
- Hydrant Inspection UI is **DONE / COMPLETE** and verified; all hydrant unit states, checklists, and inspection reports operate on a **per month change** cycle controlled by the month switcher (`period: YYYY-MM`).

## Work Guidance

- Keep UI components inside their respective feature folder (`src/features/calendar`, `src/features/kpi`, `src/features/reports`, `src/features/navigation`).
- Re-export feature interfaces through feature `index.ts` and `src/features/index.ts`.
- Maintain thin re-exports in `src/components/` for backward compatibility.
- Ensure all builds pass cleanly with zero TypeScript errors.

## Verification

- Build command: `bun run build`
- Typecheck: `tsc -b`
- Dev server port: `5173`

## Child DOX Index

- [src/features/AGENTS.md](src/features/AGENTS.md): Domain feature modules (calendar, kpi, reports, navigation, hydrant).
- [src/services/AGENTS.md](src/services/AGENTS.md): API client abstraction, REST endpoints, and mock adapters.
- [src/types/AGENTS.md](src/types/AGENTS.md): Domain entities (Prisma-exact), API DTOs, and view models.
- [src/lib/AGENTS.md](src/lib/AGENTS.md): Status calculation algorithms (PRD §3.3), APAR monthly-table ↔ yearly-card sync helpers, P3K catalog, and date helpers.
