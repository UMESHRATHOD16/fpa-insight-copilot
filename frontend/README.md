# FP&A Insight Copilot — Frontend

Modern enterprise financial analytics dashboard built with **React 19**, **Vite**, **Tailwind CSS**, **Recharts**, and **Lucide React**, connecting to the FastAPI backend.

---

## 1. Features

- **Executive Financial Overview**: Real-time KPI summary cards (Total Budget, Total Actuals, Net Variance, Variance Percentage, Revenue, Expenses, Net Profit), budget vs. actual department bar charts, variance direction indicators, top overspending/savings department rankings, and deterministic insights.
- **Financial Analysis & CSV Processing**: Drag-and-drop CSV upload with file validation, error and warning feedback, sortable department-level variance tables, CSV export, and synthetic sample data loading.
- **Document Management**: Drag-and-drop PDF report upload, page text extraction, boundary-aware chunking, vector indexing into ChromaDB, chunk inspector modal, and document deletion.
- **AI Copilot (RAG Document Q&A)**: Evidence-grounded natural language question answering with page-level citations, source snippet inspection, sufficient-evidence badges, and document scoping.
- **Controlled AI Tool Execution**: Interactive execution panel for approved backend tools (`calculate_budget_variance`, `summarize_financial_dataset`, `search_financial_documents`) with transparent input forms and structured JSON output.
- **System Settings**: Live backend health testing, environment parameter display, and local dataset session controls.

---

## 2. Prerequisites

- **Node.js**: `v20+` or `v25+`
- **npm**: `v10+` or `v11+`
- Running FastAPI backend service (default on `http://localhost:8000`)

---

## 3. Installation & Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Ensure `VITE_API_BASE_URL` points to your backend instance:
```ini
VITE_API_BASE_URL=http://localhost:8000
```

---

## 4. Development & Build Commands

### Start Development Server
```bash
npm run dev
```
The application will be accessible at: [http://localhost:5173](http://localhost:5173).

### Run ESLint
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```
The optimized production bundle will be generated in `frontend/dist/`.

### Preview Production Build
```bash
npm run preview
```

---

## 5. Backend Connection Instructions

The frontend expects the FastAPI backend to be running on `http://localhost:8000`.

To start the backend:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify backend health at: [http://localhost:8000/health](http://localhost:8000/health) or via the **Settings** tab in the frontend.

---

## 6. Project Architecture

```text
frontend/
├── src/
│   ├── components/
│   │   ├── common/           # KpiCard, AlertBanner, Modal
│   │   ├── layout/           # Sidebar, Header, Layout
│   │   ├── dashboard/        # OverviewKpis, BudgetVsActualChart, VarianceBarChart, DepartmentRankings, InsightsSection, RecentDocumentsWidget, EmptyFinancialState
│   │   ├── financial/        # CsvUploader, DepartmentTable
│   │   ├── documents/        # PdfUploader, DocumentList, ChunkViewerModal, DeleteConfirmModal
│   │   └── chat/             # ChatInterface, CitationCard, ToolExecutionPanel
│   ├── context/              # AppContext, AppContextInstance, useApp
│   ├── pages/                # Overview, FinancialAnalysis, Documents, Copilot, Settings
│   ├── services/             # api.js, financialService.js, documentService.js, chatService.js
│   ├── utils/                # formatters.js (currency, percentages, variances, bytes, dates)
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .env
├── package.json
└── vite.config.js
```
