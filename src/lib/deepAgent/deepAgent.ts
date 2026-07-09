
import fs from "node:fs";
import path from "node:path";

import { tool, createAgent, createMiddleware } from "langchain";
import { ChatCerebras } from "@langchain/cerebras";
import {
  // BaseMessage,
  SystemMessage,
  ToolMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { think_tool } from "./thinkTool";
import { createTaskTool } from "./taskTool";
import { todoListTools } from "./todoTools";
import { BASE_PROMPT, basePrompt, SKILL_PROMPT, TASK_SYSTEM_PROMPT } from "./prompts";
import { filesystemTools } from "./fsTools";
import { toolMonitoringMiddleware, ToolOutputSummarizerMiddleware } from "./middleware";
import { summarizationMiddleware } from "langchain";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { LLM } from "../llm/LLM";
import { SendImageToAgentComputer } from "./SendImageToAgentComputer";
import { searchTool, webScrapperTool } from "./searchTool";
import { fixThinkingTags } from "../helper/fixThinkingTags";
import { execute_code } from "./sandboxTool";
import { buildFilesystemTools } from "../memo/tools/fileSystemTools";



// npx playwright install chromium
// npm i @playwright/mcp
// npm install @playwright/test@latest

// const client = new MultiServerMCPClient({
//   mcpServers: {
//     "opensandbox": {
//       transport: "http",
//       url: "http://127.0.0.1:8000/mcp"  // MCP HTTP endpoint
//     }
//   }

// })

// const mcpTools = await client.getTools();



const model = LLM.getInstance("cerebras")


const subagentConfigs = {
  tools: [...filesystemTools,
  // ...mcpTools,
    // SendImageToAgentComputer,
    searchTool,
    webScrapperTool
  ]
}
export async function testDeepAgent(userInput: string, config: any) {

  // For the Main Manager Agent


const agent = createAgent({
    model: model,
    systemPrompt: `
    <system>
${basePrompt}
\n\n
${TASK_SYSTEM_PROMPT}
    </system>
    `,
    tools: [...filesystemTools, ...todoListTools, execute_code, think_tool, createTaskTool(model, subagentConfigs)] as any,
    middleware: [
        summarizationMiddleware({
            model: new ChatCerebras({
                model: "gpt-oss-120b",
                temperature: 0.7,
                apiKey: process.env.CEREBRAS_API_KEY,
            }),
            trigger: [
                {tokens: 8000, messages: 15},
                {tokens: 10000}
            ],
            keep: {messages: 20}
        }),
        ToolOutputSummarizerMiddleware
    ] as any
} as any) as any;

  const agentStream = await agent.stream(
    {
      messages: [


        new HumanMessage(`

          
      Before Start working on any Task : I Want you to follow these steps  :

          <user_instructions>
   step 1.First Identify the right Skill to use in skill folder and and follow all skill instructions step by step.
         You should read every folders or file for specific skill you want to use.

         OBLIGATIONS
         - Do not Ingore skill instructions instead you should execute them step by step.
            eg: If user ask you about extracting data from pdf you should read the pdf skill.md
               THEN start working user Task based on the pdf skill.md instructions
         - you must Executed step by steps all skill instructions based the ongoing Task.
         - analyse the skill.md carefull take into account every details

         If you dont identify the right skill to use just take control of that
        step 2. Before creating a TodoList identify if a Task if complex or needs multi-step   
        step 3. Breaking down a Task by Creating a TodoList 
        step 4. you must update the todo List when a Task is completed
            Rules :
            step 1: use ls to list to file name
            step 2: read it, identify the task to update
   step 5. you should not work alone it better to spawn subAgent to be efficient for complex inputs
   step 6. This is about Research, When researcher subAgent or SubAgent finish, DO NOT read the research files immediately. First update the todoList.
   Only read Research files during the synthesis phase.
   step7. About sandbox once you or subagents finished working should export files to sandbox-files folder.
   userInput:${userInput}
   
   </user_instructions>
          `),

//           new HumanMessage(`

//             1. Create a new sandbox using the Docker image 'python:3.11'.",
// "2. Inside the sandbox, create a directory '/app' to hold the website files.",
// "3. Create a 'static' folder inside '/app' for CSS and assets.",
// "4. Create only one HTML file inside '/app':\n" +
// " - 'index.html': contains a modern header, a single button labeled 'Click Me', and links to the CSS file using a relative path (href='static/style.css').",
// "5. Create a CSS file '/app/static/style.css' that styles the button with colors, hover effects, padding, and a modern font. Make sure the CSS works when accessed via the sandbox proxy.",
// "6. Inside the sandbox, create '/app/server.py' with the following code to serve the website:\n" +
// " from http.server import HTTPServer, SimpleHTTPRequestHandler\n" +
// " import os\n" +
// " os.chdir('/app') # serve files from the /app directory\n" +
// " HOST = '0.0.0.0'\n" +
// " PORT = 8000\n" +
// " httpd = HTTPServer((HOST, PORT), SimpleHTTPRequestHandler)\n" +
// " print(f'Serving static website on {HOST}:{PORT}')\n" +
// " httpd.serve_forever()",
// "7. Run 'server.py' in detached/background mode so the server keeps running.",
// "8. Expose port 8000 and return the publicly reachable endpoint URL.",
// "9. Output the sandbox ID and the endpoint URL."
            
//             `),
//             new AIMessage(`I'll follow your instructions step by step. Let me start by identifying the right skill to use.
// Step 1: Identify the Right Skill
// Let me check the skill folder first:Let me check the relevant skills - "sandbox" and "static-website-asset-paths":I've identified the relevant skills:
// static-website-asset-paths - Critical for ensuring CSS/assets load correctly through sandbox proxy (must use absolute paths like /static/style.css instead of relative paths)
// sandbox - For exporting files to local sandbox-files directory after completion
// Step 2 & 3: Task Analysis & TodoList Creation
// This is a multi-step complex task. Let me create a TodoList:Now let me start executing the tasks. First, I'll create the sandbox:Now let me create the sandbox and update the task:Sandbox created successfully! Now let me update the todo and create the directory structure:Directories created. Now let me create the HTML file (using absolute path /static/style.css per the skill requirement) and CSS file:Now let me create the server.py file:Now let me run the server in background mode:Server is running in background. Now let me expose port 8000 and get the endpoint:Now let me export the files to the sandbox-files folder following the sandbox skill instructions:Now let me read the files and export them to sandbox-files:Now let me write the files to the sandbox-files folder preserving the exact structure:Now let me update the todo list and complete the final task:All tasks have been completed successfully! Here is the final output:
// ✅ Task Completed Successfully
// Sandbox ID
// bc3ecc7c-b655-41a0-ac6f-146592f02e3b
// Publicly Reachable Endpoint URL
// http://127.0.0.1:45542/proxy/8000
// Summary of What Was Created
// File	Location	Description
// index.html	/app/index.html	Modern HTML page with header, "Click Me" button, and CSS link using absolute path /static/style.css
// style.css	/app/static/style.css	Modern CSS with Inter font, gradient background, button with hover effects, padding, and responsive design
// server.py	/app/server.py	Python HTTP server serving files from /app on port 8000
// Export Status (per sandbox skill)
// Metric	Value
// Export Status	Completed Successfully
// Total Files Exported	3
// Sandbox Root	/app
// Local Export Path	./sandbox-files/
// Local File Structure
// sandbox-files/
// ├── index.html
// ├── server.py
// └── static/
//     └── style.css
// Key Skill Compliance
// ✅ static-website-asset-paths skill: CSS is referenced using absolute path (/static/style.css) to ensure assets load correctly through the sandbox proxy URL. ✅ sandbox skill: All files exported to sandbox-files/ folder preserving the exact folder structure from the sandbox.`),
//  new AIMessage(`
//   I understand the problem now! The issue is with the proxy URL structure. When using the sandbox proxy at http://127.0.0.1:45542/proxy/8000/, an absolute path like /static/style.css resolves to http://127.0.0.1:45542/static/style.css (wrong!) instead of http://127.0.0.1:45542/proxy/8000/static/style.css (correct). 
//   `),
  
// new HumanMessage("fix this skill static-website-asset-paths or avoing bad url http://127.0.0.1:45542/proxy/8000/static/style.css"),


// new AIMessage(`
//   Skill Fix Summary
// Updated skills/static-website-asset-paths/skill.md:
// Changed from "Absolute Paths Only" → "Relative Paths Only (NO Leading Slash)"
// Updated all code examples to use static/style.css instead of /static/style.css
// Fixed the explanation about why relative paths work with proxy URLs
// Updated the verification checklist`),
// new HumanMessage(userInput)
      
      ] as any



    },
    { streamMode: "messages" }
  );

  let fullContent = "";

  for await (const [messageChunk, metadata] of agentStream) {
    if (messageChunk?.type !== 'ai') continue;
    if (messageChunk.content) {
      const text = messageChunk.content;
      fullContent += text;

      config.writer({
        manager_name: "nodeB",
        content: text
      });
    }
  }

  // return fullContent
  // const fixcontent = fixThinkingTags(fullContent)
  return fullContent

}

