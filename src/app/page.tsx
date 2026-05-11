"use client";

import { useCallback, useState } from "react";
import type {
  AnalysisResult,
  FormattedListings,
  MarketInsights,
  Photo,
  Platform,
  PlatformListing,
  Tone,
} from "@/lib/types";
import type { ChipId } from "@/lib/chip-vocab";
import { instructionsFor } from "@/lib/chip-vocab";
import { RootShell } from "@/components/layout/RootShell";
import type { Screen } from "@/components/layout/TabBar";
import { NavHeader } from "@/components/layout/NavHeader";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ConfirmScreen } from "@/components/screens/ConfirmScreen";
import { GeneratingScreen } from "@/components/screens/GeneratingScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";
import { RecommendationScreen } from "@/components/screens/RecommendationScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";

type EditField = "title" | "body";

export default function Page() {
  // ── Navigation
  const [screen, setScreen] = useState<Screen>("home");

  // ── Core flow state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);
  const [formattedListings, setFormattedListings] = useState<FormattedListings>({});
  const [loadingFormats, setLoadingFormats] = useState<Set<Platform>>(new Set());

  // ── Per-platform UI state (matches AppState in iOS)
  const [activePlatform, setActivePlatform] = useState<Platform>("vinted");
  const [chips, setChips] = useState<Set<ChipId>>(new Set());
  const [regenerating, setRegenerating] = useState(false);
  const [editingField, setEditingField] = useState<EditField | null>(null);
  const [addedPhotos, setAddedPhotos] = useState<{ id: string; applied: boolean }[]>([]);

  // ── Misc
  const tone: Tone = "casual";

  // ── Reset to a clean home state
  const newListing = useCallback(() => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setResult(null);
    setMarketInsights(null);
    setFormattedListings({});
    setLoadingFormats(new Set());
    setActivePlatform("vinted");
    setChips(new Set());
    setRegenerating(false);
    setEditingField(null);
    setAddedPhotos([]);
    setScreen("home");
  }, [photos]);

  // ── /api/format — lazy per-platform fetch (cached)
  const formatListing = useCallback(
    async (platform: Platform, listing: AnalysisResult["listing"]) => {
      setLoadingFormats((prev) => new Set([...prev, platform]));
      try {
        const res = await fetch("/api/format", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing, platform, tone }),
        });
        if (res.ok) {
          const data = (await res.json()) as PlatformListing;
          setFormattedListings((prev) => ({ ...prev, [platform]: data }));
        }
      } catch {
        // silent — user can retry by switching tabs
      } finally {
        setLoadingFormats((prev) => {
          const s = new Set(prev);
          s.delete(platform);
          return s;
        });
      }
    },
    [tone]
  );

  // ── /api/market — fetch once after analyse
  const fetchMarket = useCallback((listing: AnalysisResult["listing"]) => {
    if (!listing.brand && !listing.subcategory) return;
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
      .then((data: MarketInsights | null) => {
        if (data) setMarketInsights(data);
      })
      .catch(() => {});
  }, []);

  // ── /api/analyse — kick off generation
  const generate = useCallback(async () => {
    if (!photos.length) return;
    setScreen("generating");

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos.map((p) => p.compressed),
          tone,
        }),
      });

      if (!res.ok) throw new Error("Analyse failed");

      // Stream SSE chunks and accumulate JSON text
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try { buffer += JSON.parse(payload); } catch { /* skip malformed */ }
        }
      }

      const jsonMatch = buffer.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse AI response");
      const data: AnalysisResult = JSON.parse(jsonMatch[0]);

      setResult(data);
      setScreen("results");

      // Kick off market analysis + all three platform formats in parallel
      fetchMarket(data.listing);
      (["vinted", "depop", "ebay"] as Platform[]).forEach((p) => formatListing(p, data.listing));
    } catch {
      setScreen("home");
    }
  }, [photos, tone, fetchMarket, formatListing]);

  // ── /api/refine — chip-driven rewrite of the active platform's listing
  const refineActive = useCallback(
    async (chipIds: Set<ChipId>) => {
      const current = formattedListings[activePlatform];
      if (!current || chipIds.size === 0) return;
      setRegenerating(true);
      try {
        const res = await fetch("/api/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: activePlatform,
            listing: current,
            instructions: instructionsFor(chipIds),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as PlatformListing;
          setFormattedListings((prev) => ({ ...prev, [activePlatform]: data }));
        }
      } catch {
        // silent
      } finally {
        setRegenerating(false);
      }
    },
    [activePlatform, formattedListings]
  );

  // ── Chip toggle: applying refinement clears manual edits (matches iOS)
  const onToggleChip = useCallback((id: ChipId) => {
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      refineActive(next);
      return next;
    });
  }, [refineActive]);

  const onResetChips = useCallback(() => {
    if (chips.size === 0) return;
    setChips(new Set());
    // Re-fetch the un-refined version
    if (result) formatListing(activePlatform, result.listing);
  }, [chips.size, result, activePlatform, formatListing]);

  // ── Field edits: write back into formattedListings for the active platform
  const onCommitEdit = useCallback(
    (field: EditField, value: string) => {
      setFormattedListings((prev) => {
        const current = prev[activePlatform];
        if (!current) return prev;
        return {
          ...prev,
          [activePlatform]: {
            ...current,
            [field === "title" ? "title" : "description"]: value,
          },
        };
      });
      setEditingField(null);
    },
    [activePlatform]
  );

  // ── Boost accuracy: queue a "photo type" the user said they captured; regenerate when triggered
  const queuePhoto = useCallback((id: string) => {
    setAddedPhotos((prev) => (prev.some((p) => p.id === id) ? prev : [...prev, { id, applied: false }]));
  }, []);

  const regenWithPhotos = useCallback(() => {
    // Placeholder — without real new images this just re-formats the existing listing.
    // When wired to the camera flow, append to `photos` then re-call generate().
    if (!result) return;
    setRegenerating(true);
    setAddedPhotos((prev) => prev.map((p) => ({ ...p, applied: true })));
    formatListing(activePlatform, result.listing).finally(() => setRegenerating(false));
  }, [result, activePlatform, formatListing]);

  // ── Header configuration (mirrors iOS RootView)
  const headerCfg: {
    title: string;
    serif?: boolean;
    large?: boolean;
    back?: () => void;
    backLabel?: string;
    rightAction?: React.ReactNode;
  } = (() => {
    switch (screen) {
      case "home":
        return { title: "listd", serif: true, large: true };
      case "confirm":
        return { title: "New listing", back: () => setScreen("home") };
      case "generating":
        return { title: "" };
      case "results":
        return {
          title: "Listings",
          back: () => setScreen("home"),
          rightAction: (
            <button type="button" onClick={newListing} className="text-app-accent text-[15px] font-medium">
              New
            </button>
          ),
        };
      case "recommendation":
        return { title: "Where to post", back: () => setScreen("results"), backLabel: "Listing" };
      case "history":
        return { title: "Your listings", large: true };
      case "settings":
        return { title: "Settings", large: true };
    }
  })();

  const header =
    screen === "generating" ? null : (
      <NavHeader
        title={headerCfg.title}
        serif={headerCfg.serif}
        large={headerCfg.large}
        back={headerCfg.back}
        backLabel={headerCfg.backLabel}
        right={headerCfg.rightAction}
      />
    );

  return (
    <RootShell
      screen={screen}
      onNav={(s) => setScreen(s)}
      hideTabBar={screen === "generating"}
      header={header}
    >
      {screen === "home" && (
        <HomeScreen
          onPhotosSelected={(p) => {
            setPhotos(p);
            setScreen("confirm");
          }}
        />
      )}

      {screen === "confirm" && (
        <ConfirmScreen photos={photos} onGenerate={generate} />
      )}

      {screen === "generating" && <GeneratingScreen />}

      {screen === "results" && result && (
        <ResultsScreen
          result={result}
          marketInsights={marketInsights}
          formattedListings={formattedListings}
          loadingFormats={loadingFormats}
          activePlatform={activePlatform}
          onChangePlatform={(p) => {
            setActivePlatform(p);
            if (!formattedListings[p]) formatListing(p, result.listing);
          }}
          chips={chips}
          onToggleChip={onToggleChip}
          onResetChips={onResetChips}
          regenerating={regenerating}
          editingField={editingField}
          onStartEdit={setEditingField}
          onCancelEdit={() => setEditingField(null)}
          onCommitEdit={onCommitEdit}
          addedPhotos={addedPhotos}
          onQueuePhoto={queuePhoto}
          onRegenWithPhotos={regenWithPhotos}
          onSeeRecommendation={() => setScreen("recommendation")}
          onNewListing={newListing}
        />
      )}

      {screen === "recommendation" && (
        <RecommendationScreen
          insights={marketInsights}
          onBack={() => setScreen("results")}
        />
      )}

      {screen === "history" && <HistoryScreen />}
      {screen === "settings" && <SettingsScreen />}
    </RootShell>
  );
}
