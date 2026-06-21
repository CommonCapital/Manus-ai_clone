import {promises as fs} from "node:fs";
import path from "node:path";
import {tool} from "@langchain/core/tools";
import {z} from "zod";


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