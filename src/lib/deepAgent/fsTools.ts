import fs from "fs";
import path from "path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { glob as globFn } from "glob";
import { file_copy } from "./file_copy";
import { batch_edit } from "./batch_edit";


const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "public", "deep-agent");

export const write_file = tool(
    async ({ filename, content },toolConfig:any) => {
        try {
            // Resolve absolute path inside your project
            const fullPath = path.join(BASE_DIR, filename);

            // Ensure directory exists
            await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

            // Write file (overwrite if exists)
            await fs.promises.writeFile(fullPath, content, "utf8");

             toolConfig.writer({
                write_file: "write_file",
                filename,
                content
            });

            return JSON.stringify({
                message: `Successfully wrote to   ${filename} characters :${content.length} `
            })

        } catch (error: any) {
            return `Error writing file: ${error.message}`;
        }
    },
    {
    name: "write_file",
    description: `
Create or overwrite a file inside the project workspace.

This tool writes text content to a file. If the file already exists, it will be completely overwritten with the new content.

PATH USAGE:
- You may provide either:
  1. A full relative path with folders (recommended)
     Example: "reports/analysis.md"
     Example: "src/utils/helpers.ts"
     Example: "docs/setup/installation.md"

  2. Only a filename
     Example: "notes.md"
     Example: "todo.txt"

If only a filename is provided, the file will be created in the project root directory.

DIRECTORY HANDLING:
- If the specified directories do not exist, they will automatically be created.
- Nested folders are supported.

FILE BEHAVIOR:
- The file will be written using UTF-8 encoding.
- Existing files will be replaced entirely.
- This tool is intended for generating project files, reports, documentation, source code, or configuration files.

WHEN TO USE:
Use this tool whenever you need to:
- Create a new file
- Save generated code
- Write reports or research results
- Persist markdown notes or documentation
- Export generated project files

WHEN NOT TO USE:
- Do not use this tool to append content to an existing file (it overwrites files).
- Do not use this tool for binary files (images, videos, compiled artifacts).

BEST PRACTICES:
- Always include the correct file extension (.md, .ts, .json, .py, etc.)
- Prefer structured project paths like "src/", "docs/", "reports/", etc.
- Ensure the content is complete and properly formatted before writing.

Example Calls:

Create a markdown report:
filename: "reports/market_research.md"

Create a source code file:
filename: "src/app/server.ts"

Create a simple root file:
filename: "README.md"
`,
    schema: z.object({
        filename: z.string().describe(
            "Target file path or filename. Can be a simple filename (e.g., 'report.md') or a relative path (e.g., 'docs/report.md' or 'src/app.ts')."
        ),
        content: z.string().describe(
            "The full text content that will be written into the file."
        ),
    }),
}
);





export const delete_file = tool(
  async ({ filename }, toolConfig: any) => {
    try {
      const fullPath = path.resolve(BASE_DIR, filename);

      // Prevent path escaping outside BASE_DIR
      if (!fullPath.startsWith(BASE_DIR)) {
        throw new Error("Invalid path: outside workspace");
      }

      // Prevent deleting files inside the skills folder
      const skillsPath = path.join(BASE_DIR, "skills");

      if (fullPath.startsWith(skillsPath)) {
        throw new Error(
          "Deletion blocked: files inside the 'skills' folder cannot be deleted."
        );
      }

      // Check if file exists
      await fs.promises.access(fullPath);

      // Delete file
      await fs.promises.unlink(fullPath);

      toolConfig.writer({
        delete_file: "delete_file",
        filename,
      });

      return JSON.stringify({
        message: `File successfully deleted: ${filename}`,
      });

    } catch (error: any) {
      if (error.code === "ENOENT") {
        return `File not found: ${filename}`;
      }

      return `Error deleting file: ${error.message}`;
    }
  },
  {
    name: "delete_file",
    description: `
Delete a file inside the project workspace.

This tool permanently removes a file from the agent workspace directory.

IMPORTANT RESTRICTIONS:
- Files inside the "skills" directory CANNOT be deleted.
- Any attempt to delete a file inside "skills/" will be blocked.

PATH USAGE:
You may provide either:

1. Full relative path
Example:
"reports/analysis.md"
"src/utils/helpers.ts"

2. Filename only
Example:
"notes.md"
"todo.txt"

If only a filename is provided, the file will be assumed to exist in the project root.

FILE BEHAVIOR:
- The file will be permanently deleted.
- This action cannot be undone.
- If the file does not exist, the tool will return a message indicating it was not found.

WHEN TO USE:
Use this tool when you need to:
- Remove outdated files
- Delete temporary outputs
- Clean up generated artifacts
- Remove incorrect reports or code

WHEN NOT TO USE:
- Do not use this tool for directories.
- Do not attempt to delete files inside the "skills" folder.

BEST PRACTICES:
- Double check filenames before deletion.
- Only delete files generated during the current task.
`,
    schema: z.object({
      filename: z.string().describe(
        "Target file path or filename to delete. Example: 'reports/report.md' or 'notes.md'."
      ),
    }),
  }
);


