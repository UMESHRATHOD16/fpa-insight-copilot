# FP&A Insight Copilot

An AI-powered Financial Planning & Analysis (FP&A) assistant that provides deterministic financial variance calculations, CSV data ingestion, PDF document text extraction, semantic vector search (RAG), evidence-grounded answers with verifiable citations, and a modern React 19 analytics dashboard.

---

## Current Project Status

- **Backend:** **Complete and fully verified** (44/44 automated tests passing).
- **Frontend:** **Complete and fully verified** (React 19 + Vite + Tailwind CSS + Recharts + Lucide React, connecting to all backend endpoints).

---

## Core Capabilities

1. **Deterministic Financial Analysis Engine**:
   - Exact Python `Decimal` arithmetic for total budget, total actual spending, absolute variance, and variance percentages.
   - Per-department variance breakdown, overspending vs. underspending classifications, and zero-budget edge case handling.
   - Authoritative financial figures are **never** calculated by an LLM.

2. **CSV Financial Ingestion**:
   - Robust CSV file parsing with Pandas.
   - Strips currency symbols and commas, normalizes header casings, validates row types, and filters malformed rows with clear diagnostic messages.
   - Includes realistic synthetic sample dataset (`backend/data/samples/sample_financials.csv`).

3. **PDF Document Ingestion & Text Extraction**:
   - Page-by-page text extraction with `pypdf`.
   - Boundary-aware text chunking (~700 characters with 150-character overlap) preserving sentence and paragraph breaks.
   - Ingests and manages financial reports with full document lifecycle endpoints (`upload`, `list`, `chunks`, `delete`).

4. **Evidence-Grounded RAG (Retrieval-Augmented Generation)**:
   - Persistent vector store powered by **ChromaDB**.
   - Embeddings via Google GenAI (`text-embedding-004`) with an offline deterministic fallback for isolated test suites.
   - Grounded Q&A with Gemini 2.5 Flash returning explicit citations (filename, page number, chunk ID, snippet).
   - Defends against prompt injection by tagging untrusted document content with `<untrusted_document_passage>` delimiters.
   - Admits uncertainty when documents do not contain sufficient evidence.

5. **Controlled AI Tool Registry**:
   - Explicit allowlist of approved tools: `calculate_budget_variance`, `summarize_financial_dataset`, `search_financial_documents`.
   - Strict Pydantic input/output validation before execution.
   - No arbitrary shell, Python, or filesystem access.

6. **Enterprise React 19 Frontend**:
   - 5 complete application views: **Overview**, **Financial Analysis**, **Documents**, **AI Copilot**, and **Settings**.
   - Interactive financial charts (Budget vs. Actual, Variance breakdown) using Recharts.
   - Drag-and-drop CSV and PDF uploaders with status and validation notices.
   - Conversational RAG assistant with grounded citation inspection cards.
   - Controlled tool execution panel with direct parameter inputs and live JSON output.

---

## Quick Start Guide

### 1. Run the FastAPI Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Run the React Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
- Application Dashboard: [http://localhost:5173](http://localhost:5173)

---

## Verification & Testing

### Backend Automated Test Suite
```bash
cd backend
./venv/bin/pytest tests -v
```
All **44 tests** pass in ~2.5 seconds without requiring external network access or paid API keys.

### Frontend ESLint & Build
```bash
cd frontend
npm run lint
npm run build
```
Build passes cleanly in <500ms and ESLint passes with zero errors or warnings.

---

## Project Structure

```text
fpa-insight-copilot/
├── PROJECT_GUIDE.md             # Master project specification
├── README.md                    # Root project documentation
├── backend/                     # Complete FastAPI backend
│   ├── app/
│   │   ├── main.py              # Application entrypoint & middleware
│   │   ├── api/                 # API routers: financial, documents, chat, health
│   │   ├── core/config.py       # Pydantic Settings & environment variables
│   │   ├── schemas/             # Pydantic data schemas
│   │   └── services/            # Deterministic arithmetic, CSV, PDF, RAG, LLM, tools
│   ├── data/
│   │   ├── samples/             # Sample CSV & PDF files
│   │   └── chroma/              # Persistent ChromaDB vector store
│   ├── tests/                   # 44 automated unit and integration tests
│   ├── requirements.txt         # Pinned backend dependencies
│   └── README.md                # Comprehensive backend guide & API contracts
├── docs/
│   └── PROGRESS.md              # Milestone tracking & implementation history
└── frontend/                    # React 19 frontend
    ├── src/
    │   ├── components/          # Common, layout, dashboard, financial, documents, chat
    │   ├── context/             # AppContext and useApp hook
    │   ├── pages/               # Overview, FinancialAnalysis, Documents, Copilot, Settings
    │   ├── services/            # Centralized API service layer
    │   └── utils/               # Currency, variance, percentage formatters
    └── README.md                # Frontend documentation & setup instructions
```
