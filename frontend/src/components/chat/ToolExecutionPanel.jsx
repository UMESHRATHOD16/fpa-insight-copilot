import { useState } from 'react'
import {
  Wrench,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Code,
  Shield,
  Search,
  Calculator,
  PieChart,
} from 'lucide-react'
import { chatService } from '../../services/chatService'
import { useApp } from '../../context/useApp'
import { CitationCard } from './CitationCard'

export function ToolExecutionPanel() {
  const { financialData, documents, showToast } = useApp()
  const [selectedTool, setSelectedTool] = useState('calculate_budget_variance')

  // Tool 1 state: calculate_budget_variance
  const [calcDept, setCalcDept] = useState('Marketing')
  const [calcBudget, setCalcBudget] = useState('100000')
  const [calcActual, setCalcActual] = useState('125000')

  // Tool 3 state: search_financial_documents
  const [searchQuery, setSearchQuery] = useState('marketing budget variance in Q1')
  const [searchTopK, setSearchTopK] = useState(3)
  const [searchDocId, setSearchDocId] = useState('')

  // Natural language prompt
  const [agentPrompt, setAgentPrompt] = useState('Calculate budget variance for Marketing')

  // Execution state
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [executionError, setExecutionError] = useState(null)

  const handleExecute = async () => {
    setExecuting(true)
    setExecutionError(null)
    setExecutionResult(null)

    try {
      let payload = {
        prompt: agentPrompt,
        tool_name: selectedTool,
        args: {},
      }

      if (selectedTool === 'calculate_budget_variance') {
        payload.prompt = `Calculate variance for ${calcDept}`
        payload.args = {
          department: calcDept,
          budget: Number(calcBudget) || 0,
          actual: Number(calcActual) || 0,
        }
      } else if (selectedTool === 'summarize_financial_dataset') {
        const recordsToUse = financialData?.records?.length
          ? financialData.records
          : [
              { department: 'Engineering', budget: 300000, actual: 280000 },
              { department: 'Marketing', budget: 100000, actual: 125000 },
              { department: 'Operations', budget: 150000, actual: 150000 },
            ]
        payload.prompt = 'Summarize current financial dataset'
        payload.args = { records: recordsToUse }
      } else if (selectedTool === 'search_financial_documents') {
        payload.prompt = searchQuery
        payload.args = {
          query: searchQuery,
          top_k: Number(searchTopK) || 3,
        }
        if (searchDocId) {
          payload.args.document_id = searchDocId
        }
      }

      const res = await chatService.executeTool(payload)
      setExecutionResult(res)
      showToast('Tool executed successfully', 'success')
    } catch (err) {
      setExecutionError(err.message)
      showToast(`Tool execution failed: ${err.message}`, 'error')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-6">
      {/* Header with Security Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Wrench className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Controlled AI Tool Registry
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Backend exposes strictly allowlisted Python functions. Unsafe code execution is impossible.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
          <Shield className="w-3.5 h-3.5" />
          Allowlisted Functions
        </div>
      </div>

      {/* Tool Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setSelectedTool('calculate_budget_variance')
            setAgentPrompt('Calculate variance for Marketing department')
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTool === 'calculate_budget_variance'
              ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-xs text-slate-900">
              calculate_budget_variance
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Deterministic decimal calculation of budget vs actuals
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedTool('summarize_financial_dataset')
            setAgentPrompt('Summarize active financial dataset and generate rule-based insights')
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTool === 'summarize_financial_dataset'
              ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-4 h-4 text-purple-600" />
            <span className="font-semibold text-xs text-slate-900">
              summarize_financial_dataset
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Aggregates full batch metrics and deterministic insights
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedTool('search_financial_documents')
            setAgentPrompt('Search indexed PDF reports for variance drivers')
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTool === 'search_financial_documents'
              ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-xs text-slate-900">
              search_financial_documents
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Vector search across PDF documents with page citations
          </p>
        </button>
      </div>

      {/* Dynamic Input Form for Selected Tool */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Tool Arguments ({selectedTool})
        </h4>

        {selectedTool === 'calculate_budget_variance' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Department Name
              </label>
              <input
                type="text"
                value={calcDept}
                onChange={(e) => setCalcDept(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Budgeted Amount ($)
              </label>
              <input
                type="number"
                value={calcBudget}
                onChange={(e) => setCalcBudget(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Actual Spending ($)
              </label>
              <input
                type="number"
                value={calcActual}
                onChange={(e) => setCalcActual(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {selectedTool === 'summarize_financial_dataset' && (
          <div className="text-xs text-slate-600">
            <p>
              This tool will process {financialData?.records?.length || 3} financial records
              {financialData?.sourceName ? ` from ${financialData.sourceName}` : ' (sample records)'} and return
              deterministic variance calculations and rule-based insights.
            </p>
          </div>
        )}

        {selectedTool === 'search_financial_documents' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Search Query
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Top Chunks to Retrieve (top_k)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={searchTopK}
                  onChange={(e) => setSearchTopK(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Scope to Document (Optional)
                </label>
                <select
                  value={searchDocId}
                  onChange={(e) => setSearchDocId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                >
                  <option value="">All Documents</option>
                  {documents.map((d) => (
                    <option key={d.document_id} value={d.document_id}>
                      {d.filename}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleExecute}
            disabled={executing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {executing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Execute Tool via POST /api/chat/tool
          </button>
        </div>
      </div>

      {/* Execution Results */}
      {executionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Execution Error:</strong> {executionError}
          </div>
        </div>
      )}

      {executionResult && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900">
                Execution Output
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Status: 200 OK
            </span>
          </div>

          <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
            {executionResult.explanation}
          </div>

          {executionResult.citations?.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-slate-600 uppercase">
                Grounded Citations
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {executionResult.citations.map((c, i) => (
                  <CitationCard key={c.chunk_id || i} citation={c} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON execution details */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
              <Code className="w-3.5 h-3.5" /> Raw Structured Response
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto max-h-60">
              {JSON.stringify(executionResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
