# 🚀 SnapFit AI - GitHub Actions自动构建APK指南

## 🎯 概述

GitHub Actions已配置完成！现在您可以自动构建Android APK，无需本地安装任何开发环境。

## ✅ 已配置的功能

### 🔄 自动触发条件
- ✅ 推送到main/master分支时自动构建
- ✅ 创建Pull Request时自动构建
- ✅ 手动触发构建（workflow_dispatch）

### 🏗️ 构建流程
1. **环境准备**: Ubuntu + Node.js 18 + Java 17 + Android SDK
2. **依赖安装**: 自动安装所有npm依赖
3. **Web资源准备**: 创建移动端优化的HTML
4. **Capacitor同步**: 同步Web资源到Android项目
5. **APK构建**: 使用Gradle构建Debug APK
6. **文件上传**: 自动上传APK到GitHub Artifacts
7. **发布创建**: 自动创建GitHub Release（仅主分支）

## 🚀 使用步骤

### 步骤1: 推送代码到GitHub

1. **初始化Git仓库**（如果还没有）
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SnapFit AI with GitHub Actions"
   ```

2. **创建GitHub仓库**
   - 访问 https://github.com/new
   - 仓库名称: `SnapFit-AI`
   - 设置为Public或Private
   - 点击"Create repository"

3. **推送代码**
   ```bash
   git remote add origin https://github.com/[您的用户名]/SnapFit-AI.git
   git branch -M main
   git push -u origin main
   ```

### 步骤2: 触发构建

#### 方法A: 自动触发
- 推送代码后，GitHub Actions会自动开始构建
- 构建时间约10-15分钟

#### 方法B: 手动触发
1. 访问您的GitHub仓库
2. 点击"Actions"标签
3. 选择"🚀 Build SnapFit AI Android APK"
4. 点击"Run workflow"
5. 点击绿色的"Run workflow"按钮

### 步骤3: 下载APK

#### 从Artifacts下载（每次构建）
1. 访问GitHub仓库的"Actions"页面
2. 点击最新的构建任务
3. 在"Artifacts"部分找到"snapfit-ai-debug-apk"
4. 点击下载ZIP文件
5. 解压获得APK文件

#### 从Releases下载（主分支构建）
1. 访问GitHub仓库的"Releases"页面
2. 找到最新的Release
3. 直接下载APK文件

## 📱 APK文件信息

### 📋 基本信息
- **文件名**: app-debug.apk
- **应用名**: SnapFit AI
- **包名**: com.snapfit.ai
- **版本**: 1.0.0
- **大小**: 约15-25MB

### 🔧 技术规格
- **最小Android版本**: API 22 (Android 5.1)
- **目标Android版本**: API 34 (Android 14)
- **架构**: Universal APK (支持所有架构)
- **签名**: Debug签名（仅用于测试）

## 📱 安装APK

### Android设备安装
1. **下载APK文件**到设备
2. **启用未知来源**:
   - 设置 → 安全 → 未知来源 → 启用
   - 或者在安装时允许
3. **安装APK**:
   - 使用文件管理器打开APK
   - 点击安装
   - 等待安装完成

### 使用ADB安装
```bash
adb install app-debug.apk
```

## 🔧 自定义配置

### 修改构建触发条件
编辑 `.github/workflows/build-android-apk.yml`:

```yaml
on:
  push:
    branches: [ main ]  # 只在main分支触发
  # 移除pull_request以禁用PR构建
```

### 修改应用信息
编辑 `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.yourcompany.snapfit',  // 修改包名
  appName: 'Your SnapFit AI',        // 修改应用名
  // ...
};
```

### 添加签名配置（生产版本）
1. 生成签名密钥
2. 将密钥添加到GitHub Secrets
3. 修改工作流使用发布签名

## 📊 构建状态监控

### 查看构建日志
1. 访问"Actions"页面
2. 点击构建任务
3. 查看详细日志
4. 排查构建问题

### 构建状态徽章
在README中添加状态徽章:

```markdown
![Build APK](https://github.com/[用户名]/SnapFit-AI/workflows/🚀%20Build%20SnapFit%20AI%20Android%20APK/badge.svg)
```

## 🎯 高级功能

### 多版本构建
- Debug版本：开发测试用
- Release版本：生产发布用
- 不同架构：ARM、x86等

### 自动化测试
- 单元测试
- 集成测试
- UI测试

### 自动发布
- Google Play Store
- 其他应用商店
- 内部分发

## 🆘 故障排除

### 常见问题

1. **构建失败**
   - 检查构建日志
   - 确认依赖版本
   - 检查代码语法

2. **APK无法安装**
   - 检查Android版本兼容性
   - 确认允许未知来源
   - 检查存储空间

3. **应用崩溃**
   - 查看设备日志
   - 检查权限配置
   - 验证资源文件

### 获取帮助
- 查看GitHub Actions日志
- 检查Capacitor文档
- 搜索相关错误信息

## 🎉 总结

**🎊 恭喜！您现在拥有了完全自动化的APK构建流程！**

### ✅ 优势
- 🚀 无需本地环境
- ⚡ 自动化构建
- 📦 自动发布
- 🔄 持续集成
- 📱 随时获取最新APK

### 🔄 工作流程
1. 修改代码
2. 推送到GitHub
3. 自动构建APK
4. 下载并安装
5. 测试和反馈

**现在您可以专注于开发功能，让GitHub Actions处理所有的构建和发布工作！** 🚀
