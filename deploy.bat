@echo off
title GitHub Deploy
color 0A

echo ========================================
echo      Smart City Lottery Deploy
echo ========================================
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
echo Deploying...
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
git commit -m "Smart City Lottery System"
echo Done

echo Config remote...
git remote remove origin >nul 2>&1
git remote add origin %REPO%
echo Done

echo Push to GitHub...
git push -u origin main
if errorlevel 1 (
    echo Try master branch...
    git branch -M main
    git push -u origin main
    if errorlevel 1 (
        echo.
        echo Push failed! Check:
        echo 1. Network connection
        echo 2. GitHub authentication
        echo 3. Repository permissions
        pause
        exit /b 1
    )
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
pause
