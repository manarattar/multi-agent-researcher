import { useState, useRef, useCallback, useEffect } from "react";
import { streamResearch, getSession } from "./api";
import QueryInput from "./components/QueryInput";
import AgentTimeline from "./components/AgentTimeline";
import ResearchReport from "./components/ResearchReport";
import HistoryPanel from "./components/HistoryPanel";
import FollowUpChat from "./components/FollowUpChat";
import Onboarding, { hasSeenTour } from "./components/Onboarding";
import ThemeToggle from "./components/ThemeToggle.jsx";

const LANDING_TOUR = "researcher.onboarded.v1";
const REPORT_TOUR = "researcher.report-tour.v1";

const LANDING_STEPS = [
  {
    target: null,
    title: "A research report with its sources attached",
    body: (
      <>
        <p>
          Ask a question and five agents work through it in order: plan, search the web, extract
          claims, fact-check them, and write the report.
        </p>
        <p style={{ marginTop: 8 }}>Every claim in the report carries a numbered footnote you can trace to its source.</p>
      </>
    ),
  },
  {
    target: "query",
    title: "Ask a question",
    body: "Any research question works best when it is specific. A run takes a minute or two and you can watch each agent as it works.",
  },
  {
    target: "examples",
    title: "Or start from an example",
    body: "Click one and it runs straight away, so you can see a full report without typing anything.",
  },
  {
    target: "history",
    title: "Your reports are kept",
    body: "Finished reports are saved here. Open one to read it again and keep asking follow-up questions.",
  },
];

const REPORT_STEPS = [
  {
    target: "summary",
    title: "The short version first",
    body: "The title and summary come first, with how confident the agents are and how many sources they used.",
  },
  {
    target: "margin",
    title: "Footnotes, with the source beside them",
    body: "Each small number in the text points to a source. The sources a section relies on are listed next to it, so you can check a claim without scrolling to the end.",
  },
  {
    target: "sources",
    title: "Every source, in full",
    body: "The reference list shows each page with how much the fact-checking agent trusted it.",
  },
  {
    target: "followup",
    title: "Keep asking",
    body: "Follow-up questions are answered from this report, so the answers stay tied to the same sources.",
  },
];

const EXAMPLES = [
  "What are the latest breakthroughs in mRNA vaccine technology?",
  "How does quantum entanglement work and what are its practical applications?",
  "What are the economic impacts of remote work on urban real estate?",
  "Compare the environmental footprint of electric vs hydrogen fuel cell vehicles",
];

