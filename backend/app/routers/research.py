import asyncio
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db, ResearchSession
from app.schemas import ResearchRequest, ResearchReport
from app.agents import coordinator, analysis_agent, factcheck_agent, synthesis_agent
from app.services import web_search

router = APIRouter()


def _emit(event_type: str, agent: str, status: str, message: str, data: dict = None) -> str:
    payload = {"type": event_type, "agent": agent, "status": status, "message": message}
    if data:
        payload["data"] = data
    return f"data: {json.dumps(payload)}\n\n"


async def _run_pipeline(question: str, session_id: str, queue: asyncio.Queue, db: Session):
    all_search_results = []
    try:
        # ── Stage 1: Coordinator ──────────────────────────────────────────
        await queue.put(_emit("agent", "coordinator", "start", "Analyzing your research question..."))
        plan = await asyncio.to_thread(coordinator.create_plan, question)
        n_queries = len(plan.search_queries)
        await queue.put(_emit("agent", "coordinator", "complete",
                              f"Research plan ready — {n_queries} targeted search queries",
                              {"queries": [q["query"] for q in plan.search_queries],
                               "question_type": plan.question_type}))

        # ── Stage 2: Search + Analysis (parallel per query) ───────────────
        await queue.put(_emit("agent", "search", "start",
                              f"Launching {n_queries} searches in parallel..."))

        async def search_and_analyze(query_info: dict):
            query = query_info["query"]
            # Search
            await queue.put(_emit("agent", "search", "running",
                                  f'Searching: "{query}"...', {"query": query}))
            results = await asyncio.to_thread(web_search.search, query, 5)
            all_search_results.extend(results)
            await queue.put(_emit("agent", "search", "result",
                                  f'Found {len(results)} sources for "{query}"',
                                  {"query": query, "count": len(results)}))

            # Analysis
            await queue.put(_emit("agent", "analysis", "running",
                                  f'Extracting claims from "{query}" results...',
                                  {"query": query}))
            claims = await asyncio.to_thread(analysis_agent.extract_claims, query, results)
            await queue.put(_emit("agent", "analysis", "result",
                                  f'Extracted {len(claims)} claims from "{query}"',
                                  {"query": query, "count": len(claims)}))
            return claims

        tasks = [search_and_analyze(q) for q in plan.search_queries]
        per_query_claims = await asyncio.gather(*tasks)
        all_claims = [c for batch in per_query_claims for c in batch]

        # ── Stage 3: Fact-check ───────────────────────────────────────────
        await queue.put(_emit("agent", "factcheck", "start",
                              f"Cross-referencing {len(all_claims)} claims across sources..."))
        verified = await asyncio.to_thread(factcheck_agent.verify, all_claims)
        high = sum(1 for v in verified if v.confidence == "High")
        med = sum(1 for v in verified if v.confidence == "Medium")
        await queue.put(_emit("agent", "factcheck", "complete",
                              f"Verified {len(verified)} claims — {high} high, {med} medium confidence",
                              {"high": high, "medium": med, "low": len(verified) - high - med}))

        # ── Stage 4: Synthesis ────────────────────────────────────────────
        await queue.put(_emit("agent", "synthesis", "start",
                              "Writing research report with citations..."))
        report: ResearchReport = await asyncio.to_thread(
            synthesis_agent.synthesize,
            question, verified, all_search_results, plan.report_sections, session_id,
        )
        await queue.put(_emit("agent", "synthesis", "complete",
                              f"Report complete — {len(report.sections)} sections, "
                              f"{len(report.citations)} sources, "
                              f"{report.overall_confidence} overall confidence"))

        # ── Persist ───────────────────────────────────────────────────────
        row = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
        if row:
            row.status = "complete"
            row.report_json = report.model_dump_json()
            db.commit()

        # ── Final event ───────────────────────────────────────────────────
        await queue.put(f"data: {json.dumps({'type': 'complete', 'report': report.model_dump()})}\n\n")

    except Exception as e:
        row = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
        if row:
            row.status = "failed"
            row.error_message = str(e)
            db.commit()
        await queue.put(f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n")

    finally:
        await queue.put(None)  # sentinel


@router.post("/research")
async def run_research(request: ResearchRequest, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    row = ResearchSession(
        id=session_id,
        question=request.question,
        status="processing",
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    db.commit()

    queue: asyncio.Queue = asyncio.Queue()

    async def generate():
        task = asyncio.create_task(_run_pipeline(request.question, session_id, queue, db))
        try:
            while True:
                event = await asyncio.wait_for(queue.get(), timeout=120.0)
                if event is None:
                    break
                yield event
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Research timed out after 2 minutes'})}\n\n"
        await task

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
