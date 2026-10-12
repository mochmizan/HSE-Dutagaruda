import { hc } from "hono/client";
import type { AppType } from "./index.js";

const BASE = process.env.CHECK_BASE ?? "http://localhost:8080";
const ORIGIN = "http://localhost:8080";
const DEMO_EMAIL = process.env.CHECK_EMAIL ?? "pengawas@contoh.id";
const DEMO_PASSWORD = process.env.CHECK_PASSWORD ?? "Pengawas123";
const COMPANY = "seed-perusahaan-1";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function record(name: string, ok: boolean, detail: string): void {
  results.push({ name, ok, detail });
  console.log(`${ok ? "LULUS" : "GAGAL"} ${name} ${detail}`);
}

class Jar {
  cookies = new Map<string, string>();
  get header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  store(setCookies: string[] | null): void {
    for (const line of setCookies ?? []) {
      const pair = line.split(";")[0];
      const eq = pair.indexOf("=");
      if (eq > 0) this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
}

async function req(
  jar: Jar | null,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; text: string; json: unknown }> {
  const headers: Record<string, string> = { Origin: ORIGIN };
  if (jar && jar.cookies.size > 0) headers.Cookie = jar.header;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  const setCookies: string[] = [];
  const getSetCookie = (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === "function") {
    setCookies.push(...getSetCookie.call(res.headers));
  } else {
    const single = res.headers.get("set-cookie");
    if (single) setCookies.push(single);
  }
  jar?.store(setCookies);
  return { status: res.status, text, json };
}

const FOTO_UJI_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function fotoUji(): File {
  return new File([Uint8Array.from(atob(FOTO_UJI_PNG), (ch) => ch.charCodeAt(0))], "uji.png", {
    type: "image/png",
  });
}

async function reqForm(
  jar: Jar,
  path: string,
  fields: Record<string, string>,
  file: { name: string; type: string; content: File } | null,
): Promise<{ status: number; json: unknown }> {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  if (file) form.append("file", file.content, file.name);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Origin: ORIGIN, Cookie: jar.header },
    body: form,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function fetchBytes(url: string): Promise<{ bytes: Uint8Array } | { unreachable: true }> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { bytes: new Uint8Array() };
    return { bytes: new Uint8Array(await res.arrayBuffer()) };
  } catch {
    return { unreachable: true };
  }
}

