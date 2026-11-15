/**
 * Chat & Agent Service - Interacts with /api/chat/* endpoints
 */
import { request } from './api'

export const chatService = {
  /**
   * Ask an evidence-grounded question using RAG
   * Payload: { question: string, document_id?: string, top_k?: number, signal?: AbortSignal }
   * Returns: ChatAnswerResponse
   */
  async askQuestion({ question, document_id = null, top_k = 4, signal = null }) {
    const payload = {
      question,
      top_k: Number(top_k) || 4,
    }
    if (document_id) {
      payload.document_id = document_id
    }

    return request('/api/chat/ask', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    })
  },

  /**
   * Fetch approved tool definitions and parameter schemas
   * Returns: ToolSpecification[]
   */
  async getAvailableTools() {
    return request('/api/chat/tools', {
      method: 'GET',
    })
  },

  /**
   * Execute an approved tool workflow
   * Payload: { prompt: string, tool_name?: string, arguments?: object }
   * Returns: ControlledAgentResponse
   */
  async executeTool({ prompt, tool_name = null, args = null }) {
    const payload = {
      prompt,
    }
    if (tool_name) {
      payload.tool_name = tool_name
    }
    if (args) {
      payload.arguments = args
    }

    return request('/api/chat/tool', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
