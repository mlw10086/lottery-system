@echo off
:: 设置UTF-8编码
chcp 65001 >nul 2>&1

:: 设置窗口标题
title 智能城市抽奖系统 - GitHub部署脚本

:: 防止闪退 - 设置错误时不退出
setlocal enabledelayedexpansion

echo ========================================
echo    智能城市抽奖系统 - GitHub部署脚本
echo ========================================
echo.
echo 正在初始化，请稍候...
timeout /t 2 /nobreak >nul

:: 检查Git是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未检测到Git，请先安装Git
    echo 下载地址：https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git已安装
echo.

:: 获取GitHub仓库地址
set /p REPO_URL="请输入您的GitHub仓库地址（例如：https://github.com/username/lottery-system.git）: "
if "%REPO_URL%"=="" (
    echo ❌ 错误：仓库地址不能为空
    pause
    exit /b 1
)

echo.
echo 🔄 开始部署到GitHub...
echo.

:: 初始化Git仓库（如果还没有）
if not exist ".git" (
    echo 📁 初始化Git仓库...
    git init
    echo ✅ Git仓库初始化完成
) else (
    echo 📁 Git仓库已存在
)

:: 创建.gitignore文件
echo 📝 创建.gitignore文件...
(
echo # 系统文件
echo .DS_Store
echo Thumbs.db
echo desktop.ini
echo.
echo # 编辑器文件
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo *~
echo.
echo # 日志文件
echo *.log
echo logs/
echo.
echo # 临时文件
echo tmp/
echo temp/
echo.
echo # 备份文件
echo *.bak
echo *.backup
echo.
echo # 缓存文件
echo cache/
echo.
echo # 敏感信息（如果有）
echo config/secret.php
echo .env
) > .gitignore
echo ✅ .gitignore文件创建完成

:: 添加所有文件到Git
echo 📦 添加文件到Git...
git add .
echo ✅ 文件添加完成

:: 提交更改
echo 💾 提交更改...
git commit -m "🎲 智能城市抽奖系统 - 完整版本

✨ 功能特性：
- 三轮抽奖机制（10→5→2→1）
- 管理员端和观众端双端同步
- 动态权重分池红包算法
- 周边城市推荐系统
- 实时动画效果和状态同步

🏗️ 技术栈：
- 前端：HTML5 + CSS3 + JavaScript (ES6+)
- 后端：PHP 8.0+
- 数据：JSON文件存储
- 设计：响应式布局，支持多设备

📊 数据完整性：
- 10个主要城市数据
- 50个周边城市推荐
- 完整的抽奖状态管理
- 详细的项目文档

🎯 用户体验：
- 现代化界面设计
- 流畅的动画效果
- 实时状态同步
- 完善的错误处理"

if errorlevel 1 (
    echo ❌ 提交失败，可能没有更改需要提交
) else (
    echo ✅ 提交完成
)

:: 添加远程仓库
echo 🔗 配置远程仓库...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
echo ✅ 远程仓库配置完成

:: 推送到GitHub
echo 🚀 推送到GitHub...
echo 正在推送，请稍候...
git push -u origin main
if errorlevel 1 (
    echo.
    echo ⚠️  推送失败，尝试使用master分支...
    git branch -M main
    git push -u origin main
    if errorlevel 1 (
        echo.
        echo ❌ 推送失败，可能的原因：
        echo 1. 网络连接问题
        echo 2. GitHub认证问题（需要配置SSH密钥或Personal Access Token）
        echo 3. 仓库权限问题
        echo.
        echo 💡 解决方案：
        echo 1. 检查网络连接
        echo 2. 配置GitHub认证：https://docs.github.com/zh/authentication
        echo 3. 确保仓库存在且有写入权限
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo ✅ 部署成功！
echo ========================================
echo.
echo 🎉 您的智能城市抽奖系统已成功推送到GitHub！
echo.
echo 📍 仓库地址：%REPO_URL%
echo.
echo 🌐 如果您启用了GitHub Pages，可以通过以下地址访问：
echo https://[您的用户名].github.io/[仓库名]/
echo.
echo 📋 后续步骤：
echo 1. 在GitHub仓库页面检查文件是否正确上传
echo 2. 如需启用GitHub Pages，请到仓库设置中配置
echo 3. 如需自定义域名，请添加CNAME文件
echo.
echo 💡 提示：
echo - 管理员端：index.html
echo - 观众端：viewer.html
echo - 管理员密码：admin123
echo.
echo 按任意键退出...
pause >nul
goto :eof

:error_exit
echo.
echo ❌ 脚本执行过程中出现错误
echo 请检查错误信息并重试
echo.
echo 按任意键退出...
pause >nul
exit /b 1
