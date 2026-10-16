#!/usr/bin/env bun
// verify-doctor: one read-only check answering "is this instance worth driving?"
// Usage (repo root): bun wiki/helpers/verify-doctor.mjs
// Exit 0 = drive it. Exit 1 = fix the GAGAL line first.
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ok = [];
const fail = [];
const cek = (nama, lulus, detail = "") =>
  (lulus ? ok : fail).push(`${lulus ? "LULUS" : "GAGAL"} ${nama}${detail ? ` (${detail})` : ""}`);

const run = async (cmd, args) => {
  const p = Bun.spawn([cmd, ...args], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
  const out = await new Response(p.stdout).text();
  await p.exited;
  return { code: p.exitCode, out: out.trim() };
};

const docker = await run("docker", ["info"]);
cek("docker-daemon", docker.code === 0);

const ps = await run("docker", ["compose", "-f", "infra/docker-compose.yml", "ps", "--format", "{{.Service}} {{.Status}}"]);
for (const svc of ["api", "postgres", "caddy", "garage", "gotenberg"]) {
  cek(
    `compose:${svc}`,
    ps.out.split("\n").some((l) => l.startsWith(svc) && l.includes("Up")),
    ps.code !== 0 ? "compose gagal" : "",
  );
}

try {
  const r = await fetch("http://localhost:8080/api/health");
  const j = await r.json().catch(() => null);
  cek("api-health", r.ok && j?.status === "ok", String(r.status));
} catch {
  cek("api-health", false, "tak terjangkau");
}

try {
  const r = await fetch("http://localhost:8080/");
  const t = await r.text();
  cek("web-shell", r.ok && t.includes('id="root"'), String(r.status));
} catch {
  cek("web-shell", false, "tak terjangkau");
}

const sibuk5173 = await run("powershell", [
  "-NoProfile",
  "-Command",
  "(Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count",
]);
cek("port-5173", true, Number(sibuk5173.out) > 0 ? "terisi (dev server, bukan jalur verifikasi)" : "bebas");

console.log([...ok, ...fail].join("\n"));
console.log(fail.length === 0 ? "VERIFY-DOCTOR: semua hijau." : `VERIFY-DOCTOR: ${fail.length} gagal.`);
process.exit(fail.length === 0 ? 0 : 1);
