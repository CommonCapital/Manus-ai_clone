
import { LLM } from "@/lib/llm/LLM";
import { readChatHistoryTool } from "@/lib/tools/chatHistoryTools";
import { NextResponse } from "next/server";



export async function GET(req:Request) {
  try {

  
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") as string
  const threadId = searchParams.get("threadId") as string

    // 1. Validate required fields
    if (  !userId || !threadId) {
      return NextResponse.json(
        { ok: false, message: "userId or threadId are required" },
        { status: 400 }
      );
    }
  

    const retrievedMessages=await readChatHistoryTool.invoke({userId,threadId})
    const messages=JSON.parse(retrievedMessages)

       
  
    return NextResponse.json({ messages });
  } catch (err: any) {

  }
}
