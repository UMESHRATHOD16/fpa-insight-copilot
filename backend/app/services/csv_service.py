import io
import re
from typing import List, Tuple, Dict, Any, Optional
import pandas as pd

from app.core.config import settings
from app.schemas.financial import (
    FinancialRecord,
    CSVValidationIssue,
    CSVUploadResponse,
)
from app.services.financial_service import calculate_financial_metrics

REQUIRED_COLUMNS = {"department", "budget", "actual"}
OPTIONAL_COLUMNS = {"period", "category", "revenue", "expenses"}
ALL_SUPPORTED_COLUMNS = REQUIRED_COLUMNS | OPTIONAL_COLUMNS


def _clean_number(val: Any) -> Optional[float]:
    """Clean string numbers formatted with currency symbols, commas, or spaces."""
    if val is None or pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return float(val)

    s = str(val).strip()
    # Strip currency symbols and commas: $1,234.56 -> 1234.56
    s_cleaned = re.sub(r"[^\d.-]", "", s)
    if not s_cleaned:
        return None
    try:
        return float(s_cleaned)
    except ValueError:
        return None


def parse_and_validate_csv(
    file_bytes: bytes,
    filename: str,
) -> Tuple[List[FinancialRecord], List[str], List[str], List[CSVValidationIssue]]:
    """
    Safely parse CSV bytes with pandas, validate schema and individual row data.
    Returns:
        (records, detected_columns, warnings, validation_errors)
    """
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise ValueError(f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_MB} MB.")

    if len(file_bytes) == 0:
        raise ValueError("Uploaded CSV file is empty.")

    # Attempt decoding
    decoded_text: Optional[str] = None
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            decoded_text = file_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if decoded_text is None:
        raise ValueError("Unable to decode CSV file. Please ensure it is saved in UTF-8 format.")

    try:
        df = pd.read_csv(io.StringIO(decoded_text))
    except Exception as exc:
        raise ValueError(f"Malformed CSV content: {str(exc)}")

    if df.empty:
        raise ValueError("The uploaded CSV contains no rows.")

    if len(df) > settings.MAX_CSV_ROWS:
        raise ValueError(
            f"CSV row count ({len(df)}) exceeds the maximum allowed limit of {settings.MAX_CSV_ROWS} rows."
        )

    # Normalize column names: strip whitespace and lowercase
    raw_columns = list(df.columns)
    col_map: Dict[str, str] = {}
    for col in raw_columns:
        normalized = str(col).strip().lower()
        if normalized in ALL_SUPPORTED_COLUMNS:
            col_map[col] = normalized

    # Check required columns
    found_normalized = set(col_map.values())
    missing_required = REQUIRED_COLUMNS - found_normalized
    if missing_required:
        raise ValueError(
            f"Missing required column(s): {', '.join(sorted(missing_required))}. "
            f"Required columns are: {', '.join(sorted(REQUIRED_COLUMNS))}."
        )

    # Rename columns to standard names
    df = df.rename(columns=col_map)
    detected_columns = [col_map[col] for col in raw_columns if col in col_map]

    records: List[FinancialRecord] = []
    warnings: List[str] = []
    errors: List[CSVValidationIssue] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2  # 1-indexed including CSV header row

        # Validate department
        raw_dept = row.get("department")
        if pd.isna(raw_dept) or not str(raw_dept).strip():
            errors.append(
                CSVValidationIssue(
                    row_index=row_num,
                    column="department",
                    issue="Department is required and cannot be empty",
                    value=str(raw_dept) if not pd.isna(raw_dept) else None,
                )
            )
            continue
        dept = str(raw_dept).strip()

        # Validate budget
        raw_budget = row.get("budget")
        budget_val = _clean_number(raw_budget)
        if budget_val is None or budget_val < 0:
            errors.append(
                CSVValidationIssue(
                    row_index=row_num,
                    column="budget",
                    issue="Budget must be a non-negative finite number",
                    value=str(raw_budget) if not pd.isna(raw_budget) else None,
                )
            )
            continue

        # Validate actual
        raw_actual = row.get("actual")
        actual_val = _clean_number(raw_actual)
        if actual_val is None or actual_val < 0:
            errors.append(
                CSVValidationIssue(
                    row_index=row_num,
                    column="actual",
                    issue="Actual spending must be a non-negative finite number",
                    value=str(raw_actual) if not pd.isna(raw_actual) else None,
                )
            )
            continue

        # Optional columns
        period_val = str(row.get("period")).strip() if "period" in df.columns and not pd.isna(row.get("period")) else None
        category_val = str(row.get("category")).strip() if "category" in df.columns and not pd.isna(row.get("category")) else None
        revenue_val = _clean_number(row.get("revenue")) if "revenue" in df.columns else None
        expenses_val = _clean_number(row.get("expenses")) if "expenses" in df.columns else None

        records.append(
            FinancialRecord(
                department=dept,
                budget=budget_val,
                actual=actual_val,
                period=period_val,
                category=category_val,
                revenue=revenue_val,
                expenses=expenses_val,
            )
        )

    if not records:
        raise ValueError("No valid financial records could be parsed from the CSV file.")

    if errors:
        warnings.append(f"{len(errors)} row(s) had validation errors and were excluded from analysis.")

    return records, detected_columns, warnings, errors


def process_csv_upload(file_bytes: bytes, filename: str) -> CSVUploadResponse:
    """End-to-end processing of CSV upload, producing validated records and financial summary."""
    records, detected_columns, warnings, errors = parse_and_validate_csv(file_bytes, filename)
    summary = calculate_financial_metrics(records)

    # Safe sanitize filename (strip path elements)
    safe_filename = filename.replace("\\", "/").split("/")[-1]

    return CSVUploadResponse(
        filename=safe_filename,
        total_rows=len(records) + len(errors),
        valid_rows=len(records),
        columns=detected_columns,
        preview=records[:10],
        warnings=warnings,
        errors=errors,
        summary=summary,
    )
