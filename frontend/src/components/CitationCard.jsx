const CONFIDENCE_TONE = {
  High: "text-ok",
  Medium: "text-warn",
  Low: "text-bad",
};

/** One entry in the reference list at the end of the report. */
export default function CitationCard({ citation }) {
  const { index, url, title, excerpt, confidence, domain } = citation;
  return (
    <li id={`ref-${index}`} className="grid grid-cols-[28px_1fr] gap-x-3 py-3 first:pt-0">
      <span className="num mt-0.5 h-fit text-[12px] font-medium text-accent">[{index}]</span>
      <div className="min-w-0">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="line-clamp-2 break-words text-[15px] font-semibold leading-snug text-accent hover:underline"
        >
          {title || url}
        </a>
        <p className="num mt-0.5 text-[11.5px] text-ink-3">
          {domain}
          {domain && confidence && " · "}
          {confidence && <span className={CONFIDENCE_TONE[confidence]}>{confidence} confidence</span>}
        </p>
        {excerpt && <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">{excerpt}</p>}
      </div>
    </li>
  );
}
