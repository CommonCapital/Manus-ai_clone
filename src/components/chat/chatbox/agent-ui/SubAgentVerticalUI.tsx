"use client";

import React, {useState, useEffect} from "react";
import {cn} from "@/lib/utils";
import { Cpu, Sparkles } from "lucide-react";
import { ConvertMarkdownToText } from "../ConvertMarkdownToText";


interface AgentData {
    sub_agent_name: string;
    content?:string;
    loading?:boolean;
}

export const SubAgentVerticalUI = ({agents}:{agents: AgentData[]}) => {
if (!agents || agents.length === 0) return null;

return (
    <div className="my-6 mx-auto animate-in slide-in-from-left-2 duration-500">
<div className="flex items-center gap-2 mb-3 px-1">
<div className="bg-purple-100 p-1 rounded">
<Sparkles size={16} className="text-purple-500" />
</div>
<span className="text-sm font-semibold text-gray-600">
    Specialist Agents: {agents.length}
</span>
</div>


<div className="flex flex-col gap-3">
{agents.map((agent) => (
    <SubAgentToggleCard key={agent.sub_agent_name} agent={agent} />
))}
</div>
    </div>
)
};

const SubAgentToggleCard = ({agent}:{agent:AgentData}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(agent.loading || false);


    useEffect(() => {
        setIsProcessing(agent.loading || false);

    }, [agent.loading]);
const handleToggle = () => {
    if (!agent.content && !isProcessing) {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);

        }, 2000);

    }

    setIsExpanded((prev) => !prev);
};

return  (

    <div
    className={cn(
        "border rounded-xl shadow-sm transition-all cursor-pointer overflow-hidden ",
        "bg-white border-gray-200 hover:shadow-md"
    )}
    >
<div
onClick={handleToggle}
className="flex items-center justify-between p-3"
>
<div className="flex items-center gap-2">
<div className="p-1.5 rounded=md bg-gray-100 relative">
<Cpu className="text-gray-600" />
{true && (
    <span className="absolute -top-1 -right-1 w-3 h-3 border-2 border-gray-200 border-t-blue-500 rounded-full" />
)}
</div>
<h4 className="text-sm font-bold text-gray-800 truncate">
    {agent.sub_agent_name}
</h4>
</div>

<span className="flex items-center gap-2 text-gray-500 text-xs">
{isExpanded ? "Collapse": "Expand"}
</span>

</div>

{isExpanded && (
    <div className="bg-gray-50 p-3 border-t border-gray-200 text-gray-700 text-sm">
        <ConvertMarkdownToText text={agent.content || "No content available."} />
    </div>
)}

    </div>
)
}