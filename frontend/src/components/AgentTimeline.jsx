const AGENTS = [
  { key: "coordinator", label: "Coordinator", desc: "Plans the research" },
  { key: "search", label: "Search", desc: "Fetches web sources" },
  { key: "analysis", label: "Analysis", desc: "Extracts the claims" },
  { key: "factcheck", label: "Fact-check", desc: "Verifies each claim" },
  { key: "synthesis", label: "Synthesis", desc: "Writes the report" },
];

const STATE_LABEL = { pending: "waiting", running: "working", complete: "done", error: "failed" };
const STATE_TONE = {
  pending: "text-ink-3",
  running: "text-accent",
  complete: "text-ok",
  error: "text-bad",
};

export default function AgentTimeline({ events }) {
  const agentState = buildAgentState(events);

  return (
    <section className="space-y-3" data-tour="pipeline">
      <h2 className="label">Five agents, in order</h2>

      <ol className="divide-y divide-rule overflow-hidden rounded-[6px] border border-rule bg-sheet">
        {AGENTS.map((agent, i) => {
          const status = agentState[agent.key]?.status ?? "pending";
          return (
            <li key={agent.key} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 px-4 py-2.5">
              <span
                className={`num flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                  status === "complete"
                    ? "border-ok bg-ok text-sheet"
                    : status === "running"
                    ? "border-accent text-accent"
                    : "border-rule text-ink-3"
                }`}
              >
                {status === "complete" ? "✓" : i + 1}
              </span>
              <div className="min-w-0">
                <p className={`text-[14.5px] font-semibold ${status === "pending" ? "text-ink-3" : "text-ink"}`}>{agent.label}</p>
                <p className="truncate text-[12.5px] text-ink-3">{agent.desc}</p>
              </div>
              <span className={`num flex items-center gap-1.5 text-[11.5px] ${STATE_TONE[status]}`}>
                {status === "running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />}
                {STATE_LABEL[status]}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-[6px] border border-rule bg-rail p-3">
        {events.length === 0 ? (
          <p className="text-[12.5px] italic text-ink-3">Waiting for the first event…</p>
        ) : (
          events.map((ev, i) => <EventRow key={i} event={ev} />)
        )}
      </div>
    </section>
  );
}

function EventRow({ event }) {
  const label = event.agent ?? event.type ?? "system";
  const tone =
    event.status === "error" ? "text-bad" : event.status === "complete" ? "text-ok" : "text-accent";
  return (
    <p className="num text-[12px] leading-relaxed text-ink-2">
      <span className={`mr-2 font-medium ${tone}`}>{label}</span>
      <span className="break-words">{event.message}</span>
    </p>
  );
}

function buildAgentState(events) {
  const state = {};
  for (const ev of events) {
    const key = ev.agent;
    if (!key) continue;
    if (!state[key]) state[key] = { status: "pending", messages: [] };
    state[key].status = ev.status ?? "running";
    state[key].messages.push(ev.message ?? "");
  }
  return state;
}
