'use client'


import {cn} from "@/lib/utils";
import { Sparkles } from "lucide-react";
import {useState} from 'react'
import { TaskCard } from "./TaskCard";
import { SubAgentVerticalUI } from "./SubAgentVerticalUI";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
export interface AgentData {
    sub_agent_name: string;
    content?:string;
    loading?:boolean;
}
export default function AIWorkspace() {
    const [menuOpen, setMenuOpen] = useState(true);


const {messages, todos, error, loading} = useSelector(
    (state:RootState) => state.chat
)
const lastMessage = messages[messages.length - 1];
// Only show sub_agents if we're on an AI message that has content
const activeAgents = loading && lastMessage?.role === "ai" && lastMessage?.sub_agent?.length > 0
    ? lastMessage.sub_agent
    : [];
    return (
        <div className="relative flex h-full">
            <aside
            className={cn(
                "flex flex-col border-r bg-white transition-all duration-300 ease-in-out ",
                menuOpen ? "w-72 translate-x-0 ":"w-0 -translate-x-full opacity-0",
            )}
            >
<div className="flex h-full flex-col">
<div className="flex items-center justify-between px-4 py-3 border-b bg-gray-100">
<h2 className="text-sm font-semibold text-slate-700 flex items-center">
    <Sparkles size={16}/>
    AI Workspace

</h2>
</div>


<div className="flex-1 overflow-y-auto p-3 space-y-2">
<div className="text-xs font-semibold text-slate-500 mb-2">

    Ongoing Tasks





</div>

<TaskCard todos={todos}/>
<div className="mt-6 border-t pt-4">
<div className="text-xs font-semibold text-slate-500 mb-2">
Running Agents
</div>

<SubAgentVerticalUI agents={activeAgents} />
</div>
</div>



</div>

            </aside>

        </div>
    )
}