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
  (`eksporPdf`, `ambilPdfJob`) contracts, plus the project switch pair
  `ambilProyekAktif` / `rekamProyekAktif` (`/projects/aktif`) that makes the
  chosen project a server fact instead of a per-session client guess.
  Project maps (uploaded denah) live here too: `ambilPetaProyek`,
  `unggahPeta` (multipart via `livePostForm`), `pilihPeta`, `ubahNamaPeta`,
  `hapusPeta`, with `livePetaUrl` in `liveClient.ts` for the presigned
  `GET /api/project-maps/:id/berkas`.
- `api/queries.ts`: barrel only. The TanStack Query hooks live in per-domain
  modules so no single file grows past ~200 lines. Every existing import from
  `@/services/api/queries` still resolves.
  - `api/queries-dasar.ts`: `Period`, `kunci` (query keys), `gagal`, PDF export
    (`jalankanEkspor`, `unduhBerkas`), and the two shared helpers
    `hapusZonaBilaKosong` / `idZonaAtauBuat`.
  - `api/queries-baca.ts`: read queries (lokasi, zona, unit, inspeksi, umpan)
    plus lokasi mutations.
  - `api/queries-hidran.ts`, `api/queries-apar.ts`, `api/queries-p3k.ts`,
    `api/queries-patroli.ts`: mutations per category.
  - `api/queries-foto.ts`: `useUnggahFoto`, `useHapusFoto`, `useFotoInspeksi`.
  - `api/queries-peta.ts`: project maps (uploaded denah) — `usePetaProyek`,
    `useUnggahPeta`, `usePilihPeta`, `useUbahNamaPeta`, `useHapusPeta`; one
    cache prefix `['peta']`, every mutation invalidates it on settle.
  - `api/pemetaan.ts`: barrel over `pemetaan-unit.ts` (unit + year card) and
    `pemetaan-umpan.ts` (patrol findings + dashboard feed). Both are pinned by
    `pemetaan-unit.test.ts` / `pemetaan-umpan.test.ts` (33 tests): DRAFT stays
    `SEDANG_BERJALAN`, period filtering is `YYYY-MM`, CO2 weight is CO2-only,
    unknown units fall back to `–`, and `draft/` photo keys render as
    placeholders. Change a mapper only with those tests updated in the same
    commit.
  Mutations invalidate on settle; `useUbahButirP3k` and
  `useHapusTemuanPatroli` are optimistic with rollback.
  `useBatalkanTerbitHidran` is the Hydrant batalkan-terbit command: PATCHes one
  field (`approvalStatus: 'DRAFT'`) so a stale cache cannot overwrite other
  columns, and writes the returned row back into `kunci.inspeksiHidran` so the
  modal re-derives its read-only state from the record itself.
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
  the matching `queries-*.ts` module (they are re-exported by `queries.ts`).
- Keep `queries.ts`, `pemetaan.ts`, and `klien.ts` barrels thin. New hooks go
  in a domain module, never back into the barrel.
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
