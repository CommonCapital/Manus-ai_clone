import {tool , createAgent, createMiddleware} from "langchain";
import {z} from "zod";
import { SystemMessage, HumanMessage } from "langchain";
import {DEFAULT_SUBAGENT_PROMPT, getTaskToolDescription} from "./prompts";


import { toolMonitoringMiddleware, ToolOutputSummarizerMiddleware } from "./middleware";
import { MAX_MODEL_RETRIES, isRateLimitError, sleep, backoffMs } from "./retry";
import { update_todos } from "./todoTools";

const taskToolDescription = getTaskToolDescription()

// Code-enforced todo bookkeeping: the model consistently "forgets" to call
// update_todos after subagents finish, leaving the progress panel stale. The
// task tool itself knows exactly when a subagent starts and finishes, so when
// the model passes the todo coordinates, the status transitions happen here —
// deterministically — instead of depending on the model remembering a separate
// follow-up tool call. update_todos.invoke() inherits the ambient stream writer
// via AsyncLocalStorage, so the UI's progress panel updates too, not just the file.
async function autoUpdateTodo(
    todo_filename: string | undefined,
    todo_id: string | undefined,
    status: "in_progress" | "completed" | "blocked"
) {
    if (!todo_filename || !todo_id) return;
    try {
        await update_todos.invoke({
            filename: todo_filename,
            updates: [{ id: todo_id, status }]
        });
    } catch (error: any) {
        // Bookkeeping must never take down the actual work.
        console.log(`autoUpdateTodo failed (${status} for ${todo_id}): ${error?.message}`);
    }
}

export const createTaskTool = (model:any, config:any={}) => {
    // Scoped to one manager turn (createTaskTool is called once per
    // testDeepAgent() invocation). The UI groups/merges streamed sub-agent
    // content by this exact name (chatSlice.ts's appendToLastAIMessageSubAgent,
    // route.ts's updateSubAgentTracker) — if the model reuses the same
    // sub_agent name across multiple spawns (e.g. "general-purpose" for every
    // task, which the tool description's own example text invites), those
    // spawns silently collapse into one card and their content interleaves.
    // The schema says the name "must be unique" but nothing enforced it —
    // this guarantees it regardless of what the model actually passes.
    const usedSubAgentNames = new Set<string>();

    return tool(
        async ({task, sub_agent, todo_filename, todo_id}: any, toolConfig:any) => {
            let uniqueName = sub_agent;
            let suffix = 2;
            while (usedSubAgentNames.has(uniqueName)) {
                uniqueName = `${sub_agent}-${suffix}`;
                suffix++;
            }
            usedSubAgentNames.add(uniqueName);
            sub_agent = uniqueName;

            await autoUpdateTodo(todo_filename, todo_id, "in_progress");

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
                        // Spread the parent tool config so the subagent inherits the live
                        // stream writer/callbacks — this is what lets nested events from
                        // inside the subagent (e.g. write_file emitted by the browser-
                        // summarizer middleware) propagate up to the SSE stream and appear
                        // in the Agent Computer, instead of being swallowed in an isolated
                        // child context. recursionLimit stays overridden (default 25 is too
                        // low for a real multi-tool task).
                        {...toolConfig, streamMode: "messages", recursionLimit: 75}
                    ) as any;

                    let finalContent = "";

                    for await (const [chunk, metadata] of subagentStream) {
                        // Only stream the subagent's own reasoning/response to the user.
                        // Tool messages (e.g. the browser-summary digests from
                        // ToolOutputSummarizerMiddleware) are meant for the model's own
                        // context, not user-facing chat — mirrors the same filter the
                        // manager's own stream already applies in deepAgent.ts.
                        if (chunk?.type !== 'ai') continue;

                        // A turn that's purely "call this tool" (e.g. several web_search
                        // calls in a row with no narration in between) has empty .content,
                        // so nothing below would ever fire — the UI would look frozen for
                        // the whole stretch despite real work happening. tool_call_chunks
                        // carries the tool name on its first chunk of a call; surface that
                        // as a lightweight activity ping.
                        for (const toolCallChunk of (chunk as any)?.tool_call_chunks ?? []) {
                            if (toolCallChunk?.name) {
                                toolConfig.writer({
                                    subagent_name: sub_agent,
                                    content: `\n[Calling ${toolCallChunk.name}...]\n`
                                });
                            }
                        }

                        if (chunk.content) {
                            toolConfig.writer({
                                subagent_name: sub_agent,
                                content: chunk.content
                            });

                            // Internal digest calls (tagged in summarizeBrowserOutput)
                            // belong in the subagent's dropdown, which the writer above
                            // handles — but not in finalContent, which is the subagent's
                            // "answer" returned to the manager. Without this, digest text
                            // gets spliced into what the manager thinks the subagent said.
                            const isInternal = ((metadata as any)?.tags ?? []).includes("internal_summary");
                            if (!isInternal) {
                                finalContent += chunk.content
                            }
                        }
                    }

                    await autoUpdateTodo(todo_filename, todo_id, "completed");
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

            await autoUpdateTodo(todo_filename, todo_id, "blocked");

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
                sub_agent: z.string().describe("The name must be unique for each spawn sub-agent"),
                todo_filename: z.string().optional().describe(
                    "The todo file this subagent's work belongs to (e.g. 'my_project.todos.json'). " +
                    "ALWAYS pass this together with todo_id when the subagent is executing a task from " +
                    "your TODO list — the system then marks that task in_progress when the subagent " +
                    "starts and completed (or blocked on failure) when it returns, automatically. " +
                    "You do NOT need a separate update_todos call for tasks delegated this way."
                ),
                todo_id: z.string().optional().describe(
                    "The exact id (uuid from write_todos) of the TODO task this subagent is executing."
                )
            })
        }

    )
}