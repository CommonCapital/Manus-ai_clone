// store/chatSlice.ts
import { ChatHistoryReturnType, ChatMessage, fetchChatHistory, IFetchChatHistoryType } from "@/lib/api/threads";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from 'uuid';
/**
 * Async thunk
 */
export const getChatHistory = createAsyncThunk<

  ChatHistoryReturnType,
  IFetchChatHistoryType,        // userId
  { rejectValue: string }
>("chat/getHistory", async ({ userId, threadId }, { rejectWithValue }) => {
  try {
    const res = await fetchChatHistory({ userId, threadId });
    return res; // ✅ no Array.isArray needed
  } catch (error) {
    return rejectWithValue("Failed to load chat history");
  }
});

export type TodoStatus = "in_progress" | "pending" | "completed"
export type TodoListType = Array<{ id: string, task: string, status: TodoStatus }>

export type AgentFileType = { filename: string, content: string }

type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  todos: TodoListType
  agent_files: AgentFileType[]
  agent_images: any[]

  // panels
  chatPanelPadding: 'chat' | 'computer'
  leftPanel: "sidebar" | "aiworkspace"
  reportModal: {
    display: boolean,
    content: string
  }

  subAgentWorking:boolean

};

const initialState: ChatState = {
  messages: [],
  todos: [],
  agent_files: [],
  agent_images: [],
  loading: false,
  error: null,

  // right panels
  leftPanel: "sidebar",
  chatPanelPadding: 'chat',
  reportModal: {
    display: false,
    content: ""
  },

  subAgentWorking:false
};


const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {


subAgentWorking(state, action: PayloadAction<boolean>) {
      state.subAgentWorking = action.payload
    },

    
    modifyReportModalContent(state, action: PayloadAction<string>) {
      state.reportModal.content = action.payload
    },

    toggleViewReportModal(state) {
      state.reportModal.display = !state.reportModal.display
    },

    clearChat(state) {
      state.messages = [];
    },
    toggleLeftPanels(state) {
      state.leftPanel === "sidebar" ?
        state.leftPanel = "aiworkspace"
        : state.leftPanel = "sidebar"
    },

    toggleChatPanelPadding(state, action: PayloadAction<"computer" | "chat">) {
      state.chatPanelPadding === "chat" ?
        state.chatPanelPadding = "computer"
        : state.chatPanelPadding = "chat"
    },

    addUserAndAiPlaceholder(
      state,
      action: PayloadAction<ChatMessage>
    ) {
      state.messages.push(
        {
          role: "user",
          content: action.payload.content,
          userId: action.payload.userId as any,
          threadId: action.payload.threadId,
          thinking: "",
          sub_agent: []
        },
        {
          role: "ai",
          content: "",
          thinking: "",
          threadId: action.payload.threadId,
          userId: action.payload.userId as any,
          sub_agent: []
        }
      );
    },



    addAgentFile(
      state,
      action: PayloadAction<AgentFileType>
    ) {
      state.chatPanelPadding = "computer"
      state.agent_files.push(action.payload);
    },


    addAgentImage: (state, action: PayloadAction<{ src: string }>) => {
      state.chatPanelPadding = "computer"
      state.agent_images.push({
        id: uuidv4(),
        type: "image",
        src: action.payload.src,
        created_at: Date.now()
      });
    },




    appendToLastAIMessageSubAgent(
      state,
      action: PayloadAction<{
        sub_agent_name: string;
        content: string;
      }>
    ) {
      state.leftPanel = "aiworkspace"
      const last = state.messages[state.messages.length - 1];

      if (!last || last.role !== "ai") return;

      const existing = last.sub_agent.find(
        (sa: any) => sa.sub_agent_name === action.payload.sub_agent_name
      );


      if (existing) {
        // ✅ Update content
        existing.content += action.payload.content;
      } else {
        //  Insert new sub-agent
        last.sub_agent.push({
          sub_agent_name: action.payload.sub_agent_name,
          content: action.payload.content,
        });
      }
    } ,



    appendToLastAiMessage(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1];
      if (last?.role === "ai") {
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
      state,
      action: PayloadAction<TodoListType>
    ) {
      state.leftPanel = "aiworkspace"
      state.todos.push(...action.payload);
    },

    updateTodos(
      state,
      action: PayloadAction<{
        updates: { id: string; status: TodoStatus }[];
      }>
    ) {
      action.payload.updates.forEach((update) => {
        const todo = state.todos.find((t: any) => t.id === update.id);
        if (todo) {
          todo.status = update.status;
        }
      });
    },

  },
  extraReducers: (builder) => {
    builder
      .addCase(getChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages


      })
      .addCase(getChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export const { subAgentWorking,toggleViewReportModal,modifyReportModalContent, toggleChatPanelPadding, toggleLeftPanels, clearTodos, addTodos, addAgentFile, addAgentImage, updateTodos, appendToLastAIMessageSubAgent, appendToAssistantThinking, appendToLastAiMessage, addUserAndAiPlaceholder } = chatSlice.actions;
export default chatSlice.reducer;
