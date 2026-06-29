import { createMiddleware } from "langchain";


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
        const response = await handler(request) as any;


return response;
    }
})
