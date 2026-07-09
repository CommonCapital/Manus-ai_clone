import { promises as fs } from "node:fs";
import path from "node:path";
import { tool } from "@langchain/core/tools";
import { success, z } from "zod";
import { UserData } from "../MemoryManager";


// rootDir = "/public/memory"
// relativePath = "../secrets.txt"
// fullPath = "/memory/secrets.txt"

function resolveSafePath(rootDir: string, relativePath: string) {
  const fullPath = path.resolve(rootDir, relativePath);
  const normalizedRoot = path.resolve(rootDir);
  if (!fullPath.startsWith(normalizedRoot)) {
    throw new Error(`Path escapes memory root: ${relativePath}`);
  }
  return fullPath;
}

async function ensureParent(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}
export async function emptyAFile(rootDir: string, relativePath: string) {
  const filePath = resolveSafePath(rootDir, relativePath);
  await ensureParent(filePath);

  // This will create the file if it doesn't exist
  // OR truncate it to empty if it already exists
  await fs.writeFile(filePath, "", { encoding: "utf8", flag: "w" });

  return `File reset (emptied): ${relativePath}`;
}

export async function createAFile(rootDir: string, relativePath: string, content = "") {
  const filePath = resolveSafePath(rootDir, relativePath);
  await ensureParent(filePath);
  await fs.writeFile(filePath, content, { encoding: "utf8", flag: "wx" });
  return `Created file: ${relativePath}`;
}

export async function readAFile(rootDir: string, relativePath: string) {
  try {
    const filePath = resolveSafePath(rootDir, relativePath);
    return fs.readFile(filePath, "utf8");
  } catch (error) {
    console.log("failed to read that file")
  }
}

export async function updateAFile(rootDir: string, relativePath: string, content: string) {
  const filePath = resolveSafePath(rootDir, relativePath);
  await ensureParent(filePath);
  await fs.writeFile(filePath, content, "utf8");
  return `Updated file: ${relativePath}`;
}

export async function appendAFile(rootDir: string, relativePath: string, content: string) {
  const filePath = resolveSafePath(rootDir, relativePath);
  await ensureParent(filePath);
  await fs.appendFile(filePath, content, "utf8");
  return `Appended file: ${relativePath}`;
}

