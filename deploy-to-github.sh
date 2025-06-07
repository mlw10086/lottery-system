#!/bin/bash

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "   智能城市抽奖系统 - GitHub部署脚本"
echo "========================================"
echo

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ 错误：未检测到Git，请先安装Git${NC}"
    echo "安装命令："
    echo "  Ubuntu/Debian: sudo apt-get install git"
    echo "  CentOS/RHEL: sudo yum install git"
    echo "  macOS: brew install git"
    exit 1
fi

echo -e "${GREEN}✅ Git已安装${NC}"
echo

# 获取GitHub仓库地址
read -p "请输入您的GitHub仓库地址（例如：https://github.com/username/lottery-system.git）: " REPO_URL
if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ 错误：仓库地址不能为空${NC}"
    exit 1
fi

echo
echo -e "${BLUE}🔄 开始部署到GitHub...${NC}"
echo

# 初始化Git仓库（如果还没有）
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📁 初始化Git仓库...${NC}"
    git init
    echo -e "${GREEN}✅ Git仓库初始化完成${NC}"
else
    echo -e "${YELLOW}📁 Git仓库已存在${NC}"
fi

# 创建.gitignore文件
echo -e "${YELLOW}📝 创建.gitignore文件...${NC}"
cat > .gitignore << 'EOF'
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
EOF
echo -e "${GREEN}✅ .gitignore文件创建完成${NC}"

# 添加所有文件到Git
echo -e "${YELLOW}📦 添加文件到Git...${NC}"
git add .
echo -e "${GREEN}✅ 文件添加完成${NC}"

# 提交更改
echo -e "${YELLOW}💾 提交更改...${NC}"
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

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 提交完成${NC}"
else
    echo -e "${YELLOW}⚠️  没有更改需要提交${NC}"
fi

# 添加远程仓库
echo -e "${YELLOW}🔗 配置远程仓库...${NC}"
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"
echo -e "${GREEN}✅ 远程仓库配置完成${NC}"

# 推送到GitHub
echo -e "${YELLOW}🚀 推送到GitHub...${NC}"
echo "正在推送，请稍候..."
git push -u origin main
if [ $? -ne 0 ]; then
    echo
    echo -e "${YELLOW}⚠️  推送失败，尝试使用master分支...${NC}"
    git branch -M main
    git push -u origin main
    if [ $? -ne 0 ]; then
        echo
        echo -e "${RED}❌ 推送失败，可能的原因：${NC}"
        echo "1. 网络连接问题"
        echo "2. GitHub认证问题（需要配置SSH密钥或Personal Access Token）"
        echo "3. 仓库权限问题"
        echo
        echo -e "${BLUE}💡 解决方案：${NC}"
        echo "1. 检查网络连接"
        echo "2. 配置GitHub认证：https://docs.github.com/zh/authentication"
        echo "3. 确保仓库存在且有写入权限"
        echo
        exit 1
    fi
fi

echo
echo "========================================"
echo -e "${GREEN}✅ 部署成功！${NC}"
echo "========================================"
echo
echo -e "${BLUE}🎉 您的智能城市抽奖系统已成功推送到GitHub！${NC}"
echo
echo -e "${YELLOW}📍 仓库地址：${NC}$REPO_URL"
echo
echo -e "${BLUE}🌐 如果您启用了GitHub Pages，可以通过以下地址访问：${NC}"
echo "https://[您的用户名].github.io/[仓库名]/"
echo
echo -e "${YELLOW}📋 后续步骤：${NC}"
echo "1. 在GitHub仓库页面检查文件是否正确上传"
echo "2. 如需启用GitHub Pages，请到仓库设置中配置"
echo "3. 如需自定义域名，请添加CNAME文件"
echo
echo -e "${BLUE}💡 提示：${NC}"
echo "- 管理员端：index.html"
echo "- 观众端：viewer.html"
echo "- 管理员密码：admin123"
echo
