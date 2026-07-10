import {tool , createAgent, createMiddleware} from "langchain";
import {z} from "zod";
import { SystemMessage, HumanMessage } from "langchain";
import {DEFAULT_SUBAGENT_PROMPT, getTaskToolDescription} from "./prompts";


import { toolMonitoringMiddleware, ToolOutputSummarizerMiddleware } from "./middleware";
import { MAX_MODEL_RETRIES, isRateLimitError, sleep, backoffMs } from "./retry";

const taskToolDescription = getTaskToolDescription()

export const createTaskTool = (model:any, config:any={}) => {
    return tool(
        async ({task, sub_agent}: any, toolConfig:any) => {
            let lastError: any = null;

            for (let attempt = 0; attempt < MAX_MODEL_RETRIES; attempt++) {
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
                        // Only stream the subagent's own reasoning/response to the user.
                        // Tool messages (e.g. the browser-summary digests from
                        // ToolOutputSummarizerMiddleware) are meant for the model's own
                        // context, not user-facing chat — mirrors the same filter the
                        // manager's own stream already applies in deepAgent.ts.
                        if (chunk?.type !== 'ai') continue;
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
                    if (!isRateLimitError(error) || attempt === MAX_MODEL_RETRIES - 1) {
                        break;
                    }

                    const wait = backoffMs(attempt);
                    toolConfig.writer({
                        subagent_name: sub_agent,
                        content: `\n[Rate limited, retrying in ${wait / 1000}s (attempt ${attempt + 1}/${MAX_MODEL_RETRIES})...]\n`
                    });
                    await sleep(wait);
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