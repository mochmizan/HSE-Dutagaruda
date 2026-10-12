# Proves the Garage S3 round-trip from inside the compose network.
# Garage publishes no host ports, so the SDK runs in a scratch node image
# attached to viaannn_hse. Credentials pass via env only, never in files.
# Repeatable: run this script from infra/spikes/garage-proof.
$ErrorActionPreference = "Stop"
$Net = "viaannn_hse"
$Dir = (Get-Location).Path
$img = "node:24-alpine"
docker pull $img 2>&1 | Out-Null
$oldEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker run --rm --network $Net `
  -e GARAGE_S3_ENDPOINT="http://garage:3900" `
  -e GARAGE_S3_REGION="garage" `
  -e GARAGE_ACCESS_KEY_ID="$env:GARAGE_ACCESS_KEY_ID" `
  -e GARAGE_SECRET_KEY="$env:GARAGE_SECRET_KEY" `
  -e GARAGE_BUCKET="hse-foto" `
  -v "${Dir}:/work:ro" -w /work `
  $img sh -c "cp /work/proof.mjs /tmp/proof.mjs && cd /tmp && npm install --no-audit --no-fund @aws-sdk/client-s3 @aws-sdk/s3-request-presigner && node /tmp/proof.mjs" 2>&1 | Tee-Object -FilePath "out/proof.log"
$code = $LASTEXITCODE
$ErrorActionPreference = $oldEap
if ($code -ne 0) { throw "proof failed with exit $code" }
