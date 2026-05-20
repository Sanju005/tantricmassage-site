@echo off
cd /d "%~dp0"
echo Starting Blog Publisher...
start "" "%SystemRoot%\System32\cmd.exe" /c "timeout /t 3 /nobreak >nul && start \"\" \"http://127.0.0.1:8790/\""
"C:\Program Files\nodejs\node.exe" "%~dp0scripts\blog-publisher-server.js"
echo.
echo If you see this line, the server stopped.
pause

