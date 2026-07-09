#!/bin/bash
# Initialize an Express.js REST API project
# Usage: ./express-setup.sh [project-name]

PROJECT_NAME=${1:-"express-api"}
PROJECT_DIR="/app/${PROJECT_NAME}"

echo "Creating Express.js API project: ${PROJECT_NAME}"

# Create project directory
mkdir -p "${PROJECT_DIR}"
cd "${PROJECT_DIR}" || exit 1

# Initialize npm project
npm init -y

# Install Express
npm install express cors

# Create directory structure
mkdir -p src/routes src/middleware src/controllers

# Create main app file
cat > src/index.js << 'EOF'
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Express API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Update package.json for ES modules
npm pkg set type="module"
npm pkg set "scripts.start"="node src/index.js"
npm pkg set "scripts.dev"="node --watch src/index.js"

echo "Express.js project ${PROJECT_NAME} created at ${PROJECT_DIR}"
echo "To run: cd ${PROJECT_DIR} && npm start"
echo "Server will be available on port 3000"