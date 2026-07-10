# Manus AI Clone

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An open-source clone of [Manus](https://manus.im)-style AI agents — a Next.js app where a
LangChain/LangGraph-powered agent plans, spawns sub-agents, browses the web, writes files,
runs code in a sandbox, and reports back through a live streaming chat UI.

## How it works

Requests flow through a two-tier agent pipeline ([`src/lib/graph/graph.ts`](src/lib/graph/graph.ts)):

1. **Assistant-1** ([`src/lib/memo/MemoryAgent.ts`](src/lib/memo/MemoryAgent.ts)) — a lightweight
   router with long-term memory tools. It answers simple questions directly, and remembers things
   you tell it across sessions (goals, preferences, ongoing projects).
2. **Assistant-2** ([`src/lib/deepAgent/deepAgent.ts`](src/lib/deepAgent/deepAgent.ts)) — the "deep
   agent." For anything complex, Assistant-1 hands off to it. It plans a TODO list, spawns
   parallel sub-agents for independent work (via the `task` tool), reads/writes files, browses the
   web, runs code, and can start long-running apps in a sandbox.

Everything streams live over Server-Sent Events to the chat UI — you see sub-agents working, files
being written, and TODO progress update in real time.

### Agent capabilities

| Capability | Tool(s) | Notes |
|---|---|---|
| Plan & track work | `write_todos`, `update_todos`, `read_todos`, `get_next_runnable_tasks` | Dependency-aware TODO list, persisted per workflow |
| Spawn sub-agents | `task` | Parallel, isolated sub-agents for independent work; auto-retries on rate limits |
| Filesystem | `write_file`, `read_file`, `edit_file`, `ls`, `grep`, `glob`, `delete_file` | Sandboxed to a per-conversation workspace |
| Web search & browsing | `web_search` (Exa), `read_url` (Cheerio) | Text/HTML — no JS rendering |
| Screenshots | `take_screenshot` | Real headless-Chromium (Playwright) screenshot of a live URL |
| Code execution | `execute_code` | One-shot Python in a throwaway [OpenSandbox](https://github.com/alibaba/OpenSandbox) container |
| Long-running apps | `run_app`, `get_app_logs`, `stop_app` | Starts a dev server/app in the sandbox and returns a live URL |
| Skills | — | A library of pre-written SOPs under [`public/skills`](public/skills) (PDF/DOCX/XLSX handling, Flask app scaffolding, web research, etc.) the agent reads before tackling a task |

## Tech stack

- **Framework**: Next.js (App Router) + React + Redux Toolkit
- **Agent orchestration**: LangChain + LangGraph
- **LLM providers**: Cerebras, Fireworks (swap/mix via [`src/lib/llm/LLM.ts`](src/lib/llm/LLM.ts))
- **Auth**: NextAuth (Google OAuth) + MongoDB
- **Long-term memory**: Pinecone (vector) + local markdown files
- **Web search**: Exa
- **Sandbox**: [OpenSandbox](https://github.com/alibaba/OpenSandbox) (Docker-based)
- **Browser automation**: Playwright

## Getting started

### Prerequisites

- Node.js 22+
- Docker (for MongoDB + the OpenSandbox code/app sandbox)
- API keys for at least one LLM provider (Cerebras and/or Fireworks)

### Setup

```bash
git clone https://github.com/CommonCapital/Manus-ai_clone.git
cd Manus-ai_clone
npm install
npx playwright install chromium   # needed for take_screenshot
cp .env.example .env              # fill in your own values
docker compose up -d              # starts MongoDB + the OpenSandbox server
npm run dev                       # starts on http://localhost:8000
```

See [`.env.example`](.env.example) for every environment variable the app reads, grouped by what
it's for (database, auth, LLM providers, vector store, web search, sandbox).

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 8000 |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |

## Project structure

```
src/
  app/                  Next.js routes (App Router)
    api/agent/streams/  SSE endpoints that drive the chat pipeline
  lib/
    graph/              The Assistant-1 → Assistant-2 LangGraph orchestration
    memo/               Assistant-1: memory agent, long-term memory storage/retrieval
    deepAgent/           Assistant-2: the deep agent and all its tools (fs, sandbox,
                        screenshots, search, todos, task/sub-agent spawning)
    llm/                LLM provider instances (Cerebras, Fireworks)
  store/                Redux slices driving the chat UI
  components/           Chat UI, agent workspace, file/screenshot viewer
public/
  skills/               The agent's skill library (SKILL.md per skill)
  deep-agent/           Agent's runtime workspace (generated files, per-run TODO lists)
```

## Known limitations

- **Cerebras retries**: `@langchain/cerebras` disables the underlying client's built-in retry
  (`maxRetries: 0`). This app wraps model calls in its own retry/backoff
  ([`src/lib/deepAgent/retry.ts`](src/lib/deepAgent/retry.ts)) to compensate — worth knowing if you
  swap in a different Cerebras-based call path.
- **OpenSandbox on macOS + Docker Desktop**: reaching a spawned sandbox container's own ports from
  outside Docker can require extra `[docker]` config (`network_mode`, `host_ip`) in
  `sandbox.config.toml` — see the [OpenSandbox docs](https://github.com/alibaba/OpenSandbox) if
  `run_app`/`execute_code` can't reach the sandbox.
- **Shared rate limits**: Assistant-1, Assistant-2, and every sub-agent currently share one LLM
  provider's account/quota per provider. Under heavy parallel sub-agent use, splitting traffic
  across providers (Cerebras + Fireworks) reduces contention.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
