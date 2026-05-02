from typing import List
from app.agents.base import call_llm, extract_json
from app.schemas import RawClaim, VerifiedClaim

SYSTEM = (
    "You are a fact-checking analyst. You assess confidence in research claims based on "
    "how many independent sources corroborate them and whether sources contradict each other. "
    "Return only valid JSON."
)

PROMPT = """Cross-reference these research claims and assign confidence scores.

Claims collected from multiple sources:
{claims_text}

For each unique claim (merge near-duplicates), assess confidence:
- High: claim appears in 2+ independent sources and no sources contradict it
- Medium: claim appears in 1 source, or sources partially agree
- Low: claim is uncertain, speculative, or contradicted by another source

Return ONLY a JSON array:
[
  {{
    "claim": "the claim, cleaned and deduplicated",
    "confidence": "High|Medium|Low",
    "supporting_urls": ["url1", "url2"],
    "excerpt": "the best supporting excerpt (max 200 chars)"
  }}
]

Rules:
- Merge near-identical claims into one
- Keep the most specific version of duplicate claims
- Return at most 12 verified claims
- Order by confidence (High first) then relevance"""


def verify(all_claims: List[RawClaim]) -> List[VerifiedClaim]:
    if not all_claims:
        return []
    claims_text = "\n\n".join(
        f"Claim: {c.claim}\nSource: {c.source_url}\nExcerpt: {c.excerpt}\nRelevance: {c.relevance}"
        for c in all_claims
    )
    raw = call_llm(PROMPT.format(claims_text=claims_text), SYSTEM)
    data = extract_json(raw)
    if not isinstance(data, list):
        return []
    verified = []
    for item in data:
        try:
            verified.append(VerifiedClaim(**item))
        except Exception:
            continue
    return verified
