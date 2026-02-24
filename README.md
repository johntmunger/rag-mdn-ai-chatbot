### Retrieval-Grounded LLM

A production-oriented **Retrieval-Augmented Generation (RAG)** system designed to ground LLM responses in **authoritative MDN documentation**.

The architecture prioritizes **deterministic retrieval**, **structured chunking**, and **evaluation-driven iteration** over naive prompt-based generation.

This project demonstrates **retrieval-first LLM integration** suitable for developer tooling and production knowledge systems.

### Architectural Overview

The system follows a structured retrieval pipeline:

> **Documentation Ingestion → Chunking → Embedding → Vector Storage → Retrieval → Prompt Assembly → Response → Evaluation**

#### 1. Documentation Ingestion

- **MDN documentation** processed via LlamaParse
- **Markdown normalization** and structural cleanup
- **Extraction** of headings and semantic blocks  
- *Focus:* preserve structural integrity before embedding.

#### 2. Semantic Chunking & Overlap Strategy

- **Token-based chunking** with configurable window sizing
- **Controlled overlap tuning** to preserve contextual continuity
- **Chunk boundary optimization** for retrieval precision  
- Prevents semantic fragmentation and improves grounding fidelity.

#### 3. Embedding & Vector Retrieval

- **Embeddings generated** per semantic chunk
- **Stored in PostgreSQL** using `pgvector`
- **Top-k similarity retrieval** for contextual grounding
- **Embedding metadata preserved** for citation traceability

#### 4. Prompt Assembly & Context Grounding

- Retrieved documentation injected into **structured prompt templates**
- **Citation markers** mapped to original MDN sources
- **LLM responses constrained** to retrieved context  
- *Emphasis:* retrieval before generation.

#### 5. Evaluation & Quality Control

- Prompt evaluation workflows implemented using **Promptfoo**
- **Output validated** against deterministic answer criteria
- **Retrieval parameters** iteratively tuned for precision  
- Evaluation-first iteration ensures grounding reliability and reduces hallucination risk.

### Design Principles

- **Retrieval-first architecture**
- **Deterministic context selection**
- **Transparent citation mapping**
- **Evaluation-driven refinement**
- **Production-oriented embedding strategy**

### Interface Layer (Secondary)

Minimal developer interface built with:

- **Next.js (App Router)**
- **Tailwind CSS**
- **Markdown rendering** with syntax highlighting
- **Expandable citation references**

The interface is intentionally lightweight. The core focus is **retrieval infrastructure** and **grounding fidelity**.
