# 00 — Overview

## Goal

Prod-grade HSE inspection app. Internal company use first. Client-company access later
(each client logs in, sees only its own sites and equipment).

## Scope (v1)

- Auth with roles: inspector / staff / approver. One organization = one company.
- 5 views: Dashboard, Hydrant, APAR, P3K, Patroli K3 (recreate the prototype UI).
- Postgres persistence for all inspection data. Photo upload + storage.
- Pixel-exact PDF export of the 4 paper forms (backend-generated).
- Docker Compose deploy on one Indonesian VPS. Data stays in-country.

## Non-goals (v1)

- No public pages, no SEO, no marketing site.
- No client onboarding / billing / public signup.
- No offline-first mobile. Browser only.
- No multi-node HA. Single VPS.

## Decisions (locked)

1. UI kept: Vite + React + Tailwind. No framework migration.
2. Prisma dropped. Drizzle ORM (owner decision, Oct 2026).
3. Node 24 LTS runs the API. Bun is tooling only.
4. `companyId` on every business table from day one. Single company seeded.
5. Photos: bytes in Garage, keys in Postgres, presigned GET after checks.
6. PDFs: Gotenberg Chromium templates. Browser print is draft-only.
7. Drizzle driver: `postgres-js`. Better Auth: database sessions.
8. Approval workflow (Draft, Ajukan, Ketahui, Setujui) on ALL inspection pages.
9. No code in this repo until the owner approves this spec.

## Source material

- Prototype: `d:\dev\ohs\scrape` (`preview/` UI, builds green; reviewed live Oct 2026).
- Paper forms: APAR checklist, P3K yearly card, Patrol photo report (owner photos).
