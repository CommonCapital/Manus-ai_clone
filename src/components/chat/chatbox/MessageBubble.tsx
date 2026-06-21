'use client'
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import {memo, useState} from 'react';
import { ConvertMarkdownToText } from './ConvertMarkdownToText';
import { ChatMessage } from '@/lib/api/threads';


export const MessageBubble = memo(function MessageNunnle({
    message, loading
}: {
    message: ChatMessage[];
    loading: boolean;
}) {


    const isUser = message?.role === "user";
    const [showThinking, setShowThinking] = useState(false);

    return (
       <div
       className={cn(
"flex group",
isUser ? "justify-end" : "justify-start"
       )}
       >
<div
className={cn(
    "max-w-[75%] rounded-2xl px-4 py-3 text-sm relative",
    isUser 
    ? "bg-slate-200 text-gray-900 rounded-br-sm"
    : "text-slate-800 rounded-bl-sm"
)}
>
    {!isUser && (
        <p className='mb-1 text-[11px] font-semibold text-slate-500'>
            AI
        </p>
    )}
    {/** THINKING TOGGLE (Ai only ) */}




{!isUser && message?.thinking && (
    <div className="mb-2">
        <button
onClick={() => setShowThinking((v) => !v)}
className="flex items-center gap-1 text-xs text-slate-500 hover:text-gray-600"
        >
{showThinking ? (
<ChevronDown size={14}/>
): (
<ChevronRight size={14} />
)}


{loading && showThinking && (
    <Loader2 size={12} className="ml-1 animate-spin text-slate-400"/>
)}
Thinking
        </button>
{showThinking && (
      <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 italic border-l-2 border-slate-300">
        {message.thinking}
      </div>
    )}


    </div>
)}

{isUser ? (
    <p className="whitespace-pre-line leading-relaxed">
{message?.content}
    </p>
):(
    <div className="prose prose-sm max-w-none leading-relaxed">
        <ConvertMarkdownToText text={message.content} />
    </div>
)}



</div>
       </div> 
    )

})