# 04 — API (Hono, `/api` root, auth everywhere except login)

Ported from the prototype route manifest. Changes: Better Auth replaces NextAuth;
uploads go to Garage (not Vercel Blob); PDFs via Gotenberg jobs (not react-pdf).

## Auth (Better Auth, email+password; org = company)

- `POST /api/auth/*` — Better Auth handler (login/logout/session).
- `POST /api/users` (auth) — create staff user.
- Every other route: session check + `companyId` scoping from active org.

## CRUD (all auth, all scoped by companyId; delete blocked with children)

- Clients/companies: `GET POST /api/clients`, `GET PATCH DELETE /api/clients/:id`
- Sites: `GET POST /api/sites?clientId=`, `GET PATCH DELETE /api/sites/:id`
- Zones: `GET POST /api/zones?siteId=`, `GET PATCH DELETE /api/zones/:id`
- `hydrant-units`, `apar-units`, `p3k-boxes`: same 5-route shape. P3K create
  auto-seeds its 21 item rows per inspection (catalog from shared pkg).
- Inspections `hydrant|apar|p3k`: `GET (by asset + period)`, `POST` (one per
  month — unique guard), `GET/PATCH/DELETE /:id`.
- Patrol: `GET POST /api/safety-patrol-reports?siteId=`, `GET/PATCH/DELETE /:id`;
  findings nested `GET POST /:id/findings`, `DELETE /findings/:fid`.

## Feed, dashboard, settings

- `GET /api/inspections?month=` — unified calendar feed, 4 categories.
- `GET /api/dashboard/expiring-apar?days=` — expiry alerts.
- `GET/PATCH /api/settings/apar-expiry-alert-days`.

## Uploads (Garage, private bucket)

- `POST /api/uploads` — multipart, validate image, store bytes in Garage,
  return key. `GET /api/photos/:id` — tenant check, 302 to short-lived
  presigned GET. Never expose the bucket.

## Project maps (denah per project, owner-approved Oct 27)

- `GET /api/project-maps` — list the active project's images, `dipilih` flag
  included, ordered by `urutan` then `createdAt`.
- `POST /api/project-maps` — multipart `file` (+ optional `nama`),
  JPEG/PNG/WebP, max 10 MB, max 20 images per project; first upload is
  selected automatically.
- `GET /api/project-maps/:id/berkas` — tenant check, 302 to a 60s presigned GET.
- `PUT /api/project-maps/:id/dipilih` — one transaction clears siblings and sets
  this image; the choice is per project, shared by every member.
- `PATCH /api/project-maps/:id` (`nama`), `DELETE /api/project-maps/:id` (object
  then row; deleting the chosen image promotes the newest remaining one).

## PDF export (async via Gotenberg, private network only)

- `POST /api/export/:category/:refId` — queue job, render Chromium template
  (§06), store PDF in Garage. `GET /api/pdf-jobs/:id` — status + download
  when done. (~2s per file; never block the request.)

## Conventions

- Zod-validate all inputs; problem-shaped errors; cursor pagination on lists.
- Hono RPC client (`hc`) generated for the web app — end-to-end types.
