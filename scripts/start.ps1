# JointSense — Windows Quick Start (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File scripts\start.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   JointSense — Aerospace Joint CAE   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Backend ──────────────────────────────
Write-Host "[1/4] Setting up Python backend..." -ForegroundColor Green
Set-Location backend

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  ⚠  Created backend\.env — add your ANTHROPIC_API_KEY!" -ForegroundColor Yellow
}

python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -q -r requirements.txt
Write-Host "  ✓  Backend dependencies installed" -ForegroundColor Green

$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    .\.venv\Scripts\Activate.ps1
    uvicorn app.main:app --reload --port 8000
}
Write-Host "  ✓  Backend starting at http://localhost:8000" -ForegroundColor Green
Write-Host "     API docs: http://localhost:8000/api/docs" -ForegroundColor Gray

Set-Location ..

# ── Frontend ─────────────────────────────
Write-Host ""
Write-Host "[2/4] Setting up React frontend..." -ForegroundColor Green
Set-Location frontend

npm install --silent
Write-Host "  ✓  Frontend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] Starting dev server..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

Set-Location ..

Start-Sleep -Seconds 3
Write-Host ""
Write-Host "[4/4] JointSense is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "  App:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Docs:  http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

try {
    Wait-Job $backendJob, $frontendJob
} finally {
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    Write-Host "Stopped all services."
}
