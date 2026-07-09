#!/bin/bash
# Initialize a basic Node.js project in the sandbox
# Usage: ./init-project.sh [project-name]

PROJECT_NAME=${1:-"nodejs-app"}
PROJECT_DIR="/app/${PROJECT_NAME}"

echo "Creating Node.js project: ${PROJECT_NAME}"

# Create project directory
mkdir -p "${PROJECT_DIR}"
cd "${PROJECT_DIR}" || exit 1

# Initialize npm project
npm init -y

# Create basic structure
mkdir -p src

# Create index.js
cat > src/index.js << 'EOF'
console.log('Hello from Node.js 22!');
console.log(`Node version: ${process.version}`);

// Add your code here
EOF

echo "Project ${PROJECT_NAME} created at ${PROJECT_DIR}"
echo "To run: cd ${PROJECT_DIR} && node src/index.js"