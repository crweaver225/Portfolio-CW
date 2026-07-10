---
title: Guardian
seo_title: Guardian
summary: Guardian is a local AI safety suite that sits between your application and a locally-running language model.
description: Every prompt passes through a layered safety pipeline before reaching the model, and every response is screened before it is returned. Everything runs on your machine — no cloud APIs, no external data transmission..

slug: Guardian - AI Safety
author: Christopher Weaver

draft: false
date: 2026-07-01T03:52:30-05:00
publishDate: 2026-07-01T03:52:30-05:00

project types: 
    - Personal

techstack:
    - Haskell
    - C++
    - AI
live_url: https://github.com/crweaver225/Guardian
source_url: https://github.com/crweaver225/Guardian
feature_image: guardian_project_logo2.png
---

# Guardian

Guardian is a local AI safety suite that sits between your application and a locally-running language model. Every prompt passes through a layered safety pipeline before reaching the model, and every response is screened before it is returned. Everything runs on your machine — no cloud APIs, no external data transmission.

The core proxy and orchestration layer is written in Haskell. Model inference is handled by llama.cpp via a C FFI bridge. Neural classifiers (PromptGuard) run via ONNX Runtime through a second C FFI bridge. Python is used only for alignment research and interpretability (Phases 8–9).

A second model (the LLM judge) can be loaded alongside the main model and LLaMA Guard to provide alignment checking via Gate 5. The judge is kept separate from the generation model to avoid conflict of interest.

![block example](blockExample.png "block example")

---

## What it does

A request to Guardian's proxy goes through five sequential gates:

```
Client
  │
  ▼
┌─────────────────────────────────────────────────────┐
│  Gate 1 — PromptGuard pre-screen                    │
│  DeBERTa-v3 neural jailbreak/injection detector     │
│  Runs locally via ONNX Runtime                      │
│  Malicious prompt → 403 before any LLM call         │
└──────────────────────────┬──────────────────────────┘
                           │ benign
                           ▼
┌─────────────────────────────────────────────────────┐
│  Gate 2 — Filter rules + ML classifier              │
│  Configurable regex/keyword rules (config.yaml)     │
│  Optional bag-of-words classifier as second pass    │
│  Block / warn / pass per rule                       │
└──────────────────────────┬──────────────────────────┘
                           │ pass
                           ▼
┌─────────────────────────────────────────────────────┐
│  Inference server                                   │
│  llama.cpp via C FFI                                │
│  Supports streaming and non-streaming responses     │
│  Supports reasoning models (DeepSeek-R1, Phi-4, …) │
└──────────────────────────┬──────────────────────────┘
                           │ raw response
                           ▼
┌─────────────────────────────────────────────────────┐
│  Reasoning parser                                   │
│  Splits <think>…</think> trace from final answer    │
│  Trace written to audit log; answer passed forward  │
│  Client receives only the answer by default         │
└──────────────────────────┬──────────────────────────┘
                           │ trace + answer
                           ▼
┌─────────────────────────────────────────────────────┐
│  Gate 5a — LLM reasoning judge                      │
│  Separate judge model loaded in inference server    │
│  Reads the <think> trace and the final answer       │
│  Detects deliberate deception: model knowing the    │
│  answer is wrong but giving it anyway, hiding facts,│
│  or planning to mislead the user                    │
│  Structured verdict: {observation, thought,         │
│    conclusion} — fail-safe: parse error → pass      │
│  Deceptive trace → 403 (hard_block) or log (warn)   │
└──────────────────────────┬──────────────────────────┘
                           │ honest (or no trace)
                           ▼
┌─────────────────────────────────────────────────────┐
│  Gate 3 — LLaMA Guard post-screen                   │
│  LLaMA Guard 3 8B running via llama.cpp             │
│  Screens the final answer (not the reasoning trace) │
│  against 13 safety categories                       │
│  Unsafe response → 403 before returning to client   │
└──────────────────────────┬──────────────────────────┘
                           │ safe
                           ▼
┌─────────────────────────────────────────────────────┐
│  Gate 4 — CodeGuard static analysis                 │
│  Pure Haskell — no external service or model        │
│  Extracts fenced code blocks and pattern-matches    │
│  against known-dangerous constructs (eval, exec,    │
│  os.system, rm -rf, reverse shells, …)              │
│  Dangerous code → 403 before returning to client    │
└──────────────────────────┬──────────────────────────┘
                           │ clean
                           ▼
                        Client

Every request/response is written to a SQLite audit log,
including the full reasoning trace and judge verdict when present.
```

