"use client";

import { useRef } from "react";
import type { AppMode, Photo } from "@/lib/types";
import { compressImage } from "@/lib/compress";
import { BloomMark } from "@/components/brand/BloomMark";
import { Wordmark } from "@/components/brand/Wordmark";

const COPY: Record<AppMode, { tagline: string; primary: string; tip: { strong: string; rest: string } }> = {
  sell: {
    tagline: "Shoot it, list it. Across every platform.",
    primary: "Camera",
    tip: {
      strong: "4+ photos works best. ",
      rest: "Include the brand tag — we’ll auto-detect size, fabric and era.",
    },
  },
  scout: {
    tagline: "Snap a find. Should you buy?",
    primary: "Camera",
    tip: {
      strong: "One photo’s enough. ",
      rest: "Snap a tag too if you can — it sharpens the resale numbers.",
    },
  },
};

export function HomeScreen({
  mode,
  onModeChange,
  onPhotosSelected,
}: {
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  onPhotosSelected: (photos: Photo[]) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const out: Photo[] = [];
    for (let i = 0; i < files.length && i < 8; i++) {
      const file = files[i];
      const compressed = await compressImage(file, 1024, 0.85);
      out.push({
        id: `${Date.now()}-${i}`,
        previewUrl: URL.createObjectURL(file),
        compressed,
      });
    }
    onPhotosSelected(out);
  };

  const copy = COPY[mode];

  return (
    <div className="px-[22px] pt-1 pb-8 flex flex-col gap-[22px]">
      {/* Wordmark */}
      <div className="pt-2 flex flex-col gap-1.5">
        <div className="flex items-end gap-2">
          <BloomMark size={64} style={{ marginBottom: -6 }} />
          <Wordmark size={56} />
        </div>
        <div className="text-[14px] text-app-muted leading-snug max-w-[280px]">{copy.tagline}</div>
      </div>

      {/* Sell / Scout segmented toggle */}
      <ModeToggle mode={mode} onModeChange={onModeChange} />

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Upload card */}
      <div className="bg-app-card rounded-[22px] p-[18px] flex flex-col gap-3.5 border border-app-line shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_30px_rgba(0,0,0,0.04)]">
        <div className="h-[168px] rounded-2xl bg-app-subtle border border-dashed border-app-line flex items-center justify-center overflow-hidden">
          {mode === "scout" ? <ScoutIllo /> : <CameraIllo />}
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-3.5 rounded-2xl bg-app-text text-app-bg text-[15px] font-semibold hover:opacity-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 8.5C3 7.4 3.9 6.5 5 6.5h2l1.5-2h7L17 6.5h2c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-9z" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            {copy.primary}
          </button>
          <button
            type="button"
            onClick={() => libraryRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-3.5 rounded-2xl bg-app-subtle text-app-text text-[15px] font-semibold border border-app-line hover:bg-app-line/30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3.5" y="5.5" width="15" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M3.5 14l4-3.5 4 3 3-2 4 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <circle cx="14" cy="9.5" r="1.3" fill="currentColor" />
            </svg>
            Library
          </button>
        </div>
      </div>

      {/* Tips card */}
      <div className="bg-app-subtle rounded-2xl px-4 py-3.5 flex gap-3 items-start border border-app-line">
        <div className="w-7 h-7 rounded-lg bg-app-accent flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3l2.4 6.8L21 12l-6.6 2.2L12 21l-2.4-6.8L3 12l6.6-2.2L12 3z" fill="white" />
          </svg>
        </div>
        <div className="flex-1 text-[13px] leading-snug">
          <span className="font-semibold text-app-text">{copy.tip.strong}</span>
          <span className="text-app-muted">{copy.tip.rest}</span>
        </div>
      </div>
    </div>
  );
}

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
}) {
  const tabs: { id: AppMode; label: string; sub: string }[] = [
    { id: "sell", label: "Sell", sub: "Write the listing" },
    { id: "scout", label: "Scout", sub: "Worth flipping?" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Mode"
      className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-app-subtle border border-app-line"
    >
      {tabs.map((t) => {
        const active = mode === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onModeChange(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2 rounded-xl transition ${
              active
                ? "bg-app-card text-app-text shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "bg-transparent text-app-muted"
            }`}
          >
            <span className="text-[14px] font-semibold tracking-tight">{t.label}</span>
            <span className="text-[11px] text-app-muted">{t.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

function CameraIllo() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect x="20" y="38" width="80" height="58" rx="10" stroke="var(--color-app-muted)" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M44 38l4-6h24l4 6" stroke="var(--color-app-muted)" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="60" cy="68" r="16" stroke="var(--color-app-muted)" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="60" cy="68" r="9" fill="var(--color-app-accent)" />
      <circle cx="86" cy="50" r="2.5" fill="var(--color-app-muted)" fillOpacity="0.5" />
    </svg>
  );
}

function ScoutIllo() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect
        x="30"
        y="44"
        width="44"
        height="30"
        rx="6"
        transform="rotate(-18 52 59)"
        stroke="var(--color-app-muted)"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      <circle cx="42" cy="52" r="3.2" stroke="var(--color-app-muted)" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="74" cy="64" r="17" stroke="var(--color-app-muted)" strokeOpacity="0.45" strokeWidth="1.5" fill="none" />
      <circle cx="74" cy="64" r="9" fill="var(--color-app-accent)" />
      <path d="M86 76l9 9" stroke="var(--color-app-muted)" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
