
import {ChatFireworks} from "@langchain/fireworks";
import {ChatCerebras} from "@langchain/cerebras";

type LLMType = "fireworks" | "cerebras";

export class LLM {
    private static instances: Partial<Record<LLMType, any>> = {};

    private constructor() {}



    public static getInstance(type: LLMType = "fireworks") {
        if (!LLM.instances[type]) {
            switch (type) {
                case 'fireworks':
                    if (!process.env.FIRE_WORKS_API_KEY) {
                        throw new Error("FIRE_WORKS_API_KEY is not set")
                    }
                   LLM.instances[type] = new ChatFireworks({
  model: "accounts/fireworks/models/gpt-oss-120b",
  temperature: 0.7,
  apiKey: process.env.FIRE_WORKS_API_KEY
});
                    break;

                case "cerebras":
                    if (!process.env.CEREBRAS_API_KEY) {
                        throw new Error("CEREBRAS_API_KEY is not set");
                    }
                    LLM.instances[type] = new ChatCerebras({
                        model: "gpt-oss-120b",
                        temperature: 0.7,
                        apiKey: process.env.CEREBRAS_API_KEY,
                    });

                    break;
                    default: 
                    throw new Error(`Unsuported LLM Type: ${type}`)
            }
        }

        return LLM.instances[type]
    }

}



