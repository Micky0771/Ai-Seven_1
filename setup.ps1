# setup.ps1 — Instalación AiSeven (sin compilación nativa)
Write-Host "Instalando AiSeven..." -ForegroundColor Cyan
Write-Host "Node: $(node --version) | npm: $(npm --version)" -ForegroundColor Gray

if (Test-Path "node_modules") { Remove-Item -Recurse -Force node_modules }
if (Test-Path "package-lock.json") { Remove-Item -Force package-lock.json }

npm install --legacy-peer-deps

if ($LASTEXITCODE -ne 0) { Write-Host "Error al instalar" -ForegroundColor Red; exit 1 }

Write-Host "Listo! Ejecuta: npm run start" -ForegroundColor Green
