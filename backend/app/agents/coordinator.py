from app.agents.base import call_llm, extract_json
from app.schemas import ResearchPlan

SYSTEM = (
    "You are a senior research coordinator. You decompose research questions into targeted, "
    "specific search queries that will gather the evidence needed for a thorough answer. "
    "Return only valid JSON."
)

PROMPT = """Analyze this research question and create a structured research plan.

Question: {question}

Return ONLY valid JSON:
{{
  "question_type": "factual|analytical|comparative|exploratory",
  "key_aspects": ["aspect 1", "aspect 2", "aspect 3"],
  "search_queries": [
    {{"query": "specific search query string", "purpose": "what this query will find"}},
    {{"query": "another targeted query", "purpose": "what gap this fills"}}
  ],
  "report_sections": ["Executive Summary", "section 2", "section 3", "Conclusion"]
}}

Rules:
- 2 queries for simple factual questions
- 3–4 queries for complex analytical, comparative, or exploratory questions
- Each query must cover a distinct aspect — no overlap
- Queries must be specific and targeted, not generic
- report_sections should match the question_type (e.g. comparative → include a Comparison section)"""


def create_plan(question: str) -> ResearchPlan:
    raw = call_llm(PROMPT.format(question=question), SYSTEM)
    data = extract_json(raw)
    return ResearchPlan(**data)
