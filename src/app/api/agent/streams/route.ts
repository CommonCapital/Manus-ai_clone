
import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memo/MemoryAgent";
import { withErrorHandler } from "@/lib/mongodb/withErrorHandler";
import { writeToChatHistoryTool } from "@/lib/tools/chatHistoryTools";
import { generateThreadTitleTool } from "@/lib/tools/threadTools";
import { createAgent } from "langchain";


export const POST = withErrorHandler(async (req: Request) => {
    try {


        const { message, userId, threadId }: { message: string, userId: string, threadId: string } = await req.json();

        const llm = LLM.getInstance("cerebras")


        const { streamAgent, logLastAIMsg } = await createMemoryAgent({ model: llm, userId, threadId })


        const encoder = new TextEncoder();

        const sse = (event: string, data: any) =>
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);


        await writeToChatHistoryTool.invoke({ messages: [{ role: 'user', content: message, userId, threadId, sub_agent: [] }] })
        let streamingText = ''
        let thinkingBuffer = "";
        let inThinking = false;


        const stream = new ReadableStream({
            async start(controller) {
                try {

                    for await (const chunk of await streamAgent(message)) {


                        const updates = chunk?.tools?.messages
                        const req = chunk?.model_request?.messages


                        if (updates && updates.length > 0) {
                            thinkingBuffer += updates[0].content;
                            controller.enqueue(sse("thinking", { thinking: updates[0].content }));
                        }

                        if (req && req.length > 0) {
const content = (req[0]?.content ?? "") as string;



                            const hasOpening = content.includes("<think>");
                            const hasClosing = content.includes("</think>");
                            let inThinking = hasClosing && (!hasOpening || content.indexOf("</think>") < content.indexOf("<think>"));

                            const parts = content.split(/(<think>|<\/think>)/g).filter(Boolean);

                            // 2. Iterate through each part sequentially
                            parts.forEach((part :any) => {
                                if (part === "<think>") {
                                    inThinking = true;
                                } else if (part === "</think>") {
                                    inThinking = false;
                                } else {
                                    // 3. Route the content based on the state
                                    if (inThinking) {
                                        thinkingBuffer += part;
                                        controller.enqueue(sse("thinking", { thinking: part }));
                                    } else {
                                        streamingText += part;
                                        controller.enqueue(sse("message", { message: part }));
                                    }
                                }
                            });

                        }

                    }


                    const updateThread= await generateThreadTitleTool.invoke({threadId,userId,llm})
                    if(updateThread){
                        controller.enqueue(sse("updateThread", { ok: true }));
                    }


                    controller.enqueue(sse("end", { ok: true }));
                    await writeToChatHistoryTool.invoke({ messages: [{ role: 'ai', thinking: thinkingBuffer, content: streamingText, userId, threadId, sub_agent:[] }] })
                    await logLastAIMsg(streamingText)
                    controller.close()


                } catch (error) {
                    console.log('Error ', (error as Error)?.message)
                    controller.enqueue(sse("error", { error: (error as Error).message }));
                    controller.close();
                }
            },
        });


        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });

    } catch (err: any) {

        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});


