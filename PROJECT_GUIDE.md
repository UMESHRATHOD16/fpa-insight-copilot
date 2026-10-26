# FP&A Insight Copilot — Master Project Guide

## 1. Mission and project overview

Build **FP&A Insight Copilot**, a full-stack financial planning and analysis (FP&A) assistant for exploring financial data and asking evidence-grounded questions about financial reports.

The application should let a user:
1. Upload financial CSV files and PDF reports.
2. Inspect financial data and calculate key metrics deterministically.
3. Ask natural-language questions about uploaded reports using Retrieval-Augmented Generation (RAG).
4. Receive answers grounded in retrieved source passages, with citations that point back to the source document and page/chunk where possible.
5. Explore budget-versus-actual results, variances, revenue, expenses, and profit through a dashboard.
6. Use a controlled AI tool workflow to request supported calculations or document searches.
7. Review errors and limitations clearly rather than receiving fabricated financial answers.

**Core principle:** use ordinary Python code for arithmetic and data validation; use retrieval to find relevant evidence; use an LLM to explain that evidence. Never rely on an LLM to perform financial arithmetic when code can calculate it exactly.

This is an educational portfolio project, not a production financial system. Do not claim production readiness, financial accuracy, security certification, or completed features until they have been implemented and tested.

## 2. Intended users and example workflows

### Workflow A — Financial CSV analysis
- User uploads a CSV containing financial records.
- Backend validates file type, size, required columns, and values.
- Backend returns a preview and validation messages.
- User runs analysis.
- Dashboard displays totals and department/category breakdowns.

Example supported columns for the initial version:
- `department` (text)
- `budget` (non-negative number)
- `actual` (non-negative number)

Later, support an optional richer schema:
- `period`
- `department`
- `category`
- `revenue`
- `expenses`
- `budget`
- `actual`

Do not silently assume every uploaded file follows the same schema. Validate it and explain what columns are required.

### Workflow B — Financial document Q&A (RAG)
- User uploads a PDF report.
- Backend extracts text and metadata.
- Text is split into overlapping chunks.
- An embedding model converts chunks into vectors.
- A vector store indexes the vectors and metadata.
- User asks a question.
- System retrieves relevant chunks, passes them with the question to the LLM, and returns an answer with source references.
- If evidence is insufficient, the system must say so instead of inventing a result.

### Workflow C — Financial insights
- User selects a dataset or analysis period.
- Backend calculates totals and variances.
- LLM receives the calculated values and relevant retrieved evidence.
- LLM explains possible implications without asserting unsupported causes.
- Dashboard separates **calculated facts** from **AI-generated interpretation**.

### Workflow D — Controlled agent/tool use
- User asks a supported question, such as “Calculate the marketing budget variance” or “Find the report's explanation for the revenue decline.”
- The LLM may select from a small allowlist of tools, such as `calculate_variance`, `summarize_dataset`, and `search_financial_documents`.
- The backend validates tool arguments and executes the tool.
- The LLM explains the tool result and cites evidence when applicable.
- Do not allow arbitrary Python execution, arbitrary SQL, shell commands, or unrestricted access to local files.

## 3. Initial project state and repository discipline

The project has been started with a `backend/` and `frontend/` directory. A basic FastAPI app may already exist at `backend/app/main.py`, and the first financial analysis endpoint may be in progress.

**Before changing anything:**
1. Inspect the existing directory tree, Git status, current files, and installed dependencies.
2. Read existing source code and preserve working functionality.
3. Do not overwrite or delete user work without explaining the reason and asking when the change is destructive.
4. Do not assume a feature exists merely because it is described in this document.
5. Make a short implementation plan based on the actual current state.
6. Implement one small milestone at a time, test it, and report the result.

Use the existing project rather than creating a second project elsewhere. Keep changes inside this repository, except for explicitly requested external deployment actions.

## 4. Recommended technology stack

### Backend
- Python 3.11 or a compatible stable version already installed
- FastAPI for HTTP APIs
- Uvicorn for local development
- Pydantic for request/response validation
- `pydantic-settings` for environment configuration
- Pandas for CSV parsing and tabular calculations
- `python-multipart` for uploads
- Pytest and FastAPI `TestClient` for tests
- A PDF text extraction library such as PyMuPDF, selected after checking compatibility
- LangChain only where it provides a clear benefit to the RAG workflow; avoid unnecessary abstractions
- A Gemini model through the official supported SDK or a maintained LangChain integration
- An embedding model compatible with the selected vector store
- ChromaDB as the initial local vector store, unless an existing project decision or compatibility issue justifies an alternative

