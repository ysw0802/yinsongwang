@echo off
cd /d "%~dp0"
echo ==========================================
echo   更新 index.html 的网页目录链接
echo ==========================================
echo.
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 没有找到 Node.js，请先安装 Node.js。
    echo.
    pause
    exit /b 1
)
node "%~dp0update-index.js"
echo.
echo 完成！接下来把本文件夹重新上传到 Netlify 即可。
pause
