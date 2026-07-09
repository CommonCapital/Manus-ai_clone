import fs from "fs"
import {v4 as uuid} from 'uuid'
import path from "path"
import {tool} from "@langchain/core/tools"
import {z} from "zod"


const ROOT = process.cwd()
const BASE_DIR = path.join(ROOT, 'public', 'deep-agent');
const TODO_FILE_NAME = `.todos-${Date.now()}.json`
const TODO_FILE = path.join(
    BASE_DIR,
    TODO_FILE_NAME
);

function resolveTodoFilename(filename: string) {
    return filename.endsWith(".todos.json") ? filename : `${filename}.todos.json`;
}


const InputTaskSchema = z.object({
    key: z.string().optional(),
    task: z.string(),
    assigned_to: z.string(),
    status: z.enum(["pending", "in_progress", "completed", "blocked"])
    .default("pending"),
    parent_id: z.string().optional(),
    dependencies: z.array(z.string()).optional()
});

const StoredTaskSchema = z.object({
    id: z.uuid(),
    tasks: z.string(),
    assigned_to: z.string(),
    status: z.enum(["pending", "in_progress", "completed", "blocked"]),
    parent_id: z.uuid().optional(),
    dependencies: z.array(z.uuid()).optional(),
    created_at:z.string(),
    updated_at:z.string()
});

export const write_todos = tool(
    async ({filename, todos}, toolConfig:any) => {
        try {
            await fs.promises.mkdir(BASE_DIR, {recursive:true});
            const readFileName = resolveTodoFilename(filename)
            const filePath = path.join(BASE_DIR, readFileName);

            const now = new Date().toISOString();
            const withIds = todos.map((t) => ({...t, id: uuid()}));
            const keyToId: Record<string, string> = {};
            withIds.forEach((t) => {
                if (t.key) keyToId[t.key] = t.id;
            });

            const enriched = withIds.map((t) => ({
                id: t.id,
                task: t.task,
                assigned_to: t.assigned_to,
                status: t.status ?? "pending",
                parent_id: t.parent_id ? (keyToId[t.parent_id] ?? t.parent_id) : t.parent_id,
                dependencies: (t.dependencies ?? []).map((dep) => keyToId[dep] ?? dep),
                created_at: now,
                updated_at: now,
            })) ;

const jsonStringTodos = JSON.stringify(enriched, null, 2)
            await fs.promises.writeFile(
                filePath,
                jsonStringTodos,
                "utf8"
            );

            toolConfig.writer({
                todos: "todos",
                todoList: jsonStringTodos
            })

            return `<think>${JSON.stringify({
    message: `TODO list saved file name: ${readFileName}`,
    tasks: enriched
})}</think>`
        } catch(error:any) {
            return `Error writing TODO list: ${error.message}`
        }
    },
    {
        name: "write_todos",
        description: `
        Creates or overwrites a workflow TODO list in the system.
        ### Purpose
        This tool allows the Manager agent to initialize a structured list of tasks for a working sub-agents.
        It ensures all tasks have unique IDs, proper timestamps, and consistent structure.
        It is the starting point for multi-step workflows and subagent orchesration.

        ### Behavior
        - **UUID generation:** Each task is assigned a system-generated "id". You will NOT know this id
          in advance, since it does not exist until this tool runs.
        - **Timestamps:** "created_at" and "updated_at" are automatically set to the current duration.
        - **Dependencies:** If not provided, dependencies defaults to an empty array.
        - **Status:** Defaults to "pending" if not specified.
        - **Parent-child hierarchy:** Supports optional "parent_id" for hierarchical workflows
        - **File naming:** "filename" is the base name; the tool appends ".todos.json"

        ### Same-batch dependencies (IMPORTANT)
        If task B depends on task A and BOTH are being created in this SAME call, you cannot know
        task A's real id yet. Do NOT invent a placeholder id (e.g. "<ID_1>") — it will silently fail
        to resolve. Instead:
        1. Give task A a human-readable "key" (e.g. "research_step").
        2. In task B's "dependencies" array, put that same string ("research_step") instead of an id.
        The tool resolves keys to real ids automatically before saving. Only use real ids in
        "dependencies" when referencing a task that was created in a PREVIOUS write_todos call.

        ### Returned Output
        The tool returns:
        - "message": Confirmation including the generated file name.
        - "tasks": Full array of tasks including generated IDs, allowing AI or other tools to reference.
        ### How to Use
        1. Provide a **base filename** (without extension).
        2. Provide an **array of tasks** with:
        - "task" (string)
        - "assigned_to" (subagent or "me")
        - Optional: "key" (to let other tasks in this same batch depend on it), "status", "dependencies", "parent_id"
        `,


        schema: z.object({
            filename: z.string().describe(
                "Base name of the TODO file (e.g.. 'researchname_todo')" +
                "The tool automatically appends the proper file extension '.todos.json' "+
                "Do not include the extension yourself."

            ),
            todos: z.array(InputTaskSchema)
        }),
    }
);