### Frontend
- React with Vite
- JavaScript unless the repository already uses TypeScript
- Tailwind CSS if already installed or when the frontend milestone begins
- A chart library such as Recharts for financial visualizations
- A small API client module to communicate with FastAPI

### Tooling and deployment
- Git and GitHub
- `.env` for local secrets, never committed
- `.env.example` with placeholder variable names and no real secrets
- Backend and frontend deployment targets selected after the application runs locally
- A root `README.md` with setup, architecture, API examples, screenshots, limitations, and deployment instructions

Avoid adding a database until persistent users, sessions, datasets, or document metadata genuinely require it. The first version can use local development storage with explicit limitations. If persistence is added, choose a simple, well-supported solution and document its scope.

## 5. Architecture and separation of responsibilities

Keep business logic separate from HTTP routes and UI components.

Suggested target structure (adapt to the repository rather than blindly recreating it):

```text
fpa-insight-copilot/
├── PROJECT_GUIDE.md
├── README.md
├── .gitignore
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── health.py
│   │   │   ├── financial.py
│   │   │   ├── documents.py
│   │   │   └── chat.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── logging_config.py
│   │   ├── schemas/
│   │   │   ├── financial.py
│   │   │   ├── documents.py
│   │   │   └── chat.py
│   │   ├── services/
│   │   │   ├── financial_service.py
│   │   │   ├── csv_service.py
│   │   │   ├── pdf_service.py
│   │   │   ├── embedding_service.py
│   │   │   ├── retrieval_service.py
│   │   │   ├── llm_service.py
│   │   │   └── agent_service.py
│   │   ├── data/
│   │   │   ├── samples/
│   │   │   └── uploads/
│   │   └── tests/
│   │       ├── test_health.py
│   │       ├── test_financial.py
│   │       ├── test_csv.py
│   │       └── test_rag.py
│   └── ...
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── ...
└── docs/
    ├── ARCHITECTURE.md
    └── API_EXAMPLES.md
```

The layout is a target, not a requirement to create every file immediately. Add modules only when their responsibilities are implemented.

### Request flow

CSV workflow:
`React UI → FastAPI route → validation → CSV service → financial service → JSON response → charts/summary`

RAG workflow:
`React UI → FastAPI upload route → PDF text extraction → chunking → embeddings → vector store`

Question workflow:
`Question → query embedding/retrieval → relevant chunks + metadata → LLM → grounded answer + citations → React UI`

Tool workflow:
`Question → tool-selection step → validated allowlisted tool → deterministic result/evidence → LLM explanation`

## 6. Feature requirements

### Milestone 1 — API foundation
- `GET /` returns a simple welcome/status message.
- `GET /health` returns a health status.
- `GET /docs` exposes FastAPI's interactive API documentation.
- Use a consistent error response style.
- Configure CORS narrowly for the local frontend origin; do not allow all origins in production without justification.

Acceptance criteria:
- App starts with the documented command from `backend/`.
- Both health endpoints work.
- No secrets are required for basic health checks.
- A test covers the health endpoint.

### Milestone 2 — Financial calculations
Implement calculations in a service module, not directly inside route handlers.

Initial request schema:
- A non-empty list of financial records.
- Each record includes `department`, `budget`, and `actual`.
- Budget and actual must be finite, non-negative numbers.
- Department must not be blank.

Return:
- `total_budget`
- `total_actual`
- `variance = total_actual - total_budget`
- `variance_percentage = variance / total_budget * 100` when total budget is greater than zero; otherwise return `null`
- Optional per-department summaries and counts

Clearly label the convention: positive variance means actual spending exceeded budget; negative variance means spending was below budget. Do not describe positive variance as favorable by default, since that depends on whether the value is revenue, cost, or another measure.

Test:
- Normal positive and negative variance
- Zero total budget
- Empty records
- Negative values
- Missing fields
- Invalid types and non-finite values
- Rounding and decimal precision

Use Python `Decimal` or a documented rounding policy where monetary precision matters. Avoid rounding intermediate values unnecessarily.

### Milestone 3 — CSV upload and validation
- Add an upload endpoint such as `POST /api/financial/upload`.
- Accept CSV only in the first release.
- Set a configurable maximum file size and row limit.
- Validate headers and parse values safely.
- Reject malformed files with helpful error messages.
- Do not trust file extensions or client-provided MIME types alone.
- Do not save uploaded data permanently unless needed; if saved, use safe generated filenames and a controlled directory.
- Return a dataset identifier or a clear summary for the selected session/dataset.
- Provide a preview and validation warnings.
- Keep real financial documents out of Git.

