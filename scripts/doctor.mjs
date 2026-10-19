// Repo doctor: fast pre-flight before any wave. Read-only, Indonesian output.
// Usage: bun run doctor (from repo root).
const ok = [];
const fail = [];
const cek = (nama, lulus, detail = "") => (lulus ? ok : fail).push(`${lulus ? "LULUS" : "GAGAL"} ${nama}${detail ? ` (${detail})` : ""}`);

const sh = async (cmd, args) => {
  const p = Bun.spawn([cmd, ...args], { stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
  await p.exited;
  return { code: p.exitCode, out: out.trim(), err: err.trim() };
};

cek("bun", true, Bun.version);

const docker = await sh("docker", ["info"]);
cek("docker-daemon", docker.code === 0);

const ps = await sh("docker", ["compose", "-f", "infra/docker-compose.yml", "ps", "--format", "{{.Service}} {{.Status}}"]);
for (const svc of ["api", "postgres", "caddy", "garage", "gotenberg"]) {
  cek(`compose:${svc}`, ps.out.split("\n").some((l) => l.startsWith(svc) && l.includes("Up")), ps.code !== 0 ? "compose gagal" : "");
}

const cmdOk = async (cmd, args) => (await sh(cmd, args)).code === 0;
cek(
  "port-5173",
  true,
  (await cmdOk("powershell", ["-NoProfile", "-Command", "(Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count"]))
    ? "terisi (pastikan ini dev server web, bukan proses basi)"
    : "bebas",
);
cek(
  "postgres-5433",
  await cmdOk("docker", ["compose", "-f", "infra/docker-compose.yml", "exec", "-T", "postgres", "pg_isready", "-U", "postgres"]),
);
cek("caddy-8080", true, "(lihat api-health di bawah)");

try {
  const r = await fetch("http://localhost:8080/api/health");
  cek("api-health", r.ok, String(r.status));
} catch { cek("api-health", false, "tak terjangkau"); }

const compose = await Bun.file("infra/docker-compose.yml").text();
cek("gotenberg-digest-terpin", compose.includes("gotenberg/gotenberg:8@sha256:"));

const env = await Bun.file("infra/.env").text().catch(() => "");
const kunciOk = /GARAGE_SECRET_KEY=.+/.test(env) && !env.includes("viaannn-dev-secret");
cek("env-garage-kunci", kunciOk, !env ? "infra/.env hilang" : kunciOk ? "ok" : "masih placeholder");

const git = await sh("git", ["status", "--short"]);
cek("git-bersih", git.out === "", git.out.split("\n").length + " berkas kotor");

const dist = await sh("bun", ["scripts/cek-dist.mjs"]);
cek("dist-konsisten", dist.code === 0, dist.code === 0 ? "" : (dist.err || dist.out).split("\n")[0]);

console.log([...ok, ...fail].join("\n"));
console.log(fail.length === 0 ? "DOCTOR: semua hijau." : `DOCTOR: ${fail.length} gagal.`);
process.exit(fail.length === 0 ? 0 : 1);
