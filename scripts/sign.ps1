param([string]$File)
Write-Host "SIGN SCRIPT INVOKED for $File"

$ErrorActionPreference = "Stop"

# Fail loudly if the tool isn't even on PATH
if (-not (Get-Command AzureSignTool -ErrorAction SilentlyContinue)) {
    Write-Error "AzureSignTool not found on PATH — is it installed on this runner?"
    exit 1
}

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
  "$File"

if ($LASTEXITCODE -ne 0) {
    Write-Error "AzureSignTool failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}