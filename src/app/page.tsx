"use client";

import { useState, useCallback } from "react";
import PhotoUploader from "@/components/PhotoUploader";
import PhotoFeedback from "@/components/PhotoFeedback";
import ListingOutput from "@/components/ListingOutput";
import type { AnalysisResult, Photo, Platform, Tone } from "@/lib/types";

type AppStep = "upload" | "loading" | "results";

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [platform, setPlatform] = useState<Platform>("vinted");
  const [tone, setTone] = useState<Tone>("casual");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(async () => {
    if (!photos.length) return;
    setStep("loading");
    setError(null);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos.map((p) => p.compressed),
          platform,
          tone,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Analysis failed");
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("upload");
    }
  }, [photos, platform, tone]);

  const startOver = useCallback(() => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setResult(null);
    setError(null);
    setStep("upload");
  }, [photos]);

  return (
    <main className="min-h-screen bg-[#f8f8f7]">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">
            listd
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload your clothes. Get a perfect listing.
          </p>
        </header>

        {/* Upload step */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Platform + Tone selectors */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Platform
                </span>
                <div className="flex gap-1.5">
                  {(["vinted", "depop"] as Platform[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        platform === p
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                      }`}
                    >
                      {p === "vinted" ? "Vinted" : "Depop"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Tone
                </span>
                <div className="flex gap-1.5">
                  {(["casual", "professional"] as Tone[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        tone === t
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Upload zone */}
            <PhotoUploader photos={photos} onPhotosChange={setPhotos} />

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={analyse}
              disabled={photos.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors text-sm disabled:cursor-not-allowed"
            >
              {photos.length === 0
                ? "Add photos to get started"
                : `Generate ${platform === "vinted" ? "Vinted" : "Depop"} listing →`}
            </button>

            {photos.length > 0 && (
              <p className="text-xs text-center text-gray-400">
                Tip: include a photo of the care label for better results
              </p>
            )}
          </div>
        )}

        {/* Loading step */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Analysing your photos...</p>
          </div>
        )}

        {/* Results step */}
        {step === "results" && result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={startOver}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Start over
              </button>
              <span className="text-xs text-gray-400">
                {photos.length} photo{photos.length !== 1 ? "s" : ""}
              </span>
            </div>

            <PhotoFeedback analysis={result.photo_analysis} />

            <ListingOutput
              listing={result.listing}
              tagData={result.tag_data}
              platform={platform}
              tone={tone}
              onPlatformChange={(p) => {
                setPlatform(p);
              }}
              onToneChange={(t) => {
                setTone(t);
              }}
              onRegenerate={analyse}
            />
          </div>
        )}
      </div>
    </main>
  );
}
