CREATE TYPE "public"."apar_jenis" AS ENUM('POWDER', 'CO2', 'FOAM', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."apar_status" AS ENUM('BAIK', 'TIDAK_BAIK', 'NA');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('DRAFT', 'DIAJUKAN', 'DIKETAHUI', 'DISETUJUI');--> statement-breakpoint
CREATE TYPE "public"."hydrant_status" AS ENUM('LAYAK', 'TIDAK_LAYAK', 'HILANG');--> statement-breakpoint
CREATE TYPE "public"."overall_status" AS ENUM('LAYAK', 'LAYAK_DENGAN_CATATAN', 'TIDAK_LAYAK');--> statement-breakpoint
CREATE TYPE "public"."p3k_status" AS ENUM('STANDAR', 'DIBAWAH_STANDAR', 'KADALUARSA');--> statement-breakpoint
CREATE TYPE "public"."pdf_job_status" AS ENUM('queued', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('inspector', 'staff', 'approver');--> statement-breakpoint
CREATE TABLE "apar_inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"period" date NOT NULL,
	"safety_pin" "apar_status" NOT NULL,
	"corong" "apar_status" NOT NULL,
	"segel" "apar_status" NOT NULL,
	"tekanan" "apar_status" NOT NULL,
	"tabung" "apar_status" NOT NULL,
	"selang" "apar_status" NOT NULL,
	"katup_tuas" "apar_status" NOT NULL,
	"berat_co2_kg" real,
	"overall_status" "overall_status" NOT NULL,
	"overall_overridden" boolean DEFAULT false NOT NULL,
	"notes" text,
	"approval_status" "approval_status" DEFAULT 'DRAFT' NOT NULL,
	"approval_submitted_by_id" text,
	"approval_actor_id" text,
	"approval_acted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apar_inspections_unit_period_unique" UNIQUE("unit_id","period")
);
--> statement-breakpoint
CREATE TABLE "apar_units" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"site_id" text NOT NULL,
	"zone_id" text NOT NULL,
	"kode" text NOT NULL,
	"tahun" integer,
	"jenis" "apar_jenis",
	"ukuran" text,
	"expired_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hydrant_inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"period" date NOT NULL,
	"box_hydrant" "hydrant_status" NOT NULL,
	"fire_hose" "hydrant_status" NOT NULL,
	"hose_coupling" "hydrant_status" NOT NULL,
	"hose_rack" "hydrant_status" NOT NULL,
	"nozzle" "hydrant_status" NOT NULL,
	"valve_pillar" "hydrant_status" NOT NULL,
	"overall_status" "overall_status" NOT NULL,
	"overall_overridden" boolean DEFAULT false NOT NULL,
	"notes" text,
	"approval_status" "approval_status" DEFAULT 'DRAFT' NOT NULL,
	"approval_submitted_by_id" text,
	"approval_actor_id" text,
	"approval_acted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hydrant_inspections_unit_period_unique" UNIQUE("unit_id","period")
);
--> statement-breakpoint
CREATE TABLE "hydrant_units" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"site_id" text NOT NULL,
	"zone_id" text NOT NULL,
	"kode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "p3k_boxes" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"site_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "p3k_inspection_items" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"inspection_id" text NOT NULL,
	"item_name" text NOT NULL,
	"standard_qty" integer NOT NULL,
	"actual_qty" integer NOT NULL,
	"status" "p3k_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "p3k_inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"box_id" text NOT NULL,
	"period" date NOT NULL,
	"notes" text,
	"approval_status" "approval_status" DEFAULT 'DRAFT' NOT NULL,
	"approval_submitted_by_id" text,
	"approval_actor_id" text,
	"approval_acted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "p3k_inspections_box_period_unique" UNIQUE("box_id","period")
);
--> statement-breakpoint
CREATE TABLE "pdf_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"category" text NOT NULL,
	"ref_id" text NOT NULL,
	"status" "pdf_job_status" DEFAULT 'queued' NOT NULL,
	"s3_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"s3_key" text NOT NULL,
	"mime" text,
	"bytes" integer,
	"sha256" text,
	"caption" text,
	"hydrant_inspection_id" text,
	"apar_inspection_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photos_single_owner_check" CHECK (num_nonnulls("hydrant_inspection_id", "apar_inspection_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "safety_patrol_findings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"report_id" text NOT NULL,
	"description" text NOT NULL,
	"s3_key" text NOT NULL,
	"mime" text,
	"bytes" integer,
	"sha256" text,
	"location_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safety_patrol_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"site_id" text NOT NULL,
	"patrol_date" date NOT NULL,
	"inspector_user_id" text NOT NULL,
	"approval_status" "approval_status" DEFAULT 'DRAFT' NOT NULL,
	"approval_submitted_by_id" text,
	"approval_actor_id" text,
	"approval_acted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"site_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apar_inspections" ADD CONSTRAINT "apar_inspections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apar_inspections" ADD CONSTRAINT "apar_inspections_unit_id_apar_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."apar_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apar_units" ADD CONSTRAINT "apar_units_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apar_units" ADD CONSTRAINT "apar_units_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apar_units" ADD CONSTRAINT "apar_units_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hydrant_inspections" ADD CONSTRAINT "hydrant_inspections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hydrant_inspections" ADD CONSTRAINT "hydrant_inspections_unit_id_hydrant_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."hydrant_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hydrant_units" ADD CONSTRAINT "hydrant_units_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hydrant_units" ADD CONSTRAINT "hydrant_units_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hydrant_units" ADD CONSTRAINT "hydrant_units_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p3k_boxes" ADD CONSTRAINT "p3k_boxes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p3k_boxes" ADD CONSTRAINT "p3k_boxes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p3k_inspection_items" ADD CONSTRAINT "p3k_inspection_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p3k_inspection_items" ADD CONSTRAINT "p3k_inspection_items_inspection_id_p3k_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."p3k_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p3k_inspections" ADD CONSTRAINT "p3k_inspections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p3k_inspections" ADD CONSTRAINT "p3k_inspections_box_id_p3k_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."p3k_boxes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_jobs" ADD CONSTRAINT "pdf_jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_hydrant_inspection_id_hydrant_inspections_id_fk" FOREIGN KEY ("hydrant_inspection_id") REFERENCES "public"."hydrant_inspections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_apar_inspection_id_apar_inspections_id_fk" FOREIGN KEY ("apar_inspection_id") REFERENCES "public"."apar_inspections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_patrol_findings" ADD CONSTRAINT "safety_patrol_findings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_patrol_findings" ADD CONSTRAINT "safety_patrol_findings_report_id_safety_patrol_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."safety_patrol_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_patrol_reports" ADD CONSTRAINT "safety_patrol_reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_patrol_reports" ADD CONSTRAINT "safety_patrol_reports_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "apar_inspections_company_id_idx" ON "apar_inspections" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "apar_units_company_id_idx" ON "apar_units" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hydrant_inspections_company_id_idx" ON "hydrant_inspections" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hydrant_units_company_id_idx" ON "hydrant_units" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "p3k_boxes_company_id_idx" ON "p3k_boxes" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "p3k_inspection_items_company_id_idx" ON "p3k_inspection_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "p3k_inspections_company_id_idx" ON "p3k_inspections" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "pdf_jobs_company_id_idx" ON "pdf_jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "photos_company_id_idx" ON "photos" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "safety_patrol_findings_company_id_idx" ON "safety_patrol_findings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "safety_patrol_reports_company_id_idx" ON "safety_patrol_reports" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "sites_company_id_idx" ON "sites" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "zones_company_id_idx" ON "zones" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");