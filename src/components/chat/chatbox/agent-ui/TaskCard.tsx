import React, { useState, useMemo } from "react";
import {
  Check,
  MonitorPlay,
  ChevronDown,
  Compass,
  Maximize2,
  Loader2,
  Circle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { TodoListType, TodoStatus } from "@/store/chatSlice";
import { cn, truncateTitle } from "@/lib/utils";

const TaskCard = ({todos}:{todos:TodoListType}) => {
  const [isExpanded, setIsExpanded] = useState(false);



  // Count completed dynamically
  const completedtodos = useMemo(
    () => todos.filter((t) => t.status === "completed").length,
    [todos]
  );

  // Determine which task to show in collapsed mode
  const activeTask =
    todos.find((t) => t.status === "in_progress") ||
    todos.find((t) => t.status === "pending") ||
    todos[todos.length - 1];



  // Status Icon Renderer
  const StatusIcon = ({ status }:{status:TodoStatus}) => {
    if (status === "completed") {
      return (
        <Check
          size={25}
          strokeWidth={2.5}
          className="text-green-500 mt-0.5"
        />
      );
    }

    if (status === "in_progress") {
      return (
        <Loader2
          size={25}
          className="text-blue-500 animate-spin mt-0.5"
        />
      );
    }

    return <Circle size={18} className="text-gray-300 mt-0.5" />;
  };

  // ---------------- COLLAPSED ----------------
if (!isExpanded) {
  return (
    <div className="w-full max-w-4xl mx-auto flex items-center gap-3 font-sans group">

      <div
        onClick={() => setIsExpanded(true)}
        className="flex-1 flex items-center justify-between bg-background border border-border rounded-lg px-4 py-2 cursor-pointer hover:bg-accent transition-all shadow-sm"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <StatusIcon status={activeTask?.status} />

          <span className="text-foreground text-sm truncate">
            {truncateTitle(activeTask?.task, 20)}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="text-muted-foreground text-xs font-medium">
            {completedtodos} / {todos.length}
          </span>

          <ChevronDown
            size={16}
            className="text-muted-foreground -rotate-90 group-hover:text-foreground transition"
          />
        </div>
      </div>
    </div>
  );
}


// ---------------- EXPANDED ----------------
return (
  <div className="w-full max-w-4xl mx-auto bg-background rounded-2xl p-4 border border-border shadow-md font-sans">

    {/* HEADER */}
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-foreground tracking-wide">
            Agent's Task
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3 text-muted-foreground">
        <button className="p-1.5 hover:bg-accent hover:text-foreground rounded-md transition">
          <MonitorPlay size={20} />
        </button>

        <button
          onClick={() => setIsExpanded(false)}
          className="p-1.5 bg-muted text-foreground rounded-md hover:bg-accent transition"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </div>


    {/* TASK PROGRESS */}
    <div className="rounded-xl border-border">

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-foreground text-sm">
          Task progress
        </h3>

        <span className="text-muted-foreground text-sm">
          {completedtodos} / {todos.length}
        </span>
      </div>


      {/* TASK LIST */}
      <ul className="space-y-3.5 max-h-[178px] overflow-y-auto pr-2">
        {todos.map((task) => {
          const isComplete = task.status === "completed";
          const isInProgress = task.status === "in_progress";

          return (
            <li key={task.id} className="flex items-start gap-3">
              <StatusIcon status={task.status} />

              <span
                className={cn(
                  "text-xs",
                  isComplete
                    ? "text-foreground"
                    : isInProgress
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {truncateTitle(task?.task, 70)}
              </span>
            </li>
          );
        })}
      </ul>

    </div>
  </div>
);
};

export default TaskCard;