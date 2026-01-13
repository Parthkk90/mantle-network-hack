# CRESCA App Startup Script
# Resolves: "Failed to download remote update" error

Write-Host "=== CRESCA Development Mode ===" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Clear Expo cache
Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
npx expo start --clear

Write-Host ""
Write-Host "=== Server Started ===" -ForegroundColor Green
Write-Host "Connected Device: CPH2569 (6f12c139)" -ForegroundColor Cyan
Write-Host "Port: 8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop: Press Ctrl+C" -ForegroundColor Yellow
