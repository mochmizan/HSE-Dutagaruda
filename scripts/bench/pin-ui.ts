#!/usr/bin/env bun
// Pin perilaku UI Fase 5. Membandingkan keadaan halaman hidup dengan
// wiki/artifacts/20261019-kinerja/baseline-ui.json.
//
//   bun scripts/bench/pin-ui.ts
//
// Butuh sesi login yang sudah aktif di tab browser. Skrip ini hanya membaca DOM.

const BASELINE = new URL("../../wiki/artifacts/20261019-kinerja/baseline-ui.json", import.meta.url).pathname;

export async function bacaHalaman(evaluate: (script: string) => Promise<unknown>, polaKategori: RegExp) {
  return evaluate(`(async () => {
    const tunggu = (ms) => new Promise((r) => window.setTimeout(r, ms));
    const teks = (el) => (el?.innerText || "").replace(/\\s+/g, " ").trim();
    const kat = [...document.querySelectorAll("button")].find((b) => ${polaKategori}.test(teks(b)));
    if (!kat) return { gagal: "kategori tidak ditemukan" };
    kat.click();
    for (let i = 0; i < 60; i++) { await tunggu(250); if (document.querySelector("table")) break; }
    await tunggu(1200);
    const tabel = [...document.querySelectorAll("table")].find((t) => /KODE/i.test(t.innerText || ""));
    const petakan = () => {
      if (!tabel) return null;
      const ths = [...tabel.querySelectorAll("thead th")];
      const tds = [...tabel.querySelectorAll("tbody td")];
      const css = (el) => { const c = getComputedStyle(el); return [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].join("/"); };
      return {
        judulKolom: ths.map(teks),
        jumlahTh: ths.length,
        jumlahTd: tds.length,
        jumlahBaris: tabel.querySelectorAll("tbody tr").length,
        borderTh: ths.length ? css(ths[0]) : null,
        borderTd: tds.length ? css(tds[0]) : null,
        baris: [...tabel.querySelectorAll("tbody tr")].map((tr) => [...tr.querySelectorAll("td")].map(teks)),
        ikonMinus: tabel.querySelectorAll("svg.lucide-minus").length,
        peluruMentah: [...tabel.querySelectorAll("tbody td span")].filter((s) => teks(s) === "•").length,
      };
    };
    return {
      judul: teks(document.querySelector("h1, h2")),
      tabel: petakan(),
      tombol: [...document.querySelectorAll("button")].map(teks).filter(Boolean),
    };
  })()`);
}

export function bandingkan(nama: string, kini: any, acuan: any) {
  const beda: string[] = [];
  if (kini?.gagal) return [`${nama}: ${kini.gagal}`];
  if (acuan.judul && kini.judul !== acuan.judul) beda.push(`${nama}.judul: "${kini.judul}" != "${acuan.judul}"`);
  if (acuan.tabel) {
    const t = kini.tabel;
    if (!t) return [...beda, `${nama}.tabel: tidak ada`];
    for (const k of ["judulKolom", "jumlahTh", "jumlahTd", "jumlahBaris", "borderTh", "borderTd", "ikonMinus", "peluruMentah", "baris"]) {
      const a = JSON.stringify(t[k]);
      const b = JSON.stringify(acuan.tabel[k]);
      if (a !== b) beda.push(`${nama}.tabel.${k}: ${a} != ${b}`);
    }
  }
  for (const tombol of acuan.tombol ?? []) {
    if (!(kini.tombol ?? []).includes(tombol)) beda.push(`${nama}.tombol hilang: "${tombol}"`);
  }
  return beda;
}

if (import.meta.main) {
  console.log(`Acuan: ${BASELINE}`);
  console.log("Skrip ini dipanggil dari harness browser, bukan dari CLI. Lihat scripts/bench/README.md.");
}