export const grep = tool(
    async ({ pattern, path: searchPath = "." }) => {
        try {
            const fullPath = path.join(BASE_DIR, searchPath);

            const results: any = [];

            // Detect if pattern is regex
            let regex: any;
            try {
                regex = new RegExp(pattern, "i");
            } catch {
                regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            }

            async function walk(dir: any) {
                const entries = await fs.promises.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const entryPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        await walk(entryPath);
                    } else if (entry.isFile()) {
                        const content = await fs.promises.readFile(entryPath, "utf8");
                        const lines = content.split("\n");

                        lines.forEach((line, index) => {
                            if (regex.test(line)) {
                                results.push(
                                    `${path.relative(BASE_DIR, entryPath)}:${index + 1}: ${line.trim()}`
                                );
                            }
                        });
                    }
                }
            }

            await walk(fullPath);

            return results.length > 0
                ? results.join("\n")
                : "No matches found for pattern.";
        } catch (error: any) {
            return `Error during grep: ${error.message}`;
        }
    },
    {
        name: "grep",
        description: "Search for a string or regex pattern inside file contents.",
        schema: z.object({
            pattern: z.string().describe("The string or regex to search for"),
            path: z.string().optional().describe("Relative path inside deep-agent folder"),
        }),
    }
);

// export const read_file = tool(
//     async ({ filename, offset = 0, limit = 100 },toolConfig:any) => {
//         try {
//             const resolvedPath = path.resolve(BASE_DIR, filename);

//             // 🔒 Prevent directory traversal
//             if (!resolvedPath.startsWith(BASE_DIR)) {
//                 throw new Error("Access outside allowed directory is not permitted.");
//             }

//             const content = await fs.promises.readFile(resolvedPath, "utf8");
//             const lines = content.split("\n");

//             const slice = lines.slice(offset, offset + limit);

//             const formatted = slice
//                 .map((line, i) =>
//                     `${(offset + i + 1).toString().padStart(4)} | ${line}`
//                 )
//                 .join("\n");

//             if (offset + limit < lines.length) {
//                 const remaining = lines.length - (offset + limit);
//                 return `${formatted}\n\n[... ${remaining} more lines. Use offset=${offset + limit} to continue reading ...]`;
//             }


//              toolConfig.writer({
//                 read_file: "read_file",
//                 filename,
//                 content
//             });
//             return formatted;
//         } catch (error: any) {
//             return `Error reading file: ${error.message}`;
//         }
//     },
//     {
//         name: "read_file",
//          description: `
// Read the contents of a file inside the project root and return it with line numbers.

// Use this tool when:
// - You need to inspect file contents.
// - You need to analyze code before modifying it.
// - You need to search manually inside a known file.
// - You are continuing to read a large file using pagination.

