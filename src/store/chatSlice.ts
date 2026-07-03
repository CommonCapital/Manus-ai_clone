import { ChatHistoryReturnType, ChatMessage, fetchChatHistory } from "@/lib/api/threads";
import type { IFetchChatHistoryType } from "@/lib/api/threads";
import {v4 as uuidv4} from "uuid";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
export type TodoStatus = "in_progress" | "pending" | "completed"
export type TodoListType = Array<{id:string, task:string, status:TodoStatus}>
export type AgentFileType={filename:string, content:string}
type ChatState = {
messages: ChatMessage[];
loading: boolean;
streamingLoading: boolean;
error: string | null;
todos:TodoListType,
agent_files: AgentFileType[],
agent_images: any[],
};

const initialState: ChatState = {
messages: [],
todos: [],
loading: false,
streamingLoading: false,
error: null,
agent_files: [],
agent_images: [],

}


export const getChatHistory = createAsyncThunk<
ChatHistoryReturnType,
IFetchChatHistoryType,
{rejectValue: string}
>("chat/getHistory", async ({userId, threadId}, {rejectWithValue}) => {
    try {
        const res = await fetchChatHistory({userId, threadId});
        return res;
    } catch (error) {
        return rejectWithValue("Failed to load chat history");
    }
});


const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
clearChat(state) {
    state.messages = [];
},
addUserAndAiPlaceholder(
    state,
    action: PayloadAction<ChatMessage>
) {
    state.messages.push(
        {
            role: "user",
            content: action.payload.content,
            userId: action.payload.userId,
        threadId: action.payload.threadId,
       
        thinking: "",
        sub_agent: []
        },
        {
          role: "ai",
          content: "",
          thinking: "",
          threadId: action.payload.threadId,
          userId: action.payload.userId,
           sub_agent: []
           }


    )
},
addAgentFile(
    state, action: PayloadAction<AgentFileType>
) {
    state.agent_files.push(action.payload)
},
addAgentImage: (state,action) => {
state.agent_images.push({
    id: uuidv4(),
    type: "image",
    src: action.payload.src,
    created_at: Date.now()
})
},
appendToLastAiMessageSubAgent(state, action: PayloadAction<{sub_agent_name:string; content:string}>) {
const last = state.messages[state.messages.length - 1];
if (!last || last.role !=="ai") return;
const existing = last.sub_agent.find(
    (sa:any) => sa.sub_agent_name === action.payload.sub_agent_name
);
if (existing) {
existing.content += action.payload.content;

} else {
last.sub_agent.push({
    sub_agent_name: action.payload.sub_agent_name,
    content: action.payload.content
})
}
},
appendToLoastAiMessage(state, action: PayloadAction<string>) {
    const last = state.messages[state.messages.length - 1];
    if (last?.role === "ai" ) {
        last.content += action.payload;
    }
},
appendToAssistantThinking(state, action: PayloadAction<string>) {
    const last = state.messages[state.messages.length - 1];
    if (last && last.role === "ai") {
        last.thinking = (last.thinking || "") + action.payload;
    }
},

clearTodos(
    state,
) {
    state.todos = []
},

addTodos(
state, action:PayloadAction<TodoListType>
) {
state.todos.push(...action.payload)
},
updateTodos(
state, action: PayloadAction<{
updates: {id:string; status: TodoStatus}[];
}>
) {
action.payload.updates.forEach((update) => {
const todo = state.todos.find((t:any) => t.id === update.id);
if (todo) {
todo.status = update.status
    }
});
},
setStreamingLoading(state, action: PayloadAction<boolean>) {
state.streamingLoading = action.payload;
},
    

    },
    extraReducers: (builder) => {
        builder
        .addCase(getChatHistory.pending, (state) => {
            state.loading = true;
            state.error = null;
    })
    .addCase(getChatHistory.fulfilled, (state,action) => {
state.loading = false;
state.messages = action.payload.messages.map((m:any) => ({...m, sub_agent: []}))
    })
    .addCase(getChatHistory.rejected, (state,action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
    });
    },
});

export const {clearTodos, updateTodos, addAgentFile,addAgentImage,  addTodos, appendToAssistantThinking, appendToLoastAiMessage, addUserAndAiPlaceholder, appendToLastAiMessageSubAgent }  = chatSlice.actions;
export default chatSlice.reducer;
