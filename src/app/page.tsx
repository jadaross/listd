"use client";

import { useState, useCallback } from "react";
import PhotoUploader from "@/components/PhotoUploader";
import PhotoFeedback from "@/components/PhotoFeedback";
import ListingOutput from "@/components/ListingOutput";
import MarketInsights from "@/components/MarketInsights";
import type {
  AnalysisResult,
  FormattedListings,
  Photo,
  PhotoAnalysis,
  Platform,
  Tone,
  MarketInsights as MarketInsightsType,
} from "@/lib/types";

type AppStep = "upload" | "loading" | "partial-results" | "results";

function tryParsePhotoAnalysis(buffer: string): PhotoAnalysis | null {
  try {
    const tagDataIdx = buffer.indexOf('"tag_data"');
    if (tagDataIdx === -1) return null;
    const prefix = buffer.slice(0, tagDataIdx).trimEnd().replace(/,\s*$/, "");
    const parsed = JSON.parse(prefix + "}");
    const pa = parsed?.photo_analysis;
    if (!pa || !Array.isArray(pa.scores)) return null;
    return pa as PhotoAnalysis;
  } catch {
    return null;
  }
}

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tone, setTone] = useState<Tone>("casual");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [partialPhotoAnalysis, setPartialPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [marketInsights, setMarketInsights] = useState<MarketInsightsType | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [formattedListings, setFormattedListings] = useState<FormattedListings>({});
  const [loadingFormats, setLoadingFormats] = useState<Set<Platform>>(new Set());
  const [ebayListingUrl, setEbayListingUrl] = useState<string | null>(null);
  const [loadingEbayPost, setLoadingEbayPost] = useState(false);

  const formatListing = useCallback(async (platform: Platform) => {
    if (!result || formattedListings[platform]) return;
    setLoadingFormats((prev) => new Set([...prev, platform]));
    try {
      const res = await fetch("/api/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing: result.listing, platform, tone }),
      });
      if (res.ok) {
        const data = await res.json();
        setFormattedListings((prev) => ({ ...prev, [platform]: data }));
      }
    } catch {
      // silent — user can retry by re-expanding the card
    } finally {
      setLoadingFormats((prev) => {
        const s = new Set(prev);
        s.delete(platform);
        return s;
      });
    }
  }, [result, formattedListings, tone]);

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
        condition: listing.condition,
        price_min: listing.price_min,
        price_max: listing.price_max,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MarketInsightsType | null) => {
        if (data) {
          setMarketInsights(data);
          (["depop", "vinted", "ebay"] as Platform[]).forEach((p) => formatListing(p));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMarket(false));
  }, [formatListing]);

  const postToEbay = useCallback(async () => {
    if (!result) return;
    if (!formattedListings.ebay) {
      await formatListing("ebay");
      return;
    }
    setLoadingEbayPost(true);
    try {
      const res = await fetch("/api/ebay/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing: result.listing, formatted: formattedListings.ebay }),
      });
      const data = await res.json();
      if (data.listingUrl) setEbayListingUrl(data.listingUrl);
    } catch {
      // silent
    } finally {
      setLoadingEbayPost(false);
    }
  }, [result, formattedListings, formatListing]);

  const analyse = useCallback(async () => {
    if (!photos.length) return;
    setStep("loading");
    setError(null);
    setFormattedListings({});
    setEbayListingUrl(null);
    setPartialPhotoAnalysis(null);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos.map((p) => p.compressed),
          tone,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Analysis failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let partialShown = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            buffer += JSON.parse(payload);
          } catch {
            // ignore malformed SSE chunk
          }
        }
        if (!partialShown && buffer.includes('"tag_data"')) {
          const pa = tryParsePhotoAnalysis(buffer);
          if (pa) {
            setPartialPhotoAnalysis(pa);
            setStep("partial-results");
            partialShown = true;
          }
        }
      }

      const jsonMatch = buffer.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse AI response");
      const data: AnalysisResult = JSON.parse(jsonMatch[0]);
      setResult(data);
      setStep("results");
      fetchMarket(data.listing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("upload");
    }
  }, [photos, tone, fetchMarket]);

  // Reset to a clean upload screen, keeping tone preference
  const newItem = useCallback(() => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setResult(null);
    setError(null);
    setMarketInsights(null);
    setLoadingMarket(false);
    setFormattedListings({});
    setEbayListingUrl(null);
    setPartialPhotoAnalysis(null);
    setStep("upload");
  }, [photos]);

  return (
    <main className="min-h-screen bg-[#f8f8f7]">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <header className="mb-8">
          <button
            onClick={newItem}
            className="text-left group"
          >
            <h1 className="text-3xl font-black tracking-tighter text-gray-900 group-hover:opacity-70 transition-opacity">
              listd
            </h1>
          </button>
          <p className="text-gray-500 text-sm mt-1">
            Upload your clothes. Get a perfect listing.
          </p>
        </header>

        {/* Upload step */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Tone selector */}
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

            <PhotoUploader photos={photos} onPhotosChange={setPhotos} maxPx={800} quality={0.8} />

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={analyse}
              disabled={photos.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors text-sm disabled:cursor-not-allowed"
            >
              {photos.length === 0
                ? "Add photos to get started"
                : "Analyse item →"}
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
            <p className="text-gray-500 text-sm">Analysing your photos…</p>
          </div>
        )}

        {/* Partial results step — photo feedback ready, listing still streaming */}
        {step === "partial-results" && partialPhotoAnalysis && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Generating listing…</p>
            </div>
            <PhotoFeedback analysis={partialPhotoAnalysis} />
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
              <div className="h-3 bg-gray-100 rounded w-4/6" />
            </div>
          </div>
        )}

        {/* Results step */}
        {step === "results" && result && (
          <div className="space-y-4">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {photos.length} photo{photos.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={newItem}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                New item
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            <MarketInsights
              data={marketInsights}
              loading={loadingMarket}
              currency="GBP"
            />

            <PhotoFeedback analysis={result.photo_analysis} />

            <ListingOutput
              listing={result.listing}
              tagData={result.tag_data}
              tone={tone}
              currency="GBP"
              formattedListings={formattedListings}
              loadingFormats={loadingFormats}
              recommendedPlatform={marketInsights?.intelligence?.recommended_platform}
              marketInsights={marketInsights}
              onFormatRequest={formatListing}
              onPostToEbay={postToEbay}
              loadingEbayPost={loadingEbayPost}
              ebayListingUrl={ebayListingUrl}
            />
          </div>
        )}
      </div>
    </main>
  );
}
