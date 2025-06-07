@echo off
title Fix and Deploy to GitHub
color 0A

echo ========================================
echo      Fix and Deploy to GitHub
echo ========================================
echo.
echo This script will handle existing remote content
echo and deploy your lottery system to GitHub.
echo.

git --version >nul 2>&1
if errorlevel 1 (
    echo Git not found! Please install Git first.
    echo Download: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo Git OK
echo.

set /p REPO="Enter GitHub repo URL: "
if "%REPO%"=="" (
    echo URL cannot be empty!
    pause
    exit /b 1
)

echo.
echo Fixing and deploying...
echo.

if not exist ".git" (
    echo Init Git...
    git init
    echo Done
) else (
    echo Git exists
)

echo Create .gitignore...
(
echo .DS_Store
echo Thumbs.db
echo .vscode/
echo .idea/
echo *.log
echo tmp/
echo cache/
) > .gitignore
echo Done

echo Add files...
git add .
echo Done

echo Commit...
git commit -m "Smart City Lottery System - Complete Version"
echo Done

echo Config remote...
git remote remove origin >nul 2>&1
git remote add origin %REPO%
echo Done

echo Fetch remote content...
git fetch origin
echo Done

echo Try to merge with remote...
git pull origin main --allow-unrelated-histories
if errorlevel 1 (
    echo Merge failed, trying force push...
    echo WARNING: This will overwrite remote content!
    set /p CONFIRM="Continue with force push? (y/N): "
    if /i "%CONFIRM%"=="y" (
        git push -u origin main --force
        if errorlevel 1 (
            echo Force push failed!
            goto error
        )
        echo Force push successful!
    ) else (
        echo Cancelled by user
        goto error
    )
) else (
    echo Merge successful, pushing...
    git push -u origin main
    if errorlevel 1 (
        echo Push after merge failed!
        goto error
    )
    echo Push successful!
)

echo.
echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Repository: %REPO%
echo.
echo GitHub Pages URL:
echo https://[username].github.io/[repo-name]/
echo.
echo Files:
echo - Admin: index.html
echo - Viewer: viewer.html
echo - Password: admin123
echo.
echo Next steps:
echo 1. Check your GitHub repository
echo 2. Enable GitHub Pages in repository settings
echo 3. Test the online version
echo.
pause
goto end

:error
echo.
echo ========================================
echo DEPLOYMENT FAILED
echo ========================================
echo.
echo Manual steps to fix:
echo.
echo 1. Check if repository exists and you have access
echo 2. Try these commands manually:
echo    git pull origin main --allow-unrelated-histories
echo    git push -u origin main
echo.
echo 3. Or create a new empty repository and try again
echo.
pause

:end
