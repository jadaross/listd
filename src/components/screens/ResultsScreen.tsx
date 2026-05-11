"use client";

import type { PlatformListing } from "@/lib/types";
import type {
  PipelineState,
  PipelineActions,
} from "@/lib/use-listing-pipeline";
import {
  platformMetadata as PLATFORM_META,
  PLATFORM_IDS as PLATFORM_ORDER,
} from "@/platforms";
import { FieldRow } from "@/components/ui/FieldRow";
import { FeedbackChips } from "@/components/ui/FeedbackChips";
import { BoostAccuracy } from "@/components/ui/BoostAccuracy";
import { PlatformFields } from "@/components/ui/PlatformFields";
import { Spinner } from "@/components/ui/Spinner";
import { StarIcon } from "@/components/ui/StarIcon";

export function ResultsScreen({
  state,
  actions,
  onSeeRecommendation,
}: {
  state: PipelineState;
  actions: PipelineActions;
  onSeeRecommendation: () => void;
}) {
  const {
    result,
    marketInsights,
    formattedListings,
    loadingFormats,
    activePlatform,
    chips,
    regenerating,
    editingField,
    addedPhotos,
  } = state;

  if (!result) return null;

  const winner = marketInsights?.intelligence?.recommended_platform ?? "ebay";
  const winnerMeta = PLATFORM_META[winner];

  const platformListing: PlatformListing | undefined =
    formattedListings[activePlatform];
  const isLoading = loadingFormats.has(activePlatform) && !platformListing;

  // Only Depop has a real hashtag system — Vinted/eBay return empty arrays.
  const tagsLabel = "Hashtags";
  const comps = marketInsights
    ? marketInsights.ebay.count + marketInsights.vinted.count + marketInsights.depop.count
    : 0;
  const pendingAddCount = addedPhotos.filter((a) => !a.applied).length;

  return (
    <div className="pb-8 flex flex-col gap-3.5 pt-1 relative">
      {/* Platform tabs — segmented control at the top */}
      <div className="px-[22px]">
        <div className="bg-app-subtle/70 rounded-[14px] p-[5px] flex gap-1 border border-app-line">
          {PLATFORM_ORDER.map((p) => {
            const meta = PLATFORM_META[p];
            const active = p === activePlatform;
            const isWinner = p === winner;
            return (
              <button
                key={p}
                type="button"
                onClick={() => actions.setActivePlatform(p)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[14px] font-semibold transition-colors ${
                  active
                    ? "bg-app-card text-app-text shadow-[0_1px_2px_rgba(31,23,20,0.08)]"
                    : "text-app-text/70 hover:text-app-text"
                }`}
              >
                {meta.name}
                {isWinner && <StarIcon size={11} fill={meta.color} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Boost accuracy */}
      <BoostAccuracy
        added={addedPhotos}
        onQueueAdd={actions.queuePhoto}
        pendingCount={pendingAddCount}
        onRegenerate={actions.regenWithPhotos}
      />

      {/* Combined card: title + description + regen chips + hashtags + platform fields + footer */}
      <div className="px-[22px] relative">
        <div
          className={`bg-app-card rounded-[18px] border border-app-line p-[18px] flex flex-col gap-3.5 transition-opacity ${
            regenerating ? "opacity-50" : ""
          }`}
        >
          {isLoading ? (
            <div className="py-10 flex flex-col items-center gap-2 text-app-muted">
              <Spinner />
              <div className="text-[12px]">Formatting for {PLATFORM_META[activePlatform].name}…</div>
            </div>
          ) : platformListing ? (
            <>
              <FieldRow
                label="Title"
                value={platformListing.title}
                editing={editingField === "title"}
                onStartEdit={() => actions.startEdit("title")}
                onCancel={actions.cancelEdit}
                onCommit={(v) => actions.commitEdit("title", v)}
              >
                <div className="text-[16px] font-semibold leading-snug text-app-text">
                  {platformListing.title}
                </div>
              </FieldRow>

              <div className="h-[0.5px] bg-app-line" />

              <FieldRow
                label="Description"
                value={platformListing.description}
                multiline
                editing={editingField === "body"}
                onStartEdit={() => actions.startEdit("body")}
                onCancel={actions.cancelEdit}
                onCommit={(v) => actions.commitEdit("body", v)}
              >
                <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-app-text">
                  {platformListing.description}
                </div>
              </FieldRow>

              {/* Regen chips — kept near description for fast refinement */}
              <FeedbackChips
                applied={chips}
                onToggle={actions.toggleChip}
                onReset={actions.resetChips}
                platform={activePlatform}
                inline
              />

              {platformListing.hashtags.length > 0 && (
                <>
                  <div className="h-[0.5px] bg-app-line" />
                  <FieldRow
                    label={tagsLabel}
                    value={platformListing.hashtags.map((t) => (t.startsWith("#") ? t : "#" + t)).join(" ")}
                    isEditable={false}
                    editing={false}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {platformListing.hashtags.map((tg) => (
                        <span
                          key={tg}
                          className="font-mono text-[12px] text-app-text bg-app-subtle px-2 py-1 rounded"
                        >
                          {tg.startsWith("#") ? tg : "#" + tg}
                        </span>
                      ))}
                    </div>
                  </FieldRow>
                </>
              )}

              {/* Platform-specific fields — now part of the same card */}
              {platformListing.fields && platformListing.fields.length > 0 && (
                <>
                  <div className="h-[0.5px] bg-app-line" />
                  <PlatformFields
                    platformName={PLATFORM_META[activePlatform].name}
                    fields={platformListing.fields}
                    inline
                  />
                </>
              )}
            </>
          ) : (
            <div className="py-6 text-center text-[13px] text-app-muted">No listing yet for this platform.</div>
          )}
        </div>

        {regenerating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-app-card px-3.5 py-2 rounded-full border border-app-line shadow-md text-[12px] text-app-text">
              <Spinner className="text-app-accent" /> Rewriting…
            </div>
          </div>
        )}
      </div>

      {/* Recommendation CTA — moved to bottom */}
      <div className="px-[22px] pt-1">
        <button
          type="button"
          onClick={onSeeRecommendation}
          className="w-full flex items-center justify-between gap-2.5 px-4 py-3.5 rounded-[14px] bg-app-card text-app-text text-left hover:bg-app-card/80"
          style={{ border: `1px solid ${winnerMeta.color}55` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: winnerMeta.color }}
            >
              <StarIcon size={16} fill="white" />
            </div>
            <div>
              <div className="text-[14px] font-semibold">
                Best on <span style={{ color: winnerMeta.color }}>{winnerMeta.name}</span>
              </div>
              <div className="text-[12px] text-app-muted">
                Tap to see why{comps > 0 ? ` · ${comps} comps scanned` : ""}
              </div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M6 3l5 5-5 5" stroke="var(--color-app-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

    </div>
  );
}
