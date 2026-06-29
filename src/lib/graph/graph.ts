import {
    END, START, StateGraph, Annotation, MessagesAnnotation, Command
} from "@langchain/langgraph";
import {
    AIMessage, HumanMessage, SystemMessage
} from "@langchain/core/messages";
import {LLM} from "../llm/LLM";
import { createMemoryAgent } from "../memo/MemoryAgent";
import { TestDeepAgent } from "../deepAgent/deepAgent";
import { MemoryManager } from "../memo/MemoryManager";
import path from "node:path";


const llm = LLM.getInstance("cerebras")


function removeThinkTag(input:string) {
    if (!input) return ""


    return input.replace(/<\/?think/gi, "")
    .replace(/__TRANSFER__/gi, "")
    .replace(/^\s*\+\s/, "")
    .trim();
}


const StateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    threadId: Annotation(),
userId: Annotation(),
nextNode: Annotation(),
})


const nodeA = async (state:any, config:any) => {
    console.log('=========================')
    const {userId, threadId} = state


    const last = state.messages
    .filter((m:any) => m._getType() === "human")
    .slice(-1)[0];

    const {runAgent, logLastAIMsg, streamAgentV1} = await createMemoryAgent({model: llm, userId, threadId})


    const fullContent = await streamAgentV1(last?.content, config);


    const shouldHandoff = (
        fullContent.includes("__TRANSFER__")
    )


    if (shouldHandoff) {
        return new Command({
            update: {messages: [new AIMessage(fullContent)]},
            goto: "nodeB"
        })
    }


    return new Command({
        update: {
            update: {messages: [new AIMessage(fullContent)]},
            nextNode: END
        },
        goto: END
    });
};


const nodeB = async (state:any, config: any) => {
    console.log('=========================')
    const {userId, threadId} = state
    const memoryRoot = path.resolve(process.cwd(), "public", "memory")
    const memoryManager = new MemoryManager(memoryRoot, {userId, threadId});


    const last = state.messages
    .filter((m:any) => m._getType() === 'ai')
    .slice(-1)[0];

    const cleanMessage = removeThinkTag(last?.content)
    const aiMessage = await TestDeepAgent(cleanMessage, config) as any;

    await memoryManager.logInteraction("Assistant-2", aiMessage, new Date());
    console.log('==========================end node B======================================')

    return new Command({
        update: {messages: [new AIMessage(aiMessage)]},
        goto: END
    })
};



const workflow = new StateGraph(StateAnnotation)
.addNode("nodeA",nodeA)
.addNode("nodeB", nodeB)
.addEdge("__start__", "nodeA")
.addConditionalEdges('nodeA', (state) => {
    if (state.nextNode === "nodeB") {
        return "nodeB"
    }
    return END
})
.addEdge("nodeA", '__end__')
.addEdge("nodeB", "__end__")


export const graph = workflow.compile();

