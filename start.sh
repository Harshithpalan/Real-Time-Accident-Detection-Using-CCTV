#!/bin/bash

echo "Starting Real-Time Accident Detection System..."
echo ""

echo "Starting Backend Server..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 5

echo "Starting Frontend Server..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

echo ""
echo "System starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to kill processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
