import { useState } from 'react'
import { MessageSquare, Wrench, ShieldCheck } from 'lucide-react'
import { ChatInterface } from '../components/chat/ChatInterface'
import { ToolExecutionPanel } from '../components/chat/ToolExecutionPanel'

export function Copilot() {
  const [activeMode, setActiveMode] = useState('chat') // 'chat' | 'tools'

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200/80 p-2 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'chat'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Document Q&A Chat (RAG)
          </button>

          <button
            onClick={() => setActiveMode('tools')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'tools'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Approved AI Tools
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strict Anti-Hallucination & Prompt Isolation</span>
        </div>
      </div>

      {/* Render selected view */}
      {activeMode === 'chat' ? <ChatInterface /> : <ToolExecutionPanel />}
    </div>
  )
}
