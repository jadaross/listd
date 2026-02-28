"use client";

import { useState, useCallback, useEffect } from "react";
import PhotoUploader from "@/components/PhotoUploader";
import PhotoFeedback from "@/components/PhotoFeedback";
import ListingOutput from "@/components/ListingOutput";
import ModeSelector from "@/components/ModeSelector";
import BulkGroupReview from "@/components/BulkGroupReview";
import BulkResults from "@/components/BulkResults";
import EbayConnect from "@/components/EbayConnect";
import MarketInsights from "@/components/MarketInsights";
import type {
  AnalysisResult,
  Photo,
  Platform,
  Tone,
  Mode,
  PhotoGroup,
  GroupResult,
  BulkItem,
  MarketInsights as MarketInsightsType,
} from "@/lib/types";

type AppStep =
  | "mode-select"
  | "upload"
  | "grouping"
  | "group-review"
  | "loading"
  | "results"
  | "bulk-results";

export default function Home() {
  const [step, setStep] = useState<AppStep>("mode-select");
  const [ebayConnectedToast, setEbayConnectedToast] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ebay") === "connected") {
      setEbayConnectedToast(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("ebay");
      window.history.replaceState({}, "", url.toString());
      const t = setTimeout(() => setEbayConnectedToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, []);
  const [mode, setMode] = useState<Mode>("single");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [platform, setPlatform] = useState<Platform>("vinted");
  const [tone, setTone] = useState<Tone>("casual");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<PhotoGroup[]>([]);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsightsType | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);

  const fetchMarket = useCallback((listing: AnalysisResult["listing"]) => {
    if (!listing.brand && !listing.subcategory) return;
    setLoadingMarket(true);
    setMarketInsights(null);
    fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: listing.brand,
        subcategory: listing.subcategory ?? listing.clothing_type,
        gender: listing.gender ?? "women",
        main_category: listing.main_category ?? "other",
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MarketInsightsType | null) => {
        if (data) setMarketInsights(data);
      })
      .catch(() => {})
      .finally(() => setLoadingMarket(false));
  }, []);

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
      fetchMarket(data.listing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("upload");
    }
  }, [photos, platform, tone, fetchMarket]);

  const groupPhotos = useCallback(async () => {
    if (!photos.length) return;
    setStep("grouping");
    setError(null);

    try {
      const res = await fetch("/api/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: photos.map((p) => p.compressed) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Grouping failed");
      }

      const data: GroupResult = await res.json();
      setGroups(data.groups);
      setStep("group-review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("upload");
    }
  }, [photos]);

  const generateBulk = useCallback(async () => {
    const initialItems: BulkItem[] = groups.map((group) => ({
      group,
      photos: group.indices.map((i) => photos[i]),
      result: null,
      loading: true,
      error: null,
    }));
    setBulkItems(initialItems);
    setStep("bulk-results");

    groups.forEach((group, idx) => {
      const groupPhotos = group.indices.map((i) => photos[i]);
      fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: groupPhotos.map((p) => p.compressed),
          platform,
          tone,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res
              .json()
              .catch(() => ({ error: "Request failed" }));
            throw new Error(err.error ?? "Analysis failed");
          }
          return res.json() as Promise<AnalysisResult>;
        })
        .then((data) => {
          setBulkItems((prev) =>
            prev.map((item, i) =>
              i === idx ? { ...item, result: data, loading: false } : item
            )
          );
        })
        .catch((err) => {
          setBulkItems((prev) =>
            prev.map((item, i) =>
              i === idx
                ? {
                    ...item,
                    error:
                      err instanceof Error ? err.message : "Analysis failed",
                    loading: false,
                  }
                : item
            )
          );
        });
    });
  }, [groups, photos, platform, tone]);

  const startOver = useCallback(() => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setResult(null);
    setError(null);
    setMode("single");
    setGroups([]);
    setBulkItems([]);
    setMarketInsights(null);
    setLoadingMarket(false);
    setStep("mode-select");
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
          <div className="mt-3">
            <EbayConnect />
          </div>
        </header>

        {/* eBay connected toast */}
        {ebayConnectedToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
            eBay account connected!
          </div>
        )}

        {/* Mode select */}
        {step === "mode-select" && (
          <ModeSelector
            onSelect={(m) => {
              setMode(m);
              setStep("upload");
            }}
          />
        )}

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

            {/* Generate / Group button */}
            <button
              onClick={mode === "single" ? analyse : groupPhotos}
              disabled={photos.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors text-sm disabled:cursor-not-allowed"
            >
              {photos.length === 0
                ? "Add photos to get started"
                : mode === "single"
                  ? `Generate ${platform === "vinted" ? "Vinted" : "Depop"} listing →`
                  : `Identify items in ${photos.length} photo${photos.length !== 1 ? "s" : ""} →`}
            </button>

            {photos.length > 0 && mode === "single" && (
              <p className="text-xs text-center text-gray-400">
                Tip: include a photo of the care label for better results
              </p>
            )}
            {mode === "bulk" && (
              <p className="text-xs text-center text-gray-400">
                Upload photos of all your items — we&apos;ll detect and group
                them automatically
              </p>
            )}
          </div>
        )}

        {/* Grouping step */}
        {(step === "loading" || step === "grouping") && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">
              {step === "grouping"
                ? "Identifying items in your photos…"
                : "Analysing your photos…"}
            </p>
          </div>
        )}

        {/* Group review step */}
        {step === "group-review" && (
          <div className="space-y-4">
            <button
              onClick={() => setStep("upload")}
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
              Back
            </button>
            <BulkGroupReview
              groups={groups}
              photos={photos}
              onConfirm={generateBulk}
            />
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

            <MarketInsights data={marketInsights} loading={loadingMarket} />
          </div>
        )}

        {/* Bulk results step */}
        {step === "bulk-results" && (
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
            </div>

            <BulkResults
              bulkItems={bulkItems}
              platform={platform}
              tone={tone}
              onRegenerateAll={generateBulk}
            />
          </div>
        )}
      </div>
    </main>
  );
}
