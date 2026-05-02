"""MCP server for the Multi-Agent Research Assistant.

Exposes three tools to Claude Code:
  - research(question)            — run the full 5-agent pipeline
  - list_research_history()       — list past sessions
  - get_research_session(id)      — retrieve a saved report
"""

import json
import httpx
from mcp.server.fastmcp import FastMCP

BASE_URL = "http://localhost:8001"
TIMEOUT = 180  # seconds — pipeline can take a while

mcp = FastMCP(
    name="Research Agent",
    instructions=(
        "Use 'research' to investigate any factual, analytical, or comparative question. "
        "The pipeline searches the web, extracts and verifies claims, then writes a sourced report. "
        "Use 'list_research_history' to see what has already been researched. "
        "Use 'get_research_session' to retrieve a past report without re-running the pipeline."
    ),
)


@mcp.tool()
def research(question: str) -> str:
    """Run a multi-agent research pipeline on any question.

    Coordinator → Search (parallel) → Analysis → Fact-Check → Synthesis.
    Returns a fully sourced markdown report. Takes 30–90 seconds.

    Args:
        question: The research question to investigate.
    """
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            with client.stream(
                "POST",
                f"{BASE_URL}/api/research",
                json={"question": question},
            ) as response:
                response.raise_for_status()
                report = None
                for line in response.iter_lines():
                    if not line.startswith("data: "):
                        continue
                    text = line[6:].strip()
                    if not text:
                        continue
                    try:
                        data = json.loads(text)
                    except json.JSONDecodeError:
                        continue
                    if data.get("type") == "complete":
                        report = data.get("report")
                    elif data.get("type") == "error":
                        return f"Research error: {data.get('message', 'Unknown error')}"

        if not report:
            return "Research completed but produced no report."

        return _format_report(report)

    except httpx.ConnectError:
        return (
            "Cannot connect to the research backend at localhost:8001. "
            "Start it with: cd backend && uvicorn app.main:app --port 8001"
        )
    except Exception as e:
        return f"Unexpected error: {e}"


@mcp.tool()
def list_research_history() -> str:
    """List past research sessions (most recent first, up to 50).

    Returns a table of past questions, their status, confidence, and session IDs.
    Use get_research_session(session_id) to retrieve the full report for any entry.
    """
    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(f"{BASE_URL}/api/history")
            response.raise_for_status()
            sessions = response.json()
    except httpx.ConnectError:
        return "Cannot connect to research backend at localhost:8001."
    except Exception as e:
        return f"Error: {e}"

    if not sessions:
        return "No past research sessions found."

    lines = ["| # | Question | Status | Confidence | Session ID |",
             "|---|----------|--------|------------|------------|"]
    for i, s in enumerate(sessions, 1):
        q = s["question"][:60] + ("…" if len(s["question"]) > 60 else "")
        conf = s.get("overall_confidence") or "—"
        lines.append(
            f"| {i} | {q} | {s['status']} | {conf} | `{s['session_id']}` |"
        )
    return "\n".join(lines)


@mcp.tool()
def get_research_session(session_id: str) -> str:
    """Retrieve a saved research report by session ID (no re-run needed).

    Args:
        session_id: The UUID session ID from list_research_history().
    """
    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(f"{BASE_URL}/api/history/{session_id}")
            if response.status_code == 404:
                return f"Session `{session_id}` not found."
            response.raise_for_status()
            report = response.json()
    except httpx.ConnectError:
        return "Cannot connect to research backend at localhost:8001."
    except Exception as e:
        return f"Error: {e}"

    return _format_report(report)


def _format_report(report: dict) -> str:
    """Format a ResearchReport dict as clean markdown."""
    parts = []

    title = report.get("title") or f"Research: {report.get('question', '')}"
    parts.append(f"# {title}")

    meta = []
    if report.get("overall_confidence"):
        meta.append(f"**Confidence:** {report['overall_confidence']}")
    n_citations = len(report.get("citations") or [])
    if n_citations:
        meta.append(f"**Sources:** {n_citations}")
    if meta:
        parts.append("  ".join(meta))

    if report.get("summary"):
        parts.append(f"\n## Summary\n{report['summary']}")

    for section in report.get("sections") or []:
        heading = section.get("heading") or section.get("title") or "Section"
        content = section.get("content") or ""
        parts.append(f"\n## {heading}\n{content}")

    if report.get("conclusion"):
        parts.append(f"\n## Conclusion\n{report['conclusion']}")

    if report.get("limitations"):
        parts.append(f"\n> **Limitations:** {report['limitations']}")

    citations = report.get("citations") or []
    if citations:
        parts.append("\n## Sources")
        for c in citations:
            conf = f" ({c.get('confidence', '')} confidence)" if c.get("confidence") else ""
            parts.append(f"[{c['index']}] [{c['title']}]({c['url']}){conf}")

    return "\n".join(parts)


if __name__ == "__main__":
    mcp.run(transport="stdio")
