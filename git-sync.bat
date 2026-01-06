@echo off
echo Adding all files...
git add .

echo Committing changes...
git commit -m "Auto commit: %date% %time%"

echo Pulling latest changes...
git pull

echo Pushing changes...
git push

echo Git sync completed!
pause