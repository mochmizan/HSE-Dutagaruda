# Wave memory (next workers read this first, after the spec)

Source: debriefs from Workers A (scaffold+data), B (PDF spike), C (web migration),
Fix (web deviations). Wave 1 complete.

## Standing rules

- Every brief leads with: read poteto-mode SKILL.md in full FIRST (owner order).
- Every landing closes with a debrief (journey, gotchas, observations) folded
  into this file by the coordinator.
- No code in prototype `D:\dev\ohs\scrape` (read-only). No shared paths between
  workers. Fresh worker per task, no resumes.
- Thin/stalled reports: message the same session again (provider traffic kills
  sessions sometimes). New spawn only when the session is dead.

## Environment gotchas (Windows + PowerShell)

- `curl` is aliased to Invoke-WebRequest. Raw flags fail. Call `curl.exe`
  explicitly or use `Invoke-WebRequest -UseBasicParsing`.
- No `head`, `tail`, `grep`, `cat`. No `&&` chaining. Bare `echo` fails.
  Env vars need `$env:` prefix. Use opencode grep/read tools instead.
- `localhost` may resolve IPv6 first and confuse connection errors.
- `bun install` can print success yet exit code 1. `bun run --cwd` does not
  select workspace scripts; use `--filter` syntax.
- Robocopy non-zero exits are normal copies, not failures.
- Ports in use: 5173 prototype dev server, 5174 may linger from fix wave,
  host 5432 held by another Postgres under wslrelay (use host 5433, compose
  internal stays 5432), spike Gotenberg on scratch 3222.
- Stray containers to stop/remove when done: `gotenberg-spike-hydrant` (3222).
- Docker Desktop binary lives under LocalAppData Programs, not Program Files.
  `docker version` works while daemon is down; `docker ps` npipe-errors until boot.
- Python3 stub points to Microsoft Store. Working interpreter was
  `C:\Python314\python.exe`. Google Fonts CSS returned identical bytes per
  weight; jsDelivr fontsource latin files are correct. Store font hashes.
- `Out-File -Encoding utf8` adds BOM that complicates log reads.
- Docker logs to stderr trips PowerShell exit 1; output still usable.
- Tsx prints a module-register deprecation warning; harmless.
- No browser tool in this runner. Visual sanity is HTTP reachability only.
- Principle leaves: `**` glob finds nothing; list the marketplace dir directly.
- Large files truncate; use offset reads. `bun run build` = tsc-b + vite
  (2780 modules at last green).

## Service-specific gotchas

- Stream 2 gate: `bun run --filter @viaannn/api check` (41/41, Indonesian
  names). Covers 200s, 401s, 409 duplicate month, cross-company 404s, Zod 400s.
  Stream 4b extended it: **55/55** via
  `docker compose exec -e CHECK_BASE=http://caddy:80 api bun run src/check.ts`
  (canonical run in `apps/api/AGENTS.md`). Adds uploads, presigned 302, 5
  exports, pdfJobs flow, photo delete.
- Better Auth + Drizzle: `drizzleAdapter(db, { provider: "pg" })` WITHOUT the
  `schema` option silently finds no tables. Auth tables live in
  `apps/api/src/db/auth-schema.ts` (user/session/account/verification/
  organization/member/invitation, standard names, no mapping needed).
  Fix: `drizzleAdapter(db, { provider: "pg", schema: authSchema })`.
  (Root-caused Oct 12 after two stalled workers; docs confirm at
  better-auth drizzle adapter page.)
- Drizzle postgres-js init takes `{ client, schema }` (current docs).
  Migrator import: `drizzle-orm/postgres-js/migrator`. Check signatures via ctx7.
- Better Auth CLI generate has NO dialect flag in the installed version.
  Correct flags: config + output + yes only.
- Drizzle cannot auto-cast text to real; squash pre-release migrations instead.
- Garage v2.3: needs 32-byte hex RPC secret; legacy replication mode rejected,
  use replication-factor + consistency mode. Fresh Postgres reset does NOT reset
  Garage volumes. Pin the gotenberg image digest (it floated mid-spike).
- Gotenberg multipart entry MUST be named `filename=index.html`. Set explicit
  paperWidth/paperHeight/margins AND a literal `#pdf-ready` waitForSelector.
  pypdf splits two-digit names across lines; use regex, not contains.
- Windows Bun symlinks (D: paths) break inside Linux images. `.dockerignore`
  must exclude nested node_modules/dist BEFORE the first build; use --no-cache
  after fixing context. Never COPY a host dir containing node_modules.
