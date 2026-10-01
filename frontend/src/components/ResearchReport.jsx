import { useState } from "react";
import ReactMarkdown from "react-markdown";
import CitationCard from "./CitationCard";

const CONFIDENCE_TONE = {
  High: "text-ok",
  Medium: "text-warn",
  Low: "text-bad",
};

/** Citation numbers used in a piece of text, in order of first appearance. */
function citedIndices(text) {
  const seen = [];
  for (const m of (text ?? "").matchAll(/\[(\d+)\]/g)) {
    const n = Number(m[1]);
    if (!seen.includes(n)) seen.push(n);
  }
  return seen;
}

export default function ResearchReport({ report }) {
  if (!report) return null;

  const citations = report.citations ?? [];
  const byIndex = new Map(citations.map((c) => [Number(c.index), c]));
  const confTone = CONFIDENCE_TONE[report.overall_confidence] ?? "text-ink-2";

  return (
    <article className="space-y-6">
      <div className="rounded-[6px] border border-rule bg-sheet px-5 py-6 sm:px-8 sm:py-8" data-tour="report">
        <header className="max-w-[62ch]" data-tour="summary">
          <p className="label mb-2">Research report</p>
          <h2 className="font-serif text-[28px] font-semibold leading-[1.2] text-ink sm:text-[34px]">
            {report.title ?? report.question}
          </h2>
          {report.summary && (
            <p className="mt-3 font-serif text-[19px] italic leading-relaxed text-ink-2">{report.summary}</p>
          )}
          <p className="num mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-3">
            <span>
              confidence <span className={`font-medium ${confTone}`}>{report.overall_confidence}</span>
            </span>
            <span>
              sources <span className="font-medium text-ink">{citations.length}</span>
            </span>
          </p>
        </header>

        <div className="mt-8 divide-y divide-rule border-t border-rule">
          {(report.sections ?? []).map((section, i) => (
            <Section key={i} section={section} byIndex={byIndex} first={i === 0} />
          ))}
        </div>

        {report.conclusion && (
          <div className="mt-2 border-t border-rule pt-6">
            <h3 className="label mb-3">Conclusion</h3>
            <div className="paper">
              <SectionContent content={report.conclusion} byIndex={byIndex} />
            </div>
          </div>
        )}

        {report.limitations && (
          <p className="mt-8 max-w-[62ch] rounded-[4px] bg-warn-soft px-4 py-3 text-[13.5px] leading-relaxed text-warn">
            <span className="font-semibold">Limitations. </span>
            {report.limitations}
          </p>
        )}
      </div>

      {citations.length > 0 && (
        <section className="rounded-[6px] border border-rule bg-sheet px-5 py-5 sm:px-8" data-tour="sources">
          <h3 className="label mb-3">References ({citations.length})</h3>
          <ol className="divide-y divide-rule">
            {citations.map((c) => (
              <CitationCard key={c.index} citation={c} />
            ))}
          </ol>
        </section>
      )}

      <FeedbackBar context={{ question: report.question, session_id: report.session_id }} />
    </article>
  );
}

function Section({ section, byIndex, first }) {
  const notes = citedIndices(section.content)
    .map((n) => byIndex.get(n))
    .filter(Boolean);

  return (
    <section className="grid gap-x-10 gap-y-4 py-6 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div>
        <h3 className="mb-3 font-serif text-[22px] font-semibold leading-snug text-ink">
          {section.heading ?? section.title}
        </h3>
        <div className="paper">
          <SectionContent content={section.content} byIndex={byIndex} />
        </div>
      </div>

      {notes.length > 0 && (
        <aside
          data-tour={first ? "margin" : undefined}
          aria-label="Sources cited in this section"
          className="border-t border-rule pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-1"
        >
          <p className="label mb-2">Cited here</p>
          <ul className="space-y-3">
            {notes.map((c) => (
              <li key={c.index} className="grid grid-cols-[auto_1fr] gap-x-2 text-[13px] leading-snug">
                <span className="num pt-px text-[11.5px] font-medium text-accent">[{c.index}]</span>
                <div className="min-w-0">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-2 break-words font-semibold text-ink hover:text-accent hover:underline"
                  >
                    {c.title || c.url}
                  </a>
                  {c.domain && <p className="num mt-0.5 text-[11px] text-ink-3">{c.domain}</p>}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </section>
  );
}

function FeedbackBar({ context }) {
  const [rating, setRating] = useState(null);

  function submit(value) {
    setRating(value);
    try {
      const log = JSON.parse(localStorage.getItem("researcher_feedback") || "[]");
      log.push({ ...context, rating: value, timestamp: new Date().toISOString() });
      localStorage.setItem("researcher_feedback", JSON.stringify(log));
    } catch {
      // storage blocked: the thank-you still shows
    }
  }

  return (
    <div className="flex items-center gap-3 px-1 text-[13px] text-ink-3">
      <span>Was this report useful?</span>
      {rating === null ? (
        <>
          <button onClick={() => submit("up")} className="rounded-[4px] border border-rule px-3 py-1 font-semibold text-ink-2 hover:border-ok hover:text-ok">
            Yes
          </button>
          <button onClick={() => submit("down")} className="rounded-[4px] border border-rule px-3 py-1 font-semibold text-ink-2 hover:border-bad hover:text-bad">
            No
          </button>
        </>
      ) : (
        <span className="font-semibold text-accent">{rating === "up" ? "Thanks." : "Thanks, noted."}</span>
      )}
    </div>
  );
}

function SectionContent({ content, byIndex }) {
  if (!content) return null;
  const withNotes = (children) => injectCitationBadges(children, byIndex);
  return (
    <ReactMarkdown
      components={{
        p({ children }) {
          return <p>{withNotes(children)}</p>;
        },
        li({ children }) {
          return <li>{withNotes(children)}</li>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function injectCitationBadges(children, byIndex) {
  if (!children) return children;
  if (typeof children === "string") return parseCitationString(children, byIndex);
  if (Array.isArray(children)) {
    return children.map((c, i) =>
      typeof c === "string" ? <span key={i}>{parseCitationString(c, byIndex)}</span> : c
    );
  }
  return children;
}

function parseCitationString(text, byIndex) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m) {
      const c = byIndex?.get(Number(m[1]));
      return (
        <sup key={i} className="fn" title={c ? `${c.title || c.url}${c.domain ? " (" + c.domain + ")" : ""}` : `Source ${m[1]}`}>
          {m[1]}
        </sup>
      );
    }
    return part;
  });
}
