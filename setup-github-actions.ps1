Write-Host "========================================" -ForegroundColor Green
Write-Host "🚀 SnapFit AI - GitHub Actions 设置脚本" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 检查Git是否已安装
Write-Host "🔍 检查Git环境..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git已安装: $gitVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ 错误: Git未安装" -ForegroundColor Red
    Write-Host "请先安装Git: https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "按Enter键退出"
    exit 1
}

Write-Host ""
Write-Host "📋 当前项目状态检查..." -ForegroundColor Yellow

# 检查重要文件
$requiredFiles = @(
    ".github\workflows\build-android-apk.yml",
    "capacitor.config.ts",
    "package.json",
    "android"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔧 Git仓库初始化..." -ForegroundColor Yellow

# 检查是否已经是Git仓库
if (Test-Path ".git") {
    Write-Host "✅ Git仓库已存在" -ForegroundColor Green
} else {
    Write-Host "📦 初始化Git仓库..." -ForegroundColor Cyan
    git init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git仓库初始化成功" -ForegroundColor Green
    } else {
        Write-Host "❌ Git仓库初始化失败" -ForegroundColor Red
        Read-Host "按Enter键退出"
        exit 1
    }
}

# 创建.gitignore文件
Write-Host "📝 创建.gitignore文件..." -ForegroundColor Cyan
$gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
.next/
out/
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Electron
electron/dist/

# Android
android/app/build/
android/build/
android/.gradle/
android/local.properties
android/app/release/

# Capacitor
ios/
android/app/src/main/assets/public/
"@

$gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
Write-Host "✅ .gitignore文件已创建" -ForegroundColor Green

# 添加所有文件到Git
Write-Host "📦 添加文件到Git..." -ForegroundColor Cyan
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 文件添加成功" -ForegroundColor Green
} else {
    Write-Host "❌ 文件添加失败" -ForegroundColor Red
}

# 创建初始提交
Write-Host "💾 创建初始提交..." -ForegroundColor Cyan
git commit -m "🎉 Initial commit: SnapFit AI with GitHub Actions APK build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 初始提交创建成功" -ForegroundColor Green
} else {
    Write-Host "⚠️ 提交可能已存在或无更改" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎯 下一步操作指南" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. 📱 创建GitHub仓库:" -ForegroundColor Cyan
Write-Host "   - 访问: https://github.com/new" -ForegroundColor White
Write-Host "   - 仓库名称: SnapFit-AI" -ForegroundColor White
Write-Host "   - 设置为Public或Private" -ForegroundColor White
Write-Host "   - 点击'Create repository'" -ForegroundColor White
Write-Host ""

Write-Host "2. 🔗 连接远程仓库:" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/[您的用户名]/SnapFit-AI.git" -ForegroundColor White
Write-Host "   git branch -M main" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White
Write-Host ""

Write-Host "3. 🚀 触发APK构建:" -ForegroundColor Cyan
Write-Host "   - 推送代码后自动开始构建" -ForegroundColor White
Write-Host "   - 或在GitHub Actions页面手动触发" -ForegroundColor White
Write-Host ""

Write-Host "4. 📥 下载APK:" -ForegroundColor Cyan
Write-Host "   - 访问GitHub仓库的Actions页面" -ForegroundColor White
Write-Host "   - 点击最新的构建任务" -ForegroundColor White
Write-Host "   - 在Artifacts中下载APK" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "📋 快速命令参考" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "# 设置远程仓库（替换[您的用户名]）" -ForegroundColor Yellow
Write-Host "git remote add origin https://github.com/[您的用户名]/SnapFit-AI.git" -ForegroundColor White
Write-Host ""

Write-Host "# 推送到GitHub" -ForegroundColor Yellow
Write-Host "git push -u origin main" -ForegroundColor White
Write-Host ""

Write-Host "# 查看构建状态" -ForegroundColor Yellow
Write-Host "# 访问: https://github.com/[您的用户名]/SnapFit-AI/actions" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ GitHub Actions设置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 恭喜！您的SnapFit AI项目已准备好自动构建APK！" -ForegroundColor Green
Write-Host ""
Write-Host "📚 详细说明请查看: GITHUB-ACTIONS-GUIDE.md" -ForegroundColor Cyan
Write-Host ""

Read-Host "按Enter键退出"
