"use client";

export function NavHeader({
  title,
  serif = false,
  large = false,
  back,
  backLabel,
  right,
}: {
  title: string;
  serif?: boolean;
  large?: boolean;
  back?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-[18px] pt-1.5 pb-1 min-h-[40px]">
      <div className="w-[80px] flex items-center">
        {back && (
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-1 text-[16px] font-medium text-app-accent"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden>
              <path d="M8 1L1 8l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {backLabel && <span>{backLabel}</span>}
          </button>
        )}
      </div>
      <div
        className={`${serif ? "font-serif" : "font-sans"} text-app-text ${
          large ? "text-[22px]" : "text-[17px]"
        } ${serif ? "font-normal" : "font-semibold"} tracking-tight`}
      >
        {title}
      </div>
      <div className="w-[80px] flex items-center justify-end">{right}</div>
    </div>
  );
}
