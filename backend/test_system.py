import os
import sys
from pathlib import Path

import requests
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

BASE_URL = os.getenv("TAXX_BASE_URL", "http://localhost:3100")
PDF_PATH = Path(__file__).with_name("test.pdf")
CSV_PATH = Path(__file__).with_name("test.csv")


def print_pass(name: str) -> None:
    print(f"✅ [PASS] {name}")


def print_fail(name: str, error: Exception | str) -> None:
    print(f"❌ [FAIL] {name}: {error}")


def generate_pdf() -> None:
    pdf_canvas = canvas.Canvas(str(PDF_PATH), pagesize=letter)
    pdf_canvas.setFont("Helvetica", 12)
    pdf_canvas.drawString(72, 720, "TAXX System Test PDF")
    pdf_canvas.drawString(72, 700, "Highlight target area is near x=100, y=100")
    pdf_canvas.showPage()
    pdf_canvas.save()


def generate_csv() -> None:
    CSV_PATH.write_text(
        "date,description,amount\n"
        "2024-01-01,Office Supplies,123.45\n"
        "2024-02-15,Travel,678.90\n",
        encoding="utf-8",
    )


def require_success(response: requests.Response, name: str) -> requests.Response:
    if not response.ok:
        raise RuntimeError(f"{name} failed with status {response.status_code}: {response.text}")
    return response


def main() -> int:
    try:
        generate_pdf()
        generate_csv()
        print_pass("Setup: Generated test.pdf and test.csv")
    except Exception as exc:
        print_fail("Setup", exc)
        return 1

    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        require_success(response, "Health Check")
        print_pass("Test 1: Health Check")
    except Exception as exc:
        print_fail("Test 1: Health Check", exc)
        return 1

    try:
        with PDF_PATH.open("rb") as pdf_file:
            response = requests.post(
                f"{BASE_URL}/api/highlight",
                files={"file": (PDF_PATH.name, pdf_file, "application/pdf")},
                data={
                    "page": 1,
                    "x": 100,
                    "y": 100,
                    "width": 50,
                    "height": 50,
                },
                timeout=30,
            )
        require_success(response, "Highlight")
        file_id = response.headers.get("X-File-Id")
        if not file_id:
            raise RuntimeError("Missing X-File-Id header")
        print_pass("Test 2: The Vault & Eye (PDF Highlight)")
    except Exception as exc:
        print_fail("Test 2: The Vault & Eye (PDF Highlight)", exc)
        return 1

    try:
        issue_payload = {
            "file_id": file_id,
            "page_index": 0,
            "x": 100,
            "y": 100,
            "comment": "Check this expense",
        }
        response = requests.post(
            f"{BASE_URL}/api/issues/",
            json=issue_payload,
            timeout=10,
        )
        require_success(response, "Create Issue")
        response = requests.get(
            f"{BASE_URL}/api/issues/{file_id}",
            timeout=10,
        )
        require_success(response, "List Issues")
        issues = response.json()
        if not issues:
            raise RuntimeError("No issues returned for file_id")
        print_pass("Test 3: The Memory (Issue DB)")
    except Exception as exc:
        print_fail("Test 3: The Memory (Issue DB)", exc)
        return 1

    try:
        with CSV_PATH.open("rb") as csv_file:
            response = requests.post(
                f"{BASE_URL}/api/audit/csv",
                files={"file": (CSV_PATH.name, csv_file, "text/csv")},
                timeout=10,
            )
        require_success(response, "Audit CSV")
        payload = response.json()
        records = payload.get("records", [])
        if not records:
            raise RuntimeError("No records returned")
        if any("_taxx_fingerprint" not in record for record in records):
            raise RuntimeError("Missing _taxx_fingerprint in records")
        print_pass("Test 4: The Audit Core (CSV)")
    except Exception as exc:
        print_fail("Test 4: The Audit Core (CSV)", exc)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