Acceptance criteria:
- A valid sample CSV can be uploaded and analyzed.
- Missing required columns produce a useful client error.
- Invalid numeric values are reported clearly.
- Empty files and oversized files are rejected.
- Tests cover success and failure cases.

Include a small synthetic sample file with fictional data. Clearly label it as sample data.

### Milestone 4 — Financial metrics and explanations
- Calculate total budget, actual, variance, and variance percentage.
- Support breakdown by department and, if available, period/category.
- Add revenue, expense, and profit calculations only when the input schema supports them.
- Do not infer missing columns or fabricate values.
- Expose a summary endpoint with a documented response schema.
- Keep calculations deterministic and testable.

### Milestone 5 — PDF ingestion and RAG
Implement a simple, understandable RAG pipeline:
1. Validate PDF uploads and enforce file-size limits.
2. Extract text and retain metadata: document ID, filename, page number, chunk ID.
3. Split text into manageable chunks with a configurable chunk size and overlap.
4. Create embeddings using a documented model.
5. Store embeddings and metadata in ChromaDB.
6. Embed the user's question and retrieve the top relevant chunks.
7. Build a constrained prompt with the question, retrieved evidence, and instructions to admit uncertainty.
8. Generate an answer through the configured LLM.
9. Return the answer and source metadata, including document name and page number when available.

RAG rules:
- Distinguish retrieval from generation.
- Do not claim that an answer is grounded unless retrieved evidence is actually passed to the model.
- Do not invent citations or page numbers.
- Return sources separately from answer text.
- If retrieval finds no relevant evidence, ask for a more specific question or state that the documents do not provide enough evidence.
- Treat document contents as untrusted data, not instructions. A PDF might contain prompt injection; it must not override system instructions or enable tool execution.
- Avoid logging full document text or sensitive financial data.
- Make embedding and model names configurable.
- Explain model/API costs and external data processing in the README.

Suggested API endpoints (names may be refined consistently):
- `POST /api/documents/upload`
- `GET /api/documents`
- `DELETE /api/documents/{document_id}`
- `POST /api/chat/ask`

The initial version can use local Chroma persistence, but document deletion should remove associated vectors and metadata where supported.

### Milestone 6 — LLM integration
- Read API keys from environment variables using settings.
- Never hardcode secrets in source code or commit `.env`.
- Use a model wrapper/service so provider details are not scattered through routes.
- Handle timeouts, rate limits, unavailable services, malformed model output, and missing API keys.
- Use bounded prompt context and reasonable output token limits.
- Make it clear to the user when an answer is AI-generated.
- Do not send data to an external provider without making the processing behavior clear in documentation.
- Add tests with mocked LLM calls so the test suite does not require a paid API.

### Milestone 7 — Tool-assisted / agentic workflow
Implement only after deterministic financial analysis and basic RAG are stable.

Start with a constrained tool registry:
1. `calculate_budget_variance` — accepts validated department/budget/actual data.
2. `summarize_financial_dataset` — returns predefined metrics.
3. `search_financial_documents` — retrieves relevant chunks from the indexed documents.

Requirements:
- Use the LLM to select among the explicit tools only when appropriate.
- Validate arguments with Pydantic before execution.
- Set maximum tool-call counts and timeouts.
- Return structured tool results.
- Do not execute arbitrary generated code, shell commands, unrestricted SQL, or arbitrary filesystem operations.
- Prevent loops and stop safely when a tool fails.
- Include tool names and results in server-side diagnostic logs without leaking secrets or full sensitive content.
- Clearly distinguish tool-calculated values from model-written interpretations.

Do not call the application “autonomous” or claim sophisticated multi-agent behavior unless implemented and demonstrable. A controlled tool-using workflow is sufficient for this portfolio.

### Milestone 8 — React dashboard
Create a clear, professional, responsive financial analytics UI.

Required screens/components:
- Dashboard overview
- CSV upload and data preview
- KPI cards for available metrics
- Department/category breakdown charts
- PDF upload/document list
- Chat panel with answer sources
- Loading, empty, success, and error states
- Dataset/document selection if multiple uploads are supported

