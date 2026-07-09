// Basic TypeScript Application Template
// Node.js 22 - ES Modules

interface AppConfig {
  name: string;
  version: string;
  port: number;
}

const config: AppConfig = {
  name: 'nodejs-typescript-app',
  version: '1.0.0',
  port: 3000
};

console.log(`Hello from ${config.name}!`);
console.log(`Node version: ${process.version}`);
console.log(`TypeScript compiled successfully!`);

// Example: Express server (uncomment and install express + @types/express)
// import express, { Request, Response } from 'express';
// 
// const app = express();
// 
// app.get('/', (req: Request, res: Response) => {
//   res.json({ message: 'Hello from TypeScript!' });
// });
// 
// app.listen(config.port, () => {
//   console.log(`Server running on port ${config.port}`);
// });

export default config;