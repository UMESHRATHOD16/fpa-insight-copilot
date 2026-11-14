/**
 * Financial Service - Interacts with /api/financial/* endpoints
 */
import { request } from './api'

export const financialService = {
  /**
   * Fetch synthetic sample financial dataset
   * Returns: { records: FinancialRecord[] }
   */
  async getSampleData() {
    return request('/api/financial/sample', {
      method: 'GET',
    })
  },

  /**
   * Deterministically analyze financial records
   * Payload: { records: FinancialRecord[] }
   * Returns: FinancialMetricsSummary
   */
  async analyzeFinancials(records) {
    return request('/api/financial/analyze', {
      method: 'POST',
      body: JSON.stringify({ records }),
    })
  },

  /**
   * Upload and process a financial CSV file
   * Returns: CSVUploadResponse
   */
  async uploadFinancialCsv(file) {
    const formData = new FormData()
    formData.append('file', file)

    return request('/api/financial/upload', {
      method: 'POST',
      body: formData,
    })
  },

  /**
   * Generate deterministic insights and optional AI commentary
   * Payload: { records: FinancialRecord[] }
   * Returns: FinancialInsightsResponse
   */
  async getFinancialInsights(records) {
    return request('/api/financial/insights', {
      method: 'POST',
      body: JSON.stringify({ records }),
    })
  },
}
