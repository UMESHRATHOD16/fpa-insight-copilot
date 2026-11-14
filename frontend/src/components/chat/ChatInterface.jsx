import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { chatService } from '../../services/chatService'
import { useApp } from '../../context/useApp'
import { CitationCard } from './CitationCard'

const STARTER_PROMPTS = [
  'What drove the marketing budget variance in Q1?',
  'What were the primary drivers of R&D overspending?',
  'Summarize the financial highlights and cost reduction initiatives.',
  'What risks were noted regarding software engineering headcount?',
]

export function ChatInterface() {
  const { documents } = useApp()
  const msgCounter = useRef(0)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your FP&A Document Copilot. Ask any question about your uploaded financial reports (10-Ks, board decks, budget variance memos), and I will synthesize evidence-grounded answers citing the specific report and page number.',
      citations: [],
      hasEvidence: true,
      modelUsed: 'gemini-2.5-flash',
    },
  ])
  const [input, setInput] = useState('')
  const [selectedDocId, setSelectedDocId] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (questionText = input) => {
    const textToSend = questionText.trim()
    if (!textToSend || loading) return

    msgCounter.current += 1
    const currentCount = msgCounter.current

    const userMessage = {
      id: `user-${currentCount}`,
      role: 'user',
      text: textToSend,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await chatService.askQuestion({
        question: textToSend,
        document_id: selectedDocId || null,
        top_k: 4,
      })

      const assistantMessage = {
        id: `assistant-${currentCount}`,
        role: 'assistant',
        text: response.answer,
        citations: response.citations || [],
        hasEvidence: response.has_sufficient_evidence,
        modelUsed: response.model_used,
        chunksRetrieved: response.retrieved_chunks_count,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setErrorMessage(err.message)
      const errItem = {
        id: `assistant-err-${currentCount}`,
        role: 'assistant',
        text: `Error: ${err.message}`,
        isError: true,
      }
      setMessages((prev) => [...prev, errItem])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col h-[750px] overflow-hidden">
      {/* Header controls: Scope & Model indicator */}
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Evidence-Grounded Financial Q&A
            </h3>
            <p className="text-[11px] text-slate-500">
              Retrieval-Augmented Generation with strict document citation tracking
            </p>
          </div>
        </div>

        {/* Document scoping selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Scope:</span>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-hidden"
          >
            <option value="">All Uploaded Documents ({documents.length})</option>
            {documents.map((doc) => (
              <option key={doc.document_id} value={doc.document_id}>
                {doc.filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/30">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-xs'
                    : msg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-900'
                    : 'bg-white border border-slate-200/90 text-slate-800 shadow-2xs'
                }`}
              >
                {/* Message Header (for Assistant) */}
                {!isUser && !msg.isError && (
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-700">Financial Copilot</span>
                    <div className="flex items-center gap-2">
                      {msg.hasEvidence ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Grounded Evidence
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> Insufficient Evidence
                        </span>
                      )}
                      {msg.modelUsed && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Citations section */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="font-bold text-[11px] text-slate-600 uppercase tracking-wider block">
                      Sources & Citations ({msg.citations.length})
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {msg.citations.map((c, i) => (
                        <CitationCard key={c.chunk_id || i} citation={c} index={i} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          )
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-3 mr-auto max-w-xl">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 shadow-2xs flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Searching vector store and synthesizing grounded response...
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompt Chips */}
      {messages.length <= 2 && (
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
          <span className="text-slate-400 self-center text-[11px] font-medium mr-1">
            Suggested queries:
          </span>
          {STARTER_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about uploaded financial reports (e.g. 'What was the Q1 marketing overrun?')"
            rows={1}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2.5 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400 text-center">
          Responses are strictly grounded in indexed PDF excerpts. No unverified financial figures will be hallucinated.
        </p>
      </div>
    </div>
  )
}
