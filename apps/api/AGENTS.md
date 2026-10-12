# apps/api — AGENTS.md

## Purpose

Hono + Drizzle + Better Auth backend for the HSE Inspection Platform. Owns all
`/api` routes, the Postgres schema (`src/db/schema.ts`), Garage (S3) photo and
PDF storage, and Gotenberg PDF rendering.

## Ownership

- `src/routes/*` — CRUD, feed, settings, uploads, exports, pdf-jobs.
- `src/storage.ts` — Garage S3 client: `putBytes`, `presignedGet` (60s default),
  `getBytes`, `objectExists`, `deleteObject`.
- `src/pdf/render.ts` — Gotenberg 8 client (`waitForSelector=#pdf-ready`,
  `waitDelay=300ms`, `failOnResourceLoadingFailed=true`).
- `src/pdf/templates.ts` — pure HTML builders for the 5 paper forms
  (hydrant-monthly, apar-monthly, apar-card, p3k-yearly landscape, patrol-report).
  Fonts embedded as data URLs from `src/pdf/fonts.ts`. No db access here.
- `src/pdf/fonts.ts` — base64 WOFF2 (Inter 400/700). Regenerate only from the
  jsDelivr fontsource files (Google Fonts CSS returned wrong bytes; see memory).

## Local Contracts

- Every route app mounts under `/api/<plural>` in `src/index.ts`; every handler
  uses `requireSession` + `companyId(c)` scoping. Errors are problem-shaped via
  `app.onError`.
- Photos: bytes in Garage under `foto/<companyId>/<photoId>.<ext>`, row in
  `photos` (exactly one owner inspection). `POST /api/uploads` (multipart,
  JPEG/PNG/WebP, 8 MB max), `GET /api/photos/:id` → 302 presigned 60s,
  `DELETE /api/photos/:id` removes object + row.
- Inspection DELETE blocks with attached photos (409); delete the photo first.
- PDF export: `POST /api/export/:category/:refId` creates a `pdfJobs` row
  (queued), renders synchronously in-request (v1; async queue is the follow-up),
  stores the PDF under `pdf/<companyId>/<jobId>.pdf`, marks done/failed.
  refId anchors: monthly categories take any inspection of the site+period and
  render ALL inspections of that site+period; cards take one inspection and
  render the unit/box year.
- `GET /api/pdf-jobs/:id` returns status plus `downloadUrl` (presigned 60s) when
  done. Garage is network-private: presigned URLs only resolve inside the
  compose network (`garage:3900`, no host port).

## Work Guidance

- Env comes from `infra/.env` via compose: `GARAGE_*`, `GOTENBERG_URL`,
  `BETTER_AUTH_*`, `DATABASE_URL`. `GOTENBERG_URL=http://gotenberg:3000`.
- Changing code requires an image rebuild before the check can see it:
  `docker compose build api && docker compose up -d api` (from `infra/`).
  The api container runs a baked COPY of `apps/api`, not a bind mount.
- New photo-bearing features must respect the single-owner CHECK constraint on
  `photos` (`num_nonnulls = 1`).

## Verification

- Full gate (runs inside the network so presigned fetches work):
  `docker compose -f infra/docker-compose.yml exec -T -e CHECK_BASE=http://caddy:80 api bun run src/check.ts`
  — expect 55/55 (CRUD + upload round-trip + 5 exports + pdf-job flow).
- Host variant `bun run --filter @viaannn/api check` passes everything except
  the two byte-fetch records, which report LEWAT (garage unreachable from host).
- Build: `bun run build` (tsc, zero errors).
- PDF orientation proof: portrait MediaBox ≈ 595×842 pt, landscape ≈ 842×595 pt.

## Child DOX Index

None. This package has no subdirectories with their own contracts.
