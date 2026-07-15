
import fs from "node:fs";
import path from "node:path";

import { tool, createAgent, createMiddleware } from "langchain";
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
import { execute_code, run_app, get_app_logs, stop_app } from "./sandboxTool";
import { take_screenshot } from "./screenshotTool";
import { documentTools } from "./docTools";
import { MAX_MODEL_RETRIES, isRateLimitError, sleep, backoffMs } from "./retry";
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



// Role-split model routing, matching the known-good reference setup:
//  - Manager/orchestrator: GLM-5 — strong at multi-step planning + tool calls.
//  - Subagents + summarizers: MiniMax — a fast, cheap, strong-tool-calling
//    worker model. Subagents do the high-volume work (dozens of web_search/
//    read_url calls, each writing a report file), so a FAST model here is what
//    makes the run generate many summaries quickly instead of crawling.
// Both are on Fireworks (working retries, separate quota from Cerebras). The
// old setup ran everything on Cerebras gpt-oss-120b, whose tool-calling
// collapses — that was the real cause of "subagents don't run / it's slow".
const managerModel = LLM.getInstance("fireworks_glm")
const workerModel = LLM.getInstance("fireworks_minimax")


const subagentConfigs = {
  tools: [...filesystemTools, ...todoListTools, ...documentTools,
  // ...mcpTools,
    // SendImageToAgentComputer,
    searchTool,
    webScrapperTool,
    take_screenshot,
    run_app,
    get_app_logs,
    stop_app
  ]
}
export async function testDeepAgent(userInput: string, config: any) {

  // For the Main Manager Agent


const agent = createAgent({
    model: managerModel,
    systemPrompt: `
    <system>
${basePrompt}
\n\n
${TASK_SYSTEM_PROMPT}
    </system>
    `,
    tools: [...filesystemTools, ...todoListTools, ...documentTools, execute_code, run_app, get_app_logs, stop_app, take_screenshot, think_tool, createTaskTool(workerModel, subagentConfigs), searchTool, webScrapperTool] as any,
    middleware: [
        summarizationMiddleware({
            // Context compaction runs on the fast worker model (MiniMax), not the
            // manager — it's a cheap "summarize these messages" call, no reason to
            // burn the heavier orchestrator model on it.
            //
            // The "internal_summary" tag is load-bearing: LangGraph's messages-mode
            // stream handler emits chunks from EVERY chat-model call inside the
            // graph — including this internal summarizer. The stream loop below
            // detects this tag and routes those chunks to the collapsed Thinking
            // panel (wrapped in <think> tags) instead of the main chat, where
            // they used to appear as if the agent said them ("User task: ...
            // Procedural constraints..."). Still visible — just in the right place.
            model: workerModel.withConfig({ tags: ["internal_summary"] }),
            // 8000 tokens was far too aggressive for this workload: a single
            // subagent result plus two SKILL.md reads exceeds it, so compaction
            // fired mid-plan and scrambled the manager's working context.
            // gpt-oss-120b on Cerebras has a ~131k context window.
            trigger: [
                {tokens: 40000}
            ],
            keep: {messages: 30}
        }),
        ToolOutputSummarizerMiddleware
    ] as any
} as any) as any;

  let lastError: any = null;

  for (let attempt = 0; attempt < MAX_MODEL_RETRIES; attempt++) {
  try {
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
        step 3. Breaking down a Task by Creating a TodoList using write_todos YOURSELF, directly.
            IMPORTANT: Creating/expanding/restructuring the TODO list, or "designing a workflow", is YOUR
            OWN job via write_todos/update_todos. NEVER spawn a subagent (via the task tool) whose job is
            to create or manage the todo list itself (e.g. do not create a subagent named "todo-creator"
            or similar) — that just delegates planning to nowhere and stalls real progress. Only spawn
            subagents for substantive work items: research, data gathering, coding, analysis, synthesis.
            ASSIGNMENT RULE (both directions matter):
            - In the plan, assign every substantive task (research, coding, implementation, running/
              verifying apps) to a NAMED subagent — "me" is reserved for planning, coordination, and
              final synthesis only. A plan where everything is assigned to "me" is wrong: you are an
              orchestrator, and doing all the work yourself bloats your context and defeats the system.
            - "assigned_to" is a commitment: when you reach a task assigned to a subagent name, you MUST
              execute it by spawning that subagent with the task tool (passing todo_filename + todo_id) —
              not by quietly doing it yourself.
        step 4. TODO status lifecycle — every task goes pending → in_progress → completed. Never jump
        straight from pending to completed, and never leave a finished task un-updated:
            - Tasks you DELEGATE to a subagent: pass todo_filename + todo_id to the task tool. The
              system then updates that task's status automatically (in_progress on spawn, completed
              on return, blocked on failure) — you don't call update_todos for these at all.
            - Tasks assigned to "me" (you do them yourself): call update_todos to set in_progress as
              the FIRST action when you start it, and completed IMMEDIATELY when you finish it —
              before starting anything else.
   step 5. you should not work alone it better to spawn subAgent to be efficient for complex inputs,
   but ONLY for the substantive work itself (see step 3's note) — not for planning/todo-list meta-work.
   step 6. If you ever notice a task with a real finished result that still shows "pending" or
   "in_progress" in the todo file, fix its status immediately before doing anything else — a stale
   todo file means the user's progress panel is lying to them.
   Only read Research files during the synthesis phase.
   step7. About sandbox once you or subagents finished working should export files to sandbox-files folder.
   step8. CRITICAL — do not claim a task is done unless you actually did it. Before writing your final
   summary, re-read the todo file and check every task's real status. If you said in your own words that
   you "ran", "verified", or "launched" something (e.g. run_app), that is only true if you actually called
   that tool this conversation and got a real result back — not if you only described the plan to call it.
   If you ran out of turns/budget before finishing something, say exactly that and mark the task
   "pending" or "blocked" — a false "completed" is worse than an honest "not done yet".
   step9. NEVER stop mid-plan to ask the user for permission to continue. The user already approved
   the whole job by asking for it; every task in your todo list is pre-approved. Ending your turn with
   "let me know if you'd like to proceed with the pending steps" while tasks are still pending is a
   failure — the user cannot reply into a finished run, so the work just dies. Keep executing until
   every task is completed or genuinely blocked, and only then write your final summary.
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
    // createAgent's own ReAct loop is a LangGraph pregel loop with its own
    // recursion limit, defaulting to 25 steps if unset — completely separate
    // from the outer graph's recursionLimit:150 in route.ts. A real multi-part
    // task (read a skill, plan, spawn 2+ subagents, verify) easily exceeds 25
    // steps; once hit, the agent stops actually calling tools and starts
    // narrating what it would have done instead, then reports false success.
    { streamMode: "messages", recursionLimit: 100 }
  );

  // Leak-proof by construction: every manager turn streams live into the
  // collapsed Thinking panel, and only the FINAL turn (the actual answer,
  // after the last tool call) is promoted to the visible chat when the run
  // ends. Mid-run narration ("We need to identify the right skill...", fake
  // tool-call JSON, planning chatter) structurally cannot reach main chat
  // anymore — it doesn't depend on the model wrapping anything in tags.
  // Turns are delimited by message id: LangGraph keeps the id stable within
  // one model turn and changes it on the next.
  let currentTurnId: string | undefined;
  let currentTurnContent = "";
  let lastNonEmptyTurnContent = "";

  for await (const [messageChunk, metadata] of agentStream) {
    if (messageChunk?.type !== 'ai') continue;
    if (messageChunk.content) {
      const text = String(messageChunk.content);

      // Internal model calls (context compaction, browser-output digests) are
      // still shown — but only in the Thinking panel, and never counted as a
      // manager turn.
      const isInternal = ((metadata as any)?.tags ?? []).includes("internal_summary");
      if (isInternal) {
        config.writer({
          manager_name: "nodeB",
          content: `<think>${text.replace(/<\/?think>/gi, "")}</think>`
        });
        continue;
      }

      const chunkId = (messageChunk as any)?.id;
      if (chunkId !== currentTurnId) {
        if (currentTurnContent.trim()) lastNonEmptyTurnContent = currentTurnContent;
        currentTurnId = chunkId;
        currentTurnContent = "";
      }
      currentTurnContent += text;

      config.writer({
        manager_name: "nodeB",
        content: `<think>${text.replace(/<\/?think>/gi, "")}</think>`
      });
    }
  }

  // Promote the final turn (or the last non-empty one, if the run ended on a
  // tool call) to the visible message. The client's typewriter effect still
  // animates it, so the UX stays smooth.
  const finalAnswer = currentTurnContent.trim()
    ? currentTurnContent
    : lastNonEmptyTurnContent;

  if (finalAnswer) {
    config.writer({
      manager_name: "nodeB",
      content: finalAnswer
    });
  }

  return finalAnswer
  } catch (error: any) {
    lastError = error;

    // Without this, a single rate-limit hit on the manager's OWN turn (not a
    // subagent's) used to kill the entire run outright, since ChatCerebras
    // disables its underlying client's retries (maxRetries: 0).
    if (!isRateLimitError(error) || attempt === MAX_MODEL_RETRIES - 1) {
      break;
    }

    const wait = backoffMs(attempt);
    config.writer({
      manager_name: "nodeB",
      content: `\n[Rate limited, retrying in ${wait / 1000}s (attempt ${attempt + 1}/${MAX_MODEL_RETRIES})...]\n`
    });
    await sleep(wait);
  }
  }

  throw lastError;
}

