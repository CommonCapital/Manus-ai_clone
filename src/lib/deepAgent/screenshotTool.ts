import fs from "fs";
import path from "path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { chromium } from "playwright";

const OUTPUT_DIR = path.join(process.cwd(), "public", "images");

export const take_screenshot = tool(
    async ({ url, fullPage = false }: { url: string; fullPage?: boolean }, toolConfig: any) => {
        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

            await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });

            await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
            const fileName = `screenshot_${Date.now()}.png`;
            const filePath = path.join(OUTPUT_DIR, fileName);

            await page.screenshot({ path: filePath, fullPage });
            const pageTitle = await page.title();

            const src = `${process.env.NEXT_PUBLIC_APP_URL}/images/${fileName}`;

            if (toolConfig?.writer) {
                toolConfig.writer({
                    browser_image: "browser_image",
                    src,
                });
            }

            return JSON.stringify({
                message: `Captured screenshot of "${pageTitle}" (${url})`,
                filename: fileName,
                src,
            });
        } catch (error: any) {
            return `Error taking screenshot: ${error.message}`;
        } finally {
            await browser?.close().catch(() => {});
        }
    },
    {
        name: "take_screenshot",
        description: `
Visit a real website in a headless browser and capture a screenshot.

Unlike read_url (which only fetches raw HTML/text), this tool actually renders
the page with JavaScript, so it works on client-rendered sites, and returns a
visual screenshot instead of text.

Use this when the user wants to see what a page looks like, verify visual
layout/design, check a live deployment, or inspect a site that needs JS to render.
`,
        schema: z.object({
            url: z.string().describe("Full URL to visit, including http(s)://"),
            fullPage: z.boolean().optional().describe("Capture the full scrollable page instead of just the viewport. Defaults to false."),
        }),
    }
);
