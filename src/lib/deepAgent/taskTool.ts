import {tool , createAgent, createMiddleware} from "langchain";
import {z} from "zod";
import { SystemMessage, HumanMessage } from "langchain";
import {DEFAULT_SUBAGENT_PROMPT, getTaskToolDescription} from "./prompts";


import { toolMonitoringMiddleware, ToolOutputSummarizerMiddleware } from "./middleware";

const taskToolDescription = getTaskToolDescription()

const MAX_RETRIES = 3;

const isRateLimitError = (error: any) => {
    const message = String(error?.message ?? "");
    return error?.status === 429 || /429|rate limit/i.test(message);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



export const createTaskTool = (model:any, config:any={}) => {
    return tool(
        async ({task, sub_agent}: any, toolConfig:any) => {
            let lastError: any = null;

            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    const subagent = createAgent({
                        model,
                        tools: [...(config.tools ?? [])],
                        systemPrompt: `${DEFAULT_SUBAGENT_PROMPT}\n\n
                        Once you finish the research you should only return the name of the file
                        \n\nTask: ${task}
                        `,
                        middleware: [toolMonitoringMiddleware, ToolOutputSummarizerMiddleware]
                    });


                    const subagentStream = await subagent.stream(
                        {messages: [new HumanMessage(task)]},
                        {streamMode: "messages"}
                    );

                    let finalContent = "";

                    for await (const [chunk, metadata] of subagentStream) {
                        if (chunk.content) {
                            toolConfig.writer({
                                subagent_name: sub_agent,
                                content: chunk.content
                            });

                            finalContent += chunk.content
                        }
                    }

                    return finalContent;
                } catch (error: any) {
                    lastError = error;

                    // Isolate this subagent's failure so it can't take down the
                    // whole graph stream (one 429 shouldn't kill every other
                    // subagent's in-flight work or the manager's downstream steps).
                    if (!isRateLimitError(error) || attempt === MAX_RETRIES - 1) {
                        break;
                    }

                    const backoffMs = 2000 * (attempt + 1);
                    toolConfig.writer({
                        subagent_name: sub_agent,
                        content: `\n[Rate limited, retrying in ${backoffMs / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...]\n`
                    });
                    await sleep(backoffMs);
                }
            }

            const message = `Subagent "${sub_agent}" failed: ${lastError?.message ?? "unknown error"}`;
            toolConfig.writer({
                subagent_name: sub_agent,
                content: `\n[${message}]\n`
            });

            return `Error: ${message}`;
        },
        {
            name: "task",
            description: taskToolDescription,
            schema: z.object({
                task: z.string().describe("Highly detailed instructions for the subagents"),
                sub_agent: z.string().describe("The name must be unique for each spawn sub-agent")
            })
        }
       
    )
}