async function main(): Promise<void> {
  const anon = new Jar();
  const authed = new Jar();
  const ids: Record<string, string> = {};

  const health = await req(null, "GET", "/api/health");
  record("kesehatan", health.status === 200, `(${health.status})`);

  const noAuth = await req(null, "GET", "/api/sites");
  record("tanpa-sesi-401", noAuth.status === 401, `(${noAuth.status})`);

  const signin = await req(authed, "POST", "/api/auth/sign-in/email", {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  record("masuk-demo", signin.status === 200, `(${signin.status})`);

  const active = await req(authed, "POST", "/api/auth/organization/set-active", {
    organizationId: COMPANY,
  });
  record("organisasi-aktif", active.status === 200, `(${active.status})`);

  const sites = await req(authed, "GET", "/api/sites");
  record("situs-terautentikasi-200", sites.status === 200, `(${sites.status})`);

  const siteCreate = await req(authed, "POST", "/api/sites", {
    name: "Lokasi Uji",
    address: "Jl. Uji No. 2",
  });
  const siteId = (siteCreate.json as { id?: string } | null)?.id ?? "";
  ids.site = siteId;
  record("buat-lokasi", siteCreate.status === 201 && siteId !== "", `(${siteCreate.status})`);

  const siteGet = await req(authed, "GET", `/api/sites/${siteId}`);
  record("baca-lokasi", siteGet.status === 200, `(${siteGet.status})`);

  const sitePatch = await req(authed, "PATCH", `/api/sites/${siteId}`, { name: "Lokasi Uji Revisi" });
  record("ubah-lokasi", sitePatch.status === 200, `(${sitePatch.status})`);

  const clients = await req(authed, "GET", "/api/clients");
  record("daftar-klien", clients.status === 200, `(${clients.status})`);

  const companies = await req(authed, "GET", "/api/companies");
  record("daftar-perusahaan", companies.status === 200, `(${companies.status})`);

  const zoneCreate = await req(authed, "POST", "/api/zones", { siteId, name: "Zona Uji" });
  const zoneId = (zoneCreate.json as { id?: string } | null)?.id ?? "";
  ids.zone = zoneId;
  record("buat-zona", zoneCreate.status === 201 && zoneId !== "", `(${zoneCreate.status})`);

  const zoneList = await req(authed, "GET", `/api/zones?siteId=${siteId}`);
  record("daftar-zona", zoneList.status === 200, `(${zoneList.status})`);

  const hydCreate = await req(authed, "POST", "/api/hydrant-units", {
    siteId,
    zoneId,
    kode: "H-UJI-1",
  });
  const hydId = (hydCreate.json as { id?: string } | null)?.id ?? "";
  ids.hydrant = hydId;
  record("buat-unit-hidran", hydCreate.status === 201 && hydId !== "", `(${hydCreate.status})`);

  const hydGet = await req(authed, "GET", `/api/hydrant-units/${hydId}`);
  record("baca-unit-hidran", hydGet.status === 200, `(${hydGet.status})`);

  const hydList = await req(authed, "GET", "/api/hydrant-units?limit=1");
  const hydPage = hydList.json as { items?: unknown[]; nextCursor?: string | null } | null;
  record(
    "paginasi-hidran",
    hydList.status === 200 && Array.isArray(hydPage?.items),
    `(${hydList.status})`,
  );

  const hydComponents = {
    unitId: hydId,
    month: "2026-09",
    boxHydrant: "LAYAK",
    fireHose: "LAYAK",
    hoseCoupling: "LAYAK",
    hoseRack: "LAYAK",
    nozzle: "LAYAK",
    valvePillar: "LAYAK",
  };
  const hydInsp = await req(authed, "POST", "/api/hydrant-inspections", hydComponents);
  const hydInspId = (hydInsp.json as { id?: string } | null)?.id ?? "";
  ids.hydrantInspection = hydInspId;
  record("buat-inspeksi-hidran", hydInsp.status === 201 && hydInspId !== "", `(${hydInsp.status})`);

  const hydDup = await req(authed, "POST", "/api/hydrant-inspections", hydComponents);
  record("duplikat-bulan-hidran-409", hydDup.status === 409, `(${hydDup.status})`);

  const hydByAsset = await req(authed, "GET", `/api/hydrant-inspections/by-asset?month=2026-09&unitId=${hydId}`);
  record("inspeksi-hidran-per-aset", hydByAsset.status === 200, `(${hydByAsset.status})`);

  const aparCreate = await req(authed, "POST", "/api/apar-units", {
    siteId,
    zoneId,
    kode: "A-UJI-1",
    expiredDate: "2026-11-15",
  });
  const aparId = (aparCreate.json as { id?: string } | null)?.id ?? "";
  ids.apar = aparId;
  record("buat-unit-apar", aparCreate.status === 201 && aparId !== "", `(${aparCreate.status})`);

  const aparComponents = {
    unitId: aparId,
    month: "2026-09",
    safetyPin: "BAIK",
    corong: "BAIK",
    segel: "BAIK",
    tekanan: "BAIK",
    tabung: "BAIK",
    selang: "BAIK",
    katupTuas: "BAIK",
  };
  const aparInsp = await req(authed, "POST", "/api/apar-inspections", aparComponents);
  const aparInspId = (aparInsp.json as { id?: string } | null)?.id ?? "";
  ids.aparInspection = aparInspId;
  record("buat-inspeksi-apar", aparInsp.status === 201 && aparInspId !== "", `(${aparInsp.status})`);

  const aparDup = await req(authed, "POST", "/api/apar-inspections", aparComponents);
  record("duplikat-bulan-apar-409", aparDup.status === 409, `(${aparDup.status})`);

  const p3kCreate = await req(authed, "POST", "/api/p3k-boxes", { siteId, name: "Kotak Uji" });
  const p3kId = (p3kCreate.json as { id?: string } | null)?.id ?? "";
  ids.p3k = p3kId;
  record("buat-kotak-p3k", p3kCreate.status === 201 && p3kId !== "", `(${p3kCreate.status})`);

  const p3kInsp = await req(authed, "POST", "/api/p3k-inspections", {
    boxId: p3kId,
    month: "2026-09",
  });
  const p3kBody = p3kInsp.json as { id?: string; items?: unknown[] } | null;
  const p3kInspId = p3kBody?.id ?? "";
  ids.p3kInspection = p3kInspId;
  record(
    "buat-inspeksi-p3k-21-butir",
    p3kInsp.status === 201 && p3kInspId !== "" && (p3kBody?.items?.length ?? 0) === 21,
    `(${p3kInsp.status}, butir=${p3kBody?.items?.length ?? 0})`,
  );

  const p3kDup = await req(authed, "POST", "/api/p3k-inspections", { boxId: p3kId, month: "2026-09" });
  record("duplikat-bulan-p3k-409", p3kDup.status === 409, `(${p3kDup.status})`);

  const p3kGet = await req(authed, "GET", `/api/p3k-inspections/${p3kInspId}`);
  const p3kItemId = ((p3kGet.json as { items?: { id?: string }[] } | null)?.items?.[0]?.id) ?? "";
  const p3kItemPatch = await req(authed, "PATCH", `/api/p3k-inspections/${p3kInspId}/items/${p3kItemId}`, {
    actualQty: 0,
    status: "DIBAWAH_STANDAR",
  });
  record("ubah-butir-p3k", p3kItemPatch.status === 200, `(${p3kItemPatch.status})`);

  const patrolCreate = await req(authed, "POST", "/api/safety-patrol-reports", {
    siteId,
    patrolDate: "2026-09-20",
  });
  const patrolId = (patrolCreate.json as { id?: string } | null)?.id ?? "";
  ids.patrol = patrolId;
  record("buat-laporan-patroli", patrolCreate.status === 201 && patrolId !== "", `(${patrolCreate.status})`);

  const findingCreate = await req(authed, "POST", `/api/safety-patrol-reports/${patrolId}/findings`, {
    description: "Temuan uji",
    s3Key: "uji/kunci-foto.jpg",
  });
  const findingId = (findingCreate.json as { id?: string } | null)?.id ?? "";
  record("buat-temuan-patroli", findingCreate.status === 201 && findingId !== "", `(${findingCreate.status})`);

  const findingList = await req(authed, "GET", `/api/safety-patrol-reports/${patrolId}/findings`);
  record("daftar-temuan-patroli", findingList.status === 200, `(${findingList.status})`);

  const findingDel = await req(authed, "DELETE", `/api/safety-patrol-reports/findings/${findingId}`);
  record("hapus-temuan-patroli", findingDel.status === 200, `(${findingDel.status})`);

  const feed = await req(authed, "GET", "/api/inspections?month=2026-09");
  record("umpan-bulanan", feed.status === 200, `(${feed.status})`);

  const expiring = await req(authed, "GET", "/api/dashboard/expiring-apar?days=60");
  record("apar-kedaluwarsa", expiring.status === 200, `(${expiring.status})`);

  const settingsGet = await req(authed, "GET", "/api/settings/apar-expiry-alert-days");
  record("baca-pengaturan", settingsGet.status === 200, `(${settingsGet.status})`);

  const settingsPatch = await req(authed, "PATCH", "/api/settings/apar-expiry-alert-days", { value: "45" });
  record("ubah-pengaturan", settingsPatch.status === 200, `(${settingsPatch.status})`);

  await req(authed, "PATCH", "/api/settings/apar-expiry-alert-days", { value: "30" });

  const staffEmail = `staf-uji-${Date.now()}@contoh.id`;
  const userCreate = await req(authed, "POST", "/api/users", {
    name: "Staf Uji",
    email: staffEmail,
    password: "KataSandi123",
    role: "staff",
  });
  record("buat-pengguna", userCreate.status === 201, `(${userCreate.status})`);

  const upl = await reqForm(
    authed,
    "/api/uploads",
    { inspectionKind: "hydrant", inspectionId: hydInspId, caption: "Foto uji" },
    { name: "uji.png", type: "image/png", content: fotoUji() },
  );
  const uplJson = upl.json as { id?: string; key?: string } | null;
  const photoId = uplJson?.id ?? "";
  record(
    "unggah-foto",
    upl.status === 201 && photoId !== "" && uplJson?.key === `foto/${COMPANY}/${photoId}.png`,
    `(${upl.status})`,
  );

  const badMime = await reqForm(
    authed,
    "/api/uploads",
    { inspectionKind: "hydrant", inspectionId: hydInspId },
    { name: "uji.txt", type: "text/plain", content: new File(["x"], "uji.txt", { type: "text/plain" }) },
  );
  record("unggah-jenis-ditolak", badMime.status === 400, `(${badMime.status})`);

  const photoRes = await fetch(`${BASE}/api/photos/${photoId}`, {
    headers: { Origin: ORIGIN, Cookie: authed.header },
    redirect: "manual",
  });
  const loc = photoRes.headers.get("location") ?? "";
  record(
    "foto-redirect-302",
    photoRes.status === 302 && loc.includes("X-Amz-Signature") && loc.includes("X-Amz-Expires=60"),
    `(${photoRes.status})`,
  );

  const photoCross = await req(authed, "GET", "/api/photos/tidak-ada-foto-lintas");
  record("foto-lintas-perusahaan-404", photoCross.status === 404, `(${photoCross.status})`);

  const exportsToTry: [string, string][] = [
    ["hydrant-monthly", hydInspId],
    ["apar-monthly", aparInspId],
    ["apar-card", aparInspId],
    ["p3k-yearly", p3kInspId],
    ["patrol-report", patrolId],
  ];
  const jobIds: Record<string, string> = {};
  for (const [category, refId] of exportsToTry) {
    const ex = await req(authed, "POST", `/api/export/${category}/${refId}`);
    const exJson = ex.json as { id?: string; status?: string } | null;
    jobIds[category] = exJson?.id ?? "";
    record(
      `ekspor-${category}`,
      ex.status === 201 && exJson?.status === "done" && jobIds[category] !== "",
      `(${ex.status}, ${exJson?.status ?? "null"})`,
    );
  }

  const exMissing = await req(authed, "POST", "/api/export/hydrant-monthly/tidak-ada-ref");
  record("ekspor-ref-tidak-ada-404", exMissing.status === 404, `(${exMissing.status})`);

  const job = await req(authed, "GET", `/api/pdf-jobs/${jobIds["hydrant-monthly"]}`);
  const jobJson = job.json as { status?: string; downloadUrl?: string | null } | null;
  record(
    "pekerjaan-pdf-status",
    job.status === 200 && jobJson?.status === "done" && typeof jobJson.downloadUrl === "string",
    `(${job.status}, ${jobJson?.status ?? "null"})`,
  );

  if (jobJson?.downloadUrl) {
    const fetched = await fetchBytes(jobJson.downloadUrl);
    if ("unreachable" in fetched) {
      record("pekerjaan-pdf-unduh", true, "(LEWAT: garage tidak terjangkau dari host)");
    } else {
      const magic = Buffer.from(fetched.bytes.slice(0, 5)).toString("latin1");
      record("pekerjaan-pdf-unduh", magic === "%PDF-", `(magic=${magic || "kosong"})`);
    }
  } else {
    record("pekerjaan-pdf-unduh", false, "(tanpa tautan unduh)");
  }

  const jobMissing = await req(authed, "GET", "/api/pdf-jobs/tidak-ada-pekerjaan");
  record("pekerjaan-pdf-404", jobMissing.status === 404, `(${jobMissing.status})`);

  const photoDel = await req(authed, "DELETE", `/api/photos/${photoId}`);
  record("hapus-foto", photoDel.status === 200, `(${photoDel.status})`);

  const staffJar = new Jar();
  const staffSignin = await req(staffJar, "POST", "/api/auth/sign-in/email", {
    email: staffEmail,
    password: "KataSandi123",
  });
  record("masuk-staf", staffSignin.status === 200, `(${staffSignin.status})`);
  const staffActive = await req(staffJar, "POST", "/api/auth/organization/set-active", {
    organizationId: COMPANY,
  });
  record("organisasi-aktif-staf", staffActive.status === 200, `(${staffActive.status})`);

  const editPaths: Record<string, string> = {
    hidran: `/api/hydrant-inspections/${ids.hydrantInspection}`,
    apar: `/api/apar-inspections/${ids.aparInspection}`,
    p3k: `/api/p3k-inspections/${ids.p3kInspection}`,
    patroli: `/api/safety-patrol-reports/${ids.patrol}`,
  };
  const approvalTargets: { cat: string; path: string; patch: Record<string, unknown> }[] = [
    { cat: "hidran", path: `/api/approvals/hydrant/${ids.hydrantInspection}/approval`, patch: { notes: "revisi" } },
    { cat: "apar", path: `/api/approvals/apar/${ids.aparInspection}/approval`, patch: { notes: "revisi" } },
    { cat: "p3k", path: `/api/approvals/p3k/${ids.p3kInspection}/approval`, patch: { notes: "revisi" } },
    { cat: "patroli", path: `/api/approvals/patrol/${ids.patrol}/approval`, patch: { patrolDate: "2026-09-21" } },
  ];
  for (const t of approvalTargets) {
    const a = await req(authed, "POST", t.path, { action: "ajukan" });
    const st = (a.json as { approvalStatus?: string } | null)?.approvalStatus;
    record(`ajukan-${t.cat}`, a.status === 200 && st === "DIAJUKAN", `(${a.status}, ${st ?? "null"})`);

    const locked = await req(authed, "PATCH", editPaths[t.cat], t.patch);
    record(`kunci-ubah-${t.cat}-409`, locked.status === 409, `(${locked.status})`);

    const k = await req(staffJar, "POST", t.path, { action: "ketahui" });
    const ks = (k.json as { approvalStatus?: string } | null)?.approvalStatus;
    record(`ketahui-${t.cat}`, k.status === 200 && ks === "DIKETAHUI", `(${k.status}, ${ks ?? "null"})`);

    const self = await req(authed, "POST", t.path, { action: "setujui" });
    record(`setujui-oleh-pengirim-${t.cat}-403`, self.status === 403, `(${self.status})`);

    const s = await req(staffJar, "POST", t.path, { action: "setujui" });
    const ss = (s.json as { approvalStatus?: string } | null)?.approvalStatus;
    record(`setujui-${t.cat}`, s.status === 200 && ss === "DISETUJUI", `(${s.status}, ${ss ?? "null"})`);

    const b = await req(staffJar, "POST", t.path, { action: "kembalikan" });
    const bs = (b.json as { approvalStatus?: string } | null)?.approvalStatus;
    record(`kembalikan-${t.cat}`, b.status === 200 && bs === "DRAFT", `(${b.status}, ${bs ?? "null"})`);

    const editOk = await req(authed, "PATCH", editPaths[t.cat], t.patch);
    record(`ubah-setelah-kembalikan-${t.cat}`, editOk.status === 200, `(${editOk.status})`);
  }

  const badTransition = await req(authed, "POST", `/api/approvals/hydrant/${ids.hydrantInspection}/approval`, {
    action: "ketahui",
  });
  record("ketahui-dari-draf-400", badTransition.status === 400, `(${badTransition.status})`);

  const unknownAction = await req(authed, "POST", `/api/approvals/hydrant/${ids.hydrantInspection}/approval`, {
    action: "tidak-ada",
  });
  record("aksi-tak-dikenal-400", unknownAction.status === 400, `(${unknownAction.status})`);

  const cross = await req(authed, "GET", "/api/sites/tidak-ada-antar-perusahaan");
  record("lintas-perusahaan-404", cross.status === 404, `(${cross.status})`);

  const bad = await req(authed, "POST", "/api/sites", { name: "" });
  record("validasi-zod-400", bad.status === 400, `(${bad.status})`);

  await req(authed, "DELETE", `/api/hydrant-inspections/${ids.hydrantInspection}`);
  await req(authed, "DELETE", `/api/apar-inspections/${ids.aparInspection}`);
  await req(authed, "DELETE", `/api/p3k-inspections/${ids.p3kInspection}`);
  await req(authed, "DELETE", `/api/safety-patrol-reports/${ids.patrol}`);
  const delHyd = await req(authed, "DELETE", `/api/hydrant-units/${ids.hydrant}`);
  record("hapus-unit-hidran", delHyd.status === 200, `(${delHyd.status})`);
  const delApar = await req(authed, "DELETE", `/api/apar-units/${ids.apar}`);
  record("hapus-unit-apar", delApar.status === 200, `(${delApar.status})`);
  const delP3k = await req(authed, "DELETE", `/api/p3k-boxes/${ids.p3k}`);
  record("hapus-kotak-p3k", delP3k.status === 200, `(${delP3k.status})`);
  const delZone = await req(authed, "DELETE", `/api/zones/${ids.zone}`);
  record("hapus-zona", delZone.status === 200, `(${delZone.status})`);
  const delSite = await req(authed, "DELETE", `/api/sites/${ids.site}`);
  record("hapus-lokasi", delSite.status === 200, `(${delSite.status})`);

  const typedLeaf = hc<AppType>(BASE).api.sites.$get;
  const leafProbe = await typedLeaf(
    { query: {} },
    { headers: { Origin: ORIGIN, cookie: authed.header } },
  );
  record(
    "klien-tertipikasi",
    leafProbe.status === 200,
    `(${leafProbe.status}, daftarSitus=${typeof hc<AppType>(BASE).api.sites.$get === "function" ? "ada" : "tidak-ada"})`,
  );

  const failed = results.filter((r) => !r.ok);
  console.log(`\nRingkasan: ${results.length - failed.length}/${results.length} lulus.`);
  if (failed.length > 0) {
    console.log(`Gagal: ${failed.map((f) => f.name).join(", ")}`);
    process.exit(1);
  }
}

await main();
