

"use client";

import { memo, useEffect, useRef, useState } from "react";

import { cn, showError } from "@/lib/utils";

import { MessageBubble } from "./chatbox/MessageBubble";
import { chatMessages } from "./chatbox/chat";
import ChatInput from "./chatbox/ChatInput";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useSession } from "next-auth/react";
import { addAgentFile, addAgentDocument, addAgentImage, addTodos, addUserAndAiPlaceholder, appendToAssistantThinking, appendToLastAiMessage, appendToLastAIMessageSubAgent, clearTodos, getChatHistory, subAgentWorking, updateTodos } from "@/store/chatSlice";
import { fetchThreads } from "@/store/threadSlice";
import { ViewReportModal } from "../modal/ViewReportModal";

export default function ChatPanel({ threadId }: { threadId: string }) {

  const { data: session } = useSession()

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);


  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userId = session?.user?.id as any

  const dispatch = useDispatch<AppDispatch>();


  const { messages, agent_files, error, chatPanelPadding } = useSelector(
    (state: RootState) => state.chat
  )

  useEffect(() => {
    if (userId) {
      dispatch(getChatHistory({ userId, threadId }));
    }
  }, [userId, dispatch]);





  // streaming

  const queueRef = useRef<string[]>([]);
  const typingRef = useRef(false);

  const thinkingQueueRef = useRef<string[]>([]);
  const thinkingTypingRef = useRef(false);

  const subAgentQueueRef = useRef<Record<string, any>[]>([]);
  const subAgentTypingRef = useRef(false);

  // One live stream at a time. Without this, sending a new message while a
  // previous run is still streaming leaves BOTH streams dispatching into the
  // same Redux store — the old run's todo/sub-agent/file events keep
  // overwriting the new run's UI state (stale task list, phantom progress),
  // and the old run keeps burning API quota in the background. Aborting the
  // fetch also cancels the server-side graph run via req.signal.
  const streamAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => streamAbortRef.current?.abort();
  }, []);

  const typeNextThinking = () => {
    if (thinkingQueueRef.current.length === 0) {
      thinkingTypingRef.current = false;
      return;
    }

    thinkingTypingRef.current = true;

    const chunk = thinkingQueueRef.current
      .splice(0, 80)
      .join("");
    dispatch(appendToAssistantThinking(chunk));
    setTimeout(typeNextThinking, 2);
  };


//   const typeNext = () => {
//   if (queueRef.current.length === 0) {
//     typingRef.current = false;
//     return;
//   }

//   typingRef.current = true;

//   const remaining = queueRef.current.length;

//   const chunkSize =
//     remaining > 2000 ? 200 :
//     remaining > 1000 ? 120 :
//     remaining > 500 ? 80 : 40;

//   const chunk = queueRef.current.splice(0, 10).join("");

//   dispatch(appendToLastAiMessage(chunk));

//   // requestAnimationFrame(typeNext);
//    setTimeout(typeNext, 2);
// };







  // Helper: decide how many words to pull from the queue
const getChunkSize = (remaining: number): number => {
  // Larger queues get bigger chunks, smaller queues get smaller chunks
  if (remaining > 2000) return 200;
  if (remaining > 1000) return 120;
  if (remaining > 500)  return 80;
  return 40;               // default for modest queues
};

