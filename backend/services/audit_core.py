import csv
import hashlib
import io
import json
from typing import Any, Dict, List

from fastapi import UploadFile


class AuditService:
    def __init__(self) -> None:
        self._fingerprint_key = "_taxx_fingerprint"

    async def ingest_csv(self, upload_file: UploadFile) -> List[Dict[str, Any]]:
        content = await upload_file.read()
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        records = []
        for row in reader:
            record = dict(row)
            if not record.get(self._fingerprint_key):
                record[self._fingerprint_key] = self._generate_fingerprint(record)
            records.append(record)
        return records

    def detect_changes(
        self,
        old_records: List[Dict[str, Any]],
        new_records: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        old_map = self._records_by_fingerprint(old_records)
        new_map = self._records_by_fingerprint(new_records)

        old_keys = set(old_map)
        new_keys = set(new_map)

        deleted_keys = old_keys - new_keys
        added_keys = new_keys - old_keys
        unchanged_keys = old_keys & new_keys

        return {
            "added": [new_map[key] for key in sorted(added_keys)],
            "deleted": [old_map[key] for key in sorted(deleted_keys)],
            "unchanged_count": len(unchanged_keys),
        }

    def _records_by_fingerprint(
        self,
        records: List[Dict[str, Any]],
    ) -> Dict[str, Dict[str, Any]]:
        record_map = {}
        for record in records:
            fingerprint = record.get(self._fingerprint_key)
            if fingerprint:
                record_map[fingerprint] = record
        return record_map

    def _generate_fingerprint(self, record: Dict[str, Any]) -> str:
        payload = {
            key: value
            for key, value in record.items()
            if key != self._fingerprint_key
        }
        serialized = json.dumps(payload, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
