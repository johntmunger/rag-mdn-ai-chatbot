### MDN-Grounded RAG Developer Assistant

This project implements a production-oriented **Retrieval-Augmented Generation (RAG)** pipeline that grounds LLM responses in official **MDN documentation** to provide technically accurate, citation-backed developer assistance.

The system is designed around **controlled retrieval before generation** — prioritizing deterministic context selection, chunking strategy, and evaluation workflows over naive prompt injection.

### System Architecture

The application follows a structured RAG pipeline:

> **Documentation Ingestion → Semantic Chunking → Embedding Generation → Vector Storage → Retrieval → Prompt Assembly → LLM Response → Evaluation**

#### 1. Documentation Ingestion

- **MDN documentation processed via LlamaParse**
- **Markdown normalization and structural cleanup**
- **Structured extraction of headings and semantic blocks**

#### 2. Semantic Chunking & Overlap Tuning

- **Token-based chunking** with configurable window size
- **Overlap strategy** implemented to preserve contextual continuity
- **Tuned chunk boundaries** to balance retrieval precision and embedding efficiency  
- This prevents semantic fragmentation across documentation sections.

#### 3. Embedding & Vector Retrieval

- **Embeddings generated per chunk**
- **Stored in PostgreSQL using `pgvector`**
- **Top-k similarity search** retrieves semantically relevant context
- **Contextual embeddings preserved** for citation mapping

#### 4. Prompt Assembly & Grounding

- Retrieved documentation injected into **structured prompt templates**
- **Citation markers** mapped to original MDN sources
- **LLM responses constrained** to retrieved context

#### 5. Evaluation & Quality Control

- Prompt evaluation workflows implemented using **Promptfoo**
- **Output quality validated** against expected answer criteria
- **Retrieval precision refined** via chunk size and overlap adjustments

### Design Principles

- **Grounded responses** over generative hallucination
- **Retrieval-first architecture**
- **Context window optimization** via overlap tuning
- **Transparent citation mapping** for developer trust
- **Evaluation-driven iteration**

### Interface Layer (Secondary)

A developer-focused frontend interface built with:

- **Next.js (App Router)**
- **Tailwind CSS**
- **Markdown rendering with syntax highlighting**
- **Citation tooltips and expandable source references**

The interface is intentionally minimal — the core focus of the project is **retrieval architecture** and **evaluation fidelity**.
