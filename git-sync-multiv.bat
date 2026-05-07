@echo off
cd /d D:\busd

echo Adding all files...
git add .

echo Committing changes...
git commit -m "Auto commit: %date% %time%"

if %errorlevel% neq 0 (
    echo No changes to commit, skipping push.
    exit /b 0
)

echo Pushing to Gitee...
git push myfork3 master

echo Pushing to GitHub (with proxy)...
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin master

echo Git sync completed!
pause