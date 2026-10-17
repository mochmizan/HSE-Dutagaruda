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
- Coordinator owns design + browser-verification plan (workers have no browser
  tool; HTTP proofs only, real browser run is owed before calling UI done).
  Coordinator runs NO verification passes itself — builds, gates, proofs,
  dist rebuilds, and caddy restarts are all delegated.
- Page edits update their `wiki/features/` map file in the same task
  (labels, entry points, gotchas) and prove via `wiki/SKILL.md`.

## Gates (green baselines, re-run these — never trust a report alone)

- API: `docker compose exec -e CHECK_BASE=http://caddy:80 api bun run src/check.ts`
  → **63/63** (`apps/api/AGENTS.md` documents it). Covers auth, CRUD, 409
  duplicate-month, cross-company 404s, Zod 400s, uploads, presigned 302, 5
  exports, pdfJobs, photo delete, photo list. (63 sejak 17 Okt: alur
  persetujuan dicabut total, dulu 93. 66 sejak foto temuan patroli asli.)
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
  `budi.approver@contoh.id` / `Approver123` (login biasa sejak 17 Okt —
  tidak ada lagi aksi khusus approver). Dev-only; rotate before sharing.

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

- Shared UI: `src/components/ui` (PhotoCard,
  PrintButton, EmptyState, PageHeader, StatCard, ConfirmModal, FileFotoButton,
  UnduhPdfButton). `@/` → `./src`. Use shared, do not duplicate.
- Server state: `services/api/{klien,queries,liveClient,queryClient}`.
  QueryClient retry 1. Period keys `YYYY-MM` normalized in `periodeBaris`.
  APAR year card derives from stored inspections (never local card state).
- Login screen + session guard + logout. Dev proxy `/api` → `:8080`.
- Print: APAR scoping via body classes; P3K draft fits one landscape page;
  409 surfaces as Indonesian notice.
- Known residue: `.apar-toolbar-label` CSS unused; APAR synthetic post-save
  report has no API id (Edit closes by design); bundle split live, no router.

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

## Harness improvements (coordinator, Oct 13 — from gotcha archaeology)
- `bun run doctor` (scripts/doctor.mjs): pre-flight green/red — daemon,
  5 services, 5173 occupancy, postgres, api health, digest pin, env keys,
  git clean. Run before every wave.
- `infra/docker-compose.override.yml`: bind-mounts api+shared src (ro) so a
  container RESTART picks up edits with NO image rebuild. Nota: api CMD has
  no --hot — bind mount alone does nothing until `restart api`. `up -d` alone
  also skips restart when config is unchanged; `up -d` IS needed after .env
  edits (interpolation), `restart` is enough after src edits.
- API fails fast on missing env (Indonesian message, lists keys) instead of
  cryptic runtime 500s.
- Feed gate now asserts contract key names (`hydrant/apar/p3k/patrol` arrays),
  not just 200. The `hidran` crash class is covered.
- Doctor caught its own bugs on first run (Bun.connect unusable here →
  exec/powershell probes; static detail strings). Eat your own output.
- Tailnet share (Oct 13): `tailscale serve --bg http://localhost:5173` →
  `https://desktop-6srl494.tail2e9cdf.ts.net` (no admin/firewall rule needed;
  tailscaled terminates TLS). API trustedOrigins holds tailnet https + IP
  plus TRUSTED_ORIGINS env override; vite bound 0.0.0.0, allowedHosts .ts.net.
  Gotcha: api CMD has no --hot, so bind mount alone does nothing until
  `docker compose restart api` (src edits). After .env edits use `up -d`
  (compose interpolation), `restart` keeps old env.
- Sweep Oct 13 (browser, semua halaman): hydrant completed-row + card
  "Lihat Laporan" dead without onOpenReportDetail → fallback to modal;
  hardcoded '04 Sep 2026' → real date (guarded isValid); hydrant default
  month Sep → real current month (APAR year-locked by design, untouched);
  unit-create sent zone NAME as zoneId + duplicate zones → find-or-create in
  mutation (both pages); dead "Registri Aset" nav removed; P3K tanggal/paraf
  silently dropped → real columns (0001 migration) + upsert save (no more 409
  on re-save); patrol add works, photo intentionally draft-key (owner scope).
  Detectors: assert on body-text, not [role=dialog] (P3K modal has none).
  Synthetic clicks must find+click in ONE evaluate (re-render detaches nodes).
- Owed: unique(site,zone) constraint (API allows dup names); patrol real
  photo upload; PUBLIC_STORAGE_BASE back to localhost after demo.
- Company is PT DUTAGARUDA PIRANTI PRIMA (seed + live DB renamed Oct 13).
  Demo logins keep @contoh.id emails.
- Review-day persistence (Oct 14): prod build served by Caddy
  (`../apps/web/dist:/srv/web:ro` + SPA fallback in `handle`; all routes in
  ordered `handle` blocks — bare try_files/file_server swallows /api with 405
  because `handle` outranks bare `reverse_proxy`). 443 serve → :8080, :8443
  kept for storage URLs. `infra/startup-review.ps1` + Startup-folder cmd
  boots Docker Desktop + compose at logon (no admin for schtasks here).
  Rebuild web + `restart caddy` after web edits (dist is baked at build time).
- Row-click blank page (Oct 13, found in browser): TDZ `period` used above its
  `const` in HydrantPage — silent until row click set state. Fix: declare
  month/period before `inspeksiAktif`. APAR/P3K/Patrol audited clean.
  Encoded: oxlint `no-use-before-define` (functions:false) + moved
  `emptyYearCell` above use. tsc cannot see this class.
