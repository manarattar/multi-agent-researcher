const CONFIDENCE_STYLE = {
  High: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-red-100 text-red-600",
};

export default function CitationCard({ citation }) {
  const { index, url, title, excerpt, confidence, domain } = citation;
  const confStyle = CONFIDENCE_STYLE[confidence] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
          {index}
        </span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${confStyle}`}>
          {confidence}
        </span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block font-medium text-violet-700 hover:underline line-clamp-2"
      >
        {title || url}
      </a>
      {domain && (
        <p className="text-xs text-gray-400 mt-0.5">{domain}</p>
      )}
      {excerpt && (
        <p className="mt-1 text-gray-500 text-xs line-clamp-2">{excerpt}</p>
      )}
    </div>
  );
}
