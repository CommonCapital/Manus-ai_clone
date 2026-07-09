"use client";

import React, { memo } from "react";
import { Loader2, ScreenShareIcon, SendHorizonal,Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatInputButtons from "./ChatInputButtons";



type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  loading: boolean;
  chatPanelPadding: string

};

const ChatInput = memo(
  ({ input, setInput, sendMessage, loading, chatPanelPadding }: ChatInputProps) => {
    return (
      <div
        className={cn(
          "bg-background py-4",
          chatPanelPadding === "chat" ? "px-50" : "px-10"
        )}
      >
        <div className="rounded-2xl border border-border bg-background p-3 shadow-sm">
          
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask assistant, any thing your want"
            className="w-full resize-none border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />

          <div className="mt-3 flex items-center justify-between">
            <ChatInputButtons />

            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={cn(
                "flex h-9 w-9 bg-primary items-center justify-center rounded-full transition-colors",
                input.trim()
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin " />
              ) : (
                <SendHorizonal className="h-4 w-4 text-primary-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
);
export default ChatInput;
