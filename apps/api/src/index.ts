import { serve } from "@hono/node-server";
import { hc } from "hono/client";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth/config.js";
import { aparInspectionsApp, hydrantInspectionsApp, p3kInspectionsApp } from "./routes/inspections.js";
import { clientsApp, companiesApp, sitesApp, zonesApp } from "./routes/org.js";
import { patrolApp } from "./routes/patrol.js";
import { aparUnitsApp, hydrantUnitsApp, p3kBoxesApp } from "./routes/units.js";
import { dashboardApp, feedApp, settingsApp } from "./routes/feed.js";
import { usersApp } from "./routes/users.js";
import { photosApp, uploadsApp } from "./routes/uploads.js";
import { exportsApp, pdfJobsApp } from "./routes/exports.js";
import { approvalsApp } from "./routes/approvals.js";

export const app = new Hono();

app.onError((err, c) => {
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
});

app.get("/api/health", (c) => c.json({ status: "ok", service: "viaannn-api" }));

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/clients", clientsApp);
app.route("/api/companies", companiesApp);
app.route("/api/sites", sitesApp);
app.route("/api/zones", zonesApp);
app.route("/api/hydrant-units", hydrantUnitsApp);
app.route("/api/apar-units", aparUnitsApp);
app.route("/api/p3k-boxes", p3kBoxesApp);
app.route("/api/hydrant-inspections", hydrantInspectionsApp);
app.route("/api/apar-inspections", aparInspectionsApp);
app.route("/api/p3k-inspections", p3kInspectionsApp);
app.route("/api/safety-patrol-reports", patrolApp);
app.route("/api/inspections", feedApp);
app.route("/api/dashboard", dashboardApp);
app.route("/api/settings", settingsApp);
app.route("/api/users", usersApp);
app.route("/api/uploads", uploadsApp);
app.route("/api/photos", photosApp);
app.route("/api/export", exportsApp);
app.route("/api/pdf-jobs", pdfJobsApp);
app.route("/api/approvals", approvalsApp);

export type AppType = typeof app;

export function createClient(baseUrl: string, init?: RequestInit) {
  return hc<AppType>(baseUrl, { fetch: (input: RequestInfo | URL, reqInit?: RequestInit) => fetch(input, { ...init, ...reqInit }) });
}

const port = Number(process.env.PORT ?? "3001");

if (import.meta.url === `file://${process.argv[1]}`) {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`API mendengar di http://localhost:${info.port}.`);
  });
}
