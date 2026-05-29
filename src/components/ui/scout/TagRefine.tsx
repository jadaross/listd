"use client";

export function TagRefine({
  tagAdded,
  onAddTag,
}: {
  tagAdded: boolean;
  onAddTag: () => void;
}) {
  if (tagAdded) {
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
        style={{
          background: "color-mix(in srgb, var(--color-verdict-worth) 12%, transparent)",
          border: "0.5px solid color-mix(in srgb, var(--color-verdict-worth) 40%, transparent)",
        }}
      >
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-verdict-worth)" }}
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8.5l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-[12.5px] text-app-text leading-snug">
          <b className="font-semibold">Tag confirmed.</b>{" "}
          <span className="text-app-muted">Estimate tightened and demand re-checked.</span>
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onAddTag}
      className="flex items-center gap-3 w-full text-left bg-app-card border border-dashed border-app-line rounded-xl px-3.5 py-2.5"
    >
      <div
        className="w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0 text-app-accent"
        style={{ background: "color-mix(in srgb, var(--color-app-accent) 12%, transparent)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 8.5C3 7.4 3.9 6.5 5 6.5h2l1.5-2h7L17 6.5h2c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-9z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-app-text">Found a tag? Add a photo</div>
        <div className="text-[11.5px] text-app-muted leading-tight">
          Confirms the model &amp; era — sharpens this estimate
        </div>
      </div>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M6 3l5 5-5 5"
          stroke="var(--color-app-muted)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
