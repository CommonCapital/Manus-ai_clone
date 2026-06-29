import {promises as fs} from "node:fs";
import path from "node:path";
import {tool} from "@langchain/core/tools";
import {z} from "zod";
import { UserData } from "../MemoryManager";


function resolveSafePath(rootDir: string, relativePath:string) {
    const fullPath = path.resolve(rootDir, relativePath);
    const normalizedRoot = path.resolve(rootDir);
    if (!fullPath.startsWith(normalizedRoot)) {
        throw new Error(`Path escapes memory root: ${relativePath}`);

    }

    return fullPath;
}


async function ensureParent(filePath:string) {
    await fs.mkdir(path.dirname(filePath), {recursive: true})
}

export async function emptyAFile(rootDir:string, relativePath:string) {
    const filePath = resolveSafePath(rootDir, relativePath);
    await ensureParent(filePath);

    await fs.writeFile(filePath, "", {encoding: "utf8", flag: "w"});

    return `File reset (emptied): ${relativePath}`;
}

export async function createAFile(rootDir:string, relativePath: string, content = "") {
const filePath = resolveSafePath(rootDir, relativePath);
await ensureParent(filePath);
await fs.writeFile(filePath, content, {encoding: "utf8", flag: "wx"});
return `Created File: ${relativePath}`
};

export async function readAFile(rootDir: string, relativePath:string) {
    try {
        const filePath = resolveSafePath(rootDir, relativePath);
        return fs.readFile(filePath, "utf8")
    } catch (error) {
        console.error("failed to read the file")
    }
};

export async function updateAFile(rootDir:string, relativePath:string, content:string) {
    const filePath = resolveSafePath(rootDir, relativePath);
    await ensureParent(filePath);
    await fs.writeFile(filePath, content, "utf8");
    return `Updated file: ${relativePath}`;
}

export async function appendAFile(rootDir:string, relativePath:string, content:string) {
    const filePath = resolveSafePath(rootDir, relativePath);
    await ensureParent(filePath);
    await fs.appendFile(filePath, content, "utf8");
    return `Append file: ${relativePath}`;
}

export function buildFileSystemTools(memoryRoot:string, userData:UserData) {


    const createFileTool = tool(
        async ({fileName, content}:any) => {
try {
    return createAFile(memoryRoot, fileName, content);
} catch (error) {
    return JSON.stringify({message: "error occur when creating file"})
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
        async ({fileName}:any) => {
try {
    const res = await readAFile(memoryRoot, fileName).catch((error) => error)
    if (res.error) {
        return JSON.stringify({message: "file your trying to read doesn't exist"})
    }
    return res
} catch (error) {
    return JSON.stringify({message: "file you're tring to read doesn't exist"})
}
        },
        {
name: "readAFile",
description: "Read a file under memory system",
schema: z.object({
fileName: z.string().min(1)
})
        }
    );
const updateFileTool = tool(
    async ({fileName, content}:any) => {
        try {
            return updateAFile(memoryRoot, fileName, content)
        } catch (error) {
            return JSON.stringify({message: "File you're trying yo update doesn't exist"})
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
    async ({fileName, content}:any) => {
        try {
            return appendAFile(memoryRoot, fileName, content)
        } catch (error) {
            return JSON.stringify({message: "File you're trying to read doesn't exist"})
        }
    },
    {
name: 'appendAFile',
description: "Append content to a file under memory_system.",
schema: z.object({
    fileName: z.string().min(1),
    content: z.string(),
}
)

    }
);
const writeLTMTool = tool(
    async ({content}:any) => {
const now = new Date()
const farmattedDate = now.toTimeString().slice(0, 8);
const memoryContent = `## [Time: ${farmattedDate}] \n${content}\n\n`;
try {
    return appendAFile(memoryRoot, `MEMORY-${userData.userId}.md`, memoryContent);
} catch (error) {
    return JSON.stringify({message: "File you're trying to read doesn't exist"})
}
    },
    {
name: "writeLTM",
description: 
"This tool allow you to write the LongTerm memory MEMORY.md",
schema: z.object({
    content: z.string(),
})
    }
);

return {
createFileTool, readFileTool, updateFileTool, appendFileTool, writeLTMTool,
};
}
