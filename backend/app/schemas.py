from typing import List, Optional, Any, Dict
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Internal agent data models
# ---------------------------------------------------------------------------

class SearchResult(BaseModel):
    title: str
    url: str
    domain: str
    content: str
    score: float = 0.0


class RawClaim(BaseModel):
    claim: str
    excerpt: str
    source_url: str
    source_title: str
    relevance: float = 0.5


class VerifiedClaim(BaseModel):
    claim: str
    confidence: str           # High | Medium | Low
    supporting_urls: List[str]
    excerpt: str


class ResearchPlan(BaseModel):
    question_type: str        # factual | analytical | comparative | exploratory
    key_aspects: List[str]
    search_queries: List[Dict[str, str]]   # [{query, purpose}]
    report_sections: List[str]


class AnalysisResult(BaseModel):
    query: str
    search_results: List[SearchResult]
    claims: List[RawClaim]


# ---------------------------------------------------------------------------
# Final report models (stored + returned to frontend)
# ---------------------------------------------------------------------------

class Citation(BaseModel):
    index: int
    title: str
    url: str
    domain: str
    excerpt: str
    confidence: str


class ReportSection(BaseModel):
    heading: str
    content: str


class ResearchReport(BaseModel):
    session_id: str
    question: str
    title: str
    summary: str
    sections: List[ReportSection]
    conclusion: str
    overall_confidence: str   # High | Medium | Low
    limitations: str
    citations: List[Citation]
    created_at: str


# ---------------------------------------------------------------------------
# API request / response models
# ---------------------------------------------------------------------------

class ResearchRequest(BaseModel):
    question: str


class SessionSummary(BaseModel):
    session_id: str
    question: str
    status: str
    overall_confidence: Optional[str] = None
    created_at: str


class FollowUpRequest(BaseModel):
    question: str


class FollowUpResponse(BaseModel):
    session_id: str
    question: str
    answer: str
