import path from "path";
import {tool} from "@langchain/core/tools";
import {z} from "zod";
import {v4 as uuidv4} from "uuid"
import fs from 'fs'
import { TruckElectricIcon } from "lucide-react";
const ROOT = process.cwd();
const THREAD_HISTORY_FILE = path.join(ROOT, "public", "threads")
const HISTORY_FOLDER = path.join(ROOT, 'public', 'chat-history')

if (!fs.existsSync(THREAD_HISTORY_FILE)) {
    fs.mkdirSync(THREAD_HISTORY_FILE, {recursive: true});

}


const THREAD_FILE = path.join(THREAD_HISTORY_FILE, "threads.json")

const HISTORY_FILE = path.join(HISTORY_FOLDER, "chat-history.json")


export const threadSchema = z.object({
    userId: z.string(),
    threadId: z.string(),
    title: z.string(),
    active: z.boolean(),
    createdAt: z.string(),
});

export const createdThreadHistoryTool = tool(
    async ({userId, title}) => {
        try {
let threads: any[] = [];
if (fs.existsSync(HISTORY_FILE)) {
    const data = fs.readFileSync(HISTORY_FILE, "utf-8");
    threads = JSON.parse(data);
}

threads = threads.map((t: any) => {
    if (t.userId === userId && t.active === true) {
        return {...t, active: false};
    }
    return t;
});
const newThread = {
    userId, 
    threadId: uuidv4(),
    title: title || "New Threads",
    active: true,
    createdAt: new Date().toISOString(),
};
threads.push(newThread);

fs.writeFileSync(
    HISTORY_FILE,
    JSON.stringify(threads, null, 2),
    "utf-8"
);

return JSON.stringify(newThread);
        } catch (error) {
 console.error("Create threads error:",error);
 return "Failed to create thread.";
        }
    },
    {
        name: "create_thread",
        description: 
        " Create a new thread. If an active thread exists, deactivate it and create a new one",
        schema: z.object({
            userId: z.string(),
            title: z.string().optional(),

        }),
    }
);



export const readThreadTool = tool(
    async ({userId, threadId}) => {
        try {
 if (!fs.existsSync(HISTORY_FILE)) {
    return "[]";
 }

 const data = fs.readFileSync(HISTORY_FILE, "utf-8");

 const threads = JSON.parse(data);

 let threadFound = false;

 const updatedThreads = threads.map((t:any) => {
    if (t.userId === userId) {
    if (t.threadId === threadId) {
        threadFound = true;
        return {...t, active: true}

    }
    return {...t, active: false};
    }
    return t;
 });
 if (!threadFound) {
    return "Thread not found";
 }


 fs.writeFileSync(
    HISTORY_FILE,
    JSON.stringify(updatedThreads, null,2),
    "utf-8"

 );

 const userThreads = updatedThreads.filter(
    (t:any) => t.userId === userId
 );

 return JSON.stringify(userThreads);



        } catch (error) {
console.error("Read thread error:", error);
return "[]";
        }
    },
    {
        name: "read_threads",
        description: 
        "Retrieve all threads for a user and activate a specific thread",
        schema: z.object({
            userId: z.string(),
            threadId: z.string(),
        })
    }
)

export const updateThreadTitleTool = tool(
    async ({userId, threadId, title}) => {
        try {
            if (!fs.existsSync(HISTORY_FILE)) {
                return "Thread file not found."
            }

            const data = fs.readFileSync(HISTORY_FILE, "utf-8");
            const threads = JSON.parse(data);

            const threadIndex = threads.findIndex(
                (t: any) => t.userId === userId && t.threadId === threadId
            );

            if (threadIndex === -1) {
                return "Thread not found.";
            }
            threads[threadIndex].title = title;

            fs.writeFileSync(
                HISTORY_FILE,
                JSON.stringify(threads, null, 2),
                "utf-8"
            );

            return "Thread title updated successfully."
        } catch (error) {
            console.error("Update title error:", error);
            return "Failed to update thread title.";
        }
    },
    {
        name: "update_thread_title",
        description:
        "Update the title of a specific thread using userId and threadId",
        schema: z.object({
            userId: z.string(),
            threadId: z.string(),
            title: z.string(),
        })
    }
);

export const getAllThreadsByUserTool = tool(
    async ({userId}: {userId: string}) => {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            fs.writeFileSync(HISTORY_FILE, "[]", "utf-8") ;
        }

        const data = fs.readFileSync(HISTORY_FILE, "utf-8");
        const threads = JSON.parse(data);

        let userThreads = threads.filter(
            (t:any) => t.userId === userId && !("role" in t)
        );


        if (userThreads.length === 0) {
           const newThread = {
            threadId: uuidv4(),
            userId,
            title: "New Thread",
            createdAt: new Date().toISOString(),
            active: true
           } ;
           threads.push(newThread)
           fs.writeFileSync(HISTORY_FILE, JSON.stringify(threads, null,2));
           userThreads = [newThread]
        }
       let activeThread = userThreads.find((t: any) => t.active);
if (!activeThread) {
    activeThread = userThreads[0];
    activeThread.active = true; // already mutates the same object inside `threads`
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(threads, null, 2));
}
return {
    threads: userThreads,
    redirectThreadId: activeThread.threadId,
};



        


    } catch (error) {
        console.error("Get threads error:", error);
        return {threads: [], redirectThreadId: null} ;
    }
    },
    {
        name: "get_all_threads_by_user",
        description: "Return all threads belonging to a specific user without modifying their active",
        schema: z.object({
userId: z.string(),
        })

    }
);




export const generateThreadTitleTool = tool(
    async({userId, threadId, llm}:any) => {
        try {
          if (!fs.existsSync(HISTORY_FILE)) {
            return false
          } 
          const historyRaw = fs.readFileSync(HISTORY_FILE, 'utf-8');
          const history = JSON.parse(historyRaw);
        const historyMessages = history.filter(
            (m:any) => m.userId === userId && m.threadId === threadId
        );

        if (historyMessages.length ===3) {
            const firstTwo = historyMessages.slice(0,2).map((m:any) => `role:${m.role} content:${m.content}`)
            .join("\n");
if (!firstTwo) {
    return false
}
            const response = await llm.invoke([
                {
                    role: "system",
                    content:
                    "Generate a very short (3-6 words) title, summarizing this conversation. "
                },
                {
                    role: "user",
                    content: firstTwo
                },
            ]);
            const generatedTitle = response.content.trim();
            const threadsRaw = fs.readFileSync(THREAD_FILE, "utf-8");
            const threads = JSON.parse(threadsRaw);

            const updatedThreads = threads.map((t:any) => {
                if (t.threadId === threadId && t.userId === userId) {
                    return {...t, title: generatedTitle};
                }
                return t;
            });


            fs.writeFileSync(
                THREAD_FILE,
JSON.stringify(updatedThreads, null,2),
'utf-8'
            );

            console.log(`Thread title updated to:${generatedTitle}`);

            
            return true;
        }

        return false
        } catch (error) {
console.error("Title generation error:",error);
return "Failed to generate thread title."
        }
    },
    {
        name: "GenerateThreadTitle",
        description:
        "Generate a short conversation title based on first two user messages and update title",
        schema: z.object({
           
                userId: z.string(),
                threadId: z.string(),
                llm: z.any(),
            
        })
    }
)