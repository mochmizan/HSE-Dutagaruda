# 50-PDF export soak (host-side, proven Oct 13)

Runs from the HOST against Caddy (`SOAK_BASE`, default `http://localhost:8080`).
Works because presigned storage URLs resolve via the Caddy `/storage/*` route.

```powershell
bun infra/soak/soak.mjs [out.json]
```

What it does: signs in as the demo inspector, sets the active org, ensures one
asset per category (HYD-SOAK, AP-SOAK, Kotak Soak, one patrol report), then
loops 50 exports cycling all 5 categories. Each export asserts job `done` +
`%PDF-` magic. Prints `{ ok, done, failed, p50, p95, max, min }` and writes it
to `infra/soak/last-run.json`.

Numbers (Oct 13, dev VPS): 50/50, p50 1102ms, p95 1167ms, max 1223ms, min
1017ms. The ~1s floor is Chromium render time per export (variance is tiny, so
API overhead is negligible). Gotenberg held ~307 MiB, 0 restarts. Soak residue:
`HYD-SOAK`, `AP-SOAK`, `Kotak Soak`, one patrol report, 50 pdfJobs rows — reset
before demos.
