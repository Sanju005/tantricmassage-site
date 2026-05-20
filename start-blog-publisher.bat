@echo off
cd /d "%~dp0"
start "Blog Publisher Server" cmd /k "cd /d %~dp0 && node scripts\blog-publisher-server.js"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8787
