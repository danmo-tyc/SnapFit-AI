# 🚀 GitHub Actions 自动构建 APK 指南

## 🎯 优势

使用 GitHub Actions 构建 APK 的优势：
- ✅ **无需本地环境** - 不用安装 Java、Android SDK
- ✅ **自动化构建** - 推送代码即可触发构建
- ✅ **云端资源** - 使用 GitHub 的免费构建资源
- ✅ **版本管理** - 自动创建 Release 和下载链接
- ✅ **多平台支持** - 在任何设备上都能触发构建

## 🚀 快速开始

### 1️⃣ 推送代码到 GitHub

如果还没有推送到 GitHub：

```bash
# 初始化 git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "🎉 Initial commit: SnapFit AI ready for APK build"

# 添加远程仓库 (替换为你的仓库地址)
git remote add origin https://github.com/你的用户名/SnapFit-AI.git

# 推送到 GitHub
git push -u origin main
```

### 2️⃣ 触发构建

有三种方式触发 APK 构建：

#### 方法一：手动触发 (推荐)
1. 进入你的 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **⚡ Quick Build APK** 工作流
4. 点击 **Run workflow** 按钮
5. 点击绿色的 **Run workflow** 确认

#### 方法二：推送代码自动触发
```bash
# 任何推送到 main 分支都会自动构建
git add .
git commit -m "✨ Update features"
git push
```

#### 方法三：创建 Release 标签
```bash
# 创建版本标签会构建并自动发布 Release
git tag v1.0.0
git push origin v1.0.0
```

### 3️⃣ 下载 APK

构建完成后，有两种下载方式：

#### 从 Actions 下载
1. 在 **Actions** 页面找到你的构建
2. 点击进入构建详情
3. 在 **Artifacts** 部分下载 APK

#### 从 Releases 下载 (如果是标签触发)
1. 进入仓库的 **Releases** 页面
2. 找到对应版本
3. 下载 APK 文件

## 📋 工作流说明

### 🚀 Build SnapFit AI Android APK
- **触发条件**: 推送到 main/master 分支，PR，手动触发
- **功能**: 完整构建流程，支持 debug/release 两种模式
- **输出**: APK 文件，构建报告，自动 Release

### ⚡ Quick Build APK  
- **触发条件**: 仅手动触发
- **功能**: 快速构建 debug APK
- **输出**: APK 文件 (保留 7 天)

## 🔧 自定义构建

### 修改应用信息

编辑 `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.snapfit.ai"
        versionCode 1
        versionName "1.0.0"
        // 修改这些值来自定义应用
    }
}
```

### 修改应用名称

编辑 `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.snapfit.ai',
  appName: 'SnapFit AI', // 修改应用名称
  // ...
};
```

### 添加应用图标

1. 将图标文件放在 `public/` 目录
2. 运行 `npx cap sync android` 同步资源

## 📊 构建状态

### 查看构建进度
1. 进入 **Actions** 页面
2. 点击正在运行的工作流
3. 查看实时构建日志

### 构建时间
- **Quick Build**: 约 5-8 分钟
- **Full Build**: 约 8-12 分钟

### 构建资源
- **免费额度**: GitHub 提供每月 2000 分钟免费构建时间
- **并发限制**: 免费账户最多 20 个并发任务

## 🎯 最佳实践

### 1. 版本管理
```bash
# 使用语义化版本号
git tag v1.0.0    # 主要版本
git tag v1.1.0    # 功能更新  
git tag v1.1.1    # 问题修复
```

### 2. 分支策略
```bash
# 开发分支
git checkout -b feature/new-feature
git push origin feature/new-feature

# 合并到主分支触发构建
git checkout main
git merge feature/new-feature
git push
```

### 3. 构建优化
- 只在需要时触发构建
- 使用 Quick Build 进行快速测试
- 使用标签触发正式版本构建

## 🔍 故障排除

### 构建失败
1. 查看 Actions 页面的错误日志
2. 检查代码语法错误
3. 确认 package.json 依赖正确

### APK 无法下载
1. 确认构建已完成
2. 检查 Artifacts 保留时间
3. 尝试刷新页面

### 权限问题
1. 确认仓库是公开的或你有访问权限
2. 检查 GitHub Actions 是否启用

## 🎉 成功标志

构建成功后你会看到：
- ✅ 绿色的构建状态
- 📱 APK 文件在 Artifacts 中
- 📊 构建摘要显示 APK 信息
- 🎯 自动创建的 Release (如果是标签触发)

## 📱 安装测试

下载 APK 后：
1. 传输到 Android 设备
2. 启用"未知来源"安装
3. 安装并测试所有功能
4. 配置 AI 模型进行完整测试

---

**🎯 现在你可以在任何地方、任何设备上触发 APK 构建，无需本地开发环境！**
