from pathlib import Path
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.financial import (
    FinancialAnalysisRequest,
    FinancialMetricsSummary,
    FinancialInsightsResponse,
    CSVUploadResponse,
)
from app.services.financial_service import (
    calculate_financial_metrics,
    generate_deterministic_insights,
)
from app.services.csv_service import process_csv_upload, parse_and_validate_csv
from app.services.llm_service import llm_service

router = APIRouter(prefix="/financial", tags=["Financial Analysis"])


@router.post(
    "/analyze",
    response_model=FinancialMetricsSummary,
    summary="Analyze financial records deterministically",
    description="Calculates totals, variances, variance percentages, and department-level summaries.",
)
def analyze_financial_records(request: FinancialAnalysisRequest):
    try:
        return calculate_financial_metrics(request.records)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.post(
    "/upload",
    response_model=CSVUploadResponse,
    summary="Upload and validate financial CSV file",
    description="Validates headers, data types, limits, and parses records into financial metrics.",
)
async def upload_financial_csv(file: UploadFile = File(...)):
    # Validate filename extension
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only .csv files are supported.",
        )

    try:
        content = await file.read()
        return process_csv_upload(content, file.filename)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the CSV file: {str(exc)}",
        )


@router.post(
    "/insights",
    response_model=FinancialInsightsResponse,
    summary="Generate deterministic insights and AI explanation",
    description="Computes metrics, deterministic rule-based insights, and optional AI commentary.",
)
def get_financial_insights(request: FinancialAnalysisRequest):
    try:
        summary = calculate_financial_metrics(request.records)
        deterministic_insights = generate_deterministic_insights(summary)
        ai_explanation = llm_service.generate_financial_explanation(summary, deterministic_insights)

        return FinancialInsightsResponse(
            summary=summary,
            deterministic_insights=deterministic_insights,
            ai_explanation=ai_explanation,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "/sample",
    response_model=FinancialAnalysisRequest,
    summary="Get synthetic sample financial data",
    description="Returns pre-validated synthetic financial records for testing and demonstration.",
)
def get_sample_financial_data():
    candidate_paths = [
        Path(__file__).resolve().parent.parent.parent / "data" / "samples" / "sample_financials.csv",
        Path.cwd() / "backend" / "data" / "samples" / "sample_financials.csv",
        Path.cwd() / "data" / "samples" / "sample_financials.csv",
    ]
    sample_path = next((p for p in candidate_paths if p.exists()), None)
    if not sample_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample financial data file not found.",
        )

    with open(sample_path, "rb") as f:
        content = f.read()

    records, _, _, _ = parse_and_validate_csv(content, "sample_financials.csv")
    return FinancialAnalysisRequest(records=records)

