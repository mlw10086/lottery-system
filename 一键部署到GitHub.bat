@echo off
title GitHub Deploy Tool
color 0A

echo ========================================
echo      GitHub Deploy Tool
echo ========================================
echo.

:: Check Git installation
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git not found, please install Git first
    echo Download: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo Git is installed
echo.

:: Get GitHub repository URL
set /p REPO_URL="Enter GitHub repository URL: "
if "%REPO_URL%"=="" (
    echo Error: Repository URL cannot be empty
    pause
    exit /b 1
)

echo.
echo Starting deployment...
echo.

:: Initialize Git repository
if not exist ".git" (
    echo Initializing Git repository...
    git init
    echo Git repository initialized
) else (
    echo Git repository already exists
)

:: Create .gitignore file
echo Creating .gitignore file...
(
echo # System files
echo .DS_Store
echo Thumbs.db
echo desktop.ini
echo.
echo # Editor files
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo *~
echo.
echo # Log files
echo *.log
echo logs/
echo.
echo # Temp files
echo tmp/
echo temp/
echo.
echo # Backup files
echo *.bak
echo *.backup
echo.
echo # Cache files
echo cache/
) > .gitignore
echo .gitignore file created

:: Add files
echo Adding files to Git...
git add .
echo Files added

:: Commit
echo Committing changes...
git commit -m "Smart City Lottery System - Complete Version"
echo Commit completed

:: Configure remote repository
echo Configuring remote repository...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
echo Remote repository configured

:: Push
echo Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo Push failed, trying master branch...
    git branch -M main
    git push -u origin main
    if errorlevel 1 (
        echo.
        echo Push failed, possible reasons:
        echo 1. Network connection issues
        echo 2. GitHub authentication issues
        echo 3. Repository permission issues
        echo.
        echo Solutions:
        echo 1. Check network connection
        echo 2. Configure GitHub authentication
        echo 3. Ensure repository exists and has write permission
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Deployment Successful!
echo ========================================
echo.
echo Your Smart City Lottery System has been pushed to GitHub!
echo.
echo Repository URL: %REPO_URL%
echo.
echo If GitHub Pages is enabled, access URL:
echo https://[username].github.io/[repository-name]/
echo.
echo Next steps:
echo 1. Check GitHub repository page
echo 2. Enable GitHub Pages (if needed)
echo 3. Test online access
echo.
echo Access methods:
echo - Admin: index.html
echo - Viewer: viewer.html
echo - Admin password: admin123
echo.
pause
