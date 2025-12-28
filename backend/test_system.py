import json
import mimetypes
import sys
import uuid
from http.client import HTTPConnection

HOST = "localhost"
PORT = 3100

MINIMAL_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"%\xe2\xe3\xcf\xd3\n"
    b"1 0 obj\n"
    b"<< /Type /Catalog /Pages 2 0 R >>\n"
    b"endobj\n"
    b"2 0 obj\n"
    b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n"
    b"endobj\n"
    b"3 0 obj\n"
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\n"
    b"endobj\n"
    b"4 0 obj\n"
    b"<< /Length 42 >>\n"
    b"stream\n"
    b"BT /F1 24 Tf 50 150 Td (Hello World) Tj ET\n"
    b"endstream\n"
    b"endobj\n"
    b"5 0 obj\n"
    b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n"
    b"endobj\n"
    b"xref\n"
    b"0 6\n"
    b"0000000000 65535 f \n"
    b"0000000015 00000 n \n"
    b"0000000064 00000 n \n"
    b"0000000121 00000 n \n"
    b"0000000247 00000 n \n"
    b"0000000339 00000 n \n"
    b"trailer\n"
    b"<< /Size 6 /Root 1 0 R >>\n"
    b"startxref\n"
    b"409\n"
    b"%%EOF\n"
)


def print_pass(name: str) -> None:
    print(f"✅ [PASS] {name}")


def print_fail(name: str, error: Exception | str) -> None:
    print(f"❌ [FAIL] {name}: {error}")


def send_multipart_request(method: str, endpoint: str, fields: dict, files: list) -> tuple:
    boundary = uuid.uuid4().hex
    body_parts: list[bytes] = []

    for name, value in fields.items():
        body_parts.append(
            (
                f"--{boundary}\r\n"
                f"Content-Disposition: form-data; name=\"{name}\"\r\n\r\n"
                f"{value}\r\n"
            ).encode("utf-8")
        )

    for field_name, filename, content_type, data in files:
        body_parts.append(
            (
                f"--{boundary}\r\n"
                f"Content-Disposition: form-data; name=\"{field_name}\"; filename=\"{filename}\"\r\n"
                f"Content-Type: {content_type}\r\n\r\n"
            ).encode("utf-8")
        )
        body_parts.append(data)
        body_parts.append(b"\r\n")

    body_parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    body = b"".join(body_parts)

    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
    }

    connection = HTTPConnection(HOST, PORT, timeout=30)
    try:
        connection.request(method, endpoint, body=body, headers=headers)
        response = connection.getresponse()
        response_body = response.read()
        return response.status, dict(response.getheaders()), response_body
    finally:
        connection.close()


def send_json_request(method: str, endpoint: str, payload: dict | None = None) -> tuple:
    body = json.dumps(payload or {}).encode("utf-8") if payload is not None else b""
    headers = {
        "Content-Type": "application/json",
        "Content-Length": str(len(body)),
    }
    connection = HTTPConnection(HOST, PORT, timeout=30)
    try:
        connection.request(method, endpoint, body=body, headers=headers)
        response = connection.getresponse()
        response_body = response.read()
        return response.status, dict(response.getheaders()), response_body
    finally:
        connection.close()


def send_basic_request(method: str, endpoint: str) -> tuple:
    connection = HTTPConnection(HOST, PORT, timeout=10)
    try:
        connection.request(method, endpoint)
        response = connection.getresponse()
        response_body = response.read()
        return response.status, dict(response.getheaders()), response_body
    finally:
        connection.close()


def decode_body(body: bytes) -> str:
    return body.decode("utf-8", errors="replace")


def main() -> int:
    try:
        status, _, body = send_basic_request("GET", "/")
        if status != 200:
            raise RuntimeError(decode_body(body))
        print_pass("Test 1: Health Check")
    except Exception as exc:
        print_fail("Test 1: Health Check", exc)
        return 1

    try:
        pdf_filename = "test.pdf"
        pdf_type = mimetypes.guess_type(pdf_filename)[0] or "application/pdf"
        status, headers, body = send_multipart_request(
            "POST",
            "/api/highlight",
            {
                "page": 0,
                "x": 100,
                "y": 100,
                "width": 50,
                "height": 50,
            },
            [("file", pdf_filename, pdf_type, MINIMAL_PDF_BYTES)],
        )
        if status != 200:
            raise RuntimeError(decode_body(body))
        file_id = headers.get("X-File-Id") or headers.get("x-file-id")
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
        status, _, body = send_json_request("POST", "/api/issues/", issue_payload)
        if status != 200:
            raise RuntimeError(decode_body(body))
        print_pass("Test 3: The Memory (Issue DB)")
    except Exception as exc:
        print_fail("Test 3: The Memory (Issue DB)", exc)
        return 1

    try:
        csv_filename = "test.csv"
        csv_type = mimetypes.guess_type(csv_filename)[0] or "text/csv"
        csv_bytes = (
            "date,description,amount\n"
            "2024-01-01,Office Supplies,123.45\n"
            "2024-02-15,Travel,678.90\n"
        ).encode("utf-8")
        status, _, body = send_multipart_request(
            "POST",
            "/api/audit/csv",
            {},
            [("file", csv_filename, csv_type, csv_bytes)],
        )
        if status != 200:
            raise RuntimeError(decode_body(body))
        print_pass("Test 4: The Audit Core (CSV)")
    except Exception as exc:
        print_fail("Test 4: The Audit Core (CSV)", exc)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
