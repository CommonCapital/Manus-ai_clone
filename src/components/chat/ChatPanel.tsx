
'use client';

import { useEffect, useRef, useState } from "react";
import { chatMessages } from "./chatbox/chat";
import { MessageBubble } from "./chatbox/MessageBubble";
import { ChatInput } from "./chatbox/ChatInput";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { addTodos, addUserAndAiPlaceholder, appendToAssistantThinking, appendToLastAiMessageSubAgent, appendToLoastAiMessage, clearTodos, getChatHistory, updateTodos } from "@/store/chatSlice";
import { fetchThreads } from "@/store/threadSlice";
import { tryLoadManifestWithRetries } from "next/dist/server/load-components";
export default function ChatPanel({userId, threadId}: {userId: string, threadId:string}) {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
  




    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch<AppDispatch>();


    const {messages, error} = useSelector(
        (state: RootState) => state.chat
    );
  

    useEffect(() => {
        if (userId && threadId) {
            dispatch(getChatHistory({userId, threadId}));
        }
    }, [userId, threadId, dispatch]);

const queueRef = useRef<string[]>([]);
const typingRef = useRef(false);
const thinkingQueueRef = useRef<string[]>([]);
const thinkingTypingRef = useRef(false);
const subAgentQueueRef = useRef<Record<string, any>[]>([ ]);
const subAgentTypingRef = useRef(false);
const typeNextThinking = () => {
    if (thinkingQueueRef.current.length === 0 ) {
        thinkingTypingRef.current = false;
        return;
    }
    thinkingTypingRef.current = true;
    const chunk = thinkingQueueRef.current.splice(0, 3).join("");
    dispatch(appendToAssistantThinking(chunk));
    setTimeout(typeNextThinking, 12);
};
const typeNext = () => {
    if (queueRef.current.length === 0) {
        typingRef.current = false;
        return;
    }
    typingRef.current = true;

    const chunk = queueRef.current.splice(0, 3).join("");

    dispatch(appendToLoastAiMessage(chunk));
    setTimeout(typeNext, 6)
};
const typeSubAgentNextContent = () => {
if (subAgentQueueRef.current.length === 0) {
    subAgentTypingRef.current = false;
    return;

}
subAgentTypingRef.current = true;
const chunk = subAgentQueueRef.current
.splice(0,1);
const obj = chunk.pop() as any;
dispatch(appendToLastAiMessageSubAgent(obj))
};
const sendMessage = async () => {
    const userMessage = input.trim();

    queueRef.current = []
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


    try {
        setLoading(true)
        const res = await fetch("/api/agent/streams/v1", {
            method: "POST",
            headers: {
                "Content-Type":"application/json",
            },
            body: JSON.stringify({message: userMessage, userId, threadId})
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
            const {value, done} = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, {stream: true});

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                if (trimmed.startsWith("data:")) {
const payload = trimmed.replace("data:", "").trim();
if (!payload) continue;
const data = JSON.parse(payload)

if (data.message !== undefined && data.message !==null) {
    for (const char of data.message) {

        queueRef.current.push(char)
    }

    if (!typingRef.current) {
        typeNext();
    }
}

if (data.sub_agent !== undefined && data.sub_agent !== null) {
    const jsonPayload = data?.sub_agent
    subAgentQueueRef.current.push(jsonPayload)
    if (!subAgentTypingRef.current) {
        typeSubAgentNextContent();
    }
}





if (data.todo_list !== undefined && data.todo_list !== null) {
    try {
const jsonPayload = JSON.parse(data?.todo_list?.todoList) as any


dispatch(clearTodos())
dispatch(addTodos(jsonPayload))
    } catch(error) {
console.log('Failed to parse todos')
    }
}

if (data.update_todo !== undefined && data.update_todo !== null) {
    try {
        const jsonPayload = data?.update_todo
        console.log("Update todos :: ", jsonPayload)
        dispatch(updateTodos(jsonPayload))
    } catch (error) {
        console.log('Failed to parse todos')
    }
}
if (data.thinking !== undefined && data.thinking !==null) {
    for (const char of data.thinking) {
        thinkingQueueRef.current.push(char);
        
}

if (!thinkingTypingRef.current) {
    typeNextThinking();
}

}
                }


                else if (trimmed.startsWith("event:")) {
                    const eventType = trimmed.replace("event:", "").trim();

                    if (eventType === "updateThread" ) {
                        if (userId) {
                            dispatch(fetchThreads(userId))
                        }
                    }


                    if (eventType === "end") {
                        setLoading(false)
                        reader.cancel();
                    }


                    if (eventType === "error") {
                        setLoading(false)
                        reader.cancel();
                    }
                }




                }

        }
    } catch (error) {
        setLoading(false)
        console.error("Fetch streaming error:", (error as Error).message)
    }
};


useEffect(() => {
    if (messages) {
        bottomRef.current?.scrollIntoView({behavior: "smooth"});
    }
}, [messages, loading])

    return (
        <div className="flex h-full w-full flex-col bg-slate-50">

<div
ref={scrollContainerRef}

className="flex-1 overflow-y-auto px-60 py-4 "
>
{messages.map((msg, i) => (
    <MessageBubble key={i} message={msg} loading={loading}/>
))}

<div ref={bottomRef}/>

</div>

            <div className="border-slate-200 bg-white">
<ChatInput
input={input}
setInput={setInput}
sendMessage={sendMessage}
loading={false}

/>
            </div>

        </div>
    )
}