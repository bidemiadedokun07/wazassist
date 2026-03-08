#!/bin/bash

# WazAssist Development Server Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting WazAssist Development Servers..."
echo ""

# Check if PostgreSQL is running
if ! docker ps | grep -q wazassist-postgres-dev; then
    echo "📊 Starting PostgreSQL..."
    docker start wazassist-postgres-dev
    sleep 3
fi

# Start backend in background
echo "🔧 Starting Backend Server (Port 3000)..."
cd "$(dirname "$0")"
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend in a new terminal tab (macOS)
echo "🎨 Starting Frontend Server (Port 5173)..."
cd frontend

# Open new terminal tab and start frontend
osascript <<EOF
tell application "Terminal"
    activate
    tell application "System Events"
        keystroke "t" using {command down}
    end tell
    do script "cd '$PWD' && npm run dev" in front window
end tell
EOF

echo ""
echo "✅ Servers starting!"
echo ""
echo "📝 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   Health:   http://localhost:3000/health"
echo ""
echo "🔑 Test Login:"
echo "   Phone:    +2348099999998"
echo "   Password: Test@1234"
echo ""
echo "💡 To stop:"
echo "   - Close the frontend terminal tab"
echo "   - Run: kill $BACKEND_PID (for backend)"
echo ""
