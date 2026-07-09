import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { bm25Retriever, formatDocumentsAsString } from "../stores/BM25";
import { queryMultiVector } from "../stores/multi-vector";
import { MemoryManager } from "../MemoryManager";
import path from "path";
import { extractRelevantDocument, extractRelevantDocumentV1 } from "../stores/bm25Extractor";
// export const retrieveRelevantLTMTool = tool(
//     async ({ query }, config) => {

//         const threadId = config.configurable?.threadId;
//         const userId = config.configurable?.userId;


//         const memoryRoot = path.resolve(process.cwd(), "public", "memory")

//         const memoryManager = new MemoryManager(memoryRoot, { userId, threadId });

//         let relevantLongTermMemory = ''
//         // fetch data from Vector DBs (pinecone and bm25)
//         const archiveLog = await memoryManager.readArchiveFile()

//         const vectorData = await queryMultiVector({ userId: userId, query })
//         const docToString = formatDocumentsAsString(vectorData?.retrievedDocs)
//         relevantLongTermMemory += `\n\n#<data_retrieved_from_vector_db> \n${docToString}\n\n</data_retrieved_from_vector_db>`
//         if (archiveLog.exist) {
//             const bm25Data = await bm25Retriever(archiveLog?.data as string, query)
//             relevantLongTermMemory += `\n\n#<data_retrieved_from_daily_log_archive> ${bm25Data}</data_retrieved_from_daily_log_archive>`;
//         }


//           const filteredData=await extractRelevantDocumentV1(query,relevantLongTermMemory)

          
//         const longTermMemory = `# Relevant LTM Layer\n${filteredData || "No relevant long-term memories found."}`
        

       

//         return longTermMemory
//     },
//     {
//         name: "retrieve_relevant_ltm",
//         description: `
// Retrieve relevant long-term memory (LTM) entries based on the user query.

// This tool searches a vector database of previously stored summaries and returns
// high-level contextual information about the user, such as preferences, goals,
// past interactions, and important background knowledge.

// Use this tool when:
// - The query depends on past conversations or long-term context
// - You need to recall user-specific information (preferences, habits, goals, etc.)
// - The current input is ambiguous and may benefit from historical context
// - Personalization or continuity is required

// Do NOT use this tool for:
// - Simple factual questions that do not depend on user history
// - Real-time or short-term conversation context (use short-term memory instead)

// Returns:
// - A list of summarized memory entries relevant to the query
// `,
//         schema: z.object({
//             query: z.string().describe("The semantic search query used to retrieve relevant long-term memory.")
//         }),
//     }
// );




export const retrieveRelevantLTMTool = () => {
  let callCount = 0;
  const MAX_CALLS = 2;

  return tool(
    async ({ query }, config) => {
      if (callCount >= MAX_CALLS) {
        return JSON.stringify({
          message: "retrieve_relevant_ltm can only be called 2 times per input",
          success: false,
        });
      }

      callCount++;

      const threadId = config.configurable?.threadId;
      const userId = config.configurable?.userId;

      const memoryRoot = path.resolve(process.cwd(), "public", "memory");

      const memoryManager = new MemoryManager(memoryRoot, { userId, threadId });

      let relevantLongTermMemory = "";

      // Vector DB retrieval
      const archiveLog = await memoryManager.readArchiveFile();

      const vectorData = await queryMultiVector({ userId: userId, query });
      const docToString = formatDocumentsAsString(vectorData?.retrievedDocs);

      relevantLongTermMemory += `\n\n#<data_retrieved_from_vector_db>\n${docToString}\n</data_retrieved_from_vector_db>`;

      // BM25 retrieval
      if (archiveLog.exist) {
        const bm25Data = await bm25Retriever(archiveLog?.data as string, query);
        relevantLongTermMemory += `\n\n#<data_retrieved_from_daily_log_archive>\n${bm25Data}\n</data_retrieved_from_daily_log_archive>`;
      }

      // Filtering
      const filteredData = await extractRelevantDocumentV1(query, relevantLongTermMemory);

      const longTermMemory = `# Relevant LTM Layer\n${
        filteredData || "No relevant long-term memories found."
      }`;

      return longTermMemory;
    },
    {
      name: "retrieve_relevant_ltm",
      description: `Retrieve relevant long-term memory (LTM) entries based on the user query.

This tool searches a vector database of previously stored summaries and returns
high-level contextual information about the user, such as preferences, goals,
past interactions, and important background knowledge.

Use this tool when:
- The query depends on past conversations or long-term context
- You need to recall user-specific information (preferences, habits, goals, etc.)
- The current input is ambiguous and may benefit from historical context
- Personalization or continuity is required

Do NOT use this tool for:
- Simple factual questions that do not depend on user history
- Real-time or short-term conversation context (use short-term memory instead)

Returns:
- A list of summarized memory entries relevant to the query`,
      schema: z.object({
        query: z
          .string()
          .describe(
            "The semantic search query used to retrieve relevant long-term memory."
          ),
      }),
    }
  );
};