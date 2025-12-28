"""Audit core services for CSV ingestion and change detection."""

import csv
import hashlib
import io


class AuditService:
    """Service for ingesting accounting CSVs and fingerprinting rows."""

    def ingest_csv(self, file_stream):
        """Read CSV data and append a cryptographic fingerprint for each row."""
        raw_bytes = file_stream.read()

        try:
            decoded = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            decoded = raw_bytes.decode("shift_jis")

        reader = csv.DictReader(io.StringIO(decoded))
        records = []

        for row in reader:
            concatenated = "".join("" if value is None else str(value) for value in row.values())
            fingerprint = hashlib.sha256(concatenated.encode("utf-8")).hexdigest()
            row["_taxx_fingerprint"] = fingerprint
            records.append(row)

        return records

    def detect_changes(self, old_records, new_records):
        """Detect added, deleted, and unchanged records via fingerprint comparison."""
        old_map = {record.get("_taxx_fingerprint"): record for record in old_records}
        new_map = {record.get("_taxx_fingerprint"): record for record in new_records}

        old_fingerprints = set(old_map.keys())
        new_fingerprints = set(new_map.keys())

        added = [new_map[fingerprint] for fingerprint in new_fingerprints - old_fingerprints]
        deleted = [old_map[fingerprint] for fingerprint in old_fingerprints - new_fingerprints]
        unchanged = [new_map[fingerprint] for fingerprint in new_fingerprints & old_fingerprints]

        return {
            "added": added,
            "deleted": deleted,
            "unchanged": unchanged,
        }
