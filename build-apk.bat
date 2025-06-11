@echo off
echo ========================================
echo SnapFit AI - Android APK 构建脚本
echo ========================================
echo.

echo 步骤 1: 构建Web应用...
call npm run build-mobile
if %errorlevel% neq 0 (
    echo 错误: Web应用构建失败
    pause
    exit /b 1
)

echo.
echo 步骤 2: 同步到Android项目...
call npx cap sync
if %errorlevel% neq 0 (
    echo 错误: 同步到Android项目失败
    pause
    exit /b 1
)

echo.
echo 步骤 3: 检查Android环境...
cd android

echo 检查Gradle Wrapper...
if not exist "gradlew.bat" (
    echo 错误: 找不到Gradle Wrapper
    pause
    exit /b 1
)

echo.
echo 步骤 4: 构建Debug APK...
echo 这可能需要几分钟时间，请耐心等待...
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo 错误: APK构建失败
    echo.
    echo 可能的原因:
    echo 1. 没有安装Java SDK
    echo 2. 没有安装Android SDK
    echo 3. 环境变量配置不正确
    echo.
    echo 建议解决方案:
    echo 1. 安装Android Studio (包含Java SDK和Android SDK)
    echo 2. 设置JAVA_HOME和ANDROID_HOME环境变量
    echo 3. 或者使用Android Studio打开android文件夹进行构建
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 APK构建成功！
echo ========================================
echo.
echo APK文件位置:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 您可以将此APK文件安装到Android设备上。
echo.

cd ..
pause