const typeNext = () => {
  // If nothing left to type, stop the animation
  if (queueRef.current.length === 0) {
    typingRef.current = false;
    return;
  }

  typingRef.current = true;

  // How many words are still waiting to be typed?
  const remaining = queueRef.current.length;

  // Determine the appropriate chunk size for this moment
  const chunkSize = getChunkSize(remaining);

  // Pull the next chunk from the queue
  const chunk = queueRef.current.splice(0, chunkSize).join("");

  // Append the chunk to the AI message displayed in the UI
  dispatch(appendToLastAiMessage(chunk));

  // Continue typing – you can use requestAnimationFrame or a short timeout.
  // Using a timeout of 2 ms keeps the UI responsive without hogging the main thread.
  setTimeout(typeNext, 2);
};




  const typeSubAgentNextContent = () => {
    if (subAgentQueueRef.current.length === 0) {
      subAgentTypingRef.current = false;
      return;
    }

    subAgentTypingRef.current = true;

    // Each queued item is a whole chunk from a (possibly different) sub-agent —
    // not a character queue like the main message typing effect. Every item must
    // be dispatched, or most of the streamed content silently disappears.
    const chunk = subAgentQueueRef.current
      .splice(0, 18);

    chunk.forEach((obj):any => {
      dispatch(appendToLastAIMessageSubAgent(obj as any));
    });

    setTimeout(typeSubAgentNextContent, 4);
  };


  const sendMessage = async () => {


    const userMessage = input.trim()

    queueRef.current = [];
    subAgentQueueRef.current=[]
    thinkingQueueRef.current=[]
    setInput("")



    dispatch(
      addUserAndAiPlaceholder({
        role: "ai",
        userId,
        thinking: "",
        threadId,
        content: userMessage,
        sub_agent: []
      })
    );

    // Kill any still-open previous stream before starting a new one — this
    // also cancels its server-side run (route.ts threads req.signal into
    // graph.stream), so the old run stops instead of running orphaned.
    streamAbortRef.current?.abort();
    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    try {
      setLoading(true)
       dispatch(subAgentWorking(true))

      const res = await fetch("/api/agent/streams/v1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage, userId, threadId }),
        signal: abortController.signal,
      });

      if (!res.body) return;



      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Handle data events
          if (trimmed.startsWith("data:")) {
            const payload = trimmed.replace("data:", "").trim();
            if (!payload) continue;

            const data = JSON.parse(payload);

            //  queue valid messages 
            if (data.message !== undefined && data.message !== null) {
              // push each character
              for (const char of data.message) {
                queueRef.current.push(char);
              }

              if (!typingRef.current) {
                typeNext();
              }
            }


            // browser_image
            if (data.browser_image !== undefined && data.browser_image !== null) {
              const jsonPayload = data?.browser_image
              dispatch(addAgentImage(jsonPayload))
            }

            // browser_image

            // generated document (pptx/xlsx/docx/pdf)
            if (data.agent_document !== undefined && data.agent_document !== null) {
              dispatch(addAgentDocument(data.agent_document))
            }



            //  queue sub agents
            if (data.sub_agent !== undefined && data.sub_agent !== null) {
              const jsonPayload = data?.sub_agent
              subAgentQueueRef.current.push(jsonPayload);
              if (!subAgentTypingRef.current) {
                typeSubAgentNextContent();
              }
            }

            // write file
            if (data.write_file !== undefined && data.write_file !== null) {
              const jsonPayload = data?.write_file
              dispatch(addAgentFile(jsonPayload))
            }

            // read file
            if (data.read_file !== undefined && data.read_file !== null) {
              const jsonPayload = data?.read_file
              dispatch(addAgentFile(jsonPayload))
            }

            // image



            //  todos
            if (data.todo_list !== undefined && data.todo_list !== null) {
              try {
                const jsonPayload = JSON.parse(data?.todo_list?.todoList) as any

                dispatch(clearTodos())
                dispatch(addTodos(jsonPayload))

                // Same as update_todo below: mirror it into the file viewer so
                // the todo file shows up in Agent Computer from the moment it's
                // created, not just after the first later update.
                if (data?.todo_list?.filename) {
                  dispatch(addAgentFile({
                    filename: data.todo_list.filename,
                    content: data.todo_list.todoList
                  }))
                }
              } catch (error) {
                console.log('failed to parse todos')
              }
            }

            if (data.update_todo !== undefined && data.update_todo !== null) {
              try {
                const jsonPayload = data?.update_todo
                console.log("update todos :: ", jsonPayload)
                dispatch(updateTodos(jsonPayload))

                // Refresh the file viewer with the current on-disk state so it
                // doesn't keep showing the stale snapshot from when the todo
                // file was first written.
                if (jsonPayload?.filename && jsonPayload?.todoList) {
                  dispatch(addAgentFile({
                    filename: jsonPayload.filename,
                    content: jsonPayload.todoList
                  }))
                }
              } catch (error) {
                console.log('failed to parse todos')
              }
            }




            // Thinking
            if (data.thinking !== undefined && data.thinking !== null) {

              // push each character
              for (const char of data.thinking) {
                thinkingQueueRef.current.push(char);
              }

              if (!thinkingTypingRef.current) {
                typeNextThinking();
              }

            }

          }


          // Handle event types: end / error
          else if (trimmed.startsWith("event:")) {
            const eventType = trimmed.replace("event:", "").trim();


            if (eventType === "updateThread") {
              if (userId) {
                dispatch(fetchThreads(userId))
              }
            }


            if (eventType === "end") {
              setLoading(false)
              dispatch(subAgentWorking(false))
              reader.cancel(); // stop reading
            }

            if (eventType === "error") {
              setLoading(false)
               dispatch(subAgentWorking(false))
              reader.cancel();
            }
          }
        }
      }
    } catch (err) {
      // A superseded stream (aborted because a newer message was sent) is not
      // an error — and it must not touch loading state that now belongs to the
      // newer stream.
      if ((err as Error)?.name === "AbortError") return;
      setLoading(false)
       dispatch(subAgentWorking(false))
      console.error("Fetch streaming error:", (err as Error).message);
    } finally {
      // Only the latest send owns the loading flags; an older, aborted
      // invocation finishing late must not reset them mid-run.
      if (streamAbortRef.current === abortController) {
        dispatch(subAgentWorking(false))
        setLoading(false)
      }
    }
  };

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    // Only scroll if loading is currently true
    if (messages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);










    function runAgentSimulation(dispatch: any) {

      const events = [
        () => dispatch(addAgentImage({
          src: "http://localhost:8000/img/img-1.jpg"
        })),


        () => dispatch(addAgentFile({
          filename: "todolist.md",
          content: `## [Time: 21:20:42] Role: Assistant
  Got it, Ben! Let me know if you’d like any more examples, tweaks to the prompts, or help with another part of your Reflexion agent. I’m here whenever you need.

  ## [Time: 21:23:23] Role: User
  th

  ## [Time: 21:23:30] Role: Assistant
  Got it, Ben. It looks like your last message got cut off. Could you let me know what you’d like help with? Whether it’s tweaking the hallucination‑checking prompt, adding more details to the Reflexion agent, or anything else, just let me know!
  `
        })),
        () => dispatch(addAgentImage({
          src: "http://localhost:8000/img/img-2.jpg"
        })),
        () => dispatch(addAgentFile({
          filename: "server.js",
          content: `const express = require('express');

  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello from AI server');
  });

  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });`
        })),

        () => dispatch(addAgentFile({
          filename: "database.ts",
          content: `import { PrismaClient } from "@prisma/client";

  const prisma = new PrismaClient();

  export async function getUsers() {
    return await prisma.user.findMany();
  }

  export async function createUser(data:any) {
    return await prisma.user.create({ data });
  }`
        })),

        // big typing test
        () => dispatch(addAgentFile({
          filename: "massive_agent_system.ts",
          content: Array.from({ length: 30 })
            .map((_, i) => `export class AgentModule${i} { constructor(){ this.active=true } }`)
            .join("\n")
        })),



        () => dispatch(addAgentFile({
          filename: "agentWorker.ts",
          content: `export async function runAgentTask(task:string) {
    console.log("Agent started:", task);

    const result = await fetch("https://api.example.com/process", {
      method: "POST",
      body: JSON.stringify({ task })
    });

    const data = await result.json();

    return data;
  }`
        })),


      ];

      let index = 0;

      const interval = setInterval(() => {
        if (index >= events.length) {
          clearInterval(interval);
          return;
        }

        events[index++]();

      }, 1000); // simulate AI streaming every 3 sec
    }


return (
  <div className="flex h-full w-full flex-col bg-background">

    <ViewReportModal />

    {/* Messages area */}
    <div
      ref={scrollContainerRef}
      className={cn(
        "flex-1 overflow-y-auto py-4 space-y-4",
        chatPanelPadding === "chat" ? "px-48" : "px-10"
      )}
    >
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} loading={loading} />
      ))}

      <div ref={bottomRef} className="mb-10" />
    </div>

    {/* Input (fixed bottom) */}
    {/* <button onClick={() => runAgentSimulation(dispatch)}>test simulation</button> */}

    <div className="border-t border-border bg-background">
      <ChatInput
        chatPanelPadding={chatPanelPadding}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        loading={loading}
      />
    </div>

  </div>
);
}



