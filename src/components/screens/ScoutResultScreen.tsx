"use client";

import { useState } from "react";
import type { Photo, ScoutResult } from "@/lib/types";
import { activeGuess, confidenceLabel, deriveScout } from "@/lib/scout/derive";
import { ConfMeter } from "@/components/ui/scout/ConfMeter";
import { CostField } from "@/components/ui/scout/CostField";
import { DemandBars } from "@/components/ui/scout/DemandBars";
import { TagRefine } from "@/components/ui/scout/TagRefine";
import { VerdictHero } from "@/components/ui/scout/VerdictHero";

interface Props {
  result: ScoutResult;
  photos: Photo[];
  cost: string;
  setCost: (v: string) => void;
  tagAdded: boolean;
  checking: boolean;
  onAddTag: () => void;
  onListNow: () => void;
  onScanNext: () => void;
}

export function ScoutResultScreen(props: Props) {
  const { result, photos, cost, setCost, tagAdded, checking, onAddTag, onListNow, onScanNext } = props;
  const d = deriveScout({
    market: result.market,
    cost,
    confidenceLevel: result.confidence_level,
  });
  const accent = "var(--color-app-accent)";
  const conf = confidenceLabel(result.confidence_level);
  const heroPhoto = photos[0]?.previewUrl;

  const [capturing, setCapturing] = useState(false);

  const onAddTagClick = () => {
    setCapturing(true);
    // Brief cosmetic capture overlay — actually triggers the parent's add-tag flow.
    window.setTimeout(() => {
      setCapturing(false);
      onAddTag();
    }, 1300);
  };

  return (
    <div className="relative">
      <div className="px-[22px] pb-10 pt-1 flex flex-col gap-4">
        {/* Item header */}
        <div className="flex gap-3 items-center">
          {heroPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroPhoto}
              alt=""
              className="w-[52px] h-[52px] rounded-xl object-cover flex-shrink-0 bg-app-subtle"
            />
          ) : (
            <div className="w-[52px] h-[52px] rounded-xl bg-app-subtle flex-shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-app-text tracking-tight truncate">
              {result.guess.title}
            </div>
            <div className="text-[12px] text-app-muted truncate">{activeGuess(result)}</div>
          </div>
        </div>

        {/* Verdict hero */}
        <VerdictHero
          verdict={d.verdict}
          range={d.range}
          checking={checking}
          hasCost={d.hasCost}
          profit={d.profit}
        />

        {/* Demand + confidence */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-app-card border border-app-line rounded-2xl p-3.5">
            <div className="flex justify-between items-start">
              <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-app-muted">
                Demand
              </div>
              <DemandBars bars={result.market.weekly_sold} accent={accent} />
            </div>
            <div className="text-[20px] font-bold text-app-text mt-2 tracking-tight">
              {result.market.sold_30d}
            </div>
            <div className="text-[11px] text-app-muted">sold in last 30 days</div>
          </div>
          <div className="bg-app-card border border-app-line rounded-2xl p-3.5">
            <div className="flex justify-between items-start">
              <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-app-muted">
                Confidence
              </div>
              <ConfMeter
                level={result.confidence_level}
                accent={result.confidence_level >= 3 ? "var(--color-verdict-worth)" : accent}
              />
            </div>
            <div className="text-[20px] font-bold text-app-text mt-2 tracking-tight">{conf}</div>
            <div className="text-[11px] text-app-muted">
              {tagAdded ? "tag confirmed model" : "add a tag to raise"}
            </div>
          </div>
        </div>

        {/* Margin calculator */}
        <div className="bg-app-card border border-app-line rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-baseline">
            <div className="text-[13px] font-semibold text-app-text">
              What are they asking?
            </div>
            {d.roi != null && (
              <div
                className="text-[12px] font-semibold"
                style={{
                  color: d.profit >= 10 ? "var(--color-verdict-worth)" : "var(--color-app-muted)",
                }}
              >
                {d.roi}% ROI
              </div>
            )}
          </div>
          <CostField cost={cost} setCost={setCost} />
          {d.hasCost && (
            <div className="flex justify-between items-center text-[12.5px] text-app-muted pt-0.5">
              <span>Profit range after buying</span>
              <span className="text-app-text font-semibold">
                £{Math.round(d.profitLow)}–{Math.round(d.profitHigh)}
              </span>
            </div>
          )}
        </div>

        {/* Tag refine */}
        <TagRefine tagAdded={tagAdded} onAddTag={onAddTagClick} />

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onListNow}
            className="w-full px-4 py-[15px] rounded-[14px] bg-app-accent text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(200,50,26,0.22)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3l2.4 6.8L21 12l-6.6 2.2L12 21l-2.4-6.8L3 12l6.6-2.2L12 3z" fill="#fff" />
            </svg>
            I bought it — write the listing
          </button>
          <button
            type="button"
            onClick={onScanNext}
            className="w-full px-4 py-3.5 rounded-[14px] bg-transparent text-app-text text-[14px] font-semibold border border-app-line flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 8.5C3 7.4 3.9 6.5 5 6.5h2l1.5-2h7L17 6.5h2c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-9z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            Scan the next item
          </button>
        </div>
      </div>

      {capturing && (
        <div
          className="absolute inset-0 z-50 bg-black text-white flex flex-col items-center justify-center gap-[18px] text-center p-6"
          role="status"
        >
          <div className="text-[11px] font-mono tracking-[0.1em] uppercase opacity-60">
            Capturing
          </div>
          <div className="font-serif text-[22px] font-medium">Brand tag</div>
          <div className="w-16 h-16 rounded-full border-[3px] border-white flex items-center justify-center">
            <div className="w-[50px] h-[50px] rounded-full bg-white pulse-soft" />
          </div>
        </div>
      )}
    </div>
  );
}
