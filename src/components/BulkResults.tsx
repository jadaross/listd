"use client";

import { useState } from "react";
import ListingOutput from "./ListingOutput";
import PhotoFeedback from "./PhotoFeedback";
import type { BulkItem, Platform, Tone } from "@/lib/types";

interface Props {
  bulkItems: BulkItem[];
  platform: Platform;
  tone: Tone;
  onRegenerateAll: () => void;
}

export default function BulkResults({
  bulkItems,
  platform,
  tone,
  onRegenerateAll,
}: Props) {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const doneCount = bulkItems.filter((item) => !item.loading).length;
  const allDone = doneCount === bulkItems.length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {allDone
              ? `${bulkItems.length} listing${bulkItems.length !== 1 ? "s" : ""} ready`
              : `Generating… ${doneCount} / ${bulkItems.length} done`}
          </p>
        </div>
        {allDone && (
          <button
            onClick={onRegenerateAll}
            className="px-3.5 py-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Regenerate all
          </button>
        )}
      </div>

      {/* Item cards */}
      {bulkItems.map((item, i) => {
        const isOpen = openIndices.has(i);
        return (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Accordion header */}
            <button
              onClick={() => toggle(i)}
              disabled={item.loading}
              className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50 disabled:cursor-default"
            >
              <div className="flex items-center gap-3">
                {item.loading ? (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : item.error ? (
                  <span className="text-red-500 text-xs">✕</span>
                ) : (
                  <span className="text-green-500 text-xs">✓</span>
                )}
                <span className="text-sm font-semibold text-gray-800">
                  {item.group.label}
                </span>
                <span className="text-xs text-gray-400">
                  {item.group.indices.length} photo
                  {item.group.indices.length !== 1 ? "s" : ""}
                </span>
              </div>
              {!item.loading && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </button>

            {/* Accordion body */}
            {isOpen && !item.loading && (
              <div className="border-t border-gray-100 px-4 py-4">
                {item.error ? (
                  <p className="text-sm text-red-500">{item.error}</p>
                ) : item.result ? (
                  <div className="space-y-3">
                    <PhotoFeedback analysis={item.result.photo_analysis} />
                    <ListingOutput
                      listing={item.result.listing}
                      tagData={item.result.tag_data}
                      platform={platform}
                      tone={tone}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
