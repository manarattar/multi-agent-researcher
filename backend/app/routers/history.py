import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db, ResearchSession
from app.schemas import SessionSummary, ResearchReport

router = APIRouter()


@router.get("/history", response_model=List[SessionSummary])
def list_sessions(db: Session = Depends(get_db)):
    rows = db.query(ResearchSession).order_by(ResearchSession.created_at.desc()).limit(50).all()
    result = []
    for row in rows:
        confidence = None
        if row.report_json:
            try:
                confidence = json.loads(row.report_json).get("overall_confidence")
            except Exception:
                pass
        result.append(SessionSummary(
            session_id=row.id,
            question=row.question,
            status=row.status,
            overall_confidence=confidence,
            created_at=row.created_at.isoformat(),
        ))
    return result


@router.get("/history/{session_id}", response_model=ResearchReport)
def get_session(session_id: str, db: Session = Depends(get_db)):
    row = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    if not row:
        raise HTTPException(404, "Session not found")
    if not row.report_json:
        raise HTTPException(404, "Report not yet available")
    return ResearchReport(**json.loads(row.report_json))


@router.delete("/history/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    row = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    if not row:
        raise HTTPException(404, "Session not found")
    db.delete(row)
    db.commit()
    return {"deleted": session_id}