- Seed exits early if any company row exists. Migration history is one
  squashed file by intent. Dev API image is Bun hot mode, not prod-hardened;
  no production Dockerfile exists yet.

## Codebase notes (viaannn)

- Shared UI at `apps/web/src/components/ui` (PhotoCard, ApprovalBar,
  WORKFLOW_ORDER, PrintButton, EmptyState, PageHeader, StatCard, ConfirmModal).
  `@/` alias maps to `./src`. Use shared, do not duplicate.
- Stream 3 (Oct 13) wired TanStack Query: `services/api/klien.ts` (endpoint
  contracts), `queries.ts` (hooks + mappers `petakan*`), LoginScreen +
  guard in App.tsx, logout in sidebar, Vite proxy `/api` → `localhost:8080`.
  Mock layer deleted (`mockAdapter`, `inspectionsApi`, `data/mockHse`,
  `NewReportModal`). `PageHeader` now takes clientName/siteName props.
- **hc/AppType is BlankSchema** in apps/api (routes registered
  statement-style, not chained, so `typeof app` carries no route types).
  Web uses typed fetch contracts instead. If api chains its mounts, swap
  klien.ts for the RPC client — read the POTETO probe finding first.
- APAR print scoping depends on body classes `printing-report`/`printing-card`.
  Shared PrintButton owns its title; per-page tooltips are lost on adoption.
- Hydrant delete hides when Approved (matches Patrol). P3K month buttons lock
  when Approved. P3k print needs injected `@page landscape`, not window.print.
- Known dead code (leave unless briefed): `AparCardRole` export, P3K toolbar
  label CSS rule, AparYearCard voided role prop, dev refs in comments/AGENTS/lib
  (UI copy already cleaned). Dashboard blue `#2383e2` keep-or-replace undecided.
- Photos: exactly one owner enforced (`num_nonnulls` check). Berat CO2 is real.
  Member role text is separate from the business role enum. Org id = companyId.
- Better Auth `trustedOrigins` allows 5173/3001/8080 only — a dev server that
  falls back to 5174 breaks `organization/set-active` (INVALID_ORIGIN). Kill
  stale 5173 listeners first (Oct 13: node pid held it a whole day).
- Section B hydrant findings + patrol photo upload remain local/placeholder
  until the upload stream lands; `PhotoCard` takes URL prop ('' = placeholder).

- Stream 4b landed (GLM, Oct 12): uploads + presigned GET (60s) + photo delete,
  pdfJobs + 5 exports via typed category registry, PDF module (render/templates/
  fonts). Known follow-ups: async queue for exports (~2s sync now), p3k-yearly
  spills to 2 pages, job retry/idempotency unbuilt, `waitDelay` fixed 300ms.
  Dev-DB residue: smoke-test rows (Lokasi Uji G2 etc.) in db + Garage.

## Stream 3 landed (GLM, Oct 13): web on live API

- All 5 pages + dashboard read/write the real API via TanStack Query v5
  (`src/services/api/queries.ts`, contracts in `klien.ts`). Mock layer deleted.
- Login screen + session guard + logout live. Optimistic writes: P3K items,
  patrol finding delete; others invalidate on settle.
- **`AppType` is blank (root cause found):** apps/api registers routes
  statement-style, so `typeof app` carries no route types. Web uses declared
  contracts in `klien.ts` — single swap point once api chains registrations.
- **Approval workflow is UI-local:** no persistence endpoint exists yet.
  Owner decision owed on endpoint shape.
- Photo upload + PDF buttons still placeholder (sibling scope). `PhotoCard`
  takes URL props, ready to wire.
- Better Auth `trustedOrigins` allows only 5173/3001/8080 — a stale listener
  on 5174 caused INVALID_ORIGIN. Add a doctor/CI check.
- Web lint: 2 unused imports + 1 purity warning in AparPage (exit 1, benign).
  Bundle 512 kB — code-split later.
- Web dev proxy `/api` → `http://localhost:8080` (Caddy).

- Wave 4 J landed (Oct 13): storage host-route solved via presign origin
  rewrite (`PUBLIC_STORAGE_BASE`, default `http://localhost:8080/storage`) +
  Caddy `/storage/*` handle_path; `audience:"internal"` keeps Gotenberg img
  presigns on `garage:3900`. `GET /api/photos?inspectionKind=&inspectionId=`
  live. **Gate is now 93/93** (not 88). LEWAT skip pattern dead — byte fetch
  uses the same /storage route. Deploy stream must set PUBLIC_STORAGE_BASE.

