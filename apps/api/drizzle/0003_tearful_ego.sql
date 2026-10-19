CREATE TYPE "public"."approval_status" AS ENUM('DRAFT', 'DIAJUKAN', 'DIKETAHUI', 'DISETUJUI');--> statement-breakpoint
ALTER TABLE "hydrant_inspections" ADD COLUMN "approval_status" "approval_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
-- Terbitan lama (sebelum kolom ini ada) dikenali dari ringkasan bawaan tombol
-- Terbitkan; baris jangkar unggah foto tak pernah memakai teks itu.
UPDATE "hydrant_inspections" SET "approval_status" = 'DIAJUKAN' WHERE "notes" = 'Pemeriksaan 6 komponen selesai dan diverifikasi.';