import fs from "fs";
import path from "path";
import { tool} from "@langchain/core/tools";
import {z} from 'zod';
import { glob as fsGlob } from "node:fs/promises";


const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "public", "deep-agent");


export const write_file = tool(
    async ({filename, content
    }:any) => {
try {
    const fullPath = path.join(BASE_DIR, filename);

    await fs.promises.mkdir(path.dirname(fullPath), {recursive:true});

    await fs.promises.writeFile(fullPath, content, "utf8");

    return JSON.stringify({
        message: `Successfully wrote ${content.length} characters to ${filename}`
    })
} catch (error:any) {
    return `Error writing file: ${error.message}`
}
    },
    {
name: "write_file",
description: "Create or overwrite a file in the local filesystem.",
schema: z.object({
    filename: z.string().describe("File name eg: reports.md"),
    content: z.string().describe("Content to write into the file"),
}),
    }
);

export const grep = tool(
    async ({pattern, path: searchPath = "."}:any) => {
        try {
            const fullPath = path.join(BASE_DIR, searchPath);
            const results:any = [];

            let regex:any;

            try {
                regex = new RegExp(pattern, "I")
            } catch (error) {
                regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            }
            async function walk(dir:any) {
                const entries = await fs.promises.readdir(dir, {withFileTypes:true});
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
    })
}

                }
            }
            await walk(fullPath);

            return results.length > 0 ? results.join("\n")
            : "No matches found for patterns."
        } catch (error:any) {
            return `Error during grep: ${error.message}`
        }
    },
    {
        name: "grep",
        description: "Search for a string or regex pattern inside file contents.",
        schema: z.object({
            pattern: z.string().describe("The string or regex to search for"),
        path: z.string().optional().describe("Relative path inside deep-agent folder") ,    
       })
    }
);

export const read_file = tool(
    async ({filename, path: pathAlias, offset, limit}: any) => {
        const actualFilename = filename || pathAlias;
        if (!actualFilename) {
            return "Error: filename is required";
        }
        try {
            const filePath = path.join(BASE_DIR, actualFilename);
            const content = await fs.promises.readFile(filePath, "utf8");
            const lines = content.split("\n");
            const start = offset ?? 0;
            const end = limit ? start + limit : lines.length;
            return lines.slice(start, end)
                .map((line, i) => `${String(start + i + 1).padStart(4)} | ${line}`)
                .join("\n");
        } catch (error: any) {
            return `Error reading file: ${error.message}`;
        }
    },
    {
        name: "read_file",
        description: "Read a file from the deep-agent workspace.",
        schema: z.object({
            filename: z.string().optional().describe("The filename to read"),
            path: z.string().optional().describe("Alternative to filename"),
            offset: z.coerce.number().optional().default(0),
            limit: z.coerce.number().optional().default(200),
        })
    }
);

export const edit_file = tool(
    async ({filename, old_str, new_str}) => {
try {
    const resolvedPath = path.resolve(BASE_DIR, filename);


    if (!resolvedPath.startsWith(BASE_DIR)) {
        throw new Error
    }

    const content = await fs.promises.readFile(resolvedPath, "utf8");

    if (!content.includes(old_str)) {
         return `Error: Exact match for 'old_str' not found in ${filename}.`
    }

    const updatedContent = content.replace(old_str, new_str);
    await fs.promises.writeFile(resolvedPath, updatedContent, "utf8");

    return `Successfully updated ${filename}.`
} catch (error) {
    return `Error: ${error}`
}
    },
    {
name: "edit_file",
description: "Find and replace a specific string within a file.",
schema: z.object({
    filename: z.string().describe("filename to edit"),
    old_str: z.string().describe("Exact text to find"),
    new_str: z.string().describe("Text to replace it with")
}),
    }
);

export const ls = tool(
    async ({path: targetPath = "."}:any) => {
        try {
            const resolvedPath = path.resolve(BASE_DIR, targetPath);


            if (!resolvedPath.startsWith(BASE_DIR)) {
                throw new Error("Access outside allowed directory is not permitted.");
            }

            const entries = await fs.promises.readdir(resolvedPath, {
                withFileTypes: true,
            });

            if (entries.length === 0) {
                return "Directory is empty.";
            }
            const formatted = entries.map((entry) => {
                if (entry.isDirectory()) return `${entry.name}/`;
                return entry.name;
            })
            .sort((a,b) => a.localeCompare(b))
            .join("\n")
            return formatted
        } catch(error) {
  return `Error listing directory: ${error}`
        }
    },
    {
        name: "ls",
        description: "List files and directories at the given path.",
        schema: z.object({
            path: z.string()
            .optional()
            .describe("Relative path inside deep-agent folder. Defaults to '.'"),
        }),
    }
);

export const glob = tool(
    async ({pattern}:any) => {
        try {
            const options = {
                cwd: BASE_DIR,
                exclude: (p:any) => p.includes("node_modules")
            };

            const matches = [];

            for await (const entry of fsGlob(pattern, options)) {
                matches.push(entry);
            }
if (matches.length === 0 ) {
    return `No matches found for pattern "${pattern}" inside ${BASE_DIR}`;

}

return matches.join("\n")
        } catch(error:any) {
            return `Error performing glob: ${error.message}`
        }
    },
    {
        name: "glob",
        description: "Search for files on the local disk using wildcard patterns (e.g., 'src/**/*.ts'). All searches are relative to the project root.",
        schema: z.object({
            pattern: z.string().describe("The glob pattern to match files"),
        })
    }
);

export const fileSystemTools=[write_file, read_file, edit_file, ls, grep, glob]