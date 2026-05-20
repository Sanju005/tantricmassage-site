@echo off
cd /d "%~dp0"
start "Blog Publisher Server" "%SystemRoot%\System32\cmd.exe" /k "cd /d \"%~dp0\" && node \"%~dp0scripts\blog-publisher-server.js\""
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8790/"

