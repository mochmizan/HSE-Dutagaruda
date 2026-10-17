---
name: verify-viaannn
description: "Drive the viaannn HSE inspection app (login-gated Vite+React UI on Caddy :8080 + Hono JSON API) the way a user does — HTTP lane for any agent, browser lane for the coordinator. Use to prove Hydrant/APAR/P3K/Patrol/approval behavior with captured evidence."
---

# Verifikasi viaannn

Scripted way to drive the real app and prove behavior. Read cold, mid-task:
launch the stack, run the doctor, drive ONE feature from `features/`,
capture evidence, clean up. This repo has no Playwright/Cypress and no
`.cursor/` wiring (repo convention: OpenCode only) — the harness below is
plain HTTP (`curl.exe` / `bun`) plus the coordinator browser tool.

## Launch

Exact commands, from repo root `D:\dev\viaannn`:

```powershell
cd D:\dev\viaannn\infra
docker compose up -d
Start-Sleep 20
curl.exe -s -m 20 http://localhost:8080/api/health
# expect: {"status":"ok","service":"viaannn-api"}
```

Ready means usable, not just "process answers": after `up -d`, wait ~20s
(caddy→stale-container race returns empty checks right after restart; not a
regression), then require `api-health` LULUS from the doctor below.

What "up" gives you (all `restart: unless-stopped`):

- Caddy `:8080` — serves the prod web build (`apps/web/dist`) AND proxies
  `/api/*` → api:3001, `/storage/*` → garage. Single review/verify origin.
- API + Postgres 17 + Garage (S3 foto) + Gotenberg 8 (PDF Chromium).
- Seed data (only on a FRESH database — never reseed a live one):
  company `PT DUTAGARUDA PIRANTI PRIMA`, site `Pabrik Utama`,
  `pengawas@contoh.id` / `Pengawas123`,
  approver `budi.approver@contoh.id` / `Approver123`.

Web iteration (optional, NOT the verify path): `cd apps/web` →
`bun run dev --port 5173 --host 0.0.0.0 --strictPort` (proxy `/api`→`:8080`).
After web edits the verify path needs `bun run build` + `docker compose
restart caddy` (dist is baked at build time).

Teardown: there is none per run — the stack is the persistent review
instance. Never `docker compose down` (deletes nothing, but drops the
company review link until restart). Cleanup (§Cleanup) removes only what
your run created.

## Doctor

One read-only check, run FIRST whenever anything looks off:

```powershell
cd D:\dev\viaannn
bun wiki/helpers/verify-doctor.mjs
```

Exit 0 = instance worth driving (daemon, 5 services Up, api-health 200,
web shell 200). Exit 1 = fix the GAGAL line first, do not drive.

## Drive

Two lanes. HTTP lane works for every agent (this repo's workers have no
browser tool — HTTP proofs only; coordinator owns browser verification).
Browser lane needs the coordinator browser tool.

Auth (3 steps, all required — missing set-active looks like a cookie bug,
401 "Sesi tidak valid"):

```powershell
$J = "$env:TEMP\viaannn-jar.txt"
curl.exe -s -c $J -X POST http://localhost:8080/api/auth/sign-in/email `
  -H "Content-Type: application/json" -H "Origin: http://localhost:8080" `
  --data '{"email":"pengawas@contoh.id","password":"Pengawas123"}'
curl.exe -s -b $J -c $J -X POST http://localhost:8080/api/auth/organization/set-active `
  -H "Content-Type: application/json" -H "Origin: http://localhost:8080" `
  --data '{"organizationId":"seed-perusahaan-1"}'
curl.exe -s -b $J "http://localhost:8080/api/inspections?month=2026-10"
# expect JSON with keys: hydrant, apar, p3k, patrol
```

Real routes (all auth + `companyId` scoped unless noted; base
`http://localhost:8080`):

- Unit: `GET /api/hydrant-units?limit=100`, `GET /api/apar-units?limit=100`
- Inspeksi: `GET /api/hydrant-inspections?limit=100`,
  `GET /api/apar-inspections?limit=100`, `GET /api/p3k-inspections?limit=100`
