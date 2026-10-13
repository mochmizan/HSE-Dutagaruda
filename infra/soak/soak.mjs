const BASE = process.env.SOAK_BASE ?? "http://localhost:8080";
const OUT = process.argv[2] ?? "infra/soak/last-run.json";
let jar = [];
async function req(path, opts = {}) {
  const t0 = Date.now();
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { "Content-Type": "application/json", Origin: BASE, ...(opts.headers || {}), Cookie: jar.join("; ") },
  });
  const set = res.headers.getSetCookie?.() ?? [];
  for (const c of set) jar.push(c.split(";")[0]);
  return { res, ms: Date.now() - t0 };
}
async function post(path, body) {
  const { res } = await req(path, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`POST ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}
async function get(path) {
  const { res } = await req(path);
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
}
const pick = (o) => o?.items?.[0] ?? o?.[0] ?? o?.data?.[0] ?? o;

await req("/api/auth/sign-in/email", { method: "POST", body: JSON.stringify({ email: "pengawas@contoh.id", password: "Pengawas123" }) });
const orgs = await get("/api/auth/organization/list");
const orgId = pick(orgs)?.id;
await req("/api/auth/organization/set-active", { method: "POST", body: JSON.stringify({ organizationId: orgId }) });
const co = pick(await get("/api/companies"));
const site = pick(await get(`/api/sites?clientId=${co.id}`));
const zone = pick(await get(`/api/zones?siteId=${site.id}`));
const M = { month: "2026-10" };
async function ensureUnit(path, body) {
  const list = await get(`${path}?siteId=${site.id}`);
  const ex = (list.items ?? list ?? []).find((u) => u.kode === body.kode || u.name === body.name);
  if (ex) return ex;
  return post(path, body);
}
const hu = await ensureUnit("/api/hydrant-units", { siteId: site.id, zoneId: zone.id, kode: "HYD-SOAK" });
const au = await ensureUnit("/api/apar-units", { siteId: site.id, zoneId: zone.id, kode: "AP-SOAK", expiredDate: "2027-10-01" });
const pb = await ensureUnit("/api/p3k-boxes", { siteId: site.id, name: "Kotak Soak" });
async function ensureInsp(path, body) {
  try { return await post(path, body); }
  catch (e) {
    if (String(e).includes("409")) {
      const q = new URLSearchParams({ month: body.month });
      if (body.unitId) q.set("unitId", body.unitId);
      if (body.boxId) q.set("boxId", body.boxId);
      return pick(await get(`${path}?${q}`));
    }
    throw e;
  }
}
const L = { boxHydrant: "LAYAK", fireHose: "LAYAK", hoseCoupling: "LAYAK", hoseRack: "LAYAK", nozzle: "LAYAK", valvePillar: "LAYAK" };
const B = { safetyPin: "BAIK", corong: "BAIK", segel: "BAIK", tekanan: "BAIK", tabung: "BAIK", selang: "BAIK", katupTuas: "BAIK" };
const hi = await ensureInsp("/api/hydrant-inspections", { unitId: hu.id, ...M, ...L });
const ai = await ensureInsp("/api/apar-inspections", { unitId: au.id, ...M, ...B });
const pi = await ensureInsp("/api/p3k-inspections", { boxId: pb.id, month: "2026-10" });
const prs = await get(`/api/safety-patrol-reports?siteId=${site.id}`);
let pr = (prs.items ?? prs ?? [])[0];
if (!pr) pr = await post("/api/safety-patrol-reports", { siteId: site.id, patrolDate: "2026-10-13" });

const jobs = [
  ["hydrant-monthly", hi.id], ["apar-monthly", ai.id], ["apar-card", ai.id],
  ["p3k-yearly", pi.id ?? pi], ["patrol-report", pr.id ?? pr],
];
const times = [];
const failures = [];
for (let i = 0; i < 50; i++) {
  const [cat, ref] = jobs[i % 5];
  const t0 = Date.now();
  try {
    const exp = await post(`/api/export/${cat}/${ref}`, {});
    const jobId = exp.id ?? exp.jobId ?? exp.job?.id;
    let job;
    for (let k = 0; k < 60; k++) {
      await new Promise((r) => setTimeout(r, 500));
      job = await get(`/api/pdf-jobs/${jobId}`);
      const st = job.status ?? job.job?.status;
      if (st === "done") break;
      if (st === "failed") throw new Error("job failed");
    }
    const url = job.downloadUrl ?? job.job?.downloadUrl;
    const dl = await fetch(url, { headers: { Cookie: jar.join("; ") } });
    const buf = Buffer.from(await dl.arrayBuffer());
    if (buf.subarray(0, 5).toString() !== "%PDF-") throw new Error("no PDF magic");
    times.push(Date.now() - t0);
  } catch (e) { failures.push(`${cat}#${i}: ${String(e).slice(0, 120)}`); }
}
times.sort((a, b) => a - b);
const q = (p) => times[Math.min(times.length - 1, Math.floor(p * times.length))];
const out = { ok: failures.length === 0, done: times.length, failed: failures.length, failures, p50: q(0.5), p95: q(0.95), max: times[times.length - 1], min: times[0] };
require("fs").writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
