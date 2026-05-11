"use client";

import type { Photo } from "@/lib/types";

export function ConfirmScreen({
  photos,
  onGenerate,
}: {
  photos: Photo[];
  onGenerate: () => void;
}) {
  return (
    <div className="px-[22px] pt-1 pb-8 flex flex-col gap-[18px]">
      <div className="text-[24px] font-semibold tracking-tight text-app-text">
        {photos.length} photo{photos.length !== 1 ? "s" : ""} selected
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.slice(0, 6).map((p) => (
          <div
            key={p.id}
            className="aspect-square rounded-xl overflow-hidden bg-app-subtle"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-app-accent text-white text-[16px] font-semibold shadow-[0_8px_20px_rgba(59,92,255,0.2)] hover:opacity-95"
      >
        Generate listings
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
