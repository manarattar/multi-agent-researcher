import ReactMarkdown from "react-markdown";
import CitationCard from "./CitationCard";

const CONFIDENCE_COLOR = {
  High: "text-green-600",
  Medium: "text-yellow-600",
  Low: "text-red-500",
};

export default function ResearchReport({ report }) {
  if (!report) return null;

  const confColor = CONFIDENCE_COLOR[report.overall_confidence] ?? "text-gray-600";

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
        <h2 className="text-lg font-bold text-violet-900 mb-1">{report.title ?? report.question}</h2>
        {report.summary && (
          <p className="text-sm text-violet-800 leading-relaxed">{report.summary}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-violet-700">
          <span>
            Confidence:{" "}
            <span className={`font-semibold ${confColor}`}>{report.overall_confidence}</span>
          </span>
          <span>Sources: <span className="font-semibold">{report.citations?.length ?? 0}</span></span>
        </div>
      </div>

      {/* Report sections */}
      <div className="space-y-4">
        {(report.sections ?? []).map((section, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              {section.heading ?? section.title}
            </h3>
            <div className="prose prose-sm max-w-none text-gray-700 prose-a:text-violet-600 prose-strong:text-gray-800">
              <SectionContent content={section.content} />
            </div>
          </div>
        ))}
      </div>

      {/* Conclusion */}
      {report.conclusion && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Conclusion</h3>
          <div className="prose prose-sm max-w-none text-gray-700">
            <SectionContent content={report.conclusion} />
          </div>
        </div>
      )}

      {/* Limitations */}
      {report.limitations && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Limitations: </span>{report.limitations}
        </div>
      )}

      {/* Citations */}
      {report.citations && report.citations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Sources ({report.citations.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {report.citations.map((c) => (
              <CitationCard key={c.index} citation={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionContent({ content }) {
  if (!content) return null;
  return (
    <ReactMarkdown
      components={{
        p({ children }) {
          return <p className="leading-relaxed mb-2">{injectCitationBadges(children)}</p>;
        },
        li({ children }) {
          return <li className="mb-1">{injectCitationBadges(children)}</li>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function injectCitationBadges(children) {
  if (!children) return children;
  if (typeof children === "string") return parseCitationString(children);
  if (Array.isArray(children)) {
    return children.map((c, i) =>
      typeof c === "string" ? <span key={i}>{parseCitationString(c)}</span> : c
    );
  }
  return children;
}

function parseCitationString(text) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m) {
      return (
        <sup
          key={i}
          className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold mx-0.5 px-1 cursor-default"
        >
          {m[1]}
        </sup>
      );
    }
    return part;
  });
}
