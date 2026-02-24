"use client";

import type { Mode } from "@/lib/types";

interface Props {
  onSelect: (mode: Mode) => void;
}

export default function ModeSelector({ onSelect }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">How many items are you listing?</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => onSelect("single")}
          className="group relative flex flex-col gap-2 bg-white border border-gray-200 hover:border-indigo-400 rounded-2xl px-5 py-6 text-left shadow-sm transition-all hover:shadow-md"
        >
          <span className="text-2xl">👕</span>
          <span className="text-base font-semibold text-gray-900">
            Single item
          </span>
          <span className="text-sm text-gray-500 leading-snug">
            Upload photos of one item and get a ready-to-paste listing.
          </span>
        </button>

        <button
          onClick={() => onSelect("bulk")}
          className="group relative flex flex-col gap-2 bg-white border border-gray-200 hover:border-indigo-400 rounded-2xl px-5 py-6 text-left shadow-sm transition-all hover:shadow-md"
        >
          <span className="text-2xl">📦</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900">
              Bulk listing
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white rounded-md">
              NEW
            </span>
          </div>
          <span className="text-sm text-gray-500 leading-snug">
            Upload photos of multiple items — we&apos;ll detect, group, and
            list them all at once.
          </span>
        </button>
      </div>
    </div>
  );
}
