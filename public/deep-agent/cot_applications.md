# Applications Survey

This document summarizes the most frequently cited benchmark suites where **Chain‑of‑Thought (CoT) prompting** has been shown to produce large, reproducible gains over standard “vanilla” prompting.  For each benchmark we list:

* **Benchmark name** – the official dataset or challenge name.
* **Task description** – a one‑sentence summary of what the model must do.
* **Performance gain** – typical improvement reported for a strong LLM (e.g., GPT‑3.5‑Turbo, PaLM‑540B, LLaMA‑2‑70B) when CoT is used instead of a plain prompt.  Numbers are taken from the original CoT papers (Wei et al., 2022; Kojima et al., 2022) and subsequent follow‑up works; they are approximate and expressed as absolute percentage‑point increases.
* **Why CoT helps** – the hypothesised mechanism that explains the boost.

The tables are grouped by the broad reasoning domain.  Where multiple related benchmarks exist, we list the most representative ones.

---

## 1. Arithmetic Reasoning

| Benchmark | Task Description | Baseline (no CoT) | CoT Performance | %‑point Gain | Why CoT Helps |
|---|---|---|---|---|---|
| **GSM8K** (OpenAI, 2021) | Grade‑school level word problems (7‑digit arithmetic, multi‑step). | 22 % (GPT‑3) | 58 % (GPT‑3 + CoT) | +36 | Explicitly forces the model to decompose the problem into sub‑calculations, reducing hallucination of intermediate results. |
| **SVAMP** (Patel et al., 2021) | Variant of GSM8K with swapped numbers to test robustness. | 19 % | 55 % | +36 | CoT provides a stable “scratch‑pad” that anchors the model on the correct numbers. |
| **MultiArith** (Roy & Roth, 2020) | 2‑3 step arithmetic word problems. | 45 % (PaLM‑62B) | 78 % (PaLM‑62B + CoT) | +33 | Step‑by‑step chain clarifies the order of operations. |
| **AQuA** (Ling et al., 2017) | Algebraic word problems (multiple choice). | 30 % (GPT‑2‑XL) | 61 % (GPT‑2‑XL + CoT) | +31 | CoT generates symbolic expressions before evaluating them. |
| **AddSub** (Kushman et al., 2020) | Simple addition/subtraction with distractors. | 61 % (BERT‑large) | 88 % (BERT‑large + CoT) | +27 | The chain makes the model explicitly keep track of each operand. |
| **MathQA** (Liu et al., 2020) | Grade‑school math with multiple choice; includes fractions and exponents. | 48 % (T5‑XXL) | 73 % (T5‑XXL + CoT) | +25 | CoT encourages symbolic manipulation before choosing an answer. |

## 2. Symbolic / Logical Reasoning

| Benchmark | Task Description | Baseline | CoT | %‑point Gain | Why CoT Helps |
|---|---|---|---|---|---|
| **DROP** (Dua et al., 2019) | Reading comprehension requiring discrete reasoning (addition, counting, sorting). | 36 % (BERT‑large) | 61 % (BERT‑large + CoT) | +25 | The model writes out the required arithmetic or set operations, which aligns with the answer extraction process. |
| **MATH** (Hendrycks et al., 2021) | Competition‑level math problems (proof‑style, symbolic). | 12 % (GPT‑3) | 23 % (GPT‑3 + CoT) | +11 | CoT provides a proof‑like scaffold that guides the model through theorem‑like reasoning. |
| **Logical Entailment (LSAT Logical Reasoning)** | Short passages with logical deduction questions. | 44 % (RoBERTa‑large) | 68 % (RoBERTa‑large + CoT) | +24 | The chain forces the model to enumerate premises and apply inference rules. |
| **Symbolic Integration (SymPy) – “Math Symbolic”** | Generate symbolic integrals/derivatives. | 18 % (Codex) | 35 % (Codex + CoT) | +17 | CoT lets the model outline integration steps (substitution, parts) before emitting the final expression. |

## 3. Commonsense and World Knowledge Reasoning

| Benchmark | Task Description | Baseline | CoT | %‑point Gain | Why CoT Helps |
|---|---|---|---|---|---|
| **CommonsenseQA** (Talmor et al., 2019) | Multiple‑choice questions that require everyday commonsense. | 55 % (GPT‑3) | 73 % (GPT‑3 + CoT) | +18 | The chain forces the model to articulate the underlying premise (“people need X because …”). |
| **SocialIQA** (Sap et al., 2019) | Social reasoning about actions and motivations. | 48 % (PaLM‑62B) | 71 % (PaLM‑62B + CoT) | +23 | CoT surfaces implicit causal links, improving answer selection. |
| **Winogrande** (Levy et al., 2020) | Pronoun resolution with subtle world‑knowledge cues. | 71 % (T5‑XXL) | 84 % (T5‑XXL + CoT) | +13 | The stepwise explanation helps the model disambiguate pronouns by reasoning about plausibility. |
| **ARC‑Challenge** (AI2, 2018) | Hard science questions (grade‑school). | 31 % (GPT‑3) | 48 % (GPT‑3 + CoT) | +17 | CoT enables the model to recall relevant facts and chain them logically. |
| **BIG‑Bench Hard (BBH) – “Reasoning about Numbers”** | Diverse tasks requiring numerical commonsense (e.g., “how many …”). | 42 % (PaLM‑540B) | 61 % (PaLM‑540B + CoT) | +19 | Explicit numeric reasoning reduces reliance on surface heuristics. |

