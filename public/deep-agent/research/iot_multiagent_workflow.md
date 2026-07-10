# IoT Multi‑Agent Workflow

## Overview
The IoT deep‑research project is orchestrated by a **Coordinator** (Assistant‑2) that owns the TODO list and spawns specialised sub‑agents.  Each sub‑agent follows the **Web‑Research skill** (see `skills/web-research/SKILL.md`) and communicates through shared files in the `research/` folder.

## Sub‑Agents & Responsibilities
| Sub‑Agent | Role | Main Tasks (from TODO list) | Output File |
|-----------|------|----------------------------|-------------|
| **Coordinator** | Orchestrates workflow, updates TODOs, launches sub‑agents. | - Update TODO status<br>- Spawn sub‑agents via `task` tool<br>- Consolidate results | `research/coordinator_log.md` |
| **Researcher** | Executes the Web‑Research skill to gather literature, data, and analysis. | - Literature review (task id `6ae6dd65…`)<br>- Data gathering (task id `886a3b54…`)<br>- Analysis (task id `8fd354a6…`)<br>- Synthesis (task id `14da0b78…`) | `research/raw_data.md`, `research/analysis.md`, `research/final_report.md` |
| **Data‑Processor** | Normalises raw data (CSV/JSON) for downstream analysis. | - Parse `raw_data.md` into structured tables.<br>- Store as `research/data_processed.json`. | `research/data_processed.json` |
| **Analyst** | Runs statistical/ML scripts on the processed data to extract insights. | - Compare protocols, security standards, market trends.<br>- Produce `research/insights.md`. | `research/insights.md` |
| **Summariser** | Formats the final report using the Structured Report Template from the Web‑Research skill. | - Combine findings, contradictions, methodology notes.<br>- Output `research/final_report.md`. | `research/final_report.md` |
| **Code‑Generator** | Generates code snippets (Python/LangChain) that implement the orchestration logic. | - Produce `code/iot_multiagent_orchestrator.py`.
| **Reviewer** *(optional)* | Validates the final report for completeness and consistency. | - Reads `final_report.md` and writes `review_log.md`. |

## Communication Mechanism
1. **Shared Workspace** – All agents read/write files under the `research/` directory.
2. **TODO List** – The Coordinator updates task status (`pending → in_progress → completed`).
3. **JSON Metadata** – Each sub‑agent writes a small JSON manifest (`*_meta.json`) with timestamps and source citations.

## Execution DAG (Dependencies)
```
Research Plan (completed)
    ↓
Design Workflow (Coordinator)   <-- depends on Research Plan
    ↓
Create TODO list (Coordinator)  <-- depends on Workflow Design
    ↓
+-------------------+-------------------+-------------------+
|   Researcher     |  Data‑Processor   |   Analyst         |
| (literature +    | (clean raw data)  | (run analysis)    |
|   gathering)     |                   |                   |
+-------------------+-------------------+-------------------+
          ↓                 ↓                ↓
        Synthesiser (Summariser) → Final Report
          ↓
      Code‑Generator (produces orchestrator script)
```

## Error Handling & Verification
* Each sub‑agent validates source quality using the **CREDIBILITY Framework** (see skill).  If the average score falls below the threshold, the agent logs a warning and retries with alternative queries.
* The Coordinator checks the JSON manifests; if any required file is missing, it re‑spawns the offending sub‑agent.

## Next Steps (Pending TODOs)
1. **Design Workflow** – Write this markdown (now completed).
2. **Create Structured TODO List** – Generate the detailed task hierarchy (pending).
3. **Provide Code Snippets** – Supply the Python/LangChain orchestrator (pending).
4. **Launch Researcher Sub‑Agent** – Execute the Web‑Research skill to collect IoT literature (pending).
5. **Run Data‑Processor, Analyst, Summariser** – Sequentially after data is gathered (pending).

---
*All sub‑agents will write their outputs to the `research/` folder, and the Coordinator will copy the final artefacts to `sandbox-files/` for export.*