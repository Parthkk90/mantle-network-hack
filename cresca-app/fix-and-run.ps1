# Complete Fix for Update Error - Run this script
Write-Host "=== CRESCA - Fix Update Error ===" -ForegroundColor Green
Write-Host ""

# 1. Set up port forwarding
Write-Host "1. Setting up USB port forwarding..." -ForegroundColor Yellow
adb -s 6f12c139 reverse tcp:8081 tcp:8081
adb -s 6f12c139 reverse tcp:8082 tcp:8082
Write-Host "   ✓ Ports forwarded" -ForegroundColor Green
Write-Host ""

# 2. Clear all caches
Write-Host "2. Clearing caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .expo, node_modules/.cache -ErrorAction SilentlyContinue
Write-Host "   ✓ Caches cleared" -ForegroundColor Green
Write-Host ""

# 3. Start Expo in localhost mode
Write-Host "3. Starting Expo server (localhost mode)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=== IMPORTANT ===" -ForegroundColor Cyan
Write-Host "On your CPH2569 device:" -ForegroundColor White
Write-Host "  1. Open Expo Go app" -ForegroundColor White
Write-Host "  2. Enter URL: exp://127.0.0.1:8081" -ForegroundColor Yellow
Write-Host "  OR scan the QR code" -ForegroundColor White
Write-Host ""

npx expo start --clear --localhost --port 8081