## Wave 4 finish (coordinator takeover, Oct 13 — provider limit killed K+L)

- **Print:** p3k-yearly already renders 1 landscape page (re-measured, no change
  needed). `waitForExpression` already in render.ts. Soak rewritten host-side
  (`infra/soak/soak.mjs` + README): **50/50, p50 ~1.1s** (Chromium floor, API
  overhead negligible), gotenberg ~307 MiB, 0 restarts. Gotenberg digest pinned
  in compose. K's in-container soak approach deleted (baked image can't see new
  files). Soak residue: HYD/AP-SOAK, Kotak Soak, patrol report, 50 pdfJobs.
- **Web:** lint clean (exit 0), bundle split live (per-page chunks, no 500 kB
  warning), Section B reads `useFotoInspeksi` → PhotoCard (photo-list wired),
  Edit loop + patrol chips verified in L's commits. Nothing left open on L.
- Takeover lesson: check git log first — L had committed 3/5 items, K's
  waitForExpression + p3k tightening were already on disk. Verify before redoing.
- First browser run (Oct 13) found two runtime bugs no gate caught: (1) Bun
  monorepo nests duplicate react copies → invalid hook call; fixed with
  `resolve.dedupe: ['react','react-dom']` in web vite.config. (2) Feed contract
  mismatch — API sends `hydrant`, web typed/read `hidran` → dashboard crash;
  fixed + hardened all feed arrays with `?? []`. Gate gap: check script asserts
  status, not key names — mirror contract keys in a web-side assertion.

## Wave 3 debrief gotchas (GLM worker I, Oct 13)

- Browser MCP tool exists but returns `browser.disconnected` (no desktop
  browser attached). Plan HTTP-level proofs from the start: write proof scripts
  BEFORE UI code — they double as contract docs.
- PowerShell here-string splices into source risk encoding damage. Read UTF8,
  write with `New-Object System.Text.UTF8Encoding($false)` (utf8NoBOM enum is
  invalid on PS5), verify non-ASCII (√ · – curly quotes) survive. After any
  scripted splice, re-read the region before using edit (oldString breaks).
- Approval endpoint: transition validation (400) fires BEFORE submitter rule
  (403). Test 403 only at DIKETAHUI. Lock-message mapping in `gagal()` matches
  the API substring "proses persetujuan" — rewording editLocked() degrades it.
- `bunx tsc -b` is the web typecheck (no `bun run typecheck` script).
  `docker compose exec -e VAR=…` needs the flag BEFORE the service name.
- Photo session state: uploaded photos persist in Garage but lists live in page
  state (refresh loses visuals). `GET /photos?inspectionId=` would fix it and
  delete ~40 lines of page state — top API follow-up.
- Patrol approval bar binds to the newest report only (per-report bar exists in
  the feed modal). APAR synthetic post-save report omits approvalStatus so its
  Edit still just closes the modal (pre-existing).

## Wave 3 landed (Oct 13, both GLM): approvals + real uploads + PDF downloads

- API (H): approval lifecycle on 4 categories (`POST /api/approvals/:category/:refId/approval`,
  ajukan/ketahui/setujui/kembalikan; submitter 403 on setujui; edits 409 beyond
  DRAFT), `AppType` fixed via chained registrations (klien.ts still valid),
  gate now **88/88** in-container. 4 commits.
- Web (I): ApprovalBar on real endpoint (per-record bars in modals), edit locks
  surface 409 as Indonesian notice, photo upload/preview/delete in Hydrant+APAR
  modals (3 captioned slots APAR), Unduh PDF buttons on all 5 categories
  (post+poll+download), P3K draft print fits one landscape page. 6 commits.
  Build 2839 modules green.
- Follow-ups owed: presigned URLs are `garage:3900` (unreachable from host
  browser — needs Caddy `/storage/*` route or presign host override); no
  list-photos-per-inspection endpoint (photo lists live in page state);
  approvals not role-gated (identity-only: any second user can approve);
  patrol findings still placeholders; dev-DB residue (HYD-W3, approver user,
  pdfJobs rows) — reset before demo; stray `gotenberg-spike-hydrant` container
  still up.

## Stream 3 debrief gotchas (GLM worker, Oct 13)

