from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class FinancialRecord(BaseModel):
    """A single financial line item representing budget and actual spending."""
    department: str = Field(..., min_length=1, description="Department name")
    budget: float = Field(..., ge=0, description="Budgeted amount (non-negative number)")
    actual: float = Field(..., ge=0, description="Actual spending amount (non-negative number)")
    period: Optional[str] = Field(None, description="Fiscal period (e.g. 2026-Q1)")
    category: Optional[str] = Field(None, description="Department category or cost center")
    revenue: Optional[float] = Field(None, ge=0, description="Optional revenue amount")
    expenses: Optional[float] = Field(None, ge=0, description="Optional expense amount")

    @field_validator("department")
    @classmethod
    def department_must_not_be_blank(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Department name cannot be blank or whitespace only")
        return clean


class FinancialAnalysisRequest(BaseModel):
    """Request payload containing a list of financial records to analyze."""
    records: List[FinancialRecord] = Field(..., min_length=1, description="Non-empty list of financial records")


class DepartmentVarianceSummary(BaseModel):
    """Variance analysis for an individual department."""
    department: str
    budget: float
    actual: float
    variance: float
    variance_percentage: Optional[float]
    status: str  # "over_budget", "under_budget", "on_budget"
    record_count: int = 1


class OptionalFinancialMetrics(BaseModel):
    """Optional high-level metrics when revenue/expense data is present."""
    total_revenue: Optional[float] = None
    total_expenses: Optional[float] = None
    net_profit: Optional[float] = None


class FinancialMetricsSummary(BaseModel):
    """Comprehensive summary of calculated financial metrics."""
    total_budget: float
    total_actual: float
    variance: float
    variance_percentage: Optional[float]
    department_count: int
    record_count: int
    overspending_departments: List[str]
    underspending_departments: List[str]
    departments: List[DepartmentVarianceSummary]
    optional_metrics: Optional[OptionalFinancialMetrics] = None
    variance_convention: str = (
        "Positive variance indicates actual spending exceeded budget (overspending). "
        "Negative variance indicates spending was below budget (savings)."
    )


class FinancialInsightItem(BaseModel):
    """A structured deterministic insight derived from financial data."""
    category: str  # e.g., "variance_alert", "efficiency", "overview"
    severity: str  # e.g., "high", "medium", "info"
    title: str
    description: str


class FinancialInsightsResponse(BaseModel):
    """Full analysis output combining deterministic metrics, rule-based insights, and optional AI explanations."""
    summary: FinancialMetricsSummary
    deterministic_insights: List[FinancialInsightItem]
    ai_explanation: Optional[str] = None


class CSVValidationIssue(BaseModel):
    """Details of a parsing or validation issue on a specific row."""
    row_index: int
    column: Optional[str] = None
    issue: str
    value: Optional[str] = None


class CSVUploadResponse(BaseModel):
    """Response returned upon successful CSV upload and validation."""
    filename: str
    total_rows: int
    valid_rows: int
    columns: List[str]
    preview: List[FinancialRecord]
    warnings: List[str] = []
    errors: List[CSVValidationIssue] = []
    summary: FinancialMetricsSummary

