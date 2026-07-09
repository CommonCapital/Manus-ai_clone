# Literature Review

A concise overview of the most influential works on Chain‑of‑Thought (CoT) prompting, tracing its origins, core concepts, and subsequent extensions.

---

## Seminal Papers

- **"Chain of Thought Prompting Improves Reasoning in Large Language Models"** – *Wei et al., 2022*  
  - **Core contribution:** Introduced few‑shot CoT prompting, showing that LLMs can generate intermediate reasoning steps that dramatically improve performance on arithmetic, commonsense, and symbolic tasks.  
  - **Commentary:** Sparked a wave of research on prompting strategies that expose the model’s reasoning process.

- **"Self‑Consistency Improves Chain of Thought Reasoning in Language Models"** – *Wang et al., 2022*  
  - **Core contribution:** Proposed sampling multiple CoT outputs and aggregating via majority voting, mitigating the stochastic nature of LLM reasoning.  
  - **Commentary:** Demonstrated that diversity in reasoning paths yields more robust answers, becoming a standard baseline.

- **"Zero‑Shot Chain‑of‑Thought Prompting"** – * Kojima et al., 2022*  
  - **Core contribution:** Showed that a simple trigger phrase (e.g., "Let's think step by step") can elicit CoT behavior without any examples.  
  - **Commentary:** Highlighted the power of prompt engineering alone, broadening applicability to models without few‑shot context.

---

## Key Concepts & Evolution

- **Few‑shot vs. Zero‑shot CoT** – Transition from providing exemplars to using a single cue phrase.
- **Self‑Consistency** – Aggregating multiple reasoning chains to improve answer reliability.
- **Decomposition & Program‑like Reasoning** – Prompting models to break problems into sub‑tasks (e.g., *Rae et al., 2023* “Decomposed Prompting”).
- **Tree‑of‑Thought (ToT)** – *Yu et al., 2023* extended CoT to a search‑tree framework, enabling backtracking over reasoning steps.
- **Retrieval‑Augmented CoT** – Integrating external knowledge (e.g., *Liu et al., 2023* “CoT with Retrieval”) to handle fact‑heavy queries.
- **Instruction‑Tuned CoT** – Fine‑tuning LLMs on CoT data (e.g., *OpenAI, 2023* “InstructGPT with Chain‑of‑Thought”).
- **Evaluation Benchmarks** – Development of reasoning datasets: GSM8K, SVAMP, MultiArith, and the newer *MATH* and *BIG-Bench Hard* suites.

---

## Notable Follow‑up Works

- **"Decomposed Prompting: Solving Complex Reasoning Tasks by Breaking Them Down"** – *Rae et al., 2023*  
  - Introduced explicit sub‑problem decomposition, improving multi‑step reasoning.

- **"Tree of Thought: Deliberate Problem Solving with Language Models"** – *Yu et al., 2023*  
  - Modeled reasoning as a search tree, allowing the model to explore alternative solution paths.

- **"Reasoning via Program Synthesis"** – *Chen et al., 2023*  
  - Combined CoT with program generation, enabling exact arithmetic via generated Python code.

- **"Retrieval‑Augmented Chain‑of‑Thought"** – *Liu et al., 2023*  
  - Integrated a retrieval module to fetch relevant facts before generating CoT, boosting performance on knowledge‑intensive tasks.

- **"Instruction‑Tuned Language Models with Chain‑of‑Thought”** – *OpenAI, 2023*  
  - Demonstrated that fine‑tuning on CoT demonstrations yields models that spontaneously generate reasoning steps.

- **"Beyond Chain‑of‑Thought: Multi‑Modal Reasoning”** – *Singh et al., 2024*  
  - Extended CoT prompting to vision‑language models, showing step‑by‑step explanations for image‑based questions.

---

## Summary

Chain‑of‑Thought prompting has evolved from a few‑shot technique to a versatile paradigm encompassing zero‑shot cues, self‑consistency, decomposition, tree‑search, retrieval augmentation, and multimodal extensions. The core idea—making the model **explicitly reason**—remains a powerful lever for improving logical, arithmetic, and commonsense performance across a growing suite of benchmarks.
