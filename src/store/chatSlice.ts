import { ChatHistoryReturnType, ChatMessage, fetchChatHistory, IFetchChatHistoryType } from "@/lib/api/threads";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";


type ChatState = {
messages: ChatMessage[];
loading: boolean;
error: string | null;
};

const initialState: ChatState = {
messages: [],
loading: false,
error: null,
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
       
        thinking: ""
        },
        {
          role: "ai",
          content: "",
          thinking: "",
          threadId: action.payload.threadId,
          userId: action.payload.userId
           }


    )
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
}
    },
    extraReducers: (builder) => {
        builder
        .addCase(getChatHistory.pending, (state) => {
            state.loading = true;
            state.error = null;
    })
    .addCase(getChatHistory.fulfilled, (state,action) => {
        state.loading = false;
        state.messages = action.payload.messages
    })
    .addCase(getChatHistory.rejected, (state,action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
    });
    },
});

export const { appendToAssistantThinking, appendToLoastAiMessage, addUserAndAiPlaceholder }  = chatSlice.actions;
export default chatSlice.reducer;
