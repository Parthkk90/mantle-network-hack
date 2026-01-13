# Run CRESCA on CPH2569 Device
Write-Host "=== Launching CRESCA on CPH2569 ===" -ForegroundColor Green
Write-Host ""

# Check device connection
Write-Host "Checking device connection..." -ForegroundColor Yellow
$devices = adb devices
if ($devices -notmatch "6f12c139") {
    Write-Host "ERROR: CPH2569 device not found!" -ForegroundColor Red
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. USB Debugging is enabled" -ForegroundColor White
    Write-Host "  2. USB cable is connected" -ForegroundColor White
    Write-Host "  3. Device is unlocked" -ForegroundColor White
    Write-Host "  4. You authorized this computer on the device" -ForegroundColor White
    exit 1
}

Write-Host "✓ Device CPH2569 (6f12c139) connected!" -ForegroundColor Green
Write-Host ""

# Clear old app data
Write-Host "Clearing old app data..." -ForegroundColor Yellow
adb -s 6f12c139 shell pm clear com.cresca.app 2>$null

# Start Expo and launch on device
Write-Host "Starting Expo server..." -ForegroundColor Yellow
Write-Host ""
npx expo start --android --clear --port 8081

Write-Host ""
Write-Host "App should be launching on your CPH2569..." -ForegroundColor Cyan
