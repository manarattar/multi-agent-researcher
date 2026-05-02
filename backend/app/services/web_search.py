from urllib.parse import urlparse
from typing import List
from tavily import TavilyClient
from app.config import get_settings
from app.schemas import SearchResult


def search(query: str, max_results: int = 5) -> List[SearchResult]:
    settings = get_settings()
    client = TavilyClient(api_key=settings.tavily_api_key)
    response = client.search(
        query=query,
        max_results=max_results,
        search_depth="advanced",
        include_raw_content=False,
    )
    results = []
    for r in response.get("results", []):
        url = r.get("url", "")
        domain = urlparse(url).netloc.removeprefix("www.")
        results.append(SearchResult(
            title=r.get("title", "Untitled"),
            url=url,
            domain=domain,
            content=r.get("content", ""),
            score=float(r.get("score", 0.5)),
        ))
    return results
