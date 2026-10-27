# FP&A Insight Copilot

An AI-powered Financial Planning & Analysis (FP&A) assistant that provides deterministic financial variance calculations, CSV data ingestion, PDF document text extraction, semantic vector search (RAG), and evidence-grounded answers with verifiable citations.

---

## Current Project Status

- **Backend:** **Complete and fully verified** (44/44 automated tests passing).
- **Frontend:** Pending approval (React frontend will be implemented in the next phase).

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

---

## Quick Start (Backend)

### 1. Setup Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(Optional)* Add your `GEMINI_API_KEY` to `.env` to enable live Gemini generation. If left blank, the backend operates in offline deterministic mode.

### 3. Start the API Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 4. Run Automated Tests
```bash
PYTHONPATH=backend backend/venv/bin/pytest backend/tests -v
```
All **44 tests** pass out of the box without requiring API keys or network access.

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
└── frontend/                    # React frontend workspace (next milestone)
```

For complete API payload specifications, see [backend/README.md](backend/README.md).
