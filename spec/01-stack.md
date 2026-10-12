# 01 — Stack (locked, Oct 2026)

Researched via ctx7 CLI (current docs) + web. Re-verify signatures with ctx7
during implementation.

| Layer | Pick | Version pin | Why |
|---|---|---|---|
| Web UI | Vite + React + TS strict + Tailwind v4 | React 18 (keep), Vite 8 | Done, builds green, no SEO need |
| Server state | TanStack Query v5 | `@tanstack/react-query@5` | Cache + mutations + invalidation (docs verified) |
| API | Hono on Node 24 LTS | `node:24` image | JWT + CORS built in, runs anywhere (docs verified) |
| Auth | Better Auth + organization plugin | current 1.x | Email/pass + roles + orgs = companies (docs verified) |
| DB | Postgres 17 + Drizzle ORM | `postgres:17`, `drizzle-orm` + `drizzle-kit` | SQL-first, RLS support, migrations (docs verified) |
| Photos | Garage (S3 API) | latest stable | Single binary, keys/buckets/presigned (docs verified) |
| PDFs | Gotenberg 8 | `gotenberg:8` | Real Chromium, A4/landscape/waits (docs verified) |
| Proxy/static | Caddy | latest | TLS + static `dist` + reverse proxy |
| Tooling | Bun | 1.x | Install/dev/build speed only, never prod runtime |

## Explicitly rejected

- Next.js / TanStack Start / React Router framework mode: full rewrite, zero payoff
  for a login-gated app (Start is still RC).
- TanStack Table: tables are print-exact custom markup; no sorting/pagination need.
- TanStack Form/Router: forms are simple, nav is view-state. Revisit if that changes.
- NestJS/Go/Laravel: second language or 3–5× boilerplate, no gain.
- MinIO OSS: frozen, no security patches (vendor states EOL).
- Prisma: dropped by owner decision (was spec'd, replaced by Drizzle everywhere).
- Vercel Blob / react-pdf / Prisma Cloud: data must stay in-country; Chromium beats
  programmatic PDF for exact paper replicas.

## Open (decide at scaffold)

- Drizzle driver: `postgres-js` vs `node-postgres` (pick one, whole repo).
- Better Auth sessions: database sessions (default, safer) vs JWT.
