import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useApp } from '../../context/useApp'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

export function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { toast } = useApp()

  const toastIcons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Persistent Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastIcons[toast.type] || toastIcons.info}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
