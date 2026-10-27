from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, status

from app.schemas.chat import (
    ChatAnswerResponse,
    ChatQuestionRequest,
    ControlledAgentRequest,
    ControlledAgentResponse,
)
from app.services.agent_service import (
    get_available_tools_spec,
    run_controlled_agent_workflow,
)
from app.services.llm_service import llm_service
from app.services.retrieval_service import retrieval_service

router = APIRouter(prefix="/chat", tags=["RAG & AI Assistant"])


@router.post(
    "/ask",
    response_model=ChatAnswerResponse,
    summary="Ask an evidence-grounded question about indexed documents",
    description="Retrieves relevant document passages, synthesizes an answer using Gemini, and returns citations.",
)
def ask_document_question(request: ChatQuestionRequest):
    try:
        # 1. Retrieve top relevant chunks from ChromaDB
        retrieved_chunks = retrieval_service.retrieve_chunks(
            query=request.question,
            top_k=request.top_k,
            document_id=request.document_id,
        )

        # 2. Generate grounded answer and citations via LLM service
        answer, citations, has_evidence = llm_service.generate_grounded_answer(
            question=request.question,
            retrieved_chunks=retrieved_chunks,
        )

        model_name = llm_service.model if llm_service.is_available else "offline-extractive-fallback"

        return ChatAnswerResponse(
            question=request.question,
            answer=answer,
            citations=citations,
            has_sufficient_evidence=has_evidence,
            model_used=model_name,
            retrieved_chunks_count=len(retrieved_chunks),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during question answering: {str(exc)}",
        )


@router.post(
    "/tool",
    response_model=ControlledAgentResponse,
    summary="Execute a controlled AI tool workflow",
    description="Executes strictly allowlisted financial calculation or document search tools.",
)
def execute_controlled_tool(request: ControlledAgentRequest):
    try:
        return run_controlled_agent_workflow(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while executing tool workflow: {str(exc)}",
        )


@router.get(
    "/tools",
    response_model=List[Dict[str, Any]],
    summary="List approved AI tools and parameter schemas",
)
def list_available_tools():
    return get_available_tools_spec()
