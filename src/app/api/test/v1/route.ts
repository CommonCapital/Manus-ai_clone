





import { graph } from "@/lib/graph/graph";
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



        const { logLastAIMsg } = await createMemoryAgent({ model: llm, userId, threadId })


        const graphStream = await graph.stream(
            {
                messages: [{ role: "user", content: message }],
                userId, threadId
            },

            { streamMode: "custom", subgraphs: true, recursionLimit: 150 }
        );



        const encoder = new TextEncoder();

        const sse = (event: string, data: any) =>
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);


        await writeToChatHistoryTool.invoke({ messages: [{ role: 'user', content: message, userId, threadId ,sub_agent:[]}] })
        let streamingText = ''
        let thinkingBuffer = "";
        let inThinking = false;
        const subagentsTracker:any = [];


        const stream = new ReadableStream({
            async start(controller) {
                try {

                    for await (const [array,chunk] of graphStream) {

            
                        // 1. HANDLE SUB-AGENTS (The Task Tool)
                        if ((chunk as any).subagent_name) {
                            const name=(chunk as any).subagent_name
                            const content=(chunk as any)?.content

                            const subAgentPayload = {
                                sub_agent_name: name,
                                content: content
                            };

                            // Update our backend state tracker
                          updateSubAgentTracker(name, content, subagentsTracker);

                            controller.enqueue(sse("sub_agent", {
                                sub_agent: subAgentPayload
                            }));

                            // Skip further manager-specific parsing for this chunk
                            continue;
                        }

                        // 2. HANDLE MANAGER (NodeA / NodeB)
                        if ((chunk as any).manager_name) {
                            console.log('manager =======',chunk)
                            const content = (chunk as any)?.content;
                            
                            // Your logic for handling <think> tags token-by-token
                            const parts = content.split(/(<think>|<\/think>)/g).filter(Boolean);
                            console.log('============after part=================')
                            parts.forEach((part:string) => {
                                if (part === "<think>") {
                                    inThinking = true;
                                } else if (part === "</think>") {
                                    inThinking = false;
                                } else {
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
                    // end loop


                    const updateThread = await generateThreadTitleTool.invoke({ threadId, userId, llm })
                    if (updateThread) {
                        controller.enqueue(sse("updateThread", { ok: true }));
                    }


                    controller.enqueue(sse("end", { ok: true }));
                    await writeToChatHistoryTool.invoke({ messages: [{ role: 'ai', thinking: thinkingBuffer, content: streamingText, userId, threadId ,sub_agent:subagentsTracker}] })
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




const updateSubAgentTracker = (
    name: string, 
    newContent: string, 
    tracker: any[]
) => {
    const existing = tracker.find(s => s.sub_agent_name === name);
    
    if (existing) {
        existing.content += (newContent ?? "");
    } else {
        tracker.push({
            sub_agent_name: name,
            content: newContent ?? ""
        });
    }
};