from app.schemas import ResearchReport
from app.agents.base import call_llm

SYSTEM = """You are a research assistant answering follow-up questions about a completed research report.
Answer using ONLY information from the provided report and source excerpts.
If the question cannot be answered from the available material, say so directly.
Keep answers concise (2–4 paragraphs). Use [N] citation notation where relevant."""


def answer(question: str, report: ResearchReport) -> str:
    sections_text = "\n\n".join(
        f"### {s.heading}\n{s.content}" for s in report.sections
    )

    sources_text = "\n\n".join(
        f"[{c.index}] {c.title} ({c.domain})\n{c.excerpt}"
        for c in report.citations
    )

    prompt = f"""Research topic: {report.question}

Summary: {report.summary}

Report content:
{sections_text[:4000]}

Conclusion: {report.conclusion}

Source excerpts:
{sources_text[:3000]}

Follow-up question: {question}"""

    return call_llm(prompt, SYSTEM, temperature=0.3)
