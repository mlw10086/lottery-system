@echo off
title GitHub Deploy Launcher
chcp 936 >nul 2>&1

echo ========================================
echo      GitHub Deploy Launcher
echo ========================================
echo.
echo Please select deployment method:
echo.
echo [1] PowerShell Version (Recommended for Win10/11)
echo [2] Batch Version (Traditional)
echo [3] Manual Git Commands (Advanced)
echo [4] View Instructions
echo [0] Exit
echo.
set /p choice="Please enter your choice (0-4): "

if "%choice%"=="1" goto powershell
if "%choice%"=="2" goto batch
if "%choice%"=="3" goto manual
if "%choice%"=="4" goto help
if "%choice%"=="0" goto exit
goto invalid

:powershell
echo.
echo Starting PowerShell version...
echo If execution policy error occurs, please select [Y] to allow
echo.
timeout /t 3 >nul
powershell -ExecutionPolicy Bypass -File "deploy-to-github.ps1"
goto end

:batch
echo.
echo Starting batch version...
timeout /t 2 >nul
call "deploy-to-github.bat"
goto end

:manual
echo.
echo ========================================
echo          Manual Git Commands
echo ========================================
echo.
echo Please execute the following commands in order:
echo.
echo 1. git init
echo 2. git add .
echo 3. git commit -m "Initial commit"
echo 4. git remote add origin [Your repository URL]
echo 5. git push -u origin main
echo.
echo Note: Replace [Your repository URL] with actual GitHub repository URL
echo.
goto end

:help
echo.
echo ========================================
echo          Deployment Instructions
echo ========================================
echo.
echo Before deployment:
echo 1. Create a new repository on GitHub
echo 2. Copy repository URL (e.g.: https://github.com/username/repo.git)
echo 3. Ensure Git is installed
echo.
echo Recommended PowerShell version features:
echo - Better error handling
echo - Colored output display
echo - Windows 11 compatibility
echo.
echo If PowerShell version cannot run, try:
echo 1. Run as administrator
echo 2. Or use batch version
echo 3. Or execute Git commands manually
echo.
goto menu

:invalid
echo.
echo Invalid choice, please try again
timeout /t 2 >nul
goto menu

:menu
echo.
echo Press any key to return to main menu...
pause >nul
cls
goto start

:start
echo ========================================
echo      GitHub Deploy Launcher
echo ========================================
echo.
echo Please select deployment method:
echo.
echo [1] PowerShell Version (Recommended for Win10/11)
echo [2] Batch Version (Traditional)
echo [3] Manual Git Commands (Advanced)
echo [4] View Instructions
echo [0] Exit
echo.
set /p choice="Please enter your choice (0-4): "

if "%choice%"=="1" goto powershell
if "%choice%"=="2" goto batch
if "%choice%"=="3" goto manual
if "%choice%"=="4" goto help
if "%choice%"=="0" goto exit
goto invalid

:end
echo.
echo Press any key to exit...
pause >nul

:exit
exit
