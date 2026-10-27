@echo off
title ICPC Regional Hub Server & Database
echo ========================================================
echo Starting ICPC Regional Hub with SQLite on http://localhost:3300 ...
echo ========================================================
start "" "http://localhost:3300"
python server.py
pause
