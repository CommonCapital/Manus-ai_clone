
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ChatCerebras } from "@langchain/cerebras";


type LLMType = "fireworks" | "cerebras" | "fireworks_minimax" |'fireworks_glm'

export class LLM {
  private static instances: Partial<Record<LLMType, any>> = {};

  // Private constructor
  private constructor() {}

  /**
   * Get singleton instance of a model
   * @param type "fireworks" | "cerebras"
   */
  public static getInstance(type: LLMType = "fireworks") {
    if (!LLM.instances[type]) {
      switch (type) {
        case "fireworks":
          if (!process.env.FIRE_WORKS_API_KEY) {
            throw new Error("FIRE_WORKS_API_KEY is not set");
          }
          LLM.instances[type] = new ChatFireworks({
            model: "accounts/fireworks/models/qwen3-vl-30b-a3b-thinking",
            temperature: 0.7,
            apiKey:process.env.FIRE_WORKS_API_KEY,
          });
          break;

           case "fireworks_minimax":
          if (!process.env.FIRE_WORKS_API_KEY) {
            throw new Error("FIRE_WORKS_API_KEY is not set");
          }
          LLM.instances[type] = new ChatFireworks({
            // Verified live against this account's key (minimax-m2p5 → 404).
            model: "accounts/fireworks/models/minimax-m3",
            temperature: 0.7,
            apiKey:process.env.FIRE_WORKS_API_KEY,
          });
          break;

            case "fireworks_glm":
          if (!process.env.FIRE_WORKS_API_KEY) {
            throw new Error("FIRE_WORKS_API_KEY is not set");
          }
          LLM.instances[type] = new ChatFireworks({
            // Verified live against this account's key (glm-5 → 404).
            model: "accounts/fireworks/models/glm-5p2",
            temperature: 0.7,
            apiKey:process.env.FIRE_WORKS_API_KEY,
          });
          break;


        case "cerebras":
    if (!process.env.CEREBRAS_API_KEY) {
        throw new Error("CEREBRAS_API_KEY is not set");
    }
    LLM.instances[type] = new ChatCerebras({
        // GLM-4.7 on Cerebras (used for Assistant-1, the memory router) — matches
        // the reference setup and is far stronger at instruction-following than
        // gpt-oss-120b. Verified live against this account's key (both 200).
        model: "zai-glm-4.7",
        temperature: 0.7,
        apiKey: process.env.CEREBRAS_API_KEY,
    });
    // @langchain/cerebras hardcodes maxRetries: 0 on its underlying HTTP client,
    // disabling retries entirely (unlike ChatFireworks, which retries by default).
    // The Cerebras SDK client itself reads this fresh on every request, so
    // mutating it post-construction is sufficient — it also correctly retries
    // only on 429/5xx and respects the server's Retry-After header.
    (LLM.instances[type] as any).client.maxRetries = 4;
    break;

        default:
          throw new Error(`Unsupported LLM type: ${type}`);
      }
    }

    return LLM.instances[type];
  }
}

