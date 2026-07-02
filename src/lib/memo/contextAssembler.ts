import { Document } from "langchain";
import { MemoryManager, UserData } from "./MemoryManager";
import { compressSTMTool } from "./tools/STMCompressorTools";
import { docEmbeddingMultiVector, queryMultiVector } from "./stores/multi-vector";
import { bm25Retriever, formatDocumentAsString } from "./stores/BM25";



function estimateTokens(text:string) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return Math.ceil(words * 1.3);
}

export class ContextAssembler {
    private memory:MemoryManager
    private modelContextLimit:number
    private userData: UserData

    constructor(memoryManager:MemoryManager, modelContextLimit:number, userData:UserData) {
        this.memory = memoryManager;
        this.modelContextLimit = modelContextLimit
        this.userData=userData
    }


    async assemble(userQuery:string, options={}) {
        const systemPrompt = await this.memory.readMemoryFiles(`system_prompt-${this.userData.userId}.md`);
        const userProfile = await this.memory.readMemoryFiles(`MEMORY-${this.userData.userId}.md`);
        const todayLog = await this.memory.readToday(new Date());

        let relevantLongTermMemory = ''
const archiveLog = await this.memory.readArchiveFile();
const vectorData = await queryMultiVector({userId: this.userData.userId, query: userQuery})
const docToString = formatDocumentAsString(vectorData?.retrieveDocs)
relevantLongTermMemory+= `\n\n#<data_retrieved_from_vector_db> \n${docToString}\n\n</data_retrieved_from_vector_db>`
if (archiveLog.exist) {
    const bm25Data = await bm25Retriever(archiveLog?.data as string, userQuery)
    relevantLongTermMemory += `\n\n#<data_retrieved_from_daily_log_arhive> ${bm25Data}</data_retrieved_from_daily_log_arhive>`
}
console.log('relevantLongTermMemory. :::', relevantLongTermMemory)
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
try {
console.log(`==================compressing...=============`)
const compressData= await compressSTMTool.invoke({message: finalPrompt}) as string;
console.log('STEP 1 done: compressData =', compressData?.slice(0, 100))

await this.memory.emptyFileContent()
console.log('STEP 2 done: emptyFileContent')

const now = new Date()
await this.memory.logToArchive("Assistant", compressData, now)
console.log('STEP 3 done: logToArchive')

const docToEmbed = new Document({
pageContent: compressData, metadata: {title: "user daily log summary"}
})
console.log('STEP 4 done: Document created')
// fire and forget — don't block the response on Pinecone
docEmbeddingMultiVector({
    userId: this.userData.userId,
    allDocs: [docToEmbed]
}).then(() => {
    console.log('==========finish compression ==========')
}).catch((err) => {
    console.error('Pinecone embedding failed (non-blocking):', err.message)
})
} catch (compressionError) {
console.error('COMPRESSION BLOCK FAILED:', compressionError)
throw compressionError
}
        }


        return {
             prompt: finalPrompt,
             diagnostics: {
estimatedTokens: numberOfTokens
             }
        }
    }
}