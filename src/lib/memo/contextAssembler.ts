import { Document } from "langchain";
import { MemoryManager } from "./MemoryManaget";
import { compressSTMTool } from "./tools/STMCompressorTools";
import { docEmbeddingMultiVector, queryMultiVector } from "./stores/multi-vector";



function estimateTokens(text:string) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return Math.ceil(words * 1.3);
}

export class ContextAssembler {
    private memory:MemoryManager
    private modelContextLimit:number

    constructor(memoryManager:MemoryManager, modelContextLimit:number) {
        this.memory = memoryManager;
        this.modelContextLimit = modelContextLimit
    }


    async assemble(userQuery:string, options={}) {
        const systemPrompt = await this.memory.readMemoryFiles("system_prompt.md");
        const userProfile = await this.memory.readMemoryFiles("MEMORY.md");
        const todayLog = await this.memory.readToday(new Date());

        let relevantLongTermMemory = null
const archiveLog = await this.memory.readArchiveFile();
const vectorData = await queryMultiVector({userId: 'ben-memo-1230009', query: userQuery})
        const fixedLayers = [
            `# System Layer\n${systemPrompt}`,
            `# Profile Layer\n${userProfile}`,
            `# Relevant LTM Later\n${relevantLongTermMemory || "No relevant long-term memory"}`,
            `# Recent STM Layer\n${todayLog}`
        ];

        const fixedText = fixedLayers.join("\n\n");
        const finalPrompt = `${fixedText}\n\n# New Input\n${userQuery}`;
        const numberOfTokens = estimateTokens(finalPrompt)

        if (numberOfTokens > this.modelContextLimit) {
            console.log(`==================compressing...=============`)
       const compressData= await compressSTMTool.invoke({message: finalPrompt}) as string;
await this.memory.emptyFileContent()
const now = new Date()
await this.memory.logToArchive("Assistant", compressData, now)
const docToEmbed = new Document({
    pageContent: compressData, metadata: {title: "user daily log summary"}
})

await docEmbeddingMultiVector({
userId: "ben-memo-123009",
allDocs: [docToEmbed]
})

console.log('==========finish compression ==========')
        }


        return {
             prompt: finalPrompt,
             diagnostics: {
estimatedTokens: numberOfTokens
             }
        }
    }
}