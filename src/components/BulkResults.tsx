"use client";

import { useState } from "react";
import CopyButton from "./CopyButton";
import PhotoFeedback from "./PhotoFeedback";
import type { BulkItem, Listing, Platform, TagData, Tone } from "@/lib/types";

interface Props {
  bulkItems: BulkItem[];
  platform: Platform;
  tone: Tone;
  onRegenerateAll: () => void;
}

export default function BulkResults({
  bulkItems,
  platform,
  tone: _tone,
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
                    <BulkListingOutput
                      listing={item.result.listing}
                      tagData={item.result.tag_data}
                      platform={platform}
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

function BulkListingOutput({
  listing,
  tagData: _tagData,
  platform,
}: {
  listing: Listing;
  tagData: TagData;
  platform: Platform;
}) {
  const hashtagString = listing.hashtags
    .map((h) => {
      if (platform === "depop") return h.startsWith("#") ? h : `#${h}`;
      return h.replace(/^#/, "");
    })
    .join(" ");

  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Title</p>
          <CopyButton text={listing.title} />
        </div>
        <p className="text-gray-900 font-semibold text-sm leading-snug">{listing.title}</p>
      </div>

      {/* Description */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Description</p>
          <CopyButton text={listing.description} />
        </div>
        <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">{listing.description}</p>
      </div>

      {/* Price */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Price</p>
        <p className="text-lg font-bold text-gray-900">£{listing.price_min} – £{listing.price_max}</p>
        {listing.price_reasoning && (
          <p className="text-xs text-gray-400 mt-1">{listing.price_reasoning}</p>
        )}
      </div>

      {/* Hashtags */}
      {listing.hashtags.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {platform === "depop" ? "Hashtags" : "Keywords"}
            </p>
            <CopyButton text={hashtagString} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {listing.hashtags.map((tag) => {
              const display =
                platform === "depop"
                  ? tag.startsWith("#") ? tag : `#${tag}`
                  : tag.replace(/^#/, "");
              return (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
                >
                  {display}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
