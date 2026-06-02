"""PDF 上への注釈描画（/api/highlight と merge で共有）。"""

from __future__ import annotations

import json
from typing import Any, List, Optional

import fitz


def parse_norm_path_json(path_json: Optional[str]) -> Optional[List[dict[str, float]]]:
    if not path_json or not str(path_json).strip():
        return None
    try:
        raw = json.loads(path_json)
    except (json.JSONDecodeError, TypeError):
        return None
    if not isinstance(raw, list) or len(raw) < 1:
        return None
    out: List[dict[str, float]] = []
    for p in raw:
        if not isinstance(p, dict):
            continue
        if "x" not in p or "y" not in p:
            continue
        out.append({"x": float(p["x"]), "y": float(p["y"])})
    return out or None


def marker_stroke_width(page: fitz.Page) -> float:
    return max(page.rect.width, page.rect.height) * 0.012


def path_to_fitz_points(page: fitz.Page, path: List[dict[str, float]]) -> List[fitz.Point]:
    pw, ph = page.rect.width, page.rect.height
    return [fitz.Point(p["x"] * pw, p["y"] * ph) for p in path]


def draw_freehand_marker(page: fitz.Page, path: List[dict[str, float]]) -> None:
    """蛍光ペン風の半透明ストローク（矩形ハイライト注釈ではなく線のみ）。"""
    w = marker_stroke_width(page)
    pts = path_to_fitz_points(page, path)
    if len(pts) == 1:
        page.draw_circle(pts[0], w * 0.45, color=(1, 1, 0), fill=(1, 1, 0), fill_opacity=0.4)
        return
    page.draw_polyline(
        pts,
        color=(1, 1, 0),
        fill=(1, 1, 0),
        width=w,
        fill_opacity=0.4,
        closePath=False,
        lineCap=1,
    )


def draw_freehand_eraser(page: fitz.Page, path: List[dict[str, float]]) -> None:
    """ストローク上を白で上書き（焼き付け消去）。"""
    w = marker_stroke_width(page) * 1.15
    pts = path_to_fitz_points(page, path)
    if len(pts) == 1:
        page.draw_circle(
            pts[0],
            w * 0.5,
            color=(1, 1, 1),
            fill=(1, 1, 1),
            overlay=True,
        )
        return
    page.draw_polyline(
        pts,
        color=(1, 1, 1),
        fill=(1, 1, 1),
        width=w,
        closePath=False,
        lineCap=1,
        overlay=True,
    )


def path_bbox_rect(page: fitz.Page, path: List[dict[str, float]], pad_ratio: float = 0.008) -> fitz.Rect:
    pw, ph = page.rect.width, page.rect.height
    xs = [p["x"] * pw for p in path]
    ys = [p["y"] * ph for p in path]
    pad = max(pw, ph) * pad_ratio
    return fitz.Rect(min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad)


def delete_annots_intersecting(page: fitz.Page, rect: fitz.Rect) -> None:
    for annot in list(page.annots() or []):
        try:
            if annot.rect.intersects(rect):
                page.delete_annot(annot)
        except Exception:
            pass
