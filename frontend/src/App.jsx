import { AppProvider } from './context/AppContext'
import { useApp } from './context/useApp'
import { Layout } from './components/layout/Layout'
import { Overview } from './pages/Overview'
import { FinancialAnalysis } from './pages/FinancialAnalysis'
import { Documents } from './pages/Documents'
import { Copilot } from './pages/Copilot'
import { Settings } from './pages/Settings'

function AppRoutes() {
  const { activeTab } = useApp()

  switch (activeTab) {
    case 'overview':
      return <Overview />
    case 'financial':
      return <FinancialAnalysis />
    case 'documents':
      return <Documents />
    case 'copilot':
      return <Copilot />
    case 'settings':
      return <Settings />
    default:
      return <Overview />
  }
}

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <AppRoutes />
      </Layout>
    </AppProvider>
  )
}
