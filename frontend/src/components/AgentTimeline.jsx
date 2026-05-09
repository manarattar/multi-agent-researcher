const AGENTS = [
  { key: "coordinator", label: "Coordinator", icon: "🗂️", desc: "Plans research strategy" },
  { key: "search", label: "Search", icon: "🔍", desc: "Fetches web sources" },
  { key: "analysis", label: "Analysis", icon: "🧠", desc: "Extracts key claims" },
  { key: "factcheck", label: "Fact-Check", icon: "✅", desc: "Verifies claims" },
  { key: "synthesis", label: "Synthesis", icon: "✍️", desc: "Writes the report" },
];

const STATUS_STYLE = {
  pending: "border-gray-200 bg-gray-50 text-gray-400",
  running: "border-violet-300 bg-violet-50 text-violet-700",
  complete: "border-green-300 bg-green-50 text-green-700",
  error: "border-red-300 bg-red-50 text-red-600",
};

export default function AgentTimeline({ events }) {
  const agentState = buildAgentState(events);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Agent Pipeline
      </h2>

      {/* Agent cards row — horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
        <div className="grid grid-cols-5 gap-2" style={{ minWidth: "360px" }}>
          {AGENTS.map((agent, i) => {
            const state = agentState[agent.key] ?? { status: "pending", messages: [] };
            const style = STATUS_STYLE[state.status] ?? STATUS_STYLE.pending;
            return (
              <div
                key={agent.key}
                className={`relative rounded-xl border-2 p-2 sm:p-3 transition-all ${style}`}
              >
                {/* connector line */}
                {i < AGENTS.length - 1 && (
                  <div className="absolute -right-[9px] top-1/2 z-10 -translate-y-1/2 text-gray-300 text-xs">→</div>
                )}
                <div className="text-lg sm:text-xl mb-1">{agent.icon}</div>
                <div className="font-semibold text-xs">{agent.label}</div>
                <div className="text-xs opacity-70 mt-0.5 hidden sm:block">{agent.desc}</div>
                <StatusDot status={state.status} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Event feed */}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1.5">
        {events.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Waiting for events…</p>
        ) : (
          events.map((ev, i) => <EventRow key={i} event={ev} />)
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  if (status === "running") {
    return (
      <span className="absolute top-2 right-2 flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
      </span>
    );
  }
  if (status === "complete") {
    return <span className="absolute top-2 right-2 text-xs text-green-500">✓</span>;
  }
  if (status === "error") {
    return <span className="absolute top-2 right-2 text-xs text-red-500">✗</span>;
  }
  return null;
}

function EventRow({ event }) {
  const label = event.agent ?? event.type ?? "system";
  const icon = AGENTS.find((a) => a.key === label)?.icon ?? "⚙️";
  const colorClass =
    event.status === "error"
      ? "text-red-500"
      : event.status === "complete"
      ? "text-green-600"
      : "text-violet-600";

  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="shrink-0">{icon}</span>
      <span className={`font-medium shrink-0 ${colorClass}`}>{label}</span>
      <span className="text-gray-600 break-all">{event.message}</span>
    </div>
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
