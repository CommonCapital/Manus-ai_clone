"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Cpu, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConvertMarkdownToText } from "../ConvertMarkdownToText";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface AgentData {
  sub_agent_name: string;
  content?: string;
  loading?: boolean; // new optional property
}

const COLORS = [
  { bg: "bg-purple-100", text: "text-purple-600" },
  { bg: "bg-indigo-100", text: "text-indigo-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
];


export const SubAgentVerticalUI = ({ agents }: { agents: AgentData[] }) => {
  if (!agents || agents.length === 0) return null;

  return (
    <div className="my-6 mx-auto animate-in slide-in-from-left-2 duration-500">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="bg-purple-100 p-1 rounded">
          <Sparkles size={16} className="text-purple-500" />
        </div>
        <span className="text-sm font-semibold text-gray-600">
          Specialist Agents: {agents.length}
        </span>
      </div>

      {/* Vertical list */}
      <div className="flex flex-col gap-3">
        {/* {agents.map((agent) => (
          <SubAgentToggleCard key={agent.sub_agent_name} agent={agent} />
        ))} */}


        {agents.map((agent, index) => {
  const color = COLORS[index % COLORS.length];
  return (
    <SubAgentToggleCard
      key={agent.sub_agent_name}
      agent={agent}
      bgColor={color.bg}
      textColor={color.text}
    />
  );
})}
      </div>
    </div>
  );
};
const SubAgentToggleCard = ({
   agent,
    bgColor = "bg-muted",
  textColor = "text-foreground"
 }: { 
  agent: AgentData,
    bgColor? :string,
  textColor?:string
  }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(agent.loading || false);

  // Update processing if parent toggles `loading` prop
  useEffect(() => {
    setIsProcessing(agent.loading || false);
  }, [agent.loading]);

  const handleToggle = () => {
    // If no content and not already processing, simulate processing
    if (!agent.content && !isProcessing) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000); // simulate processing
    }
    setIsExpanded((prev) => !prev);
  };

    const { subAgentWorking } = useSelector(
    (state: RootState) => state.chat
  )

return (
  <div
    className={cn(
      "border rounded-xl shadow-sm transition-all cursor-pointer overflow-hidden",
      "bg-background border-border hover:shadow-md"
    )}
  >
    {/* Header */}
    <div
      onClick={handleToggle}
      className={cn(
        "flex items-center justify-between p-3",
        bgColor ?? "bg-muted" // dynamic background for sub-agent
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-muted relative">
          <Bot className={textColor ?? "text-foreground"} />

         {subAgentWorking && (
  <span
    className={cn(
      "absolute -top-1 -right-1 w-4 h-4 rounded-full animate-spin border-2 text-white",
      true
        ? "border-gray-700 border-t-white " // visible in dark
        : "border-border border-t-primary bg-blue-500"     // light mode
    )}
  />
)}
        </div>

        <h4 className={cn("text-sm font-bold truncate", textColor ?? "text-foreground")}>
          {agent.sub_agent_name}
        </h4>
      </div>

      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {isExpanded ? "▲" : "▼"}
      </span>
    </div>

    {/* Content (togglable) */}
    {isExpanded && (
      <div className="bg-muted p-3 border-t border-border text-foreground text-sm">
        <ConvertMarkdownToText text={agent.content || "No content available."} />
      </div>
    )}
  </div>
);
};