from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional
from collections import defaultdict

from app.schemas.financial import (
    FinancialRecord,
    DepartmentVarianceSummary,
    FinancialMetricsSummary,
    OptionalFinancialMetrics,
    FinancialInsightItem,
    FinancialInsightsResponse,
)

TWO_PLACES = Decimal("0.01")
TOLERANCE = Decimal("0.005")


def _to_decimal(val: float | int | Decimal | None) -> Decimal:
    """Safely convert numeric value to Decimal."""
    if val is None:
        return Decimal("0.00")
    return Decimal(str(val))


def _round_float(d: Decimal) -> float:
    """Quantize decimal to 2 decimal places and return as float for serialization."""
    return float(d.quantize(TWO_PLACES, rounding=ROUND_HALF_UP))


def calculate_financial_metrics(records: List[FinancialRecord]) -> FinancialMetricsSummary:
    """
    Deterministically calculate budget, actual, and variance metrics across records and departments.
    Positive variance = overspending (actual > budget).
    Negative variance = underspending / savings (actual < budget).
    """
    if not records:
        raise ValueError("Cannot calculate financial metrics from an empty record set.")

    total_budget_dec = Decimal("0.00")
    total_actual_dec = Decimal("0.00")

    # Optional metric accumulators
    has_revenue = False
    has_expenses = False
    total_revenue_dec = Decimal("0.00")
    total_expenses_dec = Decimal("0.00")

    # Department-level aggregation
    dept_map: Dict[str, Dict[str, any]] = defaultdict(
        lambda: {"budget": Decimal("0.00"), "actual": Decimal("0.00"), "count": 0}
    )

    for record in records:
        b_dec = _to_decimal(record.budget)
        a_dec = _to_decimal(record.actual)

        total_budget_dec += b_dec
        total_actual_dec += a_dec

        dept_info = dept_map[record.department]
        dept_info["budget"] += b_dec
        dept_info["actual"] += a_dec
        dept_info["count"] += 1

        if record.revenue is not None:
            has_revenue = True
            total_revenue_dec += _to_decimal(record.revenue)

        if record.expenses is not None:
            has_expenses = True
            total_expenses_dec += _to_decimal(record.expenses)

    # Total variance
    total_variance_dec = total_actual_dec - total_budget_dec

    total_var_pct: Optional[float] = None
    if total_budget_dec > Decimal("0.00"):
        raw_pct = (total_variance_dec / total_budget_dec) * Decimal("100.00")
        total_var_pct = _round_float(raw_pct)

    # Process departments
    department_summaries: List[DepartmentVarianceSummary] = []
    overspending_depts_list = []
    underspending_depts_list = []

    for dept_name, data in dept_map.items():
        dept_b = data["budget"]
        dept_a = data["actual"]
        dept_var = dept_a - dept_b

        dept_var_pct: Optional[float] = None
        if dept_b > Decimal("0.00"):
            raw_dept_pct = (dept_var / dept_b) * Decimal("100.00")
            dept_var_pct = _round_float(raw_dept_pct)

        if dept_var > TOLERANCE:
            status = "over_budget"
            overspending_depts_list.append((dept_name, dept_var))
        elif dept_var < -TOLERANCE:
            status = "under_budget"
            underspending_depts_list.append((dept_name, dept_var))
        else:
            status = "on_budget"

        department_summaries.append(
            DepartmentVarianceSummary(
                department=dept_name,
                budget=_round_float(dept_b),
                actual=_round_float(dept_a),
                variance=_round_float(dept_var),
                variance_percentage=dept_var_pct,
                status=status,
                record_count=data["count"],
            )
        )

    # Sort department summaries by absolute variance descending for dashboard readability
    department_summaries.sort(key=lambda d: abs(d.variance), reverse=True)

    # Sort overspending descending (highest overspending first)
    overspending_depts_list.sort(key=lambda x: x[1], reverse=True)
    overspending_names = [name for name, _ in overspending_depts_list]

    # Sort underspending ascending (largest negative variance first)
    underspending_depts_list.sort(key=lambda x: x[1])
    underspending_names = [name for name, _ in underspending_depts_list]

    # Build optional metrics if present
    optional_metrics: Optional[OptionalFinancialMetrics] = None
    if has_revenue or has_expenses:
        rev = _round_float(total_revenue_dec) if has_revenue else None
        exp = _round_float(total_expenses_dec) if has_expenses else None
        profit = None
        if has_revenue and has_expenses:
            profit = _round_float(total_revenue_dec - total_expenses_dec)
        optional_metrics = OptionalFinancialMetrics(
            total_revenue=rev,
            total_expenses=exp,
            net_profit=profit,
        )

    return FinancialMetricsSummary(
        total_budget=_round_float(total_budget_dec),
        total_actual=_round_float(total_actual_dec),
        variance=_round_float(total_variance_dec),
        variance_percentage=total_var_pct,
        department_count=len(dept_map),
        record_count=len(records),
        overspending_departments=overspending_names,
        underspending_departments=underspending_names,
        departments=department_summaries,
        optional_metrics=optional_metrics,
    )


