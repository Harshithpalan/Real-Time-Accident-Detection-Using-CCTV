@echo off
echo Starting Real-Time Accident Detection System...
echo.

echo Starting Backend Server...
start cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python main.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak

echo Starting Frontend Server...
start cmd /k "cd frontend && npm install && npm start"

echo.
echo System starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
