@echo off
setlocal
cd /d "%~dp0"

echo Starting upgraded Blog Publisher...
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found in PATH.
  echo Install Node.js or add it to PATH, then run this file again.
  echo.
  pause
  exit /b 1
)

start "" cmd /k "cd /d "%~dp0" && node scripts\blog-publisher-server.js"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8790/"

echo.
echo Blog Publisher opened at http://127.0.0.1:8790/
echo A separate server window was started and will stay running.
echo Close that server window when you are done.
echo.
pause
