import { LLM } from "@/lib/llm/LLM";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createAgent, HumanMessage } from "langchain";


export async function extractRelevantDocument(query: string, doc: string) {



    const llm =   LLM.getInstance('cerebras')
    const agent = createAgent({
        model: llm,
        systemPrompt: `You are a relevance filter for a Retrieval-Augmented Generation (RAG) system.

            Task:
            Select ONLY the parts of the context that are directly useful for answering the user's question.

            Strict rules:
            - Extract text EXACTLY as it appears in the context (verbatim).
            - DO NOT paraphrase, summarize, explain, or edit.
            - DO NOT include mathematical formulas, probabilistic models, or system-level retrieval theory
            UNLESS the question explicitly asks for them.
            - The extracted text MUST clearly and explicitly help answer the question.
            - If a passage is only loosely related or requires interpretation, EXCLUDE it.
            - If NO part of the context is directly relevant, return exactly: " "`
    })


    const agentOutput = await agent.invoke({
        messages: [new HumanMessage(`
            User Question:
            <user_questions>
            ${query}
            </user_questions>

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







export async function extractRelevantDocumentV1(query: string, doc: string) {



    const llm =   LLM.getInstance('cerebras')
    const agent = createAgent({
        model: llm,
        systemPrompt: `
You are a high-precision relevance filter for a Retrieval-Augmented Generation (RAG) system.

Your job is to extract ONLY the most relevant and non-redundant parts of the retrieved data
to answer the user's question.

You are given TWO different sources:
1. Vector database results (semantic search)
2. Daily log archive results (BM25 / keyword search)

--------------------------------
TASK
--------------------------------
- Analyze BOTH sources together
- Extract ONLY the parts that directly answer the user’s question
- Remove ALL duplicate or overlapping information across sources

--------------------------------
STRICT RULES
--------------------------------
- Extract text EXACTLY as it appears (verbatim)
- DO NOT paraphrase, summarize, or modify text
- DO NOT explain anything
- DO NOT merge or rewrite sentences
- Each extracted chunk must be directly useful for answering the question

--------------------------------
DEDUPLICATION RULES
--------------------------------
- If the SAME or VERY SIMILAR information appears in both sources:
  → Keep ONLY one version (prefer the clearer or more complete one)
- NEVER return duplicated or repeated content
- If two passages overlap in meaning:
  → Keep the more informative one and discard the weaker one

--------------------------------
RELEVANCE FILTERING
--------------------------------
- Include ONLY information that clearly and explicitly answers the question
- EXCLUDE:
  - Vague or loosely related content
  - Content requiring interpretation
  - Background noise or filler text

--------------------------------
SPECIAL RULES
--------------------------------
- DO NOT include mathematical formulas or technical theory
  UNLESS explicitly requested in the question

--------------------------------
OUTPUT FORMAT IN MARKDOWN
--------------------------------
- Return ONLY the extracted text formatted in Markdown
- Use clean Markdown structure:
  - Separate distinct passages with a blank line
  - Preserve original text exactly (no edits, no formatting changes inside the text)
- If multiple parts are relevant:
  → Preserve their ORIGINAL order (as they appear in the sources)

- Do NOT:
  - Add titles, headings, or labels
  - Mention source names
  - Add explanations, summaries, or comments
  - Modify or reformat the extracted text content

- The output must be raw Markdown content only (no wrapping text)

--------------------------------
EDGE CASE
--------------------------------
- If NO relevant information exists, return exactly:
" "

--------------------------------
EDGE CASE
--------------------------------
- If NO relevant information exists, return exactly:
" "
`
    })


    const agentOutput = await agent.invoke({
        messages: [new HumanMessage(`
            User Question:
            <user_questions>
            ${query}
            </user_questions>

            Retrieved Data:
            <retrieved_data>
            ${doc}
            </retrieved_data>

      `)],
    });
    const aiResponse = agentOutput.messages[agentOutput.messages.length - 1]?.content
    return aiResponse

}