- **No git repo.** Deleted files are unrecoverable (mockHse deletion cost a
  hand-reconstruction of APAR_SIGNATURES). Initialize git before next wave.
- Auth session = 3 steps: sign-in → `organization/set-active` (requires Origin
  header; PowerShell must send `@{ Origin = 'http://localhost:5173' }`) → then
  requests. Missing set-active looks like a cookie bug (401 "Sesi tidak valid").
- Stale dev server on 5173 = silent fallback to 5174 = INVALID_ORIGIN (auth
  looks broken but it's a port problem). Check `Get-NetTCPConnection
  -LocalPort 5173` and kill before testing. Vite proxies are read at startup.
- Workers at this depth CANNOT spawn subagents (subagent_depth limit). Plan
  direct recon. ctx7 syntax: resolve via `library <name> "query"` first, then
  `docs <resolved-id> "query"` (2 args, no leading path guessing).
- Editing big files by exact oldString breaks after scripted splices — script
  the removal (IndexOf/Remove), then edit the smaller file. Grep importers
  BEFORE deleting any file.
- `hc` probes must property-access a real leaf; blank schema still returns a
  `client.api` object that passes lazy probes.
- API shape changes must be mirrored into `klien.ts` by hand until AppType is
  fixed. Patrol photos: findings hold bare s3Keys, `GET /api/photos/:id` takes
  photo ids — upload stream must decide (photo rows vs findings-photo endpoint).
- P3K save = up to 21 sequential PATCHes (fine now; bulk endpoint if atomicity
  needed). Hydrant Section B still hardcoded 5 items. No router — Edit in
  ReportDetailModal just closes. Bundle 512 kB, code-split pages if wanted.

## Stream 4b gotchas (GLM worker, Oct 12)
- **API container bakes code at build (no bind mount).** Every source change
  needs `docker compose build api && up -d api` before the check sees it. Batch
  edits before rebuilding. Biggest loop-cost item.
- Garage has no host port. Presigned URLs (`garage:3900`) resolve only inside
  the network. Byte proofs via `docker compose exec -e CHECK_BASE=http://caddy:80 api …`.
  Host gate run shows LEWAT on the two byte-fetch records — not a regression.
- PowerShell: `Select-String` returns MatchInfo (take `.Line` first); curl.exe
  + nested JSON escaping silently fails — write scratch Bun proof scripts as
  files instead; `bun run typecheck` prints to stderr (red noise, exit 0 is truth).
- Inspection DELETE needs photo delete first (children guards + CHECK
  constraint). Web delete flows must use the same order.
- Patrol findings take raw `s3Key` strings (demo-grade shim — placeholder box
  when object missing). Real patrol upload flow should reuse the uploads route.
- Apar-card near-miss: `eq(period, period)` tautology passed typecheck; only
  reading loader against template data contract caught it.
- Reset dev DB + Garage fixtures before any demo (smoke-test rows remain).
- After `docker compose up -d api` (rebuild/restart), a check run within ~15s
  can return 0/88 (caddy→stale api container). Wait and re-run; not a regression.

## Wave 1 journeys (compressed)

- A: shared pkg first (types, status, dates, catalog, Zod) → verified build →
  API skeleton → ctx7 Drizzle checks → schema → migration → auth config/CLI →
  seed → compose/env → port fight → migrate/seed clean → Garage/API crash
  loops fixed at root cause → bucket+key → squash → all five green.
- B: read skill set → studied prototype print CSS → Docker hunt/boot →
  fonts hunt → scratch Gotenberg → template → 400 fix (index.html name) →
  A4 proof via pypdf → 3× byte-identical renders → README, artifacts cleaned.
- C: robocopy preview → baseline green → drift grep → 5 principle leaves →
  shared kit unit-first → accents/legends/labels/approval per page → P3K
  print regression caught and restored → green after every unit.
- Fix: mapped tree → read shared + pages → greps → Hydrant PhotoCard,
  APAR PrintButton ×2, APAR ApprovalBar → reverted one invented class →
  build + grep evidence + HTTP 200.
- F2 (Stream 3, Oct 13): probe found AppType=BlankSchema → fetch contracts
  → infra (QueryClientProvider, proxy) → auth (login+guard+logout) →
  dashboard feed → Hydrant → APAR (+kartu derive) → P3K (items, optimistic) →
  Patrol → deletions (mock layer) → round-trip + POST/PATCH proofs → DOX.
  Stale 5173 listener cost a false INVALID_ORIGIN; killed, re-proven on 5173.
