from typing import List
from app.agents.base import call_llm, extract_json
from app.schemas import VerifiedClaim, SearchResult, ReportSection, Citation, ResearchReport
from datetime import datetime, timezone

SYSTEM = (
    "You are a senior research writer. You synthesize evidence into clear, well-structured "
    "reports. You cite sources using [N] notation, clearly distinguish high-confidence facts "
    "from uncertain claims, and write for an intelligent non-specialist audience. "
    "Return only valid JSON."
)

PROMPT = """Write a research report answering this question based on the verified claims and sources.

Question: {question}
Report sections to include: {sections}

Verified claims (with confidence):
{claims_text}

Available citations:
{citations_text}

Return ONLY valid JSON:
{{
  "title": "Research Report: [concise title]",
  "summary": "2–3 sentence executive summary of the key findings",
  "sections": [
    {{
      "heading": "section heading",
      "content": "section content — use [N] for inline citations (e.g. 'GDP grew 3.2% in 2023 [1]')"
    }}
  ],
  "conclusion": "1–2 paragraph conclusion",
  "overall_confidence": "High|Medium|Low",
  "limitations": "honest 1–2 sentence assessment of research limitations"
}}

Rules:
- Use [N] citation numbers that match the citation list
- Lead each section with the most confident claims
- Flag Low-confidence claims with language like "some sources suggest..." or "it is unclear whether..."
- Do not fabricate facts not in the claims list
- Write in clear, professional prose"""


def synthesize(
    question: str,
    verified_claims: List[VerifiedClaim],
    all_results: List[SearchResult],
    section_names: List[str],
    session_id: str,
) -> ResearchReport:
    # Build deduplicated citation list from all sources
    seen_urls = set()
    citations: List[Citation] = []
    for result in all_results:
        if result.url not in seen_urls:
            seen_urls.add(result.url)
            citations.append(Citation(
                index=len(citations) + 1,
                title=result.title,
                url=result.url,
                domain=result.domain,
                excerpt=result.content[:200],
                confidence="Medium",
            ))

    # Update citation confidence from verified claims
    url_confidence = {}
    for vc in verified_claims:
        for url in vc.supporting_urls:
            if vc.confidence == "High" or url_confidence.get(url) != "High":
                url_confidence[url] = vc.confidence
    for c in citations:
        c.confidence = url_confidence.get(c.url, "Medium")

    claims_text = "\n".join(
        f"[{vc.confidence}] {vc.claim} (sources: {', '.join(vc.supporting_urls[:2])})"
        for vc in verified_claims
    )
    citations_text = "\n".join(
        f"[{c.index}] {c.title} — {c.url}"
        for c in citations
    )

    raw = call_llm(PROMPT.format(
        question=question,
        sections=", ".join(section_names),
        claims_text=claims_text or "No claims available.",
        citations_text=citations_text or "No sources available.",
    ), SYSTEM, temperature=0.4)

    data = extract_json(raw)
    sections = [ReportSection(**s) for s in data.get("sections", [])]

    return ResearchReport(
        session_id=session_id,
        question=question,
        title=data.get("title", f"Research Report: {question}"),
        summary=data.get("summary", ""),
        sections=sections,
        conclusion=data.get("conclusion", ""),
        overall_confidence=data.get("overall_confidence", "Medium"),
        limitations=data.get("limitations", ""),
        citations=citations,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
