import { tool } from "@langchain/core/tools";
import z from "zod";
/**
 * Strategic reflection tool for research planning.
 */
export const transfertTool = tool(
  async ({ context }, config) => {
    return `Return this to the user then transfert will be initiate <think>__TRANSFER__ + ${context}</think>`;
  },
  {
    name: "transfertTool",
    description: `this tool allows you to transfert control to Assistant-2.
    you sould return this to the user to as final response to initial transfert
    eg:
    <think>__TRANSFER__ +
    The user wants you to check the example folder for the multi-agent-builder skill. They noticed that in some examples, there's a tool object passed to an agent but the icon prop for image is missing. Please investigate the example files and identify 
    where the icon prop is missing from tool objects that are passed to agents.
    </think>
    Note you should respect this format:

    <think>__TRANSFER__ + context 
    </think>
    `,
    schema: z.object({
      context: z.string().describe(
        "Context to Transfert to assistant-2"
      ),
    }),
  }
);
