import {LLM} from "@/lib/llm/LLM";




import {Document} from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {createAgent, HumanMessage} from "langchain";

export async function extractRelevantDocument(query: string, doc:string) {
    const llm = LLM.getInstance('cerebras')
    const agent = createAgent({
        model: llm,
        systemPrompt: `You are a relevance filter for a Retrieval_augmented Generation (RAG) system.
        
        Task:
        Select ONLY the parts of the context that are directly useful for answering the user's question.

        Strict Rules:
        - Extract text EXACTLY as it appears in the context (verbatim).
        - DO NOT paraphrase, summarize, explain, or edit.
        - DO NOT include mathemtical formulas, probabilistic models or system-level retrieval theory
        UNLESS the question explicitly asks for them.
        - The extracted text MUST clearly and explicitly help answer the question.
        - If a passage is only loosely related or requires interpretation, EXCLUDE it.
        - If NO part of the context is directly relevant, return exactly: "NO_OUTPUT"
        `
    })


    const agentOutput = await agent.invoke({
        messages: [new HumanMessage(`
            User Question:
            <user_questions>
            ${query}
            </user_question>

            Retrieved Data:
            <retrieved_data>
            ${doc}
            </retrieved_data>

            Output:
            - Return ONLY the extracted context text.
            - If multiple parts are relevant, return them in the same order as in the context.
            - Do NOT add any extra text before or after the extraction.

            `)],
    });


    const aiResponse = agentOutput.messages[agentOutput.messages.length - 1]?.content
    return aiResponse
}