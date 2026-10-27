import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def create_sample_pdf(
    text: str = "Financial Planning Report Q1 2026. Marketing budget variance was positive $20,000.",
    pages: int = 1,
) -> bytes:
    """Create a completely valid multi-page or single-page PDF with extractable text."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)

    for p in range(pages):
        c.drawString(100, 750, f"Page {p + 1} - FP&A Financial Report")
        y = 700
        # Draw lines of text
        for line in text.split("\n"):
            c.drawString(100, y, line)
            y -= 20
        c.showPage()

    c.save()
    return buf.getvalue()


def create_blank_pdf() -> bytes:
    """Create a valid PDF with no text on it."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    c.showPage()
    c.save()
    return buf.getvalue()
