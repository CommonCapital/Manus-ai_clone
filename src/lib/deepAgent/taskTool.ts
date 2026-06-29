import {tool , createAgent, createMiddleware} from "langchain";
import {z} from "zod";
import { SystemMessage, HumanMessage } from "langchain";
import {DEFAULT_SUBAGENT_PROMPT, getTaskToolDescription} from "./prompts";

import { resolveMultipleLabels } from "@base-ui/react/internals/resolveValueLabel";
import { toolMonitoringMiddleware, ToolOutputSummarizerMiddleware } from "./middleware";

const taskToolDescription = getTaskToolDescription()






export const createTaskTool = (model:any, config:any={}) => {
    return tool(
        async ({task, sub_agent}: any, toolConfig:any) => {
            const subagent = createAgent({
                model,
                tools: [...config.tools],
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

        let finalContent  = "";

        for await (const [chunk, metadata] of subagentStream) {
            if (chunk.content) {
                toolConfig.writer({
                    subagent_name: sub_agent,
                    content: chunk.content
                });

                finalContent += chunk.content
            }
        }


        return finalContent
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