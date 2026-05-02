import { useState } from "react";

export default function QueryInput({ onSubmit, disabled }) {
  const [question, setQuestion] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || disabled) return;
    onSubmit(q);
    setQuestion("");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Ask a research question… (e.g. What are the latest advances in quantum computing?)"
          disabled={disabled}
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-28 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !question.trim()}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {disabled ? (
            <>
              <Spinner />
              Researching
            </>
          ) : (
            "Research"
          )}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-gray-400">
        Press Enter to submit · Shift+Enter for new line
      </p>
    </form>
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
