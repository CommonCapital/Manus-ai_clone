
import { LLM } from "../llm/LLM"
import { estimateTokens } from "../memo/contextAssembler"
const summarizationModel = LLM.getInstance("cerebras");
const MAX_CONTENT_TOKENS = 15000
const MAX_TRUNCATED_TOKENS = 30000
export async function summarizeBrowserOutput(input: unknown): Promise<string> {
    if (typeof input !== "string") {
        return ""    }
        let text = input
        const estimated= estimateTokens(text)
        text = text
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()


        if (estimated > MAX_CONTENT_TOKENS) {
            const approxChars = MAX_TRUNCATED_TOKENS * 4;
            text = text.slice(0, approxChars);

        }
        const summaryResponse = await summarizationModel.invoke([
            [
                "system",
                `
                You summarise large browser tool outputs.

                Return ONLY Markdown.

                ## Goals
                - Extract key information from the page
                - Extract all important links
                - Extract important UI elements if visible
                - Remove HTML noise
                - Preserve technical identifiers
                - Preserve selectors if visible

                ## Rules
                - Do NOT hallucinate
                - Do NOT invent links
                - If truncated mention it

                ## Output Format

                ### Summary
                - bullet points


                ### Important Links
                - https://example.com
                ### Important Elements
                - buttons
                - forms
                - navigation items
                `,
            ],
            ["user", text]
        ]);

        return summaryResponse?.content ?? ""
}