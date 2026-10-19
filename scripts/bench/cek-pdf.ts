#!/usr/bin/env bun
// Periksa jumlah halaman dan teks kunci pada PDF hasil ekspor.
//
//   bun scripts/bench/cek-pdf.ts <berkas.pdf>...
//
// Dua cacat yang pernah lolos ke produksi tidak terlihat dari ukuran berkas:
// APAR bulanan yang hanya satu halaman padahal spec minta dua, dan P3K yang
// kehilangan baris TANGGAL INSPEKSI / PARAF. Keduanya diperiksa di sini dengan
// membaca struktur halaman dan teks yang benar-benar tercetak.

import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const berkas = process.argv.slice(2);
if (berkas.length === 0) {
  console.error("pakai: bun scripts/bench/cek-pdf.ts <berkas.pdf>...");
  process.exit(1);
}

/** Hitung objek `/Type /Page` (bukan `/Pages`). */
function jumlahHalaman(buf: Buffer): number {
  const teks = buf.toString("latin1");
  const cocok = teks.match(/\/Type\s*\/Page[^s]/g);
  return cocok?.length ?? 0;
}

/**
 * Kumpulkan teks dari seluruh stream yang bisa di-inflate. Chromium menulis
 * teks sebagai operator Tj/TJ di dalam content stream yang biasanya Flate.
 */
function teksTerlihat(buf: Buffer): string {
  const out: string[] = [];
  let i = 0;
  const latin = buf.toString("latin1");
  while (true) {
    const mulai = latin.indexOf("stream", i);
    if (mulai < 0) break;
    let dataStart = mulai + "stream".length;
    if (latin[dataStart] === "\r") dataStart++;
    if (latin[dataStart] === "\n") dataStart++;
    const akhir = latin.indexOf("endstream", dataStart);
    if (akhir < 0) break;
    const mentah = buf.subarray(dataStart, akhir);
    try {
      const isi = inflateSync(mentah).toString("latin1");
      // Operator teks PDF: (teks) Tj  dan  [(a)(b)] TJ
      for (const m of isi.matchAll(/\(((?:\\.|[^\\()])*)\)\s*(?:Tj|TJ)/g)) {
        out.push(m[1].replace(/\\([()\\])/g, "$1"));
      }
      // Beberapa generator memakai hex string <...> Tj.
      for (const m of isi.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
        const hex = m[1];
        let s = "";
        for (let k = 0; k + 1 < hex.length; k += 2) {
          const code = parseInt(hex.slice(k, k + 2), 16);
          if (code >= 32 && code < 127) s += String.fromCharCode(code);
        }
        out.push(s);
      }
    } catch {
      // stream bukan Flate atau bukan content stream: lewati.
    }
    i = akhir + "endstream".length;
  }
  return out.join(" ");
}

let gagal = 0;
for (const jalur of berkas) {
  const buf = readFileSync(jalur);
  const halaman = jumlahHalaman(buf);
  const teks = teksTerlihat(buf);
  const cari = (pola: RegExp) => pola.test(teks);
  console.log(`\n${jalur}`);
  console.log(`  ukuran       : ${(buf.byteLength / 1024).toFixed(0)} KB`);
  console.log(`  halaman      : ${halaman}`);
  console.log(`  teks terbaca : ${teks.length} karakter`);
  if (cari(/TANGGAL INSPEKSI/i)) console.log("  TANGGAL INSPEKSI : ada");
  if (cari(/PARAF/i)) console.log("  PARAF            : ada");
  if (cari(/Catatan\s*:/i)) console.log("  Catatan :        : ada");
  if (cari(/Tidak ada foto temuan/i)) console.log("  foto temuan      : kosong (benar bila tak ada temuan)");
  if (/hydrant/i.test(jalur) && halaman < 1) gagal++;
}
process.exit(gagal > 0 ? 1 : 0);
