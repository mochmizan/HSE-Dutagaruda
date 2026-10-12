# 07 — Build order (workers start AFTER owner approval)

Wave 1 runs THREE workers in parallel on disjoint paths (no shared files).
Model for all: `kenari/muse-spark-1-3-contributor#high`.
Brief for each: `agents/poteto-worker.md` + the spec files named + allowed paths.

## Worker A — Scaffold + data (owns: `infra/` except spikes, `apps/api/`, `packages/shared/`)

1. Monorepo: `apps/api` (Hono, Node 24, TS strict), `packages/shared`,
   `infra/docker-compose.yml` (caddy + api + postgres:17 + garage + gotenberg:8).
   Do NOT touch `apps/web/` or `infra/spikes/`.
2. Drizzle + `postgres-js`: schema (§03) + drizzle-kit generate/migrate + seed
   (company, site, zones, 21-item catalog constant, settings, demo user).
3. Shared pkg: DTOs, status calculators (port from prototype
   `preview/src/lib/statusCalculator.ts`), dates, P3k catalog.
4. Better Auth tables via its CLI (Drizzle adapter, database sessions,
   organization plugin). Route wiring belongs to Stream 2, not this worker.
5. Gate: `docker compose up` green, migrate + seed clean, typecheck clean.

## Worker B — PDF spike (owns: `infra/spikes/pdf-hydrant/` ONLY, standalone)

1. Own Gotenberg container on a scratch port (`docker run`, never touch the
   compose file). Prototype is READ-ONLY reference (print CSS + §06).
2. Chromium HTML template of the Hydrant monthly form (§06 rules: inline CSS,
   embedded WOFF2, `#pdf-ready` wait marker, A4 portrait).
3. Render with waits; deliver the PDF bytes + generation log at
   `infra/spikes/pdf-hydrant/out/`. Seeded sample data matching prototype mocks.
4. Gate: PDF opens, A4, all sections present, owner accepts the visual diff.

## Worker C — Web migration, mocks stay (owns: `apps/web/` ONLY)

1. Copy prototype `preview/` (code only, no node_modules/dist) into `apps/web/`.
   Prototype untouched. Mocks stay; NO TanStack Query wiring yet (Stream 3).
2. Build shared components (§02) once; apply the fix list page by page
   (locked accents, button pattern, print labels, dev refs removed, StatCard,
   approval workflow on ALL pages per locked decision).
3. Gate: `bun run build` zero errors; visual parity vs prototype.

## Later (after Wave 1 gates)

- Stream 2 worker: auth routes + CRUD (§04) + RPC client.
- Stream 3 worker: Query wiring + login + presigned photos (after Stream 2).
- Stream 4 worker: upload flow + 5 templates (after spike + Stream 2).

## Stream 1 — Scaffold + data (blocks all)

1. Monorepo: `apps/web`, `apps/api`, `packages/shared`, `infra/docker-compose.yml`
   (caddy + api + postgres:17 + garage + gotenberg:8).
2. Drizzle schema (§03) + drizzle-kit generate/migrate + seed (company, site,
   zones, 21-item catalog constant, settings, demo user).
3. Shared pkg: DTOs, status calculators, date helpers, P3K catalog.
4. Gate: `docker compose up` green, migrate + seed clean, typecheck clean.

## Stream 2 — Auth + API (after Stream 1)

1. Better Auth + organization plugin + Drizzle adapter; roles; session strategy
   (decide §01 open item first).
2. CRUD per §04 with `companyId` scoping + Zod validation + unique guards.
3. Unified feed, expiry alerts, settings endpoints. Hono RPC client export.
4. Gate: every route hit by automated check (auth + scoping + validation).

## Stream 3 — Web app (after Stream 2, parallel with Stream 4)

1. Migrate `preview/` → `apps/web`. TanStack Query wiring replaces mocks.
2. Build shared components (§02) once; apply the 9-item fix list page by page.
3. Auth guard + login screen + presigned photo display.
4. Gate: `bun run build` zero errors; visual parity vs prototype screenshots.

## Stream 4 — Uploads + PDFs (after Stream 2)

1. Upload flow (§04) + Garage bucket/keys + presigned serving.
2. Gotenberg spike (§06 proof step), then 5 templates.
3. Async `pdfJobs` flow + “Unduh PDF” buttons.
4. Gate: 50-PDF soak clean; pixel diff vs paper scans accepted by owner.

## Rules for workers

- ctx7 CLI for every library signature (`ctx7 docs <id> <query>`).
- Indonesian UI text only. DOX-style doc updates with each stream.
- No step starts before its gate is green. Demos use seeded data only.
