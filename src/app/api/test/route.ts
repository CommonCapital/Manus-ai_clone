
import { testDeepAgent } from "@/lib/deepAgent/deepAgent";
import { write_file, read_file, edit_file, ls, grep, glob } from "@/lib/deepAgent/fsTools";
import { get_next_runnable_tasks, read_todos, update_todos, write_todos } from "@/lib/deepAgent/todoTools";
import { graph } from "@/lib/graph/graph";
import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memo/MemoryAgent";
import { generateThreadTitleTool } from "@/lib/tools/threadTools";

import { NextResponse } from "next/server";
import path from "path";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { retrieveRelevantLTMTool } from "@/lib/memo/tools/retrieveLTMTool";


export async function GET(req: Request) {
  try {
// Initialize the stealth plugin


    // const llm = LLM.getInstance("cerebras")

    // const res=await ls.invoke({path:"skills"})

    // const res=await read_file.invoke({"filename":"/skills","offset":0,"limit":200})

    // const r=await retrieveRelevantLTMTool.invoke({query:"ben's preffered programming languages"})

  

    return NextResponse.json(
      { message: "task created " },
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message },
      { status: err?.status || 500 }
    );
  }
}





