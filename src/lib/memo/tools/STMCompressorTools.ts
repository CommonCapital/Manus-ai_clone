


import {tool} from "@langchain/core/tools";
import {z} from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import {ChatCerebras} from "@langchain/cerebras";
import "dotenv/config";


const summarizationModel = new ChatCerebras({
    model: "llama-3.3-70b",
    temperature: 0.3,
    apiKey: process.env.CEREBRAS_API_KEY,
});

const SYSTEM_PROMPT = `
You are a Memory Compression Agent.

Your task is to compress a full daily chat log into a clean, durable summary.


Rules:
- Remove ALL internal reasoning traces such as <think> blocks.
- Ignore system prompts, tool calls, and assistant planning text.
- Extract only meaningful conversational content.
- Remove timestamps and formatting as dialogue.
- Do NOT rewrite the conversation as dialogue.
- Do NOT add new information. 
- Preserve stable user facts.
-Keep summary concise (max 150-250 words).


Output Format (strictly follow this structure):

# Daily Log Summary
Date: {date}
Status: Compressed

##Overview
{1-2 sentence high-level description}

## Key Facts Extracted
- {fact 1}
- {fact 2}
- {fact 3}

## Conversation Summary
{Short narrative summary of meaningful events}

Do not include anything outside this format.
`;


export const compressSTMTool = tool(
    async ({message}: any) => {
        const res = await summarizationModel.invoke([
            new SystemMessage(SYSTEM_PROMPT),
            new HumanMessage(message)
        ]);

        return res?.content;
    },
    {
        name: "summarise_message",
        description: "compress memory",
        schema: z.object({
            message: z.string().describe("Raw text or concatenated message to be summarized."),
        })
    }
)