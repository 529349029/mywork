@echo off
:: 设置编码为 UTF-8，防止中文乱码
chcp 65001 >nul

echo.
echo ==========================================
echo      Windows 一键 Git 提交脚本
echo ==========================================
echo.
git config --global --unset http.proxy
git config --global --unset https.proxy
:: 1. 检查是否有更改
git status --porcelain | findstr /r "." >nul
if errorlevel 1 (
    echo [OK] 工作区是干净的，没有需要提交的更改。
    pause
    exit /b
)

:: 2. 提示输入提交信息
set /p commit_msg="请输入提交信息: "

:: 如果用户直接回车，给一个默认值
if "%commit_msg%"=="" set "commit_msg=自动更新"

:: 3. 执行 Git 操作
echo.
echo [1/3] 正在添加所有文件...
git add .

echo [2/3] 正在提交: %commit_msg%
git commit -m "%commit_msg%"

echo [3/3] 正在推送到远程仓库...
:: 注意：这里默认是 origin master，如果你的主分支是 main，请自行修改
echo Pushing to Gitee...
git push myfork3 master
echo Pushing to GitHub (with proxy)...
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin master
echo.
echo ==========================================
echo      提交成功！
echo ==========================================
echo.
pause