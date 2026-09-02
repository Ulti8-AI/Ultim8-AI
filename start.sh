#!/bin/sh
echo ""
echo "============================"
echo "        ULTIM8 AI"
echo "============================"
echo ""
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi
echo "Starting Ultim8..."
if command -v xdg-open >/dev/null 2>&1; then
  (sleep 2; xdg-open http://localhost:3000 >/dev/null 2>&1) &
fi
npm start