UI principles:
- Make currency, periods, and variance conventions explicit.
- Do not display example metrics as if they were computed from real user data.
- Avoid hardcoded answers and fake charts.
- Keep API requests in a service layer rather than scattering fetch calls across components.
- Configure the backend URL through a frontend environment variable.
- Do not put server-side secrets in frontend environment variables.
- Make layouts accessible, keyboard-friendly, and usable on smaller screens.

### Milestone 9 — Quality, testing, and robustness
- Unit tests for financial calculations and parsing.
- API tests for success, invalid input, missing files, oversized files, and unavailable services.
- RAG tests using mocked embeddings/LLM where possible.
- Test that citations map to actual retrieved chunks.
- Test insufficient-evidence behavior.
- Test tool allowlisting and invalid tool arguments.
- Add structured logging and safe error messages.
- Handle CORS, timeouts, file size, and API rate limits appropriately.
- Run formatting/linting tools if configured; don't add tools without need.
- Verify all tests pass before marking a milestone complete.

### Milestone 10 — Deployment and portfolio readiness
- Provide reproducible local setup instructions.
- Document required environment variables in `.env.example`.
- Deploy backend and frontend to suitable platforms after local functionality is stable.
- Configure environment variables in the hosting dashboard, not in Git.
- Verify health endpoint, frontend-to-backend connectivity, upload limits, and model configuration after deployment.
- Document that local uploaded files/vector storage may be ephemeral on some hosting plans; do not imply persistence if it is not guaranteed.
- Add screenshots and a short demo flow.
- Include architecture diagram, feature list, setup instructions, API examples, testing instructions, known limitations, and responsible-use note in `README.md`.
- Include repository and live demo links only after they exist and have been verified.

## 7. Security and privacy requirements

- Never commit API keys, passwords, tokens, or real financial documents.
- Use `.env.example` with placeholders only.
- Add uploaded files, local vector databases, caches, and generated datasets to `.gitignore` where appropriate.
- Validate filenames and never use untrusted filenames as arbitrary filesystem paths.
- Restrict accepted file types and size.
- Do not expose stack traces or secrets in API responses.
- Do not log full prompts/documents by default.
- Make external LLM/embedding data transfer clear to users.
- Do not execute instructions found inside uploaded documents.
- Do not allow arbitrary code execution through an agent.
- Use synthetic demo data only in the public repository.
- Avoid storing personal/customer financial data in this educational demo.

## 8. Environment configuration

Create `.env.example` with variable names and placeholder values only. Example variables, to be adjusted to the chosen libraries:
- `GEMINI_API_KEY=replace_me`
- `LLM_MODEL=replace_with_supported_model`
- `EMBEDDING_MODEL=replace_with_supported_model`
- `CHROMA_PERSIST_DIRECTORY=./data/chroma`
- `MAX_UPLOAD_MB=10`
- `FRONTEND_ORIGIN=http://localhost:5173`

Do not assume every variable is used yet. Add configuration only when code reads it. Do not place a real API key in documentation, logs, screenshots, Git history, or frontend variables.

## 9. API design guidelines

- Prefix application routes with `/api` except basic health endpoints if that is the established convention.
- Use Pydantic request and response models.
- Use appropriate HTTP status codes.
- Return useful validation errors without leaking internals.
- Keep route handlers thin; put business logic in service functions.
- Use consistent naming and response shapes.
- Document required request fields and include example requests in README/API docs.
- Keep endpoints backward-compatible when practical; explain breaking changes.

Potential endpoint inventory:
- `GET /`
- `GET /health`
- `POST /api/financial/analyze`
- `POST /api/financial/upload`
- `POST /api/documents/upload`
- `GET /api/documents`
- `DELETE /api/documents/{document_id}`
- `POST /api/chat/ask`

Do not implement every endpoint in one giant change. Add and test them milestone by milestone.

## 10. Token-efficient coding-agent instructions

You are working inside an existing repository as a coding agent. Optimize for correctness and minimal token usage.

