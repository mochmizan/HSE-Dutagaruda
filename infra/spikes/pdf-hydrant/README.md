# Spike: Hydrant monthly form via Gotenberg 8

Proves the spec/06 pattern renders before committing to it.

## Start Gotenberg (scratch port, no compose touched)

docker run -d --name gotenberg-spike-hydrant -p 3222:3000 gotenberg/gotenberg:8

## Render (repeatable, writes PDF bytes plus generation log to out/)

powershell -ExecutionPolicy Bypass -File render.ps1

## Files

template.html owns the form (standalone Chromium HTML, inline CSS, embedded WOFF2).
render.ps1 owns the render command plus the log.
out/hydrant-monthly.pdf is the proof output.
out/preview.png is a Chromium screenshot of page one.
out/generation.log is the render receipt.
assets/ holds the Inter WOFF2 files referenced by the template.

## Result

2 pages, true A4 (595x842pt), sections A plus B plus 3-col signatures.
