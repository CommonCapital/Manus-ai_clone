
import {promises as fs} from "node:fs";
import path from "node:path";
import { appendAFile, createAFile, emptyAFile, readAFile } from "./tools/fileSystemTools";

function todayDateString(now = new Date() ) {
    return now.toISOString().slice(0,10);
}
export function nowTimeString(now = new Date()) {
return now.toTimeString().slice(0,8);
}
async function fileExists(filePath:string) {
    try {
await fs.access(filePath);
return true;
    } catch (error) {
return false;
    }
}

export class MemoryManager {
    private memoryRoot: any

    constructor(memoryRoot: string, options = {} as any) {
this.memoryRoot = path.resolve(memoryRoot)
    }


    async emptyFileContent() {
        await emptyAFile(this.memoryRoot, this.todayLogPath())
    }
    resolve(relativePath: string) {
        const fullPath = path.resolve(this.memoryRoot, relativePath);
        if (!fullPath.startsWith(this.memoryRoot)) {
            throw new Error(`Invalid memory path: ${relativePath}`);
        }
        return fullPath;
    }

    async init() {
        await this.ensureCoreFiles();



    }

    async ensureCoreFiles() {
        const defaults = [
            {
                path: `${this.memoryRoot}/MEMORY.md`,
                content: "# LONGTERM MEMORY\n\n"
            },
            {
                path: `${this.memoryRoot}/archive/DAILY_LOG_ARCHIVE.md`,
                content: "# DAILY_LOG_ARCHIVE\n\n"
            },
        ];
        this.ensureTodayLog()
        for (const file of defaults) {
            const fullPath = this.resolve(file.path);
            if (!(await fileExists(fullPath))) {
                await createAFile(this.memoryRoot, file.path, file.content);

            }
        }
    }
    todayLogPath(now = new Date()) {
        return `${todayDateString(now)}.md`
    }

    async ensureTodayLog(now = new Date()) {
        const relativePath = this.todayLogPath()
        const fullPath = this.resolve(relativePath);
        if (!(await fileExists(fullPath))) {
            await createAFile(this.memoryRoot, relativePath, `# Daily Log ${todayDateString}`)
        }
        return relativePath;
    }

    async logInteraction(role: string, content: string, now = new Date()) {
const logPath = await this.ensureTodayLog(now);
const chunk = `## [Time: ${nowTimeString(now)}] Role: ${role}\n${content}\n\n`
await appendAFile(this.memoryRoot, logPath, chunk);
return logPath;
    }


    async logToArchive(role:string,content:string, now = new Date()) {
        const logPath = `$${this.memoryRoot}/DAILY_LOG_ARCHIVE.md`;
const chunk = `## [Time: ${nowTimeString(now)}] Role: ${role}\n${content}\n\n`
await appendAFile(this.memoryRoot, logPath, chunk);
return logPath;
    }

    async readArchiveFile() {
        try {
            const data = await readAFile(this.memoryRoot, 'DAILY_LOG_ARCHIVE.md');
            return {
                data, 
                exist: true
            }
        } catch (error) {
            return {
                exist: false
            }
        }
    }


    async readToday(now = new Date()) {
        const logPath = await this.ensureTodayLog(now);
        return readAFile(this.memoryRoot, logPath)
    }

    async readMemoryFiles(name:string) {
const relativePath = `${this.memoryRoot}/${name}`;
const fullPath = this.resolve(relativePath);
if (!(await fileExists(fullPath))) {
    await createAFile(this.memoryRoot, relativePath, "");
}
return readAFile(this.memoryRoot, relativePath)
    }
 }