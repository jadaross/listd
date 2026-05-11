"use client";

import { useState } from "react";

export function CopyAllButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold ${
        copied ? "bg-app-accent text-white" : "bg-app-subtle text-app-text hover:opacity-80"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="6" y="6" width="13" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 6V4a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h2" stroke="currentColor" strokeWidth="2" />
      </svg>
      {copied ? "Copied all" : "Copy all"}
    </button>
  );
}