// Important rules:
// - The filename must be relative to the project root (BASE_DIR).
// - Never use absolute paths.
// - Never use ".." to escape directories.
// - Always call "ls" or "glob" first if you are unsure the file exists.
// - For large files, read in chunks using offset and limit.
// - Never read the entire file at once unless necessary.

// Pagination behavior:
// - "offset" = starting line number (0-based index).
// - "limit" = maximum number of lines to return.
// - If more lines exist, the tool will indicate how many remain.
// - To continue reading, increase offset.

// Output format:
// - Each line is prefixed with its line number.
// - Example format:
//     1 | import fs from "fs"
//     2 | console.log("hello")

// Few-shot examples:

// Example 1:
// User: "Open package.json"
// Call:
// {
//   "filename": "package.json",
//   "offset": 0,
//   "limit": 200
// }

// Example 2:
// User: "Read the first 50 lines of src/index.ts"
// Call:
// {
//   "filename": "src/index.ts",
//   "offset": 0,
//   "limit": 50
// }

// Example 3:
// User: "Continue reading src/index.ts"
// Call:
// {
//   "filename": "src/index.ts",
//   "offset": 50,
//   "limit": 50
// }

// Example 4:
// User: "Show lines 200–300 of app/page.tsx"
// Call:
// {
//   "filename": "app/page.tsx",
//   "offset": 199,
//   "limit": 101
// }

// The tool returns:
// - Numbered lines of the file
// - A continuation hint if more content exists
// - Or an error if file is not found or access is denied
// `,
//         schema: z.object({
//             filename: z.string().describe("filename to read"),
//             offset: z.number().optional().default(0),
//             limit: z.number().optional().default(1000),
//         }),
//     }
// );





export const read_file = tool(
  async ({ filename, offset = 0, limit = 100 }, toolConfig: any) => {
    try {
      const resolvedPath = path.resolve(BASE_DIR, filename);

      // 🔒 Prevent directory traversal
      if (!resolvedPath.startsWith(BASE_DIR)) {
        throw new Error("Access outside allowed directory is not permitted.");
      }

      const content = await fs.promises.readFile(resolvedPath, "utf8");
      const lines = content.split("\n");

      const slice = lines.slice(offset, offset + limit);

      const formatted = slice
        .map((line, i) => `${(offset + i + 1).toString().padStart(4)} | ${line}`)
        .join("\n");

  
         if (toolConfig?.writer) {
        toolConfig.writer({
          read_file: "read_file",
          filename,
          content: slice.join("\n"),
       
        });
      }

      // Check if more lines exist
      if (offset + limit < lines.length) {
        const remaining = lines.length - (offset + limit);
        return `${formatted}\n\n[... ${remaining} more lines. Use offset=${offset + limit} to continue reading ...]`;
      }

      return `${formatted}`;
    } catch (error: any) {
      return `Error reading file: ${error.message}`;
    }
  },
  {
    name: "read_file",
    description: `
Read the contents of a file inside the project root and return it with line numbers, supporting streaming/pagination.

- Use offset and limit to read in chunks.
- Returns continuation hint if more lines remain.
- Each line is prefixed with its number.
- Works with toolConfig.writer to stream content.
`,
    schema: z.object({
      filename: z.string().describe("Filename to read relative to project root"),
      offset: z.number().optional().default(0),
      limit: z.number().optional().default(100),
    }),
  }
);

export const edit_file = tool(
    async ({ filename, old_str, new_str }) => {
        try {
            const resolvedPath = path.resolve(BASE_DIR, filename);

            // 🔒 Prevent directory traversal
            if (!resolvedPath.startsWith(BASE_DIR)) {
                throw new Error("Access outside allowed directory is not permitted.");
            }

            const content = await fs.promises.readFile(resolvedPath, "utf8");

            if (!content.includes(old_str)) {
                return `Error: Exact match for 'old_str' not found in ${filename}. No changes made.`;
            }

            const updatedContent = content.replace(old_str, new_str);

            await fs.promises.writeFile(resolvedPath, updatedContent, "utf8");

            return `Successfully updated ${filename}.`;
        } catch (error: any) {
            return `Error editing file: ${error.message}`;
        }
    },
    {
        name: "edit_file",
        description: "Find and replace a specific string within a file.",
        schema: z.object({
            filename: z.string().describe("filename to edit"),
            old_str: z.string().describe("Exact text to find"),
            new_str: z.string().describe("Text to replace it with"),
        }),
    }
);