- Patrol: `GET /api/safety-patrol-reports`, `GET /api/safety-patrol-reports/:id/findings`
- Umpan kalender: `GET /api/inspections?month=YYYY-MM`
- Foto: `GET /api/photos?inspectionKind=hydrant&inspectionId=<id>` (daftar),
  `GET /api/photos/:id` (302 ke presign singkat)
- Ekspor PDF: `POST /api/export/:category/:refId` → job,
  `GET /api/pdf-jobs/:id` (status + unduhan, ~2 detik per berkas)

Browser lane (labels below are literal — copy them exactly):

- Login: label `Email`, `Kata Sandi`, tombol `Masuk`.
- Sidebar: `Buka Kalender Inspeksi`, `Kalender Inspeksi`, `Inspeksi Hydrant`,
  `Inspeksi APAR`, `Inspeksi P3K`, `Patroli K3`, `Keluar` (aria-label
  `Keluar dari aplikasi`). Company header reads
  `PT DUTAGARUDA PIRANTI PRIMA`.
- Hydrant: row click → modal `Formulir Pemeriksaan` (6 selects + foto +
  catatan + tombol `Hapus Bulan Ini` untuk rekam bulan ini).
- APAR: `Selesaikan & Terbitkan`, `Tambah APAR`, `Cetak Kartu`, heading
  `Catatan :`, rekap `Kadaluwarsa APAR`.
- P3K: year grid 21 items × 12 months (√ / × / KD), rows `TANGGAL INSPEKSI`
  + `PARAF`; month header click = input form.
- Patrol: header `LAPORAN KEGIATAN SAFETY PATROL`, add form requires
  photo + caption, date defaults today.

Browser automation gotchas (learned Oct 13, all still true): assert on
body-text, NOT `[role=dialog]` (P3K modal has none); find+click in ONE
evaluate (re-render detaches nodes); date inputs need the native value
setter; submit login via `form.requestSubmit()`.

## Evidence

Proof standards (no exceptions):

- Exercise the real user path, not internal setters or test-only endpoints.
- Capture the action AND the resulting state, not just the final screen.
- Verify side effects alongside what's visible: after a mutation, re-read
  from a second view (list endpoint, feed, reopened modal) — a save status
  alone is insufficient proof.
- Mocks only where a production boundary already isolates the system
  (there are none in the drive paths — Garage/Gotenberg are real here).
- Prefer read-only journeys. Mutations need a second agent-visible reason
  AND must create clearly-marked fixtures (`uji-` prefix) that the same run
  deletes (dev-DB residue from past runs: soak assets, HYD-W3, pdfJobs rows).
- Never weaken a journey to make it pass. A journey whose seed precondition
  is missing FAILS with the reason filed in that feature's `Gotchas`.

Where it goes: `wiki/artifacts/<run-id>/<feature>/` (git-ignored; survives
cleanup BY DESIGN). Each run leaves: raw bodies (`*.json`), one screenshot
or ARIA/body-text snapshot for browser legs, and `PROOF.md` (commands run,
statuses, timestamps, feature ID + entry point used).

## Cleanup

- Delete cookie jars and temp request files created by the run.
- Delete every `uji-` fixture the run created (units, inspections, findings,
  uploaded photos via `DELETE /api/photos/:id` BEFORE deleting the parent
  inspection — children guards block parent-first deletes).
- Re-run the affected `GET` to show the fixture is gone.
- Never kill by process name; kill what you started (normally: nothing —
  the stack stays up for review). Never remove `wiki/artifacts/`.
- After cleanup, confirm the evidence still exists at the named location —
  a cleanup that eats the proof fails the run.

## Helpers

- `wiki/helpers/verify-doctor.mjs` — the Doctor above. Run:
  `bun wiki/helpers/verify-doctor.mjs` from repo root. Exit 0/1,
  Indonesian `LULUS`/`GAGAL` lines. Read-only (no login, no writes).
