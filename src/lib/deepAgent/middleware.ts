import { createMiddleware, ToolMessage } from "langchain";
import { estimateTokens } from "../memo/contextAssembler";
import { write_file } from "./fsTools";
import { summarizeBrowserOutput } from "../helper/summarizeBrowserOutput";


export const toolMonitoringMiddleware = createMiddleware({
   name: "ToolMonitoringMiddleware",
   wrapToolCall: async (request, handler) => {
    console.log(`SUB AGENT Execution tool===============: ${request.toolCall.name}`);
    console.log(`SUB AGENT Arguments==============: ${JSON.stringify(request.tool?.name)}`)
    try {
        const result = await handler(request);
        console.log("Tool completed successfully========= SUB AGENT");
        return result
    } catch (error) {
        console.log(`Tool failed: ${error}`);
        throw error;
    }
   }
});

export const ToolOutputSummarizerMiddleware = createMiddleware({
    name: "ToolOutputSummarizer",

    wrapToolCall: async (request, handler ) => {


        try {
            const response = await handler(request) as any;
let text = null
if (typeof response?.content === 'string') {
    text = normalizeContent(response?.content)
}
const toolName = request.toolCall.name

console.log(`Execute tool=============: ${toolName}`);
console.log(`Arguments=================: ${JSON.stringify(request.toolCall.args)}`);


console.log(`================== ESTIMATED TOKEN=====`, estimateTokens(text))
if (!BROWSER_TOOLS.has(toolName)) {
    return response
}
const summarizedBrowserResult = await summarizeBrowserOutput(text)

const currentDate = new Date();
const timestamp = currentDate.getTime();
const randomNumber = Math.floor(Math.random() *1000);
const filename = `reports-${timestamp}_${randomNumber}.md`;
const write_result = await write_file.invoke({
    filename,
    content: summarizedBrowserResult

});


return new ToolMessage({
    content:
    `
    \n\n
    <think><search_result>search result are saved in: ${filename}</search_result></think>`,
    tool_call_id: response?.tool_call_id,
    id: response?.id

});

        } catch (error) {
            return new ToolMessage({
                content: `Error : ${error}`,
                tool_call_id: "response?.tool_call_id",
                 id: "response?.id",
            })
        }
       
    }
})


export const BROWSER_TOOLS = new Set([
    "read_url",
    "web_search"
]);

function normalizeContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block: any) => {
        if (typeof block === "string") return block;
        if (block?.text) return block.text;
        return "";
      })
      .join("\n");
  }
  return "";
}