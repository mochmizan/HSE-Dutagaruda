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
  done. Presigned URLs are signed against the internal endpoint
  (`garage:3900`) then rewritten to the public base `PUBLIC_STORAGE_BASE`
  (`http://localhost:8080/storage`) so host browsers resolve them; Caddy's
  `/storage/*` route strips the prefix, sets `Host: garage:3900`, and proxies to
  Garage, whose signature check (Host + path + query) still passes. Pass
  `audience: "internal"` to `presignedGet` for URLs consumed inside the compose
  network (Gotenberg template `<img src>`).
- `GET /api/photos?inspectionKind=hydrant|apar&inspectionId=` lists a photo
  owner inspection's photos, tenant-scoped (unknown or other-company
  inspection is 404): `{ items: [{ id, caption, createdAt }] }` ordered by
  createdAt.
- Reports are final on save. There is no approval workflow: no
  `approval_*` columns, no `/api/approvals` route, no edit-lock guards, and
  no role input on `POST /api/users`. All content routes edit freely.

## Work Guidance

- Env comes from `infra/.env` via compose: `GARAGE_*`, `GOTENBERG_URL`,
  `BETTER_AUTH_*`, `DATABASE_URL`. `GOTENBERG_URL=http://gotenberg:3000`.
- Changing code requires an image rebuild before the check can see it:
  `docker compose build api && docker compose up -d api` (from `infra/`).
  The api container runs a baked COPY of `apps/api`, not a bind mount.
- New photo-bearing features must respect the single-owner CHECK constraint on
  `photos` (`num_nonnulls = 1`).
- Register Hono routes ONLY by chaining (`.get(...).post(...).route(...)`).
  Statement-style registration loses route types and makes `AppType` blank,
  which silently kills `hc<AppType>` typing (root-caused Oct 13). Sub-apps
  included: build each as `new Hono().use(...).get(...)`.
- Drizzle migrations are squashed pre-prod by intent. After regenerating the
  squashed file, drop `pgdata` volume, re-migrate, re-seed; the old journal
  never replays over a squashed one.

## Verification

- Full gate (runs inside the network so presigned fetches work):
  `docker compose -f infra/docker-compose.yml exec -T -e CHECK_BASE=http://caddy:80 api bun run src/check.ts`
  — expect 63/63 (CRUD + upload round-trip + photo list + 5 exports +
  pdf-job flow + typed-client probe `klien-tertipikasi`). The gate's
  byte-fetch check maps the public storage origin onto `CHECK_BASE` so it
  validates the same Caddy `/storage` route.
- Host variant `bun run --filter @viaannn/api check` now also passes the byte
  fetch (storage is host-reachable via Caddy).
- Build: `bun run build` (tsc, zero errors). The build itself proves
  `hc<AppType>` typing: check.ts calls `hc<AppType>(BASE).api.sites.$get`,
  which fails tsc if any sub-app loses its chained registration.
- PDF orientation proof: portrait MediaBox ≈ 595×842 pt, landscape ≈ 842×595 pt.

## Child DOX Index

None. This package has no subdirectories with their own contracts.
