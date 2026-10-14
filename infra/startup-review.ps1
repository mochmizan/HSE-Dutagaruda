# Review-day startup: Docker daemon may take minutes after logon.
# Waits for it, then brings the stack up. Serve routes persist in tailscaled.
$ErrorActionPreference = "SilentlyContinue"
Set-Location "D:\dev\viaannn\infra"
# Docker Desktop does not autostart on this machine; launch it first.
docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Start-Process "C:\Users\Mizan\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
}
for ($i = 0; $i -lt 36; $i++) {
  docker info 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep 10
}
docker compose up -d | Out-Null
Start-Sleep 20
try {
  $h = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -TimeoutSec 15
  if ($h.status -ne "ok") { exit 1 }
} catch { exit 1 }
