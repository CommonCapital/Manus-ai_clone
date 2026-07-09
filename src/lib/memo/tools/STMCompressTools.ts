

// src/tools/compressionTools.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatCerebras } from "@langchain/cerebras";
import "dotenv/config";
import { LLM } from "@/lib/llm/LLM";
// const summarizationModel = new ChatCerebras({
//   model: "llama-3.3-70b",
//   temperature: 0.3,
//   apiKey: process.env.CEREBRAS_API_KEY,
// });

const llm = LLM.getInstance("cerebras")



const SYSTEM_PROMPT=`
You are a Memory Compression Agent.

Your task is to compress a full daily chat log into a clean, durable summary.

Rules:
- Remove ALL internal reasoning traces such as <think> blocks.
- Ignore system prompts, tool calls, and assistant planning text.
- Extract only meaningful conversational content.
- Remove timestamps and formatting noise.
- Do NOT rewrite the conversation as dialogue.
- Do NOT add new information.
- Preserve stable user facts.
- Keep summary concise (max 150–250 words).

Output Format (strictly follow this structure):

# Daily Log Summary
Date: {date}
Status: Compressed

## Overview
{1-2 sentence high-level description}

## Key Facts Extracted
- {fact 1}
- {fact 2}
- {fact 3}

## Conversation Summary
{Short narrative summary of meaningful events}

Do not include anything outside this format.
`;


/**
 * summarize_message(message)
 * Take a long message (or concatenated messages) and produce
 * a compact summary suitable for long-term memory.
 */
export const compressSTMTool = tool(
  async ({ message }) => {
    const res = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPT ),
      new HumanMessage(message),
    ]);


    return res?.content;
  },
  {
    name: "summarize_message",
    description: "compress memory",
    schema: z.object({
      message: z
        .string()
        .describe("Raw text or concatenated messages to be summarized."),
    }),
  }
);

