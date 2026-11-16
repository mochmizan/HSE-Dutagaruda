import { serve } from "@hono/node-server";
import { hc } from "hono/client";
import { Hono, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth/config.js";
import { aparInspectionsApp, hydrantInspectionsApp, p3kInspectionsApp } from "./routes/inspections.js";
import { clientsApp, companiesApp, proyekAktifApp, projectsApp, sitesApp, zonesApp } from "./routes/org.js";
import { patrolApp } from "./routes/patrol.js";
import { aparUnitsApp, hydrantUnitsApp, p3kBoxesApp } from "./routes/units.js";
import { dashboardApp, feedApp, settingsApp } from "./routes/feed.js";
import { usersApp } from "./routes/users.js";
import { photosApp, uploadsApp } from "./routes/uploads.js";
import { petaApp } from "./routes/peta.js";
import { exportsApp, pdfJobsApp } from "./routes/exports.js";

/**
 * CORS lintas-situs (frontend Vercel → API VPS). Aktif hanya bila
 * CORS_ORIGIN diisi (daftar koma, mis. https://hse-dutagaruda.vercel.app);
 * lokal sampe-origin tidak berubah perilaku. credentials: true agar cookie
 * sesi Better Auth terkirim; origin eksplisit (wildcard + cookie = ditolak
 * peramban).
 */
const ASAL_CORS = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function corsLintasSitus(): MiddlewareHandler {
  return async (c, next) => {
    if (ASAL_CORS.length === 0) return next();
    return cors({
      origin: ASAL_CORS,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "Origin", "X-Requested-With"],
      credentials: true,
    })(c, next);
  };
}

export const app = new Hono()
  .use("/api/*", corsLintasSitus())
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json(
        { title: "Permintaan gagal.", detail: err.message, status: err.status },
        err.status,
      );
    }
    console.error(err);
    return c.json(
      { title: "Kesalahan server.", detail: "Terjadi kesalahan tak terduga.", status: 500 },
      500,
    );
  })
  .get("/api/health", (c) => c.json({ status: "ok", service: "viaannn-api" }))
  .on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .route("/api/clients", clientsApp)
  .route("/api/companies", companiesApp)
  // Rute paling spesifik lebih dulu: /api/projects/aktif bukan /:id.
  .route("/api/projects/aktif", proyekAktifApp)
  .route("/api/projects", projectsApp)
  .route("/api/sites", sitesApp)
  .route("/api/zones", zonesApp)
  .route("/api/hydrant-units", hydrantUnitsApp)
  .route("/api/apar-units", aparUnitsApp)
  .route("/api/p3k-boxes", p3kBoxesApp)
  .route("/api/hydrant-inspections", hydrantInspectionsApp)
  .route("/api/apar-inspections", aparInspectionsApp)
  .route("/api/p3k-inspections", p3kInspectionsApp)
  .route("/api/safety-patrol-reports", patrolApp)
  .route("/api/inspections", feedApp)
  .route("/api/dashboard", dashboardApp)
  .route("/api/settings", settingsApp)
  .route("/api/users", usersApp)
  .route("/api/uploads", uploadsApp)
  .route("/api/photos", photosApp)
  .route("/api/project-maps", petaApp)
  .route("/api/export", exportsApp)
  .route("/api/pdf-jobs", pdfJobsApp);

export type AppType = typeof app;

export function createClient(baseUrl: string, init?: RequestInit) {
  return hc<AppType>(baseUrl, { fetch: (input: RequestInfo | URL, reqInit?: RequestInit) => fetch(input, { ...init, ...reqInit }) });
}

const port = Number(process.env.PORT ?? "3001");

const WAJIB_ENV = ["DATABASE_URL", "GARAGE_S3_ENDPOINT", "GARAGE_BUCKET"] as const;
const GARAGE_KUNCI =
  process.env.GARAGE_ACCESS_KEY_ID ?? process.env.GARAGE_ACCESS_KEY ?? "";
const GARAGE_RAHASIA = process.env.GARAGE_SECRET_KEY ?? "";
const kurang = WAJIB_ENV.filter((k) => !process.env[k]);
if (kurang.length > 0 || !GARAGE_KUNCI || !GARAGE_RAHASIA) {
  throw new Error(
    `Konfigurasi kurang: ${[...kurang, ...(!GARAGE_KUNCI || !GARAGE_RAHASIA ? ["GARAGE_SECRET_KEY"] : [])].join(", ")}. Periksa infra/.env.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`API mendengar di http://localhost:${info.port}.`);
  });
}
