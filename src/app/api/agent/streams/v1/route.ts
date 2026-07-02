import {graph} from "@/lib/graph/graph"
import { LLM } from "@/lib/llm/LLM"
import { createMemoryAgent } from "@/lib/memo/MemoryAgent"
import { withErrorHandler } from "@/lib/mongodb/withErrorHandler"
import { writeToChatHistoryTool } from "@/lib/tools/chatHistoryTools"
import { generateThreadTitleTool } from "@/lib/tools/threadTools"
import { sub } from "date-fns"
import { createAgent } from "langchain"

export const POST = withErrorHandler(async (req: Request) => {

    try {
        const {message, userId, threadId}: {message:string, userId:string, threadId:string} = await req.json();
        const llm = LLM.getInstance("cerebras")

        const {logLastAIMsg} = await createMemoryAgent({model:llm, userId, threadId})
        const graphStream = await graph.stream(
            {
                messages: [{role: "user", content: message}],
                userId, threadId
            },
            {
                streamMode: "custom", subgraphs:true
            }
        );


        const encoder = new TextEncoder();

        const sse = (event:string, data:any) => {
           return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);


        }

        await writeToChatHistoryTool.invoke({messages: [{role: 'user', content: message, userId, threadId, sub_agent: []}]})
    let streamingText = ''
    let thinkingBuffer = '';
    let inThinking = false;
    const subagentsTracker:any = [];
    const stream = new ReadableStream({
        async start(controller) {
            try {
               for await (const [array,chunk] of graphStream) {

if ((chunk as any).update_todos) {
    const update_todo = {
        todos: chunk?.todos,
        updates: chunk?.updates
    };
    controller.enqueue(sse("update_todos",{
        update_todo
    }));
}

if ((chunk as any).todos) {
    console.log('todos ==========',chunk)
    const todo_list = {
        todos:chunk?.todos,
        todoList: chunk?.todoList
    };
    controller.enqueue(sse("todo_list", {
        todo_list
    }));
}
                if ((chunk as any).subagent_name) {
                    const name = (chunk as any)?.subagent_name
                    const content = (chunk as any)?.content;
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
console.log(`manager ========`,chunk)
const content=(chunk as any)?.content;
const parts = content.split(/(<think>|<\/think>)/g).filter(Boolean);

parts.forEach((part:string) => {
    if (part === "<think>") {
        inThinking = true;
    } else if (part === "</think>" ) {
        inThinking = false
    } else {
        if (inThinking) {
            thinkingBuffer +=part;
            controller.enqueue(sse("thinking", {thinking:part}));

        } else {
            streamingText +=part
            controller.enqueue(sse("message", {message: part}))
        }
    }
});
                }


                
               } 

               const updateThread = await generateThreadTitleTool.invoke({threadId, userId, llm})
               if (updateThread) {
                controller.enqueue(sse("updateThread", {ok:true}))
               }


controller.enqueue(sse("end", {ok:true}));
await writeToChatHistoryTool.invoke({messages: [{role:'ai', thinking:thinkingBuffer,content: streamingText, userId, threadId, sub_agent:subagentsTracker }]});
controller.close()
            } catch (error) {
                console.log('Error', (error as Error).message);
                controller.enqueue(sse("error", {error: (error as Error).message}));
                controller.close()
            }
        }
    });


    return new Response(stream, {
        headers: {
            "Content-Type":"text/event-stream; character=utf-8",
            "Cache-Control":"no-cache, no-transform",
            Connection: "keep-alive"
        }
    })
    
    } catch (error:any) {
        return new Response(JSON.stringify({ok:false, error:error.message}), {
            status:500,
            headers:{"Content-Type":"application/json"}
        })
    }
});


const updateSubAgentTracker = (
    name:string,newContent:string, tracker:any[]
) => {
    const existing = tracker.find(s=> s.sub_agent_name === name);


    if (existing) {
        existing.content += (newContent ?? "");

    } else {
        tracker.push({
            sub_agent_name: name,
            content: newContent ?? ""
        });
    }
}