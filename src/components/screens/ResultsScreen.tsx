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
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FieldRow } from "@/components/ui/FieldRow";
import { CopyAllButton } from "@/components/ui/CopyAllButton";
import { FeedbackChips } from "@/components/ui/FeedbackChips";
import { BoostAccuracy } from "@/components/ui/BoostAccuracy";
import { PlatformFields } from "@/components/ui/PlatformFields";
import { Spinner } from "@/components/ui/Spinner";
import { StarIcon } from "@/components/ui/StarIcon";

export function ResultsScreen({
  state,
  actions,
  onSeeRecommendation,
  onNewListing,
}: {
  state: PipelineState;
  actions: PipelineActions;
  onSeeRecommendation: () => void;
  onNewListing: () => void;
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

  const tagsLabel = activePlatform === "depop" ? "Hashtags" : "Keywords";
  const comps = marketInsights
    ? marketInsights.ebay.count + marketInsights.vinted.count + marketInsights.depop.count
    : 0;
  const pendingAddCount = addedPhotos.filter((a) => !a.applied).length;

  return (
    <div className="pb-[110px] flex flex-col gap-3.5 pt-1 relative">
      {/* Item hero strip */}
      <div className="px-[22px] flex gap-3 items-center">
        <div className="w-14 h-14 rounded-xl bg-app-subtle flex-shrink-0 overflow-hidden flex items-center justify-center text-app-muted text-[10px]">
          {result.listing.clothing_type?.[0]?.toUpperCase() ?? "·"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-app-text truncate">
            {result.listing.title || result.listing.clothing_type}
          </div>
          <div className="text-[12px] text-app-muted mt-0.5">
            {result.listing.brand} · Size {result.listing.size || "—"} · {result.listing.condition}
          </div>
        </div>
      </div>

      {/* Recommendation CTA */}
      <div className="px-[22px]">
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

      {/* Platform pills */}
      <div className="px-[22px] flex gap-2">
        {PLATFORM_ORDER.map((p) => {
          const meta = PLATFORM_META[p];
          const active = p === activePlatform;
          const isWinner = p === winner;
          return (
            <button
              key={p}
              type="button"
              onClick={() => actions.setActivePlatform(p)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-1.5 py-2.5 rounded-[11px] text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-app-text text-app-bg"
                  : "bg-app-subtle text-app-text border border-app-line"
              }`}
            >
              {isWinner ? (
                <StarIcon size={11} fill={meta.color} />
              ) : (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: meta.color, opacity: active ? 1 : 0.85 }}
                />
              )}
              {meta.name}
            </button>
          );
        })}
      </div>

      {/* Boost accuracy */}
      <BoostAccuracy
        added={addedPhotos}
        onQueueAdd={actions.queuePhoto}
        pendingCount={pendingAddCount}
        onRegenerate={actions.regenWithPhotos}
      />

      {/* Caption card */}
      <div className="px-[22px] relative">
        <div
          className={`bg-app-card rounded-[18px] border border-app-line p-[18px] flex flex-col gap-3.5 relative overflow-hidden transition-opacity ${
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

              <div className="h-[0.5px] bg-app-line" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-[12px] text-app-muted">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 3l2.4 6.8L21 12l-6.6 2.2L12 21l-2.4-6.8L3 12l6.6-2.2L12 3z" fill="var(--color-app-accent)" />
                  </svg>
                  Generated · ~{Math.max(1, Math.round(platformListing.description.length / 5))} words
                </div>
                <CopyAllButton
                  text={
                    platformListing.title +
                    "\n\n" +
                    platformListing.description +
                    (platformListing.hashtags.length
                      ? "\n\n" + platformListing.hashtags.map((t) => (t.startsWith("#") ? t : "#" + t)).join(" ")
                      : "") +
                    (platformListing.fields && platformListing.fields.length
                      ? "\n\n" + platformListing.fields.map((f) => `${f.label}: ${f.value}`).join("\n")
                      : "")
                  }
                />
              </div>
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

      {/* Platform-specific fields to pick */}
      {platformListing?.fields && platformListing.fields.length > 0 && (
        <PlatformFields
          platformName={PLATFORM_META[activePlatform].name}
          fields={platformListing.fields}
        />
      )}

      {/* Feedback chips */}
      <FeedbackChips
        applied={chips}
        onToggle={actions.toggleChip}
        onReset={actions.resetChips}
        platform={activePlatform}
      />

      {/* Start new listing */}
      <div className="px-[22px] pt-1.5">
        <button
          type="button"
          onClick={onNewListing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-[14px] bg-app-accent text-white text-[14px] font-semibold shadow-[0_6px_18px_rgba(59,92,255,0.2)] hover:opacity-95"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Start a new listing
        </button>
      </div>

      {/* Eyebrow helper for tone */}
      <div className="px-[22px] pt-1">
        <Eyebrow>{result.listing.material || "Material unknown"}</Eyebrow>
      </div>
    </div>
  );
}
