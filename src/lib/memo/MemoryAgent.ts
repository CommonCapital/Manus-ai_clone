import path from "node:path";
import { createAgent, createMiddleware, HumanMessage } from "langchain";
import { MemoryManager } from "./MemoryManager";
import { MEMORY_AGENT_SYSTEM_PROMPT } from "./prompt/system-prompt";
import { buildFilesystemTools } from "./tools/fileSystemTools";
import { ContextAssembler } from "./contextAssembler";
import { glob, grep, ls, read_file } from "../deepAgent/fsTools";
import { retrieveRelevantLTMTool } from "./tools/retrieveLTMTool";
import { transfertTool, TRANSFER_MARKER } from "./tools/transfertTool";
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
    let transferToolContent = "";
    let transferToolCallId: string | null = null;

    for (let attempt = 0; attempt < MAX_MODEL_RETRIES; attempt++) {
      try {
        const agentStream = await agent.stream(
          {
            messages: [{ role: "user", content: assembled?.prompt }

            ]
          },
          {
            streamMode: "messages",
            recursionLimit: 50,
            configurable: {
              userId, threadId
            }
          },
        )

        fullContent = "";
        transferToolContent = "";
        transferToolCallId = null;

        for await (const [messageChunk, metadata] of agentStream) {

          if ((messageChunk as any)?.type === 'tool') {
            // Tool results are never shown to the user as if they were the
            // model's own words. transfertTool's result specifically is how
            // we detect a handoff — deterministically, from the tool's own
            // return value, not by asking the model to echo it back. Matched
            // by tool_call_id (not just "any tool result seen so far") so a
            // different tool's result in the same turn (e.g. writeLTMTool)
            // can't get concatenated in and corrupt the JSON parse below.
            const chunkAny = messageChunk as any;
            if (chunkAny?.name === 'transfertTool' && !transferToolCallId) {
              transferToolCallId = chunkAny.tool_call_id;
              // Surface the routing decision in the collapsed Thinking panel.
              config.writer({
                manager_name: "nodeA",
                content: `<think>Handing off to the deep agent (Assistant-2)...\n</think>`
              });
            }
            if (transferToolCallId && chunkAny.tool_call_id === transferToolCallId && messageChunk.content) {
              transferToolContent += messageChunk.content;
            }
            continue;
          }

          if (messageChunk?.type !== 'ai') continue;

          if (messageChunk.content) {
            const text = messageChunk.content;
            fullContent += text;

            // Once a handoff has fired, anything else Assistant-1 says ("Your
            // request has been handed off... they will get back to you shortly")
            // is filler — Assistant-2's real answer follows in the same run.
            // Route it to the Thinking panel instead of main chat. The inner
            // replace strips any think tags the model itself emitted so they
            // can't mis-nest with our wrapper.
            const routed = transferToolCallId
              ? `<think>${String(text).replace(/<\/?think>/gi, "")}</think>`
              : text;

            config.writer({
              manager_name: "nodeA",
              content: routed
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

    let transferContext: string | null = null;
    if (transferToolContent) {
      try {
        const parsed = JSON.parse(transferToolContent);
        if (parsed?.marker === TRANSFER_MARKER) transferContext = parsed.context;
      } catch {
        // Partial/malformed content (e.g. a retry landed mid-stream) — no
        // handoff detected, which is the safe default.
      }
    }

    return { fullContent, transferContext, deepAgentContext: assembled?.deepAgentContext }
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

