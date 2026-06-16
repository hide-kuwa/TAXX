"""ひな形本文から {{variable}} タグを抽出・置換する。"""

from __future__ import annotations

import re
from datetime import date
from typing import Dict, Iterable, List, Set

TAG_PATTERN = re.compile(r"\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}")

BUILTIN_CLIENT_TAGS = frozenset({"client_name", "client_id", "fiscal_month"})
BUILTIN_SYSTEM_TAGS = frozenset({"today"})


def extract_variable_names(body: str) -> List[str]:
    seen: Set[str] = set()
    ordered: List[str] = []
    for match in TAG_PATTERN.finditer(body or ""):
        name = match.group(1)
        if name not in seen:
            seen.add(name)
            ordered.append(name)
    return ordered


def render_template_body(body: str, values: Dict[str, str]) -> str:
    def repl(match: re.Match[str]) -> str:
        key = match.group(1)
        return values.get(key, match.group(0))

    return TAG_PATTERN.sub(repl, body or "")


def builtin_values_for_client(client: dict) -> Dict[str, str]:
    fiscal = client.get("fiscalMonth")
    return {
        "client_name": str(client.get("name") or ""),
        "client_id": str(client.get("id") or ""),
        "fiscal_month": str(fiscal) if fiscal is not None else "",
        "today": date.today().isoformat(),
    }


def merge_render_values(
  client: dict,
  user_values: Dict[str, str] | None,
) -> Dict[str, str]:
    merged = builtin_values_for_client(client)
    if user_values:
        for key, val in user_values.items():
            if key not in BUILTIN_CLIENT_TAGS and key not in BUILTIN_SYSTEM_TAGS:
                merged[key] = str(val)
            elif key in user_values and user_values[key]:
                merged[key] = str(user_values[key])
    return merged


def missing_variables(required: Iterable[str], resolved: Dict[str, str]) -> List[str]:
    missing: List[str] = []
    for name in required:
        val = resolved.get(name)
        if val is None or str(val).strip() == "":
            missing.append(name)
    return missing
