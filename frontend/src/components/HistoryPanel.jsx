import { useEffect, useState } from "react";
import { getHistory, deleteSession } from "../api";

const STATUS_TONE = {
  complete: "text-ok",
  processing: "text-warn",
  failed: "text-bad",
};

export default function HistoryPanel({ onSelect, activeId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await getHistory();
      setSessions(data);
    } catch {
      // history is optional: the app works without it
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // expose refresh so parent can call it after new research completes
  useEffect(() => {
    window._refreshHistory = load;
    return () => { delete window._refreshHistory; };
  }, []);

  async function handleDelete(id) {
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.session_id !== id));
  }

  return (
    <aside className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
        <h2 className="label">Past reports</h2>
        <button onClick={load} title="Refresh" aria-label="Refresh history" className="text-[14px] text-ink-3 hover:text-accent">
          ↻
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-6 text-center text-[13px] text-ink-3">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] italic text-ink-3">Finished reports are kept here.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {sessions.map((s) => {
              const active = activeId === s.session_id;
              return (
                <li key={s.session_id} className={`group flex items-start border-l-2 ${active ? "border-accent bg-accent-soft" : "border-transparent hover:bg-sheet"}`}>
                  <button onClick={() => onSelect(s)} className="min-w-0 flex-1 px-4 py-3 text-left">
                    <span className="line-clamp-2 block font-serif text-[15px] leading-snug text-ink">{s.question}</span>
                    <span className="num mt-1.5 flex items-center gap-2 text-[10.5px] text-ink-3">
                      <span className={STATUS_TONE[s.status]}>{s.status}</span>
                      {s.overall_confidence && <span>{s.overall_confidence} conf.</span>}
                      <span className="ml-auto">{formatDate(s.created_at)}</span>
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(s.session_id)}
                    aria-label="Delete this report"
                    title="Delete"
                    className="shrink-0 px-3 py-3 text-[13px] text-ink-3 hover:text-bad md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMins = Math.floor((now - d) / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString();
}