export const ls = tool(
  async ({ path: targetPath = "." }) => {
    try {
      const resolvedPath = path.resolve(BASE_DIR, targetPath);

      // 🔒 Prevent directory traversal
      if (!resolvedPath.startsWith(BASE_DIR)) {
        return "<think>Access outside allowed directory is not permitted.</think>";
      }

      const entries = await fs.promises.readdir(resolvedPath, {
        withFileTypes: true,
      });

      if (entries.length === 0) {
        return "<think>Directory is empty.</think>";
      }

      // Build top-level Markdown table
      const header = "| Name | Type | Extension | Children Count |\n|------|------|-----------|----------------|";
      const rows = entries.map((entry) => {
        if (entry.isDirectory()) {
          return `<think>| ${entry.name} | folder |  | 0 |</think>`;
        } else {
          return `<think>| ${entry.name} | file | ${path.extname(entry.name)} |  </think>`;
        }
      });

      return `<think>${[header, ...rows].join("\n")}</think>`;
    } catch (error: any) {
      return `<think>Error listing directory: ${error.message}</think>`;
    }
  },
  {
    name: "ls",
    description: `

   Defaults to project root "." if no path provided

List files and directories inside the project root as a **Markdown table**.

- Returns only top-level objects
  - name
  - type: "file" or "folder"
  - extension for files
  - children_count for folders (empty)

- Safe:
  - Only relative paths allowed
  - Directory traversal blocked

- Defaults to project root "." if no path provided
`,
    schema: z.object({
      path: z
        .string()
        .optional()
        .describe("Relative path inside project folder. Defaults to '.'"),
    }),
  }
);

export const glob = tool(
    async ({ pattern }) => {
        try {
            const matches = await globFn(pattern, {
                cwd: BASE_DIR,
                ignore: ["**/node_modules/**"],
            });

            if (matches.length === 0) {
                return `No matches found for pattern "${pattern}" inside ${BASE_DIR}`;
            }

            return matches.join("\n");
        } catch (error: any) {
            return `Error performing glob: ${error.message}`;
        }
    },
    {
        name: "glob",
        description: `
Search for files in the project directory using glob wildcard patterns.

Use this tool when:
- You need to locate files before reading or modifying them.
- The exact file path is unknown.
- You need to list files of a specific type (e.g., all .ts or .md files).
- You need to inspect project structure.

Important rules:
- All searches are relative to the project root (BASE_DIR).
- Never use absolute paths.
- Use forward slashes (/), even on Windows.
- Avoid searching large directories unnecessarily.
- "node_modules" is automatically excluded.

Glob pattern syntax:
- "*" matches any characters except "/"
- "**" matches any number of nested directories
- "*.ts" matches all TypeScript files in current directory
- "src/**/*.ts" matches all TypeScript files inside src recursively

Few-shot examples:

Example 1:
User: "Find all TypeScript files"
Call:
{
  "pattern": "**/*.ts"
}

Example 2:
User: "List all markdown files in docs folder"
Call:
{
  "pattern": "docs/**/*.md"
}

Example 3:
User: "Find all files named page.tsx"
Call:
{
  "pattern": "**/page.tsx"
}

Example 4:
User: "Search for all config files"
Call:
{
  "pattern": "**/*config*.*"
}

The tool returns:
- A newline-separated list of relative file paths
- Or a message if no matches are found
`,
        schema: z.object({
            pattern: z.string(),
        }),
    }
)

export const filesystemTools = [batch_edit,file_copy,write_file, read_file, edit_file, ls, grep, glob,delete_file]

