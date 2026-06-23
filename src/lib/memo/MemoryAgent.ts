import { createAgent, createMiddleware } from "langchain";
import path from "node:path";
import { MemoryManager } from "./MemoryManaget";
import { buildFileSystemTools } from "./tools/fileSystemTools";
import { MEMORY_AGENT_SYSTEM_PROMT } from "./prompt/system-prompt";
import { ContextAssembler } from "./contextAssembler";



export const toolMonitoringMiddleware = createMiddleware({
    name: "ToolMonitoringMiddleware",
    wrapToolCall: (request, handler) => {
console.log(`Executing tool==============: ${request.toolCall.name}`);
console.log(`Arguments===================: ${JSON.stringify(request.toolCall.args)}`)

        try {
            const result = handler(request);
            console.log("Tool completed successfully===========");
            return result
        } catch (error) {
            console.log(`Tool failed: ${error}`);
            throw error;
        }
    },
});

export async function createMemoryAgent({
    memoryRoot = path.resolve(process.cwd(), "public","memory"),
    model = "gpt-oss-120b",
    modelContextLimit = 3000,
} = {}) {
const memoryManager = new MemoryManager(memoryRoot, {});
await memoryManager.init();
const contextAssembler = new ContextAssembler(memoryManager, modelContextLimit);
const {writeLTMTool} = buildFileSystemTools(memoryRoot);
const agent = createAgent({
    model,
    tools:[writeLTMTool],
    systemPrompt: MEMORY_AGENT_SYSTEM_PROMT,
    middleware: [toolMonitoringMiddleware]
});

async function runAgent(userInput:string, options = {}) {
   await memoryManager.logInteraction("User", userInput, new Date());
   const assembled = await contextAssembler.assemble(userInput, { }); 
   console.log('ass ===========', assembled)
    const agentOutput = await agent.invoke({
        messages: [{role: "user", content: assembled?.prompt}]
    })
    const assistantText = agentOutput.messages[agentOutput.messages.length - 1].content as string
    await memoryManager.logInteraction("Assistant", assistantText, new Date())
    return {
        assistantText
    };
}
return {
    runAgent
}
}