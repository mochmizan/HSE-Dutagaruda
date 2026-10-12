# Renders template.html via local Gotenberg 8 and writes PDF bytes plus a generation log.
# Repeatable: run this script from infra/spikes/apar-card.
param(
  [string]$Gotenberg = "http://localhost:3222",
  [string]$OutDir = "out"
)
$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$log = Join-Path $OutDir "generation.log"
$pdf = Join-Path $OutDir "apar-card.pdf"
if (Test-Path $pdf) { Remove-Item $pdf }
"[$stamp] POST $Gotenberg/forms/chromium/convert/html" | Out-File -FilePath $log -Encoding utf8
& curl.exe --fail --request POST "$Gotenberg/forms/chromium/convert/html" `
  --form "files=@template.html;filename=index.html;type=text/html" `
  --form "files=@assets/inter-400.woff2" `
  --form "files=@assets/inter-700.woff2" `
  --form "paperWidth=8.27in" `
  --form "paperHeight=11.69in" `
  --form "marginTop=12mm" `
  --form "marginBottom=12mm" `
  --form "marginLeft=12mm" `
  --form "marginRight=12mm" `
  --form "landscape=false" `
  --form "printBackground=true" `
  --form "preferCssPageSize=true" `
  --form "waitForSelector=#pdf-ready" `
  --form "failOnResourceLoadingFailed=true" `
  --output $pdf `
  --write-out "http=%{http_code} time=%{time_total}s size=%{size_download}B\n" `
  --silent --show-error 2>&1 | Tee-Object -FilePath $log -Append
$pdfInfo = Get-Item $pdf
"pdf=$pdf bytes=$($pdfInfo.Length)" | Tee-Object -FilePath $log -Append
