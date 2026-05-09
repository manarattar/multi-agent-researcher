import { useState, useRef, useCallback } from "react";
import { streamResearch, getSession } from "./api";
import QueryInput from "./components/QueryInput";
import AgentTimeline from "./components/AgentTimeline";
import ResearchReport from "./components/ResearchReport";
import HistoryPanel from "./components/HistoryPanel";
import FollowUpChat from "./components/FollowUpChat";

// phase: 'idle' | 'researching' | 'complete' | 'error'
export default function App() {
  const [phase, setPhase] = useState("idle");
  const [events, setEvents] = useState([]);
  const [report, setReport] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef(false);

  async function handleResearch(question) {
    abortRef.current = false;
    setPhase("researching");
    setEvents([]);
    setReport(null);
    setErrorMsg("");
    setCurrentQuestion(question);
    setActiveSessionId(null);

    await streamResearch(
      question,
      (event) => {
        if (abortRef.current) return;
        setEvents((prev) => [...prev, event]);
      },
      (finalReport) => {
        if (abortRef.current) return;
        setReport(finalReport);
        setActiveSessionId(finalReport.session_id);
        setPhase("complete");
        // refresh history sidebar
        window._refreshHistory?.();
      },
      (msg) => {
        if (abortRef.current) return;
        setErrorMsg(msg);
        setPhase("error");
      }
    );
  }

  async function handleSelectHistory(session) {
    setSidebarOpen(false);
    try {
      const full = await getSession(session.session_id);
      setReport(full);
      setCurrentQuestion(session.question);
      setActiveSessionId(session.session_id);
      setPhase("complete");
      setEvents([]);
      setErrorMsg("");
    } catch {
      alert("Could not load session.");
    }
  }

  function handleNewResearch() {
    abortRef.current = true;
    setPhase("idle");
    setEvents([]);
    setReport(null);
    setErrorMsg("");
    setCurrentQuestion("");
    setActiveSessionId(null);
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, fixed column on md+ */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}>
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-violet-700 tracking-tight">
              🔬 Research Agent
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">5-agent AI pipeline</p>
          </div>
          <button
            className="md:hidden text-gray-400 hover:text-gray-600 p-1"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <HistoryPanel onSelect={handleSelectHistory} activeId={activeSessionId} />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="px-3 sm:px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden shrink-0 p-1 rounded text-gray-500 hover:text-violet-600 transition"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Toggle history"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-sm text-gray-500 truncate">
              {phase === "idle" && "Ask any research question"}
              {phase === "researching" && (
                <span className="text-violet-600 font-medium flex items-center gap-1.5">
                  <Spinner /> Agents working…
                </span>
              )}
              {phase === "complete" && (
                <span className="text-green-600 font-medium">Research complete</span>
              )}
              {phase === "error" && (
                <span className="text-red-500 font-medium">Error occurred</span>
              )}
            </div>
          </div>
          {phase !== "idle" && (
            <button
              onClick={handleNewResearch}
              className="shrink-0 text-xs text-gray-400 hover:text-violet-600 transition"
            >
              + New
            </button>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 space-y-5">
          {/* Query input — always show when idle or researching */}
          {(phase === "idle" || phase === "researching") && (
            <QueryInput
              onSubmit={handleResearch}
              disabled={phase === "researching"}
            />
          )}

          {/* Current question banner (complete/error) */}
          {(phase === "complete" || phase === "error") && currentQuestion && (
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700">
                {currentQuestion}
              </div>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          {/* Agent timeline (during research) */}
          {phase === "researching" && events.length > 0 && (
            <AgentTimeline events={events} />
          )}

          {/* Idle placeholder */}
          {phase === "idle" && (
            <IdlePlaceholder />
          )}

          {/* Report */}
          {phase === "complete" && report && (
            <ResearchReport report={report} question={currentQuestion} />
          )}

          {/* Follow-up Q&A */}
          {phase === "complete" && activeSessionId && (
            <FollowUpChat sessionId={activeSessionId} />
          )}
        </main>
      </div>
    </div>
  );
}

function IdlePlaceholder() {
  const examples = [
    "What are the latest breakthroughs in mRNA vaccine technology?",
    "How does quantum entanglement work and what are its practical applications?",
    "What are the economic impacts of remote work on urban real estate?",
    "Compare the environmental footprint of electric vs hydrogen fuel cell vehicles",
  ];
  return (
    <div className="mt-4 text-center">
      <div className="text-4xl mb-3">🔬</div>
      <h2 className="text-lg font-semibold text-gray-700 mb-1">Multi-Agent Research Assistant</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
        Ask any question and watch 5 specialized AI agents collaborate — searching the web, extracting claims, verifying facts, and synthesizing a report in real time.
      </p>
      <div className="flex flex-col gap-2 max-w-lg mx-auto">
        {examples.map((ex, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-500 italic text-left cursor-default hover:border-violet-300 hover:text-violet-600 transition"
          >
            "{ex}"
          </div>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
