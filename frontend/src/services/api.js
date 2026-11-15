/**
 * Central API Client for FP&A Insight Copilot
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/**
 * Parses error messages from FastAPI standard error formats:
 * - { "detail": "string message" }
 * - { "detail": [ { "loc": [...], "msg": "..." } ] }
 */
function extractErrorMessage(data, fallback) {
  if (!data) return fallback
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    return data.detail.map((err) => err.msg || JSON.stringify(err)).join('; ')
  }
  if (data.message) return data.message
  return fallback
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const headers = { ...options.headers }

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal,
    })

    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const message = extractErrorMessage(
        data,
        `Request failed with status ${response.status} (${response.statusText})`
      )
      throw new ApiError(message, response.status, data)
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error.name === 'AbortError') {
      throw error
    }
    // Network errors or backend connection failure
    throw new ApiError(
      `Unable to reach backend at ${API_BASE_URL}. Ensure FastAPI is running.`,
      0,
      { originalError: error.message }
    )
  }
}

export async function checkBackendHealth() {
  try {
    const data = await request('/health')
    return { online: true, data }
  } catch (error) {
    return { online: false, error: error.message }
  }
}

export { API_BASE_URL }