export const read_todos = tool(
    async ({filename}:any) => {
        try {
const filePath = path.join(BASE_DIR, resolveTodoFilename(filename));

if (!fs.existsSync(filePath)) {
    return "No TODO list found.";
}

const raw = await fs.promises.readFile(filePath, "utf8");
const todos = JSON.parse(raw)
return JSON.stringify(todos, null, 2);
        } catch(error:any) {
return `<think>Error reading TODO list: ${error.message}</think>`
        }
    },
    {
       name: "read_todos",
       description: "Read a workflow TODO list.",
       schema: z.object({
        filename: z.string().describe(`filename containing todolist`)
       }) ,
    }
);

export const update_todos = tool(
    async ({filename, updates}, toolConfig:any) => {
        try {
            const readFileName = resolveTodoFilename(filename);
            const filePath = path.join(BASE_DIR, readFileName);

            if (!fs.existsSync(filePath)) {
                return "No TODO list found."
            }

            const raw = await fs.promises.readFile(filePath, "utf8");
            let todos = JSON.parse(raw);

            updates.forEach((u: any) => {
                const index = todos.findIndex((t:any) => t.id === u.id);
if (index !==-1) {
    todos[index] = {
        ...todos[index],
        ...u,
        updated_at: new Date().toISOString()

    };
}
            });
            const jsonStringTodos = JSON.stringify(todos, null, 2);
            await fs.promises.writeFile(
                filePath,
                jsonStringTodos,
                "utf8"
            );
            toolConfig.writer({
                update_todos: "update_todos",
                filename: readFileName,
                updates: updates,
                todoList: jsonStringTodos
            })
            return "<think>TODO list updated successfully.</think>"
        } catch (error:any) {
            return `Error updating TODO list: ${error.message}`
        }
    },
    {
        name: "update_todos",
        description:
        `
        Updates tasks in a workflow TODO list by their unique IDs.

        This tool is used you want to:
        - Change the status of a task (pending in process completed blocked)
        - Reassign a task to another agent
        - Modify the task description

        **Important Rules:**
        1. The tool updates tasks **strictly by UUID** "id". Do NOT try to identify tasks by name.
        2. Only include fields that need to be changed. Fields not included remain unchanged.
        3. The tool automatially updates the 'updated_at' timestamp to the current time.
        4. Dependencies cannot be modified with this tool - they are read-only in the context

        **Few-Shot Usage Examples (to reduce hallucination):**
        \`\`\`json
{
     "filename": "rag-blog-workflow-001.todos.json"
}
\`\`\`
Returns:
\`\`\`json
[
   {
      "id": "fd33d266-36ff-404e-8b82-3f6b5bbc03ce"
      "task": "Generate TypeScript code examples using LangChain",
      "status": "pending",
      "dependencies": ["24642583-5204-4779-b675-f2fe95d1bd68"],
      "assigned_to": "typescript_expert"
   }
]
\`\`\`

        **Usage Notes for LLMs / Agents:**
        - Always fetch the latest TODO list before updating to avoid overwritting changes.
        - Only pass IDs returned by the "write_todos" or previously saved TODOs.
        - Never try to guess UUIDs - hallucinating IDs will fail.
        - Always include "workflow_id" to specify which workflow to update.

        **Return Value:**
        Returns a message confirming successful updates or an error message if the workflow fails.
 `,

        schema: z.object({
            filename: z.string().describe('filename containing todolist'),
            updates: z.array(
                z.object({
                    id: z.uuid(),
                    task: z.string().optional(),
                    assigned_to: z.string().optional(),
                    status: z.enum(["pending", "in_progress", "completed", "blocked"])
                    .optional(),
                })
            )
        }),
    }
);


