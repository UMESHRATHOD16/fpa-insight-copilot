from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    """Source reference for evidence grounded in an ingested document."""
    document_id: str
    filename: str
    page_number: int
    chunk_id: str
    snippet: str


class RetrievedChunk(BaseModel):
    """A document passage retrieved from the vector store."""
    chunk_id: str
    document_id: str
    filename: str
    page_number: int
    text: str
    similarity_score: float


class ChatQuestionRequest(BaseModel):
    """User question for RAG-based document question answering."""
    question: str = Field(..., min_length=2, description="The natural language question to ask")
    document_id: Optional[str] = Field(None, description="Optional document ID to scope retrieval")
    top_k: int = Field(4, ge=1, le=10, description="Number of top chunks to retrieve")


class ChatAnswerResponse(BaseModel):
    """Evidence-grounded answer with source citations."""
    question: str
    answer: str
    citations: List[Citation]
    has_sufficient_evidence: bool
    model_used: str
    retrieved_chunks_count: int


class ToolCallExecution(BaseModel):
    """Record of an approved tool executed by the system."""
    tool_name: str
    arguments: Dict[str, Any]
    result: Any
    status: str = "success"  # "success" or "error"
    error_message: Optional[str] = None


class ControlledAgentRequest(BaseModel):
    """Request for controlled AI tool workflow."""
    prompt: str = Field(..., min_length=2, description="User prompt or task")
    tool_name: Optional[str] = Field(None, description="Explicit tool name if calling directly")
    arguments: Optional[Dict[str, Any]] = Field(None, description="Arguments for direct tool call")


class ControlledAgentResponse(BaseModel):
    """Structured response from controlled tool workflow."""
    prompt: str
    explanation: str
    tool_executions: List[ToolCallExecution]
    citations: List[Citation] = []
