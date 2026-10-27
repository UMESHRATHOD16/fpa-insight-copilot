# FP&A Insight Copilot — Backend

AI-powered Financial Planning & Analysis (FP&A) backend service built with **FastAPI**, **Pandas**, **ChromaDB**, and **Google Gemini (GenAI SDK)**.

---

## 1. Overview & Architecture

The backend provides deterministic financial arithmetic, CSV data ingestion, PDF document text extraction, semantic vector search (RAG), and a strictly controlled AI tool execution workflow.

### Core Architectural Principle
- **Calculations are Deterministic**: Financial arithmetic (budget totals, actuals, variances, percentages) is computed using Python's `Decimal` standard library. The LLM is never permitted to calculate authoritative financial figures.
- **RAG for Evidence Grounding**: Uploaded financial PDF reports are parsed into chunks with metadata (document ID, filename, page number, chunk index) and indexed into a local ChromaDB vector store.
- **Controlled Tool Workflow**: Tools are ordinary Python functions executed via an explicit registry. Arbitrary shell, Python, or unvalidated database access is forbidden.
- **Offline & Mockable First**: The system functions completely without an external API key or internet access by utilizing deterministic fallback embeddings and extractive summaries for test suites and local demos.

---

## 2. Directory Structure

```text
backend/
├── app/
│   ├── main.py                  # FastAPI application entrypoint & middleware
│   ├── api/                     # Route definitions
│   │   ├── health.py            # Root & health endpoints
│   │   ├── financial.py         # CSV upload, analysis, insights, sample data
│   │   ├── documents.py         # PDF ingestion, listing, chunk inspection, deletion
│   │   └── chat.py              # Grounded Q&A (RAG) and controlled tool execution
│   ├── core/
│   │   └── config.py            # Pydantic Settings & environment variables
│   ├── schemas/                 # Pydantic v2 data models
│   │   ├── financial.py         # Financial records, variance summaries, CSV responses
│   │   ├── documents.py         # Document summaries, chunks, upload responses
│   │   └── chat.py              # Citations, retrieved chunks, tool executions
│   └── services/                # Business logic and external service integrations
│       ├── financial_service.py # Deterministic calculations & rule-based insights
│       ├── csv_service.py       # Safe CSV parsing, normalization & schema validation
│       ├── pdf_service.py       # PDF text extraction & boundary-aware chunking
│       ├── embedding_service.py # Gemini embeddings with deterministic fallback
│       ├── retrieval_service.py # ChromaDB vector store integration & citation tracking
│       ├── llm_service.py       # Gemini 2.5 Flash grounded prompt synthesis
│       └── agent_service.py     # Controlled allowlist tool registry
├── data/
│   ├── samples/                 # Synthetic sample CSV and PDF files
│   ├── uploads/                 # Storage for temporary uploaded files
│   └── chroma/                  # ChromaDB vector store persistence directory
├── tests/                       # Comprehensive automated pytest suite (44 tests)
│   ├── test_health.py
│   ├── test_financial.py
│   ├── test_csv.py
│   ├── test_pdf_and_documents.py
│   ├── test_rag.py
│   ├── test_agent_tools.py
│   └── test_api_integration.py
├── requirements.txt
└── .env.example
```

---

## 3. Setup & Installation

### Prerequisites
- Python 3.11+ (tested on Python 3.11 through Python 3.14)
- Virtual environment (`venv`)

### 1. Create and Activate Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` as needed:
```ini
PROJECT_NAME="FP&A Insight Copilot"
API_V1_PREFIX="/api"
FRONTEND_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"

# Google Gemini API Key (optional for local/test use; required for live LLM generation)
GEMINI_API_KEY="your-gemini-api-key-here"
LLM_MODEL="gemini-2.5-flash"
EMBEDDING_MODEL="text-embedding-004"

# Storage Configuration
CHROMA_PERSIST_DIRECTORY="./data/chroma"
UPLOAD_DIR="./data/uploads"
MAX_UPLOAD_MB=10
MAX_CSV_ROWS=10000
```

> **Note:** If `GEMINI_API_KEY` is omitted or empty, the backend runs seamlessly in **Offline Mode**, utilizing deterministic term-frequency vectors for ChromaDB search and returning grounded extracted passages.

---

## 4. Running the Server

Start the FastAPI development server with Uvicorn:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive Swagger documentation will be available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 5. API Endpoints Reference

### Health & Status
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Application status welcome message |
| `GET` | `/health` | Health check (`{"status": "healthy"}`) |

### Financial Analysis & CSV Ingestion
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/financial/analyze` | Computes deterministic totals, departmental variances, and overspending lists. |
| `POST` | `/api/financial/upload` | Uploads, validates, and analyzes a financial CSV file. Returns validation errors/warnings and computed metrics. |
| `POST` | `/api/financial/insights` | Generates deterministic rule-based insights and optional executive AI commentary. |
| `GET` | `/api/financial/sample` | Returns synthetic sample financial records for immediate demonstration. |

### Document Ingestion (PDF & Vector Store)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Ingests a PDF document, extracts page text, splits into chunks, and stores embeddings in ChromaDB. |
| `GET` | `/api/documents` | Lists all currently indexed documents with page counts and chunk counts. |
| `GET` | `/api/documents/{document_id}` | Retrieves metadata for a specific indexed document. |
| `GET` | `/api/documents/{document_id}/chunks` | Retrieves all chunks and page references for an indexed document. |
| `DELETE` | `/api/documents/{document_id}` | Deletes a document and its embeddings from ChromaDB. |

### RAG Chat & Controlled AI Tools
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat/ask` | Queries indexed documents using vector retrieval, generates a grounded response, and returns citations. |
| `POST` | `/api/chat/tool` | Executes strictly allowlisted AI tools with validated inputs. |
| `GET` | `/api/chat/tools` | Returns JSON schema specifications for all approved AI tools. |

