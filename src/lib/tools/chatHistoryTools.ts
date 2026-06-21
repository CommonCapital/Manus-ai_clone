import { tool } from "@langchain/core/tools";
import  fs  from "fs";
import path from "path";
import z from "zod"
const ROOT = process.cwd()
const CHAT_HISTORY_DIR = path.join(ROOT, "public", "chat-history");
if (!fs.existsSync(CHAT_HISTORY_DIR)) {
fs.mkdirSync(CHAT_HISTORY_DIR, {recursive: true });
}

const HISTORY_FILE = path.join(CHAT_HISTORY_DIR, "chat-history.json")

export const messageSchema = z.object({
role: z.enum(["user", "ai"]),
userId: z.string(),
threadId: z.string(),
content: z.string(),
thinking: z.string().optional(),
});


export const writeToChatHistoryTool = tool(
async ({messages}: {messages: any[]}) => {
    try {
        let history: any[] = [];


        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
            history = JSON.parse(data);
        }

        history.push(...messages);

        fs.writeFileSync(
            HISTORY_FILE,
            JSON.stringify(history, null, 2),
            "utf-8"
        );








        return "Chat histroy written successfully."
    } catch (error) {
return 'Failed to chat history.'
    }
},
{
    name: "WriteToChatHistory",
    description: "Write conversation to chat-history",
    schema: z.object({
        messages: z.array(messageSchema)
    }),
}
);


export const readChatHistroyTool = tool(
    async ({userId, threadId}: any) => {
try {
    if (!fs.existsSync(HISTORY_FILE)) {
        return "[]"
    }

    const data = fs.readFileSync(HISTORY_FILE, "utf-8");
    const history = JSON.parse(data);

    const filtered = history.filter((item: any) => {
        if (userId && threadId) {
            return item.userId === userId && item.threadId === threadId
        }
        return item.userId === userId && item.threadId === threadId
    });
    return JSON.stringify(filtered)
} catch (error) {
    console.error("Memory read error:", error);
    return "[]"
}
    },
    {
        name: "read_memory",
        description: 
        "Retrieve chat history entires for a given user",
        schema: z.object({
            userId: z.string(),
            threadId: z.string(),
        }),
    }
);
