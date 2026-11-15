# apps/api — AGENTS.md

## Purpose

Hono + Drizzle + Better Auth backend for the HSE Inspection Platform. Owns all
`/api` routes, the Postgres schema (`src/db/schema.ts`), Garage (S3) photo and
PDF storage, and Gotenberg PDF rendering.

## Ownership

- `src/routes/*` — CRUD, feed, settings, uploads, exports, pdf-jobs.
- `src/storage.ts` — Garage S3 client: `putBytes`, `presignedGet` (60s default),
  `getBytes`, `objectExists`, `deleteObject`.
- `src/db/client.ts` — one explicit postgres-js pool (`DB_POOL_MAX` default 10,
  30s idle, 10s connect, 30min max lifetime, `DB_STATEMENT_TIMEOUT_MS` default
  15000). Do not reintroduce a bare `postgres(url)`: unbounded statement time
  lets one stuck query hold a pool slot forever.
- `src/retensi-pdf.ts` — `pdf_jobs` retention. Deletes `done` older than
  `RETENSI_HARI` (default 30) plus `failed`/`queued` older than
  `RETENSI_GAGAL_JAM` (default 24, both are terminal states with no worker).
  Objects are deleted before rows so a failed object delete keeps the row as a
  trace. Run dry-run first, then `--hapus`:
  `docker compose -f infra/docker-compose.yml exec -T api bun run src/retensi-pdf.ts --hapus`.
- `src/pdf/render.ts` — Gotenberg 8 client (`waitForSelector=#pdf-ready`,
  `waitDelay=300ms`, `failOnResourceLoadingFailed=true`).
- `src/pdf/templates.ts` — pure HTML builders for the 5 paper forms
  (hydrant-monthly, apar-monthly, apar-card, p3k-yearly landscape, patrol-report).
  Fonts embedded as data URLs from `src/pdf/fonts.ts`. No db access here.
  `aparMonthly` emits an explicit `.page-break` after the component table so
  page 2 is expiry + a ruled `Catatan :` block + signatures (spec/06-print.md).
  `p3kYearly` prints the `TANGGAL INSPEKSI` and `PARAF PETUGAS` rows required by
  the paper form, blank when `inspectionDate` is null.
- `src/pdf/fonts.ts` — base64 WOFF2 (Inter 400/700). Regenerate only from the
  jsDelivr fontsource files (Google Fonts CSS returned wrong bytes; see memory).

## Local Contracts

- Every route app mounts under `/api/<plural>` in `src/index.ts`; every handler
  uses `requireSession` + `companyId(c)` scoping. Errors are problem-shaped via
  `app.onError`.
- Projects are organizations (`organization` + mirror row in `companies`), not a
  `projects` table. The *selected* project is recorded server-side in
  `project_preferences` (one row per user, `POST /api/projects/aktif`), because
  `session.active_organization_id` dies with the session row on sign-out and a
  new session starts null — that made the client guess `organizations[0]` at
  every sign-in. `GET /api/projects/aktif` deliberately runs WITHOUT
  `requireSession` (it must answer while the session has no active org) and
  returns `{ organizationId: null }` plus a cleanup when the membership is gone.
  `PATCH/DELETE /api/projects/:id` stay membership-checked; delete clears any
  preference pointing at the removed project.
- Photos: bytes in Garage under `foto/<companyId>/<photoId>.<ext>`, row in
  `photos` (exactly one owner inspection). `POST /api/uploads` (multipart,
  JPEG/PNG/WebP, 8 MB max), `GET /api/photos/:id` → 302 presigned 60s,
  `DELETE /api/photos/:id` removes object + row.
- Peta proyek (`project_maps`, migration `0009_*`): gambar denah per PROYEK
  (project id = `companyId(c)`), dibagi ke semua pengguna proyek, bukan per
  pengguna. Bukan `photos` karena CHECK `num_nonnulls(...) = 1` di tabel itu
  mewajibkan tepat satu inspeksi pemilik. Bytes di
  `peta/<companyId>/<mapId>.<jpg|png|webp>` (JPEG/PNG/WebP, 10 MB, maks 20 peta
  per proyek). Tepat satu baris `dipilih` per proyek, ditegakkan partial unique
  index `project_maps_satu_dipilih`; peta pertama otomatis terpilih,
  `PUT /api/project-maps/:id/dipilih` menukar pilihan dalam SATU transaksi
  (kosongkan semua lalu set satu), dan `DELETE` peta terpilih mempromosikan sisa
  terbaru (`urutan desc, createdAt desc`) di request yang sama.
  `GET /api/project-maps` → `{ items }` urut `urutan` lalu `createdAt`,
  `POST /api/project-maps` (multipart `file` + `nama?`, 201 baris),
  `PATCH /api/project-maps/:id` `{ nama }`, `GET /api/project-maps/:id/berkas`
  → 302 presigned 60s. Semua handler tenant-scoped; peta proyek lain → 404.
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
- Monthly export photos are filtered to `photos.temuan = true` (Section B is
  "Catatan Hasil Temuan"). Without that filter the 3,7 MB evidence photo is
  printed too and one Hydrant page grows to 4,3 MB. Presigning runs in parallel;
  keep it that way or every extra photo adds a Garage round trip to export time.
