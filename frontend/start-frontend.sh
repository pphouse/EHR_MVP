#!/bin/bash

echo "Starting EHR MVP Frontend..."

# Navigate to frontend directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file with default values..."
    cat > .env << EOF
DANGEROUSLY_DISABLE_HOST_CHECK=true
SKIP_PREFLIGHT_CHECK=true
REACT_APP_API_URL=http://localhost:8000/api/v1
EOF
fi

# Start the frontend server
echo "Starting frontend server on http://localhost:3000"
echo "Press Ctrl+C to stop the server"
npm start