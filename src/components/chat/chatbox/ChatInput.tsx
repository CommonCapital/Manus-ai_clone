"use client";
import { Loader2, SendHorizonal } from "lucide-react";
import React, {memo} from "react";
import UploadFileButton from "./UploadFileButton";
import { cn } from "@/lib/utils";



type ChatInputProps = {
    input: string;
    setInput: (value: string) => void;
    sendMessage: () => void;
    loading: boolean;
   
};


export const ChatInput = memo(
    ({input, setInput, sendMessage, loading, pdfId}: ChatInputProps) => {
return (
    <div className="bg-slate-50 px-60 py-4">
       <div className="rounded-2xl border border-indigo-400 p-3 shadow-sm">
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
placeholder="Ask assistant or use @ to mention PDFs or / to access saved documents"
className="w-full resize-none border-none bg-transparent text-sm outline-none"
/>
<div className="mt-3 flex items-center justify-between">
<UploadFileButton  />
<button
onClick={sendMessage}
disabled={!input.trim() || loading}
className={cn(
    "flex h-9 w-9 items-center justify-center rounded-full transition",
    input.trim() ?
    "bg-indigo-500 hover:bg-indigo-600"
    : "bg-indigo-300 cursor-not-allowed"

)}
>
    {loading ? (
<Loader2 className="h-4 w-4 animate-spin text-white" />
    ): (
        <SendHorizonal className="h-4 w-4 text-white" />
    )}

</button>
</div>
       </div>
    </div>
);
    }
)