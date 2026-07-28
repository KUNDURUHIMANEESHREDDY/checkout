# Fast Build Script for G Fresh AI Checkout
Write-Host "--- INITIALIZING FAST BUILD PIPELINE ---" -ForegroundColor Cyan

# 1. Cleanup
Write-Host "[1/3] Cleaning build cache..." -ForegroundColor Gray
flutter clean

# 2. Get Dependencies
Write-Host "[2/3] Resolving dependencies..." -ForegroundColor Gray
flutter pub get

# 3. Build APK
Write-Host "[3/3] Compiling Release APK..." -ForegroundColor Gray
$startTime = Get-Date
flutter build apk --release --split-per-abi

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n--- BUILD COMPLETE ---" -ForegroundColor Green
Write-Host "Duration: $($duration.Minutes)m $($duration.Seconds)s"
Write-Host "APK Location: build\app\outputs\flutter-apk\app-release.apk" -ForegroundColor Yellow
