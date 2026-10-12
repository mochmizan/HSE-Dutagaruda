# viaannn — HSE Inspection Digitization Platform (prod build)

Custom internal app for one Indonesian company. Login-gated, no public pages, no SEO.
Later: client companies log in and see only their own equipment.

## Stack (locked, researched via ctx7 + web, Oct 2026)

| Layer | Pick |
|---|---|
| UI | Vite + React + Tailwind (kept from prototype) + TanStack Query (new) |
| API | Hono on Node 24 LTS (Bun for tooling only) |
| Auth | Better Auth + organization plugin (one org = one company) |
| DB | Postgres 17 + **Drizzle ORM** (Prisma dropped by owner decision) |
| Photos | Garage (S3 API), Postgres holds keys only |
| PDFs | Gotenberg 8 (Chromium, pixel-exact forms) |
| Deploy | Docker Compose, Indonesian VPS |

## Layout (proposed, no code until approval)

```
viaannn/
  README.md
  spec/            # this folder — the build contract
  apps/
    web/           # Vite+React app (migrated from prototype preview/)
    api/           # Hono + Drizzle + Better Auth
  packages/
    shared/        # DTOs, status calculators, Indonesian date helpers
  infra/
    docker-compose.yml  # caddy + api + postgres + garage + gotenberg
```

## Spec index

- `spec/00-overview.md` — goal, scope, decisions
- `spec/01-stack.md` — locked versions + why
- `spec/02-design.md` — consolidated design system + fix list
- `spec/03-data.md` — Drizzle schema (from Prisma spec + companyId rule)
- `spec/04-api.md` — endpoints (from route manifest, updated)
- `spec/05-pages.md` — 5 page specs (reviewed live Oct 2026)
- `spec/06-print.md` — Gotenberg templates + page sizes
- `spec/07-build-order.md` — worker workstreams + gates

## Status

- UI prototype: DONE (old repo `d:\dev\ohs\scrape`, builds green).
- This repo: spec only. **No code until owner approves the spec.**
