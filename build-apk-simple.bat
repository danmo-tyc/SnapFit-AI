@echo off
chcp 65001 >nul
title SnapFit AI APK 构建器

echo.
echo 🚀 SnapFit AI APK 简易构建器
echo ===============================
echo.

:: 检查 Node.js
echo 📦 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

:: 检查 Java
echo.
echo ☕ 检查 Java...
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Java 未安装
    echo 请下载并安装 JDK 17+: https://www.oracle.com/java/technologies/downloads/
    echo.
    set /p install="是否要打开 JDK 下载页面? (y/n): "
    if /i "%install%"=="y" start https://www.oracle.com/java/technologies/downloads/
    pause
    exit /b 1
)
echo ✅ Java 已安装

:: 检查 ANDROID_HOME
echo.
echo 📱 检查 Android SDK...
if "%ANDROID_HOME%"=="" (
    echo ❌ ANDROID_HOME 环境变量未设置
    echo 请安装 Android Studio 并设置 ANDROID_HOME
    echo Android Studio 下载: https://developer.android.com/studio
    echo.
    set /p install="是否要打开 Android Studio 下载页面? (y/n): "
    if /i "%install%"=="y" start https://developer.android.com/studio
    pause
    exit /b 1
)
echo ✅ Android SDK 路径: %ANDROID_HOME%

:: 检查项目文件
echo.
echo 📁 检查项目文件...
if not exist "package.json" (
    echo ❌ 未找到 package.json，请在项目根目录运行此脚本
    pause
    exit /b 1
)
echo ✅ 项目文件检查通过

:: 安装依赖
echo.
echo 📦 安装项目依赖...
call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

:: 构建 Next.js 应用
echo.
echo 🔨 构建 Next.js 应用...
call npm run build
if errorlevel 1 (
    echo ❌ Next.js 构建失败
    pause
    exit /b 1
)
echo ✅ Next.js 构建完成

:: 同步 Capacitor
echo.
echo 🔄 同步 Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ❌ Capacitor 同步失败
    pause
    exit /b 1
)
echo ✅ Capacitor 同步完成

:: 构建 APK
echo.
echo 📱 构建 APK...
echo 选择构建类型:
echo 1. Debug APK (快速，用于测试)
echo 2. Release APK (优化，用于发布)
echo.
set /p buildType="请选择 (1 或 2): "

if "%buildType%"=="2" (
    set gradleTask=assembleRelease
    set apkType=release
) else (
    set gradleTask=assembleDebug
    set apkType=debug
)

echo.
echo 🔨 正在构建 %apkType% APK...
cd android
call gradlew.bat %gradleTask%
if errorlevel 1 (
    echo ❌ APK 构建失败
    cd ..
    pause
    exit /b 1
)
cd ..

:: 检查 APK 是否生成
set apkPath=android\app\build\outputs\apk\%apkType%\app-%apkType%.apk
if exist "%apkPath%" (
    echo.
    echo 🎉 APK 构建成功!
    echo 📁 APK 位置: %apkPath%
    
    :: 获取文件大小
    for %%A in ("%apkPath%") do set apkSize=%%~zA
    set /a apkSizeMB=%apkSize%/1048576
    echo 📊 APK 大小: %apkSizeMB% MB
    
    echo.
    echo 🎯 下一步:
    echo 1. 将 APK 传输到 Android 设备
    echo 2. 在设备上启用'未知来源'安装
    echo 3. 安装并测试应用
    echo.
    
    set /p openFolder="是否打开 APK 所在文件夹? (y/n): "
    if /i "%openFolder%"=="y" explorer "android\app\build\outputs\apk\%apkType%"
    
) else (
    echo ❌ APK 构建失败，未找到输出文件
    pause
    exit /b 1
)

echo.
echo ✨ 构建完成! SnapFit AI APK 已准备就绪!
pause
