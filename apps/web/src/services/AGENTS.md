# API Services & Client Layer DOX — `src/services`

## Purpose

Live API layer for the web client: cookie-session fetch client, endpoint
contracts, and TanStack Query hooks. Mock mode is removed; every page reads
the Hono API through these hooks.

## Ownership

- `api/client.ts`: `ApiError` (status + body) — the one error type crossing
  from fetch to UI.
- `api/liveClient.ts`: cookie-session fetch (`credentials: include`), JSON
  mapping, `livePhotoUrl` for `GET /api/photos/:id`.
- `api/klien.ts`: endpoint contracts. Response/request types declared here
  (verbatim to API routes: `Halaman<T>`, `ApiInspeksiHidran`, `ApiUmpan`, …)
  plus one function per endpoint. This is the system boundary; internal code
  trusts these types. Carries photo
  (`unggahFoto` multipart via `livePostForm`, `hapusFoto`) and PDF export
  (`eksporPdf`, `ambilPdfJob`) contracts.
- `api/queries.ts`: TanStack Query hooks (`useSesi`-style naming in
  Indonesian: `useUnitHidran`, `useSimpanInspeksiApar`, …), query keys under
  `kunci`, mappers `petakan*` (API rows → UI models in `types/hse.ts`).
  Mutations invalidate on settle; `useUbahButirP3k` and
  `useHapusTemuanPatroli` are optimistic with rollback.
  `useHapusInspeksiHidran`/`useHapusInspeksiApar` delete the month record —
  child photos are cleaned first (`ambilFotoInspeksi` + `hapusFoto`) so the
  API's 409-on-remaining-photos guard never trips.
  `jalankanEkspor` posts an export then polls pdfJobs and returns the
  presigned download URL; `unduhBerkas` triggers the browser download.
- `api/index.ts`: barrel (`client`, `liveClient`, `klien`, `queries`).
- `api/queryClient.ts`: global `QueryClient` (retry 1, staleTime 30s,
  refetchOnWindowFocus off).

## Local Contracts

- The API base is `/api` and relies on the Vite dev proxy
  (`vite.config.ts` → `http://localhost:8080`, Caddy) or same-origin
  reverse proxy in production.
- `hc<AppType>` typed RPC is NOT used: `AppType` in apps/api is
  `BlankSchema` (routes are registered statement-style, so `typeof app`
  carries no route types). When apps/api chains its registrations, klien.ts
  is the file to swap for the typed client.
- Period keys: `YYYY-MM` in UI; API stores first-of-month dates
  (`periodeBaris` slices).
- One site per company (lowest `createdAt` wins) selected by
  `features/konteksLokasi.tsx` (`PenyediaLokasi`/`useKonteksLokasi`) —
  site meta, zone lists, and zone name↔id lookups live there, replacing
  the deleted `CURRENT_SITE` mock.

## Work Guidance

- No ad-hoc `fetch()` in components; add endpoints to `klien.ts`, hooks to
  `queries.ts`.
- New mutations follow the pattern: `onSettled` invalidate the touched keys
  (including `['umpan']` when calendar data changes); optimistic only where
  rollback is trivial.
- Indonesian error surfaced via `window.alert` in hook `onError` (acceptable
  until a toast exists).
- Photo uploads exist for hydrant/APAR inspections only — patrol
  findings keep placeholder `s3Key`s (owner decision pending on a
  findings-photo flow; do not invent an endpoint).
- Presigned URLs (`garage:3900`) resolve only inside the Docker network.
  Browser preview of photos and PDF downloads need a Caddy proxy route
  (infra) or a presign host override (api) — both outside apps/web scope.

## Verification

- `cd apps/web && bun run build` (tsc -b + vite), zero errors.
- Login round-trip proof: POST `/api/auth/sign-in/email` →
  `organization/set-active` → any list endpoint 200 (cookie jar), through
  `http://localhost:5173/api/...`.

## Child DOX Index

*Leaf boundary. Direct children are service modules; no nested DOX required.*