- Verifikasi (Oct 16): `wiki/SKILL.md` (launch/doctor/drive/evidence/
  cleanup) + `wiki/features/` (README + hydrant/apar/p3k/patroli/
  persetujuan map files) + `wiki/helpers/verify-doctor.mjs` (read-only,
  exit 0/1). Proof run 20261016-bukti-awal: HTTP lane hydrant read hijau
  (feed keys hydrant/apar/p3k/patrol, 4 unit scope-ok, 2 inspeksi); list
  shape `{items:[...]}` bukan `{data:[...]}`. Browser leg (`Formulir
  Pemeriksaan` click) TERUTANG — sesi itu tanpa browser tool. Artefak
  bukti: `wiki/artifacts/` (git-ignored, selamat dari cleanup).

## Prototype (frozen, folded from ohs/scrape HANDOVER.md Oct 17)

- `D:\dev\ohs\scrape` is the UI-only prototype (Hydrant/APAR/P3K/Patrol
  DONE 12 Okt). Read-only reference. No code there, ever.
- Its HANDOVER.md was folded here and deleted. Prototype debt that
  carried over: patrol finding photos were placeholders (fix in flight,
  see below); everything else (storage, PDF, auth, DB) is real in this
  repo now.

## Open decisions (owner)

- Patrol findings photo flow: DECIDED Oct 17 (lead call) — findings-photo
  endpoint, not photo-row joins. Findings already own s3Key/mime/bytes/
  sha256; single-query feed reads stay; delete cascades. In build now.
- Paper-scan diff for print fidelity: BLOCKED — no scan provided yet.
  Owner supplies one paper scan per category to unblock.

## Team (poteto-agent roster, reuse via sessionID)

- Owner order (Oct 17, replaces poteto-agent roster): no more poteto-agent
  — too slow. Coordinator does the work directly or spawns general agents.
  Roster sesi poteto pensiun; tugas draft-popup yang tertunda diselesaikan
  langsung saat laporannya mendarat.
- Coordinator (this chat): engineering lead + PM — design, briefs, docs,
  reply. No implementation, no verification runs. No browser tool
  here — browser lane is an explicit delegate step or an owed owner step.

## Debrief (Oct 17 — label Hapus hydrant+apar, poteto-agent team)

- Web delegate renamed modal button `Hapus Bulan Ini` → `Hapus` (+ title
  `Hapus Inspeksi`), hydrant + apar, zero logic change. APAR wiring
  untouched. Commits `f00a1c6` + `66fbce7` (AGENTS label sync).
- Confirmed to owner: Hapus hard-deletes (photos first for 409 guard,
  then `db.delete` record; `inspections.ts` + `units.ts` guard with
  `blockedByChildren`, no soft delete anywhere).
- Owner report open: Hapus missing in draft popup, only on completed.
  Web delegate investigating (briefed Oct 17).

## Debrief (Oct 17 — patrol real photo, poteto-agent team)

- Reused the same two poteto-agents via resume (owner order: always
  reuse, no fresh spawns). Both hit the nesting depth limit for their
  own spawns and owned their diffs directly per the playbook exception.
- API: `POST /:id/findings/photo` (multipart, guard ala uploads.ts),
  `GET /findings/:fid/photo` (302), Garage best-effort cleanup on
  finding/report delete. JSON findings endpoint kept. Gate 66/66.
- Web: add-form uploads real File (8 MB guard, Indonesian messages),
  feed resolves per-finding URL, `draft/` rows keep grey placeholder.
  Build exit 0.
- Coordinator proof (HTTP lane, fixture `uji-` bersih): report 201,
  upload 201 (70 bytes, real key), resolve 302 garage, list 1, delete
  finding 200, delete report 200, re-read 404. Evidence:
  `wiki/artifacts/20261017-temuan-foto/patroli/PROOF.md`.

## Debrief (Oct 17 — tier merge + month delete, poteto-mode Feature)
- Owner order: merge staff+pengawas tiers, no mengajukan features; add
  Hydrant/APAR month delete; work under poteto-mode SKILL.md adapted to
  OpenCode (subagents on `opencode/glm-5.3-flash-free`, no kenari).
- Throughput: worker A (API) + worker B (web) parallel, disjoint files;
  coordinator owned verify + wiki/memory + this debrief.
- Removed: `routes/approvals.ts` + mount, shared Approval types + `Role`,
  16 approval columns + `approval_status`/`role` enums (migration
  `0002_lowly_war_machine`), all `editLocked()` guards + helper, `role`
  on `POST /api/users`, `ApprovalBar` + all usages/lock logic, approval
  hooks/types in klien/queries, 30 gate checks → 63/63 green.
- Kept deliberately: PDF footer sign blocks (paper parity, separate owed
  print-diff item); approver seed login (ordinary login, demo-safe); dual
  save buttons (both live saves, out of the ban list); `spec/` frozen.
- Added: `Hapus Bulan Ini` on Hydrant + APAR modals mirroring P3K
  (hook deletes month photos first, then record; ConfirmModal step).
- Real bug found mid-task: finding delete in HydrantPage called
  `hapusFoto.mutate({id})` without inspectionId, so `invalidateFoto`
  skipped and the deleted photo stayed on screen. One-line fix
  (pass `jangkarTemuan`); DB round-trip proved writes/deletes real
  (upload 201 → list 1 → delete 200 → list 0 → psql 0 rows).
- Proof: `wiki/artifacts/20261017-tanpa-persetujuan/hapus-bulan/PROOF.md`
  (month-delete 201/409/200 + approvals route 404 + zero residue).
  Wiki maps synced same-task; `persetujuan.md` deleted.
- Watch next: web dist must be rebuilt + `restart caddy` after ANY web
  edit or reviewers see stale UI; api image bakes a COPY of apps/api
  (rebuild after src edits, restart is not enough).
