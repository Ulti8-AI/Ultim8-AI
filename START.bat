@echo off
title Ultim8 AI
echo.
echo ============================
echo        ULTIM8 AI
echo ============================
echo.
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
echo Starting Ultim8...
start "" http://localhost:3000
npm start
pause
