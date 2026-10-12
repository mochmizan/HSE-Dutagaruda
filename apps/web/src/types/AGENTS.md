# Types & Domain Models DOX — `src/types`

## Purpose

Houses all TypeScript type definitions for the application: Prisma-exact domain entities, REST API request/response DTOs, and frontend UI view models.

## Ownership

- `domain.ts`: Strict TypeScript mirrors of Prisma models and enums from PRD §3.2 (`Role`, `HydrantComponentStatus`, `AparComponentStatus`, `P3kItemStatus`, `OverallStatus`, `AparJenis`, `User`, `Client`, `Site`, `Zone`, `HydrantUnit`, `AparUnit`, `P3kBox`, `HydrantInspection`, `AparInspection`, `P3kInspection`, `P3kInspectionItem`, `SafetyPatrolReport`, `SafetyPatrolFinding`, `Photo`, `Setting`).
- `api.ts`: API request/response DTO contracts for PRD §3.4 endpoints (`CalendarInspectionItem`, `ExpiringAparItem`, `CreateHydrantInspectionDto`, `CreateAparInspectionDto`, `CreateP3kInspectionDto`, `CreateSafetyPatrolDto`, `AlertSettingsDto`).
- `hse.ts`: Frontend view models, category badge configurations (`CATEGORY_CONFIG`), and UI state types.
- `index.ts`: Unified barrel export.

## Local Contracts

- `domain.ts` must stay 1:1 synchronized with `prisma/schema.prisma`.
- `api.ts` must stay 1:1 synchronized with backend route payloads in `server/src/routes/routeManifest.ts`.
- Enums defined in `domain.ts` are re-exported by `hse.ts` to prevent duplicate type declarations.

## Work Guidance

- When modifying a domain entity, update `prisma/schema.prisma` first, then update `domain.ts`.
- Re-export all public types cleanly from `index.ts`.

## Verification

- `cd preview && bun run build`

## Child DOX Index

*Leaf boundary. Direct children are type definitions; no nested DOX required.*
