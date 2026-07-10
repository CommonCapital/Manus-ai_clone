

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


        // req.signal fires when the client disconnects (reload, navigation, tab
        // close). Without threading it through, the graph run kept executing
        // fully orphaned in the background — still calling tools, still burning
        // API quota — with nothing to stop it, and it would eventually throw
        // trying to write to the now-dead stream controller.
        const graphStream = await graph.stream(
            {
                messages: [{ role: "user", content: message }],
                userId, threadId
            },

            { streamMode: "custom", subgraphs: true, recursionLimit: 150, signal: req.signal }
        );



        const encoder = new TextEncoder();

        const sse = (event: string, data: any) =>
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);


        await writeToChatHistoryTool.invoke({ messages: [{ role: 'user', content: message, userId, threadId, sub_agent: [] }] })
        let streamingText = ''
        let thinkingBuffer = "";
        let streamClosed = false;
        const subagentsTracker: any = [];

        // LLM streams emit tiny fragments, so a "<think>"/"</think>" tag can be
        // split across multiple chunks (e.g. "<th" then "ink>"). Splitting each
        // chunk's content independently misses tags that straddle a chunk
        // boundary, letting raw thinking text leak into the visible message.
        // This carries an accumulation buffer across chunks and only emits text
        // once we're sure it isn't the prefix of an upcoming tag.
        const thinkParserState = { buffer: "", inThinking: false };
        const THINK_OPEN = "<think>";
        const THINK_CLOSE = "</think>";

        function extractThinkEvents(newContent: string) {
            thinkParserState.buffer += newContent;
            const events: { thinking: boolean; text: string }[] = [];

            while (true) {
                const tag = thinkParserState.inThinking ? THINK_CLOSE : THINK_OPEN;
                const idx = thinkParserState.buffer.indexOf(tag);

                if (idx === -1) {
                    // No complete tag yet — hold back any trailing text that could
                    // still turn into the tag we're looking for, emit the rest.
                    let holdback = 0;
                    const maxHoldback = Math.min(tag.length - 1, thinkParserState.buffer.length);
                    for (let i = maxHoldback; i > 0; i--) {
                        if (tag.startsWith(thinkParserState.buffer.slice(thinkParserState.buffer.length - i))) {
                            holdback = i;
                            break;
                        }
                    }

                    const emitLength = thinkParserState.buffer.length - holdback;
                    if (emitLength > 0) {
                        events.push({ thinking: thinkParserState.inThinking, text: thinkParserState.buffer.slice(0, emitLength) });
                        thinkParserState.buffer = thinkParserState.buffer.slice(emitLength);
                    }
                    break;
                }

                const before = thinkParserState.buffer.slice(0, idx);
                if (before.length > 0) {
                    events.push({ thinking: thinkParserState.inThinking, text: before });
                }
                thinkParserState.buffer = thinkParserState.buffer.slice(idx + tag.length);
                thinkParserState.inThinking = !thinkParserState.inThinking;
            }

            return events;
        }


        const stream = new ReadableStream({
            async start(controller) {
                try {

                    for await (const [array, chunk] of graphStream) {


                        // browser_image
                         if ((chunk as any).browser_image) {
                            const browser_image = {
                                
                                browser_image: chunk?.browser_image,
                                src: chunk?.src
                            };
                            controller.enqueue(sse("browser_image", {
                                browser_image
                            }));
                           
                        }


                        // browser_image

                        // write file
                        if ((chunk as any).write_file) {
                            console.log('write file :==',chunk)
                            const write_file = {
                                
                                filename: chunk?.filename,
                                content: chunk?.content
                            };
                            controller.enqueue(sse("write_file", {
                                write_file
                            }));
                           
                        }


                        if ((chunk as any).read_file) {
                            const read_file = {
                             
                                filename: chunk?.filename,
                                content: chunk?.content
                            };
                            controller.enqueue(sse("read_file", {
                                read_file
                            }));
                          
                        }
                        // end write file

                        // update todos
                        if ((chunk as any).update_todos) {
                            const update_todo = {
                                filename: chunk?.filename,
                                updates: chunk?.updates,
                                todoList: chunk?.todoList
                            };
                            controller.enqueue(sse("update_todos", {
                                update_todo
                            }));
                             continue;
                        }
                        // update todos

                        // todos
                        if ((chunk as any).todos) {
                            console.log('todos =======', chunk)

                            const todo_list = {
                                todos: chunk?.todos,
                                todoList: chunk?.todoList
                            };
                            controller.enqueue(sse("todo_list", {
                                todo_list
                            }));
                             continue;

                        }
                        // end todos

                        if ((chunk as any).subagent_name) {
                            const name = (chunk as any).subagent_name
                            const content = (chunk as any)?.content

                            const subAgentPayload = {
                                sub_agent_name: name,
                                content: content
                            };

                            updateSubAgentTracker(name, content, subagentsTracker);

                            controller.enqueue(sse("sub_agent", {
                                sub_agent: subAgentPayload
                            }));

                            continue;
                        }

                        if ((chunk as any).manager_name) {

                            const content = (chunk as any)?.content;

                            const events = extractThinkEvents(content ?? "");

                            events.forEach((event) => {
                                if (event.thinking) {
                                    thinkingBuffer += event.text;
                                    controller.enqueue(
                                        sse("thinking", { thinking: event.text })
                                    );
                                } else {
                                    streamingText += event.text;
                                    controller.enqueue(
                                        sse("message", { message: event.text })
                                    );
                                }
                            });

                        }
                    }
                    // end loop


                    const updateThread = await generateThreadTitleTool.invoke({ threadId, userId, llm })
                    if (updateThread) {
                        controller.enqueue(sse("updateThread", { ok: true }));
                    }


                    if (!streamClosed) {
                        controller.enqueue(sse("end", { ok: true }));
                        streamClosed = true;
                        controller.close();
                    }
                    await writeToChatHistoryTool.invoke({ messages: [{ role: 'ai', thinking: thinkingBuffer, content: streamingText, userId, threadId, sub_agent: subagentsTracker }] })


                } catch (error) {
                    // If the client already disconnected (cancel() below already
                    // ran), the controller is dead — don't try to enqueue/close it
                    // again, that's its own separate crash.
                    if (!streamClosed) {
                        console.log('Error ', (error as Error)?.message)
                        try {
                            controller.enqueue(sse("error", { error: (error as Error).message }));
                        } catch { /* controller already closed underneath us */ }
                        streamClosed = true;
                        try { controller.close(); } catch { /* already closed */ }
                    } else {
                        console.log('Run ended after client disconnected:', (error as Error)?.message)
                    }

                    // Persist whatever streamed through before the failure so a
                    // crashed turn doesn't vanish from chat history on refresh.
                    try {
                        await writeToChatHistoryTool.invoke({
                            messages: [{
                                role: 'ai',
                                thinking: thinkingBuffer,
                                content: streamingText || `Error: ${(error as Error).message}`,
                                userId, threadId,
                                sub_agent: subagentsTracker
                            }]
                        })
                    } catch (persistError) {
                        console.log('Failed to persist chat history after error', (persistError as Error)?.message)
                    }
                }
            },
            cancel(reason) {
                // Client disconnected (reload/navigation/tab close). req.signal
                // being aborted is what actually stops graph.stream() from doing
                // further work; this just marks the controller dead so the loop
                // above doesn't try to enqueue/close it again once that happens.
                streamClosed = true;
                console.log('Stream cancelled by client:', reason);
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
console.log("server error  : == ",JSON.stringify(err,null,2),"==",err?.message)
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