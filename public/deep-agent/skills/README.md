---
name: skill-registry
description: A manifest of all specialized skills available to the agent for complex task execution.
---

# Skills Library

This folder contains specialized Standard Operating Procedures (SOPs) for complex workflows. The agent should reference these when high-level planning is required.

## Available Skills

| Skill Name | Directory | Primary Purpose |
| :--- | :--- | :--- |
| **algorithmic-art** | `./algorithmic-art/` | Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. |
| **brand-guidelines** | `./brand-guidelines/` | Applies Anthropic's official brand colors and typography to artifacts requiring company look-and-feel. |
| **canvas-design** | `./canvas-design/` | Create beautiful visual art in .png and .pdf documents using design philosophy. |
| **claude-api** | `./claude-api/` | Build apps with the Claude API or Anthropic SDK (Python, TypeScript, Java, Go, Ruby, cURL, C#, PHP). |
| **consulting-deliverables** | `./consulting-deliverables/` | Produce real downloadable executive-grade decks, dashboards, reports, and models (.pptx/.pdf/.xlsx/.docx) via generate_pptx/generate_pdf/generate_xlsx/generate_docx. McKinsey-style charts + KPIs. |
| **doc-coauthoring** | `./doc-coauthoring/` | Guide users through structured workflow for co-authoring documentation, proposals, and technical specs. |
| **docx** | `./docx/` | Create, read, edit, or manipulate Word documents (.docx files) with formatting and tracked changes. |
| **flask-app-builder** | `./flask-app-builder/` | Build Flask web applications from scratch (single-file, package-based, or Blueprint architecture). |
| **frontend-design** | `./frontend-design/` | Create distinctive, production-grade frontend interfaces with high design quality. |
| **internal-comms** | `./internal-comms/` | Write internal communications (3P updates, newsletters, FAQs, status reports, incident reports). |
| **mcp-builder** | `./mcp-builder/` | Create high-quality MCP (Model Context Protocol) servers for LLM integration with external services. |
| **pdf** | `./pdf/` | PDF manipulation - reading, creating, editing, and converting PDF documents. |
| **pptx** | `./pptx/` | Create, read, edit, or manipulate PowerPoint presentations (.pptx files). |
| **nodejs-sandbox** | `./nodejs-sandbox/` | Create Node.js applications, run JavaScript scripts, and execute TypeScript code using node:22-slim Docker image. |
| **sandbox** | `./sandbox/` | Export generated projects from sandbox environment to local filesystem. |
| **sandbox-output** | `./sandbox-output/` | Ensure consistent sandbox deployment output with sandbox_id and endpoint_url. |
| **skill-creator** | `./skill-creator/` | Create new skills, modify and improve existing skills, and measure skill performance. |
| **slack-gif-creator** | `./slack-gif-creator/` | Create animated GIFs optimized for Slack with proper dimensions and color optimization. |
| **static-website-asset-paths** | `./static-website-asset-paths/` | Ensure static assets in sandbox websites use absolute paths for correct proxy loading. |
| **theme-factory** | `./theme-factory/` | Style artifacts (slides, docs, reports, HTML pages) with themed colors and fonts. |
| **web-artifacts-builder** | `./web-artifacts-builder/` | Build complex React/Tailwind/shadcn/ui HTML artifacts with state management and routing. |
| **web-research** | `./web-research/` | Advanced web research with query decomposition, source credibility assessment, contradiction resolution, and configurable depth levels (Surface/Standard/Deep). Version 2.0. |
| **webapp-testing** | `./webapp-testing/` | Test local web applications using Playwright automation and screenshot capture. |
| **playwright-skill** | `./playwright-skill/` | Complete browser automation with Playwright (JavaScript/Node.js). Auto-detects dev servers, test pages, fill forms, take screenshots, check responsive design, validate UX, test login flows, check links. |
| **playwright-python-skill** | `./playwright-python-skill/` | Complete browser automation with Playwright for Python. Auto-detects dev servers, test pages, fill forms, take screenshots, check responsive design, validate UX, test login flows, check links. **Includes bot detection avoidance (stealth mode)** for production sites. |
| **xlsx** | `./xlsx/` | Handle spreadsheet files (.xlsx, .xlsm, .csv, .tsv) - read, edit, create, convert, and clean data. |
| **project-organization** | `./project-organization/` | MANDATORY FIRST SKILL for all project-building tasks. Ensures each project has its own isolated working folder with organized structure, README.md, and Todo Sync Protocol for automatic task tracking. |
| **workspace-cleaner** | `./workspace-cleaner/` | Clean up temporary files (reports-*.md) and old todo lists (*.todos.json) from the workspace to maintain organization and prevent confusion. |

---

## Skill Categories

### 📄 Document Skills
| Skill | File Types | Description |
|-------|------------|-------------|
| **docx** | `.docx` | Word document manipulation |
| **pptx** | `.pptx` | PowerPoint presentations |
| **xlsx** | `.xlsx`, `.csv`, `.tsv` | Spreadsheet operations |
| **pdf** | `.pdf` | PDF manipulation |

### 🎨 Design & Visual Skills
| Skill | Output | Description |
|-------|--------|-------------|
| **algorithmic-art** | `.html`, `.js` | Generative art with p5.js |
| **canvas-design** | `.png`, `.pdf` | Visual art and posters |
| **frontend-design** | HTML/CSS/JS | Production-grade frontend interfaces |
| **theme-factory** | Themed docs | Apply themes to artifacts |
| **slack-gif-creator** | `.gif` | Animated GIFs for Slack |

### 🌐 Web & API Skills
| Skill | Purpose | Description |
|-------|---------|-------------|
| **flask-app-builder** | Backend | Build Flask web applications |
| **nodejs-sandbox** | Backend | Node.js/TypeScript sandbox with node:22-slim |
| **web-artifacts-builder** | Frontend | React/Tailwind/shadcn UI artifacts |
| **webapp-testing** | Testing | Playwright-based web app testing |
| **playwright-skill** | Browser Automation (JS) | Complete browser automation with Playwright (JavaScript/Node.js) |
| **playwright-python-skill** | Browser Automation (Python) | Complete browser automation with Playwright for Python. Includes stealth mode for bot detection avoidance. |
| **claude-api** | API | Claude API / Anthropic SDK integration |
| **mcp-builder** | Protocol | MCP server development |

### 📋 Workflow & Communication Skills
| Skill | Purpose | Description |
|-------|---------|-------------|
| **web-research** | Research | Advanced web research with query decomposition, source verification, and structured reporting |
| **doc-coauthoring** | Writing | Documentation co-authoring workflow |
| **internal-comms** | Communication | Internal company communications |
| **skill-creator** | Development | Create and improve skills |

### 🔧 Utility Skills
| Skill | Purpose | Description |
|-------|---------|-------------|
| **project-organization** | Foundation | MANDATORY FIRST SKILL for all project-building tasks with Todo Sync Protocol |
| **nodejs-sandbox** | Node.js | Create/run Node.js applications with node:22-slim image |
| **sandbox** | Deployment | Export projects from sandbox |
| **sandbox-output** | Output | Consistent sandbox output formatting |
| **static-website-asset-paths** | Assets | Fix asset paths for proxy loading |
| **brand-guidelines** | Styling | Apply Anthropic brand standards |
| **workspace-cleaner** | Maintenance | Clean up temporary files and old todo lists |

---

## Global Execution Rules

1. **Always Check Registry**: Before starting a complex task, check if a specialized skill exists.
2. **Tool Preference**: Use the specialized scripts located within each skill's `scripts/` folder when performing domain-specific actions.
3. **Skill Priority**: When multiple skills could apply, prefer the most specific skill for the task.
4. **Project Organization First**: For ANY project-building task (Flask app, React app, API, etc.), ALWAYS execute the `project-organization` skill FIRST to create a dedicated project folder before using other skills.

---

## How to Add a New Skill

1. **Create a new folder** under `skills/` with a concise name (e.g., `my-new-skill`).
2. **Add a `SKILL.md`** file that documents:
   - Goal of the skill
   - Required inputs (parameters, files, configuration)
   - Expected outputs (files, directory layout, documentation)
   - Any optional steps (testing, deployment, benchmarking)
3. **Update this README** by adding a new row to the appropriate table above.

---

*Generated and maintained by the assistant for Ijambo.*