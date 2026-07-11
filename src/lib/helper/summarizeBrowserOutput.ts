
import { LLM } from "../llm/LLM"
import { estimateTokens } from "../memo/contextAssembler"
// Browser-output summarization is the single highest-volume LLM call in the
// system — it fires on EVERY web_search / read_url, and a research run makes
// dozens. Keeping it on the fast MiniMax worker model (not Cerebras
// gpt-oss-120b, whose collapses/rate-limits were the bottleneck) is what lets a
// research subagent churn through many pages and produce many report files fast.
const summarizationModel = LLM.getInstance("fireworks_minimax");
const MAX_CONTENT_TOKENS = 15000
const MAX_TRUNCATED_TOKENS = 30000
// Below this, an LLM summarization pass costs more (a whole extra request) than
// it saves — every web_search/read_url call was paying for a second LLM call
// regardless of how small the page content actually was.
const SKIP_SUMMARY_BELOW_TOKENS = 300
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

        if (estimated < SKIP_SUMMARY_BELOW_TOKENS) {
            return text;
        }

        if (estimated > MAX_CONTENT_TOKENS) {
            const approxChars = MAX_TRUNCATED_TOKENS * 4;
            text = text.slice(0, approxChars);

        }
        // "internal_summary" marks this call so the stream loops can route its
        // tokens to the right surface (manager: collapsed Thinking panel;
        // subagent: its dropdown) instead of the main chat, where they used to
        // appear as if the agent said them. Still visible — just not as chat.
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
        ], { tags: ["internal_summary"] });

        return summaryResponse?.content ?? ""
}