"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Identifying the item",
  "Pulling recent sold prices",
  "Reading current demand",
];

export function ScoutCheckingScreen() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timers = STEPS.map((_, i) => window.setTimeout(() => setActive(i), i * 520));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="px-8 pt-[60px] pb-10 flex flex-col gap-7 items-center text-center">
      <div className="relative w-[84px] h-[84px]">
        <svg viewBox="0 0 84 84" className="absolute inset-0 spin-slow" style={{ animationDuration: "1.1s" }}>
          <circle cx="42" cy="42" r="40" fill="none" stroke="var(--color-app-line)" strokeWidth="2" />
          <circle
            cx="42"
            cy="42"
            r="40"
            fill="none"
            stroke="var(--color-app-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="55 200"
          />
        </svg>
        <div
          className="absolute inset-[18px] rounded-full flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--color-app-accent) 12%, transparent)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="10.5" cy="10.5" r="6.5" stroke="var(--color-app-accent)" strokeWidth="2" />
            <path d="M15.5 15.5L21 21" stroke="var(--color-app-accent)" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 items-center">
        <div className="font-serif text-[30px] text-app-text tracking-tight">
          Sizing up the find…
        </div>
        <div className="text-[13px] text-app-muted h-[18px]" aria-live="polite">
          {STEPS[active]}
        </div>
      </div>
    </div>
  );
}
