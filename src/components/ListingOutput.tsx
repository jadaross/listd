"use client";

import { useState, useEffect } from "react";
import CopyButton from "./CopyButton";
import type {
  FormattedListings,
  Listing,
  MarketInsights,
  Platform,
  PlatformListing,
  TagData,
  Tone,
} from "@/lib/types";
import { getCategories } from "@/lib/categories";
import type { Gender, MainCategory } from "@/lib/categories";
import { type Currency, fmtPrice, fmtRange } from "@/lib/currency";

interface Props {
  listing: Listing;
  tagData: TagData;
  tone: Tone;
  currency: Currency;
  formattedListings: FormattedListings;
  loadingFormats: Set<Platform>;
  recommendedPlatform?: Platform;
  marketInsights?: MarketInsights | null;
  onFormatRequest: (p: Platform) => void;
  onPostToEbay?: () => void;
  loadingEbayPost?: boolean;
  ebayListingUrl?: string | null;
}

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; badgeBg: string; border: string; bg: string; text: string }
> = {
  depop: {
    label: "Depop",
    badgeBg: "bg-red-600",
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  vinted: {
    label: "Vinted",
    badgeBg: "bg-teal-600",
    border: "border-teal-200",
    bg: "bg-teal-50",
    text: "text-teal-700",
  },
  ebay: {
    label: "eBay",
    badgeBg: "bg-yellow-500",
    border: "border-yellow-200",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
};

const PLATFORM_ORDER: Platform[] = ["depop", "vinted", "ebay"];

function getPlatformPrice(
  platform: Platform,
  listing: Listing,
  insights: MarketInsights | null | undefined,
  currency: Currency
): { display: string; sub: string | null } {
  const intelligence = insights?.intelligence;
  // Recommended platform gets the AI-recommended price
  if (intelligence?.recommended_platform === platform) {
    return {
      display: fmtPrice(intelligence.recommended_price, currency),
      sub: "recommended price",
    };
  }
  // Other platforms get their market median
  const data = insights?.[platform];
  if (data && data.count > 0 && data.median !== null) {
    const label =
      platform === "ebay" && (data.sold_count ?? 0) > 0 && data.sold_median !== null
        ? `${data.sold_count} sold comps`
        : `${data.count} listings`;
    return { display: fmtPrice(data.median, currency), sub: label };
  }
  // Fallback to neutral listing price
  return {
    display: fmtRange(listing.price_min, listing.price_max, currency),
    sub: null,
  };
}

export default function ListingOutput({
  listing,
  tagData,
  tone: _tone,
  currency,
  formattedListings,
  loadingFormats,
  recommendedPlatform,
  marketInsights,
  onFormatRequest,
  onPostToEbay,
  loadingEbayPost,
  ebayListingUrl,
}: Props) {
  // All cards start collapsed; auto-expand recommended when market arrives
  const [expandedPlatform, setExpandedPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    if (recommendedPlatform && expandedPlatform === null) {
      setExpandedPlatform(recommendedPlatform);
      if (!formattedListings[recommendedPlatform] && !loadingFormats.has(recommendedPlatform)) {
        onFormatRequest(recommendedPlatform);
      }
    }
    // only react to recommendedPlatform arriving for the first time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedPlatform]);

  const handleExpand = (platform: Platform) => {
    const isExpanding = expandedPlatform !== platform;
    setExpandedPlatform(isExpanding ? platform : null);
    if (isExpanding && !formattedListings[platform] && !loadingFormats.has(platform)) {
      onFormatRequest(platform);
    }
  };

  const cats =
    listing.gender && listing.main_category
      ? getCategories(listing.gender as Gender, listing.main_category as MainCategory)
      : null;

  const categoryForPlatform: Record<Platform, string | null> = {
    depop: cats?.depop ?? null,
    vinted: cats?.vinted ?? null,
    ebay: cats?.ebay.name ?? null,
  };

  const itemDetails = [
    { label: "Brand", value: listing.brand },
    { label: "Type", value: listing.clothing_type },
    { label: "Condition", value: listing.condition },
    { label: "Size", value: listing.size },
    { label: "Material", value: listing.material },
    {
      label: "Colour",
      value: listing.colour_secondary
        ? `${listing.colour_primary} / ${listing.colour_secondary}`
        : listing.colour_primary,
    },
  ].filter((d) => d.value);

  const hasTagData =
    tagData.rn_number ||
    tagData.fabric_composition ||
    tagData.country_of_manufacture ||
    tagData.care_instructions ||
    tagData.style_number;

  return (
    <div className="space-y-2">
      {PLATFORM_ORDER.map((platform) => (
        <PlatformCard
          key={platform}
          platform={platform}
          formatted={formattedListings[platform]}
          loading={loadingFormats.has(platform)}
          isRecommended={platform === recommendedPlatform}
          isExpanded={expandedPlatform === platform}
          onToggle={() => handleExpand(platform)}
          priceInfo={getPlatformPrice(platform, listing, marketInsights, currency)}
          priceReasoning={listing.price_reasoning}
          category={categoryForPlatform[platform]}
          subcategory={listing.subcategory}
          itemDetails={itemDetails}
          tagData={hasTagData ? tagData : null}
          onPostToEbay={platform === "ebay" ? onPostToEbay : undefined}
          loadingEbayPost={platform === "ebay" ? loadingEbayPost : undefined}
          ebayListingUrl={platform === "ebay" ? ebayListingUrl : undefined}
        />
      ))}
    </div>
  );
}

function PlatformCard({
  platform,
  formatted,
  loading,
  isRecommended,
  isExpanded,
  onToggle,
  priceInfo,
  priceReasoning,
  category,
  subcategory,
  itemDetails,
  tagData,
  onPostToEbay,
  loadingEbayPost,
  ebayListingUrl,
}: {
  platform: Platform;
  formatted: PlatformListing | undefined;
  loading: boolean;
  isRecommended: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  priceInfo: { display: string; sub: string | null };
  priceReasoning: string;
  category: string | null;
  subcategory?: string;
  itemDetails: { label: string; value: string }[];
  tagData: TagData | null;
  onPostToEbay?: () => void;
  loadingEbayPost?: boolean;
  ebayListingUrl?: string | null;
}) {
  const cfg = PLATFORM_CONFIG[platform];

  const hashtagString =
    formatted?.hashtags
      .map((h) => {
        if (platform === "depop") return h.startsWith("#") ? h : `#${h}`;
        return h.replace(/^#/, "");
      })
      .join(" ") ?? "";

  const detailsBlock = itemDetails.map((d) => `${d.label}: ${d.value}`).join("\n");

  const copyAll = formatted
    ? [
        formatted.title,
        "",
        formatted.description,
        formatted.hashtags.length > 0 ? "" : null,
        formatted.hashtags.length > 0 ? hashtagString : null,
        "",
        `Price: ${priceInfo.display}`,
        category ? `Category: ${category}` : null,
        "",
        detailsBlock,
      ]
        .filter((l) => l !== null)
        .join("\n")
    : "";

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all ${
        isRecommended && isExpanded
          ? `${cfg.border} shadow-sm`
          : isRecommended
            ? `${cfg.border}`
            : "border-gray-100"
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
          isExpanded ? (isRecommended ? cfg.bg : "bg-gray-50") : "bg-white hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold text-white ${cfg.badgeBg}`}
          >
            {cfg.label}
          </span>
          {isRecommended && (
            <span className={`text-xs font-semibold ${cfg.text} shrink-0`}>
              ★ Best match
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 ml-3">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900 leading-none">
              {priceInfo.display}
            </p>
            {priceInfo.sub && (
              <p className="text-[10px] text-gray-400 mt-0.5">{priceInfo.sub}</p>
            )}
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-gray-400 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-white">
          {loading && !formatted ? (
            <div className="px-5 py-5 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ) : formatted ? (
            <div className="divide-y divide-gray-50">
              {/* Title */}
              <ExpandedRow
                label="Title"
                copyText={formatted.title}
              >
                <p className="text-sm font-semibold text-gray-900 leading-snug">
                  {formatted.title}
                </p>
              </ExpandedRow>

              {/* Description */}
              <ExpandedRow label="Description" copyText={formatted.description}>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {formatted.description}
                </p>
              </ExpandedRow>

              {/* Hashtags */}
              {formatted.hashtags.length > 0 && (
                <ExpandedRow
                  label={platform === "depop" ? "Hashtags" : "Keywords"}
                  copyText={hashtagString}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {formatted.hashtags.map((tag) => {
                      const display =
                        platform === "depop"
                          ? tag.startsWith("#")
                            ? tag
                            : `#${tag}`
                          : tag.replace(/^#/, "");
                      return (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            platform === "depop"
                              ? "bg-indigo-50 text-indigo-700"
                              : platform === "ebay"
                                ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {display}
                        </span>
                      );
                    })}
                  </div>
                  {platform === "vinted" && (
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      Vinted doesn&apos;t use hashtags — weave these into your title &
                      description for search visibility.
                    </p>
                  )}
                </ExpandedRow>
              )}

              {/* Price */}
              <ExpandedRow label="Price" copyText={priceInfo.display}>
                <p className="text-xl font-bold text-gray-900">{priceInfo.display}</p>
                {priceInfo.sub && (
                  <p className="text-xs text-gray-400 mt-0.5">{priceInfo.sub}</p>
                )}
                {priceReasoning && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {priceReasoning}
                  </p>
                )}
              </ExpandedRow>

              {/* Category */}
              {category && (
                <ExpandedRow label="Category" copyText={category}>
                  <p className="text-sm text-gray-700">{category}</p>
                  {subcategory && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Item type: {subcategory}
                    </p>
                  )}
                </ExpandedRow>
              )}

              {/* Item details */}
              {itemDetails.length > 0 && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Item details
                    </span>
                    <CopyButton text={detailsBlock} label="Copy" />
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                    {itemDetails.map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                          {label}
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag data (only if extracted) */}
              {tagData && (
                <div className="px-5 py-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    From clothing tag
                  </p>
                  <div className="space-y-1.5">
                    {tagData.fabric_composition && (
                      <MiniRow label="Fabric" value={tagData.fabric_composition} />
                    )}
                    {tagData.care_instructions && (
                      <MiniRow label="Care" value={tagData.care_instructions} />
                    )}
                    {tagData.country_of_manufacture && (
                      <MiniRow label="Made in" value={tagData.country_of_manufacture} />
                    )}
                    {tagData.rn_number && (
                      <MiniRow
                        label="RN #"
                        value={`${tagData.rn_number} (vintage dating)`}
                      />
                    )}
                    {tagData.style_number && (
                      <MiniRow label="Style" value={tagData.style_number} />
                    )}
                  </div>
                </div>
              )}

              {/* Actions footer */}
              <div className="px-5 py-4 flex items-center gap-2">
                <CopyButton text={copyAll} label="Copy all" />
                {platform === "ebay" && (
                  <div className="ml-auto">
                    {ebayListingUrl ? (
                      <a
                        href={ebayListingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                      >
                        View on eBay →
                      </a>
                    ) : onPostToEbay ? (
                      <button
                        onClick={onPostToEbay}
                        disabled={loadingEbayPost}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg transition-colors"
                      >
                        {loadingEbayPost ? "Posting…" : "Post to eBay →"}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ExpandedRow({
  label,
  copyText,
  children,
}: {
  label: string;
  copyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <CopyButton text={copyText} />
      </div>
      {children}
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="text-gray-400 w-14 shrink-0">{label}</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  );
}
