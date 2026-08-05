import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { askFollowUp } from "../api";
import Icon from "./Icon";

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="rounded-xl border border-violet-100 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-violet-100 bg-violet-50 flex items-center gap-2">
        <Icon name="message" size={16} className="text-violet-600" />
        <h3 className="text-sm font-semibold text-violet-800">Ask follow-up questions</h3>
        <span className="text-xs text-violet-400 ml-auto">Answers grounded in report</span>
      </div>

      {/* Suggested questions — shown only before first message */}
      {messages.length === 0 && suggestions.length > 0 && (
        <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setInput(s); }}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:border-violet-400 transition disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Message list */}
      {messages.length > 0 && (
        <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5 text-violet-600">
                  <Icon name="flask" size={13} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-gray-50 border border-gray-200 text-gray-800"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:text-gray-800">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white shrink-0 mt-0.5">
                  U
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5 text-violet-600">
                <Icon name="flask" size={13} />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                <ThinkingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className={`flex gap-2 px-3 py-3 ${messages.length > 0 ? "border-t border-gray-100" : ""}`}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this report…"
          disabled={loading}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
