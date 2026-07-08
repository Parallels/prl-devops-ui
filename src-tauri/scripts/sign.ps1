param([string]$File)

AzureSignTool sign `
  -kvu $env:SIGNING_KVU `
  -kvi $env:SIGNING_KVI `
  -kvs $env:SIGNING_KVS `
  -kvt $env:SIGNING_KVT `
  -kvc $env:SIGNING_KVC `
  -tr "http://timestamp.digicert.com" `
  -td sha256 `
  -fd sha256 `
  -v `
  $File

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }