// Verifikasi hasil build web: setiap aset ber-hash yang dirujuk index.html harus
// ada di dist/assets. Menangkap dist basi atau build web yang tidak pernah jalan.
// Usage: bun scripts/cek-dist.mjs
import { existsSync } from "node:fs";
import { join } from "node:path";

const akar = join(import.meta.dir, "..");
const dist = join(akar, "apps", "web", "dist");
const indexPath = join(dist, "index.html");

if (!existsSync(indexPath)) {
  console.error(`GAGAL dist-konsisten (index.html tidak ada di ${dist}; jalankan build web)`);
  process.exit(1);
}

const html = await Bun.file(indexPath).text();
const rujukan = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);

if (rujukan.length === 0) {
  console.error("GAGAL dist-konsisten (index.html tidak merujuk satu pun /assets/*)");
  process.exit(1);
}

const hilang = [];
for (const jalur of rujukan) {
  const berkas = join(dist, jalur.replace(/^\/assets\//, "assets/"));
  if (!existsSync(berkas)) hilang.push(jalur);
}

if (hilang.length > 0) {
  console.error(`GAGAL dist-konsisten (${hilang.length} aset dirujuk tapi tidak ada)`);
  for (const jalur of hilang) console.error(`  hilang ${jalur}`);
  process.exit(1);
}

console.log(`LULUS dist-konsisten (${rujukan.length} aset)`);
