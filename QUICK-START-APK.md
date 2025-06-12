# 🚀 SnapFit AI APK 快速开始指南

## 📋 准备工作已完成 ✅

- ✅ Next.js 应用已构建并导出
- ✅ 所有 API 功能已转换为客户端逻辑  
- ✅ Capacitor 配置已完成
- ✅ Android 项目已生成
- ✅ 构建脚本已准备就绪

## 🛠️ 环境安装 (一次性设置)

### 1. 安装 Java JDK 17+
```bash
# 下载地址: https://www.oracle.com/java/technologies/downloads/
# 或使用 OpenJDK: https://adoptium.net/
```

### 2. 安装 Android Studio
```bash
# 下载地址: https://developer.android.com/studio
# 安装时选择 "Standard" 安装类型
```

### 3. 配置环境变量
```bash
# Windows 系统变量:
JAVA_HOME=C:\Program Files\Java\jdk-17
ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk

# 添加到 PATH:
%JAVA_HOME%\bin
%ANDROID_HOME%\tools
%ANDROID_HOME%\platform-tools
```

## 🚀 一键构建 APK

### 方法一：使用自动化脚本 (推荐)

**Windows PowerShell:**
```powershell
.\build-apk-auto.ps1
```

**Windows 批处理:**
```cmd
build-apk-simple.bat
```

### 方法二：手动构建

```bash
# 1. 安装依赖
npm install

# 2. 构建应用
npm run build

# 3. 同步 Capacitor
npx cap sync android

# 4. 构建 APK
cd android
gradlew.bat assembleDebug
```

## 📁 APK 输出位置

构建完成后，APK 文件位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
android/app/build/outputs/apk/release/app-release.apk
```

## 📱 安装到设备

1. **传输 APK** 到 Android 设备
2. **启用未知来源安装**:
   - 设置 → 安全 → 未知来源 (Android 7 及以下)
   - 设置 → 应用和通知 → 特殊应用访问 → 安装未知应用 (Android 8+)
3. **点击 APK 文件安装**

## 🎯 应用功能

### 🏥 健康管理
- 体重记录和追踪
- 饮食日志管理  
- 运动数据记录
- 每日健康状态

### 🤖 AI 功能
- 智能健康分析
- 个性化建议
- 食物营养解析
- 运动数据分析
- 智能聊天助手

### 📊 数据可视化
- 体重趋势图表
- 卡路里摄入/消耗图表
- 营养成分分析
- 运动效果统计

### 🌍 其他特性
- 中英文双语支持
- 离线数据存储
- 数据导入导出
- 深色/浅色主题

## 🔧 故障排除

### 常见问题

**1. Java 相关错误**
```bash
# 确保 JDK 17+ 已安装
java -version

# 设置 JAVA_HOME 环境变量
```

**2. Android SDK 错误**
```bash
# 确保 Android Studio 已安装
# 设置 ANDROID_HOME 环境变量
# 安装必要的 SDK 组件
```

**3. 构建失败**
```bash
# 清理并重新构建
cd android
gradlew.bat clean
gradlew.bat assembleDebug
```

**4. 权限错误**
```bash
# 确保有足够的磁盘空间 (至少 5GB)
# 以管理员身份运行命令提示符
```

## 📞 技术支持

如果遇到问题，请检查：
1. ✅ Java JDK 17+ 已安装
2. ✅ Android Studio 已安装
3. ✅ 环境变量已正确设置
4. ✅ 网络连接正常
5. ✅ 磁盘空间充足

## 🎉 成功标志

构建成功后你会看到：
```
✅ Next.js 构建完成
✅ Capacitor 同步完成  
✅ APK 构建成功
📁 APK 位置: android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔐 安全说明

- 🛡️ 所有数据存储在本地设备
- 🔑 AI API 密钥由用户自行配置
- 🚫 无数据上传到第三方服务器
- 💾 支持数据导出备份

---

**🎯 目标**: 生成一个完全功能的 SnapFit AI Android APK，包含所有健康管理和 AI 功能！