// phase: 'idle' | 'researching' | 'complete' | 'error'
export default function App() {
  const [phase, setPhase] = useState("idle");
  const [events, setEvents] = useState([]);
  const [report, setReport] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tour, setTour] = useState(() => (hasSeenTour(LANDING_TOUR) ? null : "landing"));
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
      setErrorMsg("Could not load that report.");
      setPhase("error");
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

  // on phones the history list is a drawer: open it while the tour points at it
  const onTourStep = useCallback((target) => {
    setSidebarOpen(target === "history" && window.innerWidth < 768);
  }, []);

  const closeTour = useCallback(() => {
    setTour(null);
    setSidebarOpen(false);
  }, []);

  // the first finished report gets a short guide to how to read it
  useEffect(() => {
    if (phase === "complete" && !tour && !hasSeenTour(REPORT_TOUR)) setTour("report");
  }, [phase, tour]);

  const status =
    phase === "idle" ? "Ask a research question"
    : phase === "researching" ? "Agents working…"
    : phase === "complete" ? "Report ready"
    : "Something went wrong";
  const statusTone =
    phase === "researching" ? "text-accent" : phase === "complete" ? "text-ok" : phase === "error" ? "text-bad" : "text-ink-3";

  return (
    <div className="flex h-dvh overflow-hidden bg-page font-sans text-ink">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-[var(--scrim)] md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        data-tour="history"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-rule bg-rail md:relative md:w-64 md:max-w-none md:translate-x-0 ${
          tour ? "" : "transition-transform duration-200 ease-in-out"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-rule px-4 py-4">
          <div>
            <h1 className="font-serif text-[20px] font-semibold leading-none text-ink">Research Agent</h1>
            <p className="mt-1 text-[12px] text-ink-3">Reports with footnotes</p>
          </div>
          <button
            className="rounded-[4px] p-1.5 text-ink-3 hover:text-ink md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close history"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <HistoryPanel onSelect={handleSelectHistory} activeId={activeSessionId} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-rule bg-sheet px-3 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="shrink-0 rounded-[4px] border border-rule px-3 py-1.5 text-[13px] font-semibold text-ink md:hidden"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              History
            </button>
            <p className={`num truncate text-[12px] ${statusTone}`}>
              {phase === "researching" && <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent align-middle" />}
              {status}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {phase !== "idle" && (
              <button
                onClick={handleNewResearch}
                className="rounded-[4px] border border-rule px-3 py-1.5 text-[13px] font-semibold text-ink hover:border-ink-3"
              >
                New
              </button>
            )}
            <ThemeToggle />
            <button
              onClick={() => setTour(phase === "complete" ? "report" : "landing")}
              className="rounded-[4px] border border-rule px-3 py-1.5 text-[13px] font-semibold text-ink hover:border-ink-3"
            >
              How it works
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1000px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">
            {phase === "idle" && <Hero onSelect={handleResearch} />}

            {(phase === "idle" || phase === "researching") && (
              <QueryInput onSubmit={handleResearch} disabled={phase === "researching"} />
            )}

            {phase === "idle" && <Examples onSelect={handleResearch} />}

            {(phase === "researching" || phase === "complete" || phase === "error") && currentQuestion && (
              <div>
                <p className="label mb-1.5">Question</p>
                <p className="font-serif text-[22px] leading-snug text-ink sm:text-[26px]">{currentQuestion}</p>
              </div>
            )}

            {phase === "error" && (
              <div role="alert" className="rounded-[6px] border border-bad bg-bad-soft px-4 py-3 text-[14px] text-bad">
                <strong>Error:</strong> {errorMsg}
              </div>
            )}

            {phase === "researching" && events.length > 0 && <AgentTimeline events={events} />}

            {phase === "complete" && report && <ResearchReport report={report} question={currentQuestion} />}

            {phase === "complete" && activeSessionId && (
              <FollowUpChat sessionId={activeSessionId} reportSections={report?.sections ?? []} />
            )}
          </div>
        </main>
      </div>

      {tour === "landing" && (
        <Onboarding steps={LANDING_STEPS} storageKey={LANDING_TOUR} onClose={closeTour} onStep={onTourStep} />
      )}
      {tour === "report" && (
        <Onboarding steps={REPORT_STEPS} storageKey={REPORT_TOUR} onClose={closeTour} onStep={onTourStep} />
      )}
    </div>
  );
}

function Hero() {
  return (
    <div className="max-w-[40rem]">
      <h2 className="font-serif text-[34px] font-semibold leading-[1.15] text-ink sm:text-[44px]">
        Ask a question. Get a report with its footnotes.
      </h2>
      <p className="mt-3 max-w-[54ch] text-[16px] leading-relaxed text-ink-2">
        Five agents search the web, pull out the claims, check them against each other and write it up,
        with every claim tied to a numbered source.
      </p>
    </div>
  );
}

function Examples({ onSelect }) {
  return (
    <section data-tour="examples">
      <p className="label mb-2">Or try one of these</p>
      <ol className="divide-y divide-rule overflow-hidden rounded-[6px] border border-rule bg-sheet">
        {EXAMPLES.map((ex, i) => (
          <li key={i}>
            <button
              onClick={() => onSelect(ex)}
              className="grid w-full grid-cols-[28px_1fr] gap-x-2 px-4 py-3 text-left hover:bg-accent-soft"
            >
              <span className="num pt-1 text-[12px] text-ink-3">{i + 1}</span>
              <span className="font-serif text-[18px] leading-snug text-ink">{ex}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
