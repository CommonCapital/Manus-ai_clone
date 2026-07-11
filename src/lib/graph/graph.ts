import {
    END,
    START,
    StateGraph,
    Annotation,
    MessagesAnnotation,
    Command
} from "@langchain/langgraph";
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages";
import { LLM } from "../llm/LLM";
import { createMemoryAgent } from "../memo/MemoryAgent";
import { testDeepAgent } from "../deepAgent/deepAgent";
import { MemoryManager } from "../memo/MemoryManager";
import path from "node:path";

const llm = LLM.getInstance("cerebras")



// 1. Define the Graph State
const StateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    threadId: Annotation(),
    userId: Annotation(),
    nextNode: Annotation(),
deepAgentContext: Annotation(),
transferContext: Annotation(),
});

// 2. Define the Nodes
const nodeA = async (state: any, config: any) => {
    console.log('=================nodeA==================')
    const { userId, threadId } = state

    const last = state.messages
        .filter((m: any) => m._getType() === "human")
        .slice(-1)[0];


    const { runAgent, logLastAIMsg, streamAgentV1 } = await createMemoryAgent({ model: llm, userId, threadId })

    const { fullContent, transferContext, deepAgentContext } = await streamAgentV1(last?.content, config)

    console.log('=====In Graph full============ ')

    // Deterministic: transferContext is only set when transfertTool actually
    // ran and its result was parsed successfully — not a text-pattern match
    // on whatever the model happened to say, which was unreliable (the model
    // would inconsistently echo/duplicate/mangle the old handoff template).
    const shouldHandoff = transferContext !== null && transferContext !== undefined;

    if (shouldHandoff) {
        return new Command({
            update: { messages: [new AIMessage(fullContent)], deepAgentContext, transferContext },
            goto: "nodeB",
        });
    }

    return new Command({
            update: { messages: [new AIMessage(fullContent)] ,nextNode: END},
        goto: END
    });
};


const nodeB = async (state: any, config: any) => {
    console.log('=================nodeB====================================')
    const { userId, threadId } = state
    const memoryRoot = path.resolve(process.cwd(), "public", "memory")
    const memoryManager = new MemoryManager(memoryRoot, { userId, threadId });

    const deepAgentMessage=`
    User's request (relayed by Assistant-1): ${state.transferContext}\n\n
    ${state.deepAgentContext ?? ""}`

    // console.log('===========deep agent====',deepAgentMessage)

const aiMessage = await testDeepAgent(`${deepAgentMessage}`, config) as any

    await memoryManager.logInteraction("Assistant-2", aiMessage, new Date());

    console.log('=================end node B====================================')


    return new Command({
        update: { messages: [new AIMessage(aiMessage)] },
        goto: END,
    });


};



// 3. Build the Graph
// const workflow = new StateGraph(StateAnnotation)
//     .addNode("nodeB", nodeB)
//     .addEdge("__start__", "nodeB")
//     .addEdge("nodeB", '__end__')






    const workflow = new StateGraph(StateAnnotation)
    .addNode("nodeA", nodeA)
    .addNode("nodeB", nodeB)

    .addEdge("__start__", "nodeA")
    .addConditionalEdges('nodeA', (state) => {
        if (state.nextNode === "nodeB") {
            return "nodeB"
        }
        return END
    })
    .addEdge("nodeA", '__end__')
    .addEdge("nodeB", '__end__')

export const graph = workflow.compile();





