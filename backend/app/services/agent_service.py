import json
import logging
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, Field, ValidationError

from app.schemas.chat import (
    Citation,
    ControlledAgentRequest,
    ControlledAgentResponse,
    ToolCallExecution,
)
from app.schemas.financial import FinancialRecord, FinancialAnalysisRequest
from app.services.financial_service import (
    calculate_financial_metrics,
    generate_deterministic_insights,
)
from app.services.llm_service import llm_service
from app.services.retrieval_service import retrieval_service

logger = logging.getLogger("fpa_copilot.agent")


# --- Tool Input Schemas ---

class SingleVarianceInput(BaseModel):
    department: str = Field(..., description="Department name")
    budget: float = Field(..., ge=0, description="Budgeted amount")
    actual: float = Field(..., ge=0, description="Actual spending amount")


class BatchVarianceInput(BaseModel):
    records: List[FinancialRecord] = Field(..., min_length=1, description="List of financial records")


class DocumentSearchInput(BaseModel):
    query: str = Field(..., min_length=2, description="Search query string")
    top_k: int = Field(4, ge=1, le=10, description="Number of document chunks to retrieve")
    document_id: Optional[str] = Field(None, description="Optional document ID to scope search")


# --- Tool Handlers ---

def tool_calculate_budget_variance(args: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate deterministic budget vs actual variance for single or multiple departments."""
    if "records" in args:
        validated = BatchVarianceInput(**args)
        summary = calculate_financial_metrics(validated.records)
        return summary.model_dump()
    else:
        validated = SingleVarianceInput(**args)
        record = FinancialRecord(
            department=validated.department,
            budget=validated.budget,
            actual=validated.actual,
        )
        summary = calculate_financial_metrics([record])
        dept = summary.departments[0]
        return {
            "department": dept.department,
            "budget": dept.budget,
            "actual": dept.actual,
            "variance": dept.variance,
            "variance_percentage": dept.variance_percentage,
            "status": dept.status,
            "convention": summary.variance_convention,
        }


def tool_summarize_financial_dataset(args: Dict[str, Any]) -> Dict[str, Any]:
    """Compute complete financial metrics and deterministic insights for a dataset."""
    validated = BatchVarianceInput(**args)
    summary = calculate_financial_metrics(validated.records)
    insights = generate_deterministic_insights(summary)
    return {
        "summary": summary.model_dump(),
        "insights": [i.model_dump() for i in insights],
    }


def tool_search_financial_documents(args: Dict[str, Any]) -> Dict[str, Any]:
    """Retrieve relevant chunks with citations from indexed financial PDF documents."""
    validated = DocumentSearchInput(**args)
    chunks = retrieval_service.retrieve_chunks(
        query=validated.query,
        top_k=validated.top_k,
        document_id=validated.document_id,
    )
    return {
        "results_count": len(chunks),
        "chunks": [c.model_dump() for c in chunks],
    }


# Tool Registry mapping approved tool names to schemas and functions
TOOL_REGISTRY: Dict[str, Dict[str, Any]] = {
    "calculate_budget_variance": {
        "description": "Calculates deterministic budget-versus-actual variance for a department or multiple departments.",
        "handler": tool_calculate_budget_variance,
        "input_schema": SingleVarianceInput,
    },
    "summarize_financial_dataset": {
        "description": "Calculates comprehensive budget totals, departmental variances, and deterministic insights for financial records.",
        "handler": tool_summarize_financial_dataset,
        "input_schema": BatchVarianceInput,
    },
    "search_financial_documents": {
        "description": "Performs semantic vector search across uploaded financial PDF reports and returns grounded excerpts with citations.",
        "handler": tool_search_financial_documents,
        "input_schema": DocumentSearchInput,
    },
}


def get_available_tools_spec() -> List[Dict[str, Any]]:
    """Return JSON-serializable specification of approved tools for client inspectability."""
    specs = []
    for name, data in TOOL_REGISTRY.items():
        specs.append(
            {
                "tool_name": name,
                "description": data["description"],
                "input_schema": data["input_schema"].model_json_schema(),
            }
        )
    return specs


def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> ToolCallExecution:
    """Safely validate arguments and execute an approved tool from the registry."""
    if tool_name not in TOOL_REGISTRY:
        return ToolCallExecution(
            tool_name=tool_name,
            arguments=arguments,
            result=None,
            status="error",
            error_message=f"Tool '{tool_name}' is not in the approved tool allowlist. Available tools: {list(TOOL_REGISTRY.keys())}",
        )

    tool_def = TOOL_REGISTRY[tool_name]
    try:
        result = tool_def["handler"](arguments)
        return ToolCallExecution(
            tool_name=tool_name,
            arguments=arguments,
            result=result,
            status="success",
        )
    except ValidationError as val_err:
        return ToolCallExecution(
            tool_name=tool_name,
            arguments=arguments,
            result=None,
            status="error",
            error_message=f"Invalid arguments for tool '{tool_name}': {str(val_err)}",
        )
    except Exception as exc:
        logger.error(f"Error executing tool '{tool_name}': {exc}")
        return ToolCallExecution(
            tool_name=tool_name,
            arguments=arguments,
            result=None,
            status="error",
            error_message=f"Execution error in tool '{tool_name}': {str(exc)}",
        )


def run_controlled_agent_workflow(request: ControlledAgentRequest) -> ControlledAgentResponse:
    """
    Execute controlled AI workflow:
    1. If explicit tool is specified, execute tool and explain result.
    2. If prompt asks to search documents or calculate metrics, route to approved tool.
    3. Return transparent tool results and grounded synthesis.
    """
    tool_executions: List[ToolCallExecution] = []
    citations: List[Citation] = []

    # 1. Explicit tool invocation
    if request.tool_name:
        execution = execute_tool(request.tool_name, request.arguments or {})
        tool_executions.append(execution)

        if execution.status == "success" and request.tool_name == "search_financial_documents":
            # Extract citations if search tool
            chunks_data = execution.result.get("chunks", [])
            for c in chunks_data:
                citations.append(
                    Citation(
                        document_id=c["document_id"],
                        filename=c["filename"],
                        page_number=c["page_number"],
                        chunk_id=c["chunk_id"],
                        snippet=c["text"][:200] + "..." if len(c["text"]) > 200 else c["text"],
                    )
                )

        explanation = (
            f"Successfully executed approved tool '{request.tool_name}'. "
            f"Result: {json.dumps(execution.result, indent=2) if execution.result else execution.error_message}"
        )
        return ControlledAgentResponse(
            prompt=request.prompt,
            explanation=explanation,
            tool_executions=tool_executions,
            citations=citations,
        )

    # 2. Intelligent controlled routing based on prompt intent
    lower_prompt = request.prompt.lower()

    if any(k in lower_prompt for k in ["search", "find", "report", "pdf", "document", "what does the"]):
        execution = execute_tool(
            "search_financial_documents",
            {"query": request.prompt, "top_k": 4},
        )
        tool_executions.append(execution)
        chunks = execution.result.get("chunks", []) if execution.status == "success" else []
        for c in chunks:
            citations.append(
                Citation(
                    document_id=c["document_id"],
                    filename=c["filename"],
                    page_number=c["page_number"],
                    chunk_id=c["chunk_id"],
                    snippet=c["text"][:200] + "...",
                )
            )

        if chunks:
            top_text = chunks[0]["text"]
            explanation = (
                f"Retrieved {len(chunks)} relevant excerpt(s) from indexed reports.\n"
                f"Top finding from {chunks[0]['filename']} (Page {chunks[0]['page_number']}):\n{top_text}"
            )
        else:
            explanation = "No relevant document passages were found in indexed reports."

        return ControlledAgentResponse(
            prompt=request.prompt,
            explanation=explanation,
            tool_executions=tool_executions,
            citations=citations,
        )

    # Default fallback when no tool needed or prompt is general
    return ControlledAgentResponse(
        prompt=request.prompt,
        explanation=(
            "No direct financial tool was required for this query. "
            "Please use the specific financial calculation endpoints or document search tool."
        ),
        tool_executions=[],
        citations=[],
    )
