#!/bin/bash
# ========================================
# Helper Script for Running Automation Scripts
# ========================================
# Usage: ./run-script.sh scripts/your-script.js
# ========================================

set -e

SCRIPT_PATH="${1:-scripts/example-scrape.js}"

echo "🚀 Running script: $SCRIPT_PATH"
echo "================================"

# Run the script using Docker Compose
docker compose run --rm nodejs-chromium node "/app/$SCRIPT_PATH"

echo "================================"
echo "✅ Script execution completed!"