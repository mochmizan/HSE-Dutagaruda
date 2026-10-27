import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const hydrantStatusEnum = pgEnum("hydrant_status", [
  "LAYAK",
  "TIDAK_LAYAK",
  "HILANG",
]);

export const aparStatusEnum = pgEnum("apar_status", ["BAIK", "TIDAK_BAIK", "NA"]);

export const p3kStatusEnum = pgEnum("p3k_status", [
  "STANDAR",
  "DIBAWAH_STANDAR",
  "KADALUARSA",
]);

export const overallStatusEnum = pgEnum("overall_status", [
  "LAYAK",
  "LAYAK_DENGAN_CATATAN",
  "TIDAK_LAYAK",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "DRAFT",
  "DIAJUKAN",
  "DIKETAHUI",
  "DISETUJUI",
]);

export const aparJenisEnum = pgEnum("apar_jenis", ["POWDER", "CO2", "FOAM", "OTHER"]);

export const pdfJobStatusEnum = pgEnum("pdf_job_status", ["queued", "done", "failed"]);

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sites = pgTable(
  "sites",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    name: text("name").notNull(),
    address: text("address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("sites_company_id_idx").on(t.companyId)],
);

export const zones = pgTable(
  "zones",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("zones_company_id_idx").on(t.companyId)],
);

export const hydrantUnits = pgTable(
  "hydrant_units",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    zoneId: text("zone_id")
      .notNull()
      .references(() => zones.id),
    kode: text("kode").notNull(),
    /** Urutan tampil yang diatur pengguna; 0..n-1 per lokasi. */
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("hydrant_units_company_id_idx").on(t.companyId),
    index("hydrant_units_site_id_idx").on(t.siteId),
  ],
);

export const aparUnits = pgTable(
  "apar_units",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    zoneId: text("zone_id")
      .notNull()
      .references(() => zones.id),
    kode: text("kode").notNull(),
    tahun: integer("tahun"),
    jenis: aparJenisEnum("jenis"),
    ukuran: text("ukuran"),
    expiredDate: date("expired_date").notNull(),
    /** Urutan tampil yang diatur pengguna; 0..n-1 per lokasi. */
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("apar_units_company_id_idx").on(t.companyId),
    index("apar_units_site_id_idx").on(t.siteId),
    index("apar_units_company_expired_idx").on(t.companyId, t.expiredDate),
  ],
);

export const p3kBoxes = pgTable(
  "p3k_boxes",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("p3k_boxes_company_id_idx").on(t.companyId),
    index("p3k_boxes_site_id_idx").on(t.siteId),
  ],
);

export const hydrantInspections = pgTable(
  "hydrant_inspections",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    unitId: text("unit_id")
      .notNull()
      .references(() => hydrantUnits.id),
    period: date("period").notNull(),
    boxHydrant: hydrantStatusEnum("box_hydrant").notNull(),
    fireHose: hydrantStatusEnum("fire_hose").notNull(),
    hoseCoupling: hydrantStatusEnum("hose_coupling").notNull(),
    hoseRack: hydrantStatusEnum("hose_rack").notNull(),
    nozzle: hydrantStatusEnum("nozzle").notNull(),
    valvePillar: hydrantStatusEnum("valve_pillar").notNull(),
    overallStatus: overallStatusEnum("overall_status").notNull(),
    overallOverridden: boolean("overall_overridden").default(false).notNull(),
    approvalStatus: approvalStatusEnum("approval_status").default("DRAFT").notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("hydrant_inspections_company_id_idx").on(t.companyId),
    index("hydrant_inspections_company_period_idx").on(t.companyId, t.period),
    unique("hydrant_inspections_unit_period_unique").on(t.unitId, t.period),
  ],
);

export const aparInspections = pgTable(
  "apar_inspections",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    unitId: text("unit_id")
      .notNull()
      .references(() => aparUnits.id),
    period: date("period").notNull(),
    safetyPin: aparStatusEnum("safety_pin").notNull(),
    corong: aparStatusEnum("corong").notNull(),
    segel: aparStatusEnum("segel").notNull(),
    tekanan: aparStatusEnum("tekanan").notNull(),
    tabung: aparStatusEnum("tabung").notNull(),
    selang: aparStatusEnum("selang").notNull(),
    katupTuas: aparStatusEnum("katup_tuas").notNull(),
    beratCo2Kg: real("berat_co2_kg"),
    overallStatus: overallStatusEnum("overall_status").notNull(),
    overallOverridden: boolean("overall_overridden").default(false).notNull(),
    approvalStatus: approvalStatusEnum("approval_status").default("DRAFT").notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("apar_inspections_company_id_idx").on(t.companyId),
    index("apar_inspections_company_period_idx").on(t.companyId, t.period),
    unique("apar_inspections_unit_period_unique").on(t.unitId, t.period),
  ],
);

