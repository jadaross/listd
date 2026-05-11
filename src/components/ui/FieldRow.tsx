"use client";

import { useEffect, useState } from "react";

/**
 * Per-field row inside the caption card.
 * Renders an "EDIT" / "COPY" toolbar; on Edit, swaps to an inline input/textarea
 * with Save / Cancel. Port of ios/Listd/Components/Common.swift FieldRow.
 */
export function FieldRow({
  label,
  value,
  multiline = false,
  isEditable = true,
  editing,
  onStartEdit,
  onCommit,
  onCancel,
  children,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  isEditable?: boolean;
  editing: boolean;
  onStartEdit?: () => void;
  onCommit?: (v: string) => void;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState(value);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (editing) setDraft(value);
  }, [editing, value]);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="uppercase text-[10px] font-semibold tracking-[0.1em] text-app-muted">{label}</div>
        <div className="flex gap-1">
          {isEditable && !editing && onStartEdit && (
            <button
              type="button"
              onClick={onStartEdit}
              className="flex items-center gap-1 text-[11px] font-medium text-app-muted px-1.5 py-1 rounded hover:bg-app-subtle"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              Edit
            </button>
          )}
          {!editing && (
            <button
              type="button"
              onClick={copy}
              className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-1 rounded hover:bg-app-subtle ${
                copied ? "text-app-accent" : "text-app-muted"
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
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          {multiline ? (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={7}
              className="w-full font-sans text-[14px] leading-relaxed text-app-text bg-app-bg border-[1.5px] border-app-accent rounded-[10px] px-3 py-2.5 outline-none resize-none"
            />
          ) : (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full font-sans text-[16px] font-semibold text-app-text bg-app-bg border-[1.5px] border-app-accent rounded-[10px] px-3 py-2.5 outline-none"
            />
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg bg-app-subtle text-app-text text-[13px] font-medium hover:opacity-80"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onCommit?.(draft)}
              className="px-3.5 py-1.5 rounded-lg bg-app-accent text-white text-[13px] font-semibold hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
