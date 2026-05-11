"use client";

import { useState } from "react";
import type { ListingField } from "@/lib/types";
import { Eyebrow } from "./Eyebrow";

/**
 * "Fields to pick" card — renders each platform-specific dropdown / input
 * the user will see on the platform's listing form, with a per-row copy
 * button so they can paste the right value into each field.
 */
export function PlatformFields({
  platformName,
  fields,
}: {
  platformName: string;
  fields: ListingField[];
}) {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="px-[22px] flex flex-col gap-2">
      <Eyebrow>Fields to pick on {platformName}</Eyebrow>
      <div className="bg-app-card rounded-2xl border border-app-line overflow-hidden">
        {fields.map((f, i) => (
          <FieldRow key={f.label} field={f} isLast={i === fields.length - 1} />
        ))}
      </div>
    </div>
  );
}

function FieldRow({ field, isLast }: { field: ListingField; isLast: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(field.value).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className={`px-4 py-3 flex items-center justify-between gap-3 ${
        isLast ? "" : "border-b border-app-line"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-app-muted">
          {field.label}
        </div>
        <div className="text-[14px] font-medium text-app-text leading-snug mt-0.5 break-words">
          {field.value}
        </div>
        {field.hint && (
          <div className="text-[11px] text-app-muted leading-snug mt-0.5">{field.hint}</div>
        )}
      </div>
      <button
        type="button"
        onClick={copy}
        className={`flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium flex-shrink-0 ${
          copied ? "text-app-accent" : "text-app-muted hover:bg-app-subtle"
        }`}
      >
        {copied ? (
          <>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="6" y="6" width="13" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M16 6V4a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h2" stroke="currentColor" strokeWidth="2" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}
