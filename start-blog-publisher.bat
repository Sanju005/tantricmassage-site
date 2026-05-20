@echo off
setlocal
cd /d "%~dp0"
echo Starting Blog Publisher...
start "" "http://127.0.0.1:8790/"
"C:\Program Files\nodejs\node.exe" "scripts\blog-publisher-server.js"
echo.
echo The server stopped. Press any key to close this window.
pause >nul
