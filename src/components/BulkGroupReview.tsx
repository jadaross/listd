"use client";

import type { PhotoGroup, Photo } from "@/lib/types";

interface Props {
  groups: PhotoGroup[];
  photos: Photo[];
  onConfirm: () => void;
}

export default function BulkGroupReview({ groups, photos, onConfirm }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          {groups.length} item{groups.length !== 1 ? "s" : ""} detected
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Check the groupings look right before generating listings.
        </p>
      </div>

      <div className="space-y-3">
        {groups.map((group, gi) => (
          <div
            key={gi}
            className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-gray-800 mb-3">
              {group.label}
            </p>
            <div className="flex gap-2 flex-wrap">
              {group.indices.map((idx) => {
                const photo = photos[idx];
                if (!photo) return null;
                return (
                  <div
                    key={idx}
                    className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.previewUrl}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onConfirm}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors text-sm"
      >
        Generate {groups.length} listing{groups.length !== 1 ? "s" : ""} →
      </button>
    </div>
  );
}