---

## 6. Representative API Requests & Responses

### 1. Calculate Financial Variances
**Request:** `POST /api/financial/analyze`
```json
{
  "records": [
    {"department": "Marketing", "budget": 100000.0, "actual": 125000.0},
    {"department": "Engineering", "budget": 300000.0, "actual": 280000.0}
  ]
}
```

**Response (200 OK):**
```json
{
  "total_budget": 400000.0,
  "total_actual": 405000.0,
  "variance": 5000.0,
  "variance_percentage": 1.25,
  "department_count": 2,
  "record_count": 2,
  "overspending_departments": ["Marketing"],
  "underspending_departments": ["Engineering"],
  "departments": [
    {
      "department": "Marketing",
      "budget": 100000.0,
      "actual": 125000.0,
      "variance": 25000.0,
      "variance_percentage": 25.0,
      "status": "over_budget",
      "record_count": 1
    },
    {
      "department": "Engineering",
      "budget": 300000.0,
      "actual": 280000.0,
      "variance": -20000.0,
      "variance_percentage": -6.67,
      "status": "under_budget",
      "record_count": 1
    }
  ],
  "optional_metrics": null,
  "variance_convention": "Positive variance indicates actual spending exceeded budget (overspending). Negative variance indicates spending was below budget (savings)."
}
```

### 2. Ask Document Question (RAG with Citations)
**Request:** `POST /api/chat/ask`
```json
{
  "question": "What drove the marketing budget variance in Q1?",
  "top_k": 3
}
```

**Response (200 OK):**
```json
{
  "question": "What drove the marketing budget variance in Q1?",
  "answer": "According to sample_report.pdf (Page 1), the marketing budget overspent by $32,400 (11.6% variance) driven by aggressive customer acquisition campaigns.",
  "citations": [
    {
      "document_id": "993a4b6c-2f9a-4c28-98e3-f8a49c48c5b6",
      "filename": "sample_report.pdf",
      "page_number": 1,
      "chunk_id": "993a4b6c-2f9a-4c28-98e3-f8a49c48c5b6_p1_c1",
      "snippet": "Marketing & Growth: Overspent budget by 32,400 USD (11.6 percent variance) driven by aggressive customer acquisition campaigns..."
    }
  ],
  "has_sufficient_evidence": true,
  "model_used": "gemini-2.5-flash",
  "retrieved_chunks_count": 1
}
```

---

## 7. CSV & PDF Data Formats

### Supported CSV Format
The CSV parser automatically strips whitespace, normalizes casing, and handles currency symbols/commas (e.g. `"$150,000.00"`).

**Required Columns:**
- `department`: (string) Non-empty department or cost center name.
- `budget`: (float/int) Non-negative numerical value.
- `actual`: (float/int) Non-negative numerical value.

**Optional Columns:**
- `period`: Fiscal quarter or month (e.g., `2026-Q1`).
- `category`: Functional category (e.g., `R&D`, `G&A`, `Growth`).
- `revenue`: Non-negative revenue number.
- `expenses`: Non-negative expense number.

### Supported PDF Behavior
- Validates `%PDF-` file signature and enforces a 10MB limit (configurable).
- Extracts text page-by-page using `pypdf`.
- Implements boundary-aware text chunking (~700 characters with 150-character overlap) preserving paragraph, sentence, and word breaks.
- Rejects empty, corrupted, or scanned PDFs lacking an extractable text layer with informative client errors.

---

## 8. Controlled AI Tool Registry

The backend exposes an allowlisted set of tools that execute controlled Python routines:
1. `calculate_budget_variance`: Accepts single department numbers or batch records; returns deterministic variances.
2. `summarize_financial_dataset`: Aggregates portfolio totals, identifies top overspenders, and derives rule-based findings.
3. `search_financial_documents`: Performs semantic vector retrieval across uploaded PDF reports and returns grounded passages with citations.

Security controls:
- **No code execution**: Tools are fixed Python functions.
- **Pydantic validation**: Every tool argument is strictly validated.
- **Prompt injection containment**: Untrusted document text is tagged with `<untrusted_document_passage>` delimiters in LLM prompts.

---

## 9. Automated Testing

All tests run without requiring a paid API key or network access.

Run the test suite:
```bash
PYTHONPATH=. pytest tests -v
```

**Results:**
- **44 passed** tests across 7 test suites in ~2.0 seconds.
- Validates financial arithmetic, zero-budget edge cases, decimal precision, CSV validation, PDF chunking, ChromaDB vector indexing, semantic search, mocked Gemini LLM calls, prompt injection defense, and full API integration workflows.
