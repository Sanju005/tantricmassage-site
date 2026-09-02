@echo off
setlocal
cd /d "%~dp0"

echo Starting SEO-safe Manual Blog Publisher...
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found in PATH.
  echo Install Node.js or add it to PATH, then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "scripts\blog-publisher-server.js" (
  echo.
  echo Blog publisher server file was not found.
  echo Run this file from the tantric-site folder.
  echo.
  pause
  exit /b 1
)

start "" "%ComSpec%" /k "cd /d ""%~dp0"" && node ""scripts\blog-publisher-server.js"""
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8790/"

echo.
echo SEO-safe Blog Publisher opened at http://127.0.0.1:8790/
echo It will create the article, update direct internal links, and update the sitemap.
echo A separate server window was started and will stay running.
echo Close that server window when you are done.
echo.
pause
