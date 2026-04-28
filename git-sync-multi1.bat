@echo off
echo Adding all files...
git add .

echo Committing changes...
git commit -m "Auto commit: %date% %time%"

echo Pulling latest changes...
git pull myfork3 master
git pull origin master

echo Pushing changes...
git push  myfork3 master
git push origin master

echo Git sync completed!
pause