export const get_next_runnable_tasks= tool(
async ({filename}:any) => {
const filePath = path.join(BASE_DIR, resolveTodoFilename(filename));
if (!fs.existsSync(filePath)) return "No todolist found.";

const raw = await fs.promises.readFile(filePath, "utf8");
const todos = JSON.parse(raw);

const keyToIdMap: any = {};
todos.forEach((t:any) => {
    if (t.key) keyToIdMap[t.key] = t.id;
});


const runnable = todos.filter((t:any) => {
    if (t.status !== "pending") return false;
    const deps = t.dependencies || [];
    return deps.every((dep:any) => {
        const depId = keyToIdMap[dep] || dep;
        const parent = todos.find((x:any) => x.id === depId);
        // An unresolvable dependency id is a broken reference, not a satisfied one —
        // treat it as blocking rather than silently letting the task run anyway.
        return parent ? parent.status === "completed" : false;
    });
});
return JSON.stringify(runnable, null,2);
},
{
name: "get_next_runnable_tasks",
description: `
Scans a workflow's task list and computes the next set of executable tasks based on dependency resolution rules.

The workflow is treated as a **Directed Acyclic Graph (DAG)**, where:
- Each tasks is a **node**.
- Dependencies represent **directed edges**.
- Execution must respect **topological order**: tasks can only run when all dependencies are completed.



---


### Runnable Task Criteria
A task is considered **runnable** if:
1. \`status === "pending"\`
2. AND either:
    - It has **no dependencies**, or
    - **All dependencies** (by ID or temp key) reference tasks with \`status === "completed"\`


This evaluation is **read-only** and does **not mutate workflow state**.


---


### Why This Tool Exists
- Prevents executing tasks **out of order**, which could cause or inconsistent 
- Ensures **execution safety** for multi-step workflows.
- Enables structured reasoning and **autonomous agent loops**.


---

### Features
- Returns **multiple runnable tasks** for parallel execution.
- Supports **hierarchical workflows** via \`parent_id\`.
- Integrates with **multi-agent systems** via \`skills_required\`.
- Safe for **autonomous loop execution**.


---

### Recomended Agent Execution Loop
\`\`\`python
while True:
    runnable = get_next_runnable_tasks(filename="my_workflow.todos.json")
    if not runnable:
        break
    for task in runnable:
        route_to_skill(task.skill_required)
        execute(task)
        update_todos(workflow_id, updates=[{"id":task.id, "status":"completed" }])
\`\`\`

---

### Few-Shot Usage Examples

**Example 1: Simple runnable task**
\`\`\`json
{
     "filename": "rag-blog-workflow-001.todos.json"
}
\`\`\`
Returns:
\`\`\`json
[
   {
      "id": "fd33d266-36ff-404e-8b82-3f6b5bbc03ce"
      "task": "Generate TypeScript code examples using LangChain",
      "status": "pending",
      "dependencies": ["24642583-5204-4779-b675-f2fe95d1bd68"],
      "assigned_to": "typescript_expert"
   }
]
\`\`\`

**Example 2: Multiple runnable tasks in parallel**
\`\`\`json
{
   filename: "data_pipeline-workflow.todos.json"
}
\`\`\`
Returns:
\`\`\`json
[
  {
     "id": "task-101",
     "task": "Download dataset",
     "status": "pending",
     "dependencies": [],
     "assigned_to": "downloader"
   },
   {
     "id": "task-102",
     "task": "Validate schema",
     "status": "pending",
     "dependencies": [].
     "assigned_to": "validator"
   }
]
\`\`\`

**Example 3: Dependency-resolved task**
\`\`\`json
{
    "filename": "rag-blog-workflow-001.todos.json"

}
\`\`\`
Returns:
\`\`\`json
[
    {
       "id": "6a9e1817-29f9-4a5e-8966-834b9f8b0137",
       "task": "Write SEO-optimized blog draft",
       "status": "pending",
       "dependencies": [
       367b3b88-4176-4042-9b16-ce3300e63af7",
       "ac452b57-2fa6-42fc-9e2e-0e255c2f31a6"
       ],
       "assigned_to": "blog_writer"
    }
]
\`\`\`

---

### Notes for LLMs / Agents
- **Always use UUIDs** or maintain a mapping from human-readable keys to IDs.
- Do **not hallucinate IDs** - tasks with unknown dependencies will be skipped.
- Use this tool **before routing tasks** to subagents or skills.
- Supports **parallel execution**: multiple tasks may be returned if dependencies allow

Returns an *array of task objects** that are safe to execute at this moment.
`,
schema: z.object({
    filename: z.string().describe('filename containing todolist')
}),
}
);

export const todoListTools = [read_todos, update_todos, write_todos, get_next_runnable_tasks]