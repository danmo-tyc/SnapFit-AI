# SnapFit AI - Android APK 构建指南

## 🎯 概述

本指南将帮助您将SnapFit AI Web应用打包成Android APK文件。

## 📋 前置要求

### 1. 安装Android Studio
- 下载地址: https://developer.android.com/studio
- 安装时选择包含Android SDK和模拟器
- 首次启动时会自动下载必要的SDK组件

### 2. 环境变量配置
安装Android Studio后，需要设置以下环境变量：

```bash
JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
ANDROID_HOME=C:\Users\[用户名]\AppData\Local\Android\Sdk
```

将以下路径添加到PATH环境变量：
```bash
%JAVA_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
```

## 🚀 构建步骤

### 方法一：使用构建脚本（推荐）

1. **运行构建脚本**
   ```bash
   build-apk.bat
   ```

2. **等待构建完成**
   - 首次构建可能需要10-20分钟
   - 脚本会自动下载依赖项

3. **获取APK文件**
   - 构建成功后，APK文件位于：
   - `android\app\build\outputs\apk\debug\app-debug.apk`

### 方法二：使用Android Studio

1. **打开Android项目**
   ```bash
   npx cap open android
   ```

2. **在Android Studio中构建**
   - 等待项目同步完成
   - 点击 Build → Build Bundle(s) / APK(s) → Build APK(s)
   - 等待构建完成

3. **获取APK文件**
   - 构建完成后会显示APK文件位置
   - 通常在 `app/build/outputs/apk/debug/` 目录下

### 方法三：命令行构建

1. **准备Web应用**
   ```bash
   npm run build-mobile
   npx cap sync
   ```

2. **构建APK**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

## 📱 安装APK

### 在Android设备上安装

1. **启用开发者选项**
   - 设置 → 关于手机 → 连续点击"版本号"7次

2. **启用USB调试**
   - 设置 → 开发者选项 → USB调试

3. **安装APK**
   - 将APK文件传输到设备
   - 使用文件管理器打开APK文件
   - 允许安装未知来源应用

### 使用ADB安装

```bash
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

## 🔧 故障排除

### 常见问题

1. **Java未找到**
   - 确保安装了Java SDK
   - 检查JAVA_HOME环境变量

2. **Android SDK未找到**
   - 确保安装了Android Studio
   - 检查ANDROID_HOME环境变量

3. **Gradle构建失败**
   - 检查网络连接
   - 清理项目：`./gradlew clean`
   - 重新构建：`./gradlew assembleDebug`

4. **依赖下载失败**
   - 配置代理（如果需要）
   - 使用国内镜像源

### 环境检查命令

```bash
# 检查Java版本
java -version

# 检查Android SDK
adb version

# 检查Gradle
cd android
./gradlew --version
```

## 📦 应用信息

- **应用名称**: SnapFit AI
- **包名**: com.snapfit.ai
- **版本**: 1.0.0
- **最小Android版本**: API 22 (Android 5.1)
- **目标Android版本**: API 34 (Android 14)

## 🎨 应用特性

### 移动端优化
- 响应式设计
- 触摸友好的界面
- 原生Android体验
- 启动画面和图标

### 功能特性
- 健康数据记录
- AI智能分析
- 数据可视化
- 聊天助手
- 多语言支持

## 📝 发布准备

### 生产版本构建

1. **生成签名密钥**
   ```bash
   keytool -genkey -v -keystore snapfit-release-key.keystore -alias snapfit -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **配置签名**
   - 在 `android/app/build.gradle` 中配置签名信息

3. **构建发布版本**
   ```bash
   ./gradlew assembleRelease
   ```

### 应用商店发布
- Google Play Store
- 华为应用市场
- 小米应用商店
- 其他第三方应用商店

## 🆘 技术支持

如果在构建过程中遇到问题，请：

1. 检查本指南的故障排除部分
2. 查看Android Studio的错误日志
3. 搜索相关错误信息
4. 联系技术支持

---

**祝您构建成功！🎉**
