@echo off
AzureSignTool sign ^
  -kvu %SIGNING_KVU% ^
  -kvi %SIGNING_KVI% ^
  -kvs %SIGNING_KVS% ^
  -kvt %SIGNING_KVT% ^
  -kvc %SIGNING_KVC% ^
  -tr http://timestamp.digicert.com ^
  -td sha256 -fd sha256 -v ^
  "%~1"
if errorlevel 1 exit /b %errorlevel%