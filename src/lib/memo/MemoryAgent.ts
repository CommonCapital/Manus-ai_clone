import { createAgent, createMiddleware } from "langchain";
import path from "node:path";
import { MemoryManager } from "./MemoryManager";
import { buildFileSystemTools } from "./tools/fileSystemTools";
import { MEMORY_AGENT_SYSTEM_PROMT } from "./prompt/system-prompt";
import { ContextAssembler } from "./contextAssembler";
import { write_todos } from "../deepAgent/todoTools";



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
    userId = "",
    threadId = "",
} = {}) {
const memoryManager = new MemoryManager(memoryRoot, {userId, threadId});
await memoryManager.init();
const contextAssembler = new ContextAssembler(memoryManager, modelContextLimit, {userId, threadId});
const {writeLTMTool} = buildFileSystemTools(memoryRoot, {userId, threadId});
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



async function streamAgent(userInput:string, options={}) {
       await memoryManager.logInteraction("User", userInput, new Date());
   const assembled = await contextAssembler.assemble(userInput, { }); 
   console.log('ass ===========', assembled)
    const stream = await agent.stream({
        messages: [{role: "user", content: assembled?.prompt}]

    },
        {streamMode:"updates"}
    )

return stream

}
async function streamAgentV1(userInput:string, config:any) {
    await memoryManager.logInteraction("User", userInput, new Date());
    const assembled = await contextAssembler.assemble(userInput, {});
    const agentStream = await agent.stream(
        {messages: [{role: "user", content: assembled?.prompt}]},
        {streamMode: "messages"}
    )
    let rawContent = "";     // raw — for routing, includes __TRANSFER__
    let logContent = "";     // clean — for memory logging only

    for await (const [messageChunk, metadata] of agentStream) {
        if (messageChunk.content && messageChunk._getType() === "ai") {
            const text = messageChunk.content as string;
            rawContent += text;  // accumulate raw

            const cleanText = text
                .replace(/<think>[\s\S]*?<\/think>/g, "")
                .replace(/__TRANSFER__[^\n]*/g, "")
                .trim();
            if (cleanText) logContent += cleanText;

            config.writer({manager_name: "nodeA", content: text})
        }
    }

    if (logContent) {
        await memoryManager.logInteraction("Assistant", logContent, new Date());
    }

    return rawContent;  // return raw so nodeA can detect __TRANSFER__
}
async function logLastAIMsg(fullAssistantText:string) {
    await memoryManager.logInteraction("Assitant-1", fullAssistantText, new Date());
}


return {
    runAgent,
    streamAgentV1,
    streamAgent,
    logLastAIMsg
};
}