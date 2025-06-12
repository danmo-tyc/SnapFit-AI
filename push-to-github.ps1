# 推送到 GitHub 并触发 APK 构建
Write-Host "🚀 准备推送到 GitHub 并触发 APK 构建" -ForegroundColor Green

# 检查 git 状态
Write-Host "📋 检查 Git 状态..." -ForegroundColor Yellow
try {
    git status
} catch {
    Write-Host "❌ Git 未初始化，正在初始化..." -ForegroundColor Red
    git init
    Write-Host "✅ Git 仓库已初始化" -ForegroundColor Green
}

# 添加所有文件
Write-Host "📦 添加所有文件..." -ForegroundColor Yellow
git add .

# 检查是否有变更
$status = git status --porcelain
if (-not $status) {
    Write-Host "ℹ️ 没有新的变更需要提交" -ForegroundColor Cyan
    
    $force = Read-Host "是否要强制触发构建? (y/n)"
    if ($force -eq "y" -or $force -eq "Y") {
        Write-Host "🔄 创建空提交以触发构建..." -ForegroundColor Yellow
        git commit --allow-empty -m "🚀 Trigger APK build"
    } else {
        Write-Host "❌ 取消操作" -ForegroundColor Red
        exit 0
    }
} else {
    # 提交变更
    Write-Host "💾 提交变更..." -ForegroundColor Yellow
    $commitMessage = Read-Host "请输入提交信息 (留空使用默认信息)"
    
    if (-not $commitMessage) {
        $commitMessage = "🎉 Add GitHub Actions APK build workflow"
    }
    
    git commit -m $commitMessage
    Write-Host "✅ 变更已提交" -ForegroundColor Green
}

# 检查远程仓库
Write-Host "🔗 检查远程仓库..." -ForegroundColor Yellow
$remotes = git remote -v
if (-not $remotes) {
    Write-Host "❌ 未配置远程仓库" -ForegroundColor Red
    Write-Host "请先配置远程仓库:" -ForegroundColor Yellow
    Write-Host "git remote add origin https://github.com/你的用户名/SnapFit-AI.git" -ForegroundColor Cyan
    
    $repoUrl = Read-Host "请输入你的 GitHub 仓库 URL"
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✅ 远程仓库已配置" -ForegroundColor Green
    } else {
        Write-Host "❌ 未输入仓库 URL，退出" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ 远程仓库已配置:" -ForegroundColor Green
    Write-Host $remotes -ForegroundColor Cyan
}

# 推送到 GitHub
Write-Host "🚀 推送到 GitHub..." -ForegroundColor Yellow
try {
    # 尝试推送到 main 分支
    git push origin main
    Write-Host "✅ 成功推送到 main 分支" -ForegroundColor Green
} catch {
    try {
        # 如果 main 不存在，尝试 master
        git push origin master
        Write-Host "✅ 成功推送到 master 分支" -ForegroundColor Green
    } catch {
        # 如果都失败，尝试设置上游分支
        Write-Host "⚠️ 推送失败，尝试设置上游分支..." -ForegroundColor Yellow
        try {
            git push -u origin main
            Write-Host "✅ 成功推送并设置上游分支 (main)" -ForegroundColor Green
        } catch {
            try {
                git push -u origin master
                Write-Host "✅ 成功推送并设置上游分支 (master)" -ForegroundColor Green
            } catch {
                Write-Host "❌ 推送失败，请检查网络连接和仓库权限" -ForegroundColor Red
                exit 1
            }
        }
    }
}

Write-Host ""
Write-Host "🎉 推送成功！" -ForegroundColor Green
Write-Host ""
Write-Host "📱 下一步:" -ForegroundColor Cyan
Write-Host "1. 访问你的 GitHub 仓库" -ForegroundColor White
Write-Host "2. 点击 'Actions' 标签查看构建进度" -ForegroundColor White
Write-Host "3. 构建完成后在 'Artifacts' 部分下载 APK" -ForegroundColor White
Write-Host ""
Write-Host "🔗 快速链接:" -ForegroundColor Cyan

# 尝试获取仓库 URL
$repoUrl = git config --get remote.origin.url
if ($repoUrl) {
    # 转换 SSH URL 为 HTTPS URL
    if ($repoUrl -match "git@github.com:(.+)/(.+)\.git") {
        $repoUrl = "https://github.com/$($matches[1])/$($matches[2])"
    }
    
    Write-Host "📂 仓库地址: $repoUrl" -ForegroundColor White
    Write-Host "⚡ Actions 页面: $repoUrl/actions" -ForegroundColor White
    Write-Host "📦 Releases 页面: $repoUrl/releases" -ForegroundColor White
    
    $openBrowser = Read-Host "是否要打开 Actions 页面? (y/n)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process "$repoUrl/actions"
    }
}

Write-Host ""
Write-Host "✨ GitHub Actions 将自动构建 APK！" -ForegroundColor Green
