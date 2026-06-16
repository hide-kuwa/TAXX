"""Global / Local 文書ひな形（Phase 1: テキスト本文）。"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from services.firm_settings import STORAGE_DIR, _load_json, _write_json
from services.template_variable_parser import extract_variable_names

PLATFORM_DIR = STORAGE_DIR / "platform"
GLOBAL_TEMPLATES_PATH = PLATFORM_DIR / "global_authoring_templates.json"

DEFAULT_GLOBAL_TEMPLATES: List[dict] = [
    {
        "id": "global-officer-compensation-minutes",
        "scope": "global",
        "title": "役員報酬改定議事録（たたき台）",
        "description": "株主総会議事録の公式ひな形。法改正時は TAXX が更新します。",
        "category": "corporate_governance",
        "body": (
            "株式会社{{client_name}} 臨時株主総会議事録\n\n"
            "1. 日時: {{meeting_date}}\n"
            "2. 場所: {{meeting_place}}\n"
            "3. 議題: 役員報酬の改定\n"
            "4. 決議: 代表取締役の月額報酬を {{new_monthly_salary}} とする。\n\n"
            "以上"
        ),
        "version": "1.0.0",
    },
    {
        "id": "global-loan-agreement-stub",
        "scope": "global",
        "title": "金銭消費貸借契約書（たたき台）",
        "description": "役員借入等に用いる契約書の骨子。",
        "category": "contracts",
        "body": (
            "金銭消費貸借契約書\n\n"
            "貸主 {{lender_name}} と借主 {{borrower_name}} は、"
            "借入金額 {{loan_amount}} 円、利率 {{interest_rate}}、"
            "返済期限 {{repayment_date}} について、以下のとおり契約する。\n\n"
            "（条文続く）"
        ),
        "version": "1.0.0",
    },
]


def _firm_local_path(firm_id: str) -> Path:
    return STORAGE_DIR / "firms" / firm_id / "local_authoring_templates.json"


def _now() -> str:
    return datetime.utcnow().isoformat()


def _enrich_template(raw: dict, *, firm_id: Optional[str] = None) -> dict:
    body = str(raw.get("body") or "")
    variables = raw.get("variables")
    if not isinstance(variables, list):
        variables = extract_variable_names(body)
    scope = raw.get("scope") or ("local" if firm_id else "global")
    return {
        "id": str(raw.get("id") or uuid.uuid4().hex),
        "scope": scope,
        "title": str(raw.get("title") or "無題のひな形"),
        "description": str(raw.get("description") or ""),
        "category": str(raw.get("category") or "general"),
        "body": body,
        "variables": variables,
        "version": str(raw.get("version") or "1.0.0"),
        "updatedAt": raw.get("updatedAt") or _now(),
        **({"firmId": firm_id} if firm_id else {}),
    }


def _load_global_raw() -> List[dict]:
    if GLOBAL_TEMPLATES_PATH.exists():
        data = _load_json(GLOBAL_TEMPLATES_PATH)
        items = data.get("templates") if isinstance(data, dict) else None
        if isinstance(items, list) and items:
            return items
    PLATFORM_DIR.mkdir(parents=True, exist_ok=True)
    seed = {"templates": DEFAULT_GLOBAL_TEMPLATES, "updatedAt": _now()}
    GLOBAL_TEMPLATES_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False), encoding="utf-8")
    return list(DEFAULT_GLOBAL_TEMPLATES)


def _save_global_raw(templates: List[dict]) -> None:
    PLATFORM_DIR.mkdir(parents=True, exist_ok=True)
    _write_json(GLOBAL_TEMPLATES_PATH, {"templates": templates, "updatedAt": _now()})


def list_global_templates() -> List[dict]:
    return [_enrich_template(t) for t in _load_global_raw()]


def list_local_templates(firm_id: str) -> List[dict]:
    raw = _load_json(_firm_local_path(firm_id))
    items = raw.get("templates") if isinstance(raw, dict) else []
    if not isinstance(items, list):
        items = []
    return [_enrich_template(t, firm_id=firm_id) for t in items]


def list_all_for_firm(firm_id: str) -> dict:
    return {
        "global": list_global_templates(),
        "local": list_local_templates(firm_id),
    }


def get_template_by_id(template_id: str, firm_id: str) -> Optional[dict]:
    for t in list_global_templates():
        if t["id"] == template_id:
            return t
    for t in list_local_templates(firm_id):
        if t["id"] == template_id:
            return t
    return None


def create_local_template(
    firm_id: str,
    *,
    title: str,
    body: str,
    description: str = "",
    category: str = "general",
) -> dict:
    path = _firm_local_path(firm_id)
    raw = _load_json(path)
    items = raw.get("templates") if isinstance(raw, dict) else []
    if not isinstance(items, list):
        items = []
    item = _enrich_template(
        {
            "id": uuid.uuid4().hex,
            "scope": "local",
            "title": title,
            "description": description,
            "category": category,
            "body": body,
            "version": "1.0.0",
            "updatedAt": _now(),
        },
        firm_id=firm_id,
    )
    items.append(item)
    _write_json(path, {"templates": items, "updatedAt": _now()})
    return item


def create_global_template(
    *,
    title: str,
    body: str,
    description: str = "",
    category: str = "general",
) -> dict:
    items = _load_global_raw()
    item = _enrich_template(
        {
            "id": f"global-{uuid.uuid4().hex[:12]}",
            "scope": "global",
            "title": title,
            "description": description,
            "category": category,
            "body": body,
            "version": "1.0.0",
            "updatedAt": _now(),
        }
    )
    items.append(item)
    _save_global_raw(items)
    return item


def update_template(
    template_id: str,
    firm_id: str,
    *,
    title: Optional[str] = None,
    body: Optional[str] = None,
    description: Optional[str] = None,
    category: Optional[str] = None,
    is_platform: bool,
) -> Optional[dict]:
    existing = get_template_by_id(template_id, firm_id)
    if not existing:
        return None
    if existing["scope"] == "global":
        if not is_platform:
            return None
        items = _load_global_raw()
        updated: Optional[dict] = None
        next_items: List[dict] = []
        for raw in items:
            if raw.get("id") == template_id:
                merged = dict(raw)
                if title is not None:
                    merged["title"] = title
                if body is not None:
                    merged["body"] = body
                if description is not None:
                    merged["description"] = description
                if category is not None:
                    merged["category"] = category
                merged["updatedAt"] = _now()
                updated = _enrich_template(merged)
                next_items.append(
                    {
                        **merged,
                        "variables": extract_variable_names(merged.get("body", "")),
                    }
                )
            else:
                next_items.append(raw)
        if not updated:
            return None
        _save_global_raw(next_items)
        return updated

    path = _firm_local_path(firm_id)
    raw = _load_json(path)
    items = raw.get("templates") if isinstance(raw, dict) else []
    if not isinstance(items, list):
        return None
    updated = None
    next_items = []
    for raw_item in items:
        if raw_item.get("id") == template_id:
            merged = dict(raw_item)
            if title is not None:
                merged["title"] = title
            if body is not None:
                merged["body"] = body
            if description is not None:
                merged["description"] = description
            if category is not None:
                merged["category"] = category
            merged["updatedAt"] = _now()
            updated = _enrich_template(merged, firm_id=firm_id)
            next_items.append(
                {
                    **merged,
                    "variables": extract_variable_names(merged.get("body", "")),
                }
            )
        else:
            next_items.append(raw_item)
    if not updated:
        return None
    _write_json(path, {"templates": next_items, "updatedAt": _now()})
    return updated


def delete_template(template_id: str, firm_id: str, *, is_platform: bool) -> bool:
    existing = get_template_by_id(template_id, firm_id)
    if not existing:
        return False
    if existing["scope"] == "global":
        if not is_platform:
            return False
        items = [t for t in _load_global_raw() if t.get("id") != template_id]
        if len(items) == len(_load_global_raw()):
            return False
        _save_global_raw(items)
        return True

    path = _firm_local_path(firm_id)
    raw = _load_json(path)
    items = raw.get("templates") if isinstance(raw, dict) else []
    if not isinstance(items, list):
        return False
    next_items = [t for t in items if t.get("id") != template_id]
    if len(next_items) == len(items):
        return False
    _write_json(path, {"templates": next_items, "updatedAt": _now()})
    return True
