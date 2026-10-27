import pytest
from pathlib import Path

from app.services.csv_service import parse_and_validate_csv, process_csv_upload


def test_parse_valid_csv():
    csv_data = b"department,budget,actual\nMarketing,100000,120000\nEngineering,250000,240000\n"
    response = process_csv_upload(csv_data, "test.csv")

    assert response.filename == "test.csv"
    assert response.valid_rows == 2
    assert response.total_rows == 2
    assert len(response.preview) == 2
    assert len(response.warnings) == 0
    assert len(response.errors) == 0
    assert response.summary.total_budget == 350000.0
    assert response.summary.total_actual == 360000.0
    assert response.summary.variance == 10000.0


def test_csv_with_currency_and_commas():
    csv_data = b'department,budget,actual\n"Sales","$150,000.50","$165,200.00"\n"Legal","$45,000.00","$42,500.00"\n'
    records, cols, warnings, errors = parse_and_validate_csv(csv_data, "currency.csv")
    assert len(records) == 2
    assert records[0].department == "Sales"
    assert records[0].budget == 150000.50
    assert records[0].actual == 165200.00


def test_missing_required_column():
    csv_data = b"department,budget\nMarketing,100000\n"
    with pytest.raises(ValueError, match="Missing required column"):
        parse_and_validate_csv(csv_data, "missing_col.csv")


def test_empty_csv():
    with pytest.raises(ValueError, match="empty"):
        parse_and_validate_csv(b"", "empty.csv")


def test_csv_with_invalid_rows():
    csv_data = (
        b"department,budget,actual\n"
        b"Valid Dept,1000,1200\n"
        b",1000,1200\n"  # missing department
        b"Bad Budget,not-a-number,1200\n"  # invalid budget
        b"Negative Actual,1000,-50\n"  # negative actual
    )
    response = process_csv_upload(csv_data, "mixed.csv")
    assert response.valid_rows == 1
    assert response.total_rows == 4
    assert len(response.errors) == 3
    assert len(response.warnings) == 1
    assert response.summary.department_count == 1
    assert response.summary.departments[0].department == "Valid Dept"


def test_sample_csv_file():
    sample_path = Path(__file__).parent.parent / "data" / "samples" / "sample_financials.csv"
    assert sample_path.exists()

    with open(sample_path, "rb") as f:
        content = f.read()

    response = process_csv_upload(content, "sample_financials.csv")
    assert response.valid_rows == 10
    assert response.summary.department_count == 10
    assert response.summary.total_budget > 0
    assert len(response.summary.overspending_departments) > 0
    assert len(response.summary.underspending_departments) > 0
