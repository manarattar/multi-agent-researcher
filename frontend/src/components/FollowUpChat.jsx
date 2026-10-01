import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { askFollowUp } from "../api";

export default function FollowUpChat({ sessionId, reportSections = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const suggestions = reportSections
    .slice(0, 4)
    .map((s) => `Tell me more about: ${s.heading ?? s.title}`)
    .filter(Boolean);

  useEffect(() => {
    if (messages.length > 0 || loading) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const data = await askFollowUp(sessionId, q);
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, could not get an answer. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[6px] border border-rule bg-sheet" data-tour="followup">
      <div className="flex flex-wrap items-baseline gap-x-3 border-b border-rule px-5 py-3">
        <h3 className="font-serif text-[18px] font-semibold text-ink">Ask about this report</h3>
        <span className="text-[12.5px] text-ink-3">Answers come from the report, not the open web.</span>
      </div>

      {messages.length === 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pt-4">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setInput(s)}
              disabled={loading}
              className="rounded-[4px] border border-rule px-3 py-1.5 text-left text-[13px] text-ink-2 hover:border-accent hover:text-accent disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="max-h-96 space-y-4 overflow-y-auto px-5 py-4">
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <p key={i} className="ml-auto max-w-[85%] rounded-[6px] bg-accent px-3.5 py-2.5 text-[14.5px] leading-relaxed text-[var(--tour-on-accent)]">
                {msg.text}
              </p>
            ) : (
              <div key={i} className="max-w-[92%] border-l-2 border-accent pl-3.5">
                <div className="paper small">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            )
          )}
          {loading && <p className="num border-l-2 border-accent pl-3.5 text-[12px] text-ink-3">reading the report…</p>}
          <div ref={bottomRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className={`flex gap-2 px-4 py-3 ${messages.length > 0 ? "border-t border-rule" : ""}`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this report…"
          aria-label="Follow-up question"
          disabled={loading}
          className="min-w-0 flex-1 rounded-[6px] border border-rule bg-page px-3.5 py-2 text-[15px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="rounded-[6px] bg-accent px-4 py-2 text-[14px] font-semibold text-[var(--tour-on-accent)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </section>
  );
}
