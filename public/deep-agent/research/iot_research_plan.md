# IoT Comprehensive Research Plan

## 1. Objectives
- Provide a holistic overview of the Internet of Things (IoT) ecosystem.
- Cover fundamentals, architecture, communication protocols, security, major platforms, use‑cases, market trends, and future directions.
- Produce deliverables that can be consumed by downstream agents (data‑gathering, analysis, synthesis) and the end‑user.

## 2. Scope & Depth
- **Research Depth**: **Standard** (5‑10 sources, 3‑5 sub‑queries, cross‑verification).
- **Timeframe**: Focus on information up to **Q2 2026**.
- **Geography**: Global perspective with attention to North America, Europe, and APAC.

## 3. Core Topics & Sub‑Queries
| Topic | Sub‑Queries |
|-------|-------------|
| **Fundamentals** | 1. Definition and evolution of IoT (origin, milestones). 2. Key concepts: devices, sensors, actuators, gateways, cloud, edge. |
| **Architecture** | 1. Layered models (perception, network, application, business). 2. Edge vs. cloud computing in IoT. |
| **Protocols** | 1. Low‑power wireless: MQTT, CoAP, LwM2M. 2. Network: IPv6/6LoWPAN, BLE, Zigbee, Z‑Wave, NB‑IoT, LoRaWAN. |
| **Security** | 1. Threat landscape (device hijacking, data interception). 2. Standards: TLS/DTLS, OAuth 2.0, IEC 62443, NIST IoT security framework. |
| **Major Platforms** | 1. Cloud IoT services (AWS IoT Core, Azure IoT Hub, Google Cloud IoT). 2. Open‑source stacks (ThingsBoard, Kaa, Eclipse IoT). |
| **Use‑Cases** | 1. Smart cities (traffic, lighting). 2. Industrial IoT (predictive maintenance). 3. Healthcare (remote monitoring). 4. Agriculture (precision farming). |
| **Market Trends** | 1. Market size & CAGR (2023‑2026). 2. Investment & M&A activity. 3. Emerging standards (Matter, Thread). |
| **Future Directions** | 1. AI‑edge integration. 2. 5G/6G impact on IoT. 3. Sustainability & energy‑harvesting devices. |

## 4. Methodology (per Web‑Research Skill)
1. **Query Planning** – Decompose each topic into 3‑8 targeted sub‑queries (see table above).
2. **Source Collection** – Use `web_search` → `read_url` → `write_file('research/raw/<topic>.md', content)`.
3. **Quality Assessment** – Apply the CREDIBILITY Framework (authority, recency, evidence, objectivity, corroboration).
4. **Verification** – Cross‑reference key claims with ≥2 independent sources.
5. **Synthesis** – Follow the Structured Report Template (executive summary, findings, data tables, contradictions, methodology).

## 5. Deliverables
- **Raw source files** per topic (`research/raw/` folder).
- **Intermediate analysis** (`research/analysis/` folder).
- **Final structured report** (`reports/iot_full_report.md`).
- **Task‑level metadata** (queries used, sources, scores) for downstream agents.

## 6. Timeline (internal)
| Milestone | Owner | Duration |
|-----------|-------|----------|
| Research Plan finalized | Assistant (self) | 30 min |
| Literature Review (Fundamentals & Architecture) | Researcher Sub‑Agent | 2 h |
| Data Gathering (Protocols, Security, Platforms) | Researcher Sub‑Agent | 2 h |
| Use‑Case & Market Trend collection | Researcher Sub‑Agent | 1.5 h |
| Analysis & Gap Identification | Researcher Sub‑Agent | 1 h |
| Synthesis & Report Generation | Researcher Sub‑Agent | 1 h |
| Code Snippets & Workflow docs | Assistant (self) | 1 h |

---
*Prepared by Assistant‑2 on 2026‑07‑09.*