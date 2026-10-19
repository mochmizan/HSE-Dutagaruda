ALTER TABLE "apar_inspections" ADD COLUMN "approval_status" "approval_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "temuan" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Rekam APAR yang sudah ada dibuat sebelum kolom ini ada; UI lama menampilkan
-- setiap rekam tersimpan sebagai SELESAI, jadi DIAJUKAN menjaga tampilan yang
-- sudah dilihat pengguna. Rekam baru: `Simpan Draft` menulis DRAFT, `Terbitkan`
-- menulis DIAJUKAN.
UPDATE "apar_inspections" SET "approval_status" = 'DIAJUKAN';--> statement-breakpoint
-- Foto yang sudah ada tak bisa dipilah otomatis (caption bebas); semuanya
-- dianggap bukti inspeksi (`false`) supaya tidak muncul sebagai temuan baru.
UPDATE "photos" SET "temuan" = false;
