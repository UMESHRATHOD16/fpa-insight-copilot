import pytest
from pydantic import ValidationError

from app.schemas.financial import FinancialRecord, FinancialAnalysisRequest
from app.services.financial_service import (
    calculate_financial_metrics,
    generate_deterministic_insights,
)


def test_positive_and_negative_variance():
    records = [
        FinancialRecord(department="Marketing", budget=100000.0, actual=120000.0),
        FinancialRecord(department="Engineering", budget=200000.0, actual=180000.0),
        FinancialRecord(department="HR", budget=50000.0, actual=50000.0),
    ]
    summary = calculate_financial_metrics(records)

    assert summary.total_budget == 350000.0
    assert summary.total_actual == 350000.0
    assert summary.variance == 0.0
    assert summary.variance_percentage == 0.0
    assert summary.department_count == 3
    assert summary.record_count == 3

    dept_map = {d.department: d for d in summary.departments}
    assert dept_map["Marketing"].variance == 20000.0
    assert dept_map["Marketing"].variance_percentage == 20.0
    assert dept_map["Marketing"].status == "over_budget"

    assert dept_map["Engineering"].variance == -20000.0
    assert dept_map["Engineering"].variance_percentage == -10.0
    assert dept_map["Engineering"].status == "under_budget"

    assert dept_map["HR"].variance == 0.0
    assert dept_map["HR"].status == "on_budget"

    assert summary.overspending_departments == ["Marketing"]
    assert summary.underspending_departments == ["Engineering"]


def test_zero_total_budget():
    records = [
        FinancialRecord(department="R&D", budget=0.0, actual=15000.0),
    ]
    summary = calculate_financial_metrics(records)

    assert summary.total_budget == 0.0
    assert summary.total_actual == 15000.0
    assert summary.variance == 15000.0
    assert summary.variance_percentage is None  # Cannot divide by zero
    assert summary.departments[0].variance_percentage is None
    assert summary.departments[0].status == "over_budget"


def test_duplicate_department_aggregation():
    records = [
        FinancialRecord(department="Sales", budget=1000.0, actual=1200.0),
        FinancialRecord(department="Sales", budget=2000.0, actual=1900.0),
    ]
    summary = calculate_financial_metrics(records)

    assert summary.department_count == 1
    assert summary.record_count == 2
    assert summary.total_budget == 3000.0
    assert summary.total_actual == 3100.0
    assert summary.variance == 100.0
    assert summary.departments[0].record_count == 2
    assert summary.departments[0].budget == 3000.0
    assert summary.departments[0].actual == 3100.0
    assert summary.departments[0].variance == 100.0


def test_decimal_precision_no_float_drift():
    # 0.1 + 0.2 float drift test: 0.1 + 0.2 != 0.3 in standard floats
    records = [
        FinancialRecord(department="A", budget=0.1, actual=0.2),
        FinancialRecord(department="B", budget=0.2, actual=0.1),
    ]
    summary = calculate_financial_metrics(records)
    assert summary.total_budget == 0.3
    assert summary.total_actual == 0.3
    assert summary.variance == 0.0


def test_negative_values_rejected():
    with pytest.raises(ValidationError):
        FinancialRecord(department="Marketing", budget=-500.0, actual=1000.0)

    with pytest.raises(ValidationError):
        FinancialRecord(department="Marketing", budget=500.0, actual=-100.0)


def test_blank_department_rejected():
    with pytest.raises(ValidationError):
        FinancialRecord(department="   ", budget=1000.0, actual=1000.0)

    with pytest.raises(ValidationError):
        FinancialRecord(department="", budget=1000.0, actual=1000.0)


def test_empty_records_rejected():
    with pytest.raises(ValidationError):
        FinancialAnalysisRequest(records=[])

    with pytest.raises(ValueError):
        calculate_financial_metrics([])


def test_optional_revenue_expenses_profit():
    records = [
        FinancialRecord(
            department="Product",
            budget=100000.0,
            actual=95000.0,
            revenue=250000.0,
            expenses=95000.0,
        )
    ]
    summary = calculate_financial_metrics(records)
    assert summary.optional_metrics is not None
    assert summary.optional_metrics.total_revenue == 250000.0
    assert summary.optional_metrics.total_expenses == 95000.0
    assert summary.optional_metrics.net_profit == 155000.0


def test_deterministic_insights_generation():
    records = [
        FinancialRecord(department="Marketing", budget=50000.0, actual=75000.0),  # +50%
        FinancialRecord(department="Operations", budget=100000.0, actual=80000.0), # -20%
        FinancialRecord(department="Unbudgeted", budget=0.0, actual=5000.0),
    ]
    summary = calculate_financial_metrics(records)
    insights = generate_deterministic_insights(summary)

    assert len(insights) >= 3
    titles = [i.title for i in insights]
    assert any("Overall Portfolio Overspending" in t for t in titles)
    assert any("Significant Overspending" in t for t in titles)
    assert any("Largest Favorable Variance" in t for t in titles)
    assert any("Unbudgeted Actual Spending" in t for t in titles)
