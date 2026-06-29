import fs from "node:fs";

import path from "node:path";

import {tool, createAgent, createMiddleware} from "langchain";
import {ChatCerebras} from "@langchain/cerebras";

import {
    SystemMessage, ToolMessage, HumanMessage
} from "@langchain/core/messages";

import { ChatFireworks } from "@langchain/fireworks";
import { think_tool } from "./thinkTool";
import { createTaskTool } from "./taskTool";
import { fileSystemTools } from "./fsTools";
import { basePrompt, TASK_SYSTEM_PROMPT } from "./prompts";
import { todoListTools } from "./todoTools";
import { toolMonitoringMiddleware, ToolOutputSummarizerMiddleware } from "./middleware";







const model = new ChatCerebras({
    model: "gpt-oss-120b",
    temperature: 0.7,
    apiKey: process.env.CEREBRAS_API_KEY,
});

const subagentConfigs = {
    tools: [...fileSystemTools]
}
export async function TestDeepAgent(userInput:string, config:any) {
const agent = createAgent({
    model: model,
    systemPrompt: `
    <system>
${basePrompt}
\n\n
${TASK_SYSTEM_PROMPT}
    </system>
    `,
tools: [...fileSystemTools, ...todoListTools, think_tool, createTaskTool(model,subagentConfigs )] as any,
middleware: [toolMonitoringMiddleware,]
//ToolOutputSummarizerMiddleware
});


const agentOutput = await agent.invoke({
    messages: [new HumanMessage(
        `Research the career accomplishments of LeBron James, Michael Jordan, and Kobe Bryant. I want a separate summary for each — handle them independently, in parallel.`
    ),
],
},
{
    recursionLimit: 150,
}
);
const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content
console.log(agentOutput)
const agentStream = await agent.stream(
    {messages: [new HumanMessage(userInput)]},
    {streamMode: "messages"}
);



let fullContent = "";

for await (const [messageChunk, metadata] of agentStream) {
    if (messageChunk.content) {
        const text = messageChunk.content;
        fullContent += text;


        config.writer({
            manager_name: "nodeB",
            content: text
        })
    }
}

return fullContent


}