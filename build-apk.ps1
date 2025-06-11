Write-Host "========================================"
Write-Host "SnapFit AI - Android APK Build Script"
Write-Host "========================================"
Write-Host ""

Write-Host "Step 1: Building Web App..."
try {
    # 创建简化的out目录内容
    if (!(Test-Path "out")) {
        New-Item -ItemType Directory -Path "out"
    }
    
    # 复制public文件到out
    Copy-Item -Path "public\*" -Destination "out\" -Recurse -Force
    Write-Host "Web assets copied successfully"
}
catch {
    Write-Host "Error: Failed to prepare web assets" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Syncing to Android project..."
try {
    & npx cap sync
    if ($LASTEXITCODE -ne 0) {
        throw "Capacitor sync failed"
    }
    Write-Host "Sync completed successfully"
}
catch {
    Write-Host "Error: Failed to sync to Android project" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 3: Checking Android environment..."
Set-Location "android"

if (!(Test-Path "gradlew.bat")) {
    Write-Host "Error: Gradle Wrapper not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 4: Building Debug APK..."
Write-Host "This may take several minutes, please wait..."

try {
    & .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle build failed"
    }
}
catch {
    Write-Host ""
    Write-Host "Error: APK build failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible causes:"
    Write-Host "1. Java SDK not installed"
    Write-Host "2. Android SDK not installed"
    Write-Host "3. Environment variables not configured"
    Write-Host ""
    Write-Host "Suggested solutions:"
    Write-Host "1. Install Android Studio (includes Java SDK and Android SDK)"
    Write-Host "2. Set JAVA_HOME and ANDROID_HOME environment variables"
    Write-Host "3. Or use Android Studio to open android folder for building"
    Write-Host ""
    Set-Location ".."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "🎉 APK Build Successful!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "APK file location:"
Write-Host "android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Yellow
Write-Host ""
Write-Host "You can install this APK file on Android devices."
Write-Host ""

Set-Location ".."
Read-Host "Press Enter to exit"
