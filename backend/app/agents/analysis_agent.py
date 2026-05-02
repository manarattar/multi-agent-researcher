from typing import List
from app.agents.base import call_llm, extract_json
from app.schemas import SearchResult, RawClaim

SYSTEM = (
    "You are a research analyst. You extract precise, verifiable claims from source material. "
    "You never fabricate — only extract what is explicitly stated in the sources. "
    "Return only valid JSON."
)

PROMPT = """Extract key claims from these search results relevant to the research query.

Research query: {query}

Search results:
{results_text}

Return ONLY a JSON array of claims:
[
  {{
    "claim": "a specific, verifiable factual claim from the sources",
    "excerpt": "the exact or near-exact quote supporting this claim (max 200 chars)",
    "source_url": "the URL this claim comes from",
    "source_title": "the title of the source",
    "relevance": <float 0.0-1.0 — how relevant to the query>
  }}
]

Rules:
- Extract 3–6 of the most relevant claims
- Only include claims directly supported by the source text
- Prefer specific facts, statistics, dates, and named entities over vague statements
- Return [] if no relevant claims can be extracted"""


def extract_claims(query: str, results: List[SearchResult]) -> List[RawClaim]:
    if not results:
        return []
    results_text = "\n\n".join(
        f"[Source: {r.title}]\nURL: {r.url}\n{r.content[:800]}"
        for r in results
    )
    raw = call_llm(PROMPT.format(query=query, results_text=results_text), SYSTEM)
    data = extract_json(raw)
    if not isinstance(data, list):
        return []
    claims = []
    for item in data:
        try:
            claims.append(RawClaim(**item))
        except Exception:
            continue
    return claims
