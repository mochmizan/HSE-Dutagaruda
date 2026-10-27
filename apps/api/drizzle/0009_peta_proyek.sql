CREATE TABLE "project_maps" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"s3_key" text NOT NULL,
	"nama" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"dipilih" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_maps" ADD CONSTRAINT "project_maps_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_maps_company_id_idx" ON "project_maps" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_maps_satu_dipilih" ON "project_maps" USING btree ("company_id") WHERE "project_maps"."dipilih";