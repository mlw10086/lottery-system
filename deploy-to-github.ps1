# PowerShell脚本 - 智能城市抽奖系统GitHub部署
# 适用于Windows 10/11

# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 设置窗口标题
$Host.UI.RawUI.WindowTitle = "智能城市抽奖系统 - GitHub部署脚本"

# 颜色定义
function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

# 显示标题
Clear-Host
Write-ColorText "========================================" "Cyan"
Write-ColorText "   智能城市抽奖系统 - GitHub部署脚本" "Yellow"
Write-ColorText "========================================" "Cyan"
Write-Host ""

# 检查Git是否安装
Write-ColorText "🔍 检查Git安装状态..." "Yellow"
try {
    $gitVersion = git --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorText "✅ Git已安装: $gitVersion" "Green"
    } else {
        throw "Git未安装"
    }
} catch {
    Write-ColorText "❌ 错误：未检测到Git，请先安装Git" "Red"
    Write-ColorText "下载地址：https://git-scm.com/download/win" "Yellow"
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""

# 获取GitHub仓库地址
do {
    $repoUrl = Read-Host "请输入您的GitHub仓库地址（例如：https://github.com/username/lottery-system.git）"
    if ([string]::IsNullOrWhiteSpace($repoUrl)) {
        Write-ColorText "❌ 仓库地址不能为空，请重新输入" "Red"
    }
} while ([string]::IsNullOrWhiteSpace($repoUrl))

Write-Host ""
Write-ColorText "🔄 开始部署到GitHub..." "Cyan"
Write-Host ""

try {
    # 初始化Git仓库（如果还没有）
    if (-not (Test-Path ".git")) {
        Write-ColorText "📁 初始化Git仓库..." "Yellow"
        git init
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ Git仓库初始化完成" "Green"
        } else {
            throw "Git仓库初始化失败"
        }
    } else {
        Write-ColorText "📁 Git仓库已存在" "Yellow"
    }

    # 创建.gitignore文件
    Write-ColorText "📝 创建.gitignore文件..." "Yellow"
    $gitignoreContent = @"
# 系统文件
.DS_Store
Thumbs.db
desktop.ini

# 编辑器文件
.vscode/
.idea/
*.swp
*.swo
*~

# 日志文件
*.log
logs/

# 临时文件
tmp/
temp/

# 备份文件
*.bak
*.backup

# 缓存文件
cache/

# 敏感信息（如果有）
config/secret.php
.env
"@
    
    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-ColorText "✅ .gitignore文件创建完成" "Green"

    # 添加所有文件到Git
    Write-ColorText "📦 添加文件到Git..." "Yellow"
    git add .
    if ($LASTEXITCODE -eq 0) {
        Write-ColorText "✅ 文件添加完成" "Green"
    } else {
        throw "文件添加失败"
    }

    # 提交更改
    Write-ColorText "💾 提交更改..." "Yellow"
    $commitMessage = @"
🎲 智能城市抽奖系统 - 完整版本

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
- 完善的错误处理
"@

    git commit -m $commitMessage
    if ($LASTEXITCODE -eq 0) {
        Write-ColorText "✅ 提交完成" "Green"
    } else {
        Write-ColorText "⚠️  没有更改需要提交" "Yellow"
    }

    # 添加远程仓库
    Write-ColorText "🔗 配置远程仓库..." "Yellow"
    git remote remove origin 2>$null
    git remote add origin $repoUrl
    Write-ColorText "✅ 远程仓库配置完成" "Green"

    # 推送到GitHub
    Write-ColorText "🚀 推送到GitHub..." "Yellow"
    Write-ColorText "正在推送，请稍候..." "Cyan"
    
    git push -u origin main
    if ($LASTEXITCODE -ne 0) {
        Write-ColorText "⚠️  推送失败，尝试使用master分支..." "Yellow"
        git branch -M main
        git push -u origin main
        if ($LASTEXITCODE -ne 0) {
            throw "推送失败"
        }
    }

    # 成功信息
    Write-Host ""
    Write-ColorText "========================================" "Green"
    Write-ColorText "✅ 部署成功！" "Green"
    Write-ColorText "========================================" "Green"
    Write-Host ""
    Write-ColorText "🎉 您的智能城市抽奖系统已成功推送到GitHub！" "Green"
    Write-Host ""
    Write-ColorText "📍 仓库地址：$repoUrl" "Yellow"
    Write-Host ""
    Write-ColorText "🌐 如果您启用了GitHub Pages，可以通过以下地址访问：" "Cyan"
    Write-ColorText "https://[您的用户名].github.io/[仓库名]/" "White"
    Write-Host ""
    Write-ColorText "📋 后续步骤：" "Yellow"
    Write-ColorText "1. 在GitHub仓库页面检查文件是否正确上传" "White"
    Write-ColorText "2. 如需启用GitHub Pages，请到仓库设置中配置" "White"
    Write-ColorText "3. 如需自定义域名，请添加CNAME文件" "White"
    Write-Host ""
    Write-ColorText "💡 提示：" "Cyan"
    Write-ColorText "- 管理员端：index.html" "White"
    Write-ColorText "- 观众端：viewer.html" "White"
    Write-ColorText "- 管理员密码：admin123" "White"

} catch {
    Write-Host ""
    Write-ColorText "❌ 部署失败：$($_.Exception.Message)" "Red"
    Write-Host ""
    Write-ColorText "可能的原因：" "Yellow"
    Write-ColorText "1. 网络连接问题" "White"
    Write-ColorText "2. GitHub认证问题（需要配置SSH密钥或Personal Access Token）" "White"
    Write-ColorText "3. 仓库权限问题" "White"
    Write-Host ""
    Write-ColorText "💡 解决方案：" "Cyan"
    Write-ColorText "1. 检查网络连接" "White"
    Write-ColorText "2. 配置GitHub认证：https://docs.github.com/zh/authentication" "White"
    Write-ColorText "3. 确保仓库存在且有写入权限" "White"
}

Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
