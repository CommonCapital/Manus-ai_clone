import path from "path";
import { randomUUID } from "crypto";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Sandbox, ConnectionConfig } from "@alibaba-group/opensandbox";

const BASE_DIR = path.join(process.cwd(), "public", "deep-agent");

function resolveSandboxConnection() {
    // OPENSANDBOX_URL (e.g. "http://localhost:8080") is the var actually set in .env.
    // Older code only read OPENSANDBOX_DOMAIN/OPENSANDBOX_PROTOCOL directly, which
    // meant changing OPENSANDBOX_URL silently had no effect. Prefer it when present.
    const url = process.env.OPENSANDBOX_URL;
    if (url) {
        try {
            const parsed = new URL(url);
            return {
                domain: parsed.host,
                protocol: parsed.protocol.replace(":", "") as "http" | "https",
            };
        } catch {
            // fall through to legacy vars below
        }
    }

    return {
        domain: process.env.OPENSANDBOX_DOMAIN ?? "localhost:8080",
        protocol: (process.env.OPENSANDBOX_PROTOCOL as "http" | "https") ?? "http",
    };
}

const config = new ConnectionConfig(resolveSandboxConnection());

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

// Registry of long-lived app sandboxes, keyed by app_id. execute_code kills its
// sandbox immediately after each call, which can't host a running dev server —
// these tools keep the sandbox alive on purpose so a server process can keep running
// and be reached over a real URL, until stop_app is explicitly called.
const runningApps = new Map<string, { sandbox: Sandbox; commandId?: string }>();

export const run_app = tool(
    async ({ command, port }: { command: string; port: number }) => {
        let sandbox: Sandbox;
        try {
            sandbox = await Sandbox.create({
                connectionConfig: config,
                image: "opensandbox/code-interpreter:v1.1.0",
                // Mounts the same workspace write_file/read_file/ls already operate on,
                // so app code written earlier in the conversation is visible in the sandbox
                // without re-uploading it file by file.
                volumes: [{ name: "workspace", host: { path: BASE_DIR }, mountPath: "/workspace" }],
                // Safety net: don't leak sandboxes forever if stop_app is never called.
                timeoutSeconds: 1800,
            });
        } catch (error: any) {
            return `Error: could not reach the code sandbox (${error.message}). The sandbox server may not be running.`;
        }

        try {
            const execution = await sandbox.commands.run(command, {
                workingDirectory: "/workspace",
                background: true,
            });

            // Give the process a moment to bind its port before probing for an endpoint.
            await new Promise((resolve) => setTimeout(resolve, 3000));

            const url = await sandbox.getEndpointUrl(port);
            const app_id = randomUUID();
            runningApps.set(app_id, { sandbox, commandId: execution.id });

            return JSON.stringify({
                app_id,
                url,
                message: `App started in the background. Use get_app_logs({app_id: "${app_id}"}) to check startup output/errors, and stop_app({app_id: "${app_id}"}) when you're done with it.`,
            });
        } catch (error: any) {
            await sandbox.kill().catch(() => {});
            await sandbox.close().catch(() => {});
            return `Error starting app: ${error.message}`;
        }
    },
    {
        name: "run_app",
        description: `
Start a long-running app (dev server, API, static site, etc.) inside the sandbox and get back a live URL for it.

Unlike execute_code (which runs one Python snippet and destroys the sandbox immediately after),
this keeps the sandbox alive so a server process can keep running.

The sandbox's /workspace directory is the same workspace write_file/read_file/ls/glob already
read and write to, so write your app's files first, then call this tool with the command that
starts it (e.g. "npm install && npm run dev -- --port 3000", "pip install flask && python3 app.py").

Returns an app_id and a URL. Always call get_app_logs afterward to confirm the app actually
started (a returned URL does not guarantee the server bound successfully). Call stop_app when
you're done to free the sandbox.
`,
        schema: z.object({
            command: z.string().describe("Shell command that starts the app. Runs from /workspace."),
            port: z.number().describe("The port the app listens on inside the sandbox."),
        }),
    }
);

export const get_app_logs = tool(
    async ({ app_id }: { app_id: string }) => {
        const entry = runningApps.get(app_id);
        if (!entry) return `No running app found for app_id "${app_id}". It may have already been stopped.`;
        if (!entry.commandId) return "No logs available yet.";

        try {
            const logs = await entry.sandbox.commands.getBackgroundCommandLogs(entry.commandId);
            return logs.content || "No output yet.";
        } catch (error: any) {
            return `Error fetching logs: ${error.message}`;
        }
    },
    {
        name: "get_app_logs",
        description: "Fetch stdout/stderr logs for an app previously started with run_app, to confirm it started successfully or diagnose a crash.",
        schema: z.object({
            app_id: z.string().describe("The app_id returned by run_app"),
        }),
    }
);

export const stop_app = tool(
    async ({ app_id }: { app_id: string }) => {
        const entry = runningApps.get(app_id);
        if (!entry) return `No running app found for app_id "${app_id}". It may have already been stopped.`;

        try {
            await entry.sandbox.kill();
            await entry.sandbox.close();
        } finally {
            runningApps.delete(app_id);
        }

        return `App "${app_id}" stopped and its sandbox was cleaned up.`;
    },
    {
        name: "stop_app",
        description: "Stop an app previously started with run_app and clean up its sandbox.",
        schema: z.object({
            app_id: z.string().describe("The app_id returned by run_app"),
        }),
    }
);