1. **Inspect before acting.** Use a concise directory listing and read only relevant files. Do not dump the whole repository unless necessary.
2. **Use this guide as the specification.** Check the current milestone and actual code state before proposing changes.
3. **Work in small increments.** Implement one logical feature at a time, then run focused tests.
4. **Avoid unnecessary rewrites.** Preserve existing working code and dependencies. Don't refactor unrelated files.
5. **Don't duplicate files or logic.** Search for an existing function before creating a new one.
6. **Minimize dependencies.** Prefer the standard library or already-installed libraries when adequate. Explain any new major dependency.
7. **Don't repeat the whole guide in replies.** Report only files changed, behavior implemented, commands run, test results, blockers, and the next task.
8. **Use targeted inspection.** Read specific files and relevant error output, not all files by default.
9. **No speculative features.** Don't build future milestones early. Don't add a database, authentication, Docker, a queue, or a multi-agent framework unless a requirement justifies it.
10. **No fabricated completion.** Never claim code was tested, deployed, or working unless you actually ran the relevant command or verified the result.
11. **Respect scope.** Change files only inside this project unless the user explicitly authorizes otherwise.
12. **Protect secrets and data.** Never print or commit secrets. Use synthetic sample data.
13. **Be transparent about uncertainty.** If a dependency or API is unclear, inspect installed versions and official local package documentation or ask a concise question instead of guessing.
14. **Avoid excessive tool calls.** Batch related read-only inspections; don't rerun unchanged tests repeatedly.
15. **Keep progress state.** Maintain a short `docs/PROGRESS.md` with completed milestones, current milestone, test results, and next steps. Update it at the end of each meaningful milestone.
16. **Ask before destructive actions.** Do not delete, overwrite, reset, force-push, or discard user changes without explicit permission.
17. **Do not install or deploy without consideration.** Explain significant dependency or hosting changes and ask if they have cost, permission, or irreversible implications.
18. **Use concise final reports.** Finish each work session with a short summary and exact commands/results.

### Required response format after each coding session
- **Implemented:** concise bullet list.
- **Files changed:** file paths only, with a brief note if needed.
- **Verification:** commands actually run and whether they passed.
- **Environment/configuration:** only new variables or manual steps, if any.
- **Next milestone:** one small next step.
- **Learning notes:** a short explanation of the key design decision, without a long tutorial unless requested.

### Efficient implementation workflow
For each milestone:
1. Inspect repository state.
2. State a brief plan.
3. Implement the smallest complete slice.
4. Run targeted tests/lint/build checks.
5. Fix failures caused by the change.
6. Update `docs/PROGRESS.md`.
7. Summarize verified results and remaining issues.

If a test cannot run due to missing credentials, network access, or unavailable services, say so explicitly and use a mock/test double where suitable.

## 11. Learning and interview-readiness requirements

The owner is learning the codebase and will study implementation details separately with a tutor. Keep the code approachable and explainable:
- Prefer clear functions and names over clever abstractions.
- Avoid overengineering and unnecessary design patterns.
- Add short comments only where the reasoning is not obvious.
- Keep business logic independently testable.
- Explain key tradeoffs in README or short docs.
- Include a few representative unit tests for each important calculation or workflow.
- Never hide complexity behind an opaque framework without documenting what it does.
- Maintain an interview topic list covering API design, validation, CSV parsing, financial calculations, embeddings, chunking, vector search, RAG grounding, prompt injection, tool calling, testing, and deployment.

The coding agent should not generate a huge tutorial on every change. Provide compact notes that the owner can ask about later.

## 12. Definition of done

The project is not “done” until the applicable requirements are actually implemented and verified.

Portfolio-ready completion requires:
- Local backend starts from documented instructions.
- Frontend builds and runs.
- User can upload a valid sample CSV and see calculated metrics.
- Invalid CSVs produce understandable errors.
- User can upload a PDF and ask questions answered from retrieved text.
- Answers expose source references and admit insufficient evidence.
- Financial arithmetic is performed by deterministic code.
- A limited tool workflow can call only approved tools with validated arguments.
- Tests pass, or any remaining failures are explicitly documented.
- Secrets and private data are excluded from Git.
- README contains setup, architecture, API examples, test instructions, limitations, and demo instructions.
- Deployment has been tested and links verified before being advertised.
- Owner can explain the architecture and demonstrate the main workflows.

## 13. Suggested build order

Follow this order and do not skip ahead without a working foundation:

1. Inspect existing files and confirm health endpoint.
2. Implement and test financial calculation schemas/service/endpoint.
3. Implement CSV upload, validation, preview, and tests.
4. Add document upload and PDF text extraction.
5. Add chunking, embeddings, vector store, and retrieval tests.
6. Integrate the LLM and grounded source citations.
7. Add controlled tool calling for financial analysis and document search.
8. Build the React dashboard and API integration.
9. Improve error handling, security, testing, and UX.
10. Write documentation and deploy.
11. Verify every public claim in the resume against the working implementation.

**Start now:** inspect the existing repository and current Git changes. Report the actual state, identify the first incomplete milestone, and implement only the next small milestone. Do not recreate the project or overwrite working files.