Gate 5 also applies inside the agent loop as **Gate 5b**: after each tool call, the judge checks whether the proposed action is still aligned with the user's original goal. This defends against prompt injection attacks where a malicious tool result hijacks the agent's objective. Misaligned actions are blocked before tool execution (`BlockedByJudge`).

Every gate is optional and independently configurable. Gates 1, 3, 4, and 5 can each be individually disabled via `config.yaml`. If PromptGuard or LLaMA Guard is not running, that gate is skipped and the request passes through — the pipeline degrades gracefully rather than failing. Gate 4 (CodeGuard) runs in-process and is always available when enabled. Gate 5 requires a judge model or falls back to the main model (not recommended for production — set `JUDGE_MODEL_PATH` to avoid conflict of interest).

---

## Architecture

```
guardian/
├── core-ffi/               C++ shared library wrapping llama.cpp
├── core-onnx/              C++ shared library wrapping ONNX Runtime + SentencePiece
├── inference-server/       Haskell HTTP server (Warp + Servant) — calls core-ffi via FFI
├── promptguard-server/     Haskell HTTP server — calls core-onnx via FFI
├── proxy/                  Haskell proxy — audit log, filter rules, pipeline orchestration
├── benchmark/              Haskell benchmark harness (TruthfulQA, HarmBench)
├── guardian-ui/            React + TypeScript admin SPA (Vite) — chat, filter admin, audit log, analytics, config, dashboard
├── tool-executor/          Haskell sidecar — sandboxed tool execution for agent mode
├── research/               Python — interpretability research (TransformerLens, PyTorch)
├── models/                 GGUF + ONNX model files (gitignored)
├── scripts/                Utilities (GPU layer detection, ONNX export)
├── schemas/                JSON Schema definitions shared across services
├── dev.sh                  Single-command local stack launcher
└── Makefile                Build orchestration
```

### Service ports (defaults)

| Service | Port | Purpose |
|---|---|---|
| Proxy | 8000 | Main entry point — all client requests go here |
| Inference server | 8001 | llama.cpp generation + LLaMA Guard screening |
| PromptGuard server | 8003 | DeBERTa-v3 jailbreak/injection classification |
| Guardian UI | 8000 (built) / 5173 (dev) | React admin SPA — served by the proxy at `/` once built; `make run-ui` runs the Vite dev server with hot-reload instead |

### Key design decisions

- **Haskell-first** — the proxy, inference server, benchmark harness, and UI are all Haskell. C++ is used only at the llama.cpp and ONNX Runtime FFI boundary.
- **Fail-safe gates** — a gate that errors (network error, service down) returns `Nothing` and is treated as benign. The proxy never fails closed in a way that breaks all requests. The LLM judge follows the same principle: a parse error or network failure is treated as `pass`, not `block`.
- **No Python in the hot path** — inference, pre-screening, post-screening, code analysis, and audit logging run without a Python interpreter.
- **Immutable filter rules at runtime** — rules are loaded from `config.yaml` at startup. Changes require a proxy restart, keeping the running configuration fully auditable from the config file.
- **Judge separation** — the LLM judge is loaded as a distinct model in the inference server process (via `JUDGE_MODEL_PATH`), separate from the generation model. Using the same model to judge its own output creates a conflict of interest.
- **Stateful sessions at constant gate cost** — `/chat` stores conversation history server-side keyed by a session UUID, so clients send only new messages on each turn. Safety gates evaluate only the new user message and new response regardless of conversation length, keeping gate overhead O(1) per turn. The inference server pairs this with a KV-cache session so previously evaluated tokens are not reprocessed either.
- **Versioned schema migrations** — the SQLite audit database is managed by a sequential migration runner (`Proxy.Migrate`). Each schema change is a numbered migration applied exactly once and recorded in a `schema_version` table. Existing databases are upgraded automatically on startup; re-running against an already-migrated database is a no-op.