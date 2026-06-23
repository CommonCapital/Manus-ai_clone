import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memo/MemoryAgent";
import { MemoryManager } from "@/lib/memo/MemoryManaget";
import { NextResponse } from "next/server";
import path from "node:path";


export async function GET(req:Request) {
    try {
const llm = LLM.getInstance("fireworks")
      const {runAgent}=await createMemoryAgent({model: llm})
const res = await runAgent('What is my favoruote programming language ?')
        return NextResponse.json({res})
    } catch (error) {
        console.error(`Error: ${error}`)
          return NextResponse.json(
      { error: error ?? "Unknown error" },
      { status: 500 });
    }
}