# 🚀 SnapFit AI APK 构建指南

## ✅ 当前状态
- ✅ Next.js 应用已成功构建并导出到 `out` 目录
- ✅ 所有 API 功能已转换为客户端逻辑
- ✅ Capacitor 配置已完成
- ✅ Android 项目已生成
- ⚠️ 需要安装 Android 开发环境

## 🛠️ 环境要求

### 1. Java Development Kit (JDK)
```bash
# 下载并安装 JDK 17 或更高版本
# 推荐使用 Oracle JDK 或 OpenJDK
# 下载地址: https://www.oracle.com/java/technologies/downloads/
```

### 2. Android Studio
```bash
# 下载并安装 Android Studio
# 下载地址: https://developer.android.com/studio
```

### 3. Android SDK
- 在 Android Studio 中安装 Android SDK
- 推荐安装 API Level 33 (Android 13) 或更高

## 🚀 构建步骤

### 方法一：使用 Android Studio (推荐)

1. **安装环境**
   ```bash
   # 1. 安装 JDK 17+
   # 2. 安装 Android Studio
   # 3. 配置 Android SDK
   ```

2. **打开项目**
   ```bash
   npx cap open android
   ```

3. **构建 APK**
   - 在 Android Studio 中点击 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - 或使用快捷键 `Ctrl+Shift+A` 搜索 "Build APK"

### 方法二：命令行构建

1. **设置环境变量**
   ```bash
   # Windows
   set JAVA_HOME=C:\Program Files\Java\jdk-17
   set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
   
   # Linux/Mac
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

2. **构建 Debug APK**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

3. **构建 Release APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## 📁 输出位置

构建完成后，APK 文件将位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
android/app/build/outputs/apk/release/app-release.apk
```

## 🔧 故障排除

### 常见问题

1. **JAVA_HOME 未设置**
   ```bash
   # 确保 JDK 已安装并设置 JAVA_HOME 环境变量
   java -version
   ```

2. **Android SDK 未找到**
   ```bash
   # 确保 ANDROID_HOME 环境变量指向 SDK 目录
   # 通常位于: C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   ```

3. **Gradle 构建失败**
   ```bash
   # 清理并重新构建
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

4. **权限问题 (Linux/Mac)**
   ```bash
   chmod +x android/gradlew
   ```

## 🎯 应用信息

- **应用名称**: SnapFit AI
- **包名**: com.snapfit.ai
- **版本**: 1.0.0
- **最低 Android 版本**: 5.1 (API Level 22)
- **目标 Android 版本**: 13 (API Level 33)

## 📱 功能特性

✅ **已实现功能**:
- 健康数据记录 (体重、饮食、运动)
- AI 智能分析和建议
- 数据可视化图表
- 多语言支持 (中文/英文)
- 离线数据存储
- 数据导入导出

✅ **AI 功能**:
- 食物营养分析
- 运动数据解析
- 个性化健康建议
- 智能聊天助手
- TEF (食物热效应) 分析

## 🔐 安全说明

- 所有数据存储在本地设备
- AI API 密钥由用户自行配置
- 无数据上传到第三方服务器
- 支持数据导出备份

## 📞 技术支持

如果在构建过程中遇到问题，请检查：
1. Java 和 Android SDK 是否正确安装
2. 环境变量是否正确设置
3. 网络连接是否正常 (下载依赖时需要)
4. 磁盘空间是否充足 (至少需要 5GB)

## 🎉 构建成功后

APK 构建成功后，你可以：
1. 直接安装到 Android 设备测试
2. 分发给其他用户使用
3. 上传到应用商店发布

**注意**: Release 版本需要签名才能发布到 Google Play Store。
