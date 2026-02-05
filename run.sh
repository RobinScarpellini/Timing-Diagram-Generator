#!/bin/bash

# Configuration
APP_DIR=$(dirname "$0")
cd "$APP_DIR" || exit

echo "--- Timing Diagram Generator Runner ---"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed."
fi

# Run the development server
echo "Starting development server..."
npm run dev
