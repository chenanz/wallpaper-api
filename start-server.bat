@echo off
chcp 65001 >nul
echo ==========================================
echo   Wallpaper API 本地测试服务器
echo ==========================================
echo.
cd /d "%~dp0crawler"

echo [1/3] 检查依赖...
python -c "import flask, requests" 2>nul
if errorlevel 1 (
    echo 安装依赖中...
    pip install flask requests -q
)

echo [2/3] 启动后端服务...
echo.
echo 服务地址: http://你的电脑IP:3000/wallpapers
echo.
echo 查看电脑IP方法:
echo   1. 右键点右下角WiFi图标 -> 属性
 echo   2. 或按 Win+R 输入 cmd，执行: ipconfig
echo.
echo 测试链接 (浏览器打开):
echo   http://localhost:3000/wallpapers?category=原神&page=1
echo   http://localhost:3000/wallpapers?category=原神&character=雷电将军&page=1
echo.
echo 按 Ctrl+C 停止服务
echo ==========================================
python server.py
pause
