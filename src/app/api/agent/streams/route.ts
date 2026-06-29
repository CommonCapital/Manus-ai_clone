import { LLM } from "@/lib/llm/LLM"
import { createMemoryAgent } from "@/lib/memo/MemoryAgent";
import { withErrorHandler } from "@/lib/mongodb/withErrorHandler";
import { writeToChatHistoryTool } from "@/lib/tools/chatHistoryTools";
import { generateThreadTitleTool } from "@/lib/tools/threadTools";
import {createAgent} from "langchain";

export const POST = withErrorHandler(async (req: Request) => {
    try {
const {message, userId, threadId}: {message: string, userId: string, threadId: string} = await req.json()
const llm = LLM.getInstance('fireworks')
//const agent = createAgent({
//model: llm,
//systemPrompt: "You are a helpful AI assistant. Before giving the final answer, you MUST write your internal thinking process inside <think>...</think> tags. Example: <think>User wants to know X. I should explain Y.</think> Actual Answer goes here."

//})
const {streamAgent, logLastAIMsg} = await createMemoryAgent({model:llm,userId, threadId})

const encoder = new TextEncoder();
const sse = (event: string, data: any) => 
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

await writeToChatHistoryTool.invoke({messages: [{role: 'user', content: message, userId, threadId }] })
let streamingText = ''
let thinkingBuffer = "";

const stream = new ReadableStream({
    async start(controller) {
        try {
for await (const chunk of await streamAgent(
   message
)) {
    const updates = chunk?.tools?.messages
    const req = chunk?.model_request?.messages
    if (updates && updates.length > 0) {
        thinkingBuffer += updates[0].content;
        controller.enqueue(sse("thinking", { thinking: updates[0].content}))
    }

    if (req && req.length > 0) {
        const content = req[0]?.content ?? '';
    
    // 1. Создаем переменную для хранения строкового содержимого
    let textContent = '';

    // 2. Проверяем тип content
    if (typeof content === 'string') {
        textContent = content;
    } else if (Array.isArray(content)) {
        // Если это массив блоков, собираем весь текст в одну строку
        textContent = content
            .map(block => {
                if (typeof block === 'string') return block;
                // Проверяем наличие текстового поля у объекта (зависит от версии LangChain, обычно 'text')
                return ('text' in block) ? block.text : '';
            })
            .join('');
    }

    // 3. Теперь TypeScript уверен, что textContent — это string, и разрешает .split()
    if (textContent.length > 0) {
       const hasOpening = textContent.includes("<think>")
       const hasClosing = textContent.includes("</think>")
       let inThinking = hasClosing && (!hasOpening || textContent.indexOf)
        const parts: any = textContent.split(/(<think>|<\/think>)/g).filter(Boolean);
        
        // Тут ваша логика обработки частей текста
        // Например: parts = ["", "<think>", "Размышление", "</think>", " Ответ"]
        parts.forEach((part: any) => {
            if (part === "<think>") {
                inThinking = true;
            } else if (part === "</think>") {
                inThinking = false
            } else if (part.length > 0) {
                if (inThinking) {
                    thinkingBuffer +=part;
                    controller.enqueue(
                        sse("thinking", {thinking: part})
                    );
                } else {
                    streamingText += part;
                    controller.enqueue(
                        sse("message", {message: part})

                    );
                }
            }
        });
    }

    }

}
const updateThreads = await generateThreadTitleTool.invoke({threadId, userId, llm} as any)
if(updateThreads) {
    controller.enqueue(sse("updateThread", {ok:true}))
}
        controller.enqueue(sse("end", {ok: true}));
        await writeToChatHistoryTool.invoke({messages: [{role: "ai", thinking: thinkingBuffer, content: streamingText, userId, threadId }]})

        await logLastAIMsg(streamingText)
        controller.close();
        } catch (error) {
console.log('Error', (error as Error)?.message)
controller.enqueue(sse("error", {error: (error as Error).message}))
controller.close();
        }
    }
});

return new Response(stream, {
    headers: {
        "Content-Type":"text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no transform",
        Connection: "keep-alive",
    },
});

    } catch(error: any) {

        return new Response(JSON.stringify({ok: false, error: error.message}), {
            status: 500,
            headers: {"Content-Type":"application/json"},
        });

    }
})