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
import { instructionsFor, type ChipId } from "@/lib/chip-vocab";
import { parseAnalysisResult } from "@/lib/llm/analyse-parse";
import { readStringStream } from "@/lib/streaming-text";

export type EditField = "title" | "body";
export type AddedPhoto = { id: string; applied: boolean };

export type PipelineStatus = "idle" | "analysing" | "ready" | "error";

export interface PipelineState {
  photos: Photo[];
  result: AnalysisResult | null;
  marketInsights: MarketInsights | null;
  formattedListings: FormattedListings;
  loadingFormats: Set<Platform>;
  activePlatform: Platform;
  chips: Set<ChipId>;
  regenerating: boolean;
  editingField: EditField | null;
  addedPhotos: AddedPhoto[];
  status: PipelineStatus;
}

export interface PipelineActions {
  selectPhotos: (photos: Photo[]) => void;
  analyse: () => Promise<void>;
  setActivePlatform: (p: Platform) => void;
  toggleChip: (id: ChipId) => void;
  resetChips: () => void;
  startEdit: (f: EditField) => void;
  cancelEdit: () => void;
  commitEdit: (f: EditField, value: string) => void;
  queuePhoto: (id: string) => void;
  regenWithPhotos: () => void;
  reset: () => void;
}

const DEFAULT_TONE: Tone = "casual";

/**
 * Owns the listing-creation flow: photo selection → analysis → per-platform
 * formatting + market intelligence → chip-driven refinement and field edits.
 *
 * page.tsx is responsible only for screen navigation; every piece of pipeline
 * state lives here.
 */
export function useListingPipeline(): {
  state: PipelineState;
  actions: PipelineActions;
} {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);
  const [formattedListings, setFormattedListings] = useState<FormattedListings>({});
  const [loadingFormats, setLoadingFormats] = useState<Set<Platform>>(new Set());
  const [activePlatform, setActivePlatform] = useState<Platform>("vinted");
  const [chips, setChips] = useState<Set<ChipId>>(new Set());
  const [regenerating, setRegenerating] = useState(false);
  const [editingField, setEditingField] = useState<EditField | null>(null);
  const [addedPhotos, setAddedPhotos] = useState<AddedPhoto[]>([]);
  const [status, setStatus] = useState<PipelineStatus>("idle");

  const formatForPlatform = useCallback(
    async (platform: Platform, listing: AnalysisResult["listing"]) => {
      setLoadingFormats((prev) => new Set([...prev, platform]));
      try {
        const res = await fetch("/api/format", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing, platform, tone: DEFAULT_TONE }),
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
    []
  );

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

  const analyse = useCallback(async () => {
    if (!photos.length) return;
    setStatus("analysing");

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos.map((p) => p.compressed),
          tone: DEFAULT_TONE,
        }),
      });
      if (!res.ok) throw new Error("Analyse failed");

      const buffer = await readStringStream(res);
      const data = parseAnalysisResult(buffer);

      setResult(data);
      setStatus("ready");

      fetchMarket(data.listing);
      (["vinted", "depop", "ebay"] as Platform[]).forEach((p) =>
        formatForPlatform(p, data.listing)
      );
    } catch {
      setStatus("error");
      throw new Error("Analyse failed");
    }
  }, [photos, fetchMarket, formatForPlatform]);

  const onSetActivePlatform = useCallback(
    (p: Platform) => {
      setActivePlatform(p);
      if (result && !formattedListings[p]) formatForPlatform(p, result.listing);
    },
    [result, formattedListings, formatForPlatform]
  );

  const toggleChip = useCallback(
    (id: ChipId) => {
      setChips((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        refineActive(next);
        return next;
      });
    },
    [refineActive]
  );

  const resetChips = useCallback(() => {
    if (chips.size === 0) return;
    setChips(new Set());
    if (result) formatForPlatform(activePlatform, result.listing);
  }, [chips.size, result, activePlatform, formatForPlatform]);

  const commitEdit = useCallback(
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

  const queuePhoto = useCallback((id: string) => {
    setAddedPhotos((prev) =>
      prev.some((p) => p.id === id) ? prev : [...prev, { id, applied: false }]
    );
  }, []);

  const regenWithPhotos = useCallback(() => {
    if (!result) return;
    setRegenerating(true);
    setAddedPhotos((prev) => prev.map((p) => ({ ...p, applied: true })));
    formatForPlatform(activePlatform, result.listing).finally(() =>
      setRegenerating(false)
    );
  }, [result, activePlatform, formatForPlatform]);

  const reset = useCallback(() => {
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
    setStatus("idle");
  }, [photos]);

  return {
    state: {
      photos,
      result,
      marketInsights,
      formattedListings,
      loadingFormats,
      activePlatform,
      chips,
      regenerating,
      editingField,
      addedPhotos,
      status,
    },
    actions: {
      selectPhotos: setPhotos,
      analyse,
      setActivePlatform: onSetActivePlatform,
      toggleChip,
      resetChips,
      startEdit: setEditingField,
      cancelEdit: () => setEditingField(null),
      commitEdit,
      queuePhoto,
      regenWithPhotos,
      reset,
    },
  };
}
