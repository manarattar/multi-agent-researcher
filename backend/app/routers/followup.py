import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db, ResearchSession
from app.schemas import FollowUpRequest, FollowUpResponse, ResearchReport
from app.agents import followup_agent

router = APIRouter()


@router.post("/followup/{session_id}", response_model=FollowUpResponse)
def ask_followup(
    session_id: str,
    request: FollowUpRequest,
    db: Session = Depends(get_db),
):
    row = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    if not row:
        raise HTTPException(404, "Research session not found")
    if not row.report_json:
        raise HTTPException(400, "Report not available for this session")

    report = ResearchReport.model_validate(json.loads(row.report_json))
    answer = followup_agent.answer(request.question, report)

    return FollowUpResponse(
        session_id=session_id,
        question=request.question,
        answer=answer,
    )
