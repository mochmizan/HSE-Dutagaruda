#!/usr/bin/env bun
// Retensi `pdf_jobs`: hapus baris lama beserta objek PDF-nya di Garage.
//
//   bun run src/retensi-pdf.ts            # lihat saja (dry run)
//   bun run src/retensi-pdf.ts --hapus    # benar-benar hapus
//
// Kenapa perlu: setiap ekspor menulis satu baris dan satu objek PDF, dan tidak
// ada yang pernah menghapusnya. Tabelnya sudah 1000+ baris, 43 di antaranya
// gagal/queued tanpa objek — sisa pekerjaan yang tidak pernah selesai.
//
// Aturan yang dipakai:
// - `done` lebih tua dari RETENSI_HARI (bawaan 30) dihapus beserta objeknya.
// - `failed` dan `queued` lebih tua dari RETENSI_GAGAL_JAM (bawaan 24) selalu
//   dihapus, karena keduanya status terminal: tidak ada worker yang akan
//   menyelesaikan `queued`, dan `failed` tidak dicoba ulang. Tanpa aturan ini
//   baris itu menumpuk selamanya sambil menunggu retensi 30 hari.
// - Objek dihapus dulu, baru baris. Bila penghapusan objek gagal, baris
//   dipertahankan supaya tidak ada objek yatim yang tak bisa dilacak.
//
// Dijalankan di dalam container API (atau host dengan DATABASE_URL dan kredensial
// Garage yang sama):
//
//   docker compose -f infra/docker-compose.yml exec -T api bun run src/retensi-pdf.ts --hapus
import { db } from "./db/client.js";
import { pdfJobs } from "./db/schema.js";
import { deleteObject } from "./storage.js";
import { and, eq, lt, or } from "drizzle-orm";

const HAPUS = process.argv.includes("--hapus");
const HARI = Number(process.env.RETENSI_HARI ?? 30);
const JAM_GAGAL = Number(process.env.RETENSI_GAGAL_JAM ?? 24);
const batasSelesai = new Date(Date.now() - HARI * 24 * 60 * 60 * 1000);
const batasGagal = new Date(Date.now() - JAM_GAGAL * 60 * 60 * 1000);

const kandidat = await db
  .select({ id: pdfJobs.id, status: pdfJobs.status, s3Key: pdfJobs.s3Key, createdAt: pdfJobs.createdAt })
  .from(pdfJobs)
  .where(
    or(
      and(eq(pdfJobs.status, "done"), lt(pdfJobs.createdAt, batasSelesai)),
      and(eq(pdfJobs.status, "failed"), lt(pdfJobs.createdAt, batasGagal)),
      and(eq(pdfJobs.status, "queued"), lt(pdfJobs.createdAt, batasGagal)),
    ),
  );

console.log(`\nRetensi pdf_jobs`);
console.log(`  selesai lebih tua dari ${HARI} hari  : ${batasSelesai.toISOString()}`);
console.log(`  gagal/queued lebih tua dari ${JAM_GAGAL} jam : ${batasGagal.toISOString()}`);
console.log(`Kandidat: ${kandidat.length} baris`);
for (const k of kandidat.slice(0, 10)) {
  console.log(`  ${k.id} ${k.status} ${k.createdAt.toISOString().slice(0, 10)} ${k.s3Key ?? "(tanpa objek)"}`);
}
if (kandidat.length > 10) console.log(`  ... dan ${kandidat.length - 10} lainnya`);

if (!HAPUS) {
  console.log("\nDry run. Tambahkan --hapus untuk menjalankan.\n");
  process.exit(0);
}

let objekDihapus = 0;
let barisDihapus = 0;
const gagal: string[] = [];
for (const k of kandidat) {
  if (k.s3Key) {
    try {
      await deleteObject(k.s3Key);
      objekDihapus++;
    } catch (err) {
      gagal.push(`${k.id}: ${(err as Error).message}`);
      continue; // baris dipertahankan agar objek yatim tetap terlacak
    }
  }
  await db.delete(pdfJobs).where(eq(pdfJobs.id, k.id));
  barisDihapus++;
}

console.log(`\nObjek dihapus : ${objekDihapus}`);
console.log(`Baris dihapus : ${barisDihapus}`);
if (gagal.length > 0) {
  console.log(`Gagal         : ${gagal.length}`);
  for (const g of gagal.slice(0, 10)) console.log(`  ${g}`);
  process.exit(1);
}
console.log("");
