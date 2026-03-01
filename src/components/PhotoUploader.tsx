"use client";

import { useRef, useCallback, useState } from "react";
import type { Photo } from "@/lib/types";

interface Props {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPx?: number;
  quality?: number;
}

async function compressImage(file: File, maxPx: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas not supported"));

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = maxPx;
      let { width, height } = img;

      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

export default function PhotoUploader({ photos, onPhotosChange, maxPx = 1024, quality = 0.85 }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      const available = 20 - photos.length;
      const toAdd = imageFiles.slice(0, available);
      if (!toAdd.length) return;

      setIsProcessing(true);
      try {
        const newPhotos: Photo[] = await Promise.all(
          toAdd.map(async (file) => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            previewUrl: URL.createObjectURL(file),
            compressed: await compressImage(file, maxPx, quality),
          }))
        );
        onPhotosChange([...photos, ...newPhotos]);
      } finally {
        setIsProcessing(false);
      }
    },
    [photos, onPhotosChange]
  );

  const removePhoto = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer select-none transition-all duration-200 ${
          isDragging
            ? "border-indigo-400 bg-indigo-50/60"
            : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20"
        }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Processing photos...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6B7280"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-700 text-sm">
                {photos.length === 0
                  ? "Drop photos here, or tap to upload"
                  : "Add more photos"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Include tag photos · up to 20 photos ·{" "}
                {20 - photos.length} remaining
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="relative aspect-square group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover rounded-xl bg-gray-100"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(photo.id);
                }}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Remove photo ${i + 1}`}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="absolute bottom-1.5 left-1.5 w-5 h-5 bg-black/40 rounded-full flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">{i + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />
    </div>
  );
}
