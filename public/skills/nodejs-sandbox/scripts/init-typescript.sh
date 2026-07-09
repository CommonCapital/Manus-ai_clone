#!/bin/bash
# Initialize a TypeScript Node.js project in the sandbox
# Usage: ./init-typescript.sh [project-name]

PROJECT_NAME=${1:-"nodejs-ts-app"}
PROJECT_DIR="/app/${PROJECT_NAME}"

echo "Creating TypeScript project: ${PROJECT_NAME}"

# Create project directory
mkdir -p "${PROJECT_DIR}"
cd "${PROJECT_DIR}" || exit 1

# Initialize npm project
npm init -y

# Install TypeScript and types
npm install typescript @types/node ts-node --save-dev

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF

# Create source directory
mkdir -p src

# Create index.ts
cat > src/index.ts << 'EOF'
const message: string = 'Hello from TypeScript on Node.js 22!';
console.log(message);
console.log(`Node version: ${process.version}`);

// Add your code here
EOF

echo "TypeScript project ${PROJECT_NAME} created at ${PROJECT_DIR}"
echo "To run: cd ${PROJECT_DIR} && npx ts-node src/index.ts"
echo "To compile: cd ${PROJECT_DIR} && npx tsc"