- `GET /api/safety-patrol-reports` embeds each report's `findings` in the list
  response (one extra query for the whole page, not one per report). Do not
  reintroduce client-side per-report fetches.
- List endpoints page with `nextCursor` and `limit` (max 100). Clients must
  follow the cursor; the web client does so in `ambilSemua` (`klien.ts`).
  `siteId` and `period` are accepted query filters on inspections, units, zones,
  boxes and patrol reports and are applied in SQL.
- Unit display order is user-controlled and stored, not derived: `sort_order`
  on `hydrant_units` and `apar_units` (migration `0007_*`, backfilled from
  `kode` so existing tables kept their old sequence). `PUT /api/<hydrant-units|
  apar-units>/urutan` takes `{ siteId, ids }`, requires `ids` to be every unit of
  that site exactly once (400 otherwise) and rewrites all positions in one
  transaction. New units are appended at `max(sort_order) + 1`. The list route
  still orders by `id` because its cursor pagination needs a monotonic key —
  display order is applied client-side in `klien.ts`, and PDF export orders by
  `sort_order` then `kode`.
- `GET /api/photos?inspectionKind=hydrant|apar&inspectionId=` lists a photo
  owner inspection's photos, tenant-scoped (unknown or other-company
  inspection is 404): `{ items: [{ id, caption, createdAt }] }` ordered by
  createdAt.
- Reports are final on save. There is no approval workflow: no
  `/api/approvals` route, no edit-lock guards, and
  no role input on `POST /api/users`. All content routes edit freely.
- Publish state is one column, not a workflow:
  `hydrant_inspections.approval_status` (enum `approval_status`: `DRAFT | DIAJUKAN | DIKETAHUI |
  DISETUJUI`, NOT NULL DEFAULT `DRAFT`, migration `0003_*`). `POST`/`PATCH
  /api/hydrant-inspections` accept it (default `DRAFT`); migration 0003 also
  backfills pre-existing published rows to `DIAJUKAN`. The hydrant modal reads
  `!= 'DRAFT'` as published and writes `DIAJUKAN` on `Terbitkan`. Only the
  hydrant table has the column; APAR, P3K and patrol stay column-free, and
  nothing enforces the value server-side.
- Patrol findings with photos: `POST /api/safety-patrol-reports/:id/findings/photo`
  (multipart `file` + `description` + `locationNote`?, JPEG/PNG/WebP 8 MB,
  stores `foto/<companyId>/<findingId>.<ext>` + sha256, 201),
  `GET /api/safety-patrol-reports/findings/:fid/photo` → 302 presigned 60s.
  Finding and report DELETE remove Garage objects best-effort (never fail the
  row delete). The JSON `POST /:id/findings` stays for old clients.

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
  — expect 72/72 (CRUD + upload round-trip + photo list + 5 exports +
  pdf-job flow + proyek-aktif rekam/baca + peta proyek unggah/pilih/daftar/hapus
  + typed-client probe `klien-tertipikasi`). The gate's
  byte-fetch check maps the public storage origin onto `CHECK_BASE` so it
  validates the same Caddy `/storage` route.
- Host variant `bun run --filter @viaannn/api check` now also passes the byte
  fetch (storage is host-reachable via Caddy).
- Build: `bun run build` (tsc, zero errors). The build itself proves
  `hc<AppType>` typing: check.ts calls `hc<AppType>(BASE).api.sites.$get`,
  which fails tsc if any sub-app loses its chained registration.
- PDF orientation proof: portrait MediaBox ≈ 595×842 pt, landscape ≈ 842×595 pt.
- Unit tests: `bun run test` from the repo root (113 tests). Covers
  `packages/shared/src/status.ts` + `dates.ts`, `apps/web/src/lib/aparSync.ts` +
  `dates.ts`, `apps/web/src/features/peta/petaTeks.test.ts` (size formatting),
  and the PDF template builders (`templates.test.ts`, incl. the hydrantLaporan suite).
- PDF size/page proof: `bun scripts/bench/pdf.ts` renders all categories and
  `bun scripts/bench/cek-pdf.ts <file>` prints page count. Hydrant monthly must
  stay far below 100 KB (4,3 MB means the `temuan` photo filter regressed) and
  APAR monthly must be 2 pages.

## Child DOX Index

None. This package has no subdirectories with their own contracts.
