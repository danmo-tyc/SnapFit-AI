@echo off
chcp 65001 >nul
title 推送到 GitHub 并构建 APK

echo.
echo 🚀 准备推送到 GitHub 并触发 APK 构建
echo =====================================
echo.

:: 检查 git 状态
echo 📋 检查 Git 状态...
git status >nul 2>&1
if errorlevel 1 (
    echo ❌ Git 未初始化，正在初始化...
    git init
    echo ✅ Git 仓库已初始化
)

:: 添加所有文件
echo.
echo 📦 添加所有文件...
git add .

:: 检查是否有变更
git diff --cached --quiet
if errorlevel 1 (
    :: 有变更，正常提交
    echo.
    set /p commitMessage="请输入提交信息 (留空使用默认): "
    if "%commitMessage%"=="" set commitMessage=🎉 Add GitHub Actions APK build workflow
    
    echo 💾 提交变更...
    git commit -m "%commitMessage%"
    echo ✅ 变更已提交
) else (
    :: 没有变更
    echo.
    echo ℹ️ 没有新的变更需要提交
    set /p force="是否要强制触发构建? (y/n): "
    if /i "%force%"=="y" (
        echo 🔄 创建空提交以触发构建...
        git commit --allow-empty -m "🚀 Trigger APK build"
    ) else (
        echo ❌ 取消操作
        pause
        exit /b 0
    )
)

:: 检查远程仓库
echo.
echo 🔗 检查远程仓库...
git remote -v >nul 2>&1
if errorlevel 1 (
    echo ❌ 未配置远程仓库
    echo 请先配置远程仓库:
    echo git remote add origin https://github.com/你的用户名/SnapFit-AI.git
    echo.
    set /p repoUrl="请输入你的 GitHub 仓库 URL: "
    if not "%repoUrl%"=="" (
        git remote add origin "%repoUrl%"
        echo ✅ 远程仓库已配置
    ) else (
        echo ❌ 未输入仓库 URL，退出
        pause
        exit /b 1
    )
) else (
    echo ✅ 远程仓库已配置
)

:: 推送到 GitHub
echo.
echo 🚀 推送到 GitHub...

:: 尝试推送到 main 分支
git push origin main >nul 2>&1
if not errorlevel 1 (
    echo ✅ 成功推送到 main 分支
    goto :success
)

:: 如果 main 失败，尝试 master
git push origin master >nul 2>&1
if not errorlevel 1 (
    echo ✅ 成功推送到 master 分支
    goto :success
)

:: 如果都失败，尝试设置上游分支
echo ⚠️ 推送失败，尝试设置上游分支...
git push -u origin main >nul 2>&1
if not errorlevel 1 (
    echo ✅ 成功推送并设置上游分支 (main)
    goto :success
)

git push -u origin master >nul 2>&1
if not errorlevel 1 (
    echo ✅ 成功推送并设置上游分支 (master)
    goto :success
)

echo ❌ 推送失败，请检查网络连接和仓库权限
pause
exit /b 1

:success
echo.
echo 🎉 推送成功！
echo.
echo 📱 下一步:
echo 1. 访问你的 GitHub 仓库
echo 2. 点击 'Actions' 标签查看构建进度
echo 3. 构建完成后在 'Artifacts' 部分下载 APK
echo.
echo 🔗 快速链接:

:: 获取仓库 URL
for /f "tokens=2" %%i in ('git config --get remote.origin.url') do set repoUrl=%%i
if defined repoUrl (
    echo 📂 仓库地址: %repoUrl%
    echo ⚡ Actions 页面: %repoUrl%/actions
    echo 📦 Releases 页面: %repoUrl%/releases
    echo.
    set /p openBrowser="是否要打开 Actions 页面? (y/n): "
    if /i "%openBrowser%"=="y" start %repoUrl%/actions
)

echo.
echo ✨ GitHub Actions 将自动构建 APK！
pause
