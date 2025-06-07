@echo off
echo ========================================
echo     透明城市抽奖系统启动脚本
echo ========================================
echo.

REM 检查PHP是否安装
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到PHP，请先安装PHP
    echo 下载地址：https://www.php.net/downloads
    pause
    exit /b 1
)

echo PHP环境检查通过
echo.

REM 检查必要文件
if not exist "index.html" (
    echo 错误：未找到index.html文件
    pause
    exit /b 1
)

if not exist "php\lottery_api.php" (
    echo 错误：未找到PHP API文件
    pause
    exit /b 1
)

echo 文件检查通过
echo.

REM 创建data目录（如果不存在）
if not exist "data" mkdir data

echo 正在启动PHP内置服务器...
echo 服务器地址：http://localhost:8000
echo.
echo 使用说明：
echo 1. 管理员密码：admin123
echo 2. 按Ctrl+C停止服务器
echo 3. 浏览器访问：http://localhost:8000
echo.
echo ========================================

REM 启动PHP内置服务器
php -S localhost:8000

pause
