// Basic Node.js Application Template
// Node.js 22 - ES Modules

console.log('Hello from Node.js 22!');
console.log(`Node version: ${process.version}`);
console.log(`Platform: ${process.platform}`);

// Example: Simple HTTP server (uncomment to use)
// import { createServer } from 'http';
// 
// const server = createServer((req, res) => {
//   res.writeHead(200, { 'Content-Type': 'application/json' });
//   res.end(JSON.stringify({ message: 'Hello from Node.js 22!' }));
// });
// 
// server.listen(3000, () => {
//   console.log('Server running on port 3000');
// });