export function buildFilesystemTools(memoryRoot: string, userData: UserData) {


  const createFileTool = tool(
    async ({ fileName, content }) => {
      try {
        return createAFile(memoryRoot, fileName, content);
      } catch (error) {
        return JSON.stringify({ message: "error occur when creating file" })
      }
    },
    {
      name: "createAFile",
      description: "Create a file under memory_system.",
      schema: z.object({
        content: z.string().default(""),
        fileName: z.string().min(1)
      })
    }
  );

  const readFileTool = tool(
    async ({ fileName }) => {

      try {
        const res = await readAFile(memoryRoot, fileName).catch((error) => error)
        if (res.errno) {
          return JSON.stringify({ message: "file your trying to read doesnt exist" })
        }
        return res
      } catch (error) {

        return JSON.stringify({ message: "file your trying to read doesnt exist" })
      }

    },
    {
      name: "readAFile",
      description: "Read a file under memory_system.",
      schema: z.object({
        fileName: z.string().min(1),
      })
    }
  );

  const updateFileTool = tool(
    async ({ fileName, content }) => {
      try {
        return updateAFile(memoryRoot, fileName, content);
      } catch (error) {
        return JSON.stringify({ message: "file your trying to update doesnt exist" })
      }
    },
    {
      name: "updateAFile",
      description: "Create or overwrite a file under memory_system.",
      schema: z.object({
        content: z.string(),
        fileName: z.string().min(1),
      })
    }
  );

  const appendFileTool = tool(
    async ({ fileName, content }) => {
      try {
        return appendAFile(memoryRoot, fileName, content);
      } catch (error) {
        return JSON.stringify({ message: "file your trying to read doesnt exist" })
      }
    },
    {
      name: "appendAFile",
      description: "Append content to a file under memory_system.",
      schema: z.object({
        fileName: z.string().min(1),
        content: z.string(),

      })
    }
  );

  // const writeLTMTool = tool(
  //   async ({ content }) => {
  //     const now = new Date();
  //     const formattedDate = now.toTimeString().slice(0, 8);

  //     const memoryContent = `## [Time: ${formattedDate}] \n${content}\n\n`;

  //     try {
  //       // await appendAFile(memoryRoot, `MEMORY-${userData.userId}.md`, memoryContent);
  //       return JSON.stringify({
  //         // message: "Data stored in long-term memory successfully",
  //         message:"you already call that tool, you cannot call it 2 times per input",
  //         success: true,
  //       });
  //     } catch (error) {
  //       return JSON.stringify({
  //         message: "Failed to write to long-term memory file",
  //         success: false,
  //       });
  //     }
  //   },
  //   {
  //     name: "writeLTM",
  //     description: `
  // Store important long-term memory (LTM) information about the user.

  // This tool appends structured notes to a persistent memory file. It is used to
  // capture durable information that should be remembered across sessions, such as:
  // - User preferences (e.g., tools, frameworks, style)
  // - Goals, projects, or ongoing work
  // - Important personal context or background
  // - Reusable facts that improve personalization

  // Use this tool when:
  // - The information is likely to be useful in future conversations
  // - The user explicitly shares preferences, goals, or important details
  // - You want to improve long-term personalization

  // Do NOT use this tool for:
  // - Temporary or session-only context
  // - Generic responses or repeated information
  // - Short-lived data that won’t matter later

  // Guidelines:
  // - Write concise, high-signal summaries (not raw conversation)
  // - Avoid duplication of existing memory
  // - Focus on meaningful, reusable insights

  // `,
  //     schema: z.object({
  //       content: z
  //         .string()
  //         .describe("Concise summary of the important information to store in long-term memory."),
  //     }),
  //   }
  // );









  const writeLTMTool = () => {
    let callCount = 0;
    const MAX_CALLS = 2;

    return tool(
      async ({ content }) => {
        if (callCount >= MAX_CALLS) {
          return JSON.stringify({
            message: "writeLTM tool can only be called 2 times per input",
            success: false,
          });
        }

        callCount++;

        const now = new Date();
        const formattedDate = now.toTimeString().slice(0, 8);

        const memoryContent = `## [Time: ${formattedDate}] \n${content}\n\n`;

        try {
          await appendAFile(memoryRoot, `MEMORY-${userData.userId}.md`, memoryContent);

          return "<think>Data stored in long-term memory successfully</think>"
          // return JSON.stringify({
          //   // message: `Memory stored successfully (${callCount}/${MAX_CALLS})`,
          //   message: "Data stored in long-term memory successfully",
          //   success: true,
          // });
        } catch (error) {
          return JSON.stringify({
            message: "Failed to write to long-term memory file",
            success: false,
          });
        }
      },
      {
        name: "writeLTM",
        description: `
      Store important long-term memory (LTM) information about the user.

This tool appends structured notes to a persistent memory file. It is used to
capture durable information that should be remembered across sessions, such as:
- User preferences (e.g., tools, frameworks, style)
- Goals, projects, or ongoing work
- Important personal context or background
- Reusable facts that improve personalization

Use this tool when:
- The information is likely to be useful in future conversations
- The user explicitly shares preferences, goals, or important details
- You want to improve long-term personalization

Do NOT use this tool for:
- Temporary or session-only context
- Generic responses or repeated information
- Short-lived data that won’t matter later

Guidelines:
- Write concise, high-signal summaries (not raw conversation)
- Avoid duplication of existing memory
- Focus on meaningful, reusable insights`,
        schema: z.object({
          content: z
            .string()
            .describe(
              "Concise summary of the important information to store in long-term memory."
            ),
        }),
      }
    );
  };


  return {
    createFileTool, readFileTool, updateFileTool, appendFileTool, writeLTMTool,

  };
}
