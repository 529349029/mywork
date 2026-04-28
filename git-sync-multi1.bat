@echo off
echo Adding all files...
git add .

echo Committing changes...
git commit -m "Auto commit: %date% %time%"

echo Pulling latest changes...
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 git pull myfork3 master
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 git pull origin master

echo Pushing changes...
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 git push  myfork3 master
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 git push origin master

echo Git sync completed!
pause
