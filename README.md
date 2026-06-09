# Multi-Agent Research Assistant

**A multi-agent AI system that researches any topic using live web sources, fact-checks claims, and synthesizes a structured report — streamed in real time.**

---

## What it does

Enter any research question. Five specialized agents collaborate:

1. **Coordinator** — breaks the query into sub-questions and plans the research
2. **Analysis Agent** — searches the web (Tavily) and extracts key findings per sub-question
3. **Fact-Check Agent** — verifies claims against additional sources
4. **Synthesis Agent** — assembles all findings into a structured report with citations
5. **Follow-up Agent** — suggests related questions based on the findings

Results stream live via SSE as each agent completes its work.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy, SSE streaming |
| LLM | OpenAI gpt-4o-mini |
| Web search | Tavily API |
| Database | SQLite |
| Frontend | React + Vite |
| Deployment | Render (backend + frontend) |

---

## Running locally

### Prerequisites
- Python 3.11+
- Node 18+
- An OpenAI API key (`sk-...`)
- A Tavily API key (free tier at [tavily.com](https://tavily.com))

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env   # then fill in your keys
uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
# Create frontend/.env.local:
# VITE_API_URL=http://localhost:8001
npm run dev
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `OPENAI_BASE_URL` | API base URL (default: `https://api.openai.com/v1`) |
| `MODEL_NAME` | Model to use (default: `gpt-4o-mini`) |
| `TAVILY_API_KEY` | Tavily web search API key |
| `CORS_ORIGINS` | Allowed origins (default: `*`) |

See `.env.example` for a ready-to-fill template.

---

## Author

**Manar Attar** — [LinkedIn](https://linkedin.com/in/manarattar) · [GitHub](https://github.com/manarattar)
