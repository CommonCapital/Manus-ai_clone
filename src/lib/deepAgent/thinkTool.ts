import { tool } from "langchain"
import { describe } from "node:test"
import z from "zod"


export const think_tool = tool(
    async ({reflection}:any, config:any) => {
        return `Reflection recorded: ${reflection}`
    },
    {
        name: "think_tool",
        description: `Strategic reflection tool for research planning.
        Use this tool after each search/file read to analyze results and plan next steps systematically
        This creates a deliberate pause in the research workflow for quality decision-making

        When to use:
        - After receiving search/grep results: What key information did I find?
        - Before deciding next steps: Do I have enough to answer comprehensively?
        - When assessing research gaps: What specific information am I still missing?
        - Before concluding research: Can I provide a complete answer now?
        `,
        schema: z.object({
reflection: z.string().describe(
    "Your detailed reflection addressing: 1. Analysis of findings, 2. Gap assessment, 3. Quality evaluation"
)
        })
    }
)