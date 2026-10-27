@echo off
chcp 65001 >nul
echo ========================================================
echo    ICPC Regional Tracker - Push to GitHub Pages
echo ========================================================
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/username/icpc-tracker.git): "

if "%REPO_URL%"=="" (
    echo Error: Repository URL cannot be empty!
    pause
    exit /b
)

echo.
echo Adding remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo Renaming branch to main...
git branch -M main

echo Pushing code to GitHub...
git push -u origin main

echo.
echo ========================================================
echo Done! Now go to your GitHub Repo -> Settings -> Pages
echo and select 'GitHub Actions' as the Source.
echo Your website will be live in 1-2 minutes!
echo ========================================================
pause
