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
    <form onSubmit={handleSubmit} className="w-full" data-tour="query">
      <label htmlFor="question" className="label mb-2 block">Your question</label>
      <textarea
        id="question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder="e.g. How do heat pumps compare with gas boilers in cold climates?"
        disabled={disabled}
        rows={3}
        className="w-full resize-none rounded-[6px] border border-rule bg-sheet px-4 py-3 font-serif text-[18px] leading-snug text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none disabled:opacity-50"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="hidden text-[12.5px] text-ink-3 sm:block">Enter to submit · Shift+Enter for a new line</p>
        <button
          type="submit"
          disabled={disabled || !question.trim()}
          className="ml-auto rounded-[6px] bg-accent px-5 py-2.5 text-[14px] font-semibold text-[var(--tour-on-accent)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {disabled ? "Researching…" : "Research"}
        </button>
      </div>
    </form>
  );
}
