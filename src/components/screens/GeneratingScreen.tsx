"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Reading photos",
  "Detecting brand & size from tag",
  "Scanning comparable listings",
  "Writing captions for each platform",
];

export function GeneratingScreen() {
  const [activeStep, setStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      window.setTimeout(() => setStep(i), i * 700)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="px-7 pt-10 pb-8 flex flex-col items-center text-center gap-[26px]">
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-[92px] h-[92px]">
          <div className="absolute inset-0 rounded-full border-2 border-app-line" />
          <svg
            viewBox="0 0 92 92"
            className="absolute inset-0 spin-slow"
            style={{ animationDuration: "1.5s" }}
          >
            <circle
              cx="46" cy="46" r="45" fill="none"
              stroke="var(--color-app-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="60 240"
            />
          </svg>
          <div
            className="absolute inset-[18px] rounded-full flex items-center justify-center"
            style={{ background: "rgba(59, 92, 255, 0.12)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3l2.4 6.8L21 12l-6.6 2.2L12 21l-2.4-6.8L3 12l6.6-2.2L12 3z" fill="var(--color-app-accent)" />
            </svg>
          </div>
        </div>
        <div className="font-serif text-[28px] text-app-text mt-2">
          Reading your photos…
        </div>
        <div className="text-[13px] text-app-muted max-w-[260px] leading-snug">
          Usually under 3 seconds. Don&apos;t close the app.
        </div>
      </div>

      <div className="w-full bg-app-card rounded-2xl p-[18px] border border-app-line flex flex-col gap-3.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                i <= activeStep ? "border-app-accent" : "border-app-line"
              } ${i < activeStep ? "bg-app-accent" : "bg-transparent"}`}
            >
              {i < activeStep && (
                <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
                  <path d="M1 5l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </svg>
              )}
              {i === activeStep && (
                <div className="w-1.5 h-1.5 rounded-full bg-app-accent pulse-soft" />
              )}
            </div>
            <div
              className={`text-[14px] ${
                i === activeStep ? "font-semibold" : "font-normal"
              } ${i <= activeStep ? "text-app-text" : "text-app-muted"}`}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
