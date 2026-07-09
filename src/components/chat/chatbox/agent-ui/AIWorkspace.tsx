"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  PanelLeftClose,
  PanelRightClose,
  Plus,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import TaskCard from "./TaskCard";
import { SubAgentVerticalUI } from "./SubAgentVerticalUI";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";

export interface AgentData {
  sub_agent_name: string;
  content?: string;
  loading?: boolean;
}
export default function AIWorkspace() {
  
 const dispatch = useDispatch<AppDispatch>();

  // runAgentSimulation
    const {  leftPanel,} = useSelector(
      (state: RootState) => state.chat
    )
  const [menuOpen, setMenuOpen] = useState(leftPanel==="aiworkspace"?true:false);


   const { messages,todos, error } = useSelector(
      (state: RootState) => state.chat
    )
  
   const lastMessage = messages[messages.length - 1];





 
  useEffect(()=>{
    if(leftPanel==="aiworkspace"){
       setMenuOpen(true)
    }else{
      setMenuOpen(false)
    }
   
  },[leftPanel])


return (
  <div className="relative flex h-full">
    {/* SIDEBAR */}
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out overflow-hidden shadow-sm",
        menuOpen ? "w-82 translate-x-0" : "w-0 -translate-x-full opacity-0"
      )}
    >
      <div className="flex h-full flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles size={16} className="text-primary" />
            AI Workspace
          </h2>
        </div>

        {/* THREAD LIST */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          <div className="text-xs font-semibold text-muted-foreground mb-2">
            Ongoing Tasks
          </div>

          <TaskCard todos={todos} />

          {/* AGENT SECTION */}
          <div className="mt-6 border-t border-border pt-4">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              Running Agents
            </div>

            <SubAgentVerticalUI agents={lastMessage?.sub_agent} />
          </div>
        </div>

      </div>
    </aside>
  </div>
);
}