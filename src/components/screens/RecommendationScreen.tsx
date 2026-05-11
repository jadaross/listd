"use client";

import { useState } from "react";
import type { MarketInsights, Platform } from "@/lib/types";
import { PLATFORM_META, PLATFORM_ORDER, netPrice } from "@/lib/platforms";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StarIcon } from "@/components/ui/StarIcon";
import { StatBlock } from "@/components/ui/StatBlock";

export function RecommendationScreen({
  insights,
  onBack,
}: {
  insights: MarketInsights | null;
  onBack: () => void;
}) {
  const intel = insights?.intelligence;
  const winner: Platform = intel?.recommended_platform ?? "ebay";
  const recommendedPrice = intel?.recommended_price ?? 0;

  // Rank platforms by net (after fees) so non-winners still get sensible ordering
  const ranked = [...PLATFORM_ORDER].sort(
    (a, b) =>
      netPrice(priceFor(insights, b, recommendedPrice), b) -
      netPrice(priceFor(insights, a, recommendedPrice), a)
  );

  const [selectedID, setSelectedID] = useState<Platform>(winner);
  const selected = selectedID;
  const isWinner = selected === winner;
  const selectedMeta = PLATFORM_META[selected];
  const alternatives = ranked.filter((p) => p !== selected);
  const reasoning = intel?.per_platform?.[selected];

  const selectedListPrice = priceFor(insights, selected, recommendedPrice);
  const selectedNet = netPrice(selectedListPrice, selected);

  return (
    <div className="px-[22px] pt-1 pb-[110px] flex flex-col gap-4">
      {/* Back pill */}
      <button
        type="button"
        onClick={onBack}
        className="self-start flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-app-subtle text-app-text text-[13px] font-medium border border-app-line"
      >
        <svg width="9" height="14" viewBox="0 0 10 16" fill="none" aria-hidden>
          <path d="M8 1L1 8l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to listing
      </button>

      {/* Headline */}
      <div className="flex flex-col gap-1">
        <Eyebrow mono>
          {insights ? `Based on ${insights.ebay.count + insights.vinted.count + insights.depop.count} live listings` : "Market analysis"}
        </Eyebrow>
        <div className="font-serif text-[38px] leading-[1.05] text-app-text">
          {isWinner ? (
            <>Post on <span style={{ color: selectedMeta.color }}>{selectedMeta.name}</span>.</>
          ) : (
            <>How <span style={{ color: selectedMeta.color }}>{selectedMeta.name}</span> compares.</>
          )}
        </div>
        {reasoning?.platform_reasoning && (
          <div className="text-[14px] text-app-muted leading-snug max-w-[320px]">
            {reasoning.platform_reasoning}
          </div>
        )}
      </div>

      {/* Hero payout card */}
      <div
        className="rounded-[22px] p-[22px] relative overflow-hidden text-white transition-colors"
        style={{ background: selectedMeta.color, boxShadow: `0 16px 40px ${selectedMeta.color}33` }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex justify-between items-start">
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] opacity-85">
              {isWinner ? "Best estimated payout" : "Estimated payout"}
            </div>
            {isWinner && (
              <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.06em] uppercase">
                <StarIcon size={9} fill="white" />
                Best
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <div className="text-[48px] font-bold tracking-tight">£{Math.round(selectedNet)}</div>
            <div className="text-[14px] opacity-80">after {selectedMeta.feeLabel} fees</div>
          </div>
          <div className="h-px bg-white/20 my-3.5" />
          <div className="grid grid-cols-2 gap-3.5">
            <StatBlock label="List price"   value={`£${Math.round(selectedListPrice)}`}            dark />
            <StatBlock label="Sell-through" value={sellThrough(insights, selected) ?? "—"}        dark />
            <StatBlock label="Median time"  value={reasoning?.estimated_sell_time || "—"}          dark />
            <StatBlock label="Views/wk"     value={reasoning?.estimated_views_per_week || "—"}     dark />
          </div>
        </div>
      </div>

      {/* Trade-off caveat */}
      {!isWinner && reasoning?.trade_off && (
        <div className="bg-app-subtle rounded-xl px-3.5 py-3 border border-app-line flex gap-2.5 items-start">
          <div className="w-[18px] h-[18px] rounded-full bg-app-muted/20 text-app-muted flex items-center justify-center flex-shrink-0 text-[11px] font-bold">!</div>
          <div className="flex-1 text-[12px] leading-snug">
            <span className="font-semibold text-app-text">Trade-off: </span>
            <span className="text-app-muted">{reasoning.trade_off}</span>
          </div>
        </div>
      )}

      {/* Compare alternatives */}
      <Eyebrow className="mt-0.5">Compare alternatives</Eyebrow>
      <div className="flex flex-col gap-2.5">
        {alternatives.map((p) => {
          const meta = PLATFORM_META[p];
          const list = priceFor(insights, p, recommendedPrice);
          const net = netPrice(list, p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedID(p)}
              className="w-full bg-app-card rounded-[14px] px-4 py-3.5 border border-app-line text-left flex items-center gap-3.5 hover:bg-app-card/90"
            >
              <div className="w-2 h-[38px] rounded" style={{ background: meta.color }} />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-semibold text-app-text">{meta.name}</span>
                  {p === winner && <StarIcon size={11} fill={meta.color} />}
                </div>
                <div className="text-[12px] text-app-muted">{meta.audience}</div>
              </div>
              <div className="text-right">
                <div className="text-[16px] font-semibold text-app-text">£{Math.round(net)}</div>
                <div className="text-[11px] text-app-muted flex items-center justify-end gap-1">
                  {sellThrough(insights, p) ?? "—"} sells
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Open in app */}
      <a
        href={selectedMeta.webUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-[14px] text-white text-[15px] font-semibold mt-1"
        style={{ background: selectedMeta.color, boxShadow: `0 8px 20px ${selectedMeta.color}44` }}
      >
        Open {selectedMeta.name}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M5 3h8v8M13 3L4 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
}

function priceFor(insights: MarketInsights | null, platform: Platform, fallback: number): number {
  const median = insights?.[platform]?.median;
  return typeof median === "number" && median > 0 ? median : fallback;
}

function sellThrough(insights: MarketInsights | null, platform: Platform): string | null {
  if (!insights) return null;
  const p = insights[platform];
  if (!p.sold_count || !p.count) return null;
  const total = p.sold_count + p.count;
  if (!total) return null;
  return `${Math.round((p.sold_count / total) * 100)}%`;
}