def generate_deterministic_insights(summary: FinancialMetricsSummary) -> List[FinancialInsightItem]:
    """
    Generate grounded, rule-based insights without relying on an LLM.
    These insights are pure deterministic facts derived directly from calculations.
    """
    insights: List[FinancialInsightItem] = []

    # 1. Overall Portfolio Performance
    if summary.variance > 0:
        pct_text = f"+{summary.variance_percentage:.1f}%" if summary.variance_percentage is not None else "N/A"
        insights.append(
            FinancialInsightItem(
                category="overview",
                severity="medium" if summary.variance_percentage and summary.variance_percentage < 5 else "high",
                title="Overall Portfolio Overspending",
                description=(
                    f"Total actual spending (${summary.total_actual:,.2f}) exceeded the total budget "
                    f"(${summary.total_budget:,.2f}) by ${summary.variance:,.2f} ({pct_text})."
                ),
            )
        )
    elif summary.variance < 0:
        pct_text = f"{summary.variance_percentage:.1f}%" if summary.variance_percentage is not None else "N/A"
        insights.append(
            FinancialInsightItem(
                category="overview",
                severity="info",
                title="Overall Portfolio Savings",
                description=(
                    f"Total actual spending (${summary.total_actual:,.2f}) was below total budget "
                    f"(${summary.total_budget:,.2f}) by ${abs(summary.variance):,.2f} ({pct_text}), "
                    f"representing net savings."
                ),
            )
        )
    else:
        insights.append(
            FinancialInsightItem(
                category="overview",
                severity="info",
                title="Portfolio Perfectly Balanced",
                description="Total actual spending matched the total budget exactly.",
            )
        )

    # 2. Significant Department Variances (Exceeding 10% budget or > $20k overspend)
    significant_overspenders = [
        d for d in summary.departments
        if d.variance > 0 and (
            (d.variance_percentage is not None and d.variance_percentage >= 10.0)
            or d.variance >= 20000.0
        )
    ]
    if significant_overspenders:
        names = ", ".join(d.department for d in significant_overspenders[:3])
        insights.append(
            FinancialInsightItem(
                category="variance_alert",
                severity="high",
                title=f"Significant Overspending in {len(significant_overspenders)} Department(s)",
                description=(
                    f"Departments with significant budget overruns: {names}. "
                    f"Leading overrun: {significant_overspenders[0].department} by "
                    f"${significant_overspenders[0].variance:,.2f} "
                    f"({f'+{significant_overspenders[0].variance_percentage:.1f}%' if significant_overspenders[0].variance_percentage is not None else 'N/A'})."
                ),
            )
        )

    # 3. Top Underspending / Savings
    if summary.underspending_departments:
        top_saver_name = summary.underspending_departments[0]
        top_saver = next((d for d in summary.departments if d.department == top_saver_name), None)
        if top_saver:
            insights.append(
                FinancialInsightItem(
                    category="efficiency",
                    severity="info",
                    title=f"Largest Favorable Variance: {top_saver.department}",
                    description=(
                        f"{top_saver.department} spent ${abs(top_saver.variance):,.2f} less than budgeted "
                        f"({f'{top_saver.variance_percentage:.1f}%' if top_saver.variance_percentage is not None else 'N/A'})."
                    ),
                )
            )

    # 4. Zero Budget Departments with Spending
    zero_budget_spenders = [d for d in summary.departments if d.budget == 0 and d.actual > 0]
    if zero_budget_spenders:
        dept_names = ", ".join(d.department for d in zero_budget_spenders)
        insights.append(
            FinancialInsightItem(
                category="variance_alert",
                severity="high",
                title="Unbudgeted Actual Spending Detected",
                description=f"Departments with $0 budget but positive actual spending: {dept_names}.",
            )
        )

    return insights