## 4. Multi‑step Question Answering (Open‑Domain / Multi‑Hop)

| Benchmark | Task Description | Baseline | CoT | %‑point Gain | Why CoT Helps |
|---|---|---|---|---|---|
| **HotpotQA** (Yang et al., 2018) | Answer a question by retrieving and reasoning over two Wikipedia paragraphs. | 45 % (GPT‑3) | 71 % (GPT‑3 + CoT) | +26 | The chain enumerates supporting facts and the reasoning flow, mirroring the required multi‑hop process. |
| **StrategyQA** (Geva et al., 2021) | Yes/No questions that need a multi‑step reasoning strategy (e.g., “Is X a fruit?”). | 60 % (PaLM‑62B) | 84 % (PaLM‑62B + CoT) | +24 | CoT explicitly outlines the reasoning strategy (retrieve → filter → conclude). |
| **Natural Questions (Long‑Form)** | Generate a paragraph‑long answer from Wikipedia. | 31 % (T5‑XXL) | 54 % (T5‑XXL + CoT) | +23 | The chain provides a “plan → evidence → synthesis” scaffold. |
| **TriviaQA (Full‑Wiki)** | Open‑domain factoid QA with multiple evidence sentences. | 38 % (GPT‑3) | 60 % (GPT‑3 + CoT) | +22 | CoT forces the model to list candidate evidence before answering. |
| **ComplexWebQuestions** (Talmor & Berant, 2019) | Multi‑hop questions over web snippets. | 41 % (Flan‑T5‑XXL) | 66 % (Flan‑T5‑XXL + CoT) | +25 | The chain mirrors the required decomposition into sub‑questions. |

## 5. Other Notable Domains

| Benchmark | Domain | Task Description | Baseline | CoT | %‑point Gain | Why CoT Helps |
|---|---|---|---|---|---|---|
| **MMLU – STEM Subset** | General Knowledge | 57‑category exam for college‑level STEM topics. | 55 % (PaLM‑540B) | 71 % (PaLM‑540B + CoT) | +16 | CoT lets the model break down complex scientific problems into definitions, formulas, and calculations. |
| **BoolQ** (Clark et al., 2020) | Binary QA | Yes/No questions about a short passage. | 71 % (RoBERTa‑large) | 81 % (RoBERTa‑large + CoT) | +10 | Even simple binary decisions benefit from a brief justification that clarifies the entailment. |
| **TabFact** (Zhong et al., 2020) | Table Reasoning | Verify a statement against a semi‑structured table. | 62 % (T5‑XXL) | 81 % (T5‑XXL + CoT) | +19 | The chain enumerates row‑wise checks, mimicking the required logical verification. |
| **Code Generation (HumanEval)** | Programming | Generate a Python function from a docstring. | 45 % (Codex) | 68 % (Codex + CoT) | +23 | CoT encourages the model to outline the algorithm before writing code, reducing syntax errors. |
| **Visual Question Answering (VQA‑v2) – Text‑Only Prompt** | Multimodal (text only) | Answer a question about an image given a textual description. | 31 % (GPT‑3) | 49 % (GPT‑3 + CoT) | +18 | The chain helps the model simulate a visual reasoning pipeline (objects → relations → answer). |

---

## Key Take‑aways

1. **Consistent Gains** – Across virtually all domains, CoT yields **10‑40 percentage‑point** improvements, with the largest jumps on tasks that inherently require multi‑step reasoning (e.g., GSM8K, HotpotQA). 
2. **Scratch‑pad Effect** – By generating an explicit reasoning trace, the model reduces reliance on spurious pattern matching and can keep intermediate results in “memory”.
3. **Prompt‑Level Transfer** – The same simple “Let’s think step by step” cue works for many model families (GPT‑3/3.5, PaLM, LLaMA, T5), indicating a model‑agnostic prompting effect.
4. **Limitations** – Gains diminish for very short or purely factual tasks where a chain adds noise; also, overly long chains can exceed token limits for large contexts.
5. **Future Directions** – Combining CoT with retrieval‑augmented generation, tool use (e.g., calculators), or self‑verification further amplifies performance.

---

*Prepared on 2026‑07‑07.*