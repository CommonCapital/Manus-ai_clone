import fs from "fs";
import path from "path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import pptxgen from "pptxgenjs";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { chromium } from "playwright";

// All generated binaries land here. Next.js serves /public at the site root,
// so a file written to public/generated/foo.pptx is downloadable at
// /generated/foo.pptx — that URL is what gets surfaced to the Agent Computer.
const OUTPUT_DIR = path.join(process.cwd(), "public", "generated");

// A restrained, consulting-grade palette (deep navy + teal accent + neutral
// grays). Used as the default across every generator so output looks like one
// coherent deck/report rather than clip-art.
const THEME = {
    navy: "1F2A44",
    teal: "2E9B8F",
    slate: "3D4657",
    lightGray: "F4F6F8",
    midGray: "8A94A6",
    white: "FFFFFF",
    accent: "E8B04B",
    // categorical series for charts (color-blind-safe-ish)
    series: ["2E9B8F", "1F2A44", "E8B04B", "C0504D", "8064A2", "4BACC6"],
    font: "Arial",
};

function slugify(name: string) {
    return name.replace(/[^a-z0-9-_]+/gi, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function outPath(filename: string, ext: string) {
    const base = slugify(filename.replace(new RegExp(`\\.${ext}$`, "i"), "")) || `document_${Date.now()}`;
    const finalName = `${base}_${Date.now()}.${ext}`;
    return { finalName, fullPath: path.join(OUTPUT_DIR, finalName), url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/generated/${finalName}` };
}

async function emitFile(toolConfig: any, finalName: string, url: string, kind: string) {
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
    if (toolConfig?.writer) {
        toolConfig.writer({
            agent_document: "agent_document",
            filename: finalName,
            url,
            kind, // pptx | xlsx | docx | pdf
        });
    }
}

/* ─────────────────────────── PowerPoint (.pptx) ─────────────────────────── */

const slideSchema = z.object({
    title: z.string().optional().describe("Slide title"),
    subtitle: z.string().optional().describe("Optional subtitle / kicker"),
    bullets: z.array(z.string()).optional().describe("Bullet points"),
    // A chart turns this slide into a data slide (McKinsey-style)
    chart: z.object({
        type: z.enum(["bar", "line", "pie", "doughnut"]).describe("Chart type"),
        categories: z.array(z.string()).describe("X-axis / category labels"),
        series: z.array(z.object({
            name: z.string(),
            values: z.array(z.number()),
        })).describe("One or more data series"),
    }).optional(),
    table: z.object({
        headers: z.array(z.string()),
        rows: z.array(z.array(z.string())),
    }).optional().describe("A data table"),
    notes: z.string().optional().describe("Speaker notes"),
});

export const generate_pptx = tool(
    async ({ filename, title, subtitle, slides }: any, toolConfig: any) => {
        try {
            await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
            const pptx = new pptxgen();
            pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
            pptx.defineSlideMaster({
                title: "MASTER",
                background: { color: THEME.white },
                objects: [
                    { rect: { x: 0, y: 0, w: "100%", h: 0.25, fill: { color: THEME.navy } } },
                    { rect: { x: 0, y: 7.25, w: "100%", h: 0.25, fill: { color: THEME.teal } } },
                ],
            });

            // Title slide
            const cover = pptx.addSlide({ masterName: "MASTER" });
            cover.background = { color: THEME.navy };
            cover.addText(title || "Presentation", {
                x: 0.7, y: 2.6, w: 12, h: 1.2, fontSize: 40, bold: true, color: THEME.white, fontFace: THEME.font,
            });
            if (subtitle) {
                cover.addText(subtitle, { x: 0.7, y: 3.9, w: 12, h: 0.8, fontSize: 20, color: THEME.teal, fontFace: THEME.font });
            }

            for (const s of (slides ?? [])) {
                const slide = pptx.addSlide({ masterName: "MASTER" });
                if (s.title) {
                    slide.addText(s.title, { x: 0.6, y: 0.4, w: 12, h: 0.8, fontSize: 26, bold: true, color: THEME.navy, fontFace: THEME.font });
                }
                if (s.subtitle) {
                    slide.addText(s.subtitle, { x: 0.6, y: 1.15, w: 12, h: 0.5, fontSize: 14, color: THEME.midGray, fontFace: THEME.font, italic: true });
                }

                let contentTop = 1.7;

                if (s.bullets?.length) {
                    slide.addText(
                        s.bullets.map((b: string) => ({ text: b, options: { bullet: { indent: 15 }, fontSize: 16, color: THEME.slate, paraSpaceAfter: 8 } })),
                        { x: 0.7, y: contentTop, w: s.chart || s.table ? 5.8 : 12, h: 4.5, fontFace: THEME.font, valign: "top" }
                    );
                }

                if (s.chart) {
                    const chartData = s.chart.series.map((ser: any) => ({
                        name: ser.name,
                        labels: s.chart.categories,
                        values: ser.values,
                    }));
                    const typeMap: any = { bar: pptx.ChartType.bar, line: pptx.ChartType.line, pie: pptx.ChartType.pie, doughnut: pptx.ChartType.doughnut };
                    const chartX = s.bullets?.length ? 6.7 : 1.5;
                    const chartW = s.bullets?.length ? 6 : 10;
                    slide.addChart(typeMap[s.chart.type], chartData, {
                        x: chartX, y: contentTop, w: chartW, h: 4.5,
                        chartColors: THEME.series,
                        showLegend: true, legendPos: "b", legendColor: THEME.slate, legendFontSize: 11,
                        showTitle: false, showValue: s.chart.type === "pie" || s.chart.type === "doughnut",
                        catAxisLabelColor: THEME.slate, valAxisLabelColor: THEME.slate,
                        catAxisLabelFontSize: 10, valAxisLabelFontSize: 10,
                    });
                }

                if (s.table) {
                    const headerRow = s.table.headers.map((h: string) => ({ text: h, options: { bold: true, color: THEME.white, fill: THEME.navy, fontSize: 12, align: "center" } }));
                    const bodyRows = s.table.rows.map((r: string[], i: number) =>
                        r.map((c) => ({ text: String(c), options: { fontSize: 11, color: THEME.slate, fill: i % 2 ? THEME.lightGray : THEME.white, align: "left" } }))
                    );
                    slide.addTable([headerRow, ...bodyRows], {
                        x: 0.7, y: s.bullets?.length ? contentTop + 3 : contentTop, w: 12,
                        border: { type: "solid", pt: 0.5, color: "D9DEE5" }, fontFace: THEME.font,
                    });
                }

                if (s.notes) slide.addNotes(s.notes);
            }

            const { finalName, fullPath, url } = outPath(filename, "pptx");
            const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
            await fs.promises.writeFile(fullPath, buffer);
            await emitFile(toolConfig, finalName, url, "pptx");

            return JSON.stringify({ message: `PowerPoint created: ${finalName} (${(slides?.length ?? 0) + 1} slides)`, filename: finalName, url });
        } catch (error: any) {
            return `Error generating PowerPoint: ${error.message}`;
        }
    },
    {
        name: "generate_pptx",
        description: `Generate a polished, consulting-grade PowerPoint (.pptx) presentation from structured content, and surface it on the Agent Computer with a download link.

Each slide can contain any mix of: a title, subtitle, bullet points, a data chart (bar/line/pie/doughnut), and/or a data table. Charts and tables get a clean navy/teal McKinsey-style theme automatically. Use charts + short bullets for dashboard-style / executive slides.`,
        schema: z.object({
            filename: z.string().describe("Base name for the file (no extension needed)"),
            title: z.string().describe("Title-slide headline"),
            subtitle: z.string().optional().describe("Title-slide subtitle"),
            slides: z.array(slideSchema).describe("The content slides"),
        }),
    }
);

/* ─────────────────────────── Excel (.xlsx) ─────────────────────────── */

export const generate_xlsx = tool(
    async ({ filename, sheets }: any, toolConfig: any) => {
        try {
            await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
            const wb = new ExcelJS.Workbook();
            wb.creator = "Agent";
            wb.created = new Date();

            for (const sheet of (sheets ?? [])) {
                const ws = wb.addWorksheet(sheet.name?.slice(0, 31) || "Sheet");
                const headers: string[] = sheet.headers ?? [];
                const rows: any[][] = sheet.rows ?? [];

                if (headers.length) {
                    const headerRow = ws.addRow(headers);
                    headerRow.eachCell((cell) => {
                        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
                        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${THEME.navy}` } };
                        cell.alignment = { vertical: "middle", horizontal: "center" };
                        cell.border = { bottom: { style: "thin", color: { argb: "FFD9DEE5" } } };
                    });
                    headerRow.height = 22;
                }

                rows.forEach((r, i) => {
                    const row = ws.addRow(r);
                    row.eachCell((cell) => {
                        cell.font = { size: 11, color: { argb: `FF${THEME.slate}` } };
                        if (i % 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${THEME.lightGray}` } };
                        cell.border = { bottom: { style: "hair", color: { argb: "FFE5E9EE" } } };
                    });
                });

                // Auto-size columns to content
                ws.columns.forEach((col) => {
                    let max = 10;
                    col.eachCell?.({ includeEmpty: false }, (cell) => {
                        max = Math.max(max, String(cell.value ?? "").length + 2);
                    });
                    col.width = Math.min(max, 60);
                });

                if (headers.length) ws.views = [{ state: "frozen", ySplit: 1 }];
            }

            const { finalName, fullPath, url } = outPath(filename, "xlsx");
            const buffer = await wb.xlsx.writeBuffer();
            await fs.promises.writeFile(fullPath, Buffer.from(buffer));
            await emitFile(toolConfig, finalName, url, "xlsx");

            return JSON.stringify({ message: `Excel workbook created: ${finalName} (${sheets?.length ?? 0} sheet(s))`, filename: finalName, url });
        } catch (error: any) {
            return `Error generating Excel: ${error.message}`;
        }
    },
    {
        name: "generate_xlsx",
        description: `Generate a styled Excel spreadsheet (.xlsx) with one or more sheets, and surface it on the Agent Computer with a download link. Headers get a navy banner, rows get zebra striping, columns auto-size, and the header row is frozen. Use for data tables, financial models, trackers.`,
        schema: z.object({
            filename: z.string().describe("Base name for the file (no extension needed)"),
            sheets: z.array(z.object({
                name: z.string().describe("Sheet/tab name"),
                headers: z.array(z.string()).describe("Column headers"),
                rows: z.array(z.array(z.union([z.string(), z.number()]))).describe("Row data, each row an array of cell values"),
            })).describe("One or more sheets"),
        }),
    }
);

/* ─────────────────────────── Word (.docx) ─────────────────────────── */

export const generate_docx = tool(
    async ({ filename, title, sections }: any, toolConfig: any) => {
        try {
            await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
            const children: any[] = [];

            if (title) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: title, bold: true, size: 56, color: THEME.navy, font: THEME.font })],
                    spacing: { after: 300 },
                }));
            }

            for (const sec of (sections ?? [])) {
                if (sec.heading) {
                    children.push(new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: sec.heading, bold: true, size: 32, color: THEME.teal, font: THEME.font })],
                        spacing: { before: 240, after: 120 },
                    }));
                }
                for (const p of (sec.paragraphs ?? [])) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: p, size: 22, color: THEME.slate, font: THEME.font })],
                        spacing: { after: 120 },
                    }));
                }
                for (const b of (sec.bullets ?? [])) {
                    children.push(new Paragraph({
                        bullet: { level: 0 },
                        children: [new TextRun({ text: b, size: 22, color: THEME.slate, font: THEME.font })],
                        spacing: { after: 60 },
                    }));
                }
                if (sec.table) {
                    const headerCells = sec.table.headers.map((h: string) => new TableCell({
                        shading: { fill: THEME.navy },
                        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20, font: THEME.font })] })],
                    }));
                    const bodyRows = sec.table.rows.map((r: string[], i: number) => new TableRow({
                        children: r.map((c) => new TableCell({
                            shading: i % 2 ? { fill: THEME.lightGray } : undefined,
                            children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 20, color: THEME.slate, font: THEME.font })] })],
                        })),
                    }));
                    children.push(new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [new TableRow({ children: headerCells }), ...bodyRows],
                    }));
                    children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
                }
            }

            const doc = new Document({ sections: [{ children }] });
            const { finalName, fullPath, url } = outPath(filename, "docx");
            const buffer = await Packer.toBuffer(doc);
            await fs.promises.writeFile(fullPath, buffer);
            await emitFile(toolConfig, finalName, url, "docx");

            return JSON.stringify({ message: `Word document created: ${finalName}`, filename: finalName, url });
        } catch (error: any) {
            return `Error generating Word document: ${error.message}`;
        }
    },
    {
        name: "generate_docx",
        description: `Generate a formatted Word document (.docx) with a title and sections (headings, paragraphs, bullet lists, tables), and surface it on the Agent Computer with a download link. Use for reports, memos, proposals, documentation.`,
        schema: z.object({
            filename: z.string().describe("Base name for the file (no extension needed)"),
            title: z.string().describe("Document title"),
            sections: z.array(z.object({
                heading: z.string().optional(),
                paragraphs: z.array(z.string()).optional(),
                bullets: z.array(z.string()).optional(),
                table: z.object({ headers: z.array(z.string()), rows: z.array(z.array(z.string())) }).optional(),
            })).describe("Document sections in order"),
        }),
    }
);

/* ─────────────────────────── PDF (via HTML → Playwright) ─────────────────────────── */

export const generate_pdf = tool(
    async ({ filename, html, title }: any, toolConfig: any) => {
        let browser;
        try {
            await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
            // Wrap the agent-provided HTML body in a clean, print-optimized shell
            // with a consulting-grade default stylesheet so even minimal HTML
            // renders as a polished report/dashboard.
            const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
                @page { margin: 18mm; }
                * { box-sizing: border-box; }
                body { font-family: Arial, Helvetica, sans-serif; color: #${THEME.slate}; margin: 0; font-size: 12px; line-height: 1.5; }
                h1 { color: #${THEME.navy}; font-size: 26px; margin: 0 0 4px; }
                h2 { color: #${THEME.teal}; font-size: 18px; border-bottom: 2px solid #${THEME.teal}; padding-bottom: 4px; margin-top: 24px; }
                h3 { color: #${THEME.navy}; font-size: 14px; margin-top: 16px; }
                table { width: 100%; border-collapse: collapse; margin: 12px 0; }
                th { background: #${THEME.navy}; color: #fff; padding: 8px; text-align: left; font-size: 12px; }
                td { padding: 8px; border-bottom: 1px solid #E5E9EE; }
                tr:nth-child(even) td { background: #${THEME.lightGray}; }
                .kpi { display: inline-block; background: #${THEME.lightGray}; border-left: 4px solid #${THEME.teal}; padding: 10px 16px; margin: 6px; border-radius: 4px; }
                .kpi .num { font-size: 24px; font-weight: bold; color: #${THEME.navy}; display:block; }
                .kpi .label { font-size: 11px; color: #${THEME.midGray}; }
            </style></head><body>${title ? `<h1>${title}</h1>` : ""}${html}</body></html>`;

            browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();
            await page.setContent(fullHtml, { waitUntil: "networkidle", timeout: 20000 });

            const { finalName, fullPath, url } = outPath(filename, "pdf");
            await page.pdf({ path: fullPath, format: "A4", printBackground: true });
            await emitFile(toolConfig, finalName, url, "pdf");

            return JSON.stringify({ message: `PDF created: ${finalName}`, filename: finalName, url });
        } catch (error: any) {
            return `Error generating PDF: ${error.message}`;
        } finally {
            await browser?.close().catch(() => {});
        }
    },
    {
        name: "generate_pdf",
        description: `Generate a polished PDF from HTML, and surface it on the Agent Computer with a download link + inline preview. The HTML is rendered by a real browser (full CSS support), so this is the best tool for visually rich documents and McKinsey-style dashboards: use <h1>/<h2>, tables, and <div class="kpi"><span class="num">42%</span><span class="label">Growth</span></div> KPI cards — a clean consulting stylesheet is applied automatically. For charts, include inline SVG or a charting approach in the HTML.`,
        schema: z.object({
            filename: z.string().describe("Base name for the file (no extension needed)"),
            title: z.string().optional().describe("Report title (rendered as the top H1)"),
            html: z.string().describe("HTML body content (no <html>/<head>/<body> tags needed). Supports headings, tables, KPI cards, inline SVG charts, and full CSS."),
        }),
    }
);

export const documentTools = [generate_pptx, generate_xlsx, generate_docx, generate_pdf];
