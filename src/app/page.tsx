"use client";

import { useState, useCallback, useEffect } from "react";
import PhotoUploader from "@/components/PhotoUploader";
import PhotoFeedback from "@/components/PhotoFeedback";
import ListingOutput from "@/components/ListingOutput";
import EbayConnect from "@/components/EbayConnect";
import MarketInsights from "@/components/MarketInsights";
import type {
  AnalysisResult,
  FormattedListings,
  Photo,
  Platform,
  Tone,
  MarketInsights as MarketInsightsType,
} from "@/lib/types";

type AppStep = "upload" | "loading" | "results";

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");
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

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tone, setTone] = useState<Tone>("casual");
  const [result, setResult] = useState<AnalysisResult | null>(null);
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
          if (data.intelligence?.recommended_platform) {
            formatListing(data.intelligence.recommended_platform);
          }
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

      const data: AnalysisResult = await res.json();
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

            <PhotoUploader photos={photos} onPhotosChange={setPhotos} />

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
            />

            <PhotoFeedback analysis={result.photo_analysis} />

            <ListingOutput
              listing={result.listing}
              tagData={result.tag_data}
              tone={tone}
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
