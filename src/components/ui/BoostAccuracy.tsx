"use client";

import { useState } from "react";
import { ADVICE_PHOTOS } from "@/lib/mock-data";
import { Eyebrow } from "./Eyebrow";

type AddedPhoto = { id: string; applied: boolean };

export function BoostAccuracy({
  added,
  onQueueAdd,
  pendingCount,
  onRegenerate,
}: {
  added: AddedPhoto[];
  onQueueAdd: (id: string) => void;
  pendingCount: number;
  onRegenerate: () => void;
}) {
  const [sheet, setSheet] = useState<{ id: string; label: string; hint: string } | null>(null);
  const [capturing, setCapturing] = useState<{ source: "camera" | "library"; label: string; id: string } | null>(null);

  const isAdded = (id: string) => added.some((a) => a.id === id);

  const trigger = (source: "camera" | "library") => {
    if (!sheet) return;
    setCapturing({ source, label: sheet.label, id: sheet.id });
    setTimeout(() => {
      onQueueAdd(sheet.id);
      setCapturing(null);
      setSheet(null);
    }, 1300);
  };

  return (
    <>
      <div className="px-[22px] flex flex-col gap-2.5">
        <div className="flex justify-between items-baseline">
          <Eyebrow>Boost accuracy</Eyebrow>
          <div className="text-[11px] text-app-muted">
            {ADVICE_PHOTOS.length - added.length} suggested
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ADVICE_PHOTOS.map((ap) => {
            const done = isAdded(ap.id);
            return (
              <button
                key={ap.id}
                type="button"
                disabled={done}
                onClick={() => !done && setSheet(ap)}
                className={`flex flex-col gap-1.5 items-start text-left px-2.5 py-3 rounded-xl ${
                  done
                    ? "bg-app-subtle border border-app-line cursor-default"
                    : "bg-app-card border border-dashed border-app-line hover:border-app-accent/40"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    done ? "bg-emerald-700" : "bg-app-accent/10"
                  }`}
                >
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M3 8.5l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M8 3v10M3 8h10" stroke="var(--color-app-accent)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div className="text-[12px] font-semibold text-app-text leading-tight">{ap.label}</div>
                <div className="text-[10px] text-app-muted leading-snug">{ap.hint}</div>
              </button>
            );
          })}
        </div>

        {pendingCount > 0 && (
          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[11px] bg-app-accent text-white text-[13px] font-semibold hover:opacity-90"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 8a6 6 0 1 1 1.8 4.3M2 13v-3h3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            Regenerate with new photo{pendingCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Action sheet — Take Photo / Choose from Library */}
      {sheet && !capturing && (
        <div
          className="absolute inset-0 z-30 flex items-end justify-center p-2.5 bg-black/40"
          onClick={() => setSheet(null)}
        >
          <div
            className="w-full max-w-[380px] flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-app-card rounded-[14px] overflow-hidden border border-app-line">
              <div className="px-4 py-3 text-center border-b border-app-line">
                <div className="text-[13px] font-semibold text-app-text">{sheet.label}</div>
                <div className="text-[12px] text-app-muted mt-0.5">{sheet.hint}</div>
              </div>
              <button
                type="button"
                onClick={() => trigger("camera")}
                className="w-full px-4 py-3.5 text-[15px] font-medium text-app-accent border-b border-app-line"
              >
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => trigger("library")}
                className="w-full px-4 py-3.5 text-[15px] font-medium text-app-accent"
              >
                Choose from Library
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSheet(null)}
              className="w-full px-4 py-3.5 rounded-[14px] bg-app-card border border-app-line text-[15px] font-semibold text-app-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Capturing overlay */}
      {capturing && (
        <div
          className={`absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 text-white text-center p-6 ${
            capturing.source === "camera" ? "bg-black" : "bg-black/70"
          }`}
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.1em] opacity-60">
            {capturing.source === "camera" ? "Capturing" : "Uploading"}
          </div>
          <div className="text-[22px] font-serif">{capturing.label}</div>
          {capturing.source === "camera" ? (
            <div className="w-16 h-16 rounded-full border-[3px] border-white flex items-center justify-center">
              <div className="w-[50px] h-[50px] rounded-full bg-white pulse-soft" />
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-full border-[3px] border-white/25 spin-slow"
              style={{ borderTopColor: "white" }}
            />
          )}
        </div>
      )}
    </>
  );
}
