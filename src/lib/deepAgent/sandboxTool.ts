import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Sandbox, ConnectionConfig } from "@alibaba-group/opensandbox";

const config = new ConnectionConfig({
    domain: process.env.OPENSANDBOX_DOMAIN ?? "localhost:8080",
    protocol: (process.env.OPENSANDBOX_PROTOCOL as "http" | "https") ?? "http",
});

export const execute_code = tool(
    async ({ code }: any) => {
        let sandbox;
        try {
            sandbox = await Sandbox.create({
                connectionConfig: config,
                image: "opensandbox/code-interpreter:v1.1.0",
            });
        } catch (error: any) {
            return `Error: could not reach the code sandbox (${error.message}). The sandbox server may not be running.`;
        }
        try {
            const result = await sandbox.commands.run(`python3 -c ${JSON.stringify(code)}`);
            return result.logs.stdout.map((l: any) => l.text).join("") ||
                   result.logs.stderr.map((l: any) => l.text).join("") ||
                   "No output";
        } catch (error: any) {
            return `Error executing code: ${error.message}`;
        } finally {
            await sandbox.kill();
            await sandbox.close();
        }
    },
    {
        name: "execute_code",
        description: "Execute Python code in an isolated sandbox.",
        schema: z.object({
            code: z.string().describe("Python code to execute")
        })
    }
);