export const p3kInspections = pgTable(
  "p3k_inspections",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    boxId: text("box_id")
      .notNull()
      .references(() => p3kBoxes.id),
    period: date("period").notNull(),
    notes: text("notes"),
    inspectionDate: date("inspection_date"),
    paraf: text("paraf"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("p3k_inspections_company_id_idx").on(t.companyId),
    unique("p3k_inspections_box_period_unique").on(t.boxId, t.period),
  ],
);

export const p3kInspectionItems = pgTable(
  "p3k_inspection_items",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    inspectionId: text("inspection_id")
      .notNull()
      .references(() => p3kInspections.id, { onDelete: "cascade" }),
    itemName: text("item_name").notNull(),
    standardQty: integer("standard_qty").notNull(),
    actualQty: integer("actual_qty").notNull(),
    status: p3kStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("p3k_inspection_items_company_id_idx").on(t.companyId),
    index("p3k_inspection_items_inspection_id_idx").on(t.inspectionId),
  ],
);

export const safetyPatrolReports = pgTable(
  "safety_patrol_reports",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    patrolDate: date("patrol_date").notNull(),
    inspectorUserId: text("inspector_user_id").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("safety_patrol_reports_company_id_idx").on(t.companyId),
    index("safety_patrol_reports_site_id_idx").on(t.siteId),
  ],
);

export const safetyPatrolFindings = pgTable(
  "safety_patrol_findings",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    reportId: text("report_id")
      .notNull()
      .references(() => safetyPatrolReports.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    s3Key: text("s3_key").notNull(),
    mime: text("mime"),
    bytes: integer("bytes"),
    sha256: text("sha256"),
    locationNote: text("location_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("safety_patrol_findings_company_id_idx").on(t.companyId),
    index("safety_patrol_findings_report_id_idx").on(t.reportId),
  ],
);

export const photos = pgTable(
  "photos",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    s3Key: text("s3_key").notNull(),
    mime: text("mime"),
    bytes: integer("bytes"),
    sha256: text("sha256"),
    caption: text("caption"),
    /**
     * Pemisah dua jenis dokumentasi pada satu rekam inspeksi:
     * `false` = bukti fisik yang diunggah dari formulir inspeksi (Bukti
     * Inspeksi / slot APAR), `true` = catatan hasil temuan (Section B) yang
     * diunggah lewat "Tambah Temuan". Tanpa kolom ini, semua foto satu rekam
     * tampil di kedua tempat.
     */
    temuan: boolean("temuan").default(false).notNull(),
    hydrantInspectionId: text("hydrant_inspection_id").references(
      () => hydrantInspections.id,
    ),
    aparInspectionId: text("apar_inspection_id").references(() => aparInspections.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("photos_company_id_idx").on(t.companyId),
    index("photos_hydrant_inspection_id_idx").on(t.hydrantInspectionId),
    index("photos_apar_inspection_id_idx").on(t.aparInspectionId),
    check(
      "photos_single_owner_check",
      sql`num_nonnulls("hydrant_inspection_id", "apar_inspection_id") = 1`,
    ),
  ],
);

/**
 * Peta proyek: gambar denah yang diunggah per proyek (organisasi), dipakai
 * bersama oleh semua pengguna proyek tersebut. Tepat satu baris per proyek
 * berstatus `dipilih` — peta itulah yang ditampilkan — dan partial unique index
 * di bawah menegakkan itu di level basis data, bukan hanya di kode.
 *
 * Sengaja dipisah dari `photos`: tabel itu punya CHECK `num_nonnulls(...) = 1`
 * yang mewajibkan tepat satu inspeksi pemilik, sedangkan peta proyek tidak
 * dimiliki inspeksi mana pun.
 */
export const projectMaps = pgTable(
  "project_maps",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    s3Key: text("s3_key").notNull(),
    nama: text("nama").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    sha256: text("sha256").notNull(),
    urutan: integer("urutan").notNull().default(0),
    dipilih: boolean("dipilih").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("project_maps_company_id_idx").on(t.companyId),
    uniqueIndex("project_maps_satu_dipilih").on(t.companyId).where(sql`${t.dipilih}`),
  ],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * Proyek aktif terakhir per pengguna. Sesi Better Auth menyimpan
 * `active_organization_id`, tetapi baris sesi dibuat ulang (dan dihapus saat
 * keluar) sehingga pilihan proyek hilang tiap masuk lagi — dulu klien menebak
 * organisasi pertama. Tabel ini menjadikan pilihan itu fakta server.
 */
export const projectPreferences = pgTable("project_preferences", {
  userId: text("user_id").primaryKey(),
  projectId: text("project_id").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pdfJobs = pgTable(
  "pdf_jobs",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    category: text("category").notNull(),
    refId: text("ref_id").notNull(),
    status: pdfJobStatusEnum("status").notNull().default("queued"),
    s3Key: text("s3_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("pdf_jobs_company_id_idx").on(t.companyId)],
);
