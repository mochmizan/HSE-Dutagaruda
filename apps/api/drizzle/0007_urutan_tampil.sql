ALTER TABLE "apar_units" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "hydrant_units" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Backfill: urutan awal mengikuti tampilan lama (kode A→Z per lokasi), supaya
-- tabel tidak berubah susunan saat kolom baru ditambahkan.
UPDATE "hydrant_units" AS u SET "sort_order" = s.rn FROM (
  SELECT "id", (ROW_NUMBER() OVER (PARTITION BY "site_id" ORDER BY "kode") - 1)::int AS rn
  FROM "hydrant_units"
) AS s WHERE u."id" = s."id";--> statement-breakpoint
UPDATE "apar_units" AS u SET "sort_order" = s.rn FROM (
  SELECT "id", (ROW_NUMBER() OVER (PARTITION BY "site_id" ORDER BY "kode") - 1)::int AS rn
  FROM "apar_units"
) AS s WHERE u."id" = s."id";
