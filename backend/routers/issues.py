from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from database import get_db

router = APIRouter()


class IssueCreate(BaseModel):
    file_id: str
    page_index: int
    x: float
    y: float
    comment: Optional[str] = None
    status: Optional[str] = "open"


class IssueUpdate(BaseModel):
    status: Optional[str] = None
    comment: Optional[str] = None


class IssueOut(BaseModel):
    id: int
    file_id: str
    page_index: int
    x: float
    y: float
    status: str
    comment: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True


@router.post("/", response_model=IssueOut)
def create_issue(payload: IssueCreate, db: Session = Depends(get_db)):
    issue = models.Issue(
        file_id=payload.file_id,
        page_index=payload.page_index,
        x=payload.x,
        y=payload.y,
        status=payload.status or "open",
        comment=payload.comment,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


@router.get("/{file_id}", response_model=List[IssueOut])
def list_issues(file_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.Issue)
        .filter(models.Issue.file_id == file_id)
        .order_by(models.Issue.created_at.desc())
        .all()
    )


@router.patch("/{issue_id}", response_model=IssueOut)
def update_issue(
    issue_id: int,
    payload: IssueUpdate,
    db: Session = Depends(get_db),
):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if payload.status is not None:
        issue.status = payload.status
    if payload.comment is not None:
        issue.comment = payload.comment

    db.commit()
    db.refresh(issue)
    return issue


@router.delete("/{issue_id}")
def delete_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    db.delete(issue)
    db.commit()
    return {"deleted": True}
