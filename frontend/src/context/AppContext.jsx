import { useState, useEffect, useCallback } from 'react'
import { AppContext } from './AppContextInstance'
import { checkBackendHealth } from '../services/api'
import { financialService } from '../services/financialService'
import { documentService } from '../services/documentService'

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [backendOnline, setBackendOnline] = useState(null)
  const [toast, setToast] = useState(null)

  // Financial Data State
  const [financialData, setFinancialData] = useState(null)
  const [loadingFinancial, setLoadingFinancial] = useState(false)
  const [financialError, setFinancialError] = useState(null)

  // Document Management State
  const [documents, setDocuments] = useState([])
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [documentError, setDocumentError] = useState(null)

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    setToast({ message, type })
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current))
    }, duration)
  }, [])

  // Health check
  const checkHealth = useCallback(async () => {
    const health = await checkBackendHealth()
    setBackendOnline(health.online)
    return health.online
  }, [])

  // Fetch document list
  const fetchDocuments = useCallback(async () => {
    setLoadingDocuments(true)
    setDocumentError(null)
    try {
      const res = await documentService.listDocuments()
      setDocuments(res.documents || [])
      setTotalDocuments(res.total_documents || 0)
    } catch (err) {
      setDocumentError(err.message)
    } finally {
      setLoadingDocuments(false)
    }
  }, [])

  // Load sample data
  const loadSampleFinancials = useCallback(async () => {
    setLoadingFinancial(true)
    setFinancialError(null)
    try {
      const sampleRes = await financialService.getSampleData()
      if (!sampleRes.records || sampleRes.records.length === 0) {
        throw new Error('Sample data contained no records')
      }

      // Fetch full metrics and insights from backend
      const insightsRes = await financialService.getFinancialInsights(sampleRes.records)

      setFinancialData({
        summary: insightsRes.summary,
        insights: insightsRes.deterministic_insights || [],
        aiExplanation: insightsRes.ai_explanation || null,
        records: sampleRes.records,
        sourceName: 'sample_financials.csv',
        isSample: true,
        validation: {
          warnings: [],
          errors: [],
          total_rows: sampleRes.records.length,
          valid_rows: sampleRes.records.length,
        },
      })
      showToast('Loaded synthetic sample financial dataset', 'success')
      return true
    } catch (err) {
      setFinancialError(err.message)
      showToast(`Failed to load sample data: ${err.message}`, 'error')
      return false
    } finally {
      setLoadingFinancial(false)
    }
  }, [showToast])

  // Handle uploaded CSV response
  const applyUploadedCsvData = useCallback(
    async (uploadRes) => {
      setLoadingFinancial(true)
      try {
        let insightsList = []
        let aiExplanation = null

        // If we have preview/records, fetch insights
        if (uploadRes.preview && uploadRes.preview.length > 0) {
          try {
            const insightsRes = await financialService.getFinancialInsights(uploadRes.preview)
            insightsList = insightsRes.deterministic_insights || []
            aiExplanation = insightsRes.ai_explanation || null
          } catch {
            // Non-fatal if AI insights fail; deterministic metrics are still in summary
          }
        }

        setFinancialData({
          summary: uploadRes.summary,
          insights: insightsList,
          aiExplanation: aiExplanation,
          records: uploadRes.preview || [],
          sourceName: uploadRes.filename,
          isSample: false,
          validation: {
            warnings: uploadRes.warnings || [],
            errors: uploadRes.errors || [],
            total_rows: uploadRes.total_rows,
            valid_rows: uploadRes.valid_rows,
          },
        })
        showToast(`Successfully analyzed ${uploadRes.filename}`, 'success')
      } catch (err) {
        setFinancialError(err.message)
        showToast(`Error processing CSV: ${err.message}`, 'error')
      } finally {
        setLoadingFinancial(false)
      }
    },
    [showToast]
  )

  // Clear financial data
  const clearFinancialData = useCallback(() => {
    setFinancialData(null)
    setFinancialError(null)
    showToast('Financial dataset cleared', 'info')
  }, [showToast])

  // Initial load
  useEffect(() => {
    let active = true
    async function init() {
      const health = await checkBackendHealth()
      if (active) {
        setBackendOnline(health.online)
      }
      try {
        const res = await documentService.listDocuments()
        if (active) {
          setDocuments(res.documents || [])
          setTotalDocuments(res.total_documents || 0)
        }
      } catch (err) {
        if (active) {
          setDocumentError(err.message)
        }
      }
    }
    init()
    return () => {
      active = false
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        backendOnline,
        checkHealth,
        toast,
        showToast,
        financialData,
        loadingFinancial,
        financialError,
        loadSampleFinancials,
        applyUploadedCsvData,
        clearFinancialData,
        documents,
        totalDocuments,
        loadingDocuments,
        documentError,
        fetchDocuments,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
