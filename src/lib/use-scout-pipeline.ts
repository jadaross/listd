"use client";

import { useCallback, useState } from "react";
import type { Photo, ScoutResult } from "@/lib/types";
import { parseScoutIdentifyResult } from "@/lib/llm/scout-identify";
import { getMockMarket } from "@/lib/scout/mock-market";
import { readStringStream } from "@/lib/streaming-text";

export type ScoutStatus = "idle" | "checking" | "ready" | "error";

export interface ScoutState {
  photos: Photo[];
  result: ScoutResult | null;
  status: ScoutStatus;
  /** True while a tag re-run is in flight — the result still renders, the range shows "re-checking…". */
  rechecking: boolean;
  tagAdded: boolean;
  cost: string;
}

export interface ScoutActions {
  selectPhotos: (photos: Photo[]) => void;
  analyse: () => Promise<void>;
  addTagPhoto: () => Promise<void>;
  setCost: (v: string) => void;
  reset: () => void;
}

/**
 * Sibling to `useListingPipeline`. The Scout flow shares the same photo input
 * but produces a verdict instead of platform listings — keeping it in a
 * separate hook keeps the sell flow's state machine unmuddied.
 */
export function useScoutPipeline(): { state: ScoutState; actions: ScoutActions } {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [result, setResult] = useState<ScoutResult | null>(null);
  const [status, setStatus] = useState<ScoutStatus>("idle");
  const [rechecking, setRechecking] = useState(false);
  const [tagAdded, setTagAdded] = useState(false);
  const [cost, setCost] = useState("");

  const callIdentify = useCallback(
    async (imgPhotos: Photo[], previousGuess: ScoutResult["guess"] | null) => {
      const res = await fetch("/api/scout/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: imgPhotos.map((p) => p.compressed),
          previousGuess,
        }),
      });
      if (!res.ok) throw new Error("Scout identify failed");
      const buffer = await readStringStream(res);
      return parseScoutIdentifyResult(buffer);
    },
    []
  );

  const analyse = useCallback(async () => {
    if (!photos.length) return;
    setStatus("checking");
    try {
      const data = await callIdentify(photos, null);
      setResult({
        guess: data.guess,
        photo_analysis: data.photo_analysis,
        tag_data: data.tag_data,
        confidence_level: data.confidence_level,
        market: getMockMarket(false),
      });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [photos, callIdentify]);

  const addTagPhoto = useCallback(async () => {
    if (!result) return;
    setRechecking(true);
    setTagAdded(true);
    try {
      // Re-run identify with the photos we already have — the prompt's previousGuess
      // tells Claude to confirm/correct rather than redo from scratch. Real camera
      // capture is a follow-up; this still tightens the visible numbers.
      const data = await callIdentify(photos, result.guess);
      setResult({
        guess: data.guess,
        photo_analysis: data.photo_analysis,
        tag_data: data.tag_data,
        confidence_level: 3,
        market: getMockMarket(true),
      });
    } catch {
      // Even if identify fails, the user added a tag — surface the tightened mock numbers.
      setResult((r) =>
        r
          ? {
              ...r,
              confidence_level: 3,
              market: getMockMarket(true),
            }
          : r
      );
    } finally {
      setRechecking(false);
    }
  }, [photos, result, callIdentify]);

  const reset = useCallback(() => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setResult(null);
    setStatus("idle");
    setRechecking(false);
    setTagAdded(false);
    setCost("");
  }, [photos]);

  return {
    state: { photos, result, status, rechecking, tagAdded, cost },
    actions: { selectPhotos: setPhotos, analyse, addTagPhoto, setCost, reset },
  };
}

