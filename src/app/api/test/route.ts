import { TestDeepAgent } from "@/lib/deepAgent/deepAgent";
import { edit_file, glob, grep, ls, read_file, write_file } from "@/lib/deepAgent/fsTools";
import { read_todos, update_todos, write_todos } from "@/lib/deepAgent/todoTools";
import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memo/MemoryAgent";
import { MemoryManager } from "@/lib/memo/MemoryManager";
import { NextResponse } from "next/server";
import path from "node:path";


export async function GET(req:Request) {
    try {
const llm = LLM.getInstance("fireworks")

await TestDeepAgent()
     return NextResponse.json(
        {message: "test created"}
     );
    } catch (error) {
        console.error(`Error: ${error}`)
          return NextResponse.json(
      { error: error ?? "Unknown error" },
      { status: 500 });
    }
}