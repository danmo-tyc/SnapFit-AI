# SnapFit AI APK 自动构建脚本
# PowerShell 脚本用于自动化 APK 构建过程

Write-Host "🚀 SnapFit AI APK 自动构建脚本" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# 检查 Node.js
Write-Host "📦 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 检查 Java
Write-Host "☕ 检查 Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✅ Java 已安装: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Java 未安装" -ForegroundColor Red
    Write-Host "请下载并安装 JDK 17+: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Yellow
    
    $install = Read-Host "是否要自动下载 JDK? (y/n)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "🔗 正在打开 JDK 下载页面..." -ForegroundColor Yellow
        Start-Process "https://www.oracle.com/java/technologies/downloads/"
    }
    exit 1
}

# 检查 Android SDK
Write-Host "📱 检查 Android SDK..." -ForegroundColor Yellow
$androidHome = $env:ANDROID_HOME
if (-not $androidHome -or -not (Test-Path $androidHome)) {
    Write-Host "❌ ANDROID_HOME 未设置或路径不存在" -ForegroundColor Red
    Write-Host "请安装 Android Studio 并设置 ANDROID_HOME 环境变量" -ForegroundColor Yellow
    Write-Host "Android Studio 下载: https://developer.android.com/studio" -ForegroundColor Yellow
    
    $install = Read-Host "是否要自动下载 Android Studio? (y/n)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "🔗 正在打开 Android Studio 下载页面..." -ForegroundColor Yellow
        Start-Process "https://developer.android.com/studio"
    }
    exit 1
} else {
    Write-Host "✅ Android SDK 路径: $androidHome" -ForegroundColor Green
}

# 检查项目文件
Write-Host "📁 检查项目文件..." -ForegroundColor Yellow
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 未找到 package.json，请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "capacitor.config.ts")) {
    Write-Host "❌ 未找到 capacitor.config.ts" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 项目文件检查通过" -ForegroundColor Green

# 安装依赖
Write-Host "📦 安装项目依赖..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 依赖安装失败" -ForegroundColor Red
    exit 1
}

# 构建 Next.js 应用
Write-Host "🔨 构建 Next.js 应用..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Next.js 构建完成" -ForegroundColor Green
} catch {
    Write-Host "❌ Next.js 构建失败" -ForegroundColor Red
    exit 1
}

# 检查 out 目录
if (-not (Test-Path "out/index.html")) {
    Write-Host "❌ 构建输出不完整，缺少 index.html" -ForegroundColor Red
    exit 1
}

# 同步 Capacitor
Write-Host "🔄 同步 Capacitor..." -ForegroundColor Yellow
try {
    npx cap sync android
    Write-Host "✅ Capacitor 同步完成" -ForegroundColor Green
} catch {
    Write-Host "❌ Capacitor 同步失败" -ForegroundColor Red
    exit 1
}

# 构建 APK
Write-Host "📱 构建 APK..." -ForegroundColor Yellow
Write-Host "选择构建类型:" -ForegroundColor Cyan
Write-Host "1. Debug APK (快速，用于测试)" -ForegroundColor White
Write-Host "2. Release APK (优化，用于发布)" -ForegroundColor White

$buildType = Read-Host "请选择 (1 或 2)"

$gradleTask = if ($buildType -eq "2") { "assembleRelease" } else { "assembleDebug" }
$apkType = if ($buildType -eq "2") { "release" } else { "debug" }

Write-Host "🔨 正在构建 $apkType APK..." -ForegroundColor Yellow

try {
    Set-Location "android"
    
    # 使用 gradlew.bat 构建
    & ".\gradlew.bat" $gradleTask
    
    Set-Location ".."
    
    # 检查 APK 是否生成
    $apkPath = "android\app\build\outputs\apk\$apkType\app-$apkType.apk"
    
    if (Test-Path $apkPath) {
        Write-Host "🎉 APK 构建成功!" -ForegroundColor Green
        Write-Host "📁 APK 位置: $apkPath" -ForegroundColor Cyan
        
        # 获取 APK 文件大小
        $apkSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
        Write-Host "📊 APK 大小: $apkSize MB" -ForegroundColor Cyan
        
        # 询问是否打开文件夹
        $openFolder = Read-Host "是否打开 APK 所在文件夹? (y/n)"
        if ($openFolder -eq "y" -or $openFolder -eq "Y") {
            Invoke-Item (Split-Path $apkPath -Parent)
        }
        
        Write-Host ""
        Write-Host "🎯 下一步:" -ForegroundColor Green
        Write-Host "1. 将 APK 传输到 Android 设备" -ForegroundColor White
        Write-Host "2. 在设备上启用'未知来源'安装" -ForegroundColor White
        Write-Host "3. 安装并测试应用" -ForegroundColor White
        
    } else {
        Write-Host "❌ APK 构建失败，未找到输出文件" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ APK 构建过程中出现错误: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Write-Host ""
Write-Host "✨ 构建完成! SnapFit AI APK 已准备就绪!" -ForegroundColor Green
