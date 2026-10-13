# Wave memory (next workers read this first, after the spec)

History: Waves 1–4, Oct 12–13. Workers A–L + coordinator takeovers. Git repo
initialized Oct 13; history is trustworthy — check `git log` before redoing
anything (takeover lesson: L/K items were already on disk).

## Standing rules

- Every brief leads with: read poteto-mode SKILL.md in full FIRST (owner order).
- Every landing closes with a debrief (journey, gotchas, observations) folded
  into this file by the coordinator.
- No code in prototype `D:\dev\ohs\scrape` (read-only). No shared paths between
  workers. Fresh worker per task, no resumes.
- Thin/stalled reports: message the same session again (provider traffic kills
  sessions sometimes). New spawn only when the session is dead.
- Coordinator owns browser verification (workers have no browser tool; HTTP
  proofs only). First real browser run is mandatory before calling UI done.

## Gates (green baselines, re-run these — never trust a report alone)

- API: `docker compose exec -e CHECK_BASE=http://caddy:80 api bun run src/check.ts`
  → **93/93** (`apps/api/AGENTS.md` documents it). Covers auth, CRUD, 409
  duplicate-month, cross-company 404s, Zod 400s, uploads, presigned 302, 5
  exports, pdfJobs, photo delete, approvals, photo list.
- Web: `bun run build` in `apps/web` (tsc + vite, ~2840 modules), oxlint clean.
- Soak: `bun infra/soak/soak.mjs` → 50/50, p50 ~1.1s (Chromium floor).
- After `docker compose up -d api`, wait ~15s before checking (caddy→stale
  container race returns 0/88; not a regression).
- Check script asserts status, NOT contract key names. The `hydrant`/`hidran`
  feed crash proved it. Mirror contract keys in a web-side assertion (owed).

## Auth (3 steps, all required)

- Sign-in → `organization/set-active` (needs `Origin` header; PowerShell must
  send `@{ Origin = 'http://localhost:5173' }`) → requests. Missing set-active
  looks like a cookie bug (401 "Sesi tidak valid").
- `trustedOrigins` allows 5173/3001/8080 only. Kill stale 5173 listeners first
  (`Get-NetTCPConnection -LocalPort 5173`), or login dies with INVALID_ORIGIN.
- Dev logins: `pengawas@contoh.id` / `Pengawas123`, approver
  `budi.approver@contoh.id` / `Approver123`. Dev-only; rotate before sharing.
- Approval transitions: 400 fires BEFORE the 403 submitter rule — test 403
  only at DIKETAHUI. Lock-message mapping in web `gagal()` keys on the API
  substring "proses persetujuan"; rewording `editLocked()` degrades it.

## API facts

- Better Auth + Drizzle: `drizzleAdapter` NEEDS `schema: authSchema`
  (auth-schema.ts holds user/session/account/verification/organization/member/
  invitation). Without it the adapter sees zero tables.
- `AppType` is FIXED (chained registrations). Web still uses hand-written
  `klien.ts` — the single swap point for the RPC client. API shape changes
  must be mirrored there by hand until the swap.
- Drizzle postgres-js init: `{ client, schema }`. Migrator:
  `drizzle-orm/postgres-js/migrator`. Better Auth CLI has NO dialect flag.
  No auto-cast text→real: squash pre-release migrations (house style, one file).
- CompanyId on everything; org id = companyId. P3K create auto-seeds 21 rows.
  Inspection DELETE needs photo delete first (children guards + CHECK).
  Patrol findings hold bare s3Keys (placeholder when object missing).
- Storage split: presigns rewritten to `PUBLIC_STORAGE_BASE`
  (default `http://localhost:8080/storage`) + Caddy `/storage/*` handle_path;
  `audience:"internal"` keeps Gotenberg img presigns on `garage:3900`.
  Deploy stream MUST set PUBLIC_STORAGE_BASE (HTTPS, real domain).
- `GET /api/photos?inspectionKind=&inspectionId=` lists photo rows (tenant
  scoped). Web Section B reads it via `useFotoInspeksi`.
- Exports sync in-request (~2s); async queue + job retry/idempotency unbuilt.
  `waitForExpression` (images complete) + 150ms fallback in render.ts.

## Web facts

- Shared UI: `src/components/ui` (PhotoCard, ApprovalBar/WORKFLOW_ORDER,
  PrintButton, EmptyState, PageHeader, StatCard, ConfirmModal, FileFotoButton,
  UnduhPdfButton). `@/` → `./src`. Use shared, do not duplicate.
- Server state: `services/api/{klien,queries,liveClient,queryClient}`.
  QueryClient retry 1. Period keys `YYYY-MM` normalized in `periodeBaris`.
  APAR year card derives from stored inspections (never local card state).
- Login screen + session guard + logout. Dev proxy `/api` → `:8080`.
- Print: APAR scoping via body classes; P3K draft fits one landscape page;
  approval bars live in modals (per record); 409 surfaces as Indonesian notice.
- Known residue: `.apar-toolbar-label` CSS unused; patrol bar binds newest
  report (per-report bar in feed modal); APAR synthetic post-save report has
  no approvalStatus (Edit closes by design); bundle split live, no router.

## Environment (Windows + PowerShell)

- Bun monorepo nests duplicate react copies → invalid hook call at runtime.
  Fixed with `resolve.dedupe: ['react','react-dom']` in web vite.config.
- No `head/tail/grep/cat`, no `&&`, bare `echo` fails, `$env:` prefix, no
  `utf8NoBOM` enum on PS5 (write UTF8 via `New-Object System.Text.UTF8Encoding($false)`),
  here-string splices risk encoding damage (verify √ · – quotes survive).
  `curl` aliased — call `curl.exe` or write Bun proof scripts as files.
- `Select-String` returns MatchInfo (take `.Line`). `docker compose exec -e
  VAR=` goes BEFORE the service name. Docker logs to stderr (exit 1, usable).
  Tsx deprecation warning + `bun run typecheck` stderr noise are harmless.
- Ports: host 5432 held (use 5433; compose internal stays 5432). Garage has no
  host port — byte proofs run inside the network. Python: `C:\Python314`.
- Docker Desktop binary under LocalAppData. No bind mount on api image:
  every source change needs rebuild before checks see it (batch edits).
- ctx7: resolve via `library <name> "query"` first, then `docs <id> "query"`.
  Principle leaves: list the marketplace dir (`**` glob finds nothing).
- Large files truncate; offset reads. After scripted splices, re-read before
  editing. Grep importers BEFORE deleting.

## Infra / deploy notes

- Compose: caddy + api + postgres:17 + garage + gotenberg:8 (digest pinned).
  Dev API image is Bun hot mode — no production Dockerfile yet.
- `.env` holds dev-only secrets (Garage key realigned Oct 13 to
  `viaannn-api-key`, RW on `hse-foto`). Rotate before sharing.
- Fresh Postgres reset does NOT reset Garage volumes.
- Dev-DB residue (reset before any demo): soak assets (HYD/AP-SOAK, Kotak
  Soak), HYD-W3, approver user, pdfJobs rows, spike fixtures.
- No prod hardening: Caddy has no TLS/real domain, no backups cron
  (`pg_dump` owed), no async PDF queue, no rate limits.

## Open decisions (owner)

- Patrol findings photo flow: photo rows vs findings-photo endpoint (pending).
- Role-gated approvals: owner said KEEP identity-only (any non-submitter).
  Revisit only if asked.
- Paper-scan diff for print fidelity: no scan provided yet.
