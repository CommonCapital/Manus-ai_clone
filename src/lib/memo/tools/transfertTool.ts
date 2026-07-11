import { tool } from "@langchain/core/tools";
import z from "zod";

// A fixed, code-generated marker — never something the model has to type out.
// The handoff to Assistant-2 is detected by finding this tool's own result in
// the message stream, not by asking the model to echo a template (including
// literal <think> tags) back as its own next message. That echo approach was
// unreliable: the model would sometimes duplicate it, sometimes drop the
// tags, sometimes paste the tool's own instructional text as if it were
// content for the user — all of which leaked into the visible chat.
export const TRANSFER_MARKER = "__ASSISTANT_2_HANDOFF__";

export const transfertTool = tool(
  async ({ context }) => {
    return JSON.stringify({ marker: TRANSFER_MARKER, context });
  },
  {
    name: "transfertTool",
    description: `Call this when the user's request needs real work that only Assistant-2 (the deep agent) can do — research, coding, file operations, running code, or web browsing.

Pass the user's actual request as "context", relayed faithfully — do not reinterpret it (e.g. don't turn "use multiple agents" into a request to build a multi-agent system).

After calling this tool, do not say anything else: do not narrate the transfer, do not echo this tool's result, do not tell the user you're handing them off. The handoff happens automatically and silently — any text you add after calling this tool is wasted and will not be shown.`,
    schema: z.object({
      context: z.string().describe(
        "The user's actual request, relayed faithfully — not reinterpreted"
      ),
    }),
  }
);
