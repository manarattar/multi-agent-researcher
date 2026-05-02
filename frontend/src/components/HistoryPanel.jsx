import { useEffect, useState } from "react";
import { getHistory, deleteSession } from "../api";

const RISK_COLOR = {
  complete: "bg-green-100 text-green-700",
  processing: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-600",
};

export default function HistoryPanel({ onSelect, activeId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await getHistory();
      setSessions(data);
    } catch {
      // silently ignore
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

  async function handleDelete(e, id) {
    e.stopPropagation();
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.session_id !== id));
  }

  return (
    <aside className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">History</h2>
        <button
          onClick={load}
          title="Refresh"
          className="text-gray-400 hover:text-violet-600 text-xs"
        >
          ↻
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-6 text-xs text-gray-400 text-center">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="px-4 py-6 text-xs text-gray-400 text-center italic">
            No past sessions yet
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {sessions.map((s) => (
              <li
                key={s.session_id}
                onClick={() => onSelect(s)}
                className={`group cursor-pointer px-4 py-3 hover:bg-gray-50 transition ${
                  activeId === s.session_id ? "bg-violet-50 border-l-2 border-violet-400" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs text-gray-700 line-clamp-2 flex-1">{s.question}</p>
                  <button
                    onClick={(e) => handleDelete(e, s.session_id)}
                    className="hidden group-hover:block shrink-0 text-gray-300 hover:text-red-400 text-xs ml-1"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      RISK_COLOR[s.status] ?? "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.status}
                  </span>
                  {s.overall_confidence && (
                    <span className="text-[10px] text-gray-400">
                      {s.overall_confidence} conf.
                    </span>
                  )}
                  <span className="text-[10px] text-gray-300 ml-auto">
                    {formatDate(s.created_at)}
                  </span>
                </div>
              </li>
            ))}
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
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString();
}
