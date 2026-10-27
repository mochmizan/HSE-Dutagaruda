# 03 — Data model (Drizzle + Postgres 17)

Converted 1:1 from the prototype Prisma spec, plus the tenant rule.
Workers: verify every table against ctx7 Drizzle docs (`pgTable`, uniques, RLS).

## Global rules

- `companyId` (text, indexed) on EVERY business table. Seed one company.
  Enforcement in API middleware now; Postgres RLS later (not day one).
- IDs: text (cuid/nanoid). Timestamps: `createdAt` default now.
- Inspection months: `period` stored as date (first-of-month) + unique per asset.
- Enums as `pgEnum`: hydrant status (`LAYAK|TIDAK_LAYAK|HILANG`), APAR status
  (`BAIK|TIDAK_BAIK|NA`), P3K status (`STANDAR|DIBAWAH_STANDAR|KADALUARSA`),
  overall (`LAYAK|LAYAK_DENGAN_CATATAN|TIDAK_LAYAK`), APAR jenis
  (`POWDER|CO2|FOAM|OTHER`), roles (inspector|staff|approver).
- Better Auth owns its tables (user/session/account + organization/member);
  generate via its CLI, do not hand-write. Map `organization.id` → `companyId`.

## Tables

- `companies`: id, name, createdAt. (Client+Site merge: `sites` carry address.)
- `sites`: id, companyId→companies, name, address.
- `zones`: id, siteId→sites, name.
- `hydrantUnits`: id, companyId, siteId→sites, zoneId→zones, kode.
- `aparUnits`: id, companyId, siteId, zoneId, kode, tahun?, jenis?, ukuran?,
  expiredDate(date).
- `p3kBoxes`: id, companyId, siteId, name.
- `hydrantInspections`: id, companyId, unitId, period(date),
  6 component statuses, overallStatus, overallOverridden(bool), notes?.
  UNIQUE(unitId, period).
- `aparInspections`: id, companyId, unitId, period, 7 component statuses,
  beratCo2Kg?, overallStatus, overallOverridden(bool), notes?.
  UNIQUE(unitId, period).
- `p3kInspections`: id, companyId, boxId, period, notes?. UNIQUE(boxId, period).
- `p3kInspectionItems`: id, inspectionId→p3kInspections (cascade), itemName,
  standardQty(int), actualQty(int), status.
- `safetyPatrolReports`: id, companyId, siteId, patrolDate(date),
  inspectorUserId.
- `safetyPatrolFindings`: id, reportId (cascade), description, s3Key,
  mime?, bytes?, sha256?, locationNote?.
- `photos`: id, companyId, s3Key, mime?, bytes?, sha256?, caption?,
  hydrantInspectionId?, aparInspectionId? (exactly one set).
- `projectMaps` (new, owner-approved Oct 27): id, companyId→companies, s3Key,
  nama, mime, bytes, sha256, urutan, dipilih(bool), createdAt. Denah/layout
  images for the whole project, NOT per site and NOT in `photos` (that table's
  CHECK allows exactly one inspection owner). One image is `dipilih` per
  company — enforced by a partial unique index `(company_id) WHERE dipilih`, so
  the shared selection can never have two winners. Object key
  `peta/<companyId>/<mapId>.<ext>`.
- `settings`: key(text pk), value. Seed `apar_expiry_alert_days = "30"`.
- `pdfJobs` (new, for async export): id, companyId, category, refId, status
  (queued|done|failed), s3Key?, createdAt.

## Status logic (port from prototype `statusCalculator.ts`, put in shared pkg)

- Hydrant: any component TIDAK_LAYAK/HILANG → TIDAK_LAYAK; all LAYAK → LAYAK.
- APAR: any critical (tekanan/tabung/selang/katupTuas) failing → TIDAK_LAYAK.
- P3K: any item below standard or expired → needsRestock + LAYAK_DENGAN_CATATAN.

## Seeds

- 1 company, 1 site, 3 zones, the 21 standard P3K items catalog (code constant,
  not a table), settings row, demo inspector user.
