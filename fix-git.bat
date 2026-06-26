@echo off
chcp 65001 >nul
echo ==========================================
echo  修复 Git 冲突 + 一键整理项目
echo ==========================================
echo.

set PROJECT=C:\Users\Administrator\WallpaperProject
set APP=C:\Users\Administrator\WallpaperProject\WallpaperApp

cd /d %PROJECT%

if exist "%APP%\.git" (
    echo [1/5] 删除 WallpaperApp 内嵌的 .git ...
    rmdir /s /q "%APP%\.git"
    if exist "%APP%\.git" (
        echo ❌ 删除失败，请手动右键删除文件夹：%APP%\.git
        pause
        exit /b 1
    )
    echo ✅ 已清理
) else (
    echo [1/5] 没有内嵌 .git，跳过清理
)

echo.
echo [2/5] 初始化 WallpaperProject 仓库 ...
git init

echo.
echo [3/5] 添加所有文件 ...
git add .

echo.
echo [4/5] 提交代码 ...
git commit -m "init wallpaper api and app"

echo.
echo ==========================================
echo  本地仓库已就绪！
echo ==========================================
echo.
echo 接下来要做 3 步：
echo   ① 打开浏览器：https://github.com/new
echo   ② Repository name 填：wallpaper-api
echo   ③ 点 Create repository（不要勾选任何勾）
echo.
echo 创建完成后，复制这两行命令到控制台执行：
echo.
echo    git remote add origin https://github.com/你的用户名/wallpaper-api.git
echo    git push -u origin main
echo.
pause
