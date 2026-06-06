from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.schemas import QueryLogEntry
from app.models.query_log import QueryLog

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/", response_model=List[QueryLogEntry])
def get_history(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0),
    db: Session = Depends(get_db),
):
    """Return query history sorted by most recent first."""
    logs = (
        db.query(QueryLog)
        .order_by(QueryLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return logs


@router.get("/{session_id}", response_model=List[QueryLogEntry])
def get_session_history(session_id: str, db: Session = Depends(get_db)):
    """Return all queries for a specific session."""
    logs = (
        db.query(QueryLog)
        .filter(QueryLog.session_id == session_id)
        .order_by(QueryLog.created_at.asc())
        .all()
    )
    return logs


@router.delete("/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    """Delete a specific query log entry."""
    log = db.query(QueryLog).filter(QueryLog.id == log_id).first()
    if log:
        db.delete(log)
        db.commit()
    return {"deleted": log_id}
