#!/bin/bash

echo "========================================"
echo "     透明城市抽奖系统启动脚本"
echo "========================================"
echo

# 检查PHP是否安装
if ! command -v php &> /dev/null; then
    echo "错误：未找到PHP，请先安装PHP"
    echo "Ubuntu/Debian: sudo apt install php"
    echo "CentOS/RHEL: sudo yum install php"
    echo "macOS: brew install php"
    exit 1
fi

echo "PHP环境检查通过"
echo

# 检查必要文件
if [ ! -f "index.html" ]; then
    echo "错误：未找到index.html文件"
    exit 1
fi

if [ ! -f "php/lottery_api.php" ]; then
    echo "错误：未找到PHP API文件"
    exit 1
fi

echo "文件检查通过"
echo

# 创建data目录（如果不存在）
mkdir -p data

echo "正在启动PHP内置服务器..."
echo "服务器地址：http://localhost:8000"
echo
echo "使用说明："
echo "1. 管理员密码：admin123"
echo "2. 按Ctrl+C停止服务器"
echo "3. 浏览器访问：http://localhost:8000"
echo
echo "========================================"

# 启动PHP内置服务器
php -S localhost:8000
