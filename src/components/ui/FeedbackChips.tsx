"use client";

import { CHIPS, type ChipId } from "@/lib/chip-vocab";
import { Eyebrow } from "./Eyebrow";

export function FeedbackChips({
  applied,
  onToggle,
  onReset,
}: {
  applied: Set<ChipId>;
  onToggle: (id: ChipId) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 pt-1.5">
      <div className="flex justify-between items-baseline px-[22px]">
        <Eyebrow>Not quite? Tap to refine</Eyebrow>
        {applied.size > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-[12px] font-medium text-app-accent"
          >
            Reset
          </button>
        )}
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-[22px] py-0.5">
          {CHIPS.map((c) => {
            const active = applied.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onToggle(c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-app-accent text-white border-0"
                    : "bg-app-card text-app-text border border-app-line hover:bg-app-subtle"
                }`}
              >
                {active && (
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                    <path d="M1 5l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
