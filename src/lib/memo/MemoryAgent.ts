import path from "node:path";
import { createAgent, createMiddleware, HumanMessage } from "langchain";
import { MemoryManager } from "./MemoryManager";
import { MEMORY_AGENT_SYSTEM_PROMPT } from "./prompt/system-prompt";
import { buildFilesystemTools } from "./tools/fileSystemTools";
import { ContextAssembler } from "./contextAssembler";
import { glob, grep, ls, read_file } from "../deepAgent/fsTools";
import { retrieveRelevantLTMTool } from "./tools/retrieveLTMTool";
import { transfertTool } from "./tools/transfertTool";
import { MAX_MODEL_RETRIES, isRateLimitError, sleep, backoffMs } from "../deepAgent/retry";



export const toolMonitoringMiddleware = createMiddleware({
  name: "ToolMonitoringMiddleware",
  wrapToolCall: (request, handler) => {
    console.log(`Executing tool===============: ${request.toolCall.name}`);
    console.log(`Arguments===================: ${JSON.stringify(request.toolCall.args)}`);

    try {
      const result = handler(request);
      console.log("Tool completed successfully=========");
      return result;
    } catch (e) {
      console.log(`Tool failed: ${e}`);
      throw e;
    }
  },

});



export async function createMemoryAgent({
  memoryRoot = path.resolve(process.cwd(), "public", "memory"),
  model = "gpt-oss-120b",
  modelContextLimit = 8000,
  userId = "",
  threadId = ""

} = {}) {
  const memoryManager = new MemoryManager(memoryRoot, { userId, threadId });

  await memoryManager.init();


  const contextAssembler = new ContextAssembler(memoryManager, modelContextLimit, { userId, threadId });



  const { writeLTMTool } = buildFilesystemTools(memoryRoot, { userId, threadId });


  const agent = createAgent({
    model,
    tools: [writeLTMTool(),retrieveRelevantLTMTool(),transfertTool],
    systemPrompt: MEMORY_AGENT_SYSTEM_PROMPT,
    middleware: [toolMonitoringMiddleware]
  });



  async function runAgent(userInput: string, options = {}) {


    await memoryManager.logInteraction("User", userInput, new Date());

    const assembled = await contextAssembler.assemble(userInput, {});
    // console.log('ass ========= ', assembled)

    const agentOutput = await agent.invoke({
      messages: [{ role: "user", content: assembled?.prompt }]
    })

    const assistantText = agentOutput.messages[agentOutput.messages.length - 1].content as string

    await memoryManager.logInteraction("Assistant-1", assistantText, new Date());



    return {
      assistantText,
    };
  }


  async function streamAgent(userInput: string) {
    await memoryManager.logInteraction("User", userInput, new Date());

    const assembled = await contextAssembler.assemble(userInput, {});

    const stream = await agent.stream(
      { messages: [{ role: "user", content: assembled?.prompt }] },
      { streamMode: "updates" }


    )

    return stream





  }


  async function streamAgentV1(userInput: string, config: any) {
    await memoryManager.logInteraction("User", userInput, new Date());

    const assembled = await contextAssembler.assemble(userInput, {});
    //  console.log('ass ========= ', assembled)

    let fullContent = "";
    let lastError: any = null;

    for (let attempt = 0; attempt < MAX_MODEL_RETRIES; attempt++) {
      try {
        const agentStream = await agent.stream(
          {
            messages: [{ role: "user", content: assembled?.prompt }

            ]
          },
          {
            streamMode: "messages",
            configurable: {
              userId, threadId
            }
          },
        )

        fullContent = "";

        for await (const [messageChunk, metadata] of agentStream) {

          // if (messageChunk?.type !== 'ai') continue;
          if (messageChunk.content) {
            const text = messageChunk.content;
            fullContent += text;

            config.writer({
              manager_name: "nodeA",
              content: text
            });
          }
        }

        lastError = null;
        break;
      } catch (error: any) {
        lastError = error;

        // ChatCerebras disables its client's own retries (maxRetries: 0), so
        // without this a single rate-limit hit here used to kill the whole
        // run before Assistant-2 ever got a chance to run.
        if (!isRateLimitError(error) || attempt === MAX_MODEL_RETRIES - 1) {
          break;
        }

        const wait = backoffMs(attempt);
        config.writer({
          manager_name: "nodeA",
          content: `\n[Rate limited, retrying in ${wait / 1000}s (attempt ${attempt + 1}/${MAX_MODEL_RETRIES})...]\n`
        });
        await sleep(wait);
      }
    }

    if (lastError) throw lastError;

    await memoryManager.logInteraction("Assistant-1", fullContent, new Date());

    return { fullContent, context: assembled?.deepAgentContext }
  }


  async function logLastAIMsg(fullAssistantText: string) {
    await memoryManager.logInteraction("Assistant-1", fullAssistantText, new Date());
  }






  return {
    streamAgentV1,
    logLastAIMsg,
    streamAgent,
    runAgent
  